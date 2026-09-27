import React, { useState, useEffect } from 'react';
import { Building2, Database, Upload, ArrowRight, CheckCircle2, Clock, Shield, Search, RefreshCw, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { CPSEOrg } from '../types';

interface Props {
  onNavigateToMaterials: (cpseCode: string) => void;
  onNavigateToUpload: () => void;
}

const CPSE_PLANT_DETAILS: Record<string, { location: string; plant_type: string; erp_system: string }> = {
  CPCL: { location: 'Manali Refinery, Chennai (Tamil Nadu)', plant_type: 'Petroleum Refinery', erp_system: 'SAP S/4HANA (Plant 1000)' },
  NTPC: { location: 'Simhadri Super Thermal Plant (Andhra Pradesh)', plant_type: 'Supercritical Thermal Power', erp_system: 'SAP ECC 6.0' },
  ONGC: { location: 'Hazira Gas Processing Complex (Gujarat)', plant_type: 'Offshore/Gas Processing', erp_system: 'SAP S/4HANA' },
  IOCL: { location: 'Panipat Refinery & Petrochemical Complex (Haryana)', plant_type: 'Integrated Refinery & Naphtha Cracker', erp_system: 'SAP S/4HANA' },
  SAIL: { location: 'Bhilai Steel Plant (Chhattisgarh)', plant_type: 'Integrated Blast Furnace & Rail Mill', erp_system: 'Oracle ERP Cloud' },
  BPCL: { location: 'Kochi Refinery, Ambalamugal (Kerala)', plant_type: 'Petroleum Refinery & Petrochem', erp_system: 'SAP S/4HANA' },
  BHEL: { location: 'Heavy Electrical Equipment Plant, Haridwar (Uttarakhand)', plant_type: 'Heavy Engineering & Turbines', erp_system: 'SAP ECC 6.0' },
  CIL: { location: 'SECL Gevra Open Cast Coal Mines (Chhattisgarh)', plant_type: 'Heavy Open Cast Mining & Beneficiation', erp_system: 'Legacy CoalERP (Pending)' }
};

export const CpseManagementView: React.FC<Props> = ({ onNavigateToMaterials, onNavigateToUpload }) => {
  const [cpses, setCpses] = useState<CPSEOrg[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sectorFilter, setSectorFilter] = useState('ALL');

  const fetchCPSES = async () => {
    setLoading(true);
    try {
      const data = await api.getCPSES();
      setCpses(data);
    } catch (err) {
      console.error('Failed to load CPSE list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCPSES();
  }, []);

  const totalMaterials = cpses.reduce((acc, c) => acc + (c.material_count || 0), 0);
  const pilotCount = cpses.filter(c => c.status === 'PILOT').length;
  const activeCount = cpses.filter(c => c.status === 'ACTIVE').length;
  const notConnectedCount = cpses.filter(c => c.status === 'NOT_CONNECTED').length;

  const filteredCPSES = cpses.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(search.toLowerCase()) || 
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.sector.toLowerCase().includes(search.toLowerCase());
    const matchesSector = sectorFilter === 'ALL' || c.sector === sectorFilter;
    return matchesSearch && matchesSector;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base font-bold text-slate-900 tracking-tight">
              Central Public Sector Enterprises (CPSE) Directory (Section 58)
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
              Federated Ecosystem
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational status, connected plant ERP nodes, and master catalog volume across Ministry of Petroleum & Natural Gas, Power, Steel, and Heavy Engineering CPSEs.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <button
            onClick={fetchCPSES}
            className="p-1.5 border border-slate-200 rounded bg-white hover:bg-slate-50 text-slate-600"
            title="Refresh CPSE telemetry"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onNavigateToUpload}
            className="px-3 py-1.5 bg-brand-700 hover:bg-brand-600 text-white rounded font-bold flex items-center space-x-1.5 shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload CPSE Catalog</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white border border-slate-200 rounded-lg shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Total Entities
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">{cpses.length}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Participating public sector giants</div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-lg shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
            Pilot Phase Entities
          </div>
          <div className="text-2xl font-black text-blue-800 mt-1">{pilotCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">CPCL & NTPC bilateral testing</div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-lg shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
            Active Rollout
          </div>
          <div className="text-2xl font-black text-emerald-800 mt-1">{activeCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">ONGC, IOCL, SAIL, BPCL, BHEL</div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-lg shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Total Cataloged Items
          </div>
          <div className="text-2xl font-black text-brand-900 mt-1">{totalMaterials}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Unified master records in DB</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search CPSE by name, code, or sector..."
            className="w-full text-xs p-1.5 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:border-brand-600 font-mono"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-slate-500 font-medium">Sector:</span>
          <select
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
            className="text-xs p-1.5 bg-slate-50 border border-slate-200 rounded font-medium focus:outline-none"
          >
            <option value="ALL">All Sectors</option>
            <option value="Oil & Gas">Oil & Gas (CPCL, ONGC, IOCL, BPCL)</option>
            <option value="Power">Power (NTPC)</option>
            <option value="Steel">Steel (SAIL)</option>
            <option value="Heavy Engineering">Heavy Engineering (BHEL)</option>
            <option value="Mining">Mining (CIL)</option>
          </select>
        </div>
      </div>

      {/* CPSE Directory Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold border-b border-slate-200">
                <th className="p-3">CPSE Code</th>
                <th className="p-3">Enterprise Full Name</th>
                <th className="p-3">Industrial Sector</th>
                <th className="p-3">Operating Complex & ERP Node</th>
                <th className="p-3 text-right">Items in Master</th>
                <th className="p-3">Rollout Status</th>
                <th className="p-3">Last Catalog Upload</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredCPSES.map((c) => {
                const plant = CPSE_PLANT_DETAILS[c.code] || { location: 'Operating Refinery', plant_type: 'Industrial Plant', erp_system: 'SAP ERP' };
                
                return (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Code */}
                    <td className="p-3 font-mono font-bold text-brand-900">
                      <span className="px-2 py-1 bg-brand-50 border border-brand-200 rounded text-brand-800">
                        {c.code}
                      </span>
                    </td>

                    {/* Name */}
                    <td className="p-3 font-medium text-slate-900">
                      <div>{c.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{c.contact_email}</div>
                    </td>

                    {/* Sector */}
                    <td className="p-3 text-slate-700 font-medium">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200">
                        {c.sector}
                      </span>
                    </td>

                    {/* Location & ERP Node */}
                    <td className="p-3 text-[11px] text-slate-600">
                      <div>{plant.location}</div>
                      <div className="text-[10px] text-slate-400 font-mono">ERP: {plant.erp_system}</div>
                    </td>

                    {/* Material Count */}
                    <td className="p-3 text-right font-mono font-bold text-slate-900">
                      {c.material_count || 0}
                    </td>

                    {/* Rollout Status */}
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                        c.status === 'PILOT'
                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                          : c.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {c.status === 'PILOT' ? 'Pilot Phase' : c.status === 'ACTIVE' ? 'Active Rollout' : 'Not Connected'}
                      </span>
                    </td>

                    {/* Last Upload */}
                    <td className="p-3 text-[11px] text-slate-500 font-mono">
                      {c.last_upload ? new Date(c.last_upload).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Never'}
                    </td>

                    {/* Action */}
                    <td className="p-3 text-right">
                      <button
                        onClick={() => onNavigateToMaterials(c.code)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-brand-50 text-slate-700 hover:text-brand-800 rounded font-semibold text-[11px] border border-slate-200 flex items-center space-x-1 ml-auto"
                      >
                        <span>Inspect Catalog</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Architecture Disclaimer */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-xs text-slate-600 flex items-start space-x-2">
        <Shield className="w-4 h-4 text-brand-700 mt-0.5 shrink-0" />
        <p className="leading-relaxed">
          <strong>Section 35 Federated Matching Concept:</strong> Raw transactional purchase orders and sensitive plant inventory numbers remain strictly inside each CPSE's local boundaries. Only mathematical feature embeddings, standardized tokens, and agreed proposed CNMC standards are communicated centrally.
        </p>
      </div>
    </div>
  );
};
