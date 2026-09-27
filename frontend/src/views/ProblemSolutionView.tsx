import React, { useState } from 'react';
import { 
  CheckCircle2, ArrowRight, Layers, Cpu, ShieldCheck, Database, 
  FileText, GitMerge, ShoppingCart, Lock, Server, ChevronRight
} from 'lucide-react';

interface Props {
  onNavigate: (viewId: string) => void;
}

interface MappingItem {
  problem: string;
  solution: string;
  component: string;
  viewTarget: string;
  icon: any;
  painPoint: string;
  systemMechanism: string;
  demoEvidence: string;
}

const PROBLEM_SOLUTION_DATA: MappingItem[] = [
  {
    problem: 'Duplicate codes across CPSEs',
    solution: 'AI duplicate detection & hybrid similarity engine',
    component: 'Hybrid Matching Engine (TF-IDF + RapidFuzz + Spec Matrix)',
    viewTarget: 'matching',
    icon: Cpu,
    painPoint: 'CPCL, NTPC, ONGC, and IOCL purchase identical items under isolated internal material numbers (e.g. CP-10452, MAT-7821, 009821).',
    systemMechanism: 'Bilateral hybrid matching combines token overlap (25%), RapidFuzz token sorting (20%), and physical attribute alignment (35%) with active learning weights.',
    demoEvidence: 'Identified 2,500+ pairwise cross-CPSE duplicate candidates in seed database.'
  },
  {
    problem: 'Different descriptions & abbreviations',
    solution: 'NLP normalization & engineering unit conversion',
    component: 'Data Normalization & Engineering Tolerance Engine',
    viewTarget: 'normalization',
    icon: Layers,
    painPoint: 'Inconsistent terminology across legacy systems: "SS" vs "S.S." vs "STAINLESS STEEL", or fractional inches vs metric mm.',
    systemMechanism: 'Standardizes abbreviations, dimensions, case, and units to SI equivalents while strictly applying ASME B36.10M nominal bore rules (e.g. 2 inch = 50.8 mm).',
    demoEvidence: 'Preserves 4-stage data pipeline (Original -> Normalized -> AI Standardized -> Final Approved) without overwriting source values.'
  },
  {
    problem: 'Technical ambiguity & physical mismatch',
    solution: 'Attribute extraction + safety conflict interlocks',
    component: 'Technical Conflict Detection Engine',
    viewTarget: 'matching',
    icon: ShieldCheck,
    painPoint: 'High text similarity can be fatal in industrial process plants if items are physically incompatible (e.g. SCH40 vs SCH80 pipe).',
    systemMechanism: 'Deterministic conflict rules for schedule, pressure class, temperature, and metallurgical grade automatically override high text similarity scores.',
    demoEvidence: 'Flags CPCL CP-10452 (SCH40) vs IOCL IOC-8820 (SCH80) as CRITICAL conflict (96.8% text similarity overridden to "Technical Review Required").'
  },
  {
    problem: 'Fragmented master data silos',
    solution: 'Unified national material master & Proposed CNMC',
    component: 'Proposed Common National Material Code (CNMC) Catalog',
    viewTarget: 'cnmc',
    icon: Database,
    painPoint: 'No common national vocabulary exists to compare or cross-reference inventory holdings between public sector enterprises.',
    systemMechanism: 'Proposes deterministic national codes (syntax: NMC-<CAT>-<MAT>-<SIZE>-<SPEC>-<SEQ>) with strict database uniqueness validation and code reuse.',
    demoEvidence: 'CNMC NMC-PIP-SS-050-S40-001 harmonizes 4 disparate CPSE codes while retaining all original ERP numbers intact.'
  },
  {
    problem: 'Difficult, opaque black-box comparisons',
    solution: 'Explainable AI with granular spec matrices',
    component: 'Explainable AI & Spec Inspection Matrix',
    viewTarget: 'matching',
    icon: FileText,
    painPoint: 'Store managers and plant metallurgists reject black-box AI scores when they cannot see why two materials were linked.',
    systemMechanism: 'Outputs transparent attribute breakdowns showing exact matching attributes, conflicting attributes, tolerance rules, and active learning history.',
    demoEvidence: 'Shows item-by-item breakdown (Material: SS304 Exact, Size: 50.8mm Nominal Bore, Standard: ASTM A312) in Side-by-Side inspector.'
  },
  {
    problem: 'Bloated legacy ERP material codes',
    solution: 'Legacy code rationalization lifecycle',
    component: 'Legacy Code Rationalization Workflow',
    viewTarget: 'rationalization',
    icon: GitMerge,
    painPoint: 'Decades of ERP operation result in thousands of redundant, obsolete, and non-moving items cluttering plant catalogs.',
    systemMechanism: 'Systematically classifies legacy items into Retain, Map to CNMC, Rationalize, or Deprecate with human approval tracking.',
    demoEvidence: 'Tracks legacy codes across all 8 CPSEs with audit-backed action history and transition status.'
  },
  {
    problem: 'Separate, uncoordinated procurement',
    solution: 'Cross-CPSE demand aggregation & spend analytics',
    component: 'Procurement Opportunity & Volume Aggregator',
    viewTarget: 'procurement',
    icon: ShoppingCart,
    painPoint: 'CPSEs issue separate small-batch tenders to the same vendors for identical commodities, losing bulk purchase discounts.',
    systemMechanism: 'Aggregates annual quantity and spend for identical Proposed CNMCs across CPCL, NTPC, ONGC, and IOCL to compute pooled procurement tenders.',
    demoEvidence: 'Synthesizes demand pools across synthetic purchase orders, indicating ~₹ 60.5 Lakhs in illustrative volume discount opportunities.'
  },
  {
    problem: 'No governance or audit traceability',
    solution: 'RBAC + human approvals + tamper-evident audit',
    component: 'Cryptographic SHA-256 Hash Chained Audit Trail',
    viewTarget: 'audit',
    icon: Lock,
    painPoint: 'Lack of accountability when catalog records are changed, and vulnerability to undetected database tampering.',
    systemMechanism: 'FIPS 180-4 SHA-256 cryptographic hash chain links every change, login, override, and CNMC assignment from genesis block to current head with live integrity verification.',
    demoEvidence: 'Live tamper simulation button intentionally mutates database row, immediately caught by audit verification engine.'
  },
  {
    problem: 'Future ERP integration friction',
    solution: 'API-ready architecture & mock SAP RFC/IDoc',
    component: 'SAP S/4HANA & ERP Integration Gateway',
    viewTarget: 'settings',
    icon: Server,
    painPoint: 'Connecting experimental systems directly to live enterprise transactional ERPs poses immense operational risk.',
    systemMechanism: 'Provides standardized REST API endpoints and mock SAP RFC BAPI (BAPI_MATERIAL_MAINTAINDATA_RT) and IDoc (MATMAS05) dispatch layers.',
    demoEvidence: 'Simulates outbound RFC dispatch to CPCL SAP S/4HANA Plant 1000 with mock transaction IDs and schema validation.'
  }
];

export const ProblemSolutionView: React.FC<Props> = ({ onNavigate }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base font-bold text-slate-900 tracking-tight">
              Problem-Solution Architecture Matrix (Section 49)
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-brand-50 text-brand-800 border border-brand-200">
              SIH PS 26099 Compliance
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Direct mapping of core public sector material catalog challenges to MatiSync's AI, governance, and engineering modules.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded font-mono font-semibold">
            9 Operational Solutions
          </span>
        </div>
      </div>

      {/* Main Comparison Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            System Solution Alignment Table
          </h2>
          <span className="text-[11px] text-slate-400">Click any row to view deep architectural evidence</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-100/70 text-slate-600 text-[10px] uppercase font-bold border-b border-slate-200">
                <th className="p-3 w-1/4">Industrial Problem</th>
                <th className="p-3 w-1/3">MatiSync System Solution</th>
                <th className="p-3">Platform Component</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {PROBLEM_SOLUTION_DATA.map((item, idx) => {
                const Icon = item.icon;
                const isExpanded = expandedIndex === idx;

                return (
                  <React.Fragment key={idx}>
                    <tr 
                      onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                      className={`cursor-pointer transition-colors ${
                        isExpanded ? 'bg-brand-50/60 font-medium' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="p-3 font-bold text-slate-900 flex items-center space-x-2">
                        <Icon className="w-4 h-4 text-brand-700 shrink-0" />
                        <span>{item.problem}</span>
                      </td>

                      <td className="p-3 text-slate-800 font-medium">
                        <div className="flex items-center space-x-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{item.solution}</span>
                        </div>
                      </td>

                      <td className="p-3 text-slate-600 font-mono text-[11px]">
                        {item.component}
                      </td>

                      <td className="p-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigate(item.viewTarget);
                          }}
                          className="px-2.5 py-1 bg-white hover:bg-brand-700 text-brand-800 hover:text-white border border-brand-300 rounded font-semibold text-[11px] inline-flex items-center space-x-1 transition-colors"
                        >
                          <span>Open View</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>

                    {/* Expanded Detail Panel */}
                    {isExpanded && (
                      <tr className="bg-slate-50/90 border-b border-slate-200">
                        <td colSpan={4} className="p-4 text-xs space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="p-3 bg-white border border-slate-200 rounded">
                              <span className="text-[10px] font-bold uppercase text-rose-800 block mb-1">
                                Legacy CPSE Pain Point
                              </span>
                              <p className="text-slate-600 text-[11px] leading-relaxed">
                                {item.painPoint}
                              </p>
                            </div>

                            <div className="p-3 bg-white border border-slate-200 rounded">
                              <span className="text-[10px] font-bold uppercase text-brand-800 block mb-1">
                                MatiSync Implementation Mechanism
                              </span>
                              <p className="text-slate-600 text-[11px] leading-relaxed">
                                {item.systemMechanism}
                              </p>
                            </div>

                            <div className="p-3 bg-white border border-slate-200 rounded">
                              <span className="text-[10px] font-bold uppercase text-emerald-800 block mb-1">
                                Live Demonstration Evidence
                              </span>
                              <p className="text-slate-600 text-[11px] leading-relaxed">
                                {item.demoEvidence}
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
