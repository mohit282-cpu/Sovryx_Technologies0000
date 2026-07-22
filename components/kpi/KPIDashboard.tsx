'use client';

import React from 'react';
import {
  BarChart3,
  TrendingUp,
  Award,
  Users,
  CheckCircle2,
  Clock,
  Briefcase,
  Target,
  Sparkles,
  Zap,
  Star
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { Employee, Project, Task, AttendanceRecord, PerformanceMetric } from '@/types';

interface KPIDashboardProps {
  employees: Employee[];
  projects: Project[];
  tasks: Task[];
  attendance: AttendanceRecord[];
  performance?: PerformanceMetric[];
}

export default function KPIDashboard({
  employees,
  projects,
  tasks,
  attendance,
  performance = []
}: KPIDashboardProps) {
  // Chart Data calculations
  const employeeProductivityData = employees.map(emp => ({
    name: emp.name.split(' ')[0],
    performance: emp.performanceScore || 80,
    attendance: emp.attendanceScore || 85
  }));

  const attendanceDistribution = [
    { name: 'Present', value: attendance.filter(a => a.status === 'Present').length || 4, color: '#10b981' },
    { name: 'Late', value: attendance.filter(a => a.status === 'Late').length || 1, color: '#f59e0b' },
    { name: 'On Leave', value: attendance.filter(a => a.status === 'On Leave').length || 0, color: '#6366f1' },
    { name: 'Absent', value: attendance.filter(a => a.status === 'Absent').length || 0, color: '#f43f5e' }
  ];

  const projectStatusData = [
    { name: 'Completed', count: projects.filter(p => p.status === 'Completed').length },
    { name: 'In Progress', count: projects.filter(p => p.status === 'In Progress').length },
    { name: 'Planning', count: projects.filter(p => p.status === 'Planning').length },
    { name: 'At Risk', count: projects.filter(p => p.status === 'At Risk').length }
  ];

  const radarData = [
    { metric: 'Productivity', value: Math.round(employees.reduce((acc, e) => acc + e.performanceScore, 0) / (employees.length || 1)) },
    { metric: 'Attendance', value: Math.round(employees.reduce((acc, e) => acc + e.attendanceScore, 0) / (employees.length || 1)) },
    { metric: 'Task Completion', value: tasks.length ? Math.round((tasks.filter(t => t.status === 'Completed').length / tasks.length) * 100) : 80 },
    { metric: 'Project Velocity', value: projects.length ? Math.round(projects.reduce((acc, p) => acc + p.progress, 0) / projects.length) : 75 },
    { metric: 'Quality Score', value: 92 }
  ];

  const monthlyGrowthData = [
    { month: 'Jan', revenue: 120, productivity: 80 },
    { month: 'Feb', revenue: 150, productivity: 84 },
    { month: 'Mar', revenue: 180, productivity: 86 },
    { month: 'Apr', revenue: 210, productivity: 89 },
    { month: 'May', revenue: 250, productivity: 91 },
    { month: 'Jun', revenue: 310, productivity: 94 }
  ];

  const sortedLeaderboard = [...employees].sort((a, b) => (b.performanceScore || 0) - (a.performanceScore || 0));

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider bg-indigo-500/10 text-indigo-400 px-2.5 py-0.5 rounded-full border border-indigo-500/20 font-bold">
            ANALYTICS ENGINE
          </span>
          <h1 className="text-2xl font-extrabold text-white mt-1">Enterprise KPI Dashboard</h1>
          <p className="text-xs text-slate-400">Quantitative metrics, workforce efficiency radar, and performance leaderboards.</p>
        </div>
      </div>

      {/* Grid 1: Productivity Bar & Attendance Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-400" /> Employee Performance vs Attendance
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={employeeProductivityData}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }} />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                <Bar dataKey="performance" fill="#6366f1" radius={[6, 6, 0, 0]} name="Performance Score" />
                <Bar dataKey="attendance" fill="#10b981" radius={[6, 6, 0, 0]} name="Attendance Score" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" /> Today&apos;s Attendance Distribution
          </h3>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={attendanceDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {attendanceDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }} />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Grid 2: Operational Health Radar & Monthly Growth Line */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Target className="w-4 h-4 text-amber-400" /> Executive Competency Radar
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="metric" stroke="#94a3b8" fontSize={11} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" />
                <Radar name="Sovryx Competency" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" /> Revenue & Productivity Velocity
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyGrowthData}>
                <XAxis dataKey="month" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }} />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Est. Revenue ($k)" />
                <Line type="monotone" dataKey="productivity" stroke="#6366f1" strokeWidth={2} name="Productivity Score" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-400" /> Workforce Leaderboard & Performance Ranking
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-mono text-slate-400 uppercase">
                <th className="py-2.5 px-3">Rank</th>
                <th className="py-2.5 px-3">Employee</th>
                <th className="py-2.5 px-3">Department</th>
                <th className="py-2.5 px-3">Performance Score</th>
                <th className="py-2.5 px-3">Attendance Score</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs text-slate-200">
              {sortedLeaderboard.map((emp, index) => (
                <tr key={emp.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-slate-400">
                    {index === 0 ? <span className="text-amber-400 flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-amber-400" /> #1</span> : `#${index + 1}`}
                  </td>
                  <td className="py-3 px-3 flex items-center gap-2.5">
                    <img src={emp.photo || 'https://picsum.photos/seed/user/100/100'} alt={emp.name} className="w-7 h-7 rounded-full object-cover" />
                    <span className="font-bold text-white">{emp.name}</span>
                  </td>
                  <td className="py-3 px-3 text-slate-400">{emp.department}</td>
                  <td className="py-3 px-3 font-bold text-indigo-400">{emp.performanceScore}%</td>
                  <td className="py-3 px-3 font-bold text-emerald-400">{emp.attendanceScore}%</td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      emp.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {emp.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
