import React, { useState, useEffect } from 'react';
import { 
  X, Layers, Database, ShieldCheck, AlertCircle, FileText, 
  CheckCircle2, History, GitFork, Cpu, ShieldAlert, ShoppingCart, Clock
} from 'lucide-react';
import { api } from '../services/api';
import { MaterialDetail } from '../types';
import { StatusBadge } from './StatusBadge';

interface Props {
  materialId: number | null;
  onClose: () => void;
}

export const MaterialDetailModal: React.FC<Props> = ({ materialId, onClose }) => {
  const [data, setData] = useState<MaterialDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'pipeline' | 'attributes' | 'ai_analysis' | 'conflicts' | 'quality' | 'cnmc' | 'mappings' | 'procurement' | 'history'
  >('pipeline');

  useEffect(() => {
    if (materialId) {
      setLoading(true);
      api.getMaterialDetail(materialId)
        .then(res => setData(res))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [materialId]);

  if (!materialId) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#141417] rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden text-zinc-800 dark:text-zinc-100 transition-colors">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-zinc-50 dark:bg-[#0c0c0e] border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="px-2.5 py-1 bg-emerald-600 dark:bg-emerald-500 text-white rounded-lg font-mono font-bold text-xs shadow-2xs">
              {data?.cpse_code || 'CPSE'}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50 font-mono">
                  {data?.material_code || 'Loading...'}
                </h2>
                {data && <StatusBadge status={data.status} />}
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{data?.cpse_name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation (All 8 Deep Sections from Section 23) */}
        <div className="px-6 bg-white dark:bg-[#141417] border-b border-zinc-200 dark:border-zinc-800 flex space-x-4 text-xs font-medium overflow-x-auto">
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`py-3 border-b-2 flex items-center space-x-1.5 shrink-0 ${
              activeTab === 'pipeline' ? 'border-brand-700 text-brand-900 font-semibold' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>1. 4-Stage Pipeline</span>
          </button>

          <button
            onClick={() => setActiveTab('attributes')}
            className={`py-3 border-b-2 flex items-center space-x-1.5 shrink-0 ${
              activeTab === 'attributes' ? 'border-brand-700 text-brand-900 font-semibold' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>2. Technical Specs</span>
          </button>

          <button
            onClick={() => setActiveTab('ai_analysis')}
            className={`py-3 border-b-2 flex items-center space-x-1.5 shrink-0 ${
              activeTab === 'ai_analysis' ? 'border-brand-700 text-brand-900 font-semibold' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>3. AI Matches ({data?.matches?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('conflicts')}
            className={`py-3 border-b-2 flex items-center space-x-1.5 shrink-0 ${
              activeTab === 'conflicts' ? 'border-brand-700 text-brand-900 font-semibold' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>4. Technical Conflicts ({data?.conflicts?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('quality')}
            className={`py-3 border-b-2 flex items-center space-x-1.5 shrink-0 ${
              activeTab === 'quality' ? 'border-brand-700 text-brand-900 font-semibold' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>5. Data Quality ({data?.data_quality_score || 0}%)</span>
          </button>

          <button
            onClick={() => setActiveTab('cnmc')}
            className={`py-3 border-b-2 flex items-center space-x-1.5 shrink-0 ${
              activeTab === 'cnmc' ? 'border-brand-700 text-brand-900 font-semibold' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>6. Proposed CNMC</span>
          </button>

          <button
            onClick={() => setActiveTab('mappings')}
            className={`py-3 border-b-2 flex items-center space-x-1.5 shrink-0 ${
              activeTab === 'mappings' ? 'border-brand-700 text-brand-900 font-semibold' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <GitFork className="w-3.5 h-3.5" />
            <span>7. Mappings ({data?.mapped_cpse_codes.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('procurement')}
            className={`py-3 border-b-2 flex items-center space-x-1.5 shrink-0 ${
              activeTab === 'procurement' ? 'border-brand-700 text-brand-900 font-semibold' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>8. Procurement</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 border-b-2 flex items-center space-x-1.5 shrink-0 ${
              activeTab === 'history' ? 'border-brand-700 text-brand-900 font-semibold' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>9. Audit History ({data?.versions.length || 0})</span>
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="p-6 overflow-y-auto flex-1 text-xs">
          {loading && (
            <div className="py-12 text-center text-slate-500">
              Loading material master record...
            </div>
          )}

          {/* 1. PIPELINE (Section 4 & Section 23) */}
          {data && activeTab === 'pipeline' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded text-blue-900 text-xs">
                <strong>Governance Rule (Section 4):</strong> Original CPSE values are permanently preserved. Every normalization, AI standardization, and expert approval transformation is tracked and auditable.
              </div>

              {/* 4-Stage Vertical Timeline */}
              <div className="border border-slate-200 rounded-md divide-y divide-slate-200 bg-white">
                <div className="p-4 bg-slate-50">
                  <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase mb-1">
                    <span>Stage 1: Original CPSE Value</span>
                    <span className="text-slate-400 font-mono">Raw Legacy Data</span>
                  </div>
                  <div className="p-2.5 bg-white border border-slate-200 rounded font-mono text-slate-800">
                    {data.original_description}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    Original Unit: <span className="font-mono font-semibold">{data.original_unit}</span> &bull; CPSE: <span className="font-mono font-semibold">{data.cpse_code}</span>
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-center justify-between text-brand-800 text-[11px] font-bold uppercase mb-1">
                    <span>Stage 2: Normalized Representation</span>
                    <span className="text-emerald-700 font-mono">Abbreviation & Metric Normalized</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded font-mono text-slate-800">
                    {data.normalized_description || 'Pending normalization'}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    Normalized Unit: <span className="font-mono font-semibold">{data.normalized_unit}</span> &bull; Dimension: <span className="font-mono font-semibold">{data.normalized_size_mm ? `${data.normalized_size_mm} mm` : 'N/A'}</span>
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-center justify-between text-purple-900 text-[11px] font-bold uppercase mb-1">
                    <span>Stage 3: AI Standardized Specification</span>
                    <span className="text-purple-700 font-mono">NLP & Engineering Rule Engine</span>
                  </div>
                  <div className="p-2.5 bg-purple-50/50 border border-purple-200 rounded font-mono text-purple-950 font-medium">
                    {data.standardized_description || 'Pending standardization'}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    Extracted Specification: <span className="font-mono font-semibold">{data.specification || 'Standardized Master'}</span>
                  </div>
                </div>

                <div className="p-4 bg-emerald-50/30">
                  <div className="flex items-center justify-between text-emerald-900 text-[11px] font-bold uppercase mb-1">
                    <span>Stage 4: Final Approved Specification</span>
                    <span className="text-emerald-700 font-bold font-mono">Expert Sign-Off Required</span>
                  </div>
                  <div className="p-2.5 bg-white border border-emerald-300 rounded font-mono text-emerald-950 font-bold">
                    {data.final_approved_description || data.standardized_description || 'Awaiting expert sign-off'}
                  </div>
                  <div className="mt-1 text-[11px] text-emerald-800 flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Status: {data.status} &bull; Traceable across all enterprise transactions</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. TECHNICAL SPECIFICATIONS (Section 9 & Section 23) */}
          {data && activeTab === 'attributes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Extracted Physical Attributes & Metadata:</span>
                <span className="text-[11px] text-slate-500 font-mono">{data.attributes.length} attributes identified</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Base Material</span>
                  <span className="font-mono font-semibold text-slate-800 text-xs mt-0.5 block">{data.material_name || 'Unspecified'}</span>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Metallurgical Grade</span>
                  <span className="font-mono font-semibold text-slate-800 text-xs mt-0.5 block">{data.grade || 'Unspecified'}</span>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Nominal Size / Diameter</span>
                  <span className="font-mono font-semibold text-slate-800 text-xs mt-0.5 block">
                    {data.size_raw} {data.normalized_size_mm ? `(${data.normalized_size_mm} mm)` : ''}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Pipe Schedule</span>
                  <span className="font-mono font-semibold text-slate-800 text-xs mt-0.5 block">{data.schedule || 'N/A'}</span>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Pressure Class / Rating</span>
                  <span className="font-mono font-semibold text-slate-800 text-xs mt-0.5 block">{data.pressure_rating || 'N/A'}</span>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Standard / Code</span>
                  <span className="font-mono font-semibold text-slate-800 text-xs mt-0.5 block">{data.standard || 'N/A'}</span>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Manufacturer / Brand</span>
                  <span className="font-mono font-semibold text-slate-800 text-xs mt-0.5 block">{data.manufacturer || 'General'}</span>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Model / Part Number</span>
                  <span className="font-mono font-semibold text-slate-800 text-xs mt-0.5 block">{data.part_number || data.model || 'Standard'}</span>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Technical Specification</span>
                  <span className="font-mono font-semibold text-slate-800 text-xs mt-0.5 block">{data.specification || 'Standardized'}</span>
                </div>
              </div>

              {/* Detailed Extracted Table */}
              <div className="border border-slate-200 rounded-md overflow-hidden mt-4">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold border-b border-slate-200">
                      <th className="p-2.5">Attribute Name</th>
                      <th className="p-2.5">Normalized Value</th>
                      <th className="p-2.5">Raw Source Segment</th>
                      <th className="p-2.5">Confidence</th>
                      <th className="p-2.5">Extraction Method</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {data.attributes.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-slate-800">{a.attribute_name}</td>
                        <td className="p-2.5 text-brand-900">{a.attribute_value}</td>
                        <td className="p-2.5 text-slate-500">{a.raw_value || '–'}</td>
                        <td className="p-2.5 text-emerald-700 font-semibold">{Math.round(a.confidence * 100)}%</td>
                        <td className="p-2.5 text-slate-500">{a.extraction_method}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. AI ANALYSIS & SIMILAR MATERIALS (Section 10, 14, 23) */}
          {data && activeTab === 'ai_analysis' && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700">
                <strong>Explainable AI Analysis:</strong> Bilateral matches calculated by hybrid engine (TF-IDF N-grams, RapidFuzz token sorting, and ASME B36.10M engineering tolerances).
              </div>

              {(!data.matches || data.matches.length === 0) ? (
                <div className="p-6 text-center text-slate-400 bg-slate-50 border border-slate-200 rounded">
                  No active bilateral candidate matches found for this material code.
                </div>
              ) : (
                <div className="space-y-3">
                  {data.matches.map((m) => (
                    <div key={m.id} className="p-3 bg-white border border-slate-200 rounded space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <StatusBadge status={m.relationship_type} />
                          <span className="font-mono font-bold text-brand-900 text-xs">
                            {m.other_cpse_code} &bull; {m.other_material_code}
                          </span>
                        </div>
                        <div className="font-mono text-xs font-bold text-slate-700">
                          AI Score: {m.ai_score.toFixed(1)}% {m.adjusted_score ? `(Adj: ${m.adjusted_score.toFixed(1)}%)` : ''}
                        </div>
                      </div>

                      <div className="font-mono text-xs text-slate-800 bg-slate-50 p-2 rounded border border-slate-100">
                        {m.other_description}
                      </div>

                      {m.explanation && m.explanation.summary && (
                        <div className="text-[11px] text-slate-600">
                          <strong>Rationale:</strong> {m.explanation.summary}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 4. TECHNICAL CONFLICTS (Section 15 & Section 23) */}
          {data && activeTab === 'conflicts' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-900 text-xs">
                <strong>Critical Rule (Section 15):</strong> A technical conflict (e.g. Schedule, Pressure, Metallurgical Grade) overrides high text similarity and mandates "Technical Review Required".
              </div>

              {(!data.conflicts || data.conflicts.length === 0) ? (
                <div className="p-6 text-center text-emerald-700 bg-emerald-50/40 border border-emerald-200 rounded flex items-center justify-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>No physical safety conflicts detected for this material specification.</span>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {data.conflicts.map((c) => (
                    <div key={c.id} className="p-3 bg-white border border-rose-200 rounded space-y-1.5 shadow-2xs">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-rose-900 uppercase font-mono">
                          Conflict: {c.conflict_field}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold">
                          {c.severity} SEVERITY
                        </span>
                      </div>
                      <div className="text-xs text-slate-700">
                        <strong>Rule Applied:</strong> {c.rule_name}
                      </div>
                      <div className="text-xs text-slate-600">
                        {c.description}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 pt-1">
                        Values: <span className="text-rose-800 font-bold">{c.value_a}</span> vs <span className="text-rose-800 font-bold">{c.value_b}</span> &bull; Review: {c.review_status}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 5. DATA QUALITY (Section 7 & Section 23) */}
          {data && activeTab === 'quality' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-md flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Overall Data Quality Score</h3>
                  <p className="text-slate-500 text-[11px]">Computed across completeness, validity, and standard formatting</p>
                </div>
                <div className="text-2xl font-black text-brand-900 font-mono">
                  {data.data_quality_score}%
                </div>
              </div>

              {data.quality_breakdown && (
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-800 text-xs">Attribute Validation Checks</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(data.quality_breakdown.checks || {}).map(([key, val]: any) => (
                      <div key={key} className="p-2.5 bg-white border border-slate-200 rounded flex items-center justify-between">
                        <span className="text-slate-600 capitalize">{key.replace('_', ' ')}</span>
                        <span className={`font-mono font-bold text-[11px] ${val.status === 'COMPLETE' ? 'text-emerald-700' : 'text-amber-600'}`}>
                          {val.status} ({val.score}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 6. PROPOSED CNMC (Section 19 & Section 20) */}
          {data && activeTab === 'cnmc' && (
            <div className="space-y-4">
              {data.cnmc_code ? (
                <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-md space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-emerald-800 tracking-wider">
                      Proposed Common National Material Code
                    </span>
                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      Standardized
                    </span>
                  </div>
                  <div className="text-lg font-mono font-black text-emerald-950">
                    {data.cnmc_code}
                  </div>
                  <p className="text-slate-600 text-xs">
                    Deterministically structured: Category &bull; Material &bull; Size &bull; Specification &bull; Sequence
                  </p>
                </div>
              ) : (
                <div className="p-6 text-center text-slate-500 bg-slate-50 border border-slate-200 rounded">
                  No Proposed CNMC assigned yet. Material is pending technical standardization.
                </div>
              )}

              <div className="p-3 bg-slate-50 border border-slate-200 rounded text-slate-700 text-xs space-y-1">
                <span className="font-bold text-slate-900 block">Illustrative Classification (Section 20):</span>
                <p className="text-slate-600">
                  Category: <strong>{data.category}</strong> {data.subcategory ? `&bull; Subcategory: ${data.subcategory}` : ''}
                </p>
                <span className="text-[10px] text-slate-400 block font-mono">
                  Clearly labeled: Illustrative alignment with GeM / UNSPSC standards.
                </span>
              </div>
            </div>
          )}

          {/* 7. MAPPINGS (Section 21) */}
          {data && activeTab === 'mappings' && (
            <div className="space-y-4">
              <p className="text-slate-600 text-xs">
                Other CPSE enterprise codes linked to the same proposed common specification:
              </p>

              {data.mapped_cpse_codes.length === 0 ? (
                <div className="p-6 text-center text-slate-400 bg-slate-50 border border-slate-200 rounded">
                  No cross-CPSE mappings established yet.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-md overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold border-b border-slate-200">
                        <th className="p-2.5">CPSE Entity</th>
                        <th className="p-2.5">Local Material Code</th>
                        <th className="p-2.5">Legacy Description</th>
                        <th className="p-2.5">Mapping Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {data.mapped_cpse_codes.map((m) => (
                        <tr key={m.material_id} className="hover:bg-slate-50">
                          <td className="p-2.5 font-bold text-brand-900">{m.cpse_code}</td>
                          <td className="p-2.5 text-slate-900">{m.material_code}</td>
                          <td className="p-2.5 font-sans text-slate-600">{m.description}</td>
                          <td className="p-2.5 text-slate-400">
                            {m.effective_date ? new Date(m.effective_date).toLocaleDateString() : '–'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 8. PROCUREMENT (Section 25 & Section 26) */}
          {data && activeTab === 'procurement' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Annual Quantity</span>
                  <span className="font-mono font-black text-slate-900 text-sm mt-0.5 block">
                    {data.annual_quantity.toLocaleString()} {data.normalized_unit}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Annual Spend</span>
                  <span className="font-mono font-black text-brand-900 text-sm mt-0.5 block">
                    ₹{(data.annual_spend / 100000).toFixed(2)} Lakhs
                  </span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Primary Supplier</span>
                  <span className="font-mono font-semibold text-slate-800 text-xs mt-0.5 block truncate">
                    {data.manufacturer || 'Approved CPSE Vendor'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Spend Currency</span>
                  <span className="font-mono font-semibold text-slate-800 text-xs mt-0.5 block">
                    {data.currency || 'INR'}
                  </span>
                </div>
              </div>

              {/* Purchase Order History */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-xs">Synthetic Purchase Order Transactions</h4>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {data.procurement_records?.length || 0} purchase orders logged
                  </span>
                </div>

                {(!data.procurement_records || data.procurement_records.length === 0) ? (
                  <div className="p-4 text-center text-slate-400 bg-slate-50 border border-slate-200 rounded text-xs">
                    No historical purchase order records found.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-md overflow-hidden">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold border-b border-slate-200">
                          <th className="p-2.5">PO Number</th>
                          <th className="p-2.5">Fiscal Year</th>
                          <th className="p-2.5">Supplier / Vendor</th>
                          <th className="p-2.5 text-right">Unit Price</th>
                          <th className="p-2.5 text-right">Quantity</th>
                          <th className="p-2.5 text-right">Total Spend</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                        {data.procurement_records.map((po) => (
                          <tr key={po.id} className="hover:bg-slate-50">
                            <td className="p-2.5 font-bold text-brand-900">{po.po_number}</td>
                            <td className="p-2.5 text-slate-600">{po.fiscal_year}</td>
                            <td className="p-2.5 text-slate-800 font-sans">{po.supplier_name}</td>
                            <td className="p-2.5 text-right">₹{po.unit_price.toFixed(2)}</td>
                            <td className="p-2.5 text-right">{po.quantity}</td>
                            <td className="p-2.5 text-right font-bold text-slate-900">₹{po.total_spend.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 9. AUDIT & VERSION HISTORY (Section 29 & Section 30) */}
          {data && activeTab === 'history' && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600">
                <strong>Immutable Audit Trail:</strong> Every change, approval, normalization, and attribute extraction creates an auditable version row cryptographically sealed into the SHA-256 hash chain.
              </div>

              {data.versions.length === 0 ? (
                <div className="p-6 text-center text-slate-400 bg-slate-50 border border-slate-200 rounded">
                  No historical version modifications recorded.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-md overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold border-b border-slate-200">
                        <th className="p-2.5">Rev #</th>
                        <th className="p-2.5">Field Changed</th>
                        <th className="p-2.5">Previous Value</th>
                        <th className="p-2.5">New Value</th>
                        <th className="p-2.5">Reason / Rationale</th>
                        <th className="p-2.5">Changed By</th>
                        <th className="p-2.5">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {data.versions.map((v) => (
                        <tr key={v.id} className="hover:bg-slate-50">
                          <td className="p-2.5 font-bold text-brand-900">v{v.version_num}</td>
                          <td className="p-2.5 text-slate-700 font-bold">{v.field_changed}</td>
                          <td className="p-2.5 text-slate-400 truncate max-w-xs">{v.previous_value || '–'}</td>
                          <td className="p-2.5 text-emerald-800 font-semibold truncate max-w-xs">{v.new_value}</td>
                          <td className="p-2.5 font-sans text-slate-600">{v.reason || 'Automated extraction'}</td>
                          <td className="p-2.5 text-slate-500 font-sans">{v.changed_by}</td>
                          <td className="p-2.5 text-slate-400">{new Date(v.changed_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
