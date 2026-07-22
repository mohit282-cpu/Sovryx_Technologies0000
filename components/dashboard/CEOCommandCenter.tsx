'use client';

import React, { useState } from 'react';
import {
  Users,
  Briefcase,
  CheckSquare,
  TrendingUp,
  AlertTriangle,
  Award,
  Sparkles,
  Plus,
  ArrowUpRight,
  Clock,
  ShieldAlert,
  Calendar as CalendarIcon,
  Activity,
  CheckCircle2,
  ChevronRight,
  Zap,
  Target,
  DollarSign,
  FileText,
  UserCheck,
  UserX,
  MessageSquare,
  PlusCircle,
  BarChart3,
  Flame,
  Brain,
  X,
  Check
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar
} from 'recharts';
import {
  Employee,
  Project,
  Task,
  AttendanceRecord,
  NotificationItem,
  Meeting,
  CEODecision,
  LeaveRequest,
  CompanyHealthData
} from '@/types';
import { createItem } from '@/lib/services/firestore';
import { adToBs, getCurrentFiscalYearBS, formatNPR } from '@/lib/nepaliCalendar';
import EmptyState from '@/components/ui/EmptyState';

interface CEOCommandCenterProps {
  employees: Employee[];
  projects: Project[];
  tasks: Task[];
  attendance: AttendanceRecord[];
  notifications: NotificationItem[];
  meetings?: Meeting[];
  decisions?: CEODecision[];
  leaveRequests?: LeaveRequest[];
  healthData?: CompanyHealthData;
  onSelectModule: (module: string) => void;
  onOpenAIAssistant: () => void;
  onRefresh?: () => void;
}

export default function CEOCommandCenter({
  employees,
  projects,
  tasks,
  attendance,
  notifications,
  meetings = [],
  decisions = [],
  leaveRequests = [],
  healthData,
  onSelectModule,
  onOpenAIAssistant,
  onRefresh
}: CEOCommandCenterProps) {
  // AI Daily Briefing state
  const [briefing, setBriefing] = useState<string | null>(null);
  const [loadingBriefing, setLoadingBriefing] = useState(false);

  // Quick Action Modal states
  const [activeModal, setActiveModal] = useState<'decision' | 'announcement' | 'project' | null>(null);
  const [decisionTitle, setDecisionTitle] = useState('');
  const [decisionText, setDecisionText] = useState('');
  const [decisionImpact, setDecisionImpact] = useState('High');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculations
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(e => e.status === 'Active').length;
  const leaveEmployees = employees.filter(e => e.status === 'On Leave').length;
  const onlineEmployees = attendance.filter(a => a.status === 'Present' || a.status === 'Late').length;

  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === 'In Progress' || p.status === 'Planning').length;
  const atRiskProjects = projects.filter(p => p.status === 'At Risk');

  const todayStr = new Date().toISOString().split('T')[0];
  const todayBS = adToBs(todayStr);
  const fiscalYearBS = getCurrentFiscalYearBS(todayStr);
  const tasksDueToday = tasks.filter(t => t.deadline === todayStr && t.status !== 'Completed').length;
  const overdueTasks = tasks.filter(t => t.deadline < todayStr && t.status !== 'Completed').length;

  const totalBudget = projects.reduce((acc, p) => acc + (p.budget || 0), 0);
  const totalSpent = projects.reduce((acc, p) => acc + (p.spentBudget || 0), 0);
  const totalRevenueEst = Math.round(totalBudget * 1.35);

  // Health Score Calculation (0-100)
  const avgPerf = employees.length ? Math.round(employees.reduce((acc, e) => acc + (e.performanceScore || 0), 0) / employees.length) : 85;
  const avgAtt = employees.length ? Math.round(employees.reduce((acc, e) => acc + (e.attendanceScore || 0), 0) / employees.length) : 90;
  const completedTasksRatio = tasks.length ? Math.round((tasks.filter(t => t.status === 'Completed').length / tasks.length) * 100) : 80;
  
  const rawHealthScore = healthData?.score || Math.min(100, Math.max(0, Math.round(
    (avgPerf * 0.35) + (avgAtt * 0.25) + (completedTasksRatio * 0.25) - (atRiskProjects.length * 10) - (overdueTasks * 2)
  )));

  const getHealthStatus = (score: number) => {
    if (score >= 90) return { label: 'Excellent', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
    if (score >= 75) return { label: 'Good', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' };
    if (score >= 60) return { label: 'Average', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
    if (score >= 45) return { label: 'Poor', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' };
    return { label: 'Critical', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' };
  };

  const healthBadge = getHealthStatus(rawHealthScore);

  // Top & Lowest Performers
  const sortedEmps = [...employees].sort((a, b) => (b.performanceScore || 0) - (a.performanceScore || 0));
  const topPerformer = sortedEmps[0];
  const lowestPerformer = sortedEmps[sortedEmps.length - 1];

  // Employees needing attention
  const needsAttention = employees.filter(
    e => (e.performanceScore < 80) || (e.warnings && e.warnings.length > 0) || (e.status === 'On Leave')
  );

  // Chart Data
  const productivityTrend = [
    { name: 'W1', productivity: 82, target: 85 },
    { name: 'W2', productivity: 88, target: 85 },
    { name: 'W3', productivity: 91, target: 90 },
    { name: 'W4', productivity: rawHealthScore, target: 90 }
  ];

  // Generate Daily Briefing
  const handleGenerateBriefing = async () => {
    setLoadingBriefing(true);
    try {
      const res = await fetch('/api/ai/daily-briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          healthScore: rawHealthScore,
          activeEmployees,
          onlineEmployees,
          atRiskProjectsCount: atRiskProjects.length,
          overdueTasksCount: overdueTasks,
          topPerformerName: topPerformer?.name,
          needsAttentionCount: needsAttention.length,
          totalRevenueEst
        })
      });
      const data = await res.json();
      if (data.text) {
        setBriefing(data.text);
      }
    } catch (err) {
      console.error('Error generating briefing:', err);
    } finally {
      setLoadingBriefing(false);
    }
  };

  // Submit Decision Quick Action
  const handleLogDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decisionTitle || !decisionText) return;
    setIsSubmitting(true);
    try {
      await createItem('decisions', {
        title: decisionTitle,
        decision: decisionText,
        reason: 'Direct CEO Command Center Action',
        impact: decisionImpact,
        date: new Date().toISOString().split('T')[0],
        status: 'Implemented'
      });
      setDecisionTitle('');
      setDecisionText('');
      setActiveModal(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to log decision:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* CEO Executive Alert Banner if Projects At Risk */}
      {atRiskProjects.length > 0 && (
        <div id="banner-risk-alert" className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/80 via-slate-900 to-slate-900 border border-rose-800/80 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-rose-200 flex items-center gap-2">
                CRITICAL PROJECT RISK DETECTED
                <span className="text-[10px] bg-rose-500/20 text-rose-300 font-mono px-2 py-0.5 rounded-full border border-rose-500/30">
                  {atRiskProjects.length} AT RISK
                </span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                {atRiskProjects[0]?.name}: {atRiskProjects[0]?.riskReason || 'Timeline bottleneck requiring CEO intervention.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end md:self-auto">
            <button
              onClick={() => onSelectModule('projects')}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition-colors"
            >
              Inspect Projects
            </button>
            <button
              onClick={onOpenAIAssistant}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Ask AI Risk Plan
            </button>
          </div>
        </div>
      )}

      {/* CEO Command Center Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 p-6 rounded-2xl border border-indigo-500/20 shadow-2xl">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold">
              SOVEREIGN CEO COMMAND CENTER
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold flex items-center gap-1">
              <CalendarIcon className="w-3 h-3" />
              BS: {todayBS.formatted} ({todayBS.strBS}) • FY {fiscalYearBS}
            </span>
            <span className="text-xs text-slate-500 font-mono">Live Stream</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Company Operating Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time execution telemetry, AI executive insights, and direct command tools.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerateBriefing}
            disabled={loadingBriefing}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-spin-slow" />
            {loadingBriefing ? 'Generating Briefing...' : 'Run Daily CEO Briefing'}
          </button>
          <button
            onClick={() => setActiveModal('decision')}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-2 transition-all"
          >
            <PlusCircle className="w-4 h-4 text-emerald-400" />
            Log Decision
          </button>
        </div>
      </div>

      {/* Top Telemetry Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Company Health Score Card */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">Company Health Score</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${healthBadge.color}`}>
              {healthBadge.label}
            </span>
          </div>
          <div className="flex items-baseline gap-2 my-1">
            <span className="text-3xl font-black text-white tracking-tight">{rawHealthScore}</span>
            <span className="text-xs text-slate-400 font-mono">/ 100</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                rawHealthScore >= 80 ? 'bg-emerald-500' : rawHealthScore >= 60 ? 'bg-amber-500' : 'bg-rose-500'
              }`}
              style={{ width: `${rawHealthScore}%` }}
            />
          </div>
        </div>

        {/* Workforce Status */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-slate-400">Workforce Status</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{activeEmployees}</span>
            <span className="text-xs text-slate-400">Active</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2 font-mono">
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              {onlineEmployees} Online
            </span>
            <span className="flex items-center gap-1 text-amber-400">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              {leaveEmployees} Leave
            </span>
          </div>
        </div>

        {/* Active Projects & Risk */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-slate-400">Active Projects</span>
            <Briefcase className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{activeProjects}</span>
            <span className="text-xs text-slate-400">In Execution</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] mt-2 font-mono">
            {atRiskProjects.length > 0 ? (
              <span className="text-rose-400 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {atRiskProjects.length} At Risk
              </span>
            ) : (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> 100% Healthy
              </span>
            )}
          </div>
        </div>

        {/* Tasks & Revenue Overview */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-slate-400">Revenue Est. / Spent</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-emerald-400">${(totalRevenueEst / 1000).toFixed(0)}k</span>
            <span className="text-[10px] text-slate-400">EST</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 font-mono">
            <span>Spent: ${(totalSpent / 1000).toFixed(0)}k</span>
            <span className="text-amber-400">{overdueTasks} Overdue Tasks</span>
          </div>
        </div>
      </div>

      {/* AI Daily CEO Briefing Box */}
      {briefing && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-indigo-500/30 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">Gemini 3.6 Daily CEO Executive Briefing</h3>
            </div>
            <button
              onClick={() => setBriefing(null)}
              className="text-slate-400 hover:text-slate-200 text-xs"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-line font-sans">
            {briefing}
          </div>
        </div>
      )}

      {/* Middle Grid: Top/Lowest Performers & Attention Required */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top & Lowest Performer Highlight */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" /> Top & Lowest Performers
            </h3>
            <button
              onClick={() => onSelectModule('performance')}
              className="text-[11px] text-indigo-400 hover:underline"
            >
              Full Reviews
            </button>
          </div>

          {topPerformer ? (
            <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={topPerformer.photo || 'https://picsum.photos/seed/user/100/100'}
                  alt={topPerformer.name}
                  className="w-10 h-10 rounded-full object-cover border border-emerald-500/40"
                />
                <div>
                  <p className="text-xs font-bold text-white flex items-center gap-1.5">
                    {topPerformer.name}
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono">
                      TOP 1
                    </span>
                  </p>
                  <p className="text-[10px] text-slate-400">{topPerformer.position}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-emerald-400">{topPerformer.performanceScore}%</p>
                <p className="text-[9px] text-slate-500 font-mono">Performance</p>
              </div>
            </div>
          ) : (
            <EmptyState
              compact
              icon={Award}
              title="No Top Performer Yet"
              description="Onboard team members to calculate performance scores and highlight top talent."
              actionLabel="Add Employee"
              onAction={() => onSelectModule('employees')}
            />
          )}

          {lowestPerformer && lowestPerformer.id !== topPerformer?.id && (
            <div className="p-3.5 rounded-xl bg-slate-950 border border-rose-500/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={lowestPerformer.photo || 'https://picsum.photos/seed/user2/100/100'}
                  alt={lowestPerformer.name}
                  className="w-10 h-10 rounded-full object-cover border border-rose-500/40"
                />
                <div>
                  <p className="text-xs font-bold text-white flex items-center gap-1.5">
                    {lowestPerformer.name}
                    <span className="text-[9px] bg-rose-500/20 text-rose-300 px-1.5 py-0.2 rounded font-mono">
                      COACHING
                    </span>
                  </p>
                  <p className="text-[10px] text-slate-400">{lowestPerformer.position}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-rose-400">{lowestPerformer.performanceScore}%</p>
                <p className="text-[9px] text-slate-500 font-mono">Performance</p>
              </div>
            </div>
          )}
        </div>

        {/* Employees Needing CEO Attention */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" /> Employees Needing Attention
            </h3>
            <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              {needsAttention.length} Flagged
            </span>
          </div>

          <div className="space-y-2 max-h-52 overflow-y-auto custom-scrollbar">
            {needsAttention.length === 0 ? (
              <EmptyState
                compact
                icon={CheckCircle2}
                title="Zero Workforce Anomalies"
                description="All employee performance & attendance metrics are in compliance."
              />
            ) : (
              needsAttention.map(emp => (
                <div key={emp.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-200">{emp.name}</p>
                    <p className="text-[10px] text-amber-400 font-mono">
                      {emp.performanceScore < 80 ? `Low Score: ${emp.performanceScore}%` : emp.warnings?.length ? `${emp.warnings.length} Active Warning` : 'On Leave'}
                    </p>
                  </div>
                  <button
                    onClick={() => onSelectModule('employees')}
                    className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                  >
                    View
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Productivity Trend Chart */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" /> Velocity Trend
            </h3>
            <span className="text-[10px] font-mono text-emerald-400">+6.4% YoY</span>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={productivityTrend}>
                <defs>
                  <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} domain={[60, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
                />
                <Area type="monotone" dataKey="productivity" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorProd)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Decision Log & Upcoming Meetings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Decision Log Feed */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" /> Recent CEO Decisions
            </h3>
            <button
              onClick={() => onSelectModule('decisions')}
              className="text-[11px] text-indigo-400 hover:underline"
            >
              Full Decision Log
            </button>
          </div>

          <div className="space-y-2.5 max-h-60 overflow-y-auto custom-scrollbar">
            {decisions.length === 0 ? (
              <EmptyState
                compact
                icon={FileText}
                title="No CEO Decisions Logged"
                description="Log corporate directives, policy changes, and executive actions."
                actionLabel="Log Decision"
                onAction={() => setActiveModal('decision')}
              />
            ) : (
              decisions.map(dec => (
                <div key={dec.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-white">{dec.title}</p>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      {dec.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 line-clamp-2">{dec.decision}</p>
                  <p className="text-[10px] text-slate-500 font-mono">{dec.date} • Impact: {dec.impact}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Meetings Sync */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-emerald-400" /> CEO Executive Meetings
            </h3>
            <button
              onClick={() => onSelectModule('meetings')}
              className="text-[11px] text-indigo-400 hover:underline"
            >
              Schedule Meeting
            </button>
          </div>

          <div className="space-y-2.5 max-h-60 overflow-y-auto custom-scrollbar">
            {meetings.length === 0 ? (
              <EmptyState
                compact
                icon={CalendarIcon}
                title="No Meetings Scheduled"
                description="Schedule team syncs, client reviews, or executive briefings."
                actionLabel="Schedule Sync"
                onAction={() => onSelectModule('meetings')}
              />
            ) : (
              meetings.map(m => (
                <div key={m.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-200">{m.title}</p>
                    <p className="text-[10px] text-slate-400">{m.time} ({m.durationMinutes} mins)</p>
                  </div>
                  <button
                    onClick={() => onSelectModule('meetings')}
                    className="text-[10px] px-2 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700"
                  >
                    View Agenda
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Action Decision Modal */}
      {activeModal === 'decision' && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" /> Log CEO Decision
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleLogDecision} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Decision Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Authorized INT8 Quantization"
                  value={decisionTitle}
                  onChange={(e) => setDecisionTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Decision Details</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Rationale and explicit directive..."
                  value={decisionText}
                  onChange={(e) => setDecisionText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Expected Impact</label>
                <select
                  value={decisionImpact}
                  onChange={(e) => setDecisionImpact(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Critical">Critical Enterprise Impact</option>
                  <option value="High">High Strategic Impact</option>
                  <option value="Medium">Medium Operational Impact</option>
                  <option value="Low">Minor / Standard Policy</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30"
                >
                  {isSubmitting ? 'Logging...' : 'Save Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
