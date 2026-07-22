'use client';

import React from 'react';
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
  Target
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
import { Employee, Project, Task, AttendanceRecord, NotificationItem } from '@/types';

interface DashboardViewProps {
  employees: Employee[];
  projects: Project[];
  tasks: Task[];
  attendance: AttendanceRecord[];
  notifications: NotificationItem[];
  onSelectModule: (module: string) => void;
  onOpenAIAssistant: () => void;
}

export default function DashboardView({
  employees,
  projects,
  tasks,
  attendance,
  notifications,
  onSelectModule,
  onOpenAIAssistant
}: DashboardViewProps) {
  // Calculations
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(e => e.status === 'Active').length;

  const totalProjects = projects.length;
  const atRiskProjects = projects.filter(p => p.status === 'At Risk');

  const totalTasks = tasks.length;
  const pendingTasks = tasks.filter(t => t.status !== 'Completed').length;
  const completedTasks = tasks.filter(t => t.status === 'Completed').length;
  const taskCompletionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const presentToday = attendance.filter(a => a.status === 'Present' || a.status === 'Late').length;

  // Top performers & Needs attention
  const sortedEmployees = [...employees].sort((a, b) => b.performanceScore - a.performanceScore);
  const topPerformer = sortedEmployees[0];
  const needsAttention = sortedEmployees.filter(e => e.performanceScore < 80 || e.warnings.length > 0);

  // Mock productivity chart data
  const productivityData = [
    { day: 'Mon', completed: 12, efficiency: 88 },
    { day: 'Tue', completed: 18, efficiency: 94 },
    { day: 'Wed', completed: 15, efficiency: 91 },
    { day: 'Thu', completed: 22, efficiency: 97 },
    { day: 'Fri', completed: 19, efficiency: 93 },
    { day: 'Sat', completed: 8, efficiency: 85 },
    { day: 'Sun', completed: 5, efficiency: 80 }
  ];

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

      {/* Top CEO Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Employees */}
        <div
          onClick={() => onSelectModule('employees')}
          className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 hover:border-indigo-500/50 cursor-pointer transition-all shadow-lg group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Workforce</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-white">{totalEmployees}</span>
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
              {activeEmployees} Active
            </span>
          </div>
          <div className="mt-2 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-indigo-500 h-full rounded-full"
              style={{ width: `${totalEmployees ? (activeEmployees / totalEmployees) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Active Projects */}
        <div
          onClick={() => onSelectModule('projects')}
          className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 hover:border-emerald-500/50 cursor-pointer transition-all shadow-lg group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Company Projects</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition-transform">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-white">{totalProjects}</span>
            <span className={`text-xs font-semibold ${atRiskProjects.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {atRiskProjects.length > 0 ? `${atRiskProjects.length} At Risk` : 'All Healthy'}
            </span>
          </div>
          <div className="mt-2 text-[10px] text-slate-400">
            Total active client budget under delivery
          </div>
        </div>

        {/* Metric 3: Tasks Completion */}
        <div
          onClick={() => onSelectModule('tasks')}
          className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 hover:border-purple-500/50 cursor-pointer transition-all shadow-lg group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Task Velocity</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 group-hover:scale-110 transition-transform">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-white">{taskCompletionRate}%</span>
            <span className="text-xs font-medium text-slate-400">
              {completedTasks}/{totalTasks} Done
            </span>
          </div>
          <div className="mt-2 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-purple-500 h-full rounded-full"
              style={{ width: `${taskCompletionRate}%` }}
            />
          </div>
        </div>

        {/* Metric 4: Today's Attendance */}
        <div
          onClick={() => onSelectModule('attendance')}
          className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 hover:border-amber-500/50 cursor-pointer transition-all shadow-lg group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Today&apos;s Shift</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-white">{presentToday}/{totalEmployees || 1}</span>
            <span className="text-xs font-semibold text-emerald-400">Present</span>
          </div>
          <div className="mt-2 text-[10px] text-slate-400">
            Workforce clock-in logs verified
          </div>
        </div>
      </div>

      {/* Main Charts & Rankings Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Productivity Analytics (2 cols) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-400" />
                Weekly Output & Productivity Trends
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Real-time task output vs company efficiency</p>
            </div>
            <button
              onClick={() => onSelectModule('reports')}
              className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              Full Report <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={productivityData}>
                <defs>
                  <linearGradient id="colorDiff" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="efficiency" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorDiff)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CEO Quick Actions & Spotlight */}
        <div className="space-y-4">
          {/* Top Performer Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-500/30">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-indigo-400 flex items-center gap-1">
                <Award className="w-3.5 h-3.5" /> Top Performer
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400">
                {topPerformer ? `${topPerformer.performanceScore}% Score` : 'N/A'}
              </span>
            </div>
            {topPerformer ? (
              <div className="mt-3 flex items-center gap-3">
                <img
                  src={topPerformer.photo || 'https://picsum.photos/seed/avatar/200/200'}
                  alt={topPerformer.name}
                  className="w-12 h-12 rounded-full border-2 border-indigo-500/50 object-cover"
                />
                <div>
                  <h4 className="text-sm font-bold text-white">{topPerformer.name}</h4>
                  <p className="text-xs text-slate-400">{topPerformer.position}</p>
                  <p className="text-[10px] text-emerald-400 mt-0.5">Recommended for promotion</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 mt-2">No employee data logged yet.</p>
            )}
          </div>

          {/* Quick Actions Panel */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Executive Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => onSelectModule('employees')}
                className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800/80 flex items-center gap-2 transition-colors text-left"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-400" />
                <span>Add Employee</span>
              </button>
              <button
                onClick={() => onSelectModule('projects')}
                className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800/80 flex items-center gap-2 transition-colors text-left"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                <span>New Project</span>
              </button>
              <button
                onClick={() => onSelectModule('tasks')}
                className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800/80 flex items-center gap-2 transition-colors text-left"
              >
                <CheckSquare className="w-3.5 h-3.5 text-purple-400" />
                <span>Create Task</span>
              </button>
              <button
                onClick={() => onSelectModule('reports')}
                className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800/80 flex items-center gap-2 transition-colors text-left"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Daily Brief</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Needs Attention & Recent Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Needs Attention Card */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Employees Needing Attention
            </h3>
            <span className="text-xs text-slate-400">{needsAttention.length} flagged</span>
          </div>

          <div className="space-y-2">
            {needsAttention.length > 0 ? (
              needsAttention.map((emp) => (
                <div
                  key={emp.id}
                  onClick={() => onSelectModule('performance')}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-amber-500/40 cursor-pointer flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={emp.photo || 'https://picsum.photos/seed/avatar/200/200'}
                      alt={emp.name}
                      className="w-9 h-9 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-200">{emp.name}</p>
                      <p className="text-[10px] text-slate-400">{emp.position}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-rose-400 block">{emp.performanceScore}% Score</span>
                    {emp.warnings.length > 0 && (
                      <span className="text-[10px] text-amber-400 font-medium">
                        {emp.warnings.length} Warning(s)
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">
                All employee performance metrics meet CEO standards.
              </p>
            )}
          </div>
        </div>

        {/* Live Company Activity Stream */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Company Command Activity Feed
            </h3>
            <button
              onClick={() => onSelectModule('notifications')}
              className="text-xs text-slate-400 hover:text-white"
            >
              View All
            </button>
          </div>

          <div className="space-y-2">
            {notifications.slice(0, 4).map((n) => (
              <div
                key={n.id}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start gap-3"
              >
                <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                  n.severity === 'urgent' ? 'bg-rose-500/10 text-rose-400' : 'bg-indigo-500/10 text-indigo-400'
                }`}>
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-200">{n.title}</p>
                    <span className="text-[10px] text-slate-500">{n.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{n.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
