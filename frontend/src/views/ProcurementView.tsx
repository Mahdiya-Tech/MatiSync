import React, { useState, useEffect } from 'react';
import { ShoppingCart, TrendingDown, Building2, FileSpreadsheet, ShieldAlert, CheckCircle, ChevronRight, Download } from 'lucide-react';
import { ProcurementOpportunity } from '../types';
import { api } from '../services/api';

export const ProcurementView: React.FC = () => {
  const [opportunities, setOpportunities] = useState<ProcurementOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOpp, setSelectedOpp] = useState<ProcurementOpportunity | null>(null);
  const [tenderDraftModal, setTenderDraftModal] = useState<ProcurementOpportunity | null>(null);

  useEffect(() => {
    const fetchOps = async () => {
      setLoading(true);
      try {
        const data = await api.getProcurementOpportunities();
        setOpportunities(data);
      } catch (err) {
        console.error('Failed to load procurement opportunities:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOps();
  }, []);

  const totalAggregatedSpend = opportunities.reduce((acc, o) => acc + (o.total_spend || 0), 0);
  const totalLowerSavings = opportunities.reduce((acc, o) => acc + (o.estimated_savings_lower || 0), 0);
  const totalUpperSavings = opportunities.reduce((acc, o) => acc + (o.estimated_savings_upper || 0), 0);

  const formatLakhs = (val: number) => {
    if (val >= 10000000) {
      return `₹ ${(val / 10000000).toFixed(2)} Cr`;
    }
    return `₹ ${(val / 100000).toFixed(1)} Lakhs`;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base font-bold text-slate-900 tracking-tight">Cross-CPSE Demand Aggregation & Strategic Sourcing</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
              {opportunities.length} Active Sourcing Pools
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Consolidating identical material master specifications across CPSE plants for bulk procurement discounts under CVC Public Procurement Guidelines
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs">
          <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded font-mono font-semibold">
            GeM BoQ Integration Ready
          </span>
        </div>
      </div>

      {/* Aggregate KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Aggregated Sourcing Categories</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{opportunities.length} Pools</div>
          <div className="text-[10px] text-slate-400 mt-1">Identified across active catalog</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-blue-200 shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-blue-700">Combined Annual Spend</div>
          <div className="text-2xl font-black text-blue-900 mt-1">{formatLakhs(totalAggregatedSpend)}</div>
          <div className="text-[10px] text-blue-600 mt-1">Fragmented CPSE procurement volume</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-emerald-200 shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 flex items-center space-x-1">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>Est. Annual Savings Potential</span>
          </div>
          <div className="text-2xl font-black text-emerald-900 mt-1">
            {formatLakhs(totalLowerSavings)} – {formatLakhs(totalUpperSavings)}
          </div>
          <div className="text-[10px] text-emerald-600 mt-1 font-medium">Approx 9.5% – 14.8% bulk volume discount</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-brand-200 shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">Collaborating Entities</div>
          <div className="text-2xl font-black text-brand-900 mt-1">8 CPSEs</div>
          <div className="text-[10px] text-brand-600 mt-1">CPCL, NTPC, ONGC, IOCL, SAIL, BPCL, BHEL, CIL</div>
        </div>
      </div>

      {/* Synthetic Data Disclaimer */}
      <div className="bg-slate-50 border border-slate-200 p-3 rounded text-[11px] text-slate-600 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-slate-800">Analytical Methodology Note:</span>
          <span>Procurement volume figures shown are simulated representative historical purchase orders calibrated for the SIH 2026 demonstration environment.</span>
        </div>
        <span className="text-[10px] font-mono text-slate-400">Model: DISC-EST-V1</span>
      </div>

      {/* Opportunities Grid */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          Active Joint Sourcing Opportunities
        </h2>

        {loading ? (
          <div className="bg-white py-12 text-center text-xs text-slate-400 rounded-lg border border-slate-200">
            Analyzing cross-CPSE purchase orders and volume discount curves...
          </div>
        ) : opportunities.length === 0 ? (
          <div className="bg-white py-12 text-center text-xs text-slate-500 rounded-lg border border-slate-200">
            No procurement opportunities currently recorded. Run AI matching to discover common material clusters.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {opportunities.map((opp) => (
              <div
                key={opp.id}
                className="bg-white rounded-lg border border-slate-200 shadow-xs hover:border-slate-300 transition-all p-5"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-50 text-brand-800 border border-brand-200">
                        {opp.category}
                      </span>
                      {opp.cnmc_code && (
                        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          {opp.cnmc_code}
                        </span>
                      )}
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                        {opp.status}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900">{opp.title}</h3>
                    <p className="text-xs text-slate-600 max-w-2xl">{opp.description}</p>
                  </div>

                  <div className="flex flex-wrap md:flex-col items-end gap-2 shrink-0">
                    <button
                      onClick={() => setTenderDraftModal(opp)}
                      className="px-3 py-1.5 rounded bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-xs flex items-center space-x-1.5"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Draft Joint Tender</span>
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Participating CPSEs</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {opp.participating_cpse_codes.map((code) => (
                        <span key={code} className="px-1.5 py-0.5 rounded bg-slate-100 font-semibold text-slate-700 text-[10px]">
                          {code}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Combined Annual Quantity</span>
                    <div className="font-bold text-slate-900 text-sm mt-0.5">
                      {opp.total_quantity.toLocaleString()} units
                    </div>
                    <div className="text-[10px] text-slate-500">Aggregated annual demand</div>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Current Total Spend</span>
                    <div className="font-bold text-slate-900 text-sm mt-0.5">
                      {formatLakhs(opp.total_spend)}
                    </div>
                    <div className="text-[10px] text-slate-500">Separately contracted</div>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-700 block">Projected Savings</span>
                    <div className="font-extrabold text-emerald-800 text-sm mt-0.5">
                      {formatLakhs(opp.estimated_savings_lower)} – {formatLakhs(opp.estimated_savings_upper)}
                    </div>
                    <div className="text-[10px] text-emerald-600 font-semibold">
                      ~{opp.savings_percentage_est}% discount tier
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Joint Tender Draft Preview Modal */}
      {tenderDraftModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-lg shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden">
            <div className="px-5 py-4 bg-brand-950 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-brand-300 block">
                  MoPNG Joint E-Procurement Framework
                </span>
                <h3 className="font-bold text-sm text-white">Aggregated E-Procurement Tender Specification</h3>
              </div>
              <button
                onClick={() => setTenderDraftModal(null)}
                className="text-slate-400 hover:text-white text-base font-bold"
              >
                &times;
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs max-h-[70vh] overflow-y-auto">
              <div className="bg-slate-50 p-3 rounded border border-slate-200">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Target Material Specification</span>
                  <span className="font-mono text-[10px] bg-brand-100 text-brand-900 px-1.5 py-0.5 rounded font-bold">
                    {tenderDraftModal.cnmc_code || 'NMC-PENDING'}
                  </span>
                </div>
                <div className="font-bold text-slate-900 text-sm">{tenderDraftModal.title}</div>
                <div className="text-slate-600 mt-1">{tenderDraftModal.description}</div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2">
                  Participating Consignee Allocation
                </h4>
                <table className="w-full text-left border-collapse border border-slate-200">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 text-[10px] uppercase">
                      <th className="p-2 border border-slate-200">Consignee CPSE</th>
                      <th className="p-2 border border-slate-200">Operating Refinery / Plant</th>
                      <th className="p-2 border border-slate-200">Quantity Share</th>
                      <th className="p-2 border border-slate-200">Delivery Window</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenderDraftModal.participating_cpse_codes.map((cpse, idx) => (
                      <tr key={cpse} className="border-b border-slate-200">
                        <td className="p-2 font-bold text-brand-900">{cpse}</td>
                        <td className="p-2 text-slate-600">
                          {cpse === 'CPCL' ? 'Manali Refinery, Chennai' : cpse === 'NTPC' ? 'Simhadri Super Thermal Plant' : 'Hazira Production Complex'}
                        </td>
                        <td className="p-2 font-mono font-medium">
                          {Math.round(tenderDraftModal.total_quantity / tenderDraftModal.participating_cpse_codes.length).toLocaleString()} units
                        </td>
                        <td className="p-2 text-slate-500">Staggered (Q1-Q4)</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded text-emerald-900">
                <div className="font-bold text-[11px]">Calculated Volume Sourcing Advantage</div>
                <div className="mt-1 text-[11px]">
                  Aggregating this demand under Proposed Code {tenderDraftModal.cnmc_code} shifts purchasing power from Tier-1 Retail Contract to Tier-4 OEM Manufacturer Contract, yielding a projected direct treasury savings of {formatLakhs(tenderDraftModal.estimated_savings_lower)} to {formatLakhs(tenderDraftModal.estimated_savings_upper)}.
                </div>
              </div>
            </div>

            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-mono">Status: Ready for GeM API Export</span>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setTenderDraftModal(null)}
                  className="px-3 py-1.5 rounded border border-slate-200 bg-white text-slate-700 text-xs font-medium hover:bg-slate-50"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    alert('Simulated GeM API Export: Tender schedule published to Government e-Marketplace staging environment.');
                    setTenderDraftModal(null);
                  }}
                  className="px-3 py-1.5 rounded bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-xs flex items-center space-x-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export to GeM Portal</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
