import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Upload, Plus, Layers, Eye } from 'lucide-react';
import { api } from '../services/api';
import { MaterialListItem, CPSEOrg } from '../types';
import { StatusBadge } from '../components/StatusBadge';

interface Props {
  onSelectMaterial: (id: number) => void;
  onNavigateToUpload: () => void;
  onOpenSearchBeforeCreate: () => void;
}

export const MaterialsView: React.FC<Props> = ({
  onSelectMaterial,
  onNavigateToUpload,
  onOpenSearchBeforeCreate
}) => {
  const [materials, setMaterials] = useState<MaterialListItem[]>([]);
  const [cpses, setCpses] = useState<CPSEOrg[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // Filters
  const [selectedCpse, setSelectedCpse] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [minQuality, setMinQuality] = useState<number>(0);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const res = await api.getMaterials({
        cpse_code: selectedCpse || undefined,
        category: selectedCategory || undefined,
        status: selectedStatus || undefined,
        search: searchQuery || undefined,
        min_quality: minQuality > 0 ? minQuality : undefined,
        limit: 100
      });
      setMaterials(res.items);
      setTotal(res.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.getCPSES().then(setCpses).catch(console.error);
  }, []);

  useEffect(() => {
    fetchMaterials();
  }, [selectedCpse, selectedCategory, selectedStatus, minQuality]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMaterials();
  };

  return (
    <div className="space-y-4">
      {/* Real Enterprise Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base font-bold text-slate-900 tracking-tight">Central Material Master Directory</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
              {total} Live Items
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Federated catalog spanning CPCL, NTPC, ONGC, IOCL, SAIL, BPCL, BHEL, and CIL
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <a
            href={api.exportMaterialsUrl}
            download
            className="px-3 py-1.5 border border-slate-300 rounded bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center space-x-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </a>
          <button
            onClick={onNavigateToUpload}
            className="px-3 py-1.5 border border-slate-300 rounded bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold flex items-center space-x-1.5"
          >
            <Upload className="w-3.5 h-3.5 text-brand-700" />
            <span>Upload Catalog</span>
          </button>
          <button
            onClick={onOpenSearchBeforeCreate}
            className="px-3.5 py-1.5 bg-brand-900 hover:bg-brand-950 text-white rounded text-xs font-semibold flex items-center space-x-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Search Before Create</span>
          </button>
        </div>
      </div>

      {/* Filter Ribbon */}
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by code, description, steel grade, or standard..."
              className="w-full text-xs border border-slate-300 rounded pl-8 pr-3 py-1.5 focus:outline-brand-600 font-mono"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
          <button
            type="submit"
            className="px-4 py-1.5 bg-slate-800 text-white rounded text-xs font-medium hover:bg-slate-900"
          >
            Search
          </button>
        </form>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">CPSE Organization</label>
            <select
              value={selectedCpse}
              onChange={(e) => setSelectedCpse(e.target.value)}
              className="w-full border border-slate-300 rounded px-2 py-1.5 bg-white text-xs"
            >
              <option value="">All CPSEs</option>
              {cpses.map((c) => (
                <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full border border-slate-300 rounded px-2 py-1.5 bg-white text-xs"
            >
              <option value="">All Categories</option>
              <option value="Pipes">Pipes & Piping</option>
              <option value="Valves">Valves</option>
              <option value="Bearings">Bearings</option>
              <option value="Cables">Cables & Electrical</option>
              <option value="Fasteners">Fasteners</option>
              <option value="Pumps">Pumps</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Harmonization Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full border border-slate-300 rounded px-2 py-1.5 bg-white text-xs"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Mapped">Mapped to Proposed CNMC</option>
              <option value="Exact Duplicate">Exact Duplicate</option>
              <option value="Near Duplicate">Near Duplicate</option>
              <option value="Technical Conflict">Technical Conflict</option>
              <option value="Data Quality Issue">Data Quality Issue</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
              Min Quality Score: {minQuality > 0 ? `${minQuality}%` : 'Any'}
            </label>
            <input
              type="range"
              min="0"
              max="90"
              step="10"
              value={minQuality}
              onChange={(e) => setMinQuality(Number(e.target.value))}
              className="w-full accent-brand-700 mt-2"
            />
          </div>
        </div>
      </div>

      {/* Materials Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[11px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-3.5 py-2.5">CPSE</th>
                <th className="px-3.5 py-2.5">Material Code</th>
                <th className="px-3.5 py-2.5">Description</th>
                <th className="px-3.5 py-2.5">Category</th>
                <th className="px-3.5 py-2.5">Specs & Grade</th>
                <th className="px-3.5 py-2.5">Data Quality</th>
                <th className="px-3.5 py-2.5">Status</th>
                <th className="px-3.5 py-2.5">Proposed CNMC</th>
                <th className="px-3.5 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td colSpan={9} className="px-3.5 py-8 text-center text-slate-400">
                    Loading materials...
                  </td>
                </tr>
              )}

              {!loading && materials.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-3.5 py-8 text-center text-slate-500">
                    No materials found matching current filters.
                  </td>
                </tr>
              )}

              {!loading && materials.map((m) => (
                <tr
                  key={m.id}
                  onClick={() => onSelectMaterial(m.id)}
                  className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                >
                  <td className="px-3.5 py-2.5 font-bold text-brand-900 font-mono">
                    {m.cpse_code}
                  </td>
                  <td className="px-3.5 py-2.5 font-mono font-semibold text-slate-900">
                    {m.material_code}
                  </td>
                  <td className="px-3.5 py-2.5 max-w-xs font-mono text-slate-800 line-clamp-1">
                    {m.original_description}
                  </td>
                  <td className="px-3.5 py-2.5 text-slate-600">
                    {m.category}
                  </td>
                  <td className="px-3.5 py-2.5 text-slate-700">
                    {m.grade || m.schedule ? `${m.grade || ''} ${m.schedule || ''}`.trim() : '—'}
                  </td>
                  <td className="px-3.5 py-2.5">
                    <span className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                      m.data_quality_score >= 85
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : (m.data_quality_score >= 70
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200')
                    }`}>
                      {m.data_quality_score}%
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5">
                    <StatusBadge status={m.status} />
                  </td>
                  <td className="px-3.5 py-2.5 font-mono text-[11px] font-semibold text-brand-900">
                    {m.cnmc_code ? (
                      <span className="bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-200">
                        {m.cnmc_code}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Unassigned</span>
                    )}
                  </td>
                  <td className="px-3.5 py-2.5 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectMaterial(m.id);
                      }}
                      className="text-brand-700 hover:text-brand-950 p-1 hover:bg-slate-100 rounded"
                      title="View Details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
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
