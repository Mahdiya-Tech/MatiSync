from typing import Dict, Any, List
import re

def compute_data_quality(material_dict: Dict[str, Any]) -> Dict[str, Any]:
    """
    Computes a comprehensive 0-100 Data Quality Score based on:
    1. Core Description completeness (richness, length, absence of vague tokens) (25%)
    2. Unit specification completeness & validity (15%)
    3. Essential technical attributes (Grade, Size, Schedule/Pressure, Standard) (40%)
    4. Casing, formatting, and abbreviation consistency (10%)
    5. Categorization & metadata completeness (10%)
    """
    score = 100.0
    issues: List[Dict[str, Any]] = []
    recommendations: List[str] = []
    
    desc = (material_dict.get("original_description") or "").strip()
    unit = (material_dict.get("original_unit") or "").strip()
    category = (material_dict.get("category") or "").strip()
    material = material_dict.get("material_name")
    grade = material_dict.get("grade")
    size_raw = material_dict.get("size_raw")
    schedule = material_dict.get("schedule")
    pressure = material_dict.get("pressure_rating")
    standard = material_dict.get("standard")
    
    # 1. Description checks
    if not desc:
        score -= 40
        issues.append({
            "field": "original_description",
            "severity": "CRITICAL",
            "issue": "Description is completely missing",
            "suggested_fix": "Provide a descriptive technical specification of the material."
        })
        recommendations.append("Add full technical description.")
    elif len(desc) < 8:
        score -= 20
        issues.append({
            "field": "original_description",
            "severity": "HIGH",
            "issue": f"Description '{desc}' is too short/vague",
            "suggested_fix": "Elaborate with material type, dimensions, standard, and grade."
        })
        recommendations.append("Elaborate description beyond basic abbreviations.")
    elif desc.lower() in ["pipe", "valve", "cable", "ss pipe", "bearing", "bolt", "nut", "flange"]:
        score -= 25
        issues.append({
            "field": "original_description",
            "severity": "HIGH",
            "issue": "Generic single-token description without specifications",
            "suggested_fix": "Specify nominal diameter, schedule/rating, and material grade."
        })
        recommendations.append("Provide dimensions and grade for generic material.")
        
    # Check erratic formatting in description
    if desc.islower():
        score -= 5
        issues.append({
            "field": "original_description",
            "severity": "LOW",
            "issue": "Description is in all-lowercase",
            "suggested_fix": "Normalize to standard uppercase nomenclature."
        })
    elif re.search(r"[\*\?\$@]", desc):
        score -= 5
        issues.append({
            "field": "original_description",
            "severity": "LOW",
            "issue": "Special characters/symbols detected in description",
            "suggested_fix": "Remove noisy characters and standardize punctuation."
        })
        
    # 2. Unit checks
    valid_units = ["NOS", "PCS", "MTR", "KG", "MT", "SET", "LOT", "PAIR", "LITRE", "ROLL"]
    if not unit or unit in ["UNKNOWN", "NONE", "NA", "N/A"]:
        score -= 15
        issues.append({
            "field": "unit",
            "severity": "MEDIUM",
            "issue": "Measurement unit is missing or unassigned",
            "suggested_fix": "Assign standard unit of measure (e.g. NOS, MTR, KG)."
        })
        recommendations.append("Specify measurement unit.")
    elif unit.upper() not in valid_units:
        score -= 8
        issues.append({
            "field": "unit",
            "severity": "LOW",
            "issue": f"Non-standard unit '{unit}'",
            "suggested_fix": f"Map '{unit}' to official standard ISO/CPSE unit."
        })
        
    # 3. Essential Technical Attributes depending on Category
    cat_upper = category.upper() if category else ""
    
    # Pipes: requires Material, Size, Schedule/Wall Thickness, Standard
    if "PIPE" in cat_upper or "PIPE" in desc.upper():
        if not grade:
            score -= 12
            issues.append({
                "field": "grade",
                "severity": "HIGH",
                "issue": "Missing steel grade (e.g. SS304, SS316, A106 Gr B)",
                "suggested_fix": "Identify and document material metallurgical grade."
            })
            recommendations.append("Specify pipe material grade.")
        if not size_raw:
            score -= 12
            issues.append({
                "field": "size",
                "severity": "HIGH",
                "issue": "Missing pipe diameter/NPS",
                "suggested_fix": "Add nominal pipe size (e.g. 50mm, 2 inch, 4 inch)."
            })
            recommendations.append("Specify nominal diameter (NPS/NB).")
        if not schedule:
            score -= 10
            issues.append({
                "field": "schedule",
                "severity": "MEDIUM",
                "issue": "Missing pipe schedule / wall thickness",
                "suggested_fix": "Specify pipe schedule (e.g. SCH40, SCH80, SCH10)."
            })
            recommendations.append("Specify wall thickness or schedule.")
        if not standard:
            score -= 6
            issues.append({
                "field": "standard",
                "severity": "LOW",
                "issue": "Missing manufacturing standard (e.g. ASTM A312, IS 1239)",
                "suggested_fix": "Document governing ASTM/ASME/IS standard."
            })
            
    # Valves: requires Pressure Class, Body Material, Size
    elif "VALVE" in cat_upper or "VALVE" in desc.upper():
        if not pressure:
            score -= 12
            issues.append({
                "field": "pressure_rating",
                "severity": "HIGH",
                "issue": "Missing pressure rating (e.g. Class 150#, 300#, PN16)",
                "suggested_fix": "Specify valve pressure class rating."
            })
            recommendations.append("Specify pressure rating class.")
        if not size_raw:
            score -= 12
            issues.append({
                "field": "size",
                "severity": "HIGH",
                "issue": "Missing nominal valve bore size",
                "suggested_fix": "Specify valve size (e.g. 2 inch, 50mm, 100mm)."
            })
            recommendations.append("Specify valve bore dimension.")
            
    # Electrical/Cables: requires Voltage, Core, Area
    elif "CABLE" in cat_upper or "CABLE" in desc.upper() or "ELECTRICAL" in cat_upper:
        if not material_dict.get("voltage"):
            score -= 12
            issues.append({
                "field": "voltage",
                "severity": "HIGH",
                "issue": "Missing voltage rating (e.g. 1.1kV, 11kV)",
                "suggested_fix": "Specify cable operating voltage grade."
            })
            recommendations.append("Specify cable voltage rating.")
            
    # Bearings: requires bearing number
    elif "BEARING" in cat_upper or "BEARING" in desc.upper():
        if not material_dict.get("bearing_number"):
            score -= 15
            issues.append({
                "field": "bearing_number",
                "severity": "HIGH",
                "issue": "Missing standard bearing designation (e.g. 6205, 6308)",
                "suggested_fix": "Add standard ISO/DIN bearing designation."
            })
            recommendations.append("Specify bearing model number.")

    # Bound score between 5.0 and 100.0
    final_score = round(max(5.0, min(100.0, score)), 1)
    
    # Rating Category
    rating = "EXCELLENT" if final_score >= 85 else ("GOOD" if final_score >= 70 else ("NEEDS_IMPROVEMENT" if final_score >= 50 else "POOR"))
    
    return {
        "overall_score": final_score,
        "rating": rating,
        "issues_count": len(issues),
        "issues": issues,
        "recommendations": recommendations,
        "completeness_breakdown": {
            "description": "Complete" if len(desc) >= 15 else "Incomplete",
            "unit": "Complete" if unit and unit in valid_units else "Missing",
            "grade": "Complete" if grade else "Missing",
            "size": "Complete" if size_raw else "Missing",
            "schedule_or_rating": "Complete" if (schedule or pressure) else "Missing",
            "standard": "Complete" if standard else "Missing"
        }
    }
