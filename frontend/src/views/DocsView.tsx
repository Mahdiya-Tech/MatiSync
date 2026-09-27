import React, { useState } from 'react';
import { BookOpen, FileText, Cpu, Database, Server, ShieldCheck, AlertCircle, CheckCircle, ChevronRight, Terminal } from 'lucide-react';

export const DocsView: React.FC = () => {
  const [activeDoc, setActiveDoc] = useState<string>('demo_guide');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base font-bold text-slate-900 tracking-tight">Enterprise Technical Documentation & Presentation Guide</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
              SIH-26099-DOCS-REV4
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete technical specifications, algorithmic formulas, architecture blueprints, and hackathon presentation guide
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs">
          <span className="px-2.5 py-1 bg-brand-50 border border-brand-200 text-brand-800 rounded font-mono font-semibold">
            CPCL / MoPNG Verified
          </span>
        </div>
      </div>

      {/* Docs Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Navigation Sidebar */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-3 space-y-1">
          {[
            { id: 'demo_guide', label: '1. Presentation Demo Guide', icon: FileText },
            { id: 'innovations', label: '2. 12 Core Innovations', icon: ShieldCheck },
            { id: 'architecture', label: '3. System Architecture', icon: Server },
            { id: 'ai_pipeline', label: '4. AI Pipeline & Tolerances', icon: Cpu },
            { id: 'database', label: '5. Database & Relational Schema', icon: Database },
            { id: 'api', label: '6. REST API Reference', icon: Terminal },
            { id: 'limitations', label: '7. Prototype Boundaries & Disclaimers', icon: AlertCircle },
            { id: 'problem_solution', label: '8. Problem-Solution Mapping (Section 49)', icon: CheckCircle }
          ].map(item => {
            const Icon = item.icon;
            const isActive = activeDoc === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveDoc(item.id)}
                className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded text-xs font-medium transition-all text-left ${
                  isActive
                    ? 'bg-brand-600 text-white font-bold shadow-xs'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Viewer (3 cols) */}
        <div className="md:col-span-3 bg-white rounded-lg border border-slate-200 shadow-sm p-6 text-xs text-slate-700 space-y-6">
          {/* 1. DEMO GUIDE */}
          {activeDoc === 'demo_guide' && (
            <div className="space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <span className="text-[10px] font-bold uppercase text-brand-600 tracking-wider">Document 01</span>
                <h2 className="text-xl font-black text-slate-900 mt-0.5">5-10 Minute Presentation Script for SIH Judges</h2>
              </div>

              <div className="bg-brand-50 border border-brand-200 p-3.5 rounded text-brand-900 space-y-1">
                <div className="font-bold text-xs uppercase tracking-wide">Core Pitch:</div>
                <p className="text-xs leading-relaxed">
                  "Respected Judges: Central Public Sector Enterprises (CPSEs) spend thousands of crores annually purchasing identical engineering materials, yet their ERP catalogs are locked in isolated silos with differing naming standards. High text similarity must never automatically mean physical interchangeability. MatiSync is the AI-driven National Unified Material Master Platform built on one fundamental principle: <strong>AI recommends, experts verify, and the system records everything.</strong>"
                </p>
              </div>

              <h3 className="font-bold text-slate-900 text-sm pt-2">Step-by-Step Presentation Flow</h3>
              <div className="space-y-3">
                <div className="p-3 rounded border border-slate-200 bg-slate-50">
                  <div className="font-bold text-slate-900 flex items-center justify-between">
                    <span>Minute 01: National Executive Dashboard</span>
                    <span className="text-[10px] font-mono bg-slate-200 px-1.5 py-0.5 rounded">Tab: Dashboard</span>
                  </div>
                  <p className="text-slate-600 mt-1">
                    Show the live overview of 134 materials across 8 CPSEs. Point out the Data Quality Distribution (average 82.4/100) and the ₹ 60.5 Lakhs in potential cross-CPSE volume savings.
                  </p>
                </div>

                <div className="p-3 rounded border border-emerald-200 bg-emerald-50/50">
                  <div className="font-bold text-emerald-950 flex items-center justify-between">
                    <span>Minute 02: Demo Case 1 — Near Duplicate & Engineering Tolerance</span>
                    <span className="text-[10px] font-mono bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded">Case 1</span>
                  </div>
                  <p className="text-emerald-900 mt-1">
                    Compare <strong>CPCL CP-10452</strong> (2 INCH SCH 40) vs <strong>NTPC MAT-7821</strong> (50.8 MM SCH 40). Explain how the ASME B36.10M tolerance engine maps 2 inch nominal bore to 50.8 mm (0.0% variance) rather than treating them as different items!
                  </p>
                </div>

                <div className="p-3 rounded border border-rose-200 bg-rose-50/50">
                  <div className="font-bold text-rose-950 flex items-center justify-between">
                    <span>Minute 03: Demo Case 2 — Critical Safety Override</span>
                    <span className="text-[10px] font-mono bg-rose-200 text-rose-900 px-1.5 py-0.5 rounded">Case 2</span>
                  </div>
                  <p className="text-rose-900 mt-1">
                    Compare <strong>CPCL CP-10452</strong> (SCH 40) vs <strong>ONGC OG-4412</strong> (SCH 80). Text similarity is 96.5%, but MatiSync overrides the score to flag <strong>Technical Review Required</strong> because wall thickness is 3.91mm vs 5.54mm. A high-pressure line using SCH 40 instead of SCH 80 could rupture catastrophically!
                  </p>
                </div>

                <div className="p-3 rounded border border-purple-200 bg-purple-50/50">
                  <div className="font-bold text-purple-950 flex items-center justify-between">
                    <span>Minute 04: Demo Case 3 — Search-Before-Create Gateway</span>
                    <span className="text-[10px] font-mono bg-purple-200 text-purple-900 px-1.5 py-0.5 rounded">Case 3</span>
                  </div>
                  <p className="text-purple-900 mt-1">
                    Click "Search Before Create" in the header. Type <code>STAINLESS STEEL PIPE 50MM SCH40</code>. The system intercepts the duplicate in real-time before saving to database, prompting adoption of existing Proposed Code <code>NMC-PIP-SS-050-S40-001</code>.
                  </p>
                </div>

                <div className="p-3 rounded border border-blue-200 bg-blue-50/50">
                  <div className="font-bold text-blue-950 flex items-center justify-between">
                    <span>Minute 05: Cryptographic Tamper-Evident Verification</span>
                    <span className="text-[10px] font-mono bg-blue-200 text-blue-900 px-1.5 py-0.5 rounded">Tab: Audit Trail</span>
                  </div>
                  <p className="text-blue-900 mt-1">
                    Navigate to Audit Trail. Click "Verify Cryptographic Integrity" — watch the green SHA-256 confirmation. Then click "Simulate Demo Tamper" to intentionally mutate a database row, and click verify again: the chain flags a red cryptographic alert pinpointing the tampered block sequence!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 2. INNOVATIONS */}
          {activeDoc === 'innovations' && (
            <div className="space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <span className="text-[10px] font-bold uppercase text-brand-600 tracking-wider">Document 02</span>
                <h2 className="text-xl font-black text-slate-900 mt-0.5">The 12 Core Innovations of MatiSync</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { title: '1. Four-Stage Data Preservation', desc: 'Original -> Normalized -> AI Standardized -> Final Approved. Original CPSE master values are never overwritten or mutated.' },
                  { title: '2. Physical Engineering Tolerance Engine', desc: 'ASME B36.10M / ISO 6708 dimension normalization resolving imperial vs metric nominal bore tolerances (2" = 50.8mm).' },
                  { title: '3. Critical Technical Conflict Override', desc: 'Guarantees that high textual similarity (>95%) cannot auto-merge items with physical incompatibilities (SCH40 vs SCH80).' },
                  { title: '4. Search-Before-Create Gateway', desc: 'Real-time pre-creation duplicate interception blocking new redundant records at the point of CPSE requisition.' },
                  { title: '5. Deterministic Proposed CNMC Schema', desc: 'Standardized syntax: NMC-<CAT>-<MAT>-<SIZE>-<SPEC>-<SEQ> guaranteeing deterministic generation and reuse.' },
                  { title: '6. Explainable AI Feature Matrix', desc: 'Sub-score decomposition exposing token overlap, fuzzy ratio, attribute agreement, and engineering compatibility.' },
                  { title: '7. SHA-256 Tamper-Evident Audit Chain', desc: 'Cryptographically linked block hashes mathematically proving historical decisions and override justifications.' },
                  { title: '8. Active Learning Human Feedback Loop', desc: 'Expert approvals and rejections refine sector feature weights dynamically across iterations.' },
                  { title: '9. Multi-Sector Domain Profiles', desc: 'Customizable rule weighting for Oil & Gas, Power, Steel, Mining, and Heavy Engineering sectors.' },
                  { title: '10. Automated Data Quality Scorer (0-100)', desc: 'Record-level completeness, validity, and formatting evaluation with automated remediation suggestions.' },
                  { title: '11. Cross-CPSE Demand Aggregation Engine', desc: 'Consolidates multi-CPSE demand under common codes to estimate 8-15% bulk volume procurement savings.' },
                  { title: '12. Semantic Enterprise Knowledge Graph', desc: 'Interactive graph connecting CPSE plant hierarchies, materials, CNMCs, and certified GeM vendors.' }
                ].map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded">
                    <h4 className="font-bold text-slate-900 text-xs">{item.title}</h4>
                    <p className="text-[11px] text-slate-600 mt-1 leading-snug">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. ARCHITECTURE */}
          {activeDoc === 'architecture' && (
            <div className="space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <span className="text-[10px] font-bold uppercase text-brand-600 tracking-wider">Document 03</span>
                <h2 className="text-xl font-black text-slate-900 mt-0.5">3-Tier System Architecture & ERP Integration</h2>
              </div>

              <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-[11px] space-y-2">
                <div className="text-brand-300 font-bold">MatiSync Enterprise Architecture Flow:</div>
                <pre className="overflow-x-auto text-[10px] leading-relaxed text-slate-300">
{`+---------------------------------------------------------------------------------+
|                       PRESENTATION TIER (React 18 + TypeScript)                 |
|  - Executive Dashboard       - Search-Before-Create Gateway    - Knowledge Graph|
|  - Side-by-Side Comparator   - Explainable AI Matrix View      - Audit Verifier |
+---------------------------------------------------------------------------------+
                                      | HTTP / REST (OpenAPI 3.1)
+---------------------------------------------------------------------------------+
|                         APPLICATION TIER (FastAPI Backend)                      |
|  - Normalization Engine      - ASME B36.10M Tolerancing   - Conflict Detector   |
|  - Hybrid AI Matcher         - Deterministic CNMC Engine  - SHA-256 Audit Chain |
|  - Data Quality Scorer       - Demand Aggregation Engine  - Active Learning     |
+---------------------------------------------------------------------------------+
                                      | SQLAlchemy 2.0 ORM
+---------------------------------------------------------------------------------+
|                           DATA TIER (PostgreSQL / SQLite)                       |
|  - 19 Relational Models     - 4-Stage History Tables      - Immutable Hash Logs |
+---------------------------------------------------------------------------------+`}
                </pre>
              </div>

              <h3 className="font-bold text-slate-900 text-sm">ERP Integration Strategy (SAP / Oracle)</h3>
              <p className="text-slate-600 leading-relaxed">
                MatiSync does not replace existing CPSE enterprise resource planning installations (e.g. SAP S/4HANA or Oracle E-Business Suite). Instead, MatiSync functions as an authoritative Master Data Governance (MDG) federation gateway. Local material codes remain active in local plant SAP systems, while MatiSync dual-keys each record to the Proposed CNMC standard via the <code>CPSEMaterialMapping</code> relation.
              </p>
            </div>
          )}

          {/* 4. AI PIPELINE */}
          {activeDoc === 'ai_pipeline' && (
            <div className="space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <span className="text-[10px] font-bold uppercase text-brand-600 tracking-wider">Document 04</span>
                <h2 className="text-xl font-black text-slate-900 mt-0.5">Hybrid AI Matching Pipeline & Formulas</h2>
              </div>

              <div className="bg-slate-50 p-4 rounded border border-slate-200 space-y-2">
                <div className="font-bold text-slate-900">Composite Similarity Formula:</div>
                <div className="font-mono text-xs text-brand-900 bg-white p-2.5 rounded border border-slate-200">
                  AI_Score = (W_text * Text_Score) + (W_fuzzy * Fuzzy_Score) + (W_attr * Attr_Score) + (W_tol * Tol_Score)
                </div>
                <div className="text-[11px] text-slate-600">
                  Where in the Oil & Gas sector profile: W_attr = 0.35, W_text = 0.25, W_tol = 0.20, W_fuzzy = 0.20.
                </div>
              </div>

              <h3 className="font-bold text-slate-900 text-sm">Conflict Override Logic</h3>
              <p className="text-slate-600 leading-relaxed">
                Before any match is categorized as "Exact Duplicate" or "Near Duplicate", the Conflict Detection Engine evaluates strict physical constraints:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-600">
                <li><strong>Schedule Variance:</strong> SCH40 vs SCH80 (different wall thickness and burst pressure).</li>
                <li><strong>Pressure Class Variance:</strong> Class 150 vs Class 300 vs Class 600.</li>
                <li><strong>Metallurgy Conflict:</strong> Carbon Steel (ASTM A106) vs Stainless Steel (SS316).</li>
                <li><strong>Voltage Rating Variance:</strong> 415V vs 1.1kV vs 11kV.</li>
              </ul>
              <p className="text-slate-600 leading-relaxed">
                If a critical conflict is identified, the decision is <strong>clamped to "Technical Review Required"</strong> regardless of how close the textual similarity is.
              </p>
            </div>
          )}

          {/* 5. DATABASE */}
          {activeDoc === 'database' && (
            <div className="space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <span className="text-[10px] font-bold uppercase text-brand-600 tracking-wider">Document 05</span>
                <h2 className="text-xl font-black text-slate-900 mt-0.5">Database Dictionary (19 Relational Entities)</h2>
              </div>

              <div className="space-y-2">
                {[
                  { table: 'cpse_organizations', desc: 'CPSE corporate metadata, code, sector, and catalog upload telemetry.' },
                  { table: 'materials', desc: 'Core material master table storing 4-stage preserved descriptions, extracted attributes, spend, and quality scores.' },
                  { table: 'material_matches', desc: 'Pairwise comparison records with decomposed sub-scores, explainability JSON, and review decisions.' },
                  { table: 'technical_conflicts', desc: 'Critical physical discrepancies (schedules, pressure ratings, materials) triggering safety review.' },
                  { table: 'common_national_codes', desc: 'Proposed CNMC registry storing deterministic national codes and standardized descriptions.' },
                  { table: 'cpse_material_mappings', desc: 'Cross-CPSE mapping table linking local CPSE material codes to Proposed CNMCs.' },
                  { table: 'audit_logs', desc: 'SHA-256 linked immutable ledger storing sequence, actor, action, previous/new payloads, and previous hash.' },
                  { table: 'procurement_opportunities', desc: 'Demand aggregation pools calculating combined spend and volume discount savings.' }
                ].map((item, idx) => (
                  <div key={idx} className="p-2.5 rounded bg-slate-50 border border-slate-200 flex items-start justify-between">
                    <div>
                      <span className="font-mono font-bold text-brand-900">{item.table}</span>
                      <p className="text-[11px] text-slate-600 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. API */}
          {activeDoc === 'api' && (
            <div className="space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <span className="text-[10px] font-bold uppercase text-brand-600 tracking-wider">Document 06</span>
                <h2 className="text-xl font-black text-slate-900 mt-0.5">REST API Reference (FastAPI OpenAPI 3.1)</h2>
              </div>

              <div className="space-y-2 font-mono text-[11px]">
                {[
                  { method: 'GET', path: '/health', desc: 'Liveness check returning service status and database state.' },
                  { method: 'GET', path: '/api/dashboard/kpis', desc: 'Real-time calculated platform KPIs, spend totals, and quality metrics.' },
                  { method: 'GET', path: '/api/materials', desc: 'Filterable, searchable material master directory with pagination.' },
                  { method: 'POST', path: '/api/materials/search-before-create', desc: 'Pre-creation duplicate search returning existing candidates and Proposed CNMC.' },
                  { method: 'POST', path: '/api/matching/run', desc: 'Executes cross-CPSE hybrid matching engine with sector rules.' },
                  { method: 'GET', path: '/api/matches', desc: 'Retrieves pairwise matches with explainable AI scores.' },
                  { method: 'POST', path: '/api/matches/{id}/review', desc: 'Human review approval, rejection, or override with mandatory reason.' },
                  { method: 'POST', path: '/api/audit/verify', desc: 'Scans and cryptographically verifies the SHA-256 hash chain.' },
                  { method: 'POST', path: '/api/demo/reset', desc: 'Safely restores demo dataset with confirmation string CONFIRM_RESET_DEMO_DATA.' }
                ].map((item, idx) => (
                  <div key={idx} className="p-2 rounded bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${item.method === 'GET' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'}`}>
                        {item.method}
                      </span>
                      <span className="font-bold text-slate-800">{item.path}</span>
                    </div>
                    <span className="text-[10px] font-sans text-slate-500">{item.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7. LIMITATIONS */}
          {activeDoc === 'limitations' && (
            <div className="space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <span className="text-[10px] font-bold uppercase text-brand-600 tracking-wider">Document 07</span>
                <h2 className="text-xl font-black text-slate-900 mt-0.5">Prototype Boundaries & Synthetic Data Disclaimers</h2>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-4 rounded text-amber-950 space-y-2">
                <div className="font-bold text-xs flex items-center space-x-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>SIH 2026 Student Prototype Boundaries</span>
                </div>
                <p className="text-xs leading-relaxed">
                  In accordance with SIH 2026 guidelines, MatiSync is built as a production-grade working prototype demonstrating technical feasibility. The dataset of 134 materials, 8 CPSEs, and procurement histories consists of synthetic engineering catalog data calibrated to reflect real Indian PSU procurement patterns (ASTM, ASME, IS, and DIN standards).
                </p>
                <p className="text-xs leading-relaxed">
                  All Proposed CNMC codes are student-designed proposed standard taxonomies for demonstration purposes, and all procurement savings estimates are algorithmic projections. Live deployment in CPSE production environments will integrate with official enterprise SAP ERP connectors and Government e-Marketplace (GeM) APIs.
                </p>
              </div>
            </div>
          )}

          {/* 8. PROBLEM-SOLUTION MAPPING (Section 49) */}
          {activeDoc === 'problem_solution' && (
            <div className="space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <span className="text-[10px] font-bold uppercase text-brand-600 tracking-wider">Document 08</span>
                <h2 className="text-xl font-black text-slate-900 mt-0.5">Problem-Solution Mapping Matrix (Section 49)</h2>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px]">
                      <th className="p-3 w-1/3">Core Problem</th>
                      <th className="p-3">MatiSync System Solution</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    <tr className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">Duplicate codes across CPSEs</td>
                      <td className="p-3 text-slate-800">AI duplicate detection (hybrid TF-IDF + RapidFuzz similarity)</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">Different descriptions &amp; naming conventions</td>
                      <td className="p-3 text-slate-800">NLP normalization &amp; ASME B36.10M nominal bore engineering tolerances</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">Technical ambiguity &amp; physical mismatch</td>
                      <td className="p-3 text-slate-800">Attribute extraction + deterministic safety conflict interlocks (e.g. SCH40 vs SCH80)</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">Fragmented data silos</td>
                      <td className="p-3 text-slate-800">National Unified Material Master &amp; deterministic Proposed CNMC standards</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">Difficult, opaque comparisons</td>
                      <td className="p-3 text-slate-800">Explainable AI with granular spec matrices &amp; active learning history</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">Bloated legacy ERP codes</td>
                      <td className="p-3 text-slate-800">Legacy code rationalization lifecycle (Retain, Map, Rationalize, Deprecate)</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">Separate, uncoordinated procurement</td>
                      <td className="p-3 text-slate-800">Cross-CPSE demand aggregation &amp; volume purchase intelligence</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">No governance or audit traceability</td>
                      <td className="p-3 text-slate-800">RBAC + human approvals + FIPS 180-4 SHA-256 tamper-evident audit hash chain</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">Future ERP integration friction</td>
                      <td className="p-3 text-slate-800">API-ready architecture &amp; mock SAP RFC BAPI / IDoc connectors</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
