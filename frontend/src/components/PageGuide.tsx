import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';

interface PageGuideProps {
  title: string;
  whatItDoes?: string;
  dataShown?: string;
  whyItMatters?: string;
  actions?: string;
  summary?: string;
  steps?: string[];
}

export const PageGuide: React.FC<PageGuideProps> = ({
  title,
  whatItDoes,
  dataShown,
  whyItMatters,
  actions,
  summary,
  steps
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mb-4 bg-white border border-slate-200 rounded-md overflow-hidden text-xs">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 bg-slate-50 flex items-center justify-between text-slate-700 hover:bg-slate-100 transition-colors"
      >
        <div className="flex items-center space-x-2">
          <HelpCircle className="w-3.5 h-3.5 text-brand-600" />
          <span className="font-semibold text-slate-800">Page Guide & Evaluator Context: {title}</span>
        </div>
        <div className="flex items-center space-x-1 text-slate-500">
          <span>{isOpen ? 'Collapse' : 'Explain this screen'}</span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-3.5 bg-white border-t border-slate-100">
          {summary && (
            <div className="mb-3 text-slate-700 leading-relaxed font-medium">
              {summary}
            </div>
          )}

          {steps && steps.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {steps.map((step, idx) => (
                <div key={idx} className="flex items-start space-x-2 p-2 bg-slate-50 rounded border border-slate-200">
                  <CheckCircle className="w-3.5 h-3.5 text-brand-600 shrink-0 mt-0.5" />
                  <span className="text-[11px] text-slate-700 leading-snug">{step}</span>
                </div>
              ))}
            </div>
          )}

          {whatItDoes && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <span className="font-semibold text-brand-900 block mb-0.5">What this page does:</span>
                <p className="text-slate-600 leading-relaxed">{whatItDoes}</p>
              </div>
              <div>
                <span className="font-semibold text-brand-900 block mb-0.5">What data is shown:</span>
                <p className="text-slate-600 leading-relaxed">{dataShown}</p>
              </div>
              <div>
                <span className="font-semibold text-brand-900 block mb-0.5">Why it matters:</span>
                <p className="text-slate-600 leading-relaxed">{whyItMatters}</p>
              </div>
              <div>
                <span className="font-semibold text-brand-900 block mb-0.5">Actions you can perform:</span>
                <p className="text-slate-600 leading-relaxed">{actions}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
