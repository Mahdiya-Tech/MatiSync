from typing import Dict, Any, List, Optional
from .normalizer import evaluate_size_tolerance

def detect_technical_conflicts(
    mat_a: Dict[str, Any],
    mat_b: Dict[str, Any],
    sector: str = "oil_and_gas"
) -> Dict[str, Any]:
    """
    Examines two materials for physical and engineering conflicts.
    CRITICAL RULE: A single critical technical conflict MUST override high similarity
    and force the relationship to 'Technical Review Required'.
    """
    conflicts: List[Dict[str, Any]] = []
    has_critical_conflict = False
    
    # 1. Schedule Conflict (Piping / Tubing)
    sch_a = (mat_a.get("schedule") or "").upper().strip()
    sch_b = (mat_b.get("schedule") or "").upper().strip()
    if sch_a and sch_b and sch_a != sch_b:
        # e.g. SCH40 vs SCH80
        has_critical_conflict = True
        conflicts.append({
            "conflict_field": "schedule",
            "value_a": sch_a,
            "value_b": sch_b,
            "severity": "CRITICAL",
            "rule_name": "Pipe Schedule Incompatibility Rule",
            "description": f"Critical wall thickness conflict: {sch_a} vs {sch_b}. Different schedules have different pressure ratings and flow capacities; they are NOT technically interchangeable."
        })
        
    # 2. Material Metallurgy / Family Conflict
    mat_name_a = (mat_a.get("material_name") or "").upper().strip()
    mat_name_b = (mat_b.get("material_name") or "").upper().strip()
    if mat_name_a and mat_name_b and mat_name_a != mat_name_b:
        has_critical_conflict = True
        conflicts.append({
            "conflict_field": "material_name",
            "value_a": mat_name_a,
            "value_b": mat_name_b,
            "severity": "CRITICAL",
            "rule_name": "Base Material Incompatibility Rule",
            "description": f"Base metallurgy mismatch: '{mat_name_a}' vs '{mat_name_b}'. Materials cannot be merged across different metallic families."
        })
        
    # 3. Grade Incompatibility (e.g. SS304 vs SS316, or A106 Gr B vs A333)
    grade_a = (mat_a.get("grade") or "").upper().strip()
    grade_b = (mat_b.get("grade") or "").upper().strip()
    if grade_a and grade_b and grade_a != grade_b:
        # Check if they are non-interchangeable
        incompatible_pairs = [
            ({"SS304", "SS316"}, "SS316 contains Molybdenum for severe chemical/marine corrosion resistance, whereas SS304 does not."),
            ({"SS304L", "SS316L"}, "SS316L provides superior pitting resistance compared to SS304L."),
            ({"A106 GR B", "A333 GR 6"}, "A333 Gr 6 is low-temperature carbon steel impact tested to -45°C; A106 is for high-temperature service."),
            ({"GRADE 8.8", "GRADE 10.9"}, "Grade 10.9 fasteners have higher tensile proof strength (1040 MPa vs 830 MPa)."),
            ({"GRADE B7", "GRADE 2H"}, "B7 refers to alloy steel studs while 2H refers to heavy hex nuts.")
        ]
        
        pair_set = {grade_a, grade_b}
        desc_reason = f"Distinct metallurgical grades {grade_a} and {grade_b} have differing tensile, yield, or corrosion properties."
        for p, r in incompatible_pairs:
            if pair_set == p or all(x in pair_set for x in p):
                desc_reason = r
                break
                
        has_critical_conflict = True
        conflicts.append({
            "conflict_field": "grade",
            "value_a": grade_a,
            "value_b": grade_b,
            "severity": "CRITICAL",
            "rule_name": "Metallurgical Grade Incompatibility Rule",
            "description": desc_reason
        })
        
    # 4. Pressure Rating / Class Conflict
    press_a = (mat_a.get("pressure_rating") or "").upper().strip()
    press_b = (mat_b.get("pressure_rating") or "").upper().strip()
    if press_a and press_b and press_a != press_b:
        # e.g. 150# vs 300# or CLASS 150 vs CLASS 300
        has_critical_conflict = True
        conflicts.append({
            "conflict_field": "pressure_rating",
            "value_a": press_a,
            "value_b": press_b,
            "severity": "CRITICAL",
            "rule_name": "ASME Pressure Rating Class Incompatibility Rule",
            "description": f"Pressure class rating discrepancy: {press_a} vs {press_b}. Flange bolt patterns and pressure containment limits differ."
        })
        
    # 5. Size / Diameter Conflict (using engineering tolerance)
    size_a = mat_a.get("size_raw")
    size_b = mat_b.get("size_raw")
    if size_a and size_b:
        size_eval = evaluate_size_tolerance(size_a, size_b)
        if not size_eval["is_exact_equal"] and not size_eval["is_near_equivalent"]:
            has_critical_conflict = True
            conflicts.append({
                "conflict_field": "size",
                "value_a": str(size_a),
                "value_b": str(size_b),
                "severity": "CRITICAL",
                "rule_name": "Dimensional Variance Rule",
                "description": f"Size mismatch exceeds engineering tolerance: {size_a} vs {size_b}. Difference: {size_eval.get('difference_mm')} mm."
            })
            
    # 6. Electrical Voltage Conflict (if cables/motors)
    volt_a = (mat_a.get("voltage") or "").upper().strip()
    volt_b = (mat_b.get("voltage") or "").upper().strip()
    if volt_a and volt_b and volt_a != volt_b:
        has_critical_conflict = True
        conflicts.append({
            "conflict_field": "voltage",
            "value_a": volt_a,
            "value_b": volt_b,
            "severity": "CRITICAL",
            "rule_name": "Dielectric Voltage Rating Rule",
            "description": f"Voltage class conflict: {volt_a} vs {volt_b}. Insulation level is incompatible."
        })
        
    # 7. Standards Conflict (WARNING level unless critical)
    std_a = (mat_a.get("standard") or "").upper().strip()
    std_b = (mat_b.get("standard") or "").upper().strip()
    if std_a and std_b and std_a != std_b:
        # e.g. ASTM A312 vs IS 1239
        conflicts.append({
            "conflict_field": "standard",
            "value_a": std_a,
            "value_b": std_b,
            "severity": "WARNING",
            "rule_name": "Manufacturing Standard Discrepancy",
            "description": f"Different standards specified: {std_a} vs {std_b}. Requires engineering review of chemical/mechanical equivalence."
        })

    return {
        "has_conflicts": len(conflicts) > 0,
        "has_critical_conflict": has_critical_conflict,
        "conflicts_count": len(conflicts),
        "conflicts": conflicts,
        "override_required": has_critical_conflict,
        "recommended_override_status": "Technical Review Required" if has_critical_conflict else None
    }
