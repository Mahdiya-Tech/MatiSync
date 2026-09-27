# MatiSync — Database Schema & Data Dictionary

**Product:** MatiSync — AI-Powered Material Standardization & Harmonization Platform
**SIH 2026 Problem Statement:** 26099
**Ministry:** Ministry of Petroleum & Natural Gas
**Organization:** Chennai Petroleum Corporation Limited (CPCL)

---

## 1. Relational Schema Overview

MatiSync operates on an ACID-compliant relational schema compatible with PostgreSQL (Render production) and SQLite (local prototype demonstration).

```text
┌────────────────────────┐         ┌────────────────────────┐
│   cpse_organizations   │ 1     * │       materials        │
│────────────────────────│─────────│────────────────────────│
│ id (PK)                │         │ id (PK)                │
│ code (UNIQUE)          │         │ cpse_id (FK)           │
│ name                   │         │ material_code (INDEX)  │
│ sector                 │         │ original_description   │
│ status (PILOT/ACTIVE)  │         │ normalized_description │
│ last_upload            │         │ standardized_desc      │
└────────────────────────┘         │ final_approved_desc    │
                                   │ original_unit          │
┌────────────────────────┐         │ normalized_unit        │
│ common_national_codes  │ 1     * │ grade, size_raw        │
│────────────────────────│─────────│ normalized_size_mm     │
│ id (PK)                │         │ schedule, pressure     │
│ cnmc_code (UNIQUE)     │         │ standard, mfg          │
│ standardized_desc      │         │ data_quality_score     │
│ category, subcategory  │         │ status                 │
│ grade, size_mm, sch    │         │ cnmc_id (FK)           │
│ illustrative_gem_code  │         └───────────┬────────────┘
│ status (APPROVED)      │                     │
└───────────┬────────────┘                     │
            │                                  │
            │ 1                                │ 1
            ▼ *                                ▼ *
┌────────────────────────┐         ┌────────────────────────┐
│ cpse_material_mappings │         │   material_versions    │
│────────────────────────│         │────────────────────────│
│ id (PK)                │         │ id (PK)                │
│ cnmc_id (FK)           │         │ material_id (FK)       │
│ material_id (FK)       │         │ version_num            │
│ cpse_id (FK)           │         │ changed_by, changed_at │
│ mapping_type           │         │ previous_value         │
│ status (ACTIVE)        │         │ new_value, reason      │
└────────────────────────┘         └────────────────────────┘
```

---

## 2. Table Specifications

### 1. `materials`
Core material master record maintaining the complete 4-stage value preservation:
- `id`: Integer Primary Key
- `cpse_id`: Foreign Key $\rightarrow$ `cpse_organizations.id`
- `material_code`: CPSE internal material code (e.g. `CP-10452`)
- `original_description`: Raw immutable source description (e.g. `SS PIPE 2 INCH SCH 40`)
- `normalized_description`: Cleaned casing, standard abbreviations, metric conversions
- `standardized_description`: Canonical pipe-delimited specification string
- `final_approved_description`: Expert-confirmed final specification
- `data_quality_score`: Float between 0.0 and 100.0
- `status`: Active, Exact Duplicate, Near Duplicate, Functionally Equivalent, Technical Conflict, Mapped, Candidate for Rationalization, Deprecated.
- `cnmc_id`: Foreign Key $\rightarrow$ `common_national_codes.id`

### 2. `common_national_codes`
Proposed Common National Material Code (CNMC) catalog:
- `id`: Integer Primary Key
- `cnmc_code`: Deterministic code string (e.g. `NMC-PIP-SS-050-S40-001`), unique constraint enforced at database level.
- `standardized_description`: Canonical unified description.
- `category`, `material_family`, `grade`, `size_mm`, `schedule`, `standard`.
- `illustrative_gem_code`: Mock GeM classification (e.g. `GEM/2026/M/001045`).
- `illustrative_unspsc_code`: Mock UNSPSC classification (e.g. `40171501`).
- `status`: APPROVED, PENDING_REVIEW, DEPRECATED.

### 3. `audit_logs` (Tamper-Evident Hash Chain)
- `id`: Integer Primary Key
- `sequence_num`: Integer strictly monotonically increasing sequence number (Unique, Index)
- `timestamp`: UTC datetime of event
- `user_email`: Email of initiating actor
- `user_role`: System role (Admin, Expert, Officer, System)
- `action`: Event type (`MATERIAL_CREATED`, `AI_MATCH_RUN`, `OVERRIDE`, `CNMC_APPROVED`)
- `entity_type`: Target entity class (`MATERIAL`, `MATCH`, `CNMC`, `MAPPING`)
- `entity_id`: Identifier of modified entity
- `previous_value_json`: JSON snapshot before modification
- `new_value_json`: JSON snapshot after modification
- `reason`: Mandatory reviewer justification
- `previous_entry_hash`: SHA-256 hash of preceding record (Genesis = 64 zeros)
- `entry_hash`: SHA-256 hash of current entry
