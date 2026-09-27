# MatiSync — 5 to 10 Minute Demonstration Guide

**Product:** MatiSync — AI-Powered Material Standardization & Harmonization Platform
**SIH 2026 Problem Statement:** 26099
**Ministry:** Ministry of Petroleum & Natural Gas
**Organization:** Chennai Petroleum Corporation Limited (CPCL)

---

## 1. Quick Presentation Summary

This guide outlines a crisp, structured **5–10 minute live presentation** demonstrating how **MatiSync** standardizes and harmonizes heterogeneous material codes across CPSEs while keeping humans firmly in control.

> **Core Principle to state to evaluators:**
> *"AI recommends, experts verify, and the system records everything. High text similarity must never automatically mean technical interchangeability."*

---

## 2. Pre-Configured Demonstration Accounts

| Role | Email | Password | Scope & Permissions |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin@demo.com` | `demo123` | Full administrative control, settings, and CPSE management |
| **CPSE Material Officer** | `material@cpcl.demo` | `demo123` | CPCL catalog upload, data quality remediation, duplicate reviews |
| **Technical Expert** | `expert@demo.com` | `demo123` | Technical equivalence, conflict reviews, Proposed CNMC approvals |
| **Procurement Officer**| `procurement@demo.com` | `demo123` | Cross-CPSE demand aggregation, spend analytics, opportunities |
| **Management** | `management@demo.com` | `demo123` | Read-only executive dashboards, audit inspection, report generation |

---

## 3. Step-by-Step Presentation Flow (8 Steps)

### Step 1: Login & Executive Dashboard (1 Minute)
1. Navigate to MatiSync login page.
2. Click the quick-switch button for **Technical Expert (`expert@demo.com`)** or **Admin (`admin@demo.com`)**.
3. **What to highlight:**
   - The **Executive Dashboard** does *not* display hardcoded numbers; all KPIs are dynamically computed from the database.
   - Note the real-time counters: *Total Materials*, *Exact & Near Duplicates*, *Technical Conflicts*, *Average Data Quality Score*, and *Potential Procurement Opportunities*.
   - Point to the active **Pilot Mode (CPCL & NTPC)** banner at the top.

---

### Step 2: Global Search Across the CPSE Network (30 Seconds)
1. Click the **Global Search bar** in the top navigation header (`Ctrl + K`).
2. Type: `SS PIPE`
3. **What to show:** Instant results spanning materials from CPCL, NTPC, ONGC, and existing Proposed Common National Material Codes (CNMC).
4. Click on `[CPCL] CP-10452` to jump directly into its **Material Details** page.

---

### Step 3: Material Details & 4-Stage Data Preservation (1 Minute)
1. On the Material Details page for `CP-10452`, show the 8 organized tabs:
   - **4-Stage Pipeline:**
     - *Original Value:* `SS PIPE 2 INCH SCH 40` (never overwritten!)
     - *Normalized Value:* `STAINLESS STEEL PIPE 50.8 MM SCH 40`
     - *AI Standardized Value:* `STAINLESS STEEL | SS304 | 50.8 MM | SCH40 | ASTM A312`
     - *Final Approved Value:* `STAINLESS STEEL | SS304 | 50.8 MM | SCH40 | ASTM A312`
   - **Extracted Attributes:** View the NLP regex extraction (Base Material: Stainless Steel, Grade: SS304, Size: 50.8mm, Schedule: SCH40).
   - **Data Quality Score:** Explain how the 0–100 score identifies missing attributes.
   - **Version History & Mappings:** Note how every edit creates an immutable version record.

---

### Step 4: Demo Case 1 — Near-Duplicate Detection & Tolerance Rule (1.5 Minutes)
1. Go to the **AI Matching & Comparison** view (`/matching`).
2. Open **Demo Case 1:** `CPCL CP-10452` vs `NTPC MAT-7821`.
3. **What to show:**
   - **AI Score:** `94.5%` (Near Duplicate).
   - **Explainable AI:** Show the attribute breakdown table.
   - **The Engineering Rule:** Explain why `2 inch` and `50.8 mm` / `50 mm` were matched:
     *"MatiSync does not blindly match text. It evaluated ASME B36.10M nominal bore correspondence. 2 inch = 50.8 mm, which corresponds to nominal 50 mm NB under configured engineering tolerance."*
   - Show the assigned Proposed Common National Material Code: `NMC-PIP-SS-050-S40-001`.
   - Point out that both original codes (`CP-10452` and `MAT-7821`) remain preserved in the mapping table.

---

### Step 5: Demo Case 2 — Critical Technical Conflict Override (1.5 Minutes)
1. Filter matches by **Technical Review Required** or click **Demo Case 2**.
2. Open: `CPCL CP-10452 (SS PIPE 50MM SCH40)` vs `ONGC OG-4412 (SS PIPE 50MM SCH80)`.
3. **What to highlight (Crucial Evaluator Talking Point):**
   - **Text Similarity:** Extremely high (`96.5%`) because both are 50mm stainless steel pipes.
   - **The Conflict Alert:** MatiSync detected that **Schedule 40 ≠ Schedule 80**.
   - **The Override:** A critical physical conflict *overrides* the high text score!
   - The match status is forced to **Technical Review Required**, preventing any automated merging.
   - Click **Review Match**, enter an expert reason (e.g., *"Different pressure containment rating makes these materials non-interchangeable in refinery hydrocracker units"*), and submit. Show that the override reason is permanently recorded in the audit trail.

---

### Step 6: Demo Case 3 — Search-Before-Create Wizard (1 Minute)
1. Click the **Search Before Create** button in the header or on the Materials page.
2. In the input box, type: `STAINLESS STEEL PIPE 50MM SCH40`
3. **What to show:**
   - MatiSync immediately queries the live database *before* any new record is saved.
   - It flags: *"Existing material found: 97% similarity to Proposed CNMC NMC-PIP-SS-050-S40-001"*.
   - Present the 4 intelligent actions:
     1. *Use Existing Common Material*
     2. *Compare Specifications*
     3. *Submit for Review*
     4. *Continue Anyway*
   - Explaining to evaluators: *"This stops the creation of duplicate material codes right at the point of origin."*

---

### Step 7: Material Knowledge Graph & Procurement Aggregation (1.5 Minutes)
1. Navigate to **Knowledge Graph** (`/graph`):
   - Show the interactive graph connecting `CPSE (CPCL, NTPC, ONGC)` $\rightarrow$ `Original Material Codes` $\rightarrow$ `Proposed CNMC` $\rightarrow$ `Suppliers (L&T, Jindal Stainless)`.
   - Click any node to open the inspector sidebar.
2. Navigate to **Procurement Opportunities** (`/procurement`):
   - Highlight the **Demand Aggregation Opportunity** for `NMC-PIP-SS-050-S40-001`.
   - Show that combining demand from CPCL, NTPC, and IOCL yields a combined annual volume of 10,500 meters and ₹12.6M spend.
   - Explain the estimated potential volume discount savings (with the clear synthetic demo disclaimer).

---

### Step 8: Tamper-Evident Audit Trail & Integrity Verification (1 Minute)
1. Navigate to **Audit Trail** (`/audit`).
2. Show the log table displaying every user action, previous value, new value, override reasons, and cryptographic hashes (`previous_entry_hash` $\rightarrow$ `entry_hash`).
3. Click **"Verify Trail Integrity"**:
   - The verifier scans the SHA-256 chain and displays: *"All cryptographic links in the hash chain are intact and authentic."*
4. Click **"Simulate Demo Tamper"**:
   - Demonstrates an unauthorized database modification to an old record.
   - Click **"Verify Trail Integrity"** again: The system immediately flags:
     *"INTEGRITY CHECK FAILED: Hash chain broken at sequence #2. Unauthorized modification detected."*
5. Click **"Restore Audit Chain"** to return to a clean verified state.

---

## 4. Resetting Demo Data
If you need to restart the demonstration from a clean slate:
1. Open **Settings** $\rightarrow$ Click **"Reload / Reset Demo Data"**.
2. Type `CONFIRM_RESET_DEMO_DATA` in the modal.
3. The database is restored to the clean seed state in under 1 second without restarting the server.
