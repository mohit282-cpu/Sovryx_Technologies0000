'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  compact?: boolean;
  badge?: string;
  className?: string;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  compact = false,
  badge,
  className = ''
}: EmptyStateProps) {
  if (compact) {
    return (
      <div className={`p-4 rounded-xl bg-slate-950/60 border border-dashed border-slate-800/80 flex flex-col items-center justify-center text-center space-y-2 py-6 ${className}`}>
        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400">
          <Icon className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-slate-300">{title}</h4>
          <p className="text-[11px] text-slate-500 max-w-xs mt-0.5 leading-snug">{description}</p>
        </div>
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="mt-1 text-[11px] font-semibold px-3 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition-colors"
          >
            {actionLabel}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`w-full p-8 rounded-2xl bg-slate-900/50 border border-dashed border-slate-800/80 flex flex-col items-center justify-center text-center space-y-3.5 my-2 ${className}`}>
      <div className="relative">
        <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shadow-lg shadow-indigo-500/5">
          <Icon className="w-8 h-8" />
        </div>
        {badge && (
          <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-[9px] font-bold font-mono bg-indigo-600 text-white shadow">
            {badge}
          </span>
        )}
      </div>
      <div className="max-w-md space-y-1">
        <h3 className="text-sm font-bold text-slate-200">{title}</h3>
        <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
      </div>
      {(actionLabel || secondaryActionLabel) && (
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          {actionLabel && onAction && (
            <button
              onClick={onAction}
              className="text-xs font-bold px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/20"
            >
              {actionLabel}
            </button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <button
              onClick={onSecondaryAction}
              className="text-xs font-semibold px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            >
              {secondaryActionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
