import React from 'react';
import { 
  ArrowRight, Layers, FileText, CheckCircle2, AlertTriangle, Building2, 
  Shield, Wrench, Search, ChevronRight, RefreshCw, Cpu, Database, Network
} from 'lucide-react';

interface Props {
  onNavigate: (view: string) => void;
  onOpenSearchBeforeCreate: () => void;
  onOpenResetDemo: () => void;
  onSelectDemoCase: (caseId: string) => void;
}

export const HomeView: React.FC<Props> = ({
  onNavigate,
  onOpenSearchBeforeCreate,
  onOpenResetDemo,
  onSelectDemoCase
}) => {
  return (
    <div className="space-y-6">
      {/* Top Welcome / Portal Mission Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded bg-slate-900 text-amber-400 text-[11px] font-bold tracking-wide">
                SIH 2026 &bull; PS 26099
              </span>
              <span className="text-slate-400 text-xs">|</span>
              <span className="text-xs font-semibold text-slate-700">
                Ministry of Petroleum & Natural Gas &bull; Chennai Petroleum Corporation Limited (CPCL)
              </span>
            </div>
            
            {/* 1B & 60: MatiSync Name & Tagline */}
            <div>
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded bg-brand-700 text-white flex items-center justify-center font-black text-xl tracking-tighter border border-brand-500 shadow-2xs">
                  M
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-none">
                    MatiSync
                  </h1>
                  <p className="text-xs font-bold text-brand-700 mt-1">
                    AI-powered material standardization for CPSEs
                  </p>
                </div>
              </div>
            </div>

            {/* Official SIH Problem Statement Title */}
            <div className="pt-1">
              <h2 className="text-sm md:text-base font-bold text-slate-800 tracking-tight">
                AI-Driven Standardization and Harmonization of Material Codes Across CPSEs
              </h2>
              <p className="text-slate-600 text-xs md:text-sm max-w-3xl leading-relaxed mt-0.5">
                AI-powered material intelligence for identifying duplicates, technical equivalence, standardization opportunities, and cross-CPSE procurement insights across CPCL, NTPC, ONGC, IOCL, SAIL, BPCL, BHEL, and CIL.
              </p>
            </div>
          </div>

          {/* Section 60 Required Buttons: Open Dashboard, Load Demo Data, Search Materials */}
          <div className="flex flex-wrap md:flex-col lg:flex-row gap-2 shrink-0">
            <button
              onClick={() => onNavigate('dashboard')}
              className="px-4 py-2 bg-brand-700 hover:bg-brand-600 text-white rounded text-xs font-bold flex items-center space-x-2 shadow-xs transition-colors"
            >
              <span>Open Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onOpenResetDemo}
              className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-300 rounded text-xs font-semibold flex items-center space-x-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-brand-700" />
              <span>Load Demo Data</span>
            </button>
            <button
              onClick={onOpenSearchBeforeCreate}
              className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-300 rounded text-xs font-semibold flex items-center space-x-1.5 transition-colors"
            >
              <Search className="w-3.5 h-3.5 text-brand-700" />
              <span>Search Materials</span>
            </button>
          </div>
        </div>

        {/* Core Operational Guideline */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
          <div className="flex items-center space-x-2 text-slate-800 font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span><strong>Engineering Principle:</strong> High text similarity never automatically means physical interchangeability. AI recommends, human experts verify, and the system cryptographically records every decision.</span>
          </div>
          <span className="text-slate-500 font-mono text-[11px] shrink-0">Standard: ASME B36.10M / IBR 1950</span>
        </div>
      </div>

      {/* 3 Presentation Demonstration Cases */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Prepared Jury Demonstration Scenarios
          </h2>
          <span className="text-[11px] text-slate-400">Click any card to launch interactive test flow</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Case 1 */}
          <div
            onClick={() => onSelectDemoCase('case_1')}
            className="p-4 bg-white border border-slate-200 rounded-lg hover:border-brand-500 hover:shadow-xs cursor-pointer transition-all space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Case 1 &bull; Near Duplicate
              </span>
              <span className="font-mono text-xs font-bold text-slate-600">94.5% Match</span>
            </div>
            <h3 className="text-xs font-bold text-slate-900 group-hover:text-brand-700 transition-colors">
              Engineering Tolerance & Nominal Bore
            </h3>
            <p className="text-[11px] text-slate-600 leading-snug">
              Compares <strong>CPCL CP-10452</strong> (2 INCH SCH 40) vs <strong>NTPC MAT-7821</strong> (50.8 MM SCH 40). ASME B36.10M tolerance engine maps 2" to 50.8 mm nominal bore correspondence.
            </p>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-brand-700 font-semibold">
              <span>Inspect Spec Comparison</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Case 2 */}
          <div
            onClick={() => onSelectDemoCase('case_2')}
            className="p-4 bg-white border border-slate-200 rounded-lg hover:border-rose-400 hover:shadow-xs cursor-pointer transition-all space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                Case 2 &bull; Technical Conflict
              </span>
              <span className="font-mono text-xs font-bold text-rose-700">Safety Interlock</span>
            </div>
            <h3 className="text-xs font-bold text-slate-900 group-hover:text-rose-700 transition-colors">
              Schedule 40 vs Schedule 80 Incompatibility
            </h3>
            <p className="text-[11px] text-slate-600 leading-snug">
              Compares <strong>CPCL CP-10452</strong> (SCH 40) vs <strong>IOCL IOC-8820</strong> (SCH 80). 96.8% text similarity is strictly held under safety override mandating <strong>Technical Review Required</strong>.
            </p>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-rose-700 font-semibold">
              <span>Inspect Safety Interlock</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Case 3 */}
          <div
            onClick={() => onSelectDemoCase('case_3')}
            className="p-4 bg-white border border-slate-200 rounded-lg hover:border-brand-500 hover:shadow-xs cursor-pointer transition-all space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                Case 3 &bull; Innovation
              </span>
              <span className="font-mono text-xs font-bold text-purple-800">Pre-Creation</span>
            </div>
            <h3 className="text-xs font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
              Search-Before-Create Gateway
            </h3>
            <p className="text-[11px] text-slate-600 leading-snug">
              Interactive store officer workflow that searches national approved common materials before creating new entries, preventing duplicate proliferation at source.
            </p>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-purple-700 font-semibold">
              <span>Launch Live Gateway</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Section 60: Short Architecture Explanation */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              System Architecture &amp; Data Pipeline (Section 60 &amp; 68)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              How MatiSync ingests heterogeneous CPSE catalog data and delivers standardized national master intelligence
            </p>
          </div>
          <button
            onClick={() => onNavigate('problem_solution')}
            className="text-xs font-bold text-brand-700 hover:text-brand-900 flex items-center space-x-1"
          >
            <span>Problem-Solution Matrix</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Visual Pipeline Flowchart */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2 text-center text-xs">
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
            <span className="text-[10px] font-mono text-slate-400 block">Step 01</span>
            <span className="font-bold text-slate-900 block mt-1">CPSE Catalog Ingestion</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">CSV / ERP Data</span>
          </div>

          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
            <span className="text-[10px] font-mono text-slate-400 block">Step 02</span>
            <span className="font-bold text-slate-900 block mt-1">Data Quality Scoring</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">0–100 Intelligence</span>
          </div>

          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
            <span className="text-[10px] font-mono text-slate-400 block">Step 03</span>
            <span className="font-bold text-slate-900 block mt-1">NLP Normalization</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Units & Symbols</span>
          </div>

          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
            <span className="text-[10px] font-mono text-slate-400 block">Step 04</span>
            <span className="font-bold text-slate-900 block mt-1">Attribute Extraction</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Specs, Grade, Size</span>
          </div>

          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
            <span className="text-[10px] font-mono text-slate-400 block">Step 05</span>
            <span className="font-bold text-brand-800 block mt-1">Hybrid AI Matching</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">TF-IDF + RapidFuzz</span>
          </div>

          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded">
            <span className="text-[10px] font-mono text-amber-800 block">Step 06</span>
            <span className="font-bold text-amber-950 block mt-1">Conflict Interlocks</span>
            <span className="text-[10px] text-amber-800 block mt-0.5">Physical Safety</span>
          </div>

          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded">
            <span className="text-[10px] font-mono text-emerald-800 block">Step 07</span>
            <span className="font-bold text-emerald-950 block mt-1">Expert Sign-Off</span>
            <span className="text-[10px] text-emerald-800 block mt-0.5">Human Approval</span>
          </div>

          <div className="p-2.5 bg-brand-50 border border-brand-200 rounded">
            <span className="text-[10px] font-mono text-brand-700 block">Step 08</span>
            <span className="font-bold text-brand-950 block mt-1">Proposed CNMC</span>
            <span className="text-[10px] text-brand-700 block mt-0.5">SHA-256 Audit Log</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1">
            <div className="flex items-center space-x-1.5 font-bold text-slate-900">
              <Database className="w-4 h-4 text-brand-700" />
              <span>4-Stage Data Preservation</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Original CPSE descriptions and local numbers are never overwritten. Every item maintains Original, Normalized, Standardized, and Final Approved representations.
            </p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1">
            <div className="flex items-center space-x-1.5 font-bold text-slate-900">
              <Shield className="w-4 h-4 text-brand-700" />
              <span>Cryptographic Tamper-Evidence</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Every master change, approval, override, and login is recorded in a SHA-256 hash chain with instant integrity verification and tamper simulation.
            </p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1">
            <div className="flex items-center space-x-1.5 font-bold text-slate-900">
              <Network className="w-4 h-4 text-brand-700" />
              <span>ERP-Ready Integration</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Non-invasive umbrella architecture synchronizes Proposed CNMCs via mock SAP RFC BAPIs and IDocs without risking live refinery operations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
