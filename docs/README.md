# MatiSync — AI-Powered Material Standardization & Harmonization Platform

**SIH 2026 Problem Statement:** 26099  
**Official Title:** AI-Driven Standardization and Harmonization of Material Codes Across CPSEs  
**Ministry:** Ministry of Petroleum & Natural Gas  
**Organization:** Chennai Petroleum Corporation Limited (CPCL)  
**Category:** Software  
**Theme:** Smart Automation  
**Product Tagline:** *MatiSync — AI-Powered Material Standardization & Harmonization Platform*

---

## 1. Executive Summary

Central Public Sector Enterprises (CPSEs) under the Ministry of Petroleum & Natural Gas and other key ministries currently maintain isolated, non-standardized material master catalogs. A single identical or functionally equivalent industrial item (such as a 2-inch Schedule 40 Stainless Steel pipe or a Class 150# flanged ball valve) is frequently recorded under disparate internal material codes, inconsistent engineering descriptions, differing measurement units, and ambiguous technical classifications across CPCL, NTPC, ONGC, IOCL, SAIL, BPCL, BHEL, and CIL.

**MatiSync** is an AI-powered National Unified Material Master Platform built to standardize and harmonize heterogeneous material records. 

### Core Engineering Principle
> **"AI recommends, experts verify, and the system records everything. High text similarity must never automatically mean technical interchangeability."**

---

## 2. Key Features

- **Four-Stage Data Preservation:** `Original Value` $\rightarrow$ `Normalized Value` $\rightarrow$ `AI Standardized Value` $\rightarrow$ `Final Approved Value`. Original CPSE codes and descriptions are *never* overwritten or lost.
- **Search-Before-Create Gateway:** Real-time duplicate warning system that alerts engineers and store officers before a duplicate material code can be created in the database.
- **Technical Conflict Intelligence:** Strict physical incompatibility rules (e.g. Schedule 40 vs Schedule 80, SS304 vs SS316) that override high text similarity scores and mandate **Technical Review Required**.
- **Deterministic Proposed Common National Material Code (CNMC):** Deterministic syntax (`NMC-<CAT>-<MAT>-<SIZE>-<SPEC>-<SEQ>`) with automatic reuse of existing approved codes and strict database uniqueness enforcement.
- **Tamper-Evident SHA-256 Audit Trail:** Cryptographic hash-chained audit log with live integrity verification and a demonstration tamper simulator.
- **Cross-CPSE Procurement Demand Aggregation:** Automatic consolidation of identical material requirements across CPSEs, calculating potential bulk discount opportunities with clear synthetic demo disclaimers.
- **Interactive Material Knowledge Graph:** Multi-dimensional visualization linking CPSEs, local codes, proposed CNMCs, technical specifications, and suppliers.
- **Role-Based Access Control (RBAC):** Distinct permissions and workflows for Admin, CPSE Material Officer, Technical Expert, Procurement Officer, and Management.
- **Pilot Mode vs Full Rollout Mode:** Controlled rollout starting with CPCL and NTPC, expandable to all 8 CPSEs.

---

## 3. Technology Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS, Lucide React, Canvas/SVG Knowledge Graph, Vite.
- **Backend:** FastAPI (Python 3.12), Pydantic v2, SQLAlchemy ORM, SQLite (local) / PostgreSQL (production on Render).
- **AI & NLP:** Scikit-learn (TF-IDF vectorization & Cosine Similarity), RapidFuzz (Token Sort & Set Ratios), Custom Regex & Rule-Based Technical Attribute Extractor, Engineering Tolerance Engine.

---

## 4. Local Installation & Setup

### Prerequisites
- Python 3.10+ (tested on Python 3.12)
- Node.js v18+ & npm v9+

### 1. Clone & Setup Backend
```bash
cd cpse-material-harmonizer/backend
pip install -r requirements.txt
python run.py
```
*The FastAPI backend will start at `http://localhost:8000`. On first launch, it automatically seeds 130+ realistic synthetic CPSE material records and audit logs.*

### 2. Setup Frontend
```bash
cd ../frontend
npm install
npm run dev
```
*The React portal will open at `http://localhost:5173`.*

---

## 5. Demonstration Accounts

Password for all demo accounts: `demo123`

| Role | Email | Responsibilities |
| :--- | :--- | :--- |
| **System Admin** | `admin@demo.com` | Full administrative control, system settings, mode switching |
| **CPSE Material Officer** | `material@cpcl.demo` | CPCL catalog upload, data quality remediation, duplicate reviews |
| **Technical Expert** | `expert@demo.com` | Equivalence review, technical conflict overrides, CNMC approvals |
| **Procurement Officer**| `procurement@demo.com` | Cross-CPSE demand aggregation, spend analytics, opportunities |
| **Management** | `management@demo.com` | Read-only executive dashboards, audit inspection, report generation |

---

## 6. Render.com Production Deployment Guide

MatiSync is designed for zero-config public deployment on Render.com using PostgreSQL:

### Step 1: Create a PostgreSQL Database on Render
1. In your Render Dashboard, click **New +** $\rightarrow$ **PostgreSQL**.
2. Name: `matisync-db`
3. Database: `matisync`
4. Copy the **Internal Database URL** (or External URL).

### Step 2: Deploy Backend Web Service on Render
1. Click **New +** $\rightarrow$ **Web Service**.
2. Connect your Git repository.
3. Root Directory: `backend`
4. Build Command: `pip install -r requirements.txt`
5. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. Add Environment Variables:
   - `DATABASE_URL`: *(Paste Render PostgreSQL URL)*
   - `SECRET_KEY`: `your-production-secret-key`
   - `DEPLOYMENT_MODE`: `rollout`
   - `ACTIVE_SECTOR`: `oil_and_gas`

### Step 3: Deploy Frontend Static Site on Render
1. Click **New +** $\rightarrow$ **Static Site**.
2. Root Directory: `frontend`
3. Build Command: `npm install && npm run build`
4. Publish Directory: `dist`
5. Add Environment Variable:
   - `VITE_API_URL`: *(Your Backend Render Web Service URL, e.g. `https://matisync-api.onrender.com`)*

---

## 7. Prototype Disclaimers
1. **Synthetic Data:** All CPSE material records, supplier prices, and purchase orders are strictly synthetic demonstration data.
2. **Proposed CNMC:** The Proposed Common National Material Code is a prototype harmonization format and does not constitute an officially approved Government of India standard.
3. **Illustrative Savings:** Procurement demand aggregation savings are illustrative demonstration estimates based on synthetic assumptions.
