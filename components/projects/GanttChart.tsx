'use client';

import React from 'react';
import { Project, Task } from '@/types';
import { Calendar, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface GanttChartProps {
  projects: Project[];
  tasks?: Task[];
}

export default function GanttChart({ projects, tasks = [] }: GanttChartProps) {
  return (
    <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-400" /> Project Execution Timeline & Gantt Chart
        </h3>
        <span className="text-[10px] font-mono text-slate-400">2026 Timeline Projection</span>
      </div>

      <div className="space-y-4">
        {projects.map((p) => (
          <div key={p.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white">{p.name}</span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
                  p.status === 'At Risk' ? 'bg-rose-500/20 text-rose-300' : 'bg-indigo-500/20 text-indigo-300'
                }`}>
                  {p.status}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {p.startDate} → {p.deadline} ({p.progress}%)
              </span>
            </div>

            {/* Timeline Progress Bar */}
            <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden relative">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  p.status === 'At Risk' ? 'bg-rose-500' : 'bg-gradient-to-r from-indigo-500 to-purple-600'
                }`}
                style={{ width: `${Math.max(5, p.progress)}%` }}
              />
            </div>

            {/* Tasks under project */}
            {tasks.filter(t => t.projectId === p.id).length > 0 && (
              <div className="pt-2 space-y-1">
                {tasks.filter(t => t.projectId === p.id).map(t => (
                  <div key={t.id} className="flex items-center justify-between text-[11px] text-slate-400 pl-3 border-l-2 border-slate-800">
                    <span className="truncate max-w-[200px]">{t.title}</span>
                    <span className="font-mono text-[10px]">{t.deadline} ({t.completionPercentage}%)</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
