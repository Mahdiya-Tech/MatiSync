import React, { useState, useEffect } from 'react';
import { Layers, CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck, Filter, Search, Edit3 } from 'lucide-react';
import { api } from '../services/api';

interface LegacyItem {
  id: number;
  material_id: number;
  material_code: string;
  cpse_code: string;
  description: string;
  proposed_status: string;
  rationalization_action: string;
  action_notes?: string;
  reviewed_by?: string;
}

export const RationalizationView: React.FC = () => {
  const [items, setItems] = useState<LegacyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [filterCpse, setFilterCpse] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  
  // Editing state
  const [editingItem, setEditingItem] = useState<LegacyItem | null>(null);
  const [selectedAction, setSelectedAction] = useState<string>('Rationalize');
  const [actionNotes, setActionNotes] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getLegacyCodes();
      setItems(data);
    } catch (err) {
      console.error('Failed to load legacy codes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenActionModal = (item: LegacyItem) => {
    setEditingItem(item);
    setSelectedAction(item.rationalization_action || 'Rationalize');
    setActionNotes(item.action_notes || '');
  };

  const handleSaveAction = async () => {
    if (!editingItem) return;
    setSaving(true);
    try {
      await api.updateLegacyAction(editingItem.id, selectedAction, actionNotes);
      setToastMsg(`Successfully updated rationalization action for ${editingItem.material_code} to ${selectedAction}`);
      setEditingItem(null);
      await loadData();
      setTimeout(() => setToastMsg(null), 4000);
    } catch (err) {
      alert('Failed to update action');
    } finally {
      setSaving(false);
    }
  };

  const filteredItems = items.filter(item => {
    if (filterAction !== 'ALL' && item.rationalization_action !== filterAction) return false;
    if (filterCpse !== 'ALL' && item.cpse_code !== filterCpse) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        item.material_code.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.cpse_code.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const countTotal = items.length;
  const countRationalize = items.filter(i => i.rationalization_action === 'Rationalize').length;
  const countMap = items.filter(i => i.rationalization_action === 'Map').length;
  const countRetain = items.filter(i => i.rationalization_action === 'Retain').length;
  const countDeprecate = items.filter(i => i.rationalization_action === 'Deprecate').length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded shadow-md flex items-center justify-between text-xs animate-fadeIn">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold">{toastMsg}</span>
          </div>
          <button onClick={() => setToastMsg(null)} className="text-emerald-700 hover:text-emerald-900 font-bold">&times;</button>
        </div>
      )}

      {/* Page Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base font-bold text-slate-900 tracking-tight">Legacy Code Rationalization & Migration Registry</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
              {countTotal} Evaluated Records
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Systematic framework for evaluating redundant and duplicate CPSE inventory codes into unified national procurement streams
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs">
          <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded font-mono font-semibold">
            MoPNG Mandate 2026/CPSE-STD-01
          </span>
        </div>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total Evaluated</div>
          <div className="text-2xl font-black text-slate-900 mt-0.5">{countTotal}</div>
          <div className="text-[10px] text-slate-400 mt-1">Catalogued records</div>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-purple-200 shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-purple-700">Rationalize (Merge)</div>
          <div className="text-2xl font-black text-purple-900 mt-0.5">{countRationalize}</div>
          <div className="text-[10px] text-purple-600 mt-1">Cross-plant consolidation</div>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-emerald-200 shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">Mapped to CNMC</div>
          <div className="text-2xl font-black text-emerald-900 mt-0.5">{countMap}</div>
          <div className="text-[10px] text-emerald-600 mt-1">Dual-keyed to national code</div>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-blue-200 shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-blue-700">Retain Separately</div>
          <div className="text-2xl font-black text-blue-900 mt-0.5">{countRetain}</div>
          <div className="text-[10px] text-blue-600 mt-1">Unit-specific variance</div>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-rose-200 shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-rose-700">Deprecated</div>
          <div className="text-2xl font-black text-rose-900 mt-0.5">{countDeprecate}</div>
          <div className="text-[10px] text-rose-600 mt-1">Obsolete inventory codes</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex-1 w-full md:w-auto relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Filter by material code, description, or enterprise..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded border border-slate-200 focus:outline-none focus:border-brand-500"
          />
        </div>
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={filterCpse}
            onChange={(e) => setFilterCpse(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-brand-500 font-medium"
          >
            <option value="ALL">All CPSEs</option>
            <option value="CPCL">CPCL (Refinery)</option>
            <option value="NTPC">NTPC (Power)</option>
            <option value="ONGC">ONGC (Upstream)</option>
            <option value="IOCL">IOCL (Marketing)</option>
            <option value="SAIL">SAIL (Steel)</option>
          </select>

          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-brand-500 font-medium"
          >
            <option value="ALL">All Rationalization Actions</option>
            <option value="Rationalize">Rationalize (Merge)</option>
            <option value="Map">Map to CNMC</option>
            <option value="Retain">Retain Separately</option>
            <option value="Deprecate">Deprecate</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading rationalization records...</div>
        ) : filteredItems.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">No matching legacy code records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">CPSE & Code</th>
                  <th className="py-3 px-4">Legacy Master Description</th>
                  <th className="py-3 px-4">Proposed Status</th>
                  <th className="py-3 px-4">Assigned Action</th>
                  <th className="py-3 px-4">Expert Justification Notes</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-brand-900">{item.material_code}</div>
                      <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-semibold">
                        {item.cpse_code}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-sm">
                      <div className="text-slate-800 font-medium line-clamp-2">{item.description}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {item.proposed_status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded text-[11px] font-bold border ${
                          item.rationalization_action === 'Rationalize'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : item.rationalization_action === 'Map'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : item.rationalization_action === 'Retain'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {item.rationalization_action}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-xs text-slate-600">
                      <div className="text-[11px] line-clamp-2 italic">
                        {item.action_notes || '—'}
                      </div>
                      {item.reviewed_by && (
                        <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                          Reviewer: {item.reviewed_by}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenActionModal(item)}
                        className="px-2.5 py-1.5 rounded bg-white hover:bg-slate-100 text-brand-700 hover:text-brand-900 border border-slate-200 shadow-sm font-semibold flex items-center space-x-1 ml-auto"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Modify</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modify Action Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-lg shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Update Rationalization Action</h3>
                <p className="text-xs text-slate-500 font-mono">
                  {editingItem.cpse_code} — {editingItem.material_code}
                </p>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-slate-600 text-base font-bold"
              >
                &times;
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Item Description</span>
                <p className="text-slate-800 font-medium">{editingItem.description}</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Select Harmonization Action
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { action: 'Rationalize', label: 'Rationalize (Merge)', desc: 'Combine with national duplicate standard' },
                    { action: 'Map', label: 'Map to Proposed CNMC', desc: 'Maintain link to national code, keep local code' },
                    { action: 'Retain', label: 'Retain Separately', desc: 'Preserve independent CPSE specification' },
                    { action: 'Deprecate', label: 'Deprecate Code', desc: 'Retire obsolete inventory code from catalog' }
                  ].map(opt => (
                    <button
                      key={opt.action}
                      type="button"
                      onClick={() => setSelectedAction(opt.action)}
                      className={`p-2.5 text-left rounded border transition-all ${
                        selectedAction === opt.action
                          ? 'border-brand-600 bg-brand-50/70 shadow-xs'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="font-bold text-slate-900 text-[11px]">{opt.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Technical Justification & Operational Notes
                </label>
                <textarea
                  rows={3}
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="Explain why this material is being rationalized, retained, or mapped..."
                  className="w-full p-2.5 text-xs rounded border border-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-3 py-1.5 rounded border border-slate-200 bg-white text-slate-700 text-xs font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAction}
                disabled={saving}
                className="px-4 py-1.5 rounded bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
              >
                {saving ? 'Updating...' : 'Confirm Action'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
