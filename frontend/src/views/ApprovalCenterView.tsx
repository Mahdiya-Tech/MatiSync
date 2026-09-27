import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, XCircle, AlertTriangle, ShieldAlert, 
  Clock, Eye, Filter, ArrowRight, ShieldCheck, UserCheck, RefreshCw, Layers
} from 'lucide-react';
import { api } from '../services/api';
import { MaterialMatch, User } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { SideBySideCompareModal } from '../components/SideBySideCompareModal';
import { OverrideReasonModal } from '../components/OverrideReasonModal';

interface Props {
  currentUser: User;
  onSelectMaterial: (id: number) => void;
}

export const ApprovalCenterView: React.FC<Props> = ({ currentUser, onSelectMaterial }) => {
  const [matches, setMatches] = useState<MaterialMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState<string>('PENDING');
  const [searchFilter, setSearchFilter] = useState('');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Modals state
  const [selectedMatch, setSelectedMatch] = useState<MaterialMatch | null>(null);
  const [overrideMatchId, setOverrideMatchId] = useState<number | null>(null);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const decisionParam = statusTab === 'ALL' ? undefined : (statusTab === 'REVIEW' ? 'NEEDS_INFO' : statusTab);
      const res = await api.getMatches({
        decision: decisionParam,
        limit: 100
      });
      setMatches(res.items);
    } catch (err: any) {
      console.error('Failed to fetch approval matches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [statusTab]);

  const canUserApprove = (match: MaterialMatch): { allowed: boolean; reason?: string } => {
    if (currentUser.role === 'Admin') return { allowed: true };
    if (currentUser.role === 'Management') return { allowed: false, reason: 'Management role has view-only permissions.' };
    if (currentUser.role === 'Procurement Officer') return { allowed: false, reason: 'Procurement role does not have technical sign-off authorization.' };

    const isTechnicalSensitive = 
      match.relationship_type === 'Functionally Equivalent' ||
      match.relationship_type === 'Technical Review Required' ||
      match.relationship_type === 'Potential Match' ||
      match.conflicting_attributes.length > 0;

    if (currentUser.role === 'Technical Expert') {
      return { allowed: true };
    }

    if (currentUser.role === 'CPSE Material Officer') {
      if (isTechnicalSensitive) {
        return { 
          allowed: false, 
          reason: 'Technical Expert sign-off mandatory for Functional Equivalence and Technical Conflicts.' 
        };
      }
      // Material officer can approve Exact / Near Duplicates within their CPSE
      if (currentUser.cpse_code && (match.material_a.cpse_code === currentUser.cpse_code || match.material_b.cpse_code === currentUser.cpse_code)) {
        return { allowed: true };
      }
      return { 
        allowed: false, 
        reason: `Can only sign off duplicates involving own enterprise catalog (${currentUser.cpse_code}).` 
      };
    }

    return { allowed: false, reason: 'Insufficient role authorization.' };
  };

  const handleApprove = async (matchId: number) => {
    try {
      await api.reviewMatch(matchId, 'APPROVE');
      setNotification({
        message: 'Match approved successfully! Assigned Proposed CNMC standard and established cross-CPSE mapping.',
        type: 'success'
      });
      fetchMatches();
      setSelectedMatch(null);
    } catch (err: any) {
      setNotification({ message: `Approval failed: ${err.message}`, type: 'error' });
    }
  };

  const handleReject = async (matchId: number) => {
    try {
      await api.reviewMatch(matchId, 'REJECT', 'Rejected during expert approval center review');
      setNotification({ message: 'Candidate match rejected and recorded to audit chain.', type: 'info' });
      fetchMatches();
      setSelectedMatch(null);
    } catch (err: any) {
      setNotification({ message: `Rejection failed: ${err.message}`, type: 'error' });
    }
  };

  const handleRequestTechnicalReview = async (matchId: number) => {
    try {
      await api.reviewMatch(matchId, 'NEEDS_INFO', 'Escalated for deep technical and metallurgical investigation');
      setNotification({ message: 'Record escalated to Technical Expert queue for physical review.', type: 'info' });
      fetchMatches();
      setSelectedMatch(null);
    } catch (err: any) {
      setNotification({ message: `Escalation failed: ${err.message}`, type: 'error' });
    }
  };

  const handleOverrideSubmit = async (matchId: number, decision: string, reason: string) => {
    try {
      await api.reviewMatch(matchId, decision, reason);
      setNotification({
        message: `Override registered: ${decision}. Rationale cryptographically signed to SHA-256 audit log.`,
        type: 'success'
      });
      fetchMatches();
      setOverrideMatchId(null);
      setSelectedMatch(null);
    } catch (err: any) {
      setNotification({ message: `Override failed: ${err.message}`, type: 'error' });
    }
  };

  const filteredMatches = matches.filter(m => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      m.material_a.material_code.toLowerCase().includes(q) ||
      m.material_b.material_code.toLowerCase().includes(q) ||
      m.material_a.original_description.toLowerCase().includes(q) ||
      m.material_b.original_description.toLowerCase().includes(q) ||
      m.material_a.cpse_code.toLowerCase().includes(q) ||
      m.material_b.cpse_code.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5">
      {/* Toast Notification */}
      {notification && (
        <div className={`p-3.5 rounded-lg border text-xs flex items-center justify-between shadow-xs animate-fadeIn ${
          notification.type === 'success' ? 'bg-emerald-50 border-emerald-300 text-emerald-900' :
          notification.type === 'error' ? 'bg-rose-50 border-rose-300 text-rose-900' :
          'bg-blue-50 border-blue-300 text-blue-900'
        }`}>
          <div className="flex items-center space-x-2">
            {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />}
            <span className="font-semibold">{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="font-bold text-slate-500 hover:text-slate-800 ml-4">&times;</button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base font-bold text-slate-900 tracking-tight">
              Human-in-the-Loop Approval Center (Section 28)
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-brand-50 text-brand-800 border border-brand-200">
              RBAC Governed
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            AI recommends, human experts verify, and the system cryptographically records every material decision.
          </p>
        </div>

        {/* Current User Role Notice */}
        <div className="flex items-center space-x-2 text-xs bg-slate-50 border border-slate-200 px-3 py-1.5 rounded">
          <UserCheck className="w-4 h-4 text-brand-700" />
          <div>
            <span className="text-slate-500">Signing Authority: </span>
            <span className="font-bold text-slate-900">{currentUser.full_name}</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.2 bg-brand-100 text-brand-800 rounded font-semibold">
              {currentUser.role}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          {/* Status Tabs */}
          <div className="flex flex-wrap gap-1 text-xs">
            {[
              { id: 'PENDING', label: 'Pending Decisions' },
              { id: 'REVIEW', label: 'Under Technical Review' },
              { id: 'APPROVED', label: 'Approved & Standardized' },
              { id: 'REJECTED', label: 'Rejected' },
              { id: 'MODIFIED', label: 'Overridden by Expert' },
              { id: 'ALL', label: 'All Records' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusTab(tab.id)}
                className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                  statusTab === tab.id
                    ? 'bg-brand-700 text-white shadow-2xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={fetchMatches}
            className="p-1.5 border border-slate-200 rounded hover:bg-slate-50 text-slate-600"
            title="Refresh queue"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Search input */}
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Filter by CPSE (e.g. CPCL, NTPC), Material Code, or technical description..."
            className="flex-1 text-xs p-2 bg-slate-50 border border-slate-200 rounded font-mono focus:outline-none focus:border-brand-600"
          />
          <span className="text-xs text-slate-500 font-mono shrink-0">
            {filteredMatches.length} candidates loaded
          </span>
        </div>
      </div>

      {/* Approval Records List */}
      {loading ? (
        <div className="py-16 text-center text-slate-500 text-xs">Loading approval center queue...</div>
      ) : filteredMatches.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-slate-500 text-xs space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
          <div className="font-bold text-slate-800 text-sm">No items found in this approval queue</div>
          <p className="text-slate-500 max-w-md mx-auto">
            All candidates in the {statusTab} status have been reviewed or filter criteria matched 0 records. Run automated matching or switch filter tabs to view other records.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMatches.map((m) => {
            const permission = canUserApprove(m);
            const hasConflict = m.conflicting_attributes.length > 0 || m.relationship_type === 'Technical Review Required';

            return (
              <div
                key={m.id}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-lg p-4 shadow-2xs space-y-3 transition-colors"
              >
                {/* Top Badge & Metric Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={m.relationship_type} />
                    <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border ${
                      m.ai_score >= 90 ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                      m.ai_score >= 75 ? 'bg-blue-50 text-blue-800 border-blue-200' :
                      'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      AI Score: {m.ai_score.toFixed(1)}%
                    </span>
                    {m.adjusted_score && (
                      <span className="text-[10px] font-mono text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                        Adjusted: {m.adjusted_score.toFixed(1)}%
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400 font-mono">
                      Config: {m.explanation?.weights_applied ? 'OIL-GAS-REV4' : 'STANDARD'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 text-[11px]">
                    <span className="text-slate-500">Status:</span>
                    <span className={`font-bold font-mono px-2 py-0.5 rounded ${
                      m.decision === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                      m.decision === 'REJECTED' ? 'bg-rose-100 text-rose-800' :
                      m.decision === 'MODIFIED' ? 'bg-purple-100 text-purple-800' :
                      'bg-amber-100 text-amber-900'
                    }`}>
                      {m.decision}
                    </span>
                  </div>
                </div>

                {/* Bilateral Materials Comparison Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {/* Material A */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-brand-900 font-mono">{m.material_a.cpse_code} Master</span>
                      <button
                        onClick={() => onSelectMaterial(m.material_a.id)}
                        className="text-brand-700 hover:underline font-mono text-[10px]"
                      >
                        {m.material_a.material_code}
                      </button>
                    </div>
                    <div className="font-mono text-slate-800 font-medium line-clamp-2">
                      {m.material_a.original_description}
                    </div>
                    <div className="text-[10px] text-slate-500 pt-1 flex items-center space-x-2">
                      <span>Cat: {m.material_a.category}</span>
                      <span>&bull;</span>
                      <span>Quality: {m.material_a.data_quality_score}%</span>
                    </div>
                  </div>

                  {/* Material B */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-brand-900 font-mono">{m.material_b.cpse_code} Master</span>
                      <button
                        onClick={() => onSelectMaterial(m.material_b.id)}
                        className="text-brand-700 hover:underline font-mono text-[10px]"
                      >
                        {m.material_b.material_code}
                      </button>
                    </div>
                    <div className="font-mono text-slate-800 font-medium line-clamp-2">
                      {m.material_b.original_description}
                    </div>
                    <div className="text-[10px] text-slate-500 pt-1 flex items-center space-x-2">
                      <span>Cat: {m.material_b.category}</span>
                      <span>&bull;</span>
                      <span>Quality: {m.material_b.data_quality_score}%</span>
                    </div>
                  </div>
                </div>

                {/* Technical Conflicts Banner if present */}
                {hasConflict && (
                  <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded text-xs text-amber-950 flex items-start space-x-2">
                    <ShieldAlert className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                    <div className="space-y-1 flex-1">
                      <div className="font-bold flex items-center justify-between">
                        <span>Technical Discrepancy Held on High Similarity:</span>
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 bg-amber-200 text-amber-900 rounded">
                          Safety Interlock
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-700">
                        {m.conflicting_attributes.map((c, i) => (
                          <div key={i}>
                            <strong>{c.attribute}:</strong> {c.value_a} vs {c.value_b}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Explanation Snippet */}
                {m.explanation && m.explanation.summary && (
                  <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 flex items-center justify-between">
                    <span><strong>Explainable AI:</strong> {m.explanation.summary}</span>
                    {m.explanation.active_learning_history && (
                      <span className="font-mono text-[10px] text-purple-800 shrink-0 ml-2">
                        Past: {m.explanation.active_learning_history.approved} Approved / {m.explanation.active_learning_history.rejected} Rejected
                      </span>
                    )}
                  </div>
                )}

                {/* Footer Controls & Governance Bar */}
                <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  {/* Signing Authority Rule Indicator */}
                  <div className="text-[11px] text-slate-500 flex items-center space-x-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      {hasConflict
                        ? 'Requires Technical Expert approval (incompatibility detected)'
                        : 'Material Officer approval permitted for intra-CPSE duplicate'}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setSelectedMatch(m)}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold text-xs flex items-center space-x-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Side-by-Side</span>
                    </button>

                    <button
                      onClick={() => setOverrideMatchId(m.id)}
                      className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded font-semibold text-xs"
                      title="Override AI recommendation with formal signed reason"
                    >
                      Modify / Override
                    </button>

                    <button
                      onClick={() => handleRequestTechnicalReview(m.id)}
                      className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded font-semibold text-xs flex items-center space-x-1"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Request Review</span>
                    </button>

                    <button
                      onClick={() => handleReject(m.id)}
                      disabled={!permission.allowed}
                      className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded font-semibold text-xs flex items-center space-x-1 disabled:opacity-40 disabled:cursor-not-allowed"
                      title={!permission.allowed ? permission.reason : 'Reject match'}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>

                    <button
                      onClick={() => handleApprove(m.id)}
                      disabled={!permission.allowed}
                      className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded font-bold text-xs flex items-center space-x-1 shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed"
                      title={!permission.allowed ? permission.reason : 'Approve and generate/assign Proposed CNMC'}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                  </div>
                </div>

                {!permission.allowed && (
                  <div className="text-[10px] text-amber-800 bg-amber-50/50 p-1.5 rounded border border-amber-200/60 font-mono">
                    <strong>Notice:</strong> {permission.reason}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Deep Side-by-Side Spec Comparison Modal */}
      {selectedMatch && (
        <SideBySideCompareModal
          match={selectedMatch}
          onClose={() => setSelectedMatch(null)}
          onApprove={handleApprove}
          onReject={handleReject}
          onOverride={(matchId) => {
            setOverrideMatchId(matchId);
            setSelectedMatch(null);
          }}
        />
      )}

      {/* Override Reason Required Modal */}
      {overrideMatchId && (
        <OverrideReasonModal
          isOpen={!!overrideMatchId}
          matchId={overrideMatchId}
          onClose={() => setOverrideMatchId(null)}
          onSubmit={handleOverrideSubmit}
        />
      )}
    </div>
  );
};
