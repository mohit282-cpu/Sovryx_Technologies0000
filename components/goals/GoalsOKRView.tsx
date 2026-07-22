'use client';

import React, { useState } from 'react';
import {
  Target,
  Plus,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  Building,
  User,
  Calendar,
  X
} from 'lucide-react';
import { GoalOKR, Employee, Project } from '@/types';
import { createItem, updateItem } from '@/lib/services/firestore';

interface GoalsOKRViewProps {
  goals: GoalOKR[];
  employees: Employee[];
  projects: Project[];
  onRefresh?: () => void;
}

export default function GoalsOKRView({
  goals,
  employees,
  projects,
  onRefresh
}: GoalsOKRViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ownerId, setOwnerId] = useState(employees[0]?.id || '');
  const [department, setDepartment] = useState('Engineering');
  const [targetDate, setTargetDate] = useState('2026-10-31');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Urgent'>('High');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle || !description) return;
    setIsSubmitting(true);
    try {
      const owner = employees.find(e => e.id === ownerId);
      await createItem('goals', {
        goal: goalTitle,
        description,
        ownerId: owner?.id || '',
        ownerName: owner?.name || 'Unassigned',
        department,
        targetDate,
        progress: 0,
        status: 'On Track',
        priority,
        aiRecommendation: 'AI recommendation engine initializing for new goal tracking...'
      });

      setGoalTitle('');
      setDescription('');
      setIsModalOpen(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to create goal:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateProgress = async (goalId: string, currentProgress: number) => {
    const newProg = Math.min(100, currentProgress + 10);
    const newStatus = newProg === 100 ? 'Achieved' : 'On Track';
    try {
      await updateItem('goals', goalId, { progress: newProg, status: newStatus });
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to update goal progress:', err);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider bg-indigo-500/10 text-indigo-400 px-2.5 py-0.5 rounded-full border border-indigo-500/20 font-bold">
            STRATEGIC ALIGNMENT
          </span>
          <h1 className="text-2xl font-extrabold text-white mt-1">Company Goals & OKRs</h1>
          <p className="text-xs text-slate-400">Objectives, key results, owner accountability, and AI progress suggestions.</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" /> Create New Goal / OKR
        </button>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {goals.map((g) => (
          <div key={g.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 hover:border-slate-700 transition-all flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                  g.priority === 'Urgent' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                  g.priority === 'High' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                  'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                }`}>
                  {g.priority} PRIORITY
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  g.status === 'Achieved' ? 'bg-emerald-500/20 text-emerald-300' :
                  g.status === 'At Risk' ? 'bg-rose-500/20 text-rose-300' : 'bg-indigo-500/20 text-indigo-300'
                }`}>
                  {g.status}
                </span>
              </div>

              <h3 className="text-base font-extrabold text-white">{g.goal}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{g.description}</p>

              <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-mono pt-2">
                <span className="flex items-center gap-1"><User className="w-3.5 h-3.5 text-indigo-400" /> {g.ownerName}</span>
                <span className="flex items-center gap-1"><Building className="w-3.5 h-3.5 text-purple-400" /> {g.department}</span>
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-emerald-400" /> Target: {g.targetDate}</span>
              </div>
            </div>

            {/* AI Recommendation Badge */}
            {g.aiRecommendation && (
              <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/20 text-xs text-indigo-200 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                <p><strong className="text-indigo-300">AI Advice:</strong> {g.aiRecommendation}</p>
              </div>
            )}

            {/* Progress Bar & Actions */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Progress Velocity</span>
                <span className="font-bold text-white font-mono">{g.progress}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full transition-all duration-300" style={{ width: `${g.progress}%` }} />
              </div>
              <div className="flex justify-end pt-1">
                <button
                  onClick={() => handleUpdateProgress(g.id, g.progress)}
                  disabled={g.progress >= 100}
                  className="text-[11px] font-bold px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 disabled:opacity-40"
                >
                  +10% Progress
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-400" /> Create Goal / OKR
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Goal Statement</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Achieve Sub-30ms Token Latency"
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Description & Key Deliverable</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Specific metrics to qualify completion..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Owner</label>
                  <select
                    value={ownerId}
                    onChange={(e) => setOwnerId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Target Date</label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
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
                  {isSubmitting ? 'Saving...' : 'Create Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
