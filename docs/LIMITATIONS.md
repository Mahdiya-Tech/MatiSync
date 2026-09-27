# MatiSync — Realistic Prototype Boundaries & Limitations

**Product:** MatiSync — AI-Powered Material Standardization & Harmonization Platform
**SIH 2026 Problem Statement:** 26099
**Ministry:** Ministry of Petroleum & Natural Gas
**Organization:** Chennai Petroleum Corporation Limited (CPCL)

---

## 1. Prototype Scope vs Production CPSE Systems

To ensure transparency and academic integrity during SIH 2026 evaluations, this document explicitly defines what is implemented in the MatiSync prototype versus what constitutes future enterprise deployment boundaries.

| Feature Area | Implemented in Prototype | Future Production Deployment |
| :--- | :--- | :--- |
| **Data Source** | Synthetic demonstration data (130+ realistic items based on CPCL/NTPC/ONGC industrial specs) | Direct connection to live CPSE SAP S/4HANA & ERP production databases |
| **Material Coding** | Proposed Common National Material Code (CNMC) prototype format | Formally notified Government of India national standard |
| **Procurement Savings** | Illustrative demo-data estimates based on volume discount assumptions | Actual negotiated contract pricing and realized audit savings |
| **ERP Connectivity** | CSV / Excel upload, mock REST endpoints, and architectural blueprints | Real-time SAP MATMAS IDocs and RFC/BAPI connectors |
| **Audit Verification** | SHA-256 tamper-evident hash chain with in-memory/DB verification | Enterprise HSM (Hardware Security Module) / PKI digital signatures |
| **Federated Learning** | Simulated via partitioned CPSE organizational data scopes | True decentralized edge nodes with secure multiparty computation |
| **Multimodal OCR** | Structured engineering text and attribute extraction | Ingestion of scanned mill test certificates (MTC) and PDF drawings |

---

## 2. Technical Limitations & Safeguards

1. **High Text Similarity Safeguard:** The AI engine will never automatically merge materials without human technical review. Critical physical attributes (schedules, grades, ratings) always supersede lexical or embedding similarity.
2. **Audit Hash Chain:** The hash chain makes unauthorized database modifications detectable; it is not a claim of legal-grade non-repudiation or absolute hardware-level tamper prevention.
3. **Deployment Resource Constraints:** The AI pipeline uses fast, robust, offline TF-IDF and RapidFuzz token matchers alongside rule matrices so that it runs reliably on free/low-cost cloud instances (like Render.com) without risking out-of-memory crashes from 500MB neural models.
