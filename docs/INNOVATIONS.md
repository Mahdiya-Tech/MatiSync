# MatiSync — Core SIH Capabilities & Innovations

**SIH 2026 Problem Statement 26099:** AI-Driven Standardization and Harmonization of Material Codes Across CPSEs
**Ministry:** Ministry of Petroleum & Natural Gas
**Organization:** Chennai Petroleum Corporation Limited (CPCL)

---

## 1. Overview

MatiSync introduces 12 major innovations specifically designed to solve the challenges of heterogeneous material master data in Indian CPSEs. Crucially, the platform adheres to the rule:
> **"AI recommends, experts verify, and the system records everything. High similarity must never automatically mean technical interchangeability."**

---

## 2. Detailed Innovation Breakdown

### 1. Explainable AI (XAI)
* **Status:** `IMPLEMENTED IN PROTOTYPE`
* **Mechanism:** Rather than outputting a black-box similarity score, MatiSync breaks every match down into four distinct mathematical sub-scores:
  - *Text Similarity (TF-IDF)*
  - *Keyword/Fuzzy Ratio (RapidFuzz)*
  - *Attribute Match Matrix (Grade, Dimensions, Metallurgy, Standards)*
  - *Technical Compatibility Score*
* **Transparency:** Evaluators see exact lists of *Matching Attributes*, *Conflicting Attributes*, *Missing Attributes*, and human-readable engineering justifications.

---

### 2. Technical Conflict Intelligence & Safety Override
* **Status:** `IMPLEMENTED IN PROTOTYPE`
* **Mechanism:** In industrial engineering, two materials with 98% text similarity can be catastrophically incompatible in service (e.g. `SCH40` vs `SCH80`, `SS304` vs `SS316`, `Class 150#` vs `Class 300#`).
* **Critical Override Rule:** The Technical Conflict Engine runs *independently* from lexical/embedding similarity. If a critical physical conflict is detected, the match status is overridden to **"Technical Review Required"**, locking automated merging and forcing expert review.

---

### 3. Search-Before-Create Pre-Creation Gateway
* **Status:** `IMPLEMENTED IN PROTOTYPE`
* **Mechanism:** Prevents redundant duplicate material codes *at the point of entry*. Whenever a plant engineer or procurement officer enters a new material description, MatiSync immediately runs real-time matching against existing approved records and Proposed Common National Material Codes (CNMC).
* **Workflows:** If a match is detected, the user is offered:
  - *Use Existing Common Material*
  - *Side-by-Side Specification Comparison*
  - *Submit for Expert Review*
  - *Continue Anyway (with recorded justification)*

---

### 4. Material Knowledge Graph
* **Status:** `IMPLEMENTED IN PROTOTYPE`
* **Mechanism:** Visualizes multi-dimensional relationships across CPSE organizational silos:
  `CPSE` $\rightarrow$ `Local Material Code` $\rightarrow$ `Proposed CNMC` $\rightarrow$ `Category` $\rightarrow$ `Technical Specs` $\rightarrow$ `Suppliers & Procurement Records`.
* **Utility:** Provides interactive node inspection and trace analysis across all CPSEs.

---

### 5. Active Learning with Transparent Feedback Reranking
* **Status:** `IMPLEMENTED IN PROTOTYPE`
* **Mechanism:** Instead of pretending to retrain a complex neural network in real-time or introducing unpredictable model drift, MatiSync implements a transparent feedback-weighted Bayesian reranking mechanism.
* **Auditability:** Displays original AI score, feedback-adjusted score, and the exact count of prior expert approvals vs rejections for similar material vectors.

---

### 6. Sector-Specific Matching Profiles
* **Status:** `IMPLEMENTED IN PROTOTYPE`
* **Mechanism:** Material importance weights shift dramatically across industrial sectors:
  - *Oil & Gas:* Schedule, pressure rating, ASTM corrosion standards are weighted heavily.
  - *Power:* Operating voltage, thermal insulation, conductor core sqmm are weighted heavily.
  - *Steel & Heavy Engineering:* Tensile grades, mechanical load ratings, DIN standards.
* **Traceability:** Every AI recommendation records the active `sector_rule_version` under which it was evaluated.

---

### 7. Data Quality Intelligence (0–100 Scorer)
* **Status:** `IMPLEMENTED IN PROTOTYPE`
* **Mechanism:** Automated pre-ingestion audit scoring records across 5 critical dimensions:
  1. Description richness & ambiguity detection.
  2. Standardized unit validity.
  3. Mandatory engineering attributes (Grade, Size, Schedule/Rating).
  4. Casing, symbols, and formatting consistency.
  5. Category completeness.
* **Actionability:** Provides record-level actionable suggestions (e.g. *"Missing metallurgical grade; add ASTM A312 specification"*).

---

### 8. Tamper-Evident SHA-256 Hash Chain Audit Trail
* **Status:** `IMPLEMENTED IN PROTOTYPE`
* **Mechanism:** Every action (creation, normalization, matching, approval, override) is hashed and linked to the preceding entry hash:
  `entry_hash = SHA256(previous_hash + timestamp + user + action + payload)`.
* **Live Verifier:** Scans the entire chain in the database and detects any unauthorized database row alterations. Includes a demonstration tamper simulation button.
* **Disclaimer:** *Makes unauthorized modification detectable; it is not a claim of legal-grade non-repudiation or absolute tamper prevention.*

---

### 9. Cross-CPSE Procurement Demand Aggregation
* **Status:** `IMPLEMENTED IN PROTOTYPE`
* **Mechanism:** Groups separate CPSE purchase orders for materials that map to the same Proposed CNMC.
* **Commercial Insight:** Aggregates annual quantities and spends, calculating tiered potential volume discount savings (5%–12%) for joint rate contract negotiations.
* **Disclaimer:** *Labelled as illustrative demo-data estimates based on synthetic prices.*

---

### 10. Pilot Mode vs Full Rollout Mode
* **Status:** `IMPLEMENTED IN PROTOTYPE`
* **Mechanism:** Configurable deployment boundaries:
  - *Pilot Mode:* Restricts active processing to foundational CPSEs (`CPCL` and `NTPC`) for controlled pilot validation.
  - *Full Rollout Mode:* Enables all CPSEs (`CPCL`, `NTPC`, `ONGC`, `IOCL`, `SAIL`, `BPCL`, `BHEL`, `CIL`).

---

### 11. Federated Matching Architecture
* **Status:** `SIMULATED IN PROTOTYPE / FUTURE ARCHITECTURE`
* **Design Concept:** Enables sensitive CPSE ERP data to stay inside each organization's firewalls. Only token hashes, mathematical embeddings, and sanitized attribute vectors are transmitted to the Central MatiSync Matching Service.
* **Prototype Implementation:** Simulated through separated CPSE data partitions within the relational schema.

---

### 12. Multimodal-Ready Architecture (Datasheets & OCR)
* **Status:** `FUTURE ARCHITECTURE`
* **Design Concept:** Extensible ingestion pipeline capable of accepting scanned engineering drawings, mill test certificates (MTC), manufacturer datasheets, and PDF equipment schedules via OCR and multimodal vision encoders.
