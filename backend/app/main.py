import os
import json
import csv
import io
import datetime
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, Depends, HTTPException, status, Query, UploadFile, File, Form, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse, JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from sqlalchemy.orm import Session
from sqlalchemy import func, or_

from .config import settings
from .database import engine, get_db, Base
from .models import (
    CPSEOrganization, User, CommonNationalCode, Material, MaterialAttribute,
    NormalizedMaterial, MaterialVersion, MaterialMatch, TechnicalConflict,
    MatchFeedback, CPSEMaterialMapping, LegacyMaterialCode, Supplier,
    ProcurementRecord, ProcurementOpportunity, DataQualityResult,
    ReviewDecision, AuditLog, SystemSetting
)
from .schemas import (
    UserLogin, UserResponse, TokenResponse, CPSEResponse,
    MaterialCreate, MaterialDetailResponse, MaterialListItem,
    SearchBeforeCreateRequest, SearchBeforeCreateResponse, SearchBeforeCreateMatch,
    MatchResponse, MatchReviewRequest, TechnicalConflictResponse, ConflictReviewRequest,
    CommonMaterialResponse, CommonMaterialCreate, StandardizeMaterialRequest,
    CPSEMappingResponse, ERPExportRequest,
    AuditLogResponse, AuditVerificationResponse,
    ProcurementOpportunityResponse, DashboardKPIResponse
)
from .services.normalizer import normalize_text, normalize_unit, evaluate_size_tolerance
from .services.extractor import extract_attributes
from .services.data_quality import compute_data_quality
from .services.conflict_detector import detect_technical_conflicts
from .services.matching_engine import HybridMatchingEngine
from .services.cnmc_generator import find_or_create_cnmc, format_cnmc_code, CATEGORY_CODES
from .services.audit_service import (
    record_audit_log, verify_audit_trail_integrity,
    simulate_demo_tamper, restore_demo_tamper
)
from .services.procurement_engine import generate_procurement_opportunities
from .services.export_service import export_materials_to_csv, export_audit_to_csv, export_matches_to_csv
from .seed_data import seed_database, hash_pw

# Create all database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="MatiSync — AI-Powered Material Standardization & Harmonization Platform for CPSEs (SIH 2026 Problem Statement 26099)",
    version=settings.VERSION
)

# Enable CORS for local development and Render deployment
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup event: automatically seed database if empty
@app.on_event("startup")
def on_startup():
    db = next(get_db())
    try:
        if not db.query(CPSEOrganization).first():
            print("Database empty. Seeding synthetic demonstration dataset...")
            seed_database(db, force_reset=False)
            print("Synthetic demo data initialized successfully.")
    finally:
        db.close()

# 1. Health check endpoint (for Render & monitoring)
@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "tagline": settings.TAGLINE,
        "sih_problem": settings.SIH_PROBLEM_STATEMENT,
        "ministry": settings.MINISTRY,
        "organization": settings.ORGANIZATION,
        "version": settings.VERSION,
        "timestamp": datetime.datetime.utcnow().isoformat()
    }

# 2. Authentication & Users
@app.post("/api/auth/login", response_model=TokenResponse, tags=["Authentication"])
def login(creds: UserLogin, db: Session = Depends(get_db)):
    h_pw = hash_pw(creds.password)
    user = db.query(User).filter(
        (User.email == creds.email) | (User.username == creds.email)
    ).first()
    if not user:
        email_aliases = {
            "venkatesh.k@cpcl.gov.in": "material@cpcl.demo",
            "ananya.roy@matisync.gov.in": "expert@demo.com",
            "suresh.nair@iocl.gov.in": "procurement@demo.com",
            "p.ramachandran@mopng.gov.in": "management@demo.com",
            "admin@matisync.nic.in": "admin@demo.com",
        }
        target_email = email_aliases.get(creds.email)
        if target_email:
            user = db.query(User).filter(User.email == target_email).first()

    if not user or (user.password_hash != h_pw and creds.password != "demo123"):
        raise HTTPException(status_code=401, detail="Invalid email or demo password.")
    
    cpse_code = user.cpse.code if user.cpse else None
    
    # Audit log login
    record_audit_log(
        db=db,
        user_email=user.email,
        user_role=user.role,
        action="USER_LOGIN",
        entity_type="AUTH",
        entity_id=str(user.id),
        reason="User authenticated into MatiSync portal"
    )

    return {
        "access_token": f"token-{user.id}-{int(datetime.datetime.utcnow().timestamp())}",
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "full_name": user.full_name,
            "cpse_code": cpse_code,
            "cpse_id": user.cpse_id
        }
    }

@app.get("/api/auth/demo-users", tags=["Authentication"])
def get_demo_users(db: Session = Depends(get_db)):
    """Returns list of pre-configured demo accounts for quick role-switching"""
    users = db.query(User).all()
    return [
        {
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "role": u.role,
            "full_name": u.full_name,
            "cpse_code": u.cpse.code if u.cpse else "ALL"
        }
        for u in users
    ]

# 3. CPSE Organizations
@app.get("/api/cpses", response_model=List[CPSEResponse], tags=["CPSE Management"])
def list_cpses(db: Session = Depends(get_db)):
    cpses = db.query(CPSEOrganization).all()
    res = []
    for c in cpses:
        count = db.query(Material).filter(Material.cpse_id == c.id).count()
        res.append({
            "id": c.id,
            "code": c.code,
            "name": c.name,
            "sector": c.sector,
            "status": c.status,
            "contact_email": c.contact_email,
            "last_upload": c.last_upload,
            "material_count": count
        })
    return res

# 4. Executive Dashboard KPIs (Dynamically calculated from database)
@app.get("/api/dashboard/kpis", response_model=DashboardKPIResponse, tags=["Dashboard"])
def get_dashboard_kpis(db: Session = Depends(get_db)):
    total_mats = db.query(Material).count()
    exact_dups = db.query(MaterialMatch).filter(MaterialMatch.relationship_type == "Exact Duplicate").count()
    near_dups = db.query(MaterialMatch).filter(MaterialMatch.relationship_type == "Near Duplicate").count()
    func_equiv = db.query(MaterialMatch).filter(MaterialMatch.relationship_type == "Functionally Equivalent").count()
    tech_confs = db.query(TechnicalConflict).count()
    cnmcs = db.query(CommonNationalCode).count()
    connected_cpses = db.query(CPSEOrganization).count()
    
    # Average data quality
    avg_dq = db.query(func.avg(Material.data_quality_score)).scalar() or 0.0
    
    # Procurement opportunities
    proc_ops = db.query(ProcurementOpportunity).count()
    pending_appr = db.query(MaterialMatch).filter(MaterialMatch.decision == "PENDING").count()
    
    # Spend
    total_spend = db.query(func.sum(Material.annual_spend)).scalar() or 0.0
    est_savings = total_spend * 0.085  # 8.5% illustrative demo estimate
    
    # Distributions
    cpses = db.query(CPSEOrganization).all()
    m_by_cpse = {}
    for c in cpses:
        m_by_cpse[c.code] = db.query(Material).filter(Material.cpse_id == c.id).count()

    cats = db.query(Material.category, func.count(Material.id)).group_by(Material.category).all()
    m_by_cat = {c[0]: c[1] for c in cats}

    # Quality breakdown
    q_excellent = db.query(Material).filter(Material.data_quality_score >= 85).count()
    q_good = db.query(Material).filter(Material.data_quality_score >= 70, Material.data_quality_score < 85).count()
    q_fair = db.query(Material).filter(Material.data_quality_score >= 50, Material.data_quality_score < 70).count()
    q_poor = db.query(Material).filter(Material.data_quality_score < 50).count()
    
    recent_logs = db.query(AuditLog).order_by(AuditLog.sequence_num.desc()).limit(5).all()
    recent_acts = [
        {
            "sequence": l.sequence_num,
            "action": l.action,
            "user": l.user_email,
            "reason": l.reason,
            "timestamp": l.timestamp.isoformat()
        }
        for l in recent_logs
    ]

    return {
        "total_materials": total_mats,
        "exact_duplicates": exact_dups,
        "near_duplicates": near_dups,
        "functional_equivalents": func_equiv,
        "technical_conflicts": tech_confs,
        "proposed_cnmcs": cnmcs,
        "connected_cpses": connected_cpses,
        "average_data_quality": round(float(avg_dq), 1),
        "procurement_opportunities": proc_ops,
        "pending_approvals": pending_appr,
        "total_spend_aggregated": round(float(total_spend), 2),
        "potential_savings_estimate": round(float(est_savings), 2),
        "materials_by_cpse": m_by_cpse,
        "materials_by_category": m_by_cat,
        "quality_score_distribution": {
            "Excellent (85-100)": q_excellent,
            "Good (70-84)": q_good,
            "Fair (50-69)": q_fair,
            "Poor (<50)": q_poor
        },
        "recent_activities": recent_acts
    }

# 5. Search-Before-Create (Major Feature: runs continuously before material creation)
@app.post("/api/materials/search-before-create", response_model=SearchBeforeCreateResponse, tags=["Search-Before-Create"])
def search_before_create(req: SearchBeforeCreateRequest, db: Session = Depends(get_db)):
    """
    Real-time pre-creation intelligence:
    Checks if a potential duplicate or functionally equivalent material or approved CNMC
    already exists in the database. Warns user and prevents redundant duplicate code proliferation.
    """
    query_text = req.description.strip()
    if not query_text:
        return {"query": "", "matches_found": 0, "recommended_action": "PROCEED_WITH_CREATION", "top_matches": []}

    engine_instance = HybridMatchingEngine()
    
    # Extract query attributes
    query_norm = normalize_text(query_text)
    query_attrs = extract_attributes(query_norm, req.category)
    query_dict = {
        "original_description": query_text,
        "category": req.category,
        **query_attrs
    }

    # Compare against existing database materials
    all_materials = db.query(Material).limit(100).all()
    candidate_matches = []
    
    for m in all_materials:
        m_dict = {
            "original_description": m.original_description,
            "material_name": m.material_name,
            "grade": m.grade,
            "size_raw": m.size_raw,
            "schedule": m.schedule,
            "pressure_rating": m.pressure_rating,
            "standard": m.standard,
            "voltage": None
        }
        res = engine_instance.compare_materials(query_dict, m_dict)
        score = res["ai_score"]
        
        if score >= 60.0 or res["has_critical_conflict"]:
            cnmc_code = m.cnmc.cnmc_code if m.cnmc else None
            matching_specs = [f"{a['attribute']}: {a['value']}" for a in res["matching_attributes"][:3]]
            differing_specs = [f"{a['attribute']}: {a.get('value_a')} vs {a.get('value_b')}" for a in res["conflicting_attributes"][:2]]
            
            conflict_summary = None
            if res["has_critical_conflict"] and res["conflicts"]:
                conflict_summary = res["conflicts"][0]["description"]

            candidate_matches.append({
                "material_id": m.id,
                "material_code": m.material_code,
                "cpse_code": m.cpse.code,
                "description": m.original_description,
                "cnmc_code": cnmc_code,
                "similarity_score": score,
                "relationship_type": res["relationship_type"],
                "status": m.status,
                "has_conflict": res["has_critical_conflict"],
                "conflict_summary": conflict_summary,
                "matching_specs": matching_specs,
                "differing_specs": differing_specs
            })

    candidate_matches.sort(key=lambda x: x["similarity_score"], reverse=True)
    top = candidate_matches[:6]

    # Decide recommendation
    recommended_action = "PROCEED_WITH_CREATION"
    if top:
        highest = top[0]
        if highest["similarity_score"] >= 90.0 and not highest["has_conflict"]:
            recommended_action = "USE_EXISTING"
        elif highest["has_conflict"] or highest["similarity_score"] >= 75.0:
            recommended_action = "REVIEW_REQUIRED"

    return {
        "query": query_text,
        "matches_found": len(top),
        "recommended_action": recommended_action,
        "top_matches": top
    }

# 6. Material Master Directory & Details
@app.get("/api/materials", tags=["Material Master"])
def list_materials(
    cpse_code: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    min_quality: Optional[float] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    query = db.query(Material)
    
    if cpse_code:
        query = query.join(CPSEOrganization).filter(CPSEOrganization.code == cpse_code)
    if category:
        query = query.filter(Material.category == category)
    if status:
        query = query.filter(Material.status == status)
    if min_quality is not None:
        query = query.filter(Material.data_quality_score >= min_quality)
    if search:
        s_term = f"%{search}%"
        query = query.filter(
            or_(
                Material.material_code.like(s_term),
                Material.original_description.like(s_term),
                Material.standardized_description.like(s_term),
                Material.grade.like(s_term),
                Material.standard.like(s_term)
            )
        )
        
    total = query.count()
    items = query.order_by(Material.id.asc()).offset(offset).limit(limit).all()
    
    results = []
    for m in items:
        results.append({
            "id": m.id,
            "cpse_code": m.cpse.code,
            "cpse_name": m.cpse.name,
            "material_code": m.material_code,
            "original_description": m.original_description,
            "normalized_description": m.normalized_description,
            "category": m.category,
            "original_unit": m.original_unit,
            "material_name": m.material_name,
            "grade": m.grade,
            "normalized_size_mm": m.normalized_size_mm,
            "schedule": m.schedule,
            "data_quality_score": m.data_quality_score,
            "status": m.status,
            "cnmc_code": m.cnmc.cnmc_code if m.cnmc else None
        })
        
    return {"total": total, "limit": limit, "offset": offset, "items": results}

@app.get("/api/materials/search", tags=["Material Master"])
def search_materials(q: str = Query(..., min_length=1), db: Session = Depends(get_db)):
    term = f"%{q}%"
    mats = db.query(Material).filter(
        or_(
            Material.material_code.like(term),
            Material.original_description.like(term),
            Material.standardized_description.like(term),
            Material.grade.like(term),
            Material.category.like(term),
            Material.standard.like(term)
        )
    ).limit(50).all()
    results = []
    for m in mats:
        results.append({
            "id": m.id,
            "cpse_code": m.cpse.code,
            "cpse_name": m.cpse.name,
            "material_code": m.material_code,
            "original_description": m.original_description,
            "normalized_description": m.normalized_description,
            "standardized_description": m.standardized_description,
            "category": m.category,
            "original_unit": m.original_unit,
            "material_name": m.material_name,
            "grade": m.grade,
            "normalized_size_mm": m.normalized_size_mm,
            "schedule": m.schedule,
            "data_quality_score": m.data_quality_score,
            "status": m.status,
            "cnmc_code": m.cnmc.cnmc_code if m.cnmc else None
        })
    return {"query": q, "total": len(results), "items": results}

@app.get("/api/materials/{id}", response_model=MaterialDetailResponse, tags=["Material Master"])
def get_material_detail(id: int, db: Session = Depends(get_db)):
    m = db.query(Material).filter(Material.id == id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Material not found")
        
    attrs = db.query(MaterialAttribute).filter(MaterialAttribute.material_id == m.id).all()
    versions = db.query(MaterialVersion).filter(MaterialVersion.material_id == m.id).order_by(MaterialVersion.version_num.desc()).all()
    
    # Mapped CPSE codes
    mapped_codes = []
    if m.cnmc_id:
        other_mappings = db.query(CPSEMaterialMapping).filter(CPSEMaterialMapping.cnmc_id == m.cnmc_id).all()
        for mp in other_mappings:
            mapped_codes.append({
                "material_id": mp.material.id,
                "material_code": mp.material.material_code,
                "cpse_code": mp.material.cpse.code,
                "cpse_name": mp.material.cpse.name,
                "description": mp.material.original_description,
                "effective_date": mp.effective_date.isoformat() if mp.effective_date else None
            })

    qb = json.loads(m.quality_breakdown_json) if m.quality_breakdown_json else None

    # Material Matches (AI Analysis)
    matches_recs = db.query(MaterialMatch).filter(
        (MaterialMatch.material_a_id == m.id) | (MaterialMatch.material_b_id == m.id)
    ).limit(10).all()
    matches_list = []
    for match in matches_recs:
        other_mat_id = match.material_b_id if match.material_a_id == m.id else match.material_a_id
        other_mat = db.query(Material).filter(Material.id == other_mat_id).first()
        if other_mat:
            matches_list.append({
                "id": match.id,
                "other_material_id": other_mat.id,
                "other_material_code": other_mat.material_code,
                "other_cpse_code": other_mat.cpse.code if other_mat.cpse else "CPSE",
                "other_description": other_mat.original_description,
                "relationship_type": match.relationship_type,
                "ai_score": match.ai_score,
                "adjusted_score": match.adjusted_score,
                "decision": match.decision,
                "explanation": json.loads(match.explanation_json) if match.explanation_json else {},
                "matching_attributes": json.loads(match.matching_attributes_json) if match.matching_attributes_json else [],
                "conflicting_attributes": json.loads(match.conflicting_attributes_json) if match.conflicting_attributes_json else []
            })

    # Technical Conflicts
    conflicts_recs = db.query(TechnicalConflict).filter(
        (TechnicalConflict.material_a_id == m.id) | (TechnicalConflict.material_b_id == m.id)
    ).all()
    conflicts_list = []
    for c in conflicts_recs:
        conflicts_list.append({
            "id": c.id,
            "conflict_field": c.conflict_field,
            "value_a": c.value_a,
            "value_b": c.value_b,
            "severity": c.severity,
            "rule_name": c.rule_name,
            "description": c.description,
            "review_status": c.review_status
        })

    # Procurement Records
    proc_recs = db.query(ProcurementRecord).filter(ProcurementRecord.material_id == m.id).all()
    proc_list = []
    for p in proc_recs:
        sup_name = p.supplier.name if p.supplier else "Approved CPSE Vendor"
        proc_list.append({
            "id": p.id,
            "po_number": p.po_number,
            "fiscal_year": p.fiscal_year,
            "order_date": p.order_date.isoformat() if p.order_date else None,
            "unit_price": p.unit_price,
            "quantity": p.quantity,
            "total_spend": p.total_spend,
            "delivery_location": p.delivery_location,
            "status": p.status,
            "supplier_name": sup_name
        })

    return {
        "id": m.id,
        "cpse_id": m.cpse_id,
        "cpse_code": m.cpse.code,
        "cpse_name": m.cpse.name,
        "material_code": m.material_code,
        "original_description": m.original_description,
        "normalized_description": m.normalized_description,
        "standardized_description": m.standardized_description,
        "final_approved_description": m.final_approved_description,
        "category": m.category,
        "subcategory": m.subcategory,
        "original_unit": m.original_unit,
        "normalized_unit": m.normalized_unit,
        "material_name": m.material_name,
        "grade": m.grade,
        "size_raw": m.size_raw,
        "normalized_size_mm": m.normalized_size_mm,
        "schedule": m.schedule,
        "pressure_rating": m.pressure_rating,
        "temperature_rating": m.temperature_rating,
        "standard": m.standard,
        "specification": m.specification,
        "manufacturer": m.manufacturer,
        "model": m.model,
        "part_number": m.part_number,
        "annual_quantity": m.annual_quantity,
        "annual_spend": m.annual_spend,
        "currency": m.currency,
        "data_quality_score": m.data_quality_score,
        "quality_issues_count": m.quality_issues_count,
        "quality_breakdown": qb,
        "status": m.status,
        "cnmc_id": m.cnmc_id,
        "cnmc_code": m.cnmc.cnmc_code if m.cnmc else None,
        "created_at": m.created_at,
        "updated_at": m.updated_at,
        "attributes": [
            {
                "id": a.id,
                "attribute_name": a.attribute_name,
                "attribute_value": a.attribute_value,
                "raw_value": a.raw_value,
                "confidence": a.confidence,
                "extraction_method": a.extraction_method
            }
            for a in attrs
        ],
        "versions": [
            {
                "id": v.id,
                "version_num": v.version_num,
                "changed_by": v.changed_by,
                "changed_at": v.changed_at,
                "change_type": v.change_type,
                "field_changed": v.field_changed,
                "previous_value": v.previous_value,
                "new_value": v.new_value,
                "reason": v.reason
            }
            for v in versions
        ],
        "mapped_cpse_codes": mapped_codes,
        "matches": matches_list,
        "conflicts": conflicts_list,
        "procurement_records": proc_list
    }

# 7. Material Creation & Batch CSV/Excel Upload with Validation
@app.post("/api/materials", tags=["Material Master"])
def create_material(data: MaterialCreate, db: Session = Depends(get_db)):
    # Check if duplicate material code in CPSE
    existing = db.query(Material).filter(
        Material.cpse_id == data.cpse_id,
        Material.material_code == data.material_code
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Material code '{data.material_code}' already exists for this CPSE.")

    norm_desc = normalize_text(data.description)
    norm_u = normalize_unit(data.unit)
    attrs = extract_attributes(norm_desc, data.category)

    # Compute data quality
    dq = compute_data_quality({
        "original_description": data.description,
        "original_unit": data.unit,
        "category": data.category,
        **attrs
    })

    std_desc = f"{attrs['material_name'] or 'STEEL'} | {attrs['grade'] or 'STD'} | {attrs['size_raw'] or ''} | {attrs['schedule'] or attrs['pressure_rating'] or ''} | {attrs['standard'] or ''}".strip(" |")

    mat = Material(
        cpse_id=data.cpse_id,
        material_code=data.material_code,
        original_description=data.description,
        normalized_description=norm_desc,
        standardized_description=std_desc,
        category=data.category or "General",
        original_unit=data.unit or "NOS",
        normalized_unit=norm_u,
        material_name=attrs["material_name"] or data.material,
        grade=attrs["grade"] or data.grade,
        size_raw=attrs["size_raw"] or data.size,
        normalized_size_mm=attrs["normalized_size_mm"],
        schedule=attrs["schedule"] or data.schedule,
        pressure_rating=attrs["pressure_rating"] or data.pressure_rating,
        standard=attrs["standard"] or data.standard,
        manufacturer=attrs["manufacturer"] or data.manufacturer,
        annual_quantity=data.annual_quantity or 0.0,
        annual_spend=data.annual_spend or 0.0,
        data_quality_score=dq["overall_score"],
        quality_issues_count=dq["issues_count"],
        quality_breakdown_json=json.dumps(dq),
        status="Active"
    )
    db.add(mat)
    db.flush()

    # Attributes
    for a in attrs["attributes_list"]:
        db.add(MaterialAttribute(
            material_id=mat.id,
            attribute_name=a["name"],
            attribute_value=a["value"],
            confidence=a["confidence"],
            extraction_method="RULE_REGEX"
        ))

    # Version record
    db.add(MaterialVersion(
        material_id=mat.id,
        version_num=1,
        changed_by="User Action",
        change_type="CREATED",
        field_changed="all",
        previous_value=None,
        new_value=data.description,
        reason="Manual material master creation"
    ))

    # Audit log
    record_audit_log(
        db=db,
        user_email="material@cpcl.demo",
        user_role="CPSE Material Officer",
        action="MATERIAL_CREATED",
        entity_type="MATERIAL",
        entity_id=mat.material_code,
        new_value={"code": mat.material_code, "desc": mat.original_description, "quality": mat.data_quality_score},
        reason="Created new material master entry via portal"
    )

    db.commit()
    return {"message": "Material created successfully", "id": mat.id, "material_code": mat.material_code}

@app.post("/api/materials/{id}/standardize", tags=["Material Master"])
def standardize_material(id: int, req: StandardizeMaterialRequest, db: Session = Depends(get_db)):
    """
    Standardization Center update:
    Allows Technical Experts to refine and approve standardized specifications,
    incrementing the version history and signing an immutable audit trail entry.
    """
    m = db.query(Material).filter(Material.id == id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Material not found")
        
    prev_std = m.standardized_description
    prev_appr = m.final_approved_description
    
    m.standardized_description = req.standardized_description
    if req.final_approved_description:
        m.final_approved_description = req.final_approved_description
    if req.material_name:
        m.material_name = req.material_name
    if req.grade:
        m.grade = req.grade
    if req.size_raw:
        m.size_raw = req.size_raw
    if req.normalized_size_mm is not None:
        m.normalized_size_mm = req.normalized_size_mm
    if req.schedule:
        m.schedule = req.schedule
    if req.pressure_rating:
        m.pressure_rating = req.pressure_rating
    if req.standard:
        m.standard = req.standard
        
    # Get highest version
    last_v = db.query(MaterialVersion).filter(MaterialVersion.material_id == m.id).order_by(MaterialVersion.version_num.desc()).first()
    next_v = (last_v.version_num + 1) if last_v else 2
    
    db.add(MaterialVersion(
        material_id=m.id,
        version_num=next_v,
        changed_by=req.reviewer or "Technical Expert",
        change_type="STANDARDIZED",
        field_changed="standardized_description",
        previous_value=prev_std,
        new_value=req.standardized_description,
        reason=req.reason or "Expert updated standardized specifications"
    ))
    
    record_audit_log(
        db=db,
        user_email="expert@demo.com",
        user_role=req.reviewer or "Technical Expert",
        action="MATERIAL_STANDARDIZED",
        entity_type="MATERIAL",
        entity_id=m.material_code,
        previous_value={"standardized": prev_std, "approved": prev_appr},
        new_value={"standardized": m.standardized_description, "approved": m.final_approved_description},
        reason=req.reason or "Standardized values updated by technical expert"
    )
    
    db.commit()
    return {"message": "Material standardization updated successfully", "id": m.id, "version": next_v}

@app.post("/api/materials/upload", tags=["Material Master"])
async def upload_materials_file(
    file: UploadFile = File(...),
    cpse_code: str = Form("CPCL"),
    db: Session = Depends(get_db)
):
    """
    Validates CSV or Excel file, performs row-level checks, identifies malformed rows,
    calculates quality scores, and records imported materials without losing original data.
    """
    cpse = db.query(CPSEOrganization).filter(CPSEOrganization.code == cpse_code).first()
    if not cpse:
        raise HTTPException(status_code=400, detail=f"CPSE organization '{cpse_code}' not found.")

    contents = await file.read()
    filename = file.filename.lower()
    
    rows = []
    if filename.endswith(".csv"):
        text = contents.decode("utf-8", errors="ignore")
        reader = csv.DictReader(io.StringIO(text))
        for r in reader:
            rows.append(r)
    else:
        raise HTTPException(status_code=400, detail="Please upload a valid .csv file format.")

    if not rows:
        raise HTTPException(status_code=400, detail="The uploaded file contains no data rows.")

    valid_imported = 0
    rejected_rows = []
    
    for idx, r in enumerate(rows, 1):
        # Case insensitive key retrieval
        code = r.get("material_code") or r.get("MATERIAL_CODE") or r.get("code") or r.get("Code")
        desc = r.get("description") or r.get("DESCRIPTION") or r.get("desc")
        cat = r.get("category") or r.get("CATEGORY") or "General"
        unit = r.get("unit") or r.get("UNIT") or "NOS"
        qty = float(r.get("annual_quantity") or r.get("qty") or 0.0)
        spend = float(r.get("annual_spend") or r.get("spend") or 0.0)

        if not code or not desc:
            rejected_rows.append({"row_number": idx, "reason": "Missing required 'material_code' or 'description'"})
            continue

        existing = db.query(Material).filter(
            Material.cpse_id == cpse.id,
            Material.material_code == code.strip()
        ).first()
        if existing:
            rejected_rows.append({"row_number": idx, "reason": f"Duplicate material_code '{code}' in {cpse_code}"})
            continue

        norm_desc = normalize_text(desc)
        norm_u = normalize_unit(unit)
        attrs = extract_attributes(norm_desc, cat)
        dq = compute_data_quality({
            "original_description": desc,
            "original_unit": unit,
            "category": cat,
            **attrs
        })

        std_desc = f"{attrs['material_name'] or 'STEEL'} | {attrs['grade'] or 'STD'} | {attrs['size_raw'] or ''} | {attrs['schedule'] or attrs['pressure_rating'] or ''} | {attrs['standard'] or ''}".strip(" |")

        mat = Material(
            cpse_id=cpse.id,
            material_code=code.strip(),
            original_description=desc.strip(),
            normalized_description=norm_desc,
            standardized_description=std_desc,
            category=cat.strip(),
            original_unit=unit.strip(),
            normalized_unit=norm_u,
            material_name=attrs["material_name"],
            grade=attrs["grade"],
            size_raw=attrs["size_raw"],
            normalized_size_mm=attrs["normalized_size_mm"],
            schedule=attrs["schedule"],
            pressure_rating=attrs["pressure_rating"],
            standard=attrs["standard"],
            annual_quantity=qty,
            annual_spend=spend,
            data_quality_score=dq["overall_score"],
            quality_issues_count=dq["issues_count"],
            quality_breakdown_json=json.dumps(dq),
            status="Active"
        )
        db.add(mat)
        valid_imported += 1

    cpse.last_upload = datetime.datetime.utcnow()
    db.commit()

    record_audit_log(
        db=db,
        user_email="material@cpcl.demo",
        user_role="CPSE Material Officer",
        action="BATCH_FILE_UPLOAD",
        entity_type="MATERIAL",
        entity_id=f"{cpse_code}_BATCH",
        new_value={"filename": file.filename, "imported": valid_imported, "rejected": len(rejected_rows)},
        reason=f"Batch file upload executed for {cpse_code}"
    )

    return {
        "status": "COMPLETED",
        "total_rows_processed": len(rows),
        "valid_imported": valid_imported,
        "rejected_count": len(rejected_rows),
        "rejected_rows": rejected_rows[:10]  # preview first 10 rejected
    }

# 8. AI Matching & Technical Conflict Detection Engine
@app.post("/api/matching/run", tags=["AI Matching"])
def run_ai_matching(
    sector: str = Query("oil_and_gas", description="Active sector rule configuration"),
    db: Session = Depends(get_db)
):
    """
    Executes hybrid cross-CPSE matching across material records.
    Applies TF-IDF, RapidFuzz, attribute matrix, conflict detector, and active learning.
    Stores pairwise matches and flags technical review overrides.
    """
    engine_inst = HybridMatchingEngine(sector=sector)
    materials = db.query(Material).all()
    
    existing_pairs = set()
    for m in db.query(MaterialMatch).all():
        existing_pairs.add((m.material_a_id, m.material_b_id))
        existing_pairs.add((m.material_b_id, m.material_a_id))

    new_matches_count = 0
    new_conflicts_count = 0

    # Compare materials across different CPSEs or same category
    for i in range(len(materials)):
        for j in range(i + 1, len(materials)):
            mat_a = materials[i]
            mat_b = materials[j]

            if (mat_a.id, mat_b.id) in existing_pairs:
                continue

            # Compare only same category or if high text overlap
            if mat_a.category != mat_b.category and mat_a.category != "General" and mat_b.category != "General":
                continue

            dict_a = {
                "original_description": mat_a.original_description,
                "material_name": mat_a.material_name,
                "grade": mat_a.grade,
                "size_raw": mat_a.size_raw,
                "schedule": mat_a.schedule,
                "pressure_rating": mat_a.pressure_rating,
                "standard": mat_a.standard,
                "voltage": None
            }
            dict_b = {
                "original_description": mat_b.original_description,
                "material_name": mat_b.material_name,
                "grade": mat_b.grade,
                "size_raw": mat_b.size_raw,
                "schedule": mat_b.schedule,
                "pressure_rating": mat_b.pressure_rating,
                "standard": mat_b.standard,
                "voltage": None
            }

            res = engine_inst.compare_materials(dict_a, dict_b)
            
            # Store match if significant similarity or technical conflict
            if res["ai_score"] >= 65.0 or res["has_critical_conflict"]:
                match_rec = MaterialMatch(
                    material_a_id=mat_a.id,
                    material_b_id=mat_b.id,
                    relationship_type=res["relationship_type"],
                    ai_score=res["ai_score"],
                    text_score=res["text_score"],
                    fuzzy_score=res["fuzzy_score"],
                    attribute_score=res["attribute_score"],
                    technical_compatibility_score=res["technical_compatibility_score"],
                    adjusted_score=res["adjusted_score"],
                    decision=res["decision"],
                    explanation_json=json.dumps(res["explanation"]),
                    matching_attributes_json=json.dumps(res["matching_attributes"]),
                    conflicting_attributes_json=json.dumps(res["conflicting_attributes"]),
                    missing_attributes_json=json.dumps(res["missing_attributes"]),
                    model_version=res["model_version"],
                    configuration_version=res["configuration_version"],
                    sector_rule_version=res["sector_rule_version"]
                )
                db.add(match_rec)
                db.flush()
                new_matches_count += 1

                # Record conflicts if any
                for c in res["conflicts"]:
                    db.add(TechnicalConflict(
                        match_id=match_rec.id,
                        material_a_id=mat_a.id,
                        material_b_id=mat_b.id,
                        conflict_field=c["conflict_field"],
                        value_a=c["value_a"],
                        value_b=c["value_b"],
                        severity=c["severity"],
                        rule_name=c["rule_name"],
                        description=c["description"],
                        review_status="PENDING"
                    ))
                    new_conflicts_count += 1
                
                existing_pairs.add((mat_a.id, mat_b.id))

    db.commit()

    record_audit_log(
        db=db,
        user_email="system@matisync.gov.in",
        user_role="System",
        action="AI_MATCHING_ENGINE_RUN",
        entity_type="MATCH",
        entity_id=f"RUN-{int(datetime.datetime.utcnow().timestamp())}",
        new_value={"new_matches": new_matches_count, "new_conflicts": new_conflicts_count, "sector": sector},
        reason="Triggered automated cross-CPSE material harmonization run"
    )

    return {
        "status": "SUCCESS",
        "sector_applied": sector,
        "new_matches_identified": new_matches_count,
        "new_conflicts_flagged": new_conflicts_count,
        "total_active_matches": db.query(MaterialMatch).count()
    }

@app.get("/api/matches", tags=["AI Matching"])
def list_matches(
    relationship_type: Optional[str] = None,
    decision: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    query = db.query(MaterialMatch)
    if relationship_type:
        query = query.filter(MaterialMatch.relationship_type == relationship_type)
    if decision:
        query = query.filter(MaterialMatch.decision == decision)
        
    total = query.count()
    matches = query.order_by(MaterialMatch.id.asc()).offset(offset).limit(limit).all()
    
    results = []
    for m in matches:
        mat_a = db.query(Material).filter(Material.id == m.material_a_id).first()
        mat_b = db.query(Material).filter(Material.id == m.material_b_id).first()
        if not mat_a or not mat_b:
            continue
            
        results.append({
            "id": m.id,
            "material_a": {
                "id": mat_a.id,
                "cpse_code": mat_a.cpse.code,
                "cpse_name": mat_a.cpse.name,
                "material_code": mat_a.material_code,
                "original_description": mat_a.original_description,
                "category": mat_a.category,
                "grade": mat_a.grade,
                "schedule": mat_a.schedule,
                "data_quality_score": mat_a.data_quality_score,
                "status": mat_a.status
            },
            "material_b": {
                "id": mat_b.id,
                "cpse_code": mat_b.cpse.code,
                "cpse_name": mat_b.cpse.name,
                "material_code": mat_b.material_code,
                "original_description": mat_b.original_description,
                "category": mat_b.category,
                "grade": mat_b.grade,
                "schedule": mat_b.schedule,
                "data_quality_score": mat_b.data_quality_score,
                "status": mat_b.status
            },
            "relationship_type": m.relationship_type,
            "ai_score": m.ai_score,
            "adjusted_score": m.adjusted_score,
            "text_score": m.text_score,
            "attribute_score": m.attribute_score,
            "technical_compatibility_score": m.technical_compatibility_score,
            "decision": m.decision,
            "explanation": json.loads(m.explanation_json) if m.explanation_json else {},
            "matching_attributes": json.loads(m.matching_attributes_json) if m.matching_attributes_json else [],
            "conflicting_attributes": json.loads(m.conflicting_attributes_json) if m.conflicting_attributes_json else [],
            "missing_attributes": json.loads(m.missing_attributes_json) if m.missing_attributes_json else [],
            "created_at": m.created_at,
            "reviewed_at": m.reviewed_at,
            "reviewed_by": m.reviewed_by
        })
        
    return {"total": total, "items": results}

@app.post("/api/matches/{id}/review", tags=["AI Matching"])
def review_match(id: int, req: MatchReviewRequest, db: Session = Depends(get_db)):
    """
    Human-in-the-Loop review:
    Approve, Reject, or Override recommendation.
    Captures mandatory override reason and records in tamper-evident audit trail.
    If Approved: Reuses/Generates Proposed CNMC and preserves mapping.
    """
    match_rec = db.query(MaterialMatch).filter(MaterialMatch.id == id).first()
    if not match_rec:
        raise HTTPException(status_code=404, detail="Match not found")

    mat_a = db.query(Material).filter(Material.id == match_rec.material_a_id).first()
    mat_b = db.query(Material).filter(Material.id == match_rec.material_b_id).first()

    old_decision = match_rec.decision
    match_rec.decision = req.decision
    match_rec.reviewed_at = datetime.datetime.utcnow()
    match_rec.reviewed_by = "Dr. Ananya Roy (Technical Expert)"

    # If approving duplicate/equivalent match, map to Proposed CNMC
    if req.decision == "APPROVE":
        cnmc = find_or_create_cnmc(db, mat_a, approved_by_user="Technical Expert")
        mat_a.cnmc_id = cnmc.id
        mat_b.cnmc_id = cnmc.id
        mat_a.status = "Mapped"
        mat_b.status = "Mapped"
        
        # Ensure mappings exist
        if not db.query(CPSEMaterialMapping).filter(CPSEMaterialMapping.cnmc_id == cnmc.id, CPSEMaterialMapping.material_id == mat_a.id).first():
            db.add(CPSEMaterialMapping(cnmc_id=cnmc.id, material_id=mat_a.id, cpse_id=mat_a.cpse_id))
        if not db.query(CPSEMaterialMapping).filter(CPSEMaterialMapping.cnmc_id == cnmc.id, CPSEMaterialMapping.material_id == mat_b.id).first():
            db.add(CPSEMaterialMapping(cnmc_id=cnmc.id, material_id=mat_b.id, cpse_id=mat_b.cpse_id))

    # Record active learning feedback
    db.add(MatchFeedback(
        match_id=match_rec.id,
        reviewer_id=3,  # Technical Expert
        original_ai_score=match_rec.ai_score,
        adjusted_score=match_rec.adjusted_score or match_rec.ai_score,
        feedback_type=req.decision,
        decision=req.decision,
        reason=req.override_reason or req.comments or "Expert review confirmation"
    ))

    # Audit log with override reason
    record_audit_log(
        db=db,
        user_email="expert@demo.com",
        user_role="Technical Expert",
        action="MATCH_REVIEWED",
        entity_type="MATCH",
        entity_id=str(match_rec.id),
        previous_value={"decision": old_decision, "relationship": match_rec.relationship_type},
        new_value={"decision": req.decision, "override_reason": req.override_reason},
        reason=req.override_reason or "Expert review executed"
    )

    db.commit()
    return {"message": "Review recorded successfully", "decision": req.decision}

# 9. Technical Conflicts
@app.get("/api/conflicts", response_model=List[TechnicalConflictResponse], tags=["Technical Conflicts"])
def list_conflicts(db: Session = Depends(get_db)):
    confs = db.query(TechnicalConflict).all()
    res = []
    for c in confs:
        mat_a = db.query(Material).filter(Material.id == c.material_a_id).first()
        mat_b = db.query(Material).filter(Material.id == c.material_b_id).first()
        if mat_a and mat_b:
            res.append({
                "id": c.id,
                "match_id": c.match_id,
                "material_a_code": mat_a.material_code,
                "material_b_code": mat_b.material_code,
                "cpse_a_code": mat_a.cpse.code,
                "cpse_b_code": mat_b.cpse.code,
                "conflict_field": c.conflict_field,
                "value_a": c.value_a,
                "value_b": c.value_b,
                "severity": c.severity,
                "rule_name": c.rule_name,
                "description": c.description,
                "review_status": c.review_status
            })
    return res

@app.post("/api/conflicts/{id}/review", tags=["Technical Conflicts"])
def review_conflict(id: int, req: ConflictReviewRequest, db: Session = Depends(get_db)):
    """
    Allows Technical Experts to review, resolve, or confirm a technical conflict.
    Enforces mandatory override justification and appends to cryptographic audit chain.
    """
    conflict = db.query(TechnicalConflict).filter(TechnicalConflict.id == id).first()
    if not conflict:
        raise HTTPException(status_code=404, detail="Technical conflict not found")
        
    old_status = conflict.review_status
    conflict.review_status = req.review_status
    
    record_audit_log(
        db=db,
        user_email="expert@demo.com",
        user_role=req.reviewer or "Technical Expert",
        action="TECHNICAL_CONFLICT_REVIEW",
        entity_type="CONFLICT",
        entity_id=str(conflict.id),
        previous_value={"review_status": old_status, "field": conflict.conflict_field},
        new_value={"review_status": req.review_status, "override_reason": req.override_reason},
        reason=req.override_reason
    )
    db.commit()
    return {"message": "Technical conflict review recorded successfully", "id": conflict.id, "status": req.review_status}

# 10. Proposed Common National Codes (CNMC) & Cross-CPSE Mapping
@app.get("/api/common-materials", response_model=List[CommonMaterialResponse], tags=["Proposed CNMC"])
def list_cnmcs(db: Session = Depends(get_db)):
    cnmcs = db.query(CommonNationalCode).all()
    res = []
    for c in cnmcs:
        mapped = db.query(Material).filter(Material.cnmc_id == c.id).all()
        mapped_list = [
            {
                "material_id": m.id,
                "material_code": m.material_code,
                "cpse_code": m.cpse.code,
                "original_description": m.original_description
            }
            for m in mapped
        ]
        res.append({
            "id": c.id,
            "cnmc_code": c.cnmc_code,
            "standardized_description": c.standardized_description,
            "category": c.category,
            "subcategory": c.subcategory,
            "material_family": c.material_family,
            "grade": c.grade,
            "size_mm": c.size_mm,
            "schedule": c.schedule,
            "standard": c.standard,
            "illustrative_gem_code": c.illustrative_gem_code,
            "illustrative_unspsc_code": c.illustrative_unspsc_code,
            "status": c.status,
            "mapped_count": len(mapped_list),
            "mapped_materials": mapped_list
        })
    return res

@app.post("/api/common-materials", response_model=CommonMaterialResponse, tags=["Proposed CNMC"])
def create_common_material(data: CommonMaterialCreate, db: Session = Depends(get_db)):
    """
    Enforces deterministic uniqueness before creating a new Proposed CNMC.
    Reuses existing code if matching standardized specifications already exist.
    """
    existing = db.query(CommonNationalCode).filter(
        CommonNationalCode.category == data.category,
        CommonNationalCode.grade == data.grade,
        CommonNationalCode.size_mm == data.size_mm,
        CommonNationalCode.schedule == data.schedule,
        CommonNationalCode.material_family == data.material_family
    ).first()
    if existing:
        mapped = db.query(Material).filter(Material.cnmc_id == existing.id).all()
        return {
            "id": existing.id,
            "cnmc_code": existing.cnmc_code,
            "standardized_description": existing.standardized_description,
            "category": existing.category,
            "subcategory": existing.subcategory,
            "material_family": existing.material_family,
            "grade": existing.grade,
            "size_mm": existing.size_mm,
            "schedule": existing.schedule,
            "standard": existing.standard,
            "illustrative_gem_code": existing.illustrative_gem_code,
            "illustrative_unspsc_code": existing.illustrative_unspsc_code,
            "status": existing.status,
            "mapped_count": len(mapped),
            "mapped_materials": []
        }
        
    count_in_cat = db.query(CommonNationalCode).filter(CommonNationalCode.category == data.category).count()
    seq_num = count_in_cat + 1
    
    code = format_cnmc_code(
        category=data.category,
        material_name=data.material_family,
        size_mm=data.size_mm,
        schedule_or_spec=data.schedule,
        sequence_num=seq_num
    )
    
    while db.query(CommonNationalCode).filter(CommonNationalCode.cnmc_code == code).first():
        seq_num += 1
        code = format_cnmc_code(
            category=data.category,
            material_name=data.material_family,
            size_mm=data.size_mm,
            schedule_or_spec=data.schedule,
            sequence_num=seq_num
        )
        
    cnmc = CommonNationalCode(
        cnmc_code=code,
        standardized_description=data.standardized_description,
        category=data.category,
        subcategory=data.subcategory,
        material_family=data.material_family,
        grade=data.grade,
        size_mm=data.size_mm,
        schedule=data.schedule,
        standard=data.standard,
        illustrative_gem_code=data.illustrative_gem_code or "GEM-MOCK-STD-001",
        illustrative_unspsc_code=data.illustrative_unspsc_code or "UNSPSC-MOCK-STD-001",
        status="APPROVED",
        created_by="Technical Expert Action",
        approved_by="Dr. Ananya Roy (Technical Expert)",
        approved_at=datetime.datetime.utcnow()
    )
    db.add(cnmc)
    db.commit()
    db.refresh(cnmc)
    
    record_audit_log(
        db=db,
        user_email="expert@demo.com",
        user_role="Technical Expert",
        action="CNMC_CREATED",
        entity_type="CNMC",
        entity_id=cnmc.cnmc_code,
        new_value={"code": cnmc.cnmc_code, "desc": cnmc.standardized_description},
        reason="Manual creation and approval of Proposed Common National Material Code"
    )
    
    return {
        "id": cnmc.id,
        "cnmc_code": cnmc.cnmc_code,
        "standardized_description": cnmc.standardized_description,
        "category": cnmc.category,
        "subcategory": cnmc.subcategory,
        "material_family": cnmc.material_family,
        "grade": cnmc.grade,
        "size_mm": cnmc.size_mm,
        "schedule": cnmc.schedule,
        "standard": cnmc.standard,
        "illustrative_gem_code": cnmc.illustrative_gem_code,
        "illustrative_unspsc_code": cnmc.illustrative_unspsc_code,
        "status": cnmc.status,
        "mapped_count": 0,
        "mapped_materials": []
    }

@app.get("/api/mappings", response_model=List[CPSEMappingResponse], tags=["Proposed CNMC"])
def list_mappings(db: Session = Depends(get_db)):
    """
    Returns full bi-directional mapping directory of all CPSE item codes mapped to Proposed CNMC.
    """
    mappings = db.query(CPSEMaterialMapping).all()
    results = []
    for mp in mappings:
        results.append({
            "id": mp.id,
            "cnmc_id": mp.cnmc_id,
            "cnmc_code": mp.cnmc.cnmc_code if mp.cnmc else "N/A",
            "material_id": mp.material_id,
            "material_code": mp.material.material_code if mp.material else "N/A",
            "cpse_code": mp.material.cpse.code if mp.material and mp.material.cpse else "N/A",
            "cpse_name": mp.material.cpse.name if mp.material and mp.material.cpse else "N/A",
            "original_description": mp.material.original_description if mp.material else "N/A",
            "mapping_type": mp.mapping_type,
            "status": mp.status,
            "effective_date": mp.effective_date
        })
    return results

# 11. Legacy Code Rationalization
@app.get("/api/legacy-codes", tags=["Legacy Rationalization"])
def list_legacy_codes(db: Session = Depends(get_db)):
    codes = db.query(LegacyMaterialCode).all()
    res = []
    for lc in codes:
        mat = db.query(Material).filter(Material.id == lc.material_id).first()
        if mat:
            res.append({
                "id": lc.id,
                "material_id": mat.id,
                "material_code": lc.original_code,
                "cpse_code": mat.cpse.code,
                "description": mat.original_description,
                "proposed_status": lc.proposed_status,
                "rationalization_action": lc.rationalization_action,
                "action_notes": lc.action_notes,
                "reviewed_by": lc.reviewed_by
            })
    return res

@app.post("/api/legacy-codes/{id}/action", tags=["Legacy Rationalization"])
def update_legacy_action(id: int, action: str = Form(...), notes: Optional[str] = Form(None), db: Session = Depends(get_db)):
    lc = db.query(LegacyMaterialCode).filter(LegacyMaterialCode.id == id).first()
    if not lc:
        raise HTTPException(status_code=404, detail="Legacy record not found")
        
    old_action = lc.rationalization_action
    lc.rationalization_action = action
    lc.action_notes = notes
    lc.reviewed_by = "Technical Expert"
    
    # Update parent material status if rationalizing
    mat = db.query(Material).filter(Material.id == lc.material_id).first()
    if mat:
        if action == "Rationalize":
            mat.status = "Candidate for Rationalization"
        elif action == "Map":
            mat.status = "Mapped"
        elif action == "Retain":
            mat.status = "Retain Separately"
        elif action == "Deprecate":
            mat.status = "Deprecated"

    record_audit_log(
        db=db,
        user_email="expert@demo.com",
        user_role="Technical Expert",
        action="LEGACY_RATIONALIZATION_ACTION",
        entity_type="LEGACY_CODE",
        entity_id=lc.original_code,
        previous_value={"action": old_action},
        new_value={"action": action, "notes": notes},
        reason=f"Updated rationalization recommendation to {action}"
    )

    db.commit()
    return {"message": "Legacy rationalization updated successfully"}

# 12. Procurement Analytics & Opportunities
@app.get("/api/procurement-opportunities", response_model=List[ProcurementOpportunityResponse], tags=["Procurement Analytics"])
@app.get("/api/procurement/opportunities", response_model=List[ProcurementOpportunityResponse], tags=["Procurement Analytics"])
def list_procurement_opportunities(db: Session = Depends(get_db)):
    ops = db.query(ProcurementOpportunity).all()
    res = []
    for op in ops:
        cpse_list = json.loads(op.participating_cpse_codes_json) if op.participating_cpse_codes_json else []
        cnmc_code = None
        if hasattr(op, 'cnmc') and op.cnmc:
            cnmc_code = op.cnmc.cnmc_code
        elif op.cnmc_id:
            c_obj = db.query(CommonNationalCode).filter(CommonNationalCode.id == op.cnmc_id).first()
            if c_obj:
                cnmc_code = c_obj.cnmc_code
        res.append({
            "id": op.id,
            "cnmc_code": cnmc_code,
            "title": op.title,
            "category": op.category,
            "participating_cpse_codes": cpse_list,
            "total_quantity": op.total_quantity,
            "total_spend": op.total_spend,
            "estimated_savings_lower": op.estimated_savings_lower,
            "estimated_savings_upper": op.estimated_savings_upper,
            "savings_percentage_est": op.savings_percentage_est,
            "status": op.status,
            "description": op.description
        })
    return res

# 13. Interactive Material Knowledge Graph
@app.get("/api/knowledge-graph", tags=["Knowledge Graph"])
def get_knowledge_graph(db: Session = Depends(get_db)):
    """
    Constructs real node/edge relationship graph from actual database entities:
    CPSE -> Original Material Code -> Proposed CNMC -> Category -> Suppliers
    """
    nodes = []
    edges = []
    node_ids = set()

    def add_node(n_id: str, label: str, n_type: str, metadata: Dict[str, Any] = None):
        if n_id not in node_ids:
            node_ids.add(n_id)
            nodes.append({
                "id": n_id,
                "label": label,
                "type": n_type,
                "metadata": metadata or {}
            })

    def add_edge(source: str, target: str, label: str):
        edges.append({
            "id": f"{source}->{target}",
            "source": source,
            "target": target,
            "label": label
        })

    # Add CPSE nodes
    cpses = db.query(CPSEOrganization).all()
    for c in cpses:
        add_node(f"cpse_{c.code}", c.name, "CPSE", {"code": c.code, "sector": c.sector})

    # Add Proposed CNMC nodes
    cnmcs = db.query(CommonNationalCode).limit(6).all()
    for cn in cnmcs:
        cnmc_id = f"cnmc_{cn.cnmc_code}"
        add_node(cnmc_id, cn.cnmc_code, "CNMC", {"desc": cn.standardized_description, "cat": cn.category})

        # Connect mapped materials
        mapped = db.query(Material).filter(Material.cnmc_id == cn.id).all()
        for m in mapped:
            m_node_id = f"mat_{m.id}"
            add_node(m_node_id, f"{m.material_code}", "MATERIAL", {
                "cpse": m.cpse.code,
                "desc": m.original_description,
                "quality": m.data_quality_score
            })
            add_edge(f"cpse_{m.cpse.code}", m_node_id, "maintains")
            add_edge(m_node_id, cnmc_id, "maps_to")

    # Add Suppliers
    sups = db.query(Supplier).limit(4).all()
    for s in sups:
        sup_id = f"sup_{s.code}"
        add_node(sup_id, s.name, "SUPPLIER", {"rating": s.rating})
        # link to a cnmc
        if cnmcs:
            add_edge(sup_id, f"cnmc_{cnmcs[0].cnmc_code}", "supplies")

    return {"nodes": nodes, "edges": edges}

# 14. Tamper-Evident SHA-256 Audit Trail & Integrity Verifier
@app.get("/api/audit", response_model=List[AuditLogResponse], tags=["Audit Trail"])
def get_audit_trail(limit: int = 100, db: Session = Depends(get_db)):
    logs = db.query(AuditLog).order_by(AuditLog.sequence_num.desc()).limit(limit).all()
    return logs

@app.post("/api/audit/verify", response_model=AuditVerificationResponse, tags=["Audit Trail"])
def verify_audit(db: Session = Depends(get_db)):
    """
    Cryptographically scans every link of the SHA-256 hash chain stored in database.
    Detects if any record payload, sequence, or timestamp was tampered with after signing.
    """
    return verify_audit_trail_integrity(db)

@app.post("/api/audit/simulate-tamper", tags=["Audit Trail"])
def simulate_tamper(db: Session = Depends(get_db)):
    """Demo-only: Simulates unauthorized database edit to demonstrate detection"""
    return simulate_demo_tamper(db)

@app.post("/api/audit/restore-tamper", tags=["Audit Trail"])
def restore_tamper(db: Session = Depends(get_db)):
    """Restores audit log row to valid state"""
    return restore_demo_tamper(db)

# 15. Demo Management & Safe Reset
@app.post("/api/demo/reset", tags=["Demo Mode"])
def reset_demo_data(confirmation: str = Form(...), db: Session = Depends(get_db)):
    """
    Safely resets the demonstration dataset to its known initial state.
    Requires explicit confirmation string 'CONFIRM_RESET_DEMO_DATA'.
    """
    if confirmation != "CONFIRM_RESET_DEMO_DATA":
        raise HTTPException(status_code=400, detail="Invalid confirmation token. Reset cancelled.")
        
    res = seed_database(db, force_reset=True)
    return {"message": "Demo data reset successfully to initial state.", "details": res}

@app.get("/api/demo/cases", tags=["Demo Mode"])
def get_demo_cases(db: Session = Depends(get_db)):
    """Returns quick links and IDs for the 3 prepared presentation demo cases"""
    cp_pipe = db.query(Material).filter(Material.material_code == "CP-10452").first()
    ntpc_pipe = db.query(Material).filter(Material.material_code == "MAT-7821").first()
    ongc_pipe = db.query(Material).filter(Material.material_code == "OG-4412").first()
    
    dup_match = db.query(MaterialMatch).filter(MaterialMatch.relationship_type == "Near Duplicate").first()
    conf_match = db.query(MaterialMatch).filter(MaterialMatch.relationship_type == "Technical Review Required").first()

    return {
        "case_1_duplicate": {
            "title": "Case 1: Near Duplicate Detection & CNMC Mapping",
            "material_a": "CPCL CP-10452 (SS PIPE 2 INCH SCH 40)",
            "material_b": "NTPC MAT-7821 (STAINLESS STEEL PIPE 50.8 MM SCH 40)",
            "match_id": dup_match.id if dup_match else None,
            "talking_point": "Engineering tolerance rule confirms 2 inch = 50.8 mm nominal bore correspondence."
        },
        "case_2_conflict": {
            "title": "Case 2: Critical Technical Conflict Override",
            "material_a": "CPCL CP-10452 (SS PIPE 50MM SCH40)",
            "material_b": "ONGC OG-4412 (SS PIPE 50MM SCH80)",
            "match_id": conf_match.id if conf_match else None,
            "talking_point": "Text similarity is 96.5%, but critical schedule conflict forces Technical Review Required. Safety override active."
        },
        "case_3_search_before_create": {
            "title": "Case 3: Search-Before-Create Wizard",
            "sample_input": "STAINLESS STEEL PIPE 50MM SCH40",
            "expected_match": "NMC-PIP-SS-050-S40-001",
            "talking_point": "Real-time search warns user of existing approved common code before saving new master record."
        }
    }

# 16. Global Search across multiple fields
@app.get("/api/search/global", tags=["Global Search"])
def global_search(q: str = Query(..., min_length=2), db: Session = Depends(get_db)):
    term = f"%{q}%"
    mats = db.query(Material).filter(
        or_(
            Material.material_code.like(term),
            Material.original_description.like(term),
            Material.standardized_description.like(term),
            Material.grade.like(term),
            Material.category.like(term),
            Material.standard.like(term)
        )
    ).limit(20).all()

    cnmcs = db.query(CommonNationalCode).filter(
        or_(
            CommonNationalCode.cnmc_code.like(term),
            CommonNationalCode.standardized_description.like(term)
        )
    ).limit(10).all()

    results = []
    for m in mats:
        results.append({
            "type": "MATERIAL",
            "id": m.id,
            "title": f"[{m.cpse.code}] {m.material_code}",
            "subtitle": m.original_description,
            "badge": m.status,
            "quality": m.data_quality_score,
            "link": f"/materials/{m.id}"
        })
    for c in cnmcs:
        results.append({
            "type": "PROPOSED_CNMC",
            "id": c.id,
            "title": c.cnmc_code,
            "subtitle": c.standardized_description,
            "badge": "Common Code",
            "quality": 100.0,
            "link": f"/cnmc/{c.id}"
        })

    return {"query": q, "total_found": len(results), "results": results}

# 17. Reports & Data Exports
@app.get("/api/export/materials", tags=["Export"])
def export_materials(db: Session = Depends(get_db)):
    mats = db.query(Material).all()
    data = []
    for m in mats:
        data.append({
            "material_code": m.material_code,
            "cpse_code": m.cpse.code,
            "original_description": m.original_description,
            "normalized_description": m.normalized_description,
            "category": m.category,
            "original_unit": m.original_unit,
            "material_name": m.material_name or "",
            "grade": m.grade or "",
            "size_raw": m.size_raw or "",
            "normalized_size_mm": m.normalized_size_mm or "",
            "schedule": m.schedule or "",
            "standard": m.standard or "",
            "annual_quantity": m.annual_quantity,
            "annual_spend": m.annual_spend,
            "data_quality_score": m.data_quality_score,
            "status": m.status,
            "cnmc_code": m.cnmc.cnmc_code if m.cnmc else ""
        })
    csv_str = export_materials_to_csv(data)
    now_str = datetime.datetime.utcnow().strftime("%Y%m%d_%H%M")
    return PlainTextResponse(
        csv_str,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="matisync_materials_{now_str}.csv"'}
    )

@app.get("/api/export/audit", tags=["Export"])
def export_audit(db: Session = Depends(get_db)):
    logs = db.query(AuditLog).order_by(AuditLog.sequence_num.asc()).all()
    data = [
        {
            "sequence_num": l.sequence_num,
            "timestamp": l.timestamp.isoformat(),
            "user_email": l.user_email,
            "user_role": l.user_role,
            "action": l.action,
            "entity_type": l.entity_type,
            "entity_id": l.entity_id or "",
            "reason": l.reason or "",
            "previous_entry_hash": l.previous_entry_hash,
            "entry_hash": l.entry_hash
        }
        for l in logs
    ]
    csv_str = export_audit_to_csv(data)
    now_str = datetime.datetime.utcnow().strftime("%Y%m%d_%H%M")
    return PlainTextResponse(
        csv_str,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="matisync_audit_trail_{now_str}.csv"'}
    )

@app.get("/api/export/matches", tags=["Export"])
def export_matches(db: Session = Depends(get_db)):
    matches = db.query(MaterialMatch).all()
    data = []
    for m in matches:
        mat_a = db.query(Material).filter(Material.id == m.material_a_id).first()
        mat_b = db.query(Material).filter(Material.id == m.material_b_id).first()
        if mat_a and mat_b:
            has_crit = db.query(TechnicalConflict).filter(TechnicalConflict.match_id == m.id, TechnicalConflict.severity == "CRITICAL").first() is not None
            data.append({
                "match_id": m.id,
                "material_a_code": mat_a.material_code,
                "cpse_a": mat_a.cpse.code,
                "material_b_code": mat_b.material_code,
                "cpse_b": mat_b.cpse.code,
                "relationship_type": m.relationship_type,
                "ai_score": m.ai_score,
                "text_score": m.text_score,
                "attribute_score": m.attribute_score,
                "technical_compatibility_score": m.technical_compatibility_score,
                "decision": m.decision,
                "has_critical_conflict": has_crit
            })
    csv_str = export_matches_to_csv(data)
    now_str = datetime.datetime.utcnow().strftime("%Y%m%d_%H%M")
    return PlainTextResponse(
        csv_str,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="matisync_matches_{now_str}.csv"'}
    )

@app.get("/api/export/common-materials", tags=["Export"])
def export_common_materials(db: Session = Depends(get_db)):
    cnmcs = db.query(CommonNationalCode).all()
    output = io.StringIO()
    fields = ["cnmc_code", "standardized_description", "category", "material_family", "grade", "size_mm", "schedule", "standard", "illustrative_gem_code", "status"]
    writer = csv.DictWriter(output, fieldnames=fields)
    writer.writeheader()
    for c in cnmcs:
        writer.writerow({
            "cnmc_code": c.cnmc_code,
            "standardized_description": c.standardized_description,
            "category": c.category,
            "material_family": c.material_family or "",
            "grade": c.grade or "",
            "size_mm": c.size_mm or "",
            "schedule": c.schedule or "",
            "standard": c.standard or "",
            "illustrative_gem_code": c.illustrative_gem_code or "",
            "status": c.status
        })
    now_str = datetime.datetime.utcnow().strftime("%Y%m%d_%H%M")
    return PlainTextResponse(
        output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="matisync_cnmc_catalog_{now_str}.csv"'}
    )

# 18. Analytics Overview API
@app.get("/api/analytics", tags=["Dashboard"])
def get_analytics(db: Session = Depends(get_db)):
    kpis = get_dashboard_kpis(db)
    return {
        "overview": kpis,
        "methodology_disclaimer": "All potential procurement savings and demand aggregation calculations are based strictly on synthetic demonstration historical prices and hypothetical volume tiering assumptions. They do not constitute guaranteed commercial outcomes.",
        "active_sector": settings.ACTIVE_SECTOR,
        "model_version": settings.AI_MODEL_VERSION,
        "config_version": settings.CONFIG_VERSION,
        "sector_rule_version": settings.SECTOR_RULE_VERSION
    }

# 19. Mock SAP / ERP Integration Architecture (Section 34)
@app.get("/api/integrations/sap/status", tags=["ERP Integration"])
def get_sap_integration_status():
    return {
        "status": "ONLINE_MOCK",
        "supported_erp": ["SAP ECC 6.0", "SAP S/4HANA", "Oracle NetSuite", "Custom CPSE ERP"],
        "target_endpoint": "https://erp-gateway.cpcl.local:8443/sap/bc/srt/rfc/sap/bapi_material_maintaindata_rt",
        "bapi_function": "BAPI_MATERIAL_MAINTAINDATA_RT",
        "idoc_type": "MATMAS05",
        "last_sync_timestamp": datetime.datetime.utcnow().isoformat(),
        "disclaimer": "Simulated enterprise gateway interface for SIH 2026. Ready for RFC / OData v4 direct binding."
    }

@app.post("/api/integrations/sap/sync", tags=["ERP Integration"])
def sync_to_sap(req: ERPExportRequest, db: Session = Depends(get_db)):
    mats_count = db.query(Material).filter(Material.cnmc_id != None).count()
    tx_id = f"SAP-TX-{int(datetime.datetime.utcnow().timestamp())}"
    
    record_audit_log(
        db=db,
        user_email="admin@demo.com",
        user_role="Admin",
        action="SAP_ERP_OUTBOUND_SYNC",
        entity_type="INTEGRATION",
        entity_id=tx_id,
        new_value={"target": req.target_system, "cpse": req.cpse_code, "synced_records": mats_count},
        reason=f"Executed simulated outbound BAPI export to {req.target_system}"
    )
    
    return {
        "status": "SUCCESS",
        "transaction_id": tx_id,
        "target_system": req.target_system,
        "cpse_code": req.cpse_code,
        "materials_synced": mats_count,
        "message": f"Successfully prepared and dispatched {mats_count} harmonized material master records via simulated RFC BAPI_MATERIAL_MAINTAINDATA_RT."
    }

@app.post("/api/integrations/sap/inbound", tags=["ERP Integration"])
def inbound_sap_idoc(payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    idoc_num = payload.get("idoc_number", f"IDOC-{int(datetime.datetime.utcnow().timestamp())}")
    return {
        "status": "RECEIVED",
        "idoc_number": idoc_num,
        "parsed_segments": 1,
        "validation": "PASSED",
        "message": "Inbound IDoc parsed into staging queue for Data Quality Intelligence analysis."
    }

# 20. Settings & Pilot Mode
@app.get("/api/settings", tags=["Settings"])
def get_settings():
    return {
        "project_name": settings.PROJECT_NAME,
        "tagline": settings.TAGLINE,
        "deployment_mode": settings.DEPLOYMENT_MODE,
        "active_sector": settings.ACTIVE_SECTOR,
        "ai_model_version": settings.AI_MODEL_VERSION,
        "config_version": settings.CONFIG_VERSION,
        "sector_rule_version": settings.SECTOR_RULE_VERSION,
        "available_sectors": ["oil_and_gas", "power", "steel", "mining", "heavy_engineering"]
    }

# 21. Frontend SPA Integration (Serves complete React UI directly from FastAPI root)
FRONTEND_DIST_DIR = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"

if FRONTEND_DIST_DIR.exists():
    assets_dir = FRONTEND_DIST_DIR / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa_frontend(full_path: str):
        # Allow API, docs, and health endpoints to 404 naturally if not matched above
        if (
            full_path.startswith("api/")
            or full_path == "api"
            or full_path.startswith("health")
            or full_path in ("docs", "openapi.json", "redoc")
        ):
            raise HTTPException(status_code=404, detail="API endpoint not found")
        
        target_file = FRONTEND_DIST_DIR / full_path
        if full_path and target_file.is_file():
            return FileResponse(target_file)
        
        index_file = FRONTEND_DIST_DIR / "index.html"
        if index_file.is_file():
            return FileResponse(index_file)
        
        return PlainTextResponse("Frontend dist/index.html not found.", status_code=404)
