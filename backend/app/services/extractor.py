import re
from typing import Dict, Any, List

def extract_attributes(description: str, category_hint: str = None) -> Dict[str, Any]:
    """
    Extracts structured engineering attributes using regex patterns, rule-based dictionaries,
    and heuristics for pipes, valves, pumps, electrical cables, bearings, and fasteners.
    """
    desc = description.upper()
    extracted = {
        "material_name": None,
        "grade": None,
        "size_raw": None,
        "normalized_size_mm": None,
        "schedule": None,
        "pressure_rating": None,
        "temperature_rating": None,
        "standard": None,
        "voltage": None,
        "bearing_number": None,
        "fastener_grade": None,
        "cable_spec": None,
        "manufacturer": None,
        "attributes_list": []
    }
    
    # 1. Material Name
    materials = [
        (r"\b(STAINLESS STEEL|SS\d+|SS|S\.S\.)\b", "Stainless Steel"),
        (r"\b(CARBON STEEL|CS\d+|CS|C\.S\.)\b", "Carbon Steel"),
        (r"\b(MILD STEEL|MS\d+|MS|M\.S\.)\b", "Mild Steel"),
        (r"\b(ALLOY STEEL|AS)\b", "Alloy Steel"),
        (r"\b(CAST IRON|CI)\b", "Cast Iron"),
        (r"\b(COPPER|CU)\b", "Copper"),
        (r"\b(ALUMINIUM|ALUMINUM|AL)\b", "Aluminium"),
        (r"\b(BRONZE|GUNMETAL)\b", "Bronze"),
        (r"\b(PTFE|TEFLON)\b", "PTFE"),
    ]
    for pattern, name in materials:
        if re.search(pattern, desc):
            extracted["material_name"] = name
            extracted["attributes_list"].append({"name": "Material", "value": name, "confidence": 0.95})
            break
            
    # 2. Grade
    grades = [
        # Stainless steel grades
        (r"\b(304L|SS304L|TP304L)\b", "SS304L"),
        (r"\b(316L|SS316L|TP316L)\b", "SS316L"),
        (r"\b(304H|SS304H)\b", "SS304H"),
        (r"\b(316H|SS316H)\b", "SS316H"),
        (r"\b(304|SS304|TP304)\b", "SS304"),
        (r"\b(316|SS316|TP316)\b", "SS316"),
        (r"\b(321|SS321)\b", "SS321"),
        (r"\b(347|SS347)\b", "SS347"),
        (r"\b(DUPLEX 2205|UNS S31803)\b", "Duplex 2205"),
        # Carbon steel grades
        (r"\b(A106\s*GR\.?\s*B|A106-B|A106B)\b", "A106 Gr B"),
        (r"\b(A53\s*GR\.?\s*B|A53-B|A53B)\b", "A53 Gr B"),
        (r"\b(A333\s*GR\.?\s*6|A333-6)\b", "A333 Gr 6"),
        (r"\b(A216\s*WCB|WCB)\b", "WCB"),
        (r"\b(A105|ASTM\s*A105)\b", "A105"),
        (r"\b(A193\s*B7|B7)\b", "Grade B7"),
        (r"\b(A194\s*2H|2H)\b", "Grade 2H"),
        (r"\b(GRADE\s*8\.8|GR\s*8\.8|8\.8)\b", "Grade 8.8"),
        (r"\b(GRADE\s*10\.9|GR\s*10\.9|10\.9)\b", "Grade 10.9"),
    ]
    for pattern, grade in grades:
        if re.search(pattern, desc):
            extracted["grade"] = grade
            extracted["attributes_list"].append({"name": "Grade", "value": grade, "confidence": 0.98})
            break
            
    # 3. Schedule / Wall Thickness
    sch_match = re.search(r"\b(SCH(?:EDULE)?\s*(\d+[A-Z]?|XXS|XS|STD))\b", desc)
    if sch_match:
        val = f"SCH{sch_match.group(2)}"
        extracted["schedule"] = val
        extracted["attributes_list"].append({"name": "Schedule", "value": val, "confidence": 0.98})
        
    # 4. Standards (ASTM, ASME, IS, DIN, API, ISO, BS)
    std_match = re.search(r"\b(ASTM\s*[A-Z]\d+(?:\s*M)?|ASME\s*[A-Z0-9\.]+|IS\s*\d+(?:\s*PART\s*\d+)?|DIN\s*\d+|API\s*\d+[A-Z]?|BS\s*\d+|ISO\s*\d+)\b", desc)
    if std_match:
        val = std_match.group(1).strip()
        extracted["standard"] = val
        extracted["attributes_list"].append({"name": "Standard", "value": val, "confidence": 0.95})

    # 5. Pressure Class / Rating
    press_match = re.search(r"\b(CLASS\s*\d+#?|#\s*\d+|\d+\s*#|PN\s*\d+|\d+\s*BAR|\d+\s*PSI)", desc)
    if press_match:
        raw_p = press_match.group(1).replace(" ", "")
        extracted["pressure_rating"] = raw_p
        extracted["attributes_list"].append({"name": "Pressure Rating", "value": raw_p, "confidence": 0.92})

    # 6. Dimensions / Size (Metric or Imperial)
    # Check 50MM or 50.8 MM or 2 INCH
    size_inch_match = re.search(r'(\d+(?:[/\- ]\d+)?(?:\.\d+)?)\s*(?:INCH|IN|")\b', desc)
    size_mm_match = re.search(r'(\d+(?:\.\d+)?)\s*MM\b', desc)
    
    if size_inch_match:
        s_raw = f"{size_inch_match.group(1)} INCH"
        extracted["size_raw"] = s_raw
        # convert to mm
        inch_str = size_inch_match.group(1).replace(" ", "-")
        try:
            if "/" in inch_str:
                parts = inch_str.split("/")
                val_inch = float(parts[0]) / float(parts[1])
            else:
                val_inch = float(inch_str)
            extracted["normalized_size_mm"] = round(val_inch * 25.4, 2)
        except Exception:
            pass
        extracted["attributes_list"].append({"name": "Size", "value": s_raw, "confidence": 0.95})
    elif size_mm_match:
        s_raw = f"{size_mm_match.group(1)} MM"
        extracted["size_raw"] = s_raw
        try:
            extracted["normalized_size_mm"] = float(size_mm_match.group(1))
        except Exception:
            pass
        extracted["attributes_list"].append({"name": "Size", "value": s_raw, "confidence": 0.95})

    # 7. Electrical Specs (Voltage, Core, Sqmm)
    volt_match = re.search(r"\b(\d+(?:\.\d+)?\s*(?:KV|VOLT|V))\b", desc)
    if volt_match:
        extracted["voltage"] = volt_match.group(1).replace(" ", "")
        extracted["attributes_list"].append({"name": "Voltage", "value": extracted["voltage"], "confidence": 0.95})
        
    cable_match = re.search(r"\b(\d+(?:\.5)?\s*C(?:ORE)?\s*(?:X|\*)\s*(\d+(?:\.\d+)?)\s*(?:SQMM|SQ\.MM|MM2))\b", desc)
    if cable_match:
        val = f"{cable_match.group(1)}"
        extracted["cable_spec"] = val
        extracted["attributes_list"].append({"name": "Cable Config", "value": val, "confidence": 0.96})

    # 8. Bearing designations (e.g. 6205-2RS, 6308 C3, 22216 EK)
    bearing_match = re.search(r"\b(\d{4,5}(?:-[A-Z0-9]+|\s+[A-Z0-9]+)?)\b", desc)
    if bearing_match and ("BEARING" in desc or category_hint == "Bearings"):
        b_val = bearing_match.group(1)
        extracted["bearing_number"] = b_val
        extracted["attributes_list"].append({"name": "Bearing Number", "value": b_val, "confidence": 0.94})

    # 9. Fastener Bolt thread / size
    fastener_match = re.search(r"\b(M\d+(?:\s*[X*]\s*\d+)?)\b", desc)
    if fastener_match and ("BOLT" in desc or "STUD" in desc or "SCREW" in desc or category_hint == "Fasteners"):
        val = fastener_match.group(1)
        extracted["fastener_grade"] = val
        extracted["attributes_list"].append({"name": "Fastener Size", "value": val, "confidence": 0.95})

    # 10. Manufacturer identification (synthetic / real OEMs)
    mfg_list = ["L&T", "KBL", "BHEL", "SKF", "FAG", "TIMKEN", "KSB", "AUDCO", "SWAGELOK", "CROMPTON", "HAVELLS", "POLYCAB", "JINDAL", "TATA"]
    for mfg in mfg_list:
        if re.search(rf"\b{mfg}\b", desc):
            extracted["manufacturer"] = mfg
            extracted["attributes_list"].append({"name": "Manufacturer", "value": mfg, "confidence": 0.90})
            break

    return extracted
