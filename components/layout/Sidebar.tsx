'use client';

import React from 'react';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  CheckSquare,
  TrendingUp,
  Clock,
  CalendarDays,
  UserCheck,
  FileText,
  Bell,
  BarChart3,
  Settings,
  Shield,
  Zap,
  ChevronRight,
  Crown,
  Target,
  Compass,
  Inbox,
  User,
  LineChart,
  DollarSign
} from 'lucide-react';

interface SidebarProps {
  currentModule: string;
  onSelectModule: (module: string) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export const NAV_GROUPS = [
  {
    title: 'Executive Command',
    items: [
      { id: 'ceo-command', label: 'CEO Command Center', icon: Crown },
      { id: 'kpi', label: 'KPI Dashboard', icon: LineChart },
      { id: 'goals', label: 'Goals & OKRs', icon: Target },
      { id: 'strategy', label: 'Strategic Planning', icon: Compass },
      { id: 'decisions', label: 'CEO Decision Log', icon: FileText },
    ]
  },
  {
    title: 'Workforce & Execution',
    items: [
      { id: 'employees', label: 'Employees', icon: Users },
      { id: 'portal', label: 'Employee Portal', icon: User },
      { id: 'requests', label: 'Request Center', icon: Inbox },
      { id: 'payroll', label: 'Nepal Payroll (BS)', icon: DollarSign },
      { id: 'projects', label: 'Projects & Gantt', icon: Briefcase },
      { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    ]
  },
  {
    title: 'Operations & Governance',
    items: [
      { id: 'performance', label: 'Performance', icon: TrendingUp },
      { id: 'attendance', label: 'Attendance', icon: Clock },
      { id: 'meetings', label: 'Meetings', icon: CalendarDays },
      { id: 'clients', label: 'Clients', icon: UserCheck },
      { id: 'documents', label: 'Documents', icon: FileText },
      { id: 'notifications', label: 'Notifications', icon: Bell },
      { id: 'reports', label: 'Reports & Audits', icon: BarChart3 },
      { id: 'settings', label: 'Settings & Seeding', icon: Settings },
    ]
  }
];

export const NAV_ITEMS = NAV_GROUPS.flatMap(g => g.items);

export default function Sidebar({
  currentModule,
  onSelectModule,
  isMobileOpen,
  setIsMobileOpen
}: SidebarProps) {
  return (
    <>
      {/* Backdrop for mobile */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        id="sidebar-navigation"
        className={`fixed top-0 left-0 z-50 h-screen w-64 bg-slate-950 border-r border-slate-800/80 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Logo */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-emerald-500 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-indigo-500/25">
              S
            </div>
            <div>
              <span className="font-extrabold text-base tracking-wide text-white block leading-tight">
                SOVRYX
              </span>
              <span className="text-[10px] font-mono text-indigo-400 tracking-wider uppercase block">
                Company OS v3.5
              </span>
            </div>
          </div>
        </div>

        {/* CEO Mode Indicator */}
        <div className="mx-4 my-3 p-3 rounded-xl bg-gradient-to-r from-slate-900 to-slate-900/50 border border-slate-800 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-200">Sole Authority</p>
            <p className="text-[10px] text-slate-400">Direct Command Mode</p>
          </div>
        </div>

        {/* Navigation Modules */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4 custom-scrollbar">
          {NAV_GROUPS.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {group.title}
              </div>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentModule === item.id || (item.id === 'ceo-command' && currentModule === 'dashboard');
                return (
                  <button
                    key={item.id}
                    id={`nav-item-${item.id}`}
                    onClick={() => {
                      onSelectModule(item.id === 'ceo-command' ? 'dashboard' : item.id);
                      setIsMobileOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/25 font-semibold'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-indigo-200" />}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Bottom AI Status */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950">
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-3">
            <Zap className="w-4 h-4 text-emerald-400 animate-pulse" />
            <div className="text-left">
              <p className="text-xs font-medium text-slate-200">Gemini 2.5 Active</p>
              <p className="text-[10px] text-emerald-400 font-mono">Server Proxy Secured</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
