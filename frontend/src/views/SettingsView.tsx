import React, { useState } from 'react';
import { Settings, Sliders, Shield, RefreshCw, Cpu, Database, CheckCircle, Info } from 'lucide-react';
import { api } from '../services/api';

interface Props {
  activeSector: string;
  onSectorChange: (sector: string) => void;
  pilotMode: boolean;
  onTogglePilotMode: (mode: boolean) => void;
  onOpenResetDemo: () => void;
}

export const SettingsView: React.FC<Props> = ({
  activeSector,
  onSectorChange,
  pilotMode,
  onTogglePilotMode,
  onOpenResetDemo
}) => {
  const [exactThreshold, setExactThreshold] = useState<number>(95);
  const [nearThreshold, setNearThreshold] = useState<number>(85);
  const [potentialThreshold, setPotentialThreshold] = useState<number>(65);
  const [savedMsg, setSavedMsg] = useState<boolean>(false);

  const handleSave = () => {
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {savedMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded shadow-md flex items-center justify-between text-xs animate-fadeIn">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold">Configuration parameters updated in system runtime.</span>
          </div>
          <button onClick={() => setSavedMsg(false)} className="text-emerald-700 hover:text-emerald-900 font-bold">&times;</button>
        </div>
      )}

      {/* Page Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base font-bold text-slate-900 tracking-tight">Platform Governance & Sector Configurations</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
              Active Sector: {activeSector.toUpperCase()}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure sector-specific weight matrices, matching threshold sensitivity, and deployment phases
          </p>
        </div>
        <button
          onClick={handleSave}
          className="px-3.5 py-1.5 rounded bg-brand-700 hover:bg-brand-600 text-white text-xs font-bold shadow-2xs"
        >
          Save Configuration
        </button>
      </div>

      <div className="bg-amber-50/80 border border-amber-200 rounded-lg p-3.5 flex items-start space-x-3 text-xs text-amber-900">
        <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p className="font-semibold text-amber-950">Sector-Specific Standardization Rules & Safety Policies</p>
          <p className="text-slate-600 leading-relaxed">
            Refining & Petrochemicals (CPCL/IOCL) enforces strict ASTM schedule ratings for high-pressure volatile hydrocarbons under OISD-118, while Thermal Power (NTPC) prioritizes ASME Section I boiler tube temperature limits under IBR 1950. Dynamic attribute matrices adapt tolerance filters accordingly.
          </p>
        </div>
      </div>

      {/* Grid Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sector & Deployment Phase */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Sliders className="w-4 h-4 text-brand-600" />
            <h3 className="font-bold text-slate-900 text-sm">Sector Domain & Deployment Scope</h3>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Active Sector Rule Matrix
            </label>
            <select
              value={activeSector}
              onChange={(e) => onSectorChange(e.target.value)}
              className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded font-medium focus:outline-none focus:border-brand-500"
            >
              <option value="oil_and_gas">Oil & Gas (Refineries, Petrochem, Upstream) [CPCL, ONGC, IOCL, BPCL]</option>
              <option value="power">Power Generation (Thermal, Supercritical, Hydro) [NTPC, BHEL]</option>
              <option value="steel">Steel & Metallurgy (Blast Furnace, Rolling Mills) [SAIL]</option>
              <option value="mining">Mining & Coal Operations (Heavy Conveyance, Beneficiation) [CIL]</option>
              <option value="heavy_engineering">Heavy Engineering & Turbomachinery [BHEL]</option>
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              Sector dictates attribute priority weights (e.g., Oil & Gas prioritizes ASTM/ASME Schedule & Class ratings).
            </p>
          </div>

          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Deployment Phase
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onTogglePilotMode(true)}
                className={`p-3 text-left rounded border transition-all ${
                  pilotMode
                    ? 'border-brand-600 bg-brand-50 text-brand-900 font-semibold shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="text-xs font-bold">Pilot Mode</div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  CPCL & NTPC bilateral testing phase
                </div>
              </button>
              <button
                type="button"
                onClick={() => onTogglePilotMode(false)}
                className={`p-3 text-left rounded border transition-all ${
                  !pilotMode
                    ? 'border-brand-600 bg-brand-50 text-brand-900 font-semibold shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="text-xs font-bold">Full National Rollout</div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  All 8 CPSEs cross-harmonization
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* AI Matching Thresholds */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Cpu className="w-4 h-4 text-brand-600" />
            <h3 className="font-bold text-slate-900 text-sm">AI Matching Sensitivity Thresholds</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>Exact Duplicate Threshold</span>
                <span className="font-mono text-brand-700">{exactThreshold}%</span>
              </div>
              <input
                type="range"
                min="80"
                max="100"
                value={exactThreshold}
                onChange={(e) => setExactThreshold(Number(e.target.value))}
                className="w-full accent-brand-600"
              />
              <span className="text-[10px] text-slate-500">Pairs above this are designated Exact Duplicates.</span>
            </div>

            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>Near Duplicate Threshold</span>
                <span className="font-mono text-brand-700">{nearThreshold}%</span>
              </div>
              <input
                type="range"
                min="70"
                max="95"
                value={nearThreshold}
                onChange={(e) => setNearThreshold(Number(e.target.value))}
                className="w-full accent-brand-600"
              />
              <span className="text-[10px] text-slate-500">Pairs between {nearThreshold}% and {exactThreshold}% with compatible tolerance.</span>
            </div>

            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>Potential Match Threshold</span>
                <span className="font-mono text-brand-700">{potentialThreshold}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="80"
                value={potentialThreshold}
                onChange={(e) => setPotentialThreshold(Number(e.target.value))}
                className="w-full accent-brand-600"
              />
              <span className="text-[10px] text-slate-500">Lower bound for surfacing candidates to technical experts.</span>
            </div>
          </div>
        </div>

        {/* Feature Weights & Active Learning */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Database className="w-4 h-4 text-brand-600" />
            <h3 className="font-bold text-slate-900 text-sm">Feature Weight Distribution</h3>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200">
              <span className="font-semibold text-slate-800">Physical Spec Attribute Match</span>
              <span className="font-mono font-bold text-brand-700">35%</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200">
              <span className="font-semibold text-slate-800">TF-IDF N-gram Token Overlap</span>
              <span className="font-mono font-bold text-brand-700">25%</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200">
              <span className="font-semibold text-slate-800">Engineering Tolerance Equivalence (ASME B36.10M)</span>
              <span className="font-mono font-bold text-brand-700">20%</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200">
              <span className="font-semibold text-slate-800">RapidFuzz Token Sort Similarity</span>
              <span className="font-mono font-bold text-brand-700">20%</span>
            </div>
          </div>
        </div>

        {/* Reset Demo Data & System Diagnostics */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Shield className="w-4 h-4 text-brand-600" />
            <h3 className="font-bold text-slate-900 text-sm">System Diagnostics & Reset</h3>
          </div>

          <div className="space-y-2 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Platform:</span>
              <span className="font-semibold text-slate-800">MatiSync Enterprise v1.4</span>
            </div>
            <div className="flex justify-between">
              <span>Problem Statement:</span>
              <span className="font-semibold text-slate-800">SIH 2026 PS 26099 (MoPNG / CPCL)</span>
            </div>
            <div className="flex justify-between">
              <span>Database Backend:</span>
              <span className="font-semibold text-slate-800">SQLite 3 / PostgreSQL (Dual Supported)</span>
            </div>
            <div className="flex justify-between">
              <span>Hash Engine:</span>
              <span className="font-semibold text-slate-800">FIPS 180-4 SHA-256</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-rose-900 text-xs">Reset Demonstration Database</div>
                <div className="text-[10px] text-slate-500">Restores initial 134 materials, demo cases, and clean audit chain.</div>
              </div>
              <button
                type="button"
                onClick={onOpenResetDemo}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-xs font-semibold flex items-center space-x-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset Demo</span>
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 34: SAP / ERP Enterprise Integration Gateway */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4 md:col-span-2">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Database className="w-4 h-4 text-brand-600" />
            <h3 className="font-bold text-slate-900 text-sm">SAP / ERP Enterprise Integration Architecture (Section 34)</h3>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            MatiSync acts as an authoritative standardization umbrella across CPSEs without disrupting legacy transactional ERP backends. Standardized specifications and Proposed CNMCs are synchronized to plant ERPs via standard SAP RFC BAPIs (<code>BAPI_MATERIAL_MAINTAINDATA_RT</code>) and IDocs (<code>MATMAS05</code>).
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Gateway Status</span>
              <span className="font-bold text-emerald-700 flex items-center space-x-1 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>ONLINE (Simulated Mode)</span>
              </span>
              <span className="text-[10px] text-slate-400 mt-1 block">SAP RFC / OData v4 Ready</span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Target Enterprise ERP</span>
              <span className="font-bold text-slate-800 block mt-1">CPCL SAP S/4HANA (Plant 1000)</span>
              <span className="text-[10px] text-slate-400 mt-1 block">IDoc Type: MATMAS05</span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Simulate ERP Sync</span>
              <div className="flex space-x-2 mt-2">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const res = await api.syncToSap('SAP_S4HANA', 'CPCL');
                      alert(`[SAP S/4HANA Gateway Success]\n${res.message}\nTransaction Ref: ${res.transaction_id}\nRecords Dispatched: ${res.materials_synced}`);
                    } catch (err: any) {
                      alert(`Sync simulation failed: ${err.message}`);
                    }
                  }}
                  className="px-2.5 py-1.5 bg-brand-700 hover:bg-brand-600 text-white rounded font-bold text-[11px] shadow-2xs"
                >
                  Trigger Outbound BAPI Sync
                </button>
              </div>
            </div>
          </div>

          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-900">
            <strong>Architecture Boundary:</strong> The prototype implements the full ERP schema validation layer and mock BAPI/IDoc interfaces. Direct production SAP connections are simulated to protect real CPSE operational systems.
          </div>
        </div>
      </div>
    </div>
  );
};
