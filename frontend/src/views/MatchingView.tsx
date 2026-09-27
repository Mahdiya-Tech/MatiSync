import React, { useState, useEffect } from 'react';
import { Layers, ShieldAlert, CheckCircle2, XCircle, Eye, AlertTriangle, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { MaterialMatch } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { SideBySideCompareModal } from '../components/SideBySideCompareModal';
import { OverrideReasonModal } from '../components/OverrideReasonModal';

interface Props {
  onSelectMaterial: (id: number) => void;
  initialFilter?: string;
}

export const MatchingView: React.FC<Props> = ({ onSelectMaterial, initialFilter }) => {
  const [matches, setMatches] = useState<MaterialMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [relFilter, setRelFilter] = useState(initialFilter || '');
  const [decisionFilter, setDecisionFilter] = useState('');
  
  // Modals state
  const [selectedMatch, setSelectedMatch] = useState<MaterialMatch | null>(null);
  const [overrideMatchId, setOverrideMatchId] = useState<number | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const res = await api.getMatches({
        relationship_type: relFilter || undefined,
        decision: decisionFilter || undefined,
        limit: 100
      });
      setMatches(res.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [relFilter, decisionFilter]);

  const handleApprove = async (matchId: number) => {
    try {
      await api.reviewMatch(matchId, 'APPROVE');
      setNotification('Match approved successfully! Assigned Proposed CNMC and created CPSE mappings.');
      fetchMatches();
      setSelectedMatch(null);
    } catch (err: any) {
      setNotification(`Approval failed: ${err.message}`);
    }
  };

  const handleReject = async (matchId: number) => {
    try {
      await api.reviewMatch(matchId, 'REJECT', 'Rejected by technical review');
      setNotification('Match rejected.');
      fetchMatches();
      setSelectedMatch(null);
    } catch (err: any) {
      setNotification(`Rejection failed: ${err.message}`);
    }
  };

  const handleOverrideSubmit = async (matchId: number, decision: string, reason: string) => {
    try {
      await api.reviewMatch(matchId, decision, reason);
      setNotification(`Override submitted: ${decision}. Rationale signed to audit log.`);
      fetchMatches();
      setOverrideMatchId(null);
      setSelectedMatch(null);
    } catch (err: any) {
      setNotification(`Override failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Real Enterprise Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base font-bold text-slate-900 tracking-tight">
              Material Harmonization & Discrepancy Board
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
              IBR 1950 & OISD-118 Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Bilateral cross-catalog matching with physical conflict safety overrides and ASME B36.10M tolerances
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-2 text-xs">
          <select
            value={relFilter}
            onChange={(e) => setRelFilter(e.target.value)}
            className="border border-slate-300 rounded px-2.5 py-1.5 bg-white text-xs"
          >
            <option value="">All Relationships</option>
            <option value="Exact Duplicate">Exact Duplicate</option>
            <option value="Near Duplicate">Near Duplicate</option>
            <option value="Functionally Equivalent">Functionally Equivalent</option>
            <option value="Technical Review Required">Technical Review Required (Conflicts)</option>
            <option value="Potential Match">Potential Match</option>
          </select>

          <select
            value={decisionFilter}
            onChange={(e) => setDecisionFilter(e.target.value)}
            className="border border-slate-300 rounded px-2.5 py-1.5 bg-white text-xs"
          >
            <option value="">All Decisions</option>
            <option value="PENDING">Pending Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="NOT_EQUIVALENT">Not Equivalent</option>
          </select>
        </div>
      </div>

      {notification && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded text-xs flex justify-between items-center">
          <span>{notification}</span>
          <button onClick={() => setNotification(null)} className="font-bold text-blue-700 ml-2">×</button>
        </div>
      )}

      {/* Match Cards List */}
      <div className="space-y-3">
        {loading && (
          <div className="py-12 text-center text-slate-400 text-xs">
            Loading pairwise match comparison results...
          </div>
        )}

        {!loading && matches.length === 0 && (
          <div className="py-12 text-center text-slate-500 bg-white border border-slate-200 rounded-lg">
            No matches found matching active filters.
          </div>
        )}

        {!loading && matches.map((m) => {
          const isConflict = m.relationship_type.includes('Technical Review') || m.conflicting_attributes.some(c => c.severity === 'CRITICAL');

          return (
            <div
              key={m.id}
              className={`p-4 bg-white border rounded-lg shadow-xs transition-colors ${
                isConflict ? 'border-amber-300 bg-amber-50/10' : 'border-slate-200'
              }`}
            >
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                {/* Left: Material A vs Material B */}
                <div className="space-y-2 flex-1">
                  <div className="flex items-center space-x-2">
                    <StatusBadge status={m.relationship_type} />
                    <span className="text-[11px] font-mono text-slate-400">Match #{m.id}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      m.decision === 'APPROVED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : (m.decision === 'PENDING'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700')
                    }`}>
                      {m.decision}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    {/* Material A */}
                    <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                      <div className="flex items-center space-x-2 text-xs mb-1">
                        <span className="font-bold text-brand-900 font-mono">[{m.material_a.cpse_code}]</span>
                        <span className="font-mono font-semibold text-slate-800">{m.material_a.material_code}</span>
                      </div>
                      <p className="text-xs font-mono text-slate-700 line-clamp-1">{m.material_a.original_description}</p>
                    </div>

                    {/* Material B */}
                    <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                      <div className="flex items-center space-x-2 text-xs mb-1">
                        <span className="font-bold text-brand-900 font-mono">[{m.material_b.cpse_code}]</span>
                        <span className="font-mono font-semibold text-slate-800">{m.material_b.material_code}</span>
                      </div>
                      <p className="text-xs font-mono text-slate-700 line-clamp-1">{m.material_b.original_description}</p>
                    </div>
                  </div>

                  {/* Summary & Conflict Warning */}
                  {isConflict && (
                    <div className="p-2 bg-amber-50 text-amber-900 rounded border border-amber-200 text-xs flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>
                        <strong>Safety Override Active:</strong> High text similarity ({m.text_score}%), but critical schedule/spec conflict detected. Automated merge locked.
                      </span>
                    </div>
                  )}

                  <p className="text-xs text-slate-600 line-clamp-1">
                    <strong>AI Rationale:</strong> {m.explanation?.summary}
                  </p>
                </div>

                {/* Right: Scores & Actions */}
                <div className="flex flex-col sm:flex-row lg:flex-col items-end justify-between gap-3 shrink-0 text-right w-full lg:w-auto pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                  <div>
                    <div className="text-2xl font-black text-brand-900">{m.ai_score}%</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                      Composite Score (Text: {m.text_score}% | Attr: {m.attribute_score}%)
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 text-xs">
                    <button
                      onClick={() => setSelectedMatch(m)}
                      className="px-3 py-1.5 bg-white border border-slate-300 rounded text-slate-800 hover:bg-slate-50 font-medium flex items-center space-x-1"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>Compare Specs</span>
                    </button>

                    {m.decision === 'PENDING' && (
                      <>
                        <button
                          onClick={() => setOverrideMatchId(m.id)}
                          className="px-2.5 py-1.5 bg-amber-50 text-amber-800 border border-amber-300 rounded hover:bg-amber-100 font-medium"
                        >
                          Override
                        </button>
                        <button
                          onClick={() => handleApprove(m.id)}
                          className="px-3 py-1.5 bg-brand-900 hover:bg-brand-950 text-white rounded font-medium shadow-xs"
                        >
                          Approve
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Side by Side Comparison Modal */}
      <SideBySideCompareModal
        match={selectedMatch}
        onClose={() => setSelectedMatch(null)}
        onApprove={handleApprove}
        onReject={handleReject}
        onOverride={(id) => {
          setSelectedMatch(null);
          setOverrideMatchId(id);
        }}
      />

      {/* Override Reason Modal */}
      <OverrideReasonModal
        isOpen={overrideMatchId !== null}
        matchId={overrideMatchId}
        onClose={() => setOverrideMatchId(null)}
        onSubmit={handleOverrideSubmit}
      />
    </div>
  );
};
