'use client';

import React, { useState } from 'react';
import {
  TrendingUp,
  Award,
  Sparkles,
  Users,
  Brain,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  GraduationCap
} from 'lucide-react';
import { Employee, PerformanceMetric, Task, AttendanceRecord } from '@/types';
import { callAI } from '@/lib/aiClient';

interface PerformanceViewProps {
  employees: Employee[];
  performance: PerformanceMetric[];
  tasks: Task[];
  attendance: AttendanceRecord[];
  onRefresh: () => void;
}

export default function PerformanceView({
  employees,
  performance,
  tasks,
  attendance,
  onRefresh
}: PerformanceViewProps) {
  const [selectedEmpId, setSelectedEmpId] = useState<string>(employees[0]?.id || '');
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');

  const selectedEmp = employees.find(e => e.id === selectedEmpId) || employees[0];

  // Calculate metrics dynamically
  const empTasks = tasks.filter(t => t.employeeId === selectedEmp?.id);
  const completedTasks = empTasks.filter(t => t.status === 'Completed').length;
  const taskCompletionPct = empTasks.length ? Math.round((completedTasks / empTasks.length) * 100) : selectedEmp?.performanceScore || 85;

  const empAttendance = attendance.filter(a => a.employeeId === selectedEmp?.id);
  const presentDays = empAttendance.filter(a => a.status === 'Present').length;
  const attendancePct = empAttendance.length ? Math.round((presentDays / empAttendance.length) * 100) : selectedEmp?.attendanceScore || 95;

  const qualityAvg = empTasks.length
    ? Math.round(empTasks.reduce((acc, t) => acc + (t.qualityScore || 90), 0) / empTasks.length)
    : 92;

  const communicationScore = selectedEmp?.warnings.length === 0 ? 94 : 75;
  const initiativeScore = selectedEmp?.performanceScore >= 90 ? 96 : 78;

  const overallScore = Math.round(
    taskCompletionPct * 0.3 + attendancePct * 0.2 + qualityAvg * 0.25 + communicationScore * 0.125 + initiativeScore * 0.125
  );

  const getRating = (score: number) => {
    if (score >= 93) return { label: 'Exceptional', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
    if (score >= 85) return { label: 'Exceeds Expectations', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' };
    if (score >= 75) return { label: 'Meets Expectations', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
    return { label: 'Needs Improvement', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' };
  };

  const rating = getRating(overallScore);

  const handleRunAIWorkforceAnalysis = async () => {
    setLoadingAI(true);
    setAiAnalysis('');
    try {
      const res = await callAI('performance-analysis', { employees, performance });
      setAiAnalysis(res);
    } catch (err: any) {
      setAiAnalysis('Failed to analyze performance: ' + err.message);
    } finally {
      setLoadingAI(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            Performance & Workforce Rating Engine
          </h2>
          <p className="text-xs text-slate-400">Automated multi-factor calculation & AI promotion recommendations</p>
        </div>

        <button
          onClick={handleRunAIWorkforceAnalysis}
          disabled={loadingAI}
          className="flex items-center gap-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl transition-all shadow-md shadow-indigo-600/20"
        >
          <Sparkles className="w-4 h-4 text-indigo-200" />
          {loadingAI ? 'Analyzing Workforce...' : 'Run Company AI Audit'}
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Employee Selector */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Select Employee
          </h3>

          <div className="space-y-2">
            {employees.map((emp) => (
              <div
                key={emp.id}
                onClick={() => { setSelectedEmpId(emp.id); setAiAnalysis(''); }}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                  selectedEmp?.id === emp.id
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <img src={emp.photo} alt={emp.name} className="w-9 h-9 rounded-full object-cover" />
                  <div>
                    <p className="text-xs font-bold">{emp.name}</p>
                    <p className="text-[10px] text-slate-400">{emp.position}</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {emp.performanceScore}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Calculated Metrics & Ratings (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {selectedEmp ? (
            <>
              {/* Overall Calculated Score Card */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950/70 via-slate-900 to-slate-900 border border-indigo-500/30 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
                <div className="flex items-center gap-5">
                  <div className="relative w-24 h-24 flex items-center justify-center rounded-full bg-indigo-600/20 border-4 border-indigo-500 shadow-xl shadow-indigo-500/20 shrink-0">
                    <span className="text-3xl font-extrabold text-white">{overallScore}</span>
                    <span className="text-[10px] text-indigo-300 block absolute bottom-2 font-mono">/ 100</span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">{selectedEmp.name}</h3>
                    <p className="text-xs text-slate-400">{selectedEmp.position} • {selectedEmp.department}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className={`text-xs font-extrabold px-3 py-1 rounded-full border ${rating.color}`}>
                        {rating.label}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-xs w-full md:w-auto">
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 text-slate-300">
                    <Lightbulb className="w-4 h-4 text-emerald-400" />
                    <span>Promotion: {overallScore >= 90 ? 'Recommended for Senior Lead' : 'Maintain Current Track'}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 text-slate-300">
                    <GraduationCap className="w-4 h-4 text-indigo-400" />
                    <span>Training: {overallScore >= 90 ? 'AI Architecture Mastery' : 'Execution Velocity Coaching'}</span>
                  </div>
                </div>
              </div>

              {/* Multi-Factor Calculation Breakdown */}
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white">Automated Factor Breakdown</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* Task Completion */}
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">1. Task Completion (30%)</span>
                      <span className="font-bold text-emerald-400">{taskCompletionPct}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${taskCompletionPct}%` }} />
                    </div>
                  </div>

                  {/* Attendance */}
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">2. Attendance Score (20%)</span>
                      <span className="font-bold text-indigo-400">{attendancePct}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${attendancePct}%` }} />
                    </div>
                  </div>

                  {/* Quality */}
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">3. Work Quality Score (25%)</span>
                      <span className="font-bold text-purple-400">{qualityAvg}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-purple-500 h-full rounded-full" style={{ width: `${qualityAvg}%` }} />
                    </div>
                  </div>

                  {/* Communication */}
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">4. Communication & Initiative (25%)</span>
                      <span className="font-bold text-amber-400">{communicationScore}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full" style={{ width: `${communicationScore}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-slate-500">No employee selected.</div>
          )}

          {/* Company Wide AI Analysis Card */}
          {aiAnalysis && (
            <div className="p-5 rounded-2xl bg-slate-900 border border-indigo-500/40 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Brain className="w-4 h-4 text-indigo-400" />
                Company Workforce Executive Report
              </h3>
              <div className="p-4 bg-slate-950 rounded-xl text-slate-200 text-xs whitespace-pre-wrap leading-relaxed border border-slate-800">
                {aiAnalysis}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
