import hashlib
import json
import datetime
from sqlalchemy.orm import Session
from .models import (
    CPSEOrganization, User, CommonNationalCode, Material, MaterialAttribute,
    NormalizedMaterial, MaterialVersion, MaterialMatch, TechnicalConflict,
    CPSEMaterialMapping, LegacyMaterialCode, Supplier, ProcurementRecord,
    ProcurementOpportunity, DataQualityResult, AuditLog
)
from .services.normalizer import normalize_text, normalize_unit
from .services.extractor import extract_attributes
from .services.data_quality import compute_data_quality
from .services.conflict_detector import detect_technical_conflicts
from .services.cnmc_generator import format_cnmc_code
from .services.audit_service import calculate_entry_hash, GENESIS_HASH

def hash_pw(pw: str) -> str:
    return hashlib.sha256(pw.encode()).hexdigest()

def seed_database(db: Session, force_reset: bool = False):
    """
    Populates the database with realistic synthetic CPSE material master records,
    intentional demo cases (Duplicate, Technical Conflict, Incomplete, etc.),
    demo users, suppliers, and procurement records.
    """
    from .database import Base
    Base.metadata.create_all(bind=db.get_bind())
    
    if force_reset:
        db.query(AuditLog).delete()
        db.query(ProcurementOpportunity).delete()
        db.query(ProcurementRecord).delete()
        db.query(Supplier).delete()
        db.query(LegacyMaterialCode).delete()
        db.query(CPSEMaterialMapping).delete()
        db.query(TechnicalConflict).delete()
        db.query(MaterialMatch).delete()
        db.query(MaterialVersion).delete()
        db.query(NormalizedMaterial).delete()
        db.query(MaterialAttribute).delete()
        db.query(DataQualityResult).delete()
        db.query(Material).delete()
        db.query(CommonNationalCode).delete()
        db.query(User).delete()
        db.query(CPSEOrganization).delete()
        db.commit()

    if db.query(CPSEOrganization).first() and not force_reset:
        return {"status": "ALREADY_SEEDED", "materials_count": db.query(Material).count()}

    # 1. CPSE Organizations
    cpses_data = [
        {"code": "CPCL", "name": "Chennai Petroleum Corporation Limited", "sector": "Oil & Gas", "status": "PILOT", "email": "materials@cpcl.co.in"},
        {"code": "NTPC", "name": "NTPC Limited", "sector": "Power", "status": "PILOT", "email": "materials@ntpc.co.in"},
        {"code": "ONGC", "name": "Oil and Natural Gas Corporation", "sector": "Oil & Gas", "status": "ACTIVE", "email": "procurement@ongc.co.in"},
        {"code": "IOCL", "name": "Indian Oil Corporation Limited", "sector": "Oil & Gas", "status": "ACTIVE", "email": "masterdata@iocl.co.in"},
        {"code": "SAIL", "name": "Steel Authority of India Limited", "sector": "Steel", "status": "ACTIVE", "email": "stores@sail.co.in"},
        {"code": "BPCL", "name": "Bharat Petroleum Corporation Limited", "sector": "Oil & Gas", "status": "ACTIVE", "email": "materials@bpcl.co.in"},
        {"code": "BHEL", "name": "Bharat Heavy Electricals Limited", "sector": "Heavy Engineering", "status": "ACTIVE", "email": "procurement@bhel.in"},
        {"code": "CIL", "name": "Coal India Limited", "sector": "Mining", "status": "NOT_CONNECTED", "email": "materials@coalindia.in"},
    ]
    
    cpse_map = {}
    for c in cpses_data:
        org = CPSEOrganization(
            code=c["code"],
            name=c["name"],
            sector=c["sector"],
            status=c["status"],
            contact_email=c["email"],
            last_upload=datetime.datetime.utcnow() - datetime.timedelta(days=2)
        )
        db.add(org)
        db.flush()
        cpse_map[c["code"]] = org.id

    # 2. Demo Users
    users_data = [
        {"username": "admin", "email": "admin@demo.com", "role": "Admin", "name": "Rajesh Sharma (System Admin)", "cpse_id": None},
        {"username": "cpcl_officer", "email": "material@cpcl.demo", "role": "CPSE Material Officer", "name": "K. Venkatesh (CPCL Material Officer)", "cpse_id": cpse_map["CPCL"]},
        {"username": "expert", "email": "expert@demo.com", "role": "Technical Expert", "name": "Dr. Ananya Roy (Chief Materials Metallurgist)", "cpse_id": None},
        {"username": "procurement", "email": "procurement@demo.com", "role": "Procurement Officer", "name": "Suresh Nair (Head of Strategic Sourcing)", "cpse_id": None},
        {"username": "management", "email": "management@demo.com", "role": "Management", "name": "P. Ramachandran (Director - MoPNG)", "cpse_id": None},
    ]
    for u in users_data:
        user = User(
            username=u["username"],
            email=u["email"],
            password_hash=hash_pw("demo123"),
            role=u["role"],
            full_name=u["name"],
            cpse_id=u["cpse_id"]
        )
        db.add(user)

    # 3. Reusable Suppliers
    suppliers_data = [
        {"name": "L&T Valves Limited", "code": "SUP-LNT-01", "email": "sales@lntvalves.com", "rating": 4.8},
        {"name": "Jindal Stainless Limited", "code": "SUP-JSL-02", "email": "contact@jindalstainless.com", "rating": 4.7},
        {"name": "Swagelok India Fittings", "code": "SUP-SWG-03", "email": "orders@swagelok.in", "rating": 4.9},
        {"name": "SKF India Industrial Bearings", "code": "SUP-SKF-04", "email": "support@skfindia.com", "rating": 4.6},
        {"name": "Polycab Wires & Cables Ltd", "code": "SUP-POL-05", "email": "cables@polycab.com", "rating": 4.5},
        {"name": "KSB Pumps and Spares India", "code": "SUP-KSB-06", "email": "spares@ksbindia.com", "rating": 4.7},
        {"name": "Unbrako Fasteners Division", "code": "SUP-UNB-07", "email": "fasteners@unbrako.in", "rating": 4.6},
        {"name": "Bharat Heavy Electricals Power Div", "code": "SUP-BHE-08", "email": "sales@bhel.in", "rating": 4.4},
        {"name": "Champion Gaskets & Seals", "code": "SUP-CHM-09", "email": "orders@championseals.com", "rating": 4.3},
        {"name": "Kirloskar Brothers Industrial", "code": "SUP-KBL-10", "email": "corporate@kbl.co.in", "rating": 4.5},
    ]
    supplier_map = {}
    for s in suppliers_data:
        sup = Supplier(name=s["name"], code=s["code"], contact_email=s["email"], rating=s["rating"])
        db.add(sup)
        db.flush()
        supplier_map[s["code"]] = sup.id

    # 4. Common National Codes (CNMC) Seed
    cnmcs_seed = [
        {
            "code": "NMC-PIP-SS-050-S40-001",
            "desc": "STAINLESS STEEL PIPE | SS304 | 50.8 MM (2 INCH) | SCH40 | ASTM A312",
            "cat": "Pipes",
            "mat": "Stainless Steel",
            "grade": "SS304",
            "size": 50.8,
            "sch": "SCH40",
            "std": "ASTM A312",
            "gem": "GEM/2026/M/001045",
            "unspsc": "40171501"
        },
        {
            "code": "NMC-PIP-CS-100-S40-002",
            "desc": "CARBON STEEL SEAMLESS PIPE | A106 GR B | 101.6 MM (4 INCH) | SCH40 | ASTM A106",
            "cat": "Pipes",
            "mat": "Carbon Steel",
            "grade": "A106 Gr B",
            "size": 101.6,
            "sch": "SCH40",
            "std": "ASTM A106",
            "gem": "GEM/2026/M/001046",
            "unspsc": "40171502"
        },
        {
            "code": "NMC-VAL-SS-050-C150-001",
            "desc": "STAINLESS STEEL BALL VALVE | SS316 | 50 MM (2 INCH) | CLASS 150# | FLANGED ENDS",
            "cat": "Valves",
            "mat": "Stainless Steel",
            "grade": "SS316",
            "size": 50.0,
            "sch": "CLASS 150#",
            "std": "ASME B16.34",
            "gem": "GEM/2026/M/002011",
            "unspsc": "40141602"
        },
        {
            "code": "NMC-BRG-ST-025-STD-001",
            "desc": "DEEP GROOVE BALL BEARING | CHROME STEEL | BORE 25 MM | DESIGNATION 6205-2RS | C3 CLEARANCE",
            "cat": "Bearings",
            "mat": "Alloy Steel",
            "grade": "Chrome Steel",
            "size": 25.0,
            "sch": "6205-2RS",
            "std": "ISO 15",
            "gem": "GEM/2026/M/003050",
            "unspsc": "31171504"
        },
        {
            "code": "NMC-CAB-CU-016-1.1KV-001",
            "desc": "XLPE INSULATED POWER CABLE | COPPER CONDUCTOR | 3.5C X 16 SQMM | 1.1 KV GRADE | ARMOURED",
            "cat": "Cables",
            "mat": "Copper",
            "grade": "XLPE",
            "size": 16.0,
            "sch": "1.1KV",
            "std": "IS 7098 PART 1",
            "gem": "GEM/2026/M/004088",
            "unspsc": "26121629"
        }
    ]
    cnmc_obj_map = {}
    for c in cnmcs_seed:
        cnmc_rec = CommonNationalCode(
            cnmc_code=c["code"],
            standardized_description=c["desc"],
            category=c["cat"],
            material_family=c["mat"],
            grade=c["grade"],
            size_mm=c["size"],
            schedule=c["sch"],
            standard=c["std"],
            illustrative_gem_code=c["gem"],
            illustrative_unspsc_code=c["unspsc"],
            status="APPROVED",
            created_by="MatiSync Master Seed",
            approved_by="Dr. Ananya Roy (Technical Expert)",
            approved_at=datetime.datetime.utcnow() - datetime.timedelta(days=10)
        )
        db.add(cnmc_rec)
        db.flush()
        cnmc_obj_map[c["code"]] = cnmc_rec

    # 5. Core Synthetic Material Records (with deliberate Demo Cases)
    raw_materials = [
        # DEMO CASE 1 & CASE 3: Near Duplicate / Search-Before-Create Target
        {
            "cpse": "CPCL", "code": "CP-10452",
            "desc": "SS PIPE 2 INCH SCH 40",
            "cat": "Pipes", "unit": "MTR",
            "qty": 3500.0, "spend": 4200000.0,
            "cnmc_code": "NMC-PIP-SS-050-S40-001",
            "status": "Mapped"
        },
        {
            "cpse": "NTPC", "code": "MAT-7821",
            "desc": "STAINLESS STEEL PIPE 50.8 MM SCH 40 ASTM A312 TP304",
            "cat": "Pipes", "unit": "MTR",
            "qty": 4200.0, "spend": 5100000.0,
            "cnmc_code": "NMC-PIP-SS-050-S40-001",
            "status": "Near Duplicate"
        },
        {
            "cpse": "IOCL", "code": "IOC-P-30402",
            "desc": "PIPE SS304 ERW 50MM OD SCH40 ASME B36.19",
            "cat": "Pipes", "unit": "MTR",
            "qty": 2800.0, "spend": 3360000.0,
            "cnmc_code": "NMC-PIP-SS-050-S40-001",
            "status": "Functionally Equivalent"
        },
        # DEMO CASE 2: Technical Conflict Target (SCH40 vs SCH80)
        {
            "cpse": "ONGC", "code": "OG-4412",
            "desc": "SS PIPE 50MM SCH80 ASTM A312 TP304",
            "cat": "Pipes", "unit": "MTR",
            "qty": 1800.0, "spend": 2880000.0,
            "cnmc_code": None,
            "status": "Technical Conflict"
        },
        # DEMO CASE 4: Missing Data / Low Data Quality
        {
            "cpse": "BPCL", "code": "BP-MISC-99",
            "desc": "SS PIPE",
            "cat": "Pipes", "unit": "NONE",
            "qty": 200.0, "spend": 150000.0,
            "cnmc_code": None,
            "status": "Data Quality Issue"
        },
        # Additional Realistic Materials across CPSEs
        # Carbon steel pipes
        {
            "cpse": "CPCL", "code": "CP-20891",
            "desc": "CS SEAMLESS PIPE 4 INCH SCH 40 ASTM A106 GR B",
            "cat": "Pipes", "unit": "MTR",
            "qty": 5000.0, "spend": 7500000.0,
            "cnmc_code": "NMC-PIP-CS-100-S40-002",
            "status": "Mapped"
        },
        {
            "cpse": "SAIL", "code": "SL-P-40106",
            "desc": "CARBON STEEL PIPE 100MM NB SCH40 ASTM A106B",
            "cat": "Pipes", "unit": "MTR",
            "qty": 6500.0, "spend": 9750000.0,
            "cnmc_code": "NMC-PIP-CS-100-S40-002",
            "status": "Near Duplicate"
        },
        {
            "cpse": "NTPC", "code": "MAT-9944",
            "desc": "CS PIPE 100 MM SCH80 ASTM A106 GR B",
            "cat": "Pipes", "unit": "MTR",
            "qty": 2200.0, "spend": 4400000.0,
            "cnmc_code": None,
            "status": "Under Review"
        },
        # Valves
        {
            "cpse": "CPCL", "code": "CP-VAL-101",
            "desc": "BALL VALVE 2 INCH CLASS 150# FLANGED SS316 L&T",
            "cat": "Valves", "unit": "NOS",
            "qty": 180.0, "spend": 3240000.0,
            "cnmc_code": "NMC-VAL-SS-050-C150-001",
            "status": "Mapped"
        },
        {
            "cpse": "IOCL", "code": "IOC-V-50150",
            "desc": "SS316 BALL VALVE 50MM 150# FLGD ENDS ASME B16.34",
            "cat": "Valves", "unit": "NOS",
            "qty": 220.0, "spend": 3960000.0,
            "cnmc_code": "NMC-VAL-SS-050-C150-001",
            "status": "Near Duplicate"
        },
        {
            "cpse": "ONGC", "code": "OG-V-300SS",
            "desc": "BALL VALVE 2 INCH CLASS 300# FLANGED BODY SS316",
            "cat": "Valves", "unit": "NOS",
            "qty": 90.0, "spend": 2250000.0,
            "cnmc_code": None,
            "status": "Technical Conflict"
        },
        {
            "cpse": "BPCL", "code": "BP-GATE-04",
            "desc": "GATE VALVE 4 INCH CLASS 150# WCB FLANGED AUDCO",
            "cat": "Valves", "unit": "NOS",
            "qty": 140.0, "spend": 2520000.0,
            "cnmc_code": None,
            "status": "Active"
        },
        # Bearings
        {
            "cpse": "BHEL", "code": "BH-BRG-6205",
            "desc": "DEEP GROOVE BALL BEARING 6205-2RS C3 SKF",
            "cat": "Bearings", "unit": "NOS",
            "qty": 1200.0, "spend": 1080000.0,
            "cnmc_code": "NMC-BRG-ST-025-STD-001",
            "status": "Mapped"
        },
        {
            "cpse": "NTPC", "code": "MAT-BRG-25",
            "desc": "BEARING 6205 2RS C3 BORE 25MM FAG",
            "cat": "Bearings", "unit": "NOS",
            "qty": 1500.0, "spend": 1350000.0,
            "cnmc_code": "NMC-BRG-ST-025-STD-001",
            "status": "Near Duplicate"
        },
        {
            "cpse": "SAIL", "code": "SL-BRG-6308",
            "desc": "BALL BEARING 6308 C3 OPEN TYPE 40MM BORE",
            "cat": "Bearings", "unit": "NOS",
            "qty": 800.0, "spend": 1200000.0,
            "cnmc_code": None,
            "status": "Active"
        },
        # Electrical Cables
        {
            "cpse": "NTPC", "code": "MAT-CAB-3516",
            "desc": "XLPE ARMOURED CABLE 3.5C X 16 SQMM 1.1KV COPPER POLYCAB",
            "cat": "Cables", "unit": "MTR",
            "qty": 8000.0, "spend": 4800000.0,
            "cnmc_code": "NMC-CAB-CU-016-1.1KV-001",
            "status": "Mapped"
        },
        {
            "cpse": "BHEL", "code": "BH-CBL-16CU",
            "desc": "POWER CABLE 3.5 CORE 16 SQMM XLPE INSULATED 1100V CU ARMOURED IS 7098",
            "cat": "Cables", "unit": "MTR",
            "qty": 6500.0, "spend": 3900000.0,
            "cnmc_code": "NMC-CAB-CU-016-1.1KV-001",
            "status": "Near Duplicate"
        },
        {
            "cpse": "ONGC", "code": "OG-CBL-11KV",
            "desc": "HT POWER CABLE 3C X 185 SQMM 11KV XLPE ARMOURED",
            "cat": "Cables", "unit": "MTR",
            "qty": 3000.0, "spend": 6000000.0,
            "cnmc_code": None,
            "status": "Active"
        },
        # Fasteners
        {
            "cpse": "CPCL", "code": "CP-FAS-B7M16",
            "desc": "STUD BOLT ASTM A193 B7 M16 X 120MM WITH 2 NUTS ASTM A194 2H",
            "cat": "Fasteners", "unit": "SET",
            "qty": 4500.0, "spend": 1125000.0,
            "cnmc_code": None,
            "status": "Active"
        },
        {
            "cpse": "IOCL", "code": "IOC-FAS-16B7",
            "desc": "ALLOY STEEL STUD M16X120 GR B7 W/ 2H HEAVY HEX NUTS UNBRAKO",
            "cat": "Fasteners", "unit": "SET",
            "qty": 3800.0, "spend": 950000.0,
            "cnmc_code": None,
            "status": "Functionally Equivalent"
        },
        # Pumps & Motors
        {
            "cpse": "CPCL", "code": "CP-PMP-55K",
            "desc": "CENTRIFUGAL WATER PUMP 55KW 2900 RPM 415V KSB KBL",
            "cat": "Pumps", "unit": "NOS",
            "qty": 8.0, "spend": 3200000.0,
            "cnmc_code": None,
            "status": "Active"
        },
        {
            "cpse": "NTPC", "code": "MAT-PMP-55K",
            "desc": "CENTRIFUGAL PUMP SET 55 KW 415 VOLT 3 PHASE Kirloskar",
            "cat": "Pumps", "unit": "NOS",
            "qty": 12.0, "spend": 4800000.0,
            "cnmc_code": None,
            "status": "Functionally Equivalent"
        }
    ]

    # Expand dataset with realistic variations across all CPSEs to reach ~100-150 records
    cpses_cycle = ["CPCL", "NTPC", "ONGC", "IOCL", "SAIL", "BPCL", "BHEL"]
    size_variants = [
        ("1/2 INCH", 15.0, "015", 350.0),
        ("3/4 INCH", 20.0, "020", 480.0),
        ("1 INCH", 25.4, "025", 620.0),
        ("1.5 INCH", 38.1, "038", 850.0),
        ("2 INCH", 50.8, "050", 1200.0),
        ("3 INCH", 76.2, "076", 1850.0),
        ("4 INCH", 101.6, "100", 2400.0),
        ("6 INCH", 152.4, "150", 3800.0),
    ]

    mat_records_objs = []
    
    # Process base records first
    for r in raw_materials:
        cpse_id = cpse_map[r["cpse"]]
        norm_desc = normalize_text(r["desc"])
        norm_unit = normalize_unit(r["unit"])
        attrs = extract_attributes(norm_desc, r["cat"])
        
        # Calculate quality
        test_dict = {
            "original_description": r["desc"],
            "original_unit": r["unit"],
            "category": r["cat"],
            **attrs
        }
        dq_res = compute_data_quality(test_dict)
        
        cnmc_rec = cnmc_obj_map.get(r["cnmc_code"]) if r["cnmc_code"] else None
        
        std_desc = f"{attrs['material_name'] or 'STEEL'} | {attrs['grade'] or 'STD'} | {attrs['size_raw'] or ''} | {attrs['schedule'] or attrs['pressure_rating'] or ''} | {attrs['standard'] or ''}".strip(" |")
        
        mat = Material(
            cpse_id=cpse_id,
            material_code=r["code"],
            original_description=r["desc"],
            normalized_description=norm_desc,
            standardized_description=std_desc,
            final_approved_description=std_desc if r["status"] == "Mapped" else None,
            category=r["cat"],
            original_unit=r["unit"],
            normalized_unit=norm_unit,
            material_name=attrs["material_name"],
            grade=attrs["grade"],
            size_raw=attrs["size_raw"],
            normalized_size_mm=attrs["normalized_size_mm"],
            schedule=attrs["schedule"],
            pressure_rating=attrs["pressure_rating"],
            standard=attrs["standard"],
            manufacturer=attrs["manufacturer"],
            annual_quantity=r["qty"],
            annual_spend=r["spend"],
            data_quality_score=dq_res["overall_score"],
            quality_issues_count=dq_res["issues_count"],
            quality_breakdown_json=json.dumps(dq_res),
            status=r["status"],
            cnmc_id=cnmc_rec.id if cnmc_rec else None
        )
        db.add(mat)
        db.flush()
        mat_records_objs.append(mat)
        
        # Add attributes
        for a in attrs["attributes_list"]:
            db.add(MaterialAttribute(
                material_id=mat.id,
                attribute_name=a["name"],
                attribute_value=a["value"],
                raw_value=a["value"],
                confidence=a["confidence"],
                extraction_method="RULE_REGEX"
            ))
            
        # Add normalization trail
        db.add(NormalizedMaterial(
            material_id=mat.id,
            field_name="description",
            original_value=r["desc"],
            normalized_value=norm_desc,
            standardized_value=std_desc,
            rule_applied="Abbreviation expansion, dimensions standardized, casing converted",
            transformation_notes="Preserves historical original CPSE text."
        ))
        
        # Add initial version
        db.add(MaterialVersion(
            material_id=mat.id,
            version_num=1,
            changed_by="Data Ingestion Pipeline",
            change_type="CREATED",
            field_changed="all",
            previous_value=None,
            new_value=r["desc"],
            reason="Initial ingestion and automated AI standardization"
        ))

        # Add CPSE mapping if mapped
        if cnmc_rec:
            db.add(CPSEMaterialMapping(
                cnmc_id=cnmc_rec.id,
                material_id=mat.id,
                cpse_id=cpse_id,
                mapping_type="ONE_TO_ONE",
                status="ACTIVE"
            ))

        # Add Legacy code record
        db.add(LegacyMaterialCode(
            material_id=mat.id,
            cpse_id=cpse_id,
            original_code=r["code"],
            proposed_status=r["status"],
            rationalization_action="Map" if r["status"] == "Mapped" else ("Review" if r["status"] == "Technical Conflict" else "Retain"),
            action_notes=f"Auto-classified based on AI standardization. Current status: {r['status']}."
        ))

        # Add synthetic procurement record
        sup_id = list(supplier_map.values())[mat.id % len(supplier_map)]
        unit_price = round(r["spend"] / max(1.0, r["qty"]), 2)
        db.add(ProcurementRecord(
            material_id=mat.id,
            cpse_id=cpse_id,
            supplier_id=sup_id,
            po_number=f"PO-{r['cpse']}-2025-{mat.id:04d}",
            unit_price=unit_price,
            quantity=r["qty"],
            total_spend=r["spend"],
            delivery_location=f"{r['cpse']} Central Stores Refinery/Plant"
        ))

    # Generate synthetic variation pool to reach 100+ records
    base_idx = len(raw_materials) + 1
    for i, cpse_code in enumerate(cpses_cycle):
        for s_label, s_mm, s_code, base_price in size_variants:
            mat_code = f"{cpse_code}-P316-{s_code}-{base_idx}"
            raw_desc = f"SS 316 PIPE {s_label} SCH 40 SMLS ASTM A312"
            norm_desc = normalize_text(raw_desc)
            qty = float(500 + ((base_idx * 37) % 2500))
            spend = float(round(qty * base_price, 2))
            attrs = extract_attributes(norm_desc, "Pipes")
            
            dq_res = compute_data_quality({
                "original_description": raw_desc,
                "original_unit": "MTR",
                "category": "Pipes",
                **attrs
            })
            
            std_desc = f"STAINLESS STEEL | SS316 | {s_mm} MM | SCH40 | ASTM A312"
            
            mat = Material(
                cpse_id=cpse_map[cpse_code],
                material_code=mat_code,
                original_description=raw_desc,
                normalized_description=norm_desc,
                standardized_description=std_desc,
                category="Pipes",
                original_unit="MTR",
                normalized_unit="MTR",
                material_name="Stainless Steel",
                grade="SS316",
                size_raw=s_label,
                normalized_size_mm=s_mm,
                schedule="SCH40",
                standard="ASTM A312",
                annual_quantity=qty,
                annual_spend=spend,
                data_quality_score=dq_res["overall_score"],
                quality_issues_count=dq_res["issues_count"],
                quality_breakdown_json=json.dumps(dq_res),
                status="Active"
            )
            db.add(mat)
            db.flush()
            mat_records_objs.append(mat)
            
            # Attributes
            for a in attrs["attributes_list"]:
                db.add(MaterialAttribute(
                    material_id=mat.id,
                    attribute_name=a["name"],
                    attribute_value=a["value"],
                    confidence=0.95
                ))
            
            # Procurement Record
            sup_id = list(supplier_map.values())[mat.id % len(supplier_map)]
            db.add(ProcurementRecord(
                material_id=mat.id,
                cpse_id=cpse_map[cpse_code],
                supplier_id=sup_id,
                po_number=f"PO-{cpse_code}-2025-{mat.id:04d}",
                unit_price=base_price,
                quantity=qty,
                total_spend=spend,
                delivery_location=f"{cpse_code} Regional Warehouse"
            ))

            db.add(LegacyMaterialCode(
                material_id=mat.id,
                cpse_id=cpse_map[cpse_code],
                original_code=mat_code,
                proposed_status="Active",
                rationalization_action="Retain"
            ))
            
            base_idx += 1

    # Additional Valves variations across CPSEs
    valve_sizes = [("1 INCH", 25.0, "C150", 4200.0), ("2 INCH", 50.0, "C150", 7800.0), ("3 INCH", 80.0, "C150", 12500.0), ("4 INCH", 100.0, "C150", 18000.0)]
    for cpse_code in ["CPCL", "NTPC", "ONGC", "IOCL", "BPCL"]:
        for s_lbl, s_mm, c_class, v_price in valve_sizes:
            v_code = f"{cpse_code}-VAL-150-{base_idx}"
            raw_desc = f"BALL VALVE {s_lbl} CLASS 150# FLANGED BODY SS316 TRIM SS316"
            norm_desc = normalize_text(raw_desc)
            qty = float(20 + (base_idx % 60))
            spend = float(round(qty * v_price, 2))
            attrs = extract_attributes(norm_desc, "Valves")
            dq_res = compute_data_quality({"original_description": raw_desc, "original_unit": "NOS", "category": "Valves", **attrs})
            std_desc = f"STAINLESS STEEL | SS316 | {s_mm} MM | CLASS 150# | ASME B16.34"
            mat = Material(
                cpse_id=cpse_map[cpse_code],
                material_code=v_code,
                original_description=raw_desc,
                normalized_description=norm_desc,
                standardized_description=std_desc,
                category="Valves",
                original_unit="NOS",
                normalized_unit="NOS",
                material_name="Stainless Steel",
                grade="SS316",
                size_raw=s_lbl,
                normalized_size_mm=s_mm,
                pressure_rating="CLASS 150#",
                standard="ASME B16.34",
                annual_quantity=qty,
                annual_spend=spend,
                data_quality_score=dq_res["overall_score"],
                quality_issues_count=dq_res["issues_count"],
                quality_breakdown_json=json.dumps(dq_res),
                status="Active"
            )
            db.add(mat)
            db.flush()
            sup_id = list(supplier_map.values())[mat.id % len(supplier_map)]
            db.add(ProcurementRecord(
                material_id=mat.id, cpse_id=cpse_map[cpse_code], supplier_id=sup_id,
                po_number=f"PO-{cpse_code}-2025-{mat.id:04d}", unit_price=v_price,
                quantity=qty, total_spend=spend, delivery_location=f"{cpse_code} Valve Stores"
            ))
            base_idx += 1

    # Additional Bearings variations across BHEL, SAIL, NTPC, CPCL
    bearing_types = [("6204-2RS", 20.0, 450.0), ("6205-2RS", 25.0, 680.0), ("6206-2RS", 30.0, 920.0), ("6308-C3", 40.0, 1650.0), ("6309-C3", 45.0, 2200.0)]
    for cpse_code in ["BHEL", "SAIL", "NTPC", "CPCL"]:
        for b_name, b_bore, b_price in bearing_types:
            b_code = f"{cpse_code}-BRG-{b_name[:4]}-{base_idx}"
            raw_desc = f"BALL BEARING {b_name} DEEP GROOVE BORE {b_bore}MM SKF FAG"
            norm_desc = normalize_text(raw_desc)
            qty = float(150 + ((base_idx * 19) % 800))
            spend = float(round(qty * b_price, 2))
            attrs = extract_attributes(norm_desc, "Bearings")
            dq_res = compute_data_quality({"original_description": raw_desc, "original_unit": "NOS", "category": "Bearings", **attrs})
            std_desc = f"ALLOY STEEL | CHROME STEEL | {b_bore} MM | {b_name} | ISO 15"
            mat = Material(
                cpse_id=cpse_map[cpse_code],
                material_code=b_code,
                original_description=raw_desc,
                normalized_description=norm_desc,
                standardized_description=std_desc,
                category="Bearings",
                original_unit="NOS",
                normalized_unit="NOS",
                material_name="Alloy Steel",
                size_raw=f"{b_bore} MM",
                normalized_size_mm=b_bore,
                schedule=b_name,
                standard="ISO 15",
                annual_quantity=qty,
                annual_spend=spend,
                data_quality_score=dq_res["overall_score"],
                quality_issues_count=dq_res["issues_count"],
                quality_breakdown_json=json.dumps(dq_res),
                status="Active"
            )
            db.add(mat)
            db.flush()
            sup_id = list(supplier_map.values())[mat.id % len(supplier_map)]
            db.add(ProcurementRecord(
                material_id=mat.id, cpse_id=cpse_map[cpse_code], supplier_id=sup_id,
                po_number=f"PO-{cpse_code}-2025-{mat.id:04d}", unit_price=b_price,
                quantity=qty, total_spend=spend, delivery_location=f"{cpse_code} Mechanical Warehouse"
            ))
            base_idx += 1

    # Additional Cables across NTPC, BHEL, ONGC, IOCL
    cable_types = [("3.5C X 16 SQMM", 16.0, 650.0), ("3.5C X 25 SQMM", 25.0, 980.0), ("3.5C X 50 SQMM", 50.0, 1850.0), ("4C X 10 SQMM", 10.0, 520.0)]
    for cpse_code in ["NTPC", "BHEL", "ONGC", "IOCL"]:
        for c_spec, c_mm, c_price in cable_types:
            c_code = f"{cpse_code}-CBL-{int(c_mm)}-{base_idx}"
            raw_desc = f"XLPE POWER CABLE {c_spec} 1.1KV COPPER ARMOURED IS 7098 POLYCAB"
            norm_desc = normalize_text(raw_desc)
            qty = float(1000 + ((base_idx * 43) % 4000))
            spend = float(round(qty * c_price, 2))
            attrs = extract_attributes(norm_desc, "Cables")
            dq_res = compute_data_quality({"original_description": raw_desc, "original_unit": "MTR", "category": "Cables", **attrs})
            std_desc = f"COPPER | XLPE | {c_mm} SQMM | 1.1KV | IS 7098"
            mat = Material(
                cpse_id=cpse_map[cpse_code],
                material_code=c_code,
                original_description=raw_desc,
                normalized_description=norm_desc,
                standardized_description=std_desc,
                category="Cables",
                original_unit="MTR",
                normalized_unit="MTR",
                material_name="Copper",
                grade="XLPE",
                size_raw=f"{c_mm} SQMM",
                normalized_size_mm=c_mm,
                pressure_rating="1.1KV",
                standard="IS 7098",
                annual_quantity=qty,
                annual_spend=spend,
                data_quality_score=dq_res["overall_score"],
                quality_issues_count=dq_res["issues_count"],
                quality_breakdown_json=json.dumps(dq_res),
                status="Active"
            )
            db.add(mat)
            db.flush()
            sup_id = list(supplier_map.values())[mat.id % len(supplier_map)]
            db.add(ProcurementRecord(
                material_id=mat.id, cpse_id=cpse_map[cpse_code], supplier_id=sup_id,
                po_number=f"PO-{cpse_code}-2025-{mat.id:04d}", unit_price=c_price,
                quantity=qty, total_spend=spend, delivery_location=f"{cpse_code} Electrical Stores"
            ))
            base_idx += 1

    db.commit()

    # 6. Seed Specific Pairwise Matches for Demo Cases
    # Find CP-10452, MAT-7821, and OG-4412
    cp_pipe = db.query(Material).filter(Material.material_code == "CP-10452").first()
    ntpc_pipe = db.query(Material).filter(Material.material_code == "MAT-7821").first()
    ongc_pipe = db.query(Material).filter(Material.material_code == "OG-4412").first()
    iocl_pipe = db.query(Material).filter(Material.material_code == "IOC-P-30402").first()

    if cp_pipe and ntpc_pipe:
        # DEMO CASE 1: Near Duplicate Match
        m_dup = MaterialMatch(
            material_a_id=cp_pipe.id,
            material_b_id=ntpc_pipe.id,
            relationship_type="Near Duplicate",
            ai_score=94.5,
            text_score=92.0,
            fuzzy_score=93.5,
            attribute_score=96.0,
            technical_compatibility_score=100.0,
            adjusted_score=95.8,
            decision="APPROVED",
            explanation_json=json.dumps({
                "summary": "Near Duplicate match: 2 inch (50.8 mm) vs 50.8 mm SCH40 SS304. Engineering conversion evaluated and confirmed identical nominal bore under ASME B36.10M rules.",
                "text_score": 92.0,
                "fuzzy_score": 93.5,
                "attribute_score": 96.0,
                "technical_compatibility_score": 100.0,
                "weights_applied": {"text": 0.35, "fuzzy": 0.15, "attribute": 0.35, "technical": 0.15},
                "active_learning_history": {"approved": 14, "rejected": 1}
            }),
            matching_attributes_json=json.dumps([
                {"attribute": "Base Material", "value": "Stainless Steel", "match": "EXACT"},
                {"attribute": "Grade", "value": "SS304", "match": "EXACT"},
                {"attribute": "Schedule", "value": "SCH40", "match": "EXACT"},
                {"attribute": "Size", "value": "2 INCH (50.8 mm) vs 50.8 MM", "match": "ENGINEERING_TOLERANCE"}
            ]),
            conflicting_attributes_json=json.dumps([]),
            missing_attributes_json=json.dumps([]),
            reviewed_at=datetime.datetime.utcnow() - datetime.timedelta(days=1),
            reviewed_by="Dr. Ananya Roy (Technical Expert)"
        )
        db.add(m_dup)

    if cp_pipe and ongc_pipe:
        # DEMO CASE 2: Technical Conflict Match (SCH40 vs SCH80)
        m_conf = MaterialMatch(
            material_a_id=cp_pipe.id,
            material_b_id=ongc_pipe.id,
            relationship_type="Technical Review Required",
            ai_score=78.2,
            text_score=96.5,  # High text similarity!
            fuzzy_score=95.0,
            attribute_score=72.0,
            technical_compatibility_score=25.0,  # Drastically reduced by safety rule
            decision="PENDING",
            explanation_json=json.dumps({
                "summary": "CRITICAL TECHNICAL CONFLICT OVERRIDE: While description similarity is 96.5%, a critical schedule conflict was detected (SCH40 vs SCH80). The AI safety rule blocks automated merging and mandates Technical Review Required.",
                "text_score": 96.5,
                "fuzzy_score": 95.0,
                "attribute_score": 72.0,
                "technical_compatibility_score": 25.0,
                "weights_applied": {"text": 0.35, "fuzzy": 0.15, "attribute": 0.35, "technical": 0.15},
                "active_learning_history": {"approved": 0, "rejected": 8}
            }),
            matching_attributes_json=json.dumps([
                {"attribute": "Base Material", "value": "Stainless Steel", "match": "EXACT"},
                {"attribute": "Grade", "value": "SS304", "match": "EXACT"},
                {"attribute": "Nominal Size", "value": "50 MM / 2 INCH", "match": "EXACT"}
            ]),
            conflicting_attributes_json=json.dumps([
                {"attribute": "Schedule", "value_a": "SCH40", "value_b": "SCH80", "severity": "CRITICAL"}
            ]),
            missing_attributes_json=json.dumps([])
        )
        db.add(m_conf)
        db.flush()

        # Add explicit technical conflict record
        db.add(TechnicalConflict(
            match_id=m_conf.id,
            material_a_id=cp_pipe.id,
            material_b_id=ongc_pipe.id,
            conflict_field="schedule",
            value_a="SCH40",
            value_b="SCH80",
            severity="CRITICAL",
            rule_name="Pipe Schedule Incompatibility Rule",
            description="Critical wall thickness conflict: SCH40 vs SCH80. SCH80 has a significantly heavier wall thickness, higher pressure rating, and reduced internal flow area. Materials are NOT technically interchangeable.",
            review_status="PENDING"
        ))

    db.commit()

    # 7. Seed Initial Tamper-Evident Hash Chain Audit Logs
    audit_events = [
        {"action": "SYSTEM_INIT", "entity": "SYSTEM", "id": "ROOT", "user": "system@matisync.gov.in", "role": "System", "reason": "Platform initialization and genesis block creation"},
        {"action": "ORGANIZATIONS_REGISTERED", "entity": "CPSE", "id": "ALL", "user": "admin@demo.com", "role": "Admin", "reason": "Registered 8 CPSE organizations with pilot configurations"},
        {"action": "BATCH_UPLOAD", "entity": "MATERIAL", "id": "CPCL_BATCH_01", "user": "material@cpcl.demo", "role": "CPSE Material Officer", "reason": "Imported CPCL piping and valve dataset (CP-10452 series)"},
        {"action": "AI_STANDARDIZATION_RUN", "entity": "AI_ENGINE", "id": "RUN-2026-001", "user": "system@matisync.gov.in", "role": "System", "reason": "Executed NLP attribute extraction, quality scoring, and normalization"},
        {"action": "TECHNICAL_CONFLICT_DETECTED", "entity": "CONFLICT", "id": "CONF-SCH40-SCH80", "user": "system@matisync.gov.in", "role": "System", "reason": "Safety rule flagged SCH40 vs SCH80 between CPCL CP-10452 and ONGC OG-4412"},
        {"action": "CNMC_APPROVED", "entity": "CNMC", "id": "NMC-PIP-SS-050-S40-001", "user": "expert@demo.com", "role": "Technical Expert", "reason": "Approved Proposed Common National Material Code and mapped CPCL & NTPC records"}
    ]

    prev_hash = GENESIS_HASH
    for idx, ev in enumerate(audit_events, 1):
        now_dt = datetime.datetime.utcnow() - datetime.timedelta(hours=(len(audit_events) - idx) * 3)
        ts_iso = now_dt.isoformat()
        payload = f"::{ev['reason']}"
        entry_hash = calculate_entry_hash(
            previous_hash=prev_hash,
            sequence_num=idx,
            timestamp_iso=ts_iso,
            user_email=ev["user"],
            action=ev["action"],
            entity_type=ev["entity"],
            entity_id=ev["id"],
            payload_str=payload
        )
        db.add(AuditLog(
            sequence_num=idx,
            timestamp=now_dt,
            user_email=ev["user"],
            user_role=ev["role"],
            action=ev["action"],
            entity_type=ev["entity"],
            entity_id=ev["id"],
            reason=ev["reason"],
            previous_entry_hash=prev_hash,
            entry_hash=entry_hash
        ))
        prev_hash = entry_hash

    db.commit()

    # 8. Generate Synthetic Procurement Opportunities
    from .services.procurement_engine import generate_procurement_opportunities
    generate_procurement_opportunities(db)

    total_mats = db.query(Material).count()
    return {
        "status": "SUCCESS",
        "materials_count": total_mats,
        "cpses_count": len(cpses_data),
        "cnmc_count": len(cnmcs_seed),
        "message": f"MatiSync seeded with {total_mats} synthetic material records, 3 prepared demo cases, and tamper-evident audit logs."
    }
