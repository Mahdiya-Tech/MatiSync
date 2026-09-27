import re
from typing import Dict, Any, Tuple

# Common abbreviation dictionary for CPSE material masters
ABBREVIATIONS: Dict[str, str] = {
    r"\bSS\b": "STAINLESS STEEL",
    r"\bS\.S\.\b": "STAINLESS STEEL",
    r"\bSTL SS\b": "STAINLESS STEEL",
    r"\bCS\b": "CARBON STEEL",
    r"\bC\.S\.\b": "CARBON STEEL",
    r"\bMS\b": "MILD STEEL",
    r"\bM\.S\.\b": "MILD STEEL",
    r"\bAS\b": "ALLOY STEEL",
    r"\bCI\b": "CAST IRON",
    r"\bGI\b": "GALVANIZED IRON",
    r"\bFLG\b": "FLANGED",
    r"\bFLGD\b": "FLANGED",
    r"\bSCR\b": "SCREWED",
    r"\bBW\b": "BUTT WELD",
    r"\bSW\b": "SOCKET WELD",
    r"\bSCH\b": "SCH",
    r"\bSCH\.\b": "SCH",
    r"\bS-\b": "SCH",
    r"\bTHK\b": "THICKNESS",
    r"\bDIA\b": "DIAMETER",
    r"\bOD\b": "OUTSIDE DIAMETER",
    r"\bID\b": "INSIDE DIAMETER",
    r"\bSTD\b": "STANDARD",
    r"\bSPEC\b": "SPECIFICATION",
    r"\bNBR\b": "NITRILE",
    r"\bPTFE\b": "TEFLON PTFE",
    r"\bFKM\b": "VITON FKM",
    r"\bTEMP\b": "TEMPERATURE",
    r"\bPRESS\b": "PRESSURE",
}

# Unit normalizations
UNIT_NORMALIZATION = {
    "NO": "NOS",
    "NOS": "NOS",
    "NUM": "NOS",
    "NUMBER": "NOS",
    "PC": "PCS",
    "PCS": "PCS",
    "PIECE": "PCS",
    "MTR": "MTR",
    "M": "MTR",
    "METER": "MTR",
    "METERS": "MTR",
    "FT": "FT",
    "FEET": "FT",
    "KG": "KG",
    "KGS": "KG",
    "KILOGRAM": "KG",
    "TON": "MT",
    "MT": "MT",
    "SET": "SET",
    "SETS": "SET",
    "LOT": "LOT",
    "PAIR": "PAIR",
}

# Engineering nominal pipe size mapping (NPS inches to standard nominal mm and exact mm)
NPS_MAPPING = {
    "1/8": (6.0, 3.175),
    "1/4": (8.0, 6.35),
    "3/8": (10.0, 9.525),
    "1/2": (15.0, 12.7),
    "3/4": (20.0, 19.05),
    "1": (25.0, 25.4),
    "1.25": (32.0, 31.75),
    "1-1/4": (32.0, 31.75),
    "1 1/4": (32.0, 31.75),
    "1.5": (40.0, 38.1),
    "1-1/2": (40.0, 38.1),
    "1 1/2": (40.0, 38.1),
    "2": (50.0, 50.8),
    "2.5": (65.0, 63.5),
    "2-1/2": (65.0, 63.5),
    "2 1/2": (65.0, 63.5),
    "3": (80.0, 76.2),
    "4": (100.0, 101.6),
    "5": (125.0, 127.0),
    "6": (150.0, 152.4),
    "8": (200.0, 203.2),
    "10": (250.0, 254.0),
    "12": (300.0, 304.8),
}

def normalize_text(text: str) -> str:
    """
    Standardize capitalization, spacing, punctuation, and common abbreviations.
    Original text is always preserved separately.
    """
    if not text:
        return ""
    
    clean = text.upper().strip()
    
    # Replace special separators with space
    clean = re.sub(r"[\t\r\n]+", " ", clean)
    clean = re.sub(r"\s*,\s*", ", ", clean)
    clean = re.sub(r"\s*;\s*", " ; ", clean)
    clean = re.sub(r"\s*\|\s*", " | ", clean)
    
    # Replace abbreviations
    for pattern, replacement in ABBREVIATIONS.items():
        clean = re.sub(pattern, replacement, clean, flags=re.IGNORECASE)
    
    # Standardize dimensions: e.g. 50 MM -> 50MM, 2 INCH -> 2INCH
    clean = re.sub(r"(\d+(?:\.\d+)?)\s*(MM|MILLIMETER|MILLIMETRE)", r"\1MM", clean)
    clean = re.sub(r'(\d+(?:\.\d+)?)\s*(?:INCH|IN|")\b', r"\1INCH", clean)
    clean = re.sub(r'(\d+(?:\.\d+)?)\s*#', r"\1#", clean)
    clean = re.sub(r'\bSCH\s*(\d+[A-Z]?)', r"SCH\1", clean)
    
    # Collapse multiple spaces
    clean = re.sub(r"\s+", " ", clean).strip()
    return clean

def normalize_unit(unit_str: str) -> str:
    """Normalize procurement measurement units"""
    if not unit_str:
        return "NOS"
    u = unit_str.strip().upper()
    return UNIT_NORMALIZATION.get(u, u)

def evaluate_size_tolerance(size_a_str: str, size_b_str: str) -> Dict[str, Any]:
    """
    Evaluates size compatibility taking into account engineering conversion.
    2 inch = 50.8 mm.
    In nominal piping: 2 inch NPS corresponds to 50 mm NB.
    Strictly: 50.0 mm != 50.8 mm, but near-equivalent under nominal piping schedule rules.
    """
    result = {
        "is_exact_equal": False,
        "is_near_equivalent": False,
        "tolerance_rule_used": None,
        "size_a_normalized_mm": None,
        "size_b_normalized_mm": None,
        "difference_mm": None,
        "explanation": ""
    }
    
    if not size_a_str or not size_b_str:
        result["explanation"] = "One or both size values are missing"
        return result
        
    s_a = size_a_str.upper().strip()
    s_b = size_b_str.upper().strip()
    
    if s_a == s_b:
        result["is_exact_equal"] = True
        result["is_near_equivalent"] = True
        result["explanation"] = "Exact text match"
        return result

    # Extract numeric and unit
    def parse_size_to_mm(val: str) -> Tuple[float, float, str]:
        # returns (nominal_mm, exact_mm, unit)
        # Check inches
        inch_match = re.search(r'(\d+(?:[/\- ]\d+)?(?:\.\d+)?)\s*(?:INCH|IN|"|\b)', val)
        mm_match = re.search(r'(\d+(?:\.\d+)?)\s*MM\b', val)
        
        if mm_match:
            v = float(mm_match.group(1))
            return v, v, "MM"
            
        if inch_match:
            raw_inch = inch_match.group(1).replace(" ", "-")
            if raw_inch in NPS_MAPPING:
                nom_mm, exact_mm = NPS_MAPPING[raw_inch]
                return nom_mm, exact_mm, "INCH"
            try:
                # evaluate fraction like 1/2
                if "/" in raw_inch:
                    parts = raw_inch.split("/")
                    num_inch = float(parts[0]) / float(parts[1])
                else:
                    num_inch = float(raw_inch)
                return num_inch * 25.4, num_inch * 25.4, "INCH"
            except Exception:
                pass
                
        # default plain number
        num_only = re.search(r'(\d+(?:\.\d+)?)', val)
        if num_only:
            v = float(num_only.group(1))
            return v, v, "RAW"
            
        return None, None, "UNKNOWN"

    nom_a, exact_a, unit_a = parse_size_to_mm(s_a)
    nom_b, exact_b, unit_b = parse_size_to_mm(s_b)
    
    result["size_a_normalized_mm"] = exact_a or nom_a
    result["size_b_normalized_mm"] = exact_b or nom_b
    
    if (nom_a is not None or exact_a is not None) and (nom_b is not None or exact_b is not None):
        diff = abs((exact_a or nom_a) - (exact_b or nom_b))
        result["difference_mm"] = round(diff, 3)
        
        if diff < 0.001:
            result["is_exact_equal"] = True
            result["is_near_equivalent"] = True
            result["explanation"] = f"Values {s_a} and {s_b} evaluate to identical metric dimensions ({exact_a} mm)."
        elif (nom_a == nom_b) or (abs(nom_a - nom_b) <= 2.0 and ("INCH" in (unit_a, unit_b) or "MM" in (unit_a, unit_b))):
            result["is_near_equivalent"] = True
            result["tolerance_rule_used"] = "Engineering Rule: Nominal Bore (NB/NPS) Correspondence (ASME B36.10M)"
            result["explanation"] = (
                f"Engineering Conversion Rule Applied: {s_a} ({result['size_a_normalized_mm']} mm) "
                f"vs {s_b} ({result['size_b_normalized_mm']} mm). "
                f"Nominal 50 mm vs 2 inch (50.8 mm) are near-equivalent under configured nominal pipe size tolerance."
            )
        else:
            result["explanation"] = f"Dimension difference ({diff:.2f} mm) exceeds configured tolerance threshold."
            
    return result
