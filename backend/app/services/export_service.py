import csv
import io
import json
from typing import List, Dict, Any

def export_materials_to_csv(materials_data: List[Dict[str, Any]]) -> str:
    """Generates RFC 4180 compliant CSV stream for materials"""
    output = io.StringIO()
    fields = [
        "material_code", "cpse_code", "original_description", "normalized_description",
        "category", "original_unit", "material_name", "grade", "size_raw",
        "normalized_size_mm", "schedule", "standard", "annual_quantity", "annual_spend",
        "data_quality_score", "status", "cnmc_code"
    ]
    writer = csv.DictWriter(output, fieldnames=fields, extrasaction="ignore")
    writer.writeheader()
    for row in materials_data:
        writer.writerow(row)
    return output.getvalue()

def export_audit_to_csv(audit_data: List[Dict[str, Any]]) -> str:
    """Generates CSV stream for tamper-evident audit logs"""
    output = io.StringIO()
    fields = [
        "sequence_num", "timestamp", "user_email", "user_role", "action",
        "entity_type", "entity_id", "reason", "previous_entry_hash", "entry_hash"
    ]
    writer = csv.DictWriter(output, fieldnames=fields, extrasaction="ignore")
    writer.writeheader()
    for row in audit_data:
        writer.writerow(row)
    return output.getvalue()

def export_matches_to_csv(matches_data: List[Dict[str, Any]]) -> str:
    """Generates CSV stream for material match comparison results"""
    output = io.StringIO()
    fields = [
        "match_id", "material_a_code", "cpse_a", "material_b_code", "cpse_b",
        "relationship_type", "ai_score", "text_score", "attribute_score",
        "technical_compatibility_score", "decision", "has_critical_conflict"
    ]
    writer = csv.DictWriter(output, fieldnames=fields, extrasaction="ignore")
    writer.writeheader()
    for row in matches_data:
        writer.writerow(row)
    return output.getvalue()
