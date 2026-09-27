import re
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from ..models import CommonNationalCode, Material

# Category prefix mapping
CATEGORY_CODES = {
    "Pipes": "PIP",
    "Pipe": "PIP",
    "Piping": "PIP",
    "Valves": "VAL",
    "Valve": "VAL",
    "Flanges": "FLG",
    "Flange": "FLG",
    "Electrical": "ELE",
    "Cables": "CAB",
    "Cable": "CAB",
    "Bearings": "BRG",
    "Bearing": "BRG",
    "Pumps": "PMP",
    "Pump": "PMP",
    "Fasteners": "FAS",
    "Fastener": "FAS",
    "Gaskets": "GSK",
    "Motors": "MOT",
    "General": "GEN"
}

# Material family prefix mapping
MATERIAL_CODES = {
    "Stainless Steel": "SS",
    "Carbon Steel": "CS",
    "Mild Steel": "MS",
    "Alloy Steel": "AS",
    "Cast Iron": "CI",
    "Copper": "CU",
    "Aluminium": "AL",
    "Brass": "BR",
    "Bronze": "BZ",
    "PTFE": "PTFE",
    "XLPE": "XLPE",
    "PVC": "PVC",
}

def format_cnmc_code(
    category: str,
    material_name: Optional[str],
    size_mm: Optional[float],
    schedule_or_spec: Optional[str],
    sequence_num: int
) -> str:
    """
    Deterministically formats code:
    NMC-<CATEGORY>-<MATERIAL>-<SIZE>-<SPEC>-<SEQUENCE>
    e.g. NMC-PIP-SS-050-S40-001
    """
    cat_code = CATEGORY_CODES.get(category, "GEN")
    mat_code = MATERIAL_CODES.get(material_name, "ST") if material_name else "GEN"
    
    # Format size
    if size_mm is not None:
        size_str = f"{int(round(size_mm)):03d}"
    else:
        size_str = "000"
        
    # Format schedule / spec
    if schedule_or_spec:
        clean_spec = re.sub(r"[^A-Z0-9]", "", schedule_or_spec.upper())
        if clean_spec.startswith("SCH"):
            spec_str = "S" + clean_spec[3:]
        elif clean_spec.startswith("CLASS"):
            spec_str = "C" + clean_spec[5:]
        elif "#" in schedule_or_spec:
            spec_str = "C" + clean_spec.replace("#", "")
        else:
            spec_str = clean_spec[:4]
    else:
        spec_str = "STD"
        
    seq_str = f"{sequence_num:03d}"
    return f"NMC-{cat_code}-{mat_code}-{size_str}-{spec_str}-{seq_str}"

def find_or_create_cnmc(
    db: Session,
    material: Material,
    approved_by_user: str = "Technical Expert"
) -> CommonNationalCode:
    """
    Checks if an existing approved CNMC matches the material's standardized attributes.
    If match exists, REUSES that existing CNMC and maps to it.
    If no match exists, generates a deterministic new CNMC with a unique sequence number.
    Strictly prevents duplicate CNMC codes.
    """
    cat = material.category or "Pipes"
    mat_name = material.material_name or "Stainless Steel"
    size_mm = material.normalized_size_mm
    sch = material.schedule or material.pressure_rating

    # Query for existing approved common material with matching specs
    query = db.query(CommonNationalCode).filter(
        CommonNationalCode.category == cat,
        CommonNationalCode.status == "APPROVED"
    )
    if mat_name:
        query = query.filter(CommonNationalCode.material_family == mat_name)
    if size_mm is not None:
        query = query.filter(CommonNationalCode.size_mm == size_mm)
    if sch:
        query = query.filter(CommonNationalCode.schedule == sch)
        
    existing_cnmc = query.first()
    if existing_cnmc:
        # Reuse existing approved CNMC!
        material.cnmc_id = existing_cnmc.id
        db.commit()
        return existing_cnmc

    # If no exact existing CNMC found, generate unique code
    cat_code = CATEGORY_CODES.get(cat, "GEN")
    mat_code = MATERIAL_CODES.get(mat_name, "ST") if mat_name else "GEN"
    prefix_pattern = f"NMC-{cat_code}-{mat_code}-"
    
    # Find max sequence for this prefix
    similar_codes = db.query(CommonNationalCode).filter(
        CommonNationalCode.cnmc_code.like(f"{prefix_pattern}%")
    ).all()
    
    seq_num = len(similar_codes) + 1
    new_code = format_cnmc_code(cat, mat_name, size_mm, sch, seq_num)
    
    # Guarantee DB uniqueness
    while db.query(CommonNationalCode).filter(CommonNationalCode.cnmc_code == new_code).first():
        seq_num += 1
        new_code = format_cnmc_code(cat, mat_name, size_mm, sch, seq_num)

    std_desc = material.standardized_description or material.normalized_description or material.original_description

    new_cnmc = CommonNationalCode(
        cnmc_code=new_code,
        standardized_description=std_desc,
        category=cat,
        material_family=mat_name,
        grade=material.grade,
        size_mm=size_mm,
        schedule=sch,
        standard=material.standard,
        illustrative_gem_code=f"GEM/2026/M/{new_code[-6:]}",
        illustrative_unspsc_code=f"4017{seq_num:04d}",
        status="APPROVED",
        created_by="MatiSync Deterministic Standardization",
        approved_by=approved_by_user
    )
    
    db.add(new_cnmc)
    db.flush()
    
    material.cnmc_id = new_cnmc.id
    db.commit()
    db.refresh(new_cnmc)
    return new_cnmc
