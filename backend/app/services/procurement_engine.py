import json
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from ..models import Material, CommonNationalCode, ProcurementOpportunity, ProcurementRecord, Supplier, CPSEOrganization

def generate_procurement_opportunities(db: Session) -> List[ProcurementOpportunity]:
    """
    Analyzes synthetic procurement records across CPSEs.
    Identifies common standardized materials purchased independently by multiple CPSEs.
    Computes aggregated volumes, combined spend, and estimated potential volume discount savings.
    """
    # Clear existing synthetic opportunities to regenerate fresh
    db.query(ProcurementOpportunity).delete()
    db.commit()

    # Find CNMCs with multiple CPSE materials mapped
    cnmcs = db.query(CommonNationalCode).all()
    created_ops: List[ProcurementOpportunity] = []

    for cnmc in cnmcs:
        materials = db.query(Material).filter(Material.cnmc_id == cnmc.id).all()
        if not materials:
            continue
            
        cpse_ids = set(m.cpse_id for m in materials)
        # Check if multiple CPSEs buy this material, or if single CPSE has high volume
        cpse_codes = []
        total_qty = 0.0
        total_spend = 0.0
        
        for m in materials:
            cpse = db.query(CPSEOrganization).filter(CPSEOrganization.id == m.cpse_id).first()
            if cpse and cpse.code not in cpse_codes:
                cpse_codes.append(cpse.code)
            total_qty += (m.annual_quantity or 0.0)
            total_spend += (m.annual_spend or 0.0)
            
        if len(cpse_codes) >= 2 or (len(cpse_codes) >= 1 and total_spend >= 1500000.0):
            # Calculate illustrative volume discount tiers (5% - 12%)
            savings_pct = 7.5 if len(cpse_codes) == 1 else (10.0 if len(cpse_codes) == 2 else 12.5)
            savings_lower = round(total_spend * (savings_pct - 2.0) / 100.0, 2)
            savings_upper = round(total_spend * (savings_pct + 2.0) / 100.0, 2)
            
            title = f"Multi-CPSE Demand Aggregation: {cnmc.standardized_description[:60]}"
            desc = (
                f"Consolidated demand identified across {len(cpse_codes)} CPSEs ({', '.join(cpse_codes)}) "
                f"for proposed common code {cnmc.cnmc_code}. "
                f"Aggregating {total_qty:,.0f} units represents an estimated potential savings of ₹{savings_lower:,.0f} - ₹{savings_upper:,.0f} "
                f"through joint rate contract negotiation. "
                f"[Illustrative demo-data estimate: Based only on synthetic demonstration prices and assumptions]."
            )
            
            op = ProcurementOpportunity(
                cnmc_id=cnmc.id,
                title=title,
                category=cnmc.category,
                participating_cpse_codes_json=json.dumps(cpse_codes),
                total_quantity=total_qty,
                total_spend=total_spend,
                estimated_savings_lower=savings_lower,
                estimated_savings_upper=savings_upper,
                savings_percentage_est=savings_pct,
                status="Identified",
                description=desc
            )
            db.add(op)
            created_ops.append(op)

    db.commit()
    return created_ops
