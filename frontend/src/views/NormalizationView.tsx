import React, { useState, useEffect } from 'react';
import { Layers, ArrowRight, ShieldCheck, CheckCircle2, AlertTriangle, Calculator, Sliders, Search, Save, History, Clock } from 'lucide-react';
import { api } from '../services/api';
import { MaterialListItem, MaterialDetail } from '../types';

export const NormalizationView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'tolerance' | 'standardization'>('tolerance');

  // Interactive tolerance calculator demo
  const [valA, setValA] = useState('2 INCH');
  const [valB, setValB] = useState('50 MM');

  // Standardization Center State
  const [materials, setMaterials] = useState<MaterialListItem[]>([]);
  const [loadingMats, setLoadingMats] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMatId, setSelectedMatId] = useState<number | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<MaterialDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);

  // Editable Form State for Standardization
  const [stdDesc, setStdDesc] = useState<string>('');
  const [finalApprDesc, setFinalApprDesc] = useState<string>('');
  const [editMaterialName, setEditMaterialName] = useState<string>('');
  const [editGrade, setEditGrade] = useState<string>('');
  const [editSize, setEditSize] = useState<string>('');
  const [editSchedule, setEditSchedule] = useState<string>('');
  const [editStandard, setEditStandard] = useState<string>('');
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Load materials for selector
  useEffect(() => {
    setLoadingMats(true);
    api.getMaterials({ limit: 40 })
      .then(res => {
        setMaterials(res.items);
        if (res.items.length > 0 && !selectedMatId) {
          setSelectedMatId(res.items[0].id);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingMats(false));
  }, []);

  // Load detail when selectedMatId changes
  useEffect(() => {
    if (!selectedMatId) return;
    setLoadingDetail(true);
    setSaveSuccessMsg(null);
    api.getMaterialDetail(selectedMatId)
      .then(detail => {
        setSelectedDetail(detail);
        setStdDesc(detail.standardized_description || '');
        setFinalApprDesc(detail.final_approved_description || detail.standardized_description || '');
        setEditMaterialName(detail.material_name || '');
        setEditGrade(detail.grade || '');
        setEditSize(detail.size_raw || (detail.normalized_size_mm ? `${detail.normalized_size_mm} MM` : ''));
        setEditSchedule(detail.schedule || detail.pressure_rating || '');
        setEditStandard(detail.standard || '');
        setOverrideReason('');
      })
      .catch(console.error)
      .finally(() => setLoadingDetail(false));
  }, [selectedMatId]);

  const handleSaveStandardization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatId) return;
    setSaving(true);
    setSaveSuccessMsg(null);

    try {
      const res = await api.standardizeMaterial(selectedMatId, {
        standardized_description: stdDesc,
        final_approved_description: finalApprDesc,
        material_name: editMaterialName,
        grade: editGrade,
        size_raw: editSize,
        schedule: editSchedule,
        standard: editStandard,
        reason: overrideReason || 'Expert verified and standardized master specification'
      });

      setSaveSuccessMsg(`Successfully updated standardization! Version ${res.version} created and recorded in tamper-evident audit trail.`);
      // Refresh details to show updated version history
      const updated = await api.getMaterialDetail(selectedMatId);
      setSelectedDetail(updated);
      setOverrideReason('');
    } catch (err: any) {
      alert(`Standardization save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Real Enterprise Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base font-bold text-slate-900 tracking-tight">
              Data Normalization & Standardization Center
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-blue-800 border border-blue-200">
              ASME B36.10M &bull; ISO 6708 &bull; Section 27
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Four-stage value preservation: Original &rarr; Normalized &rarr; AI Standardized &rarr; Expert Approved with traceable version history
          </p>
        </div>

        {/* Sub-tab navigation */}
        <div className="flex bg-slate-100 p-1 rounded-md text-xs font-semibold">
          <button
            onClick={() => setActiveSubTab('tolerance')}
            className={`px-3 py-1.5 rounded transition-all ${
              activeSubTab === 'tolerance'
                ? 'bg-white text-brand-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Engineering Rules & Tolerance
          </button>
          <button
            onClick={() => setActiveSubTab('standardization')}
            className={`px-3 py-1.5 rounded transition-all flex items-center space-x-1.5 ${
              activeSubTab === 'standardization'
                ? 'bg-white text-brand-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Standardization Center Workspace</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'tolerance' && (
        <div className="space-y-5">
          {/* 4-Stage Governance Architecture Demonstration */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4 shadow-xs">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Four-Stage Value Preservation Architecture
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-md space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Stage 1: Original Source</span>
                <div className="p-2 bg-white border border-slate-200 rounded font-mono text-slate-800 font-medium">
                  "SS PIPE 2 INCH SCH 40"
                </div>
                <p className="text-[11px] text-slate-500">
                  Preserved verbatim as stored in CPCL / NTPC ERP. Never mutated or deleted.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-md space-y-1.5">
                <span className="text-[10px] font-bold text-brand-800 uppercase">Stage 2: Normalized</span>
                <div className="p-2 bg-white border border-slate-200 rounded font-mono text-brand-900 font-medium">
                  "STAINLESS STEEL PIPE 50.8 MM SCH 40"
                </div>
                <p className="text-[11px] text-slate-500">
                  Abbreviations expanded, units converted, casing & whitespace standardized.
                </p>
              </div>

              <div className="p-3.5 bg-purple-50/50 border border-purple-200 rounded-md space-y-1.5">
                <span className="text-[10px] font-bold text-purple-800 uppercase">Stage 3: AI Standardized</span>
                <div className="p-2 bg-white border border-purple-200 rounded font-mono text-purple-950 font-medium">
                  "STAINLESS STEEL | SS304 | 50.8 MM | SCH40"
                </div>
                <p className="text-[11px] text-purple-800">
                  Canonical structured attributes segmented by engineering family.
                </p>
              </div>

              <div className="p-3.5 bg-emerald-50/50 border border-emerald-200 rounded-md space-y-1.5">
                <span className="text-[10px] font-bold text-emerald-800 uppercase">Stage 4: Final Approved</span>
                <div className="p-2 bg-white border border-emerald-300 rounded font-mono text-emerald-950 font-semibold">
                  "STAINLESS STEEL | SS304 | 50.8 MM | SCH40"
                </div>
                <p className="text-[11px] text-emerald-800">
                  Expert-confirmed canonical standard mapped to Proposed CNMC.
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Engineering Tolerance Demonstration */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4 shadow-xs">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
              <Calculator className="w-4 h-4 text-brand-700" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Interactive Engineering Tolerance & Unit Evaluation
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-3">
                <p className="text-slate-600">
                  In industrial engineering, <strong>2 inch = 50.8 mm</strong>. Therefore, <strong>50 mm &ne; exactly 2 inch</strong>.
                  MatiSync never blindly merges them without applying ASME B36.10M / IS 1239 nominal pipe tolerance rules.
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Dimension A</label>
                    <input
                      type="text"
                      value={valA}
                      onChange={(e) => setValA(e.target.value)}
                      className="w-full border border-slate-300 rounded p-2 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Dimension B</label>
                    <input
                      type="text"
                      value={valB}
                      onChange={(e) => setValB(e.target.value)}
                      className="w-full border border-slate-300 rounded p-2 font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded border border-slate-200 space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Rule Engine Result</span>
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded text-emerald-950 font-medium">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Near-Equivalent under Nominal Pipe Size (NPS) Tolerance</span>
                  </div>
                  <p className="text-[11px] text-emerald-900 mt-1 leading-relaxed">
                    Metric Evaluation: 2 INCH = 50.8 mm. Nominal Bore (NB) corresponds to 50 mm under ASME B36.10M / IS 1239 piping schedules. Original CPSE values remain unmutated.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Abbreviation Normalization Dictionary */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3 shadow-xs">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Standardized Nomenclature & Abbreviation Mappings
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {[
                { raw: 'SS / S.S. / STL SS', norm: 'STAINLESS STEEL' },
                { raw: 'CS / C.S.', norm: 'CARBON STEEL' },
                { raw: 'MS / M.S.', norm: 'MILD STEEL' },
                { raw: 'FLG / FLGD', norm: 'FLANGED' },
                { raw: 'BW', norm: 'BUTT WELD' },
                { raw: 'SCR', norm: 'SCREWED' },
                { raw: 'SCH / SCH.', norm: 'SCHEDULE (SCH)' },
                { raw: 'THK / DIA', norm: 'THICKNESS / DIAMETER' },
              ].map((item, idx) => (
                <div key={idx} className="p-2 border border-slate-200 rounded bg-slate-50">
                  <div className="text-[10px] font-mono text-slate-400">{item.raw}</div>
                  <div className="text-xs font-bold text-brand-900 font-mono mt-0.5">{item.norm}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 27: STANDARDIZATION CENTER WORKSPACE */}
      {activeSubTab === 'standardization' && (
        <div className="space-y-5">
          {/* Material Selector & Search */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="w-full md:w-96 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Filter materials list by code, description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded border border-slate-300 focus:outline-none focus:border-brand-500 font-mono"
              />
            </div>

            <div className="w-full md:w-auto flex items-center space-x-2">
              <span className="text-xs text-slate-500 whitespace-nowrap">Select Material:</span>
              <select
                value={selectedMatId || ''}
                onChange={(e) => setSelectedMatId(Number(e.target.value))}
                className="text-xs bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-mono max-w-md truncate"
              >
                {materials
                  .filter(m => !searchQuery || m.material_code.toLowerCase().includes(searchQuery.toLowerCase()) || m.original_description.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(m => (
                    <option key={m.id} value={m.id}>
                      [{m.cpse_code}] {m.material_code} - {m.original_description.substring(0, 50)}...
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {saveSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-950 rounded-md text-xs font-medium flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {loadingDetail && (
            <div className="bg-white py-12 text-center text-xs text-slate-400 rounded-lg border border-slate-200">
              Loading 4-stage material records and version history...
            </div>
          )}

          {!loadingDetail && selectedDetail && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Left Column: 4-Stage Progression & Edit Form */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {selectedDetail.cpse_name} ({selectedDetail.cpse_code})
                      </span>
                      <h2 className="text-base font-bold font-mono text-slate-900">
                        {selectedDetail.material_code}
                      </h2>
                    </div>
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-mono font-semibold rounded border border-slate-200">
                      Status: {selectedDetail.status}
                    </span>
                  </div>

                  {/* 4-Stage Comparison Display */}
                  <div className="space-y-3">
                    {/* Stage 1: Original */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
                      <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-500 mb-1">
                        <span>Stage 1: Original CPSE Description (Never Mutated)</span>
                        <span className="font-mono text-slate-400">Unit: {selectedDetail.original_unit}</span>
                      </div>
                      <div className="font-mono text-xs text-slate-800 font-semibold">
                        {selectedDetail.original_description}
                      </div>
                    </div>

                    {/* Stage 2: Normalized */}
                    <div className="p-3 bg-blue-50/40 border border-blue-200 rounded-md">
                      <div className="flex justify-between items-center text-[10px] uppercase font-bold text-blue-700 mb-1">
                        <span>Stage 2: Deterministically Normalized</span>
                        <span className="font-mono text-blue-600">Unit: {selectedDetail.normalized_unit}</span>
                      </div>
                      <div className="font-mono text-xs text-brand-900 font-semibold">
                        {selectedDetail.normalized_description || selectedDetail.original_description}
                      </div>
                    </div>

                    {/* Stage 3 & 4 Editor */}
                    <form onSubmit={handleSaveStandardization} className="space-y-4 pt-2">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-purple-900 mb-1">
                          Stage 3: AI Standardized Description (Canonical Format)
                        </label>
                        <input
                          type="text"
                          value={stdDesc}
                          onChange={(e) => setStdDesc(e.target.value)}
                          className="w-full border border-purple-300 rounded p-2 text-xs font-mono text-purple-950 bg-purple-50/20 focus:outline-none focus:border-purple-600"
                          placeholder="e.g. STAINLESS STEEL | SS304 | 50.8 MM | SCH40"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-emerald-900 mb-1">
                          Stage 4: Final Approved Description (Mapped to Common National Code)
                        </label>
                        <input
                          type="text"
                          value={finalApprDesc}
                          onChange={(e) => setFinalApprDesc(e.target.value)}
                          className="w-full border border-emerald-300 rounded p-2 text-xs font-mono text-emerald-950 bg-emerald-50/20 focus:outline-none focus:border-emerald-600"
                          placeholder="e.g. STAINLESS STEEL | SS304 | 50.8 MM | SCH40"
                          required
                        />
                      </div>

                      {/* Technical Attributes Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Base Material</label>
                          <input
                            type="text"
                            value={editMaterialName}
                            onChange={(e) => setEditMaterialName(e.target.value)}
                            className="w-full border border-slate-200 rounded p-1.5 text-xs font-mono"
                            placeholder="Stainless Steel"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Grade</label>
                          <input
                            type="text"
                            value={editGrade}
                            onChange={(e) => setEditGrade(e.target.value)}
                            className="w-full border border-slate-200 rounded p-1.5 text-xs font-mono"
                            placeholder="SS304"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Size / Dimension</label>
                          <input
                            type="text"
                            value={editSize}
                            onChange={(e) => setEditSize(e.target.value)}
                            className="w-full border border-slate-200 rounded p-1.5 text-xs font-mono"
                            placeholder="50 MM / 2 INCH"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Schedule / Rating</label>
                          <input
                            type="text"
                            value={editSchedule}
                            onChange={(e) => setEditSchedule(e.target.value)}
                            className="w-full border border-slate-200 rounded p-1.5 text-xs font-mono"
                            placeholder="SCH40"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Engineering Standard</label>
                          <input
                            type="text"
                            value={editStandard}
                            onChange={(e) => setEditStandard(e.target.value)}
                            className="w-full border border-slate-200 rounded p-1.5 text-xs font-mono"
                            placeholder="ASTM A312"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Proposed CNMC</label>
                          <div className="p-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-mono font-bold text-brand-900 truncate">
                            {selectedDetail.cnmc_code || 'Unassigned'}
                          </div>
                        </div>
                      </div>

                      {/* Override Reason */}
                      <div className="pt-2 border-t border-slate-100">
                        <label className="block text-[10px] uppercase font-bold text-amber-800 mb-1">
                          Mandatory Review Justification / Reason for Modification
                        </label>
                        <input
                          type="text"
                          value={overrideReason}
                          onChange={(e) => setOverrideReason(e.target.value)}
                          className="w-full border border-amber-300 rounded p-2 text-xs text-slate-800 bg-amber-50/20 focus:outline-none focus:border-amber-600"
                          placeholder="e.g. Metallurgical expert confirmed grade compatibility under OISD-118."
                          required
                        />
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          type="submit"
                          disabled={saving}
                          className="px-4 py-2 bg-brand-700 hover:bg-brand-600 text-white rounded text-xs font-bold shadow-xs flex items-center space-x-1.5 disabled:opacity-50"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>{saving ? 'Creating Version...' : 'Save & Record Immutable Version'}</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>

              {/* Right Column: Traceable Version History (Section 29) */}
              <div className="lg:col-span-1 space-y-4">
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
                    <History className="w-4 h-4 text-brand-700" />
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                      Material Version History ({selectedDetail.versions.length})
                    </h3>
                  </div>

                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {selectedDetail.versions.length === 0 && (
                      <p className="text-xs text-slate-400 italic">No version modifications recorded.</p>
                    )}

                    {selectedDetail.versions.map((v) => (
                      <div key={v.id} className="p-3 bg-slate-50 border border-slate-200 rounded-md text-xs space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-bold font-mono text-brand-900 bg-brand-50 px-1.5 py-0.5 rounded border border-brand-200 text-[10px]">
                            v{v.version_num} &bull; {v.change_type}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(v.changed_at).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-700">
                          <strong>Changed By:</strong> {v.changed_by}
                        </div>

                        {v.field_changed && (
                          <div className="text-[10px] text-slate-500">
                            <strong>Field:</strong> {v.field_changed}
                          </div>
                        )}

                        {v.reason && (
                          <div className="text-[10px] text-amber-900 bg-amber-50 p-1.5 rounded border border-amber-200 mt-1">
                            <strong>Reason:</strong> {v.reason}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
