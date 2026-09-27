import React from 'react';
import { X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { MaterialMatch } from '../types';
import { StatusBadge } from './StatusBadge';

interface Props {
  match: MaterialMatch | null;
  onClose: () => void;
  onApprove?: (id: number) => void;
  onReject?: (id: number) => void;
  onOverride?: (id: number) => void;
}

export const SideBySideCompareModal: React.FC<Props> = ({
  match,
  onClose,
  onApprove,
  onReject,
  onOverride
}) => {
  if (!match) return null;

  const a = match.material_a;
  const b = match.material_b;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-slate-900">Side-by-Side Material Comparison</h2>
              <StatusBadge status={match.relationship_type} />
            </div>
            <p className="text-xs text-slate-500">
              AI Composite Similarity: <span className="font-extrabold text-brand-900">{match.ai_score}%</span> | Active Learning Adjusted: <span className="font-bold text-slate-700">{match.adjusted_score || match.ai_score}%</span>
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comparison Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
          {/* Critical Conflict Banner if present */}
          {match.conflicting_attributes.some(c => c.severity === 'CRITICAL' || match.relationship_type.includes('Technical Review')) && (
            <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-md flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-800 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-amber-900 text-xs">
                  CRITICAL TECHNICAL CONFLICT DETECTED
                </h3>
                <p className="text-xs text-amber-800 mt-0.5">
                  High description similarity does NOT equal technical interchangeability. One or more critical engineering specifications (e.g. Schedule, Metallurgy, Pressure Class) are incompatible. Automated merging is blocked.
                </p>
              </div>
            </div>
          )}

          {/* Two Columns Side by Side */}
          <div className="grid grid-cols-2 gap-4">
            {/* Material A */}
            <div className="p-4 border border-slate-200 rounded-md bg-white space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div>
                  <span className="px-2 py-0.5 bg-brand-900 text-white rounded text-[11px] font-mono font-bold">
                    {a.cpse_code}
                  </span>
                  <span className="font-mono font-bold text-slate-800 ml-2">{a.material_code}</span>
                </div>
                <StatusBadge status={a.status} />
              </div>

              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Description</div>
                <div className="font-mono font-medium text-slate-800 mt-0.5">{a.original_description}</div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px]">
                <div><span className="text-slate-400">Category:</span> {a.category}</div>
                <div><span className="text-slate-400">Grade:</span> {a.grade || 'Unspecified'}</div>
                <div><span className="text-slate-400">Schedule:</span> {a.schedule || 'Unspecified'}</div>
                <div><span className="text-slate-400">Quality:</span> {a.data_quality_score}%</div>
              </div>
            </div>

            {/* Material B */}
            <div className="p-4 border border-slate-200 rounded-md bg-white space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div>
                  <span className="px-2 py-0.5 bg-brand-900 text-white rounded text-[11px] font-mono font-bold">
                    {b.cpse_code}
                  </span>
                  <span className="font-mono font-bold text-slate-800 ml-2">{b.material_code}</span>
                </div>
                <StatusBadge status={b.status} />
              </div>

              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Description</div>
                <div className="font-mono font-medium text-slate-800 mt-0.5">{b.original_description}</div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px]">
                <div><span className="text-slate-400">Category:</span> {b.category}</div>
                <div><span className="text-slate-400">Grade:</span> {b.grade || 'Unspecified'}</div>
                <div><span className="text-slate-400">Schedule:</span> {b.schedule || 'Unspecified'}</div>
                <div><span className="text-slate-400">Quality:</span> {b.data_quality_score}%</div>
              </div>
            </div>
          </div>

          {/* Explainable AI Attribute Comparison Breakdown */}
          <div className="border border-slate-200 rounded-md overflow-hidden bg-white">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              Explainable AI: Specification Comparison Matrix
            </div>

            <div className="p-4 space-y-3">
              <div>
                <h4 className="font-bold text-emerald-800 text-[11px] uppercase mb-1.5 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Matching Attributes ({match.matching_attributes.length})</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {match.matching_attributes.map((m, idx) => (
                    <span key={idx} className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded border border-emerald-200 text-xs">
                      <strong>{m.attribute}:</strong> {m.value}
                    </span>
                  ))}
                  {match.matching_attributes.length === 0 && (
                    <span className="text-slate-400 italic">No exact attributes matched</span>
                  )}
                </div>
              </div>

              {match.conflicting_attributes.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <h4 className="font-bold text-rose-800 text-[11px] uppercase mb-1.5 flex items-center space-x-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Conflicting Attributes ({match.conflicting_attributes.length})</span>
                  </h4>
                  <div className="space-y-1.5">
                    {match.conflicting_attributes.map((c, idx) => (
                      <div key={idx} className="p-2 bg-rose-50 text-rose-900 rounded border border-rose-200 flex justify-between">
                        <span className="font-semibold">{c.attribute}:</span>
                        <span className="font-mono">{c.value_a} vs {c.value_b}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* AI Explanation Text */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded text-slate-700 text-xs">
            <span className="font-bold text-slate-900 block mb-0.5">AI Recommendation Reason:</span>
            {match.explanation?.summary || 'Standard comparison summary'}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-50"
          >
            Close Comparison
          </button>

          <div className="flex items-center space-x-2">
            {onReject && (
              <button
                onClick={() => onReject(match.id)}
                className="px-3.5 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded hover:bg-rose-100 font-medium"
              >
                Reject Match
              </button>
            )}
            {onOverride && (
              <button
                onClick={() => onOverride(match.id)}
                className="px-3.5 py-1.5 bg-amber-50 text-amber-800 border border-amber-300 rounded hover:bg-amber-100 font-medium"
              >
                Override AI Decision
              </button>
            )}
            {onApprove && (
              <button
                onClick={() => onApprove(match.id)}
                className="px-4 py-1.5 bg-brand-900 text-white rounded font-medium hover:bg-brand-950"
              >
                Approve & Map to Proposed CNMC
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
