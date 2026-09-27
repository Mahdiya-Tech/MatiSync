import React, { useState } from 'react';
import { X, Search, AlertTriangle, CheckCircle, ArrowRight, ShieldAlert, Layers } from 'lucide-react';
import { api } from '../services/api';
import { SearchBeforeCreateResponse } from '../types';
import { StatusBadge } from './StatusBadge';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectExisting?: (materialId: number, cnmcCode?: string) => void;
  onContinueCreation?: (description: string) => void;
}

export const SearchBeforeCreateModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSelectExisting,
  onContinueCreation
}) => {
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Pipes');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchBeforeCreateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!description.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const data = await api.searchBeforeCreate(description, category);
      setResults(data);
    } catch (err: any) {
      setError(err.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const loadPreparedDemoQuery = () => {
    setDescription('STAINLESS STEEL PIPE 50MM SCH40');
    setCategory('Pipes');
    setTimeout(() => {
      api.searchBeforeCreate('STAINLESS STEEL PIPE 50MM SCH40', 'Pipes').then(data => setResults(data));
    }, 50);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#141417] rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] text-zinc-800 dark:text-zinc-100 transition-colors">
        {/* Header */}
        <div className="px-6 py-4 bg-zinc-50 dark:bg-[#0c0c0e] border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
              <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Search-Before-Create Gateway</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Check active repository before generating a new material master to prevent duplicate codes
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input Bar */}
        <div className="p-6 border-b border-slate-100 bg-white">
          <form onSubmit={handleSearch} className="space-y-3">
            <div className="flex gap-2">
              <div className="w-1/3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded px-2.5 py-2 bg-white focus:outline-brand-600"
                >
                  <option value="Pipes">Pipes & Piping</option>
                  <option value="Valves">Valves</option>
                  <option value="Bearings">Bearings</option>
                  <option value="Cables">Cables & Electrical</option>
                  <option value="Pumps">Pumps & Spares</option>
                  <option value="Fasteners">Fasteners & Studs</option>
                </select>
              </div>
              <div className="w-2/3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Proposed Material Description
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. STAINLESS STEEL PIPE 50MM SCH40"
                    className="w-full text-xs border border-slate-300 rounded pl-3 pr-24 py-2 focus:outline-brand-600 font-mono"
                  />
                  <button
                    type="submit"
                    disabled={loading || !description.trim()}
                    className="absolute right-1 top-1 bottom-1 px-3 bg-brand-700 text-white rounded text-xs font-medium hover:bg-brand-800 disabled:opacity-50 flex items-center space-x-1"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>{loading ? 'Checking...' : 'Check Duplicates'}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span>Enter raw engineering specs or click prepared demo sample:</span>
              <button
                type="button"
                onClick={loadPreparedDemoQuery}
                className="text-brand-700 hover:underline font-medium"
              >
                Load Prepared Demo Case (SS PIPE 50MM SCH40)
              </button>
            </div>
          </form>
        </div>

        {/* Results Container */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded border border-rose-200">
              {error}
            </div>
          )}

          {results && (
            <div>
              {/* Recommendation Banner */}
              {results.recommended_action === 'USE_EXISTING' && (
                <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-md mb-4 flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-xs font-bold text-purple-900">
                      High-Confidence Duplicate Detected ({results.top_matches[0]?.similarity_score}% match)
                    </h3>
                    <p className="text-xs text-purple-700 mt-0.5">
                      An approved standardized material matching these exact technical specifications already exists in the national catalog. Generating a new code is strongly discouraged.
                    </p>
                  </div>
                </div>
              )}

              {results.recommended_action === 'REVIEW_REQUIRED' && (
                <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-md mb-4 flex items-start space-x-3">
                  <ShieldAlert className="w-5 h-5 text-amber-800 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-xs font-bold text-amber-900">
                      Technical Review Required Before Creation
                    </h3>
                    <p className="text-xs text-amber-800 mt-0.5">
                      Possible physical differences or schedule/grade variations detected. Submit for metallurgy expert review before creating a new master record.
                    </p>
                  </div>
                </div>
              )}

              {results.recommended_action === 'PROCEED_WITH_CREATION' && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-md mb-4 flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-xs font-bold text-emerald-900">No Existing Standard Duplicate Found</h3>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      No high-similarity duplicate materials were found in the national master database. Safe to proceed with new material master entry.
                    </p>
                  </div>
                </div>
              )}

              {/* Match Cards List */}
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Candidate Materials Found ({results.matches_found})
              </h4>
              
              <div className="space-y-2.5">
                {results.top_matches.map((m, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 border border-slate-200 rounded-md bg-white hover:border-brand-400 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-brand-900 font-mono">
                            [{m.cpse_code}] {m.material_code}
                          </span>
                          <StatusBadge status={m.relationship_type} />
                          {m.cnmc_code && (
                            <span className="px-1.5 py-0.5 text-[10px] font-mono bg-emerald-100 text-emerald-800 rounded font-semibold">
                              {m.cnmc_code}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-800 font-mono">{m.description}</p>
                        
                        {/* Matching attributes */}
                        <div className="flex flex-wrap gap-1 text-[11px] pt-1">
                          {m.matching_specs.map((spec, sidx) => (
                            <span key={sidx} className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                              ✓ {spec}
                            </span>
                          ))}
                          {m.differing_specs.map((diff, didx) => (
                            <span key={didx} className="bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded border border-amber-200">
                              ⚠ {diff}
                            </span>
                          ))}
                        </div>

                        {m.has_conflict && m.conflict_summary && (
                          <p className="text-[11px] text-amber-800 font-medium bg-amber-50/70 p-1.5 rounded border border-amber-200/80 mt-1">
                            {m.conflict_summary}
                          </p>
                        )}
                      </div>

                      {/* Score & Select */}
                      <div className="text-right shrink-0">
                        <div className="text-base font-extrabold text-brand-900">
                          {m.similarity_score}%
                        </div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider">Similarity</div>
                        {onSelectExisting && (
                          <button
                            onClick={() => onSelectExisting(m.material_id, m.cnmc_code)}
                            className="mt-2 text-xs font-medium text-brand-700 hover:text-brand-900 hover:underline flex items-center justify-end space-x-1"
                          >
                            <span>Use Existing</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!results && !loading && (
            <div className="text-center py-10 text-slate-400">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-xs">Type a material description above and click "Check Duplicates"</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          
          <div className="flex items-center space-x-2">
            {onContinueCreation && (
              <button
                onClick={() => {
                  onContinueCreation(description);
                  onClose();
                }}
                className="px-3.5 py-1.5 bg-slate-200 text-slate-800 rounded font-medium hover:bg-slate-300"
              >
                Continue Creation Anyway
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
