import React, { useState, useEffect } from 'react';
import { FileText, GitFork, CheckCircle2, ChevronRight, Layers } from 'lucide-react';
import { api } from '../services/api';
import { CommonMaterial } from '../types';

interface Props {
  onSelectMaterial: (id: number) => void;
}

export const CnmcCatalogView: React.FC<Props> = ({ onSelectMaterial }) => {
  const [cnmcs, setCnmcs] = useState<CommonMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCnmc, setSelectedCnmc] = useState<CommonMaterial | null>(null);

  useEffect(() => {
    api.getCommonMaterials()
      .then((data) => {
        setCnmcs(data);
        if (data.length > 0) setSelectedCnmc(data[0]);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      {/* Real Enterprise Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base font-bold text-slate-900 tracking-tight">
              National Codification Registry (Proposed CNMC)
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              Deterministic Taxonomies
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Unified umbrellas mapping multi-CPSE local item codes with GeM & UNSPSC dual classification
          </p>
        </div>

        <div className="text-xs text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded">
          Total Common Standards: <strong className="text-brand-900 font-bold">{cnmcs.length}</strong>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: CNMC List */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 font-bold text-slate-700 text-xs uppercase tracking-wider">
            Approved CNMC Catalog
          </div>

          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {loading && <div className="p-6 text-center text-slate-400 text-xs">Loading common codes...</div>}
            
            {!loading && cnmcs.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCnmc(c)}
                className={`w-full p-3 text-left transition-colors flex items-start justify-between ${
                  selectedCnmc?.id === c.id ? 'bg-brand-50/80 border-l-4 border-brand-700' : 'hover:bg-slate-50'
                }`}
              >
                <div className="space-y-1">
                  <div className="font-mono font-bold text-xs text-brand-900">{c.cnmc_code}</div>
                  <div className="text-[11px] text-slate-600 line-clamp-1">{c.standardized_description}</div>
                  <div className="flex items-center space-x-2 text-[10px] text-slate-400">
                    <span>{c.category}</span>
                    <span>•</span>
                    <span className="font-semibold text-emerald-700">{c.mapped_count} CPSE Codes</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: CNMC Detail & Linked CPSE Codes */}
        <div className="lg:col-span-2 space-y-4">
          {selectedCnmc ? (
            <>
              {/* CNMC Overview Card */}
              <div className="p-5 bg-white border border-slate-200 rounded-lg shadow-xs space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Proposed Common National Material Code
                    </span>
                    <h2 className="text-xl font-mono font-extrabold text-brand-950 mt-0.5">
                      {selectedCnmc.cnmc_code}
                    </h2>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-xs font-bold">
                    {selectedCnmc.status}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded font-mono text-xs text-slate-800">
                  {selectedCnmc.standardized_description}
                </div>

                {/* Technical Specifications */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Category</span>
                    <span className="font-semibold text-slate-800">{selectedCnmc.category}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Material Family</span>
                    <span className="font-semibold text-slate-800">{selectedCnmc.material_family || 'Standard Steel'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Nominal Size</span>
                    <span className="font-semibold text-slate-800">{selectedCnmc.size_mm ? `${selectedCnmc.size_mm} mm` : 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Schedule / Rating</span>
                    <span className="font-semibold text-slate-800">{selectedCnmc.schedule || 'Standard'}</span>
                  </div>
                </div>

                {/* Illustrative GeM & UNSPSC mock alignment */}
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded text-xs flex justify-between items-center text-blue-900">
                  <div>
                    <strong>Illustrative Alignment:</strong> GeM: <code className="font-mono">{selectedCnmc.illustrative_gem_code}</code> | UNSPSC: <code className="font-mono">{selectedCnmc.illustrative_unspsc_code}</code>
                  </div>
                  <span className="text-[10px] text-blue-700 italic">*Prototype classification</span>
                </div>
              </div>

              {/* Mapped CPSE Codes Table */}
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs">
                  <div className="flex items-center space-x-2 font-bold text-slate-800 uppercase tracking-wider">
                    <GitFork className="w-3.5 h-3.5 text-brand-700" />
                    <span>Mapped CPSE Plant Codes ({selectedCnmc.mapped_materials?.length || 0})</span>
                  </div>
                  <span className="text-slate-400 text-[11px]">Original codes are preserved and searchable</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[11px] uppercase">
                      <tr>
                        <th className="px-3.5 py-2.5">CPSE</th>
                        <th className="px-3.5 py-2.5">Local Material Code</th>
                        <th className="px-3.5 py-2.5">Source Description</th>
                        <th className="px-3.5 py-2.5 text-right">Inspect</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedCnmc.mapped_materials && selectedCnmc.mapped_materials.length > 0 ? (
                        selectedCnmc.mapped_materials.map((m) => (
                          <tr key={m.material_id} className="hover:bg-slate-50">
                            <td className="px-3.5 py-2.5 font-bold font-mono text-brand-900">{m.cpse_code}</td>
                            <td className="px-3.5 py-2.5 font-mono font-semibold text-slate-800">{m.material_code}</td>
                            <td className="px-3.5 py-2.5 text-slate-600 font-mono text-[11px]">{m.original_description}</td>
                            <td className="px-3.5 py-2.5 text-right">
                              <button
                                onClick={() => onSelectMaterial(m.material_id)}
                                className="text-brand-700 hover:text-brand-900 font-semibold"
                              >
                                View Record
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-3.5 py-6 text-center text-slate-400">
                            No CPSE codes mapped to this standard yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-400 bg-white border border-slate-200 rounded-lg">
              Select a Proposed CNMC from the catalog to view details and linked CPSE codes.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
