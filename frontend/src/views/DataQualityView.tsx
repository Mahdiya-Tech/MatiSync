import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertCircle, CheckCircle2, Filter } from 'lucide-react';
import { api } from '../services/api';
import { MaterialListItem } from '../types';

interface Props {
  onSelectMaterial: (id: number) => void;
}

export const DataQualityView: React.FC<Props> = ({ onSelectMaterial }) => {
  const [materials, setMaterials] = useState<MaterialListItem[]>([]);
  const [filterSeverity, setFilterSeverity] = useState<'ALL' | 'POOR' | 'MEDIUM' | 'GOOD'>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMaterials({ limit: 100 })
      .then(res => setMaterials(res.items))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = materials.filter(m => {
    if (filterSeverity === 'POOR') return m.data_quality_score < 70;
    if (filterSeverity === 'MEDIUM') return m.data_quality_score >= 70 && m.data_quality_score < 85;
    if (filterSeverity === 'GOOD') return m.data_quality_score >= 85;
    return true;
  });

  const avgQuality = materials.length > 0
    ? Math.round(materials.reduce((acc, m) => acc + m.data_quality_score, 0) / materials.length)
    : 0;

  return (
    <div className="space-y-4">
      {/* Real Enterprise Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base font-bold text-slate-900 tracking-tight">Material Master Health & Quality Suite</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
              Avg Quality: {avgQuality}%
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            5-dimensional evaluation: Casing, Technical Attributes, Dimension Standard, IS/ASTM Grade, and UOM
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <button
            onClick={() => setFilterSeverity('ALL')}
            className={`px-3 py-1.5 rounded font-medium ${filterSeverity === 'ALL' ? 'bg-slate-800 text-white' : 'bg-white border border-slate-300 text-slate-700'}`}
          >
            All ({materials.length})
          </button>
          <button
            onClick={() => setFilterSeverity('POOR')}
            className={`px-3 py-1.5 rounded font-medium ${filterSeverity === 'POOR' ? 'bg-rose-700 text-white' : 'bg-white border border-slate-300 text-slate-700'}`}
          >
            Requires Remediation (&lt;70%)
          </button>
          <button
            onClick={() => setFilterSeverity('GOOD')}
            className={`px-3 py-1.5 rounded font-medium ${filterSeverity === 'GOOD' ? 'bg-emerald-700 text-white' : 'bg-white border border-slate-300 text-slate-700'}`}
          >
            Clean Records (≥85%)
          </button>
        </div>
      </div>

      {/* Summary Scorecard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
        <div className="p-4 bg-white border border-slate-200 rounded-lg">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Network Average Score</div>
          <div className="text-2xl font-black text-brand-900 mt-1">{avgQuality}%</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Across {materials.length} records</div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-lg">
          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">Complete & Valid (85-100%)</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            {materials.filter(m => m.data_quality_score >= 85).length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Fully specified for automated matching</div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-lg">
          <div className="text-[11px] font-bold uppercase tracking-wider text-blue-800">Acceptable (70-84%)</div>
          <div className="text-2xl font-black text-blue-700 mt-1">
            {materials.filter(m => m.data_quality_score >= 70 && m.data_quality_score < 85).length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Minor abbreviation or casing noise</div>
        </div>

        <div className="p-4 bg-white border border-rose-300 rounded-lg bg-rose-50/20">
          <div className="text-[11px] font-bold uppercase tracking-wider text-rose-800">Critical Issues (&lt;70%)</div>
          <div className="text-2xl font-black text-rose-700 mt-1">
            {materials.filter(m => m.data_quality_score < 70).length}
          </div>
          <div className="text-[11px] text-rose-700 mt-0.5 font-medium">Missing grades, ratings, or units</div>
        </div>
      </div>

      {/* Materials Table with Quality Focus */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs">
          <span className="font-bold text-slate-800 uppercase tracking-wider">
            Record-Level Data Quality Breakdown
          </span>
          <span className="text-slate-500">Click row to open remediation details</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-3.5 py-2.5">CPSE</th>
                <th className="px-3.5 py-2.5">Code</th>
                <th className="px-3.5 py-2.5">Original Description</th>
                <th className="px-3.5 py-2.5">Detected Specs</th>
                <th className="px-3.5 py-2.5">Quality Score</th>
                <th className="px-3.5 py-2.5">Audit Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((m) => (
                <tr
                  key={m.id}
                  onClick={() => onSelectMaterial(m.id)}
                  className="hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <td className="px-3.5 py-2.5 font-mono font-bold text-brand-900">{m.cpse_code}</td>
                  <td className="px-3.5 py-2.5 font-mono font-semibold text-slate-800">{m.material_code}</td>
                  <td className="px-3.5 py-2.5 font-mono text-slate-800 max-w-sm line-clamp-1">{m.original_description}</td>
                  <td className="px-3.5 py-2.5 text-slate-600">
                    {m.grade || m.schedule ? `${m.grade || ''} | ${m.schedule || ''}` : <span className="text-amber-700 font-semibold italic">Missing Grade/Spec</span>}
                  </td>
                  <td className="px-3.5 py-2.5">
                    <span className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                      m.data_quality_score >= 85
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : (m.data_quality_score >= 70
                          ? 'bg-blue-50 text-blue-800 border border-blue-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200')
                    }`}>
                      {m.data_quality_score}%
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5">
                    {m.data_quality_score >= 80 ? (
                      <span className="text-emerald-700 font-medium flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Ready</span>
                      </span>
                    ) : (
                      <span className="text-amber-800 font-medium flex items-center space-x-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Needs Specs</span>
                      </span>
                    )}
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
