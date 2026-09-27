import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, RefreshCw, Key, Download, CheckCircle, Search, Filter, Lock } from 'lucide-react';
import { AuditLog } from '../types';
import { api } from '../services/api';

export const AuditTrailView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    is_valid: boolean;
    total_logs_checked: number;
    verified_at: string;
    first_hash?: string;
    latest_hash?: string;
    corrupted_entry_index?: number;
    message: string;
  } | null>(null);

  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getAuditTrail(100);
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const runVerification = async () => {
    setVerifying(true);
    try {
      const res = await api.verifyAudit();
      setVerificationResult(res);
    } catch (err) {
      console.error('Failed to verify audit trail:', err);
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    runVerification();
  }, []);

  const handleSimulateTamper = async () => {
    setSimulating(true);
    try {
      await api.simulateTamper();
      await fetchLogs();
      await runVerification();
    } catch (err) {
      alert('Failed to simulate tamper');
    } finally {
      setSimulating(false);
    }
  };

  const handleRestoreTamper = async () => {
    setSimulating(true);
    try {
      await api.restoreTamper();
      await fetchLogs();
      await runVerification();
    } catch (err) {
      alert('Failed to restore tamper');
    } finally {
      setSimulating(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (filterAction !== 'ALL' && log.action !== filterAction) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        log.action.toLowerCase().includes(q) ||
        log.user_email.toLowerCase().includes(q) ||
        (log.entity_id && log.entity_id.toLowerCase().includes(q)) ||
        (log.reason && log.reason.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base font-bold text-slate-900 tracking-tight">Tamper-Evident SHA-256 Audit Trail</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
              {logs.length} Immutable Blocks
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Forward-linked cryptographic hash chain providing mathematically verifiable proof of all material actions and expert overrides
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs">
          <a
            href={api.exportAuditUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center space-x-1.5 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export RFC-4180 CSV</span>
          </a>
          <button
            onClick={runVerification}
            disabled={verifying}
            className="px-3.5 py-1.5 rounded bg-brand-700 hover:bg-brand-600 text-white text-xs font-bold flex items-center space-x-1.5 shadow-2xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${verifying ? 'animate-spin' : ''}`} />
            <span>{verifying ? 'Verifying Chain...' : 'Verify Cryptographic Integrity'}</span>
          </button>
        </div>
      </div>

      {/* Regulatory & Cryptographic Architecture Notice (Section 31) */}
      <div className="bg-amber-50/80 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 flex items-start space-x-2">
        <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Engineering & Regulatory Governance Note (Section 31):</strong> The forward-linked SHA-256 hash chain makes unauthorized modifications cryptographically detectable across previous block hashes and signed state changes. It is an enterprise audit-integrity mechanism designed for verifiable master data provenance, not an absolute claim of legal-grade non-repudiation.
        </p>
      </div>

      {/* Cryptographic Verification Banner */}
      {verificationResult && (
        <div
          className={`p-4 rounded-lg border shadow-xs transition-all ${
            verificationResult.is_valid
              ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
              : 'bg-rose-50/90 border-rose-300 text-rose-950 animate-pulse'
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start space-x-3">
              {verificationResult.is_valid ? (
                <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div>
                <h3 className="font-bold text-sm">
                  {verificationResult.is_valid
                    ? 'Audit Trail Cryptographically Verified & Immutable'
                    : 'CRYPTOGRAPHIC INTEGRITY VIOLATION DETECTED'}
                </h3>
                <p className="text-xs mt-0.5 opacity-90">{verificationResult.message}</p>
                <div className="flex flex-wrap gap-4 mt-2 text-[10px] font-mono opacity-80">
                  <span>Checked Blocks: {verificationResult.total_logs_checked}</span>
                  {verificationResult.latest_hash && (
                    <span>Latest Block Hash: {verificationResult.latest_hash.substring(0, 16)}...</span>
                  )}
                  {verificationResult.corrupted_entry_index && (
                    <span className="text-rose-700 font-bold">
                      Failed at Sequence Index: #{verificationResult.corrupted_entry_index}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Tamper Simulation Demo Controls */}
            <div className="flex items-center space-x-2 shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">Demo Controls:</span>
              <button
                onClick={handleSimulateTamper}
                disabled={simulating}
                className="px-2.5 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
              >
                Simulate Demo Tamper
              </button>
              <button
                onClick={handleRestoreTamper}
                disabled={simulating}
                className="px-2.5 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
              >
                Restore Clean State
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex-1 w-full md:w-auto relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search audit trail by actor, action, or entity ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded border border-slate-200 focus:outline-none focus:border-brand-500"
          />
        </div>
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-brand-500 font-medium"
          >
            <option value="ALL">All Recorded Actions</option>
            <option value="MATCH_REVIEWED">MATCH_REVIEWED</option>
            <option value="AI_MATCHING_ENGINE_RUN">AI_MATCHING_ENGINE_RUN</option>
            <option value="MATERIAL_CREATED">MATERIAL_CREATED</option>
            <option value="LEGACY_RATIONALIZATION_ACTION">LEGACY_RATIONALIZATION_ACTION</option>
            <option value="BATCH_FILE_UPLOAD">BATCH_FILE_UPLOAD</option>
          </select>
        </div>
      </div>

      {/* Main Hash Chain Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading audit trail entries...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">No matching audit events found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Block #</th>
                  <th className="py-3 px-4">Timestamp (UTC)</th>
                  <th className="py-3 px-4">Actor & Role</th>
                  <th className="py-3 px-4">Action & Target</th>
                  <th className="py-3 px-4">Justification / Reason</th>
                  <th className="py-3 px-4 font-mono">Cryptographic Hash Link</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-brand-900 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                        #{log.sequence_num}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{log.user_email}</div>
                      <div className="text-[10px] text-slate-400">{log.user_role}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                        {log.action}
                      </span>
                      {log.entity_id && (
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {log.entity_type}: {log.entity_id}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 max-w-xs text-slate-600">
                      <div className="text-[11px] line-clamp-2 italic">
                        {log.reason || 'Routine system execution'}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[10px]">
                      <div className="text-slate-700">
                        <span className="text-slate-400">Curr: </span>
                        <span className="font-bold">{(log.entry_hash || log.current_hash || '').substring(0, 12)}...</span>
                      </div>
                      <div className="text-slate-400">
                        <span>Prev: </span>
                        <span>{(log.previous_entry_hash || log.previous_hash || '').substring(0, 12)}...</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Log Detail Inspector Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-lg shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden">
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Audit Block #{selectedLog.sequence_num} Cryptographic Inspector
                </h3>
                <span className="text-[10px] font-mono text-slate-500">
                  Timestamp: {selectedLog.timestamp}
                </span>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600 text-base font-bold"
              >
                &times;
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded border border-slate-200 font-mono text-[11px]">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block font-sans">Action</span>
                  <span className="font-bold text-slate-900">{selectedLog.action}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block font-sans">Actor</span>
                  <span className="font-bold text-slate-900">{selectedLog.user_email}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block font-sans">Entity Type / ID</span>
                  <span className="font-bold text-slate-900">{selectedLog.entity_type} / {selectedLog.entity_id}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block font-sans">User Role</span>
                  <span className="font-bold text-slate-900">{selectedLog.user_role}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  SHA-256 Cryptographic Hashes
                </span>
                <div className="bg-slate-900 text-slate-200 p-3 rounded font-mono text-[10px] space-y-2 break-all">
                  <div>
                    <span className="text-slate-400 block">CURRENT BLOCK HASH:</span>
                    <span className="text-emerald-400 font-bold">{selectedLog.entry_hash || selectedLog.current_hash}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">PREVIOUS BLOCK HASH:</span>
                    <span className="text-brand-300">{selectedLog.previous_entry_hash || selectedLog.previous_hash}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Previous Value Payload
                  </span>
                  <pre className="bg-slate-50 p-2.5 rounded border border-slate-200 text-[10px] font-mono overflow-x-auto text-slate-700">
                    {selectedLog.previous_value_json
                      ? JSON.stringify(JSON.parse(selectedLog.previous_value_json), null, 2)
                      : 'null'}
                  </pre>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    New Value Payload
                  </span>
                  <pre className="bg-slate-50 p-2.5 rounded border border-slate-200 text-[10px] font-mono overflow-x-auto text-slate-700">
                    {selectedLog.new_value_json
                      ? JSON.stringify(JSON.parse(selectedLog.new_value_json), null, 2)
                      : 'null'}
                  </pre>
                </div>
              </div>

              {selectedLog.reason && (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded text-amber-900">
                  <span className="text-[10px] uppercase font-bold text-amber-700 block mb-0.5">
                    Recorded Override Reason / Justification
                  </span>
                  <p className="text-xs">{selectedLog.reason}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 rounded bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-xs"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
