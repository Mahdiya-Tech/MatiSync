# MatiSync — System Architecture & Enterprise Integration

**Product:** MatiSync — AI-Powered Material Standardization & Harmonization Platform
**SIH 2026 Problem Statement:** 26099
**Ministry:** Ministry of Petroleum & Natural Gas
**Organization:** Chennai Petroleum Corporation Limited (CPCL)

---

## 1. High-Level Architectural Model

MatiSync is structured into four decoupled, enterprise-ready tiers:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION TIER (SPA)                         │
│  React 18 + TypeScript + Tailwind CSS                                  │
│  - Executive Dashboard & Dynamic KPIs                                  │
│  - Real-Time Search-Before-Create Gateway                              │
│  - 8-Section Material Master Details & 4-Stage Value Preservation      │
│  - Side-by-Side Spec Comparison & Explainable AI Matrix                │
│  - Interactive Knowledge Graph (SVG / Canvas)                          │
│  - Tamper-Evident SHA-256 Audit Trail & Integrity Verifier             │
│  - Contextual "Page Guides" & 3 Prepared Demo Presentation Cases       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ REST API + JSON
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        API & BUSINESS LOGIC TIER                       │
│  FastAPI (Python 3.12) + Pydantic Validation + RBAC Middleware         │
│  - Session & JWT Auth Service                                          │
│  - Multi-CPSE Data Ingestion & Batch CSV/Excel Validator               │
│  - Deterministic Proposed CNMC Generator & Code Mapper                 │
│  - Active Learning Feedback Reranker                                   │
│  - Cross-CPSE Demand Aggregation Engine                                │
│  - Export Generator (RFC 4180 CSV / JSON / Printable Reports)          │
└──────────────────┬─────────────────────────────────┬───────────────────┘
                   │                                 │
                   ▼                                 ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────┐
│       AI & TECHNICAL ENGINES         │  │     STORAGE & PERSISTENCE    │
│  - Data Quality Scorer (0-100)       │  │  SQLAlchemy 2.0 ORM          │
│  - Normalizer & Engineering Tolerance│  │  - PostgreSQL (Render Prod)  │
│  - NLP & Regex Technical Extractor   │  │  - SQLite (Local Dev)        │
│  - Scikit-learn TF-IDF & Cosine Sim  │  │  - 19 Relational Tables      │
│  - RapidFuzz Token Matcher           │  │  - Immutable Hash Chain      │
│  - Critical Conflict Safety Override │  │  - 4-Stage Value Audit       │
└──────────────────────────────────────┘  └──────────────────────────────┘
```

---

## 2. Four-Stage Data Preservation Architecture

In compliance with enterprise master data governance, source CPSE data is never blindly overwritten or mutated:

```text
1. Original Value:       Raw text directly from CPSE ERP (e.g. "SS PIPE 2 INCH SCH 40")
         │
         ▼
2. Normalized Value:     Standardized casing, expanded abbreviations, unit normalized
                         (e.g. "STAINLESS STEEL PIPE 50.8 MM SCH 40")
         │
         ▼
3. AI Standardized:      Canonical attribute-separated specification string
                         (e.g. "STAINLESS STEEL | SS304 | 50.8 MM | SCH40 | ASTM A312")
         │
         ▼
4. Final Approved Value: Expert-confirmed canonical master record linked to Proposed CNMC
                         (e.g. "STAINLESS STEEL | SS304 | 50.8 MM | SCH40 | ASTM A312")
```

Every transformation records:
- Operating rule applied
- Timestamp
- User/Service identity
- Version number in `material_versions`

---

## 3. Future SAP / ERP Integration Architecture

While the prototype uses CSV/Excel and mock REST interfaces for safe local demonstration, MatiSync is architected for zero-friction integration into live CPSE ERP landscapes (SAP S/4HANA, SAP ECC 6.0, Oracle ERP Cloud):

```text
┌────────────────────────────────────────────────────────┐
│                   CPSE ENTERPRISE ERP                  │
│       SAP S/4HANA / SAP ECC (Material Master: MARA)    │
└───────────────────────────┬────────────────────────────┘
                            │
               ┌────────────┴────────────┐
               ▼                         ▼
      [Batch IDoc / BAPI]        [OData / REST Webhooks]
      MATMAS05 IDocs via SAP PO   /sap/opu/odata/sap/API_PRODUCT_SRV
               │                         │
               └────────────┬────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│             MATISYNC ERP CONNECTOR GATEWAY             │
│  - Token authentication & Mutual TLS                   │
│  - Schema translation & field mapping                  │
│  - Pre-creation duplicate lookup (Search-Before-Create)│
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│           MATISYNC UNIFIED MATERIAL PLATFORM           │
│  - Real-time deduplication check                       │
│  - Technical conflict detection                        │
│  - Proposed CNMC assignment                            │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│           BIDIRECTIONAL HARMONIZATION FEEDBACK         │
│  - Syncs Proposed CNMC back to SAP custom field (ZZNMC)│
│  - Flags duplicate legacy codes in CPSE ERP            │
│  - Maintains cross-CPSE mapping table                  │
└────────────────────────────────────────────────────────┘
```

---

## 4. Federated Matching Architecture (Concept & Simulation)

To respect CPSE data sovereignty and proprietary plant configurations, MatiSync is designed for a future Federated Matching architecture:

1. **Local Node Processing:** Each CPSE deploys an on-premise lightweight MatiSync Agent that extracts technical attributes and calculates mathematical embedding vectors locally.
2. **Sanitized Telemetry Sharing:** No raw internal proprietary drawings, commercial supplier lists, or plant tags leave the CPSE perimeter. Only token hashes and standardized attribute vectors are synced to the Central National MatiSync Service.
3. **Central Cross-CPSE Matching:** The central platform executes global harmonization, duplicate detection, and demand aggregation across the network.
4. **Prototype Simulation:** In the MatiSync prototype, this design is simulated using separate CPSE organizational data partitions and role-scoped permissions.
