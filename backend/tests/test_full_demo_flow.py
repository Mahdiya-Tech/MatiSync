import unittest
import json
import sys
from fastapi.testclient import TestClient
from app.main import app

class TestFullDemoFlow(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_complete_connected_lifecycle(self):
        # 1. Login
        login_res = self.client.post("/api/auth/login", json={"email": "admin@demo.com", "password": "demo123"})
        self.assertEqual(login_res.status_code, 200)
        auth_data = login_res.json()
        self.assertIn("access_token", auth_data)
        self.assertEqual(auth_data["user"]["role"], "Admin")

        # 2. Verify Initial Dashboard KPIs
        kpi_res = self.client.get("/api/dashboard/kpis")
        self.assertEqual(kpi_res.status_code, 200)
        kpi_initial = kpi_res.json()
        self.assertGreater(kpi_initial["total_materials"], 0)

        # 3. Search-Before-Create (Pre-Creation duplicate interception)
        sbc_res = self.client.post("/api/materials/search-before-create", json={
            "description": "SS PIPE 50MM SCH40",
            "category": "Pipes & Tubes"
        })
        self.assertEqual(sbc_res.status_code, 200)
        sbc_data = sbc_res.json()
        self.assertIn("recommended_action", sbc_data)
        self.assertIn("top_matches", sbc_data)
        if len(sbc_data["top_matches"]) > 0:
            self.assertIn("similarity_score", sbc_data["top_matches"][0])

        # 4. Material Creation & Validation (Normalized, Attributes, Quality Score)
        import time
        test_code = f"CP-TEST-{int(time.time() * 1000)}"
        new_mat_payload = {
            "cpse_id": 1,
            "material_code": test_code,
            "description": "STAINLESS STEEL SEAMLESS PIPE 2 INCH SCH 40 ASTM A312 TP304",
            "category": "Pipes & Tubes",
            "unit": "MTR",
            "manufacturer": "Jindal Stainless",
            "annual_quantity": 250,
            "annual_spend": 375000
        }
        create_res = self.client.post("/api/materials", json=new_mat_payload)
        self.assertEqual(create_res.status_code, 200)
        created_mat = create_res.json()
        mat_id = created_mat["id"]
        self.assertEqual(created_mat["material_code"], test_code)

        # 5. Fetch Material Detail (Verifying 8 deep sections)
        detail_res = self.client.get(f"/api/materials/{mat_id}")
        self.assertEqual(detail_res.status_code, 200)
        detail_data = detail_res.json()
        self.assertEqual(detail_data["id"], mat_id)
        self.assertGreaterEqual(detail_data["data_quality_score"], 80)
        self.assertIsNotNone(detail_data["normalized_description"])
        self.assertIn("attributes", detail_data)
        self.assertIn("versions", detail_data)
        self.assertIn("matches", detail_data)
        self.assertIn("conflicts", detail_data)
        self.assertIn("procurement_records", detail_data)

        # 6. Run AI Matching Engine
        match_run_res = self.client.post("/api/matching/run?sector=oil_and_gas")
        self.assertEqual(match_run_res.status_code, 200)
        run_data = match_run_res.json()
        self.assertEqual(run_data["status"], "SUCCESS")

        # 7. List Matches & Inspect Explainable AI
        matches_res = self.client.get("/api/matches?limit=10")
        self.assertEqual(matches_res.status_code, 200)
        matches_list = matches_res.json()["items"]
        self.assertGreater(len(matches_list), 0)
        first_match = matches_list[0]
        self.assertIn("explanation", first_match)
        self.assertIn("matching_attributes", first_match)

        # 8. Human Review & Override with Reason
        target_match_id = first_match["id"]
        override_res = self.client.post(f"/api/matches/{target_match_id}/review", json={
            "decision": "NOT_EQUIVALENT",
            "override_reason": "Tested metallurgical differentiation under high temperature ASTM specification."
        })
        self.assertEqual(override_res.status_code, 200)
        self.assertEqual(override_res.json()["decision"], "NOT_EQUIVALENT")

        # 9. Review Approval (Generates/Reuses Proposed CNMC & Maps CPSE codes)
        # Find a pending match or approve
        approve_res = self.client.post(f"/api/matches/{target_match_id}/review", json={
            "decision": "APPROVE"
        })
        self.assertEqual(approve_res.status_code, 200)
        self.assertIn(approve_res.json()["decision"], ["APPROVE", "APPROVED"])

        # 10. Verify Proposed CNMC Catalog
        cnmc_res = self.client.get("/api/common-materials")
        self.assertEqual(cnmc_res.status_code, 200)
        self.assertGreater(len(cnmc_res.json()), 0)

        # 11. Verify Cross-CPSE Mappings
        map_res = self.client.get("/api/mappings")
        self.assertEqual(map_res.status_code, 200)
        self.assertGreater(len(map_res.json()), 0)

        # 12. Legacy Code Rationalization Update
        legacy_res = self.client.get("/api/legacy-codes")
        self.assertEqual(legacy_res.status_code, 200)
        legacy_list = legacy_res.json()
        if len(legacy_list) > 0:
            first_legacy = legacy_list[0]
            update_leg = self.client.post(
                f"/api/legacy-codes/{first_legacy['id']}/action",
                data={"action": "Rationalize", "notes": "Mapped to Proposed CNMC"}
            )
            self.assertEqual(update_leg.status_code, 200)

        # 13. Knowledge Graph Telemetry
        kg_res = self.client.get("/api/knowledge-graph")
        self.assertEqual(kg_res.status_code, 200)
        kg_data = kg_res.json()
        self.assertIn("nodes", kg_data)
        self.assertIn("edges", kg_data)
        self.assertGreater(len(kg_data["nodes"]), 0)

        # 14. Procurement Opportunity Detection
        proc_res = self.client.get("/api/procurement-opportunities")
        self.assertEqual(proc_res.status_code, 200)
        self.assertGreater(len(proc_res.json()), 0)

        # 15. Verify Tamper-Evident SHA-256 Audit Trail
        audit_res = self.client.post("/api/audit/verify")
        self.assertEqual(audit_res.status_code, 200)
        audit_data = audit_res.json()
        self.assertTrue(audit_data["is_valid"])
        self.assertGreater(audit_data["total_logs_checked"], 0)

        # 16. Tamper Simulation & Detection Test
        tamper_sim = self.client.post("/api/audit/simulate-tamper")
        self.assertEqual(tamper_sim.status_code, 200)
        tamper_check = self.client.post("/api/audit/verify")
        self.assertEqual(tamper_check.status_code, 200)
        self.assertFalse(tamper_check.json()["is_valid"])

        # Restore tamper and verify clean chain
        restore_tamper = self.client.post("/api/audit/restore-tamper")
        self.assertEqual(restore_tamper.status_code, 200)
        restore_check = self.client.post("/api/audit/verify")
        self.assertEqual(restore_check.status_code, 200)
        self.assertTrue(restore_check.json()["is_valid"])

if __name__ == "__main__":
    unittest.main()
