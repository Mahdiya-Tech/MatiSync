import React, { useState } from 'react';
import { X, ShieldAlert } from 'lucide-react';

interface Props {
  isOpen: boolean;
  matchId: number | null;
  onClose: () => void;
  onSubmit: (matchId: number, decision: string, reason: string) => void;
}

export const OverrideReasonModal: React.FC<Props> = ({
  isOpen,
  matchId,
  onClose,
  onSubmit
}) => {
  const [decision, setDecision] = useState('NOT_EQUIVALENT');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !matchId) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('An engineering justification is mandatory when overruling an AI recommendation.');
      return;
    }
    onSubmit(matchId, decision, reason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
        <div className="px-5 py-3.5 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-amber-800" />
            <h3 className="text-sm font-bold text-amber-900">Expert Decision Override</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-700">
            <strong>Mandatory Governance Requirement:</strong> Overriding the AI recommendation requires an explicit engineering rationale. This will be signed and cryptographically recorded in the immutable SHA-256 audit trail.
          </div>

          <div>
            <label className="block font-semibold text-slate-800 mb-1">Human Expert Decision</label>
            <select
              value={decision}
              onChange={(e) => setDecision(e.target.value)}
              className="w-full border border-slate-300 rounded p-2 text-xs bg-white focus:outline-brand-600"
            >
              <option value="NOT_EQUIVALENT">Not Equivalent (Technical Discrepancy)</option>
              <option value="REJECT">Reject Match Proposal</option>
              <option value="NEEDS_MORE_INFO">Request Additional Technical Datasheets</option>
              <option value="APPROVE">Approve as Functional Equivalent</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-800 mb-1">
              Engineering Reason for Override <span className="text-rose-600">*</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. Schedule 80 wall thickness is rated for higher pressure containment in refinery service; cannot be substituted by Schedule 40."
              className="w-full border border-slate-300 rounded p-2 text-xs focus:outline-brand-600"
            />
            {error && <p className="text-rose-600 text-xs mt-1 font-medium">{error}</p>}
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 border border-slate-300 rounded text-slate-700 hover:bg-slate-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-amber-700 text-white rounded hover:bg-amber-800 font-medium"
            >
              Submit Override & Record to Audit Log
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
