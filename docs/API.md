# MatiSync — REST API Documentation

**Product:** MatiSync — AI-Powered Material Standardization & Harmonization Platform
**SIH 2026 Problem Statement:** 26099
**Base URL:** `http://localhost:8000` (Local) / `https://<render-url>` (Production)

---

## 1. System Health
- **`GET /health`**
  - Returns service status, version, ministry, and timestamp.
  - Used for Docker health checks and Render deployment verification.

## 2. Authentication & Roles
- **`POST /api/auth/login`**
  - Body: `{"email": "expert@demo.com", "password": "..."}`
  - Returns JWT bearer token and user role profile.
- **`GET /api/auth/demo-users`**
  - Returns pre-configured demo user accounts for 1-click role switching.

## 3. Executive Dashboard
- **`GET /api/dashboard/kpis`**
  - Computes and returns dynamic KPI metrics:
    `total_materials`, `exact_duplicates`, `near_duplicates`, `functional_equivalents`, `technical_conflicts`, `proposed_cnmcs`, `average_data_quality`, `procurement_opportunities`, `materials_by_cpse`, `materials_by_category`.

## 4. Search-Before-Create (Pre-Creation Gateway)
- **`POST /api/materials/search-before-create`**
  - Body: `{"description": "SS PIPE 50MM SCH40", "category": "Pipes"}`
  - Returns: Real-time similarity scores against existing materials and Proposed CNMCs, conflicting specifications, and recommended action (`USE_EXISTING`, `REVIEW_REQUIRED`, `PROCEED_WITH_CREATION`).

## 5. Material Master Directory
- **`GET /api/materials`**
  - Query parameters: `cpse_code`, `category`, `status`, `search`, `min_quality`, `limit`, `offset`.
- **`GET /api/materials/{id}`**
  - Returns full 8-section details: original description, normalized description, standardized specs, extracted attributes, data quality breakdown, mapped CPSE codes, version history.
- **`POST /api/materials`**
  - Creates a new material master record, computes quality score, extracts attributes, and writes to audit log.
- **`POST /api/materials/upload`**
  - Multipart CSV/Excel upload with row-level error reporting.

## 6. AI Matching & Comparisons
- **`POST /api/matching/run?sector=oil_and_gas`**
  - Triggers cross-CPSE pairwise matching using active sector weighting.
- **`GET /api/matches`**
  - Lists matches filtered by `relationship_type` and `decision`.
- **`POST /api/matches/{id}/review`**
  - Submits human review (`APPROVE`, `REJECT`, `MODIFY`, `NOT_EQUIVALENT`).
  - Captures mandatory `override_reason`.
  - On approval: Reuses or creates Proposed CNMC and updates CPSE mapping.

## 7. Technical Conflicts
- **`GET /api/conflicts`**
  - Lists flagged critical physical conflicts (e.g. Schedule 40 vs Schedule 80).

## 8. Proposed Common National Codes (CNMC)
- **`GET /api/common-materials`**
  - Returns all Proposed CNMCs with mapped CPSE material codes and illustrative GeM/UNSPSC numbers.

## 9. Legacy Code Rationalization
- **`GET /api/legacy-codes`**
  - Lists legacy records with suggested actions (`Retain`, `Map`, `Rationalize`, `Deprecate`).
- **`POST /api/legacy-codes/{id}/action`**
  - Updates rationalization action and records justification in audit trail.

## 10. Procurement Analytics & Opportunities
- **`GET /api/procurement/opportunities`**
  - Lists cross-CPSE demand aggregation opportunities and estimated potential volume discount savings.

## 11. Material Knowledge Graph
- **`GET /api/knowledge-graph`**
  - Returns visual graph nodes and edges (`CPSE` $\rightarrow$ `Material Code` $\rightarrow$ `Proposed CNMC` $\rightarrow$ `Supplier`).

## 12. Tamper-Evident Audit Trail
- **`GET /api/audit`**
  - Returns chronological SHA-256 hash-chained event logs.
- **`POST /api/audit/verify`**
  - Scans stored database hash chain link-by-link and validates cryptographic integrity.
- **`POST /api/audit/simulate-tamper`**
  - Demo-only simulator that alters a database row to demonstrate tamper detection.
- **`POST /api/audit/restore-tamper`**
  - Restores tampered log to a valid state.

## 13. Demo Mode Management
- **`POST /api/demo/reset`**
  - Resets demonstration data to clean seed state (requires confirmation token `CONFIRM_RESET_DEMO_DATA`).
- **`GET /api/demo/cases`**
  - Returns quick-reference links and details for the 3 prepared demo cases.

## 14. Data Exports
- **`GET /api/export/materials`**: RFC 4180 CSV download of all materials.
- **`GET /api/export/audit`**: CSV download of audit trail.
- **`GET /api/export/matches`**: CSV download of pairwise match matrix.
- **`GET /api/export/common-materials`**: CSV download of Proposed CNMC catalog.

## 15. Cross-CPSE Mapping & Standardization
- **`GET /api/materials/search`**: Instant text/spec search returning candidate material records.
- **`POST /api/materials/{id}/standardize`**: Updates 4-stage standardized description & attributes, creates a new entry in `material_versions`, and signs an audit log.
- **`POST /api/conflicts/{id}/review`**: Records technical expert resolution or waiver of flagged conflicts with override justification.
- **`POST /api/common-materials`**: Validates deterministic uniqueness and registers a new Proposed Common National Material Code.
- **`GET /api/mappings`**: Lists all bi-directional CPSE to Proposed CNMC mappings.
- **`GET /api/analytics`**: Returns aggregate analytics summary with synthetic demonstration pricing disclaimers.

## 16. SAP / ERP Integration Gateway (Section 34)
- **`GET /api/integrations/sap/status`**: Checks status of simulated SAP RFC/BAPI & IDoc gateway.
- **`POST /api/integrations/sap/sync`**: Simulates outbound BAPI export (`BAPI_MATERIAL_MAINTAINDATA_RT`) of harmonized CNMC master records to CPCL SAP S/4HANA.
- **`POST /api/integrations/sap/inbound`**: Simulates inbound receipt of `MATMAS05` material master IDocs from plant ERPs.
