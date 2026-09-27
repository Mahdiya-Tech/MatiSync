import unittest
import json
from app.services.normalizer import normalize_text, normalize_unit, evaluate_size_tolerance
from app.services.extractor import extract_attributes
from app.services.conflict_detector import detect_technical_conflicts
from app.services.data_quality import compute_data_quality
from app.services.matching_engine import HybridMatchingEngine
from app.services.audit_service import calculate_entry_hash, GENESIS_HASH

class TestMatiSyncCore(unittest.TestCase):

    def test_normalization_and_tolerances(self):
        # 1. Text normalization
        raw = "ss pipe   2 inch  sch 40, ASTM A312"
        norm = normalize_text(raw)
        self.assertIn("STAINLESS STEEL", norm)
        self.assertIn("2INCH", norm)
        self.assertIn("SCH40", norm)

        # 2. Engineering Tolerance: 2 inch vs 50.8 mm vs 50 mm
        eval_exact = evaluate_size_tolerance("2 INCH", "50.8 MM")
        self.assertTrue(eval_exact["is_exact_equal"])
        self.assertTrue(eval_exact["is_near_equivalent"])

        eval_nom = evaluate_size_tolerance("50 MM", "2 INCH")
        self.assertTrue(eval_nom["is_near_equivalent"])
        self.assertIn("Nominal Bore", eval_nom["tolerance_rule_used"])

    def test_attribute_extraction(self):
        desc = "SS PIPE 50MM SCH40 ASTM A312 TP304"
        attrs = extract_attributes(desc, "Pipes")
        self.assertEqual(attrs["material_name"], "Stainless Steel")
        self.assertEqual(attrs["grade"], "SS304")
        self.assertEqual(attrs["schedule"], "SCH40")
        self.assertEqual(attrs["standard"], "ASTM A312")
        self.assertEqual(attrs["normalized_size_mm"], 50.0)

        # Valve extraction
        v_desc = "BALL VALVE 2 INCH CLASS 150# FLANGED SS316 L&T"
        v_attrs = extract_attributes(v_desc, "Valves")
        self.assertEqual(v_attrs["material_name"], "Stainless Steel")
        self.assertEqual(v_attrs["grade"], "SS316")
        self.assertEqual(v_attrs["pressure_rating"], "CLASS150#")
        self.assertEqual(v_attrs["manufacturer"], "L&T")

    def test_technical_conflict_override(self):
        # Critical test case: SCH40 vs SCH80
        mat_a = {"schedule": "SCH40", "grade": "SS304", "material_name": "Stainless Steel", "size_raw": "50 MM"}
        mat_b = {"schedule": "SCH80", "grade": "SS304", "material_name": "Stainless Steel", "size_raw": "50 MM"}
        
        conf = detect_technical_conflicts(mat_a, mat_b)
        self.assertTrue(conf["has_critical_conflict"])
        self.assertEqual(conf["recommended_override_status"], "Technical Review Required")
        self.assertEqual(conf["conflicts"][0]["conflict_field"], "schedule")

        # Test hybrid matching with override
        engine = HybridMatchingEngine()
        dict_a = {
            "original_description": "SS PIPE 50MM SCH40",
            **mat_a
        }
        dict_b = {
            "original_description": "SS PIPE 50MM SCH80",
            **mat_b
        }
        res = engine.compare_materials(dict_a, dict_b)
        self.assertEqual(res["relationship_type"], "Technical Review Required")
        self.assertTrue(res["has_critical_conflict"])

    def test_data_quality_scoring(self):
        # Complete record
        good = {
            "original_description": "STAINLESS STEEL PIPE 50.8 MM SCH 40 ASTM A312 TP304",
            "original_unit": "MTR",
            "category": "Pipes",
            "material_name": "Stainless Steel",
            "grade": "SS304",
            "size_raw": "50.8 MM",
            "schedule": "SCH40",
            "standard": "ASTM A312"
        }
        res_good = compute_data_quality(good)
        self.assertGreaterEqual(res_good["overall_score"], 85.0)

        # Incomplete record
        poor = {
            "original_description": "SS PIPE",
            "original_unit": "NONE",
            "category": "Pipes"
        }
        res_poor = compute_data_quality(poor)
        self.assertLess(res_poor["overall_score"], 50.0)
        self.assertGreater(len(res_poor["issues"]), 0)

    def test_tamper_evident_hash_chain(self):
        prev = GENESIS_HASH
        h1 = calculate_entry_hash(prev, 1, "2026-09-26T12:00:00", "admin@demo.com", "INIT", "SYS", "01", "payloadA")
        h2 = calculate_entry_hash(h1, 2, "2026-09-26T12:01:00", "admin@demo.com", "UPLOAD", "MAT", "02", "payloadB")
        
        # Tampered payload in entry 1
        tampered_h1 = calculate_entry_hash(prev, 1, "2026-09-26T12:00:00", "admin@demo.com", "INIT", "SYS", "01", "TAMPERED_PAYLOAD")
        self.assertNotEqual(h1, tampered_h1)

    def test_cnmc_deterministic_formatting(self):
        from app.services.cnmc_generator import format_cnmc_code
        code = format_cnmc_code(
            category="Pipes",
            material_name="Stainless Steel",
            size_mm=50.8,
            schedule_or_spec="SCH40",
            sequence_num=1
        )
        self.assertEqual(code, "NMC-PIP-SS-051-S40-001")

        val_code = format_cnmc_code(
            category="Valves",
            material_name="Stainless Steel",
            size_mm=50.0,
            schedule_or_spec="CLASS 150#",
            sequence_num=4
        )
        self.assertEqual(val_code, "NMC-VAL-SS-050-C150-004")

    def test_api_client_schemas_and_endpoints(self):
        from app.main import app
        from fastapi.testclient import TestClient
        client = TestClient(app)

        # Health
        res = client.get("/health")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["status"], "healthy")

        # Global search
        search_res = client.get("/api/search/global?q=PIPE")
        self.assertEqual(search_res.status_code, 200)
        self.assertGreater(search_res.json()["total_found"], 0)

        # Materials search
        mat_search = client.get("/api/materials/search?q=PIPE")
        self.assertEqual(mat_search.status_code, 200)
        self.assertGreater(mat_search.json()["total"], 0)

        # Audit verify
        audit_ver = client.post("/api/audit/verify")
        self.assertEqual(audit_ver.status_code, 200)
        self.assertTrue(audit_ver.json()["is_valid"])

        # ERP Mock Sync
        erp_res = client.post("/api/integrations/sap/sync", json={"target_system": "SAP_S4HANA", "cpse_code": "CPCL"})
        self.assertEqual(erp_res.status_code, 200)
        self.assertEqual(erp_res.json()["status"], "SUCCESS")

if __name__ == "__main__":
    unittest.main()

