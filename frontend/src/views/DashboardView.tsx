import React, { useState, useEffect } from 'react';
import { Layers, Database, ShieldAlert, FileText, TrendingUp, RefreshCw, CheckCircle2, Clock, ArrowUpRight } from 'lucide-react';
import { api } from '../services/api';
import { DashboardKPIs } from '../types';

interface Props {
  onNavigate: (view: string) => void;
  onOpenSearchBeforeCreate: () => void;
}

export const DashboardView: React.FC<Props> = ({ onNavigate, onOpenSearchBeforeCreate }) => {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [runningAI, setRunningAI] = useState(false);
  const [runMessage, setRunMessage] = useState<string | null>(null);

  const fetchKpis = async () => {
    try {
      const data = await api.getDashboardKPIs();
      setKpis(data);
    } catch (err) {
      console.error('Failed to load KPIs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKpis();
  }, []);

  const handleRunAI = async () => {
    setRunningAI(true);
    setRunMessage(null);
    try {
      const res = await api.runMatching('oil_and_gas');
      setRunMessage(`Catalog reconciliation complete: ${res.new_matches_identified} candidate pairs analyzed, ${res.new_conflicts_flagged} safety conflict interlocks verified.`);
      fetchKpis();
    } catch (err: any) {
      setRunMessage(`Execution error: ${err.message}`);
    } finally {
      setRunningAI(false);
    }
  };

  const cpseLocationNames: Record<string, string> = {
    CPCL: 'Manali Refinery, Chennai (TN)',
    NTPC: 'Simhadri Thermal Plant (AP)',
    ONGC: 'Hazira Gas Processing (GJ)',
    IOCL: 'Panipat Refinery (HR)',
    SAIL: 'Bhilai Steel Plant (CG)',
    BPCL: 'Kochi Refinery (KL)',
    BHEL: 'Heavy Electricals, Haridwar (UK)',
    CIL: 'SECL Gevra Coal Mines (CG)'
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-zinc-400 dark:text-zinc-500 text-xs flex items-center justify-center gap-2">
        <RefreshCw className="w-4 h-4 animate-spin text-emerald-600 dark:text-emerald-400" />
        <span>Loading telemetry metrics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header Card - Warm Obsidian Minimal */}
      <div className="bg-white dark:bg-[#141417] border border-zinc-200 dark:border-zinc-800/80 rounded-xl p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
              National Material Harmonization Command Center
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/60">
              FY 2025-26
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Real-time material code standardization across CPCL, NTPC, ONGC, IOCL, SAIL, BPCL, BHEL &amp; CIL
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs shrink-0">
          <button
            onClick={fetchKpis}
            className="p-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-[#1a1a1f] hover:bg-zinc-50 dark:hover:bg-[#222228] text-zinc-500 dark:text-zinc-400 transition-colors"
            title="Refresh database metrics"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          
          <button
            onClick={onOpenSearchBeforeCreate}
            className="px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-[#1a1a1f] hover:bg-zinc-50 dark:hover:bg-[#222228] text-zinc-700 dark:text-zinc-200 font-medium flex items-center space-x-1.5 transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Search Before Create</span>
          </button>

          <button
            onClick={handleRunAI}
            disabled={runningAI}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white rounded-lg font-medium flex items-center space-x-1.5 shadow-2xs disabled:opacity-50 transition-colors"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{runningAI ? 'Reconciling...' : 'Run Reconciliation'}</span>
          </button>
        </div>
      </div>

      {runMessage && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{runMessage}</span>
          </div>
          <button onClick={() => setRunMessage(null)} className="text-emerald-700 dark:text-emerald-400 font-bold ml-2 hover:opacity-75">&times;</button>
        </div>
      )}

      {/* KPI Cards Grid - Matte Obsidian Charcoal Minimal */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Total Cataloged Items */}
        <div
          onClick={() => onNavigate('materials')}
          className="p-4 bg-white dark:bg-[#151518] border border-zinc-200 dark:border-zinc-800/80 hover:border-emerald-500/40 rounded-xl shadow-2xs cursor-pointer transition-all group"
        >
          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
            <span>Total Cataloged Items</span>
            <Database className="w-3.5 h-3.5 text-zinc-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mt-1.5">{kpis?.total_materials || 0}</div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">Across 8 public sector units</div>
        </div>

        {/* Duplicates Identified */}
        <div
          onClick={() => onNavigate('matching')}
          className="p-4 bg-white dark:bg-[#151518] border border-zinc-200 dark:border-zinc-800/80 hover:border-emerald-500/40 rounded-xl shadow-2xs cursor-pointer transition-all group"
        >
          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
            <span>Potential Duplicates</span>
            <Layers className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 mt-1.5">
            {(kpis?.exact_duplicates || 0) + (kpis?.near_duplicates || 0)}
          </div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
            {kpis?.exact_duplicates} exact &bull; {kpis?.near_duplicates} near duplicate
          </div>
        </div>

        {/* Technical Safety Conflicts */}
        <div
          onClick={() => onNavigate('matching')}
          className="p-4 bg-white dark:bg-[#151518] border border-amber-200/80 dark:border-amber-800/60 hover:border-amber-400 rounded-xl shadow-2xs cursor-pointer transition-all group"
        >
          <div className="text-xs font-medium text-amber-700 dark:text-amber-400 flex items-center justify-between">
            <span>Safety Conflicts</span>
            <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400 mt-1.5">{kpis?.technical_conflicts || 0}</div>
          <div className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-1">Override held on critical specs</div>
        </div>

        {/* Proposed Common Codes (CNMC) */}
        <div
          onClick={() => onNavigate('cnmc')}
          className="p-4 bg-white dark:bg-[#151518] border border-zinc-200 dark:border-zinc-800/80 hover:border-teal-500/40 rounded-xl shadow-2xs cursor-pointer transition-all group"
        >
          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
            <span>Common Standards (CNMC)</span>
            <FileText className="w-3.5 h-3.5 text-teal-500" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-teal-600 dark:text-teal-400 mt-1.5">{kpis?.proposed_cnmcs || 0}</div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">Standardized national codes</div>
        </div>

        {/* Average Data Quality */}
        <div
          onClick={() => onNavigate('quality')}
          className="p-4 bg-white dark:bg-[#151518] border border-zinc-200 dark:border-zinc-800/80 hover:border-emerald-500/40 rounded-xl shadow-2xs cursor-pointer transition-all group"
        >
          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Average Quality Score
          </div>
          <div className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mt-1.5">{kpis?.average_data_quality || 0}%</div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">Completeness &amp; standardization</div>
        </div>

        {/* Pooled Procurement Sourcing Pools */}
        <div
          onClick={() => onNavigate('procurement')}
          className="p-4 bg-white dark:bg-[#151518] border border-zinc-200 dark:border-zinc-800/80 hover:border-emerald-500/40 rounded-xl shadow-2xs cursor-pointer transition-all group"
        >
          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Demand Aggregation Pools
          </div>
          <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 mt-1.5">{kpis?.procurement_opportunities || 0}</div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">Multi-CPSE bulk tenders</div>
        </div>

        {/* Pending Technical Reviews */}
        <div
          onClick={() => onNavigate('approval_center')}
          className="p-4 bg-white dark:bg-[#151518] border border-zinc-200 dark:border-zinc-800/80 hover:border-emerald-500/40 rounded-xl shadow-2xs cursor-pointer transition-all group"
        >
          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Pending Expert Approvals
          </div>
          <div className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mt-1.5">{kpis?.pending_approvals || 0}</div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">Awaiting metallurgist sign-off</div>
        </div>

        {/* Estimated Volume Savings */}
        <div
          onClick={() => onNavigate('procurement')}
          className="p-4 bg-white dark:bg-[#151518] border border-zinc-200 dark:border-zinc-800/80 hover:border-emerald-500/40 rounded-xl shadow-2xs cursor-pointer transition-all group"
        >
          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Estimated Bulk Savings
          </div>
          <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 mt-1.5">
            ₹{((kpis?.potential_savings_estimate || 0) / 100000).toFixed(1)}L
          </div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">~9.5% bulk procurement tier</div>
        </div>
      </div>

      {/* Main Content Split: Refinery Distribution & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* CPSE Organization Table */}
        <div className="bg-white dark:bg-[#141417] border border-zinc-200 dark:border-zinc-800/80 rounded-xl p-5 shadow-2xs transition-colors">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/60 pb-3 mb-3">
            <div>
              <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                Participating CPSE Plant Master Distribution
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">Connected refineries, power stations, and mining complexes</p>
            </div>
            <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{kpis?.connected_cpses} Operating Units</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-zinc-400 dark:text-zinc-500 text-[10px] uppercase border-b border-zinc-100 dark:border-zinc-800/60 font-medium">
                  <th className="py-2">CPSE Entity</th>
                  <th className="py-2">Plant Location</th>
                  <th className="py-2 text-right">Items</th>
                  <th className="py-2 text-right">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-mono text-[11px]">
                {kpis?.materials_by_cpse && Object.entries(kpis.materials_by_cpse).map(([cpse, count]) => {
                  const total = kpis.total_materials || 1;
                  const pct = Math.round((count / total) * 100);
                  const location = cpseLocationNames[cpse] || 'Operating Unit';
                  return (
                    <tr key={cpse} className="hover:bg-zinc-50/60 dark:hover:bg-[#1c1c22]/50 transition-colors">
                      <td className="py-2.5 font-bold text-zinc-900 dark:text-zinc-100">{cpse}</td>
                      <td className="py-2.5 font-sans text-zinc-500 dark:text-zinc-400 text-[11px]">{location}</td>
                      <td className="py-2.5 text-right text-zinc-800 dark:text-zinc-200">{count}</td>
                      <td className="py-2.5 text-right">
                        <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-[10px] font-medium">
                          {pct}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Industrial Category Breakdown */}
        <div className="bg-white dark:bg-[#141417] border border-zinc-200 dark:border-zinc-800/80 rounded-xl p-5 shadow-2xs flex flex-col justify-between transition-colors">
          <div>
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/60 pb-3 mb-3">
              <div>
                <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                  Material Family Harmonization Breakdown
                </h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">Distribution across plant spares and consumable families</p>
              </div>
              <span className="text-xs font-mono text-zinc-500 font-medium">6 Main Families</span>
            </div>

            <div className="space-y-3 pt-1">
              {kpis?.materials_by_category && Object.entries(kpis.materials_by_category).map(([cat, count]) => {
                const total = kpis.total_materials || 1;
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-zinc-800 dark:text-zinc-200 text-[11px]">{cat}</span>
                      <span className="text-zinc-500 dark:text-zinc-400 font-mono text-[11px]">{count} items ({pct}%)</span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 dark:bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/60 flex justify-end mt-4">
            <button
              onClick={() => onNavigate('cnmc')}
              className="text-emerald-600 dark:text-emerald-400 hover:underline text-xs font-medium flex items-center space-x-1"
            >
              <span>Explore Common National Codes</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Recent Master Governance Activity Feed */}
      <div className="bg-white dark:bg-[#141417] border border-zinc-200 dark:border-zinc-800/80 rounded-xl p-5 shadow-2xs transition-colors">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/60 pb-3 mb-3">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-zinc-400" />
            <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
              Recent Master Governance Audit Trail
            </h3>
          </div>
          <button
            onClick={() => onNavigate('audit')}
            className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            <span>View Full SHA-256 Audit Chain</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-zinc-400 dark:text-zinc-500 text-[10px] uppercase border-b border-zinc-100 dark:border-zinc-800/60 font-medium">
                <th className="py-2">Block #</th>
                <th className="py-2">Action Code</th>
                <th className="py-2">Officer</th>
                <th className="py-2">Operational Justification</th>
                <th className="py-2 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 text-[11px]">
              {kpis?.recent_activities && kpis.recent_activities.slice(0, 5).map((act, idx) => (
                <tr key={idx} className="hover:bg-zinc-50/60 dark:hover:bg-[#1c1c22]/50 transition-colors">
                  <td className="py-2.5 font-mono font-bold text-zinc-700 dark:text-zinc-300">#{act.sequence}</td>
                  <td className="py-2.5">
                    <span className="font-mono text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                      {act.action}
                    </span>
                  </td>
                  <td className="py-2.5 font-medium text-zinc-800 dark:text-zinc-200">{act.user}</td>
                  <td className="py-2.5 text-zinc-500 dark:text-zinc-400 max-w-sm truncate">{act.reason}</td>
                  <td className="py-2.5 text-right text-zinc-400 dark:text-zinc-500 font-mono text-[10px]">
                    {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
