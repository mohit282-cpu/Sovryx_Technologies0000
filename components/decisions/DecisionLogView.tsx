'use client';

import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  X
} from 'lucide-react';
import { CEODecision, Project } from '@/types';
import { createItem, updateItem } from '@/lib/services/firestore';

interface DecisionLogViewProps {
  decisions: CEODecision[];
  projects?: Project[];
  onRefresh?: () => void;
}

export default function DecisionLogView({
  decisions,
  projects = [],
  onRefresh
}: DecisionLogViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [decision, setDecision] = useState('');
  const [reason, setReason] = useState('');
  const [impact, setImpact] = useState('High');
  const [relatedProjectId, setRelatedProjectId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !decision) return;
    setIsSubmitting(true);
    try {
      const selectedPrj = projects.find(p => p.id === relatedProjectId);
      await createItem('decisions', {
        title,
        decision,
        reason,
        impact,
        relatedProjectId: selectedPrj?.id || '',
        relatedProjectName: selectedPrj?.name || '',
        date: new Date().toISOString().split('T')[0],
        status: 'Implemented'
      });

      setTitle('');
      setDecision('');
      setReason('');
      setIsModalOpen(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to log decision:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider bg-indigo-500/10 text-indigo-400 px-2.5 py-0.5 rounded-full border border-indigo-500/20 font-bold">
            GOVERNANCE & AUDIT
          </span>
          <h1 className="text-2xl font-extrabold text-white mt-1">CEO Decision Log</h1>
          <p className="text-xs text-slate-400">Formal log of executive decisions, strategic directives, and project impact records.</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" /> Log New CEO Decision
        </button>
      </div>

      <div className="space-y-3">
        {decisions.length === 0 ? (
          <div className="p-8 text-center bg-slate-900 rounded-2xl border border-slate-800 text-slate-500 text-xs italic">
            No executive decisions logged in Firestore yet.
          </div>
        ) : (
          decisions.map(d => (
            <div key={d.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 hover:border-slate-700 transition-all">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div>
                  <h3 className="text-base font-extrabold text-white">{d.title}</h3>
                  <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono mt-0.5">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-indigo-400" /> {d.date}</span>
                    {d.relatedProjectName && <span>Project: {d.relatedProjectName}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    Impact: {d.impact}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {d.status}
                  </span>
                </div>
              </div>

              <div className="space-y-1 text-xs text-slate-300">
                <p><strong className="text-white">Decision Directive:</strong> {d.decision}</p>
                {d.reason && <p><strong className="text-slate-400">Strategic Rationale:</strong> {d.reason}</p>}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" /> Log CEO Decision
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDecision} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Decision Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Approved INT8 Model Quantization"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Decision Directive</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Explicit directive or policy..."
                  value={decision}
                  onChange={(e) => setDecision(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Strategic Rationale</label>
                <input
                  type="text"
                  placeholder="Why this action was chosen..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Related Project</label>
                  <select
                    value={relatedProjectId}
                    onChange={(e) => setRelatedProjectId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="">None / Global</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Impact Level</label>
                  <select
                    value={impact}
                    onChange={(e) => setImpact(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="Critical">Critical Enterprise Impact</option>
                    <option value="High">High Strategic Impact</option>
                    <option value="Medium">Medium Operational</option>
                    <option value="Low">Minor Adjustment</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30"
                >
                  {isSubmitting ? 'Saving...' : 'Save Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
