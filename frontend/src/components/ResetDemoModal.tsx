import React, { useState } from 'react';
import { X, RefreshCw, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onResetComplete: () => void;
}

export const ResetDemoModal: React.FC<Props> = ({ isOpen, onClose, onResetComplete }) => {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (token !== 'CONFIRM_RESET_DEMO_DATA') {
      setError('Please type exact token: CONFIRM_RESET_DEMO_DATA');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await api.resetDemoData(token);
      onResetComplete();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-4 h-4 text-brand-700" />
            <h3 className="text-sm font-bold text-slate-900">Reset Synthetic Demo Dataset</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleReset} className="p-5 space-y-3.5 text-xs">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-900 flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Restore Demo Environment:</span> This will safely reload the 130+ pre-configured synthetic material records, the 3 prepared demo cases (Duplicate, Technical Conflict, Search-Before-Create), and restore the tamper-evident hash chain to its verified state.
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-800 mb-1">
              Type <code className="bg-slate-100 px-1 py-0.5 rounded text-brand-900 font-mono">CONFIRM_RESET_DEMO_DATA</code> to confirm:
            </label>
            <input
              type="text"
              value={token}
              onChange={(e) => {
                setToken(e.target.value);
                if (error) setError(null);
              }}
              placeholder="CONFIRM_RESET_DEMO_DATA"
              className="w-full border border-slate-300 rounded p-2 font-mono text-xs focus:outline-brand-600"
            />
            {error && <p className="text-rose-600 text-xs mt-1">{error}</p>}
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 border border-slate-300 rounded text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || token !== 'CONFIRM_RESET_DEMO_DATA'}
              className="px-4 py-1.5 bg-brand-900 text-white rounded hover:bg-brand-950 font-medium disabled:opacity-50"
            >
              {loading ? 'Resetting...' : 'Confirm Reset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
