import React from 'react';

interface Props {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<Props> = ({ status, size = 'sm' }) => {
  let colorClass = 'bg-slate-100 text-slate-700 border-slate-200';

  const s = (status || '').toUpperCase();

  if (s.includes('EXACT DUPLICATE')) {
    colorClass = 'bg-purple-50 text-purple-700 border-purple-200';
  } else if (s.includes('NEAR DUPLICATE')) {
    colorClass = 'bg-indigo-50 text-indigo-700 border-indigo-200';
  } else if (s.includes('FUNCTIONALLY EQUIVALENT')) {
    colorClass = 'bg-blue-50 text-blue-700 border-blue-200';
  } else if (s.includes('TECHNICAL REVIEW') || s.includes('TECHNICAL CONFLICT')) {
    colorClass = 'bg-amber-50 text-amber-800 border-amber-300 font-semibold';
  } else if (s.includes('APPROVED') || s.includes('MAPPED')) {
    colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (s.includes('ACTIVE')) {
    colorClass = 'bg-slate-50 text-slate-700 border-slate-300';
  } else if (s.includes('REJECTED') || s.includes('DEPRECATED') || s.includes('POOR') || s.includes('DATA QUALITY')) {
    colorClass = 'bg-rose-50 text-rose-700 border-rose-200';
  } else if (s.includes('RATIONALIZATION') || s.includes('UNDER REVIEW') || s.includes('PENDING')) {
    colorClass = 'bg-sky-50 text-sky-700 border-sky-200';
  }

  const px = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span className={`inline-flex items-center rounded border ${px} font-medium tracking-wide ${colorClass}`}>
      {status}
    </span>
  );
};
