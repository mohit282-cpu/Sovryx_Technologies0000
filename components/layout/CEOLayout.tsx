'use client';

import React, { useState, useEffect } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import AIAssistantDrawer from '../ai/AIAssistantDrawer';
import CompanySetupWizard from '../onboarding/CompanySetupWizard';

// Module Views
import DashboardView from '../dashboard/DashboardView';
import CEOCommandCenter from '../dashboard/CEOCommandCenter';
import KPIDashboard from '../kpi/KPIDashboard';
import GoalsOKRView from '../goals/GoalsOKRView';
import StrategicPlanningView from '../strategy/StrategicPlanningView';
import DecisionLogView from '../decisions/DecisionLogView';
import RequestCenterView from '../requests/RequestCenterView';
import EmployeePortalView from '../portal/EmployeePortalView';
import PayrollView from '../payroll/PayrollView';

import EmployeeView from '../employees/EmployeeView';
import ProjectView from '../projects/ProjectView';
import TaskView from '../tasks/TaskView';
import PerformanceView from '../performance/PerformanceView';
import AttendanceView from '../attendance/AttendanceView';
import MeetingsView from '../meetings/MeetingsView';
import ClientView from '../clients/ClientView';
import DocumentView from '../documents/DocumentView';
import NotificationView from '../notifications/NotificationView';
import ReportView from '../reports/ReportView';
import SettingsView from '../settings/SettingsView';

import {
  Employee,
  Project,
  Task,
  PerformanceMetric,
  AttendanceRecord,
  Meeting,
  Client,
  CompanyDocument,
  NotificationItem,
  CompanyReport,
  CompanySettings,
  GoalOKR,
  StrategicPlan,
  CEODecision,
  LeaveRequest,
  EmployeeRequest,
  CompanyHealthData
} from '@/types';

import {
  subscribeCollection,
  getSettings,
  DEFAULT_SETTINGS,
  seedInitialData,
  ensureDefaultEmployees,
  STATIC_DEFAULT_EMPLOYEES
} from '@/lib/services/firestore';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { comparePassword } from '@/lib/auth';

export default function CEOLayout() {
  const pathname = usePathname();
  const router = useRouter();

  // Derive currentModule directly from the pathname to avoid setState in effect
  const currentModule = typeof window !== 'undefined' && pathname
    ? (pathname.split('/').filter(Boolean)[1] || 'dashboard')
    : 'dashboard';

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  // Admin Auth state
  const [adminUser, setAdminUser] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sovryx_admin_session');
      if (saved) return JSON.parse(saved);
      return null;
    }
    return null;
  });

  const [loginEmpId, setLoginEmpId] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');

  // Collections state
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [performance, setPerformance] = useState<PerformanceMetric[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [documents, setDocuments] = useState<CompanyDocument[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [reports, setReports] = useState<CompanyReport[]>([]);
  const [settings, setSettings] = useState<CompanySettings>(DEFAULT_SETTINGS);

  // Enterprise modules state
  const [goals, setGoals] = useState<GoalOKR[]>([]);
  const [plans, setPlans] = useState<StrategicPlan[]>([]);
  const [decisions, setDecisions] = useState<CEODecision[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [employeeRequests, setEmployeeRequests] = useState<EmployeeRequest[]>([]);
  const [healthData, setHealthData] = useState<CompanyHealthData | undefined>(undefined);

  const [initialLoaded, setInitialLoaded] = useState(false);

  // Subscribe to all collections in real-time
  useEffect(() => {
    ensureDefaultEmployees();

    const unsub1 = subscribeCollection<Employee>('employees', (data) => setEmployees(data));
    const unsub2 = subscribeCollection<Project>('projects', (data) => setProjects(data));
    const unsub3 = subscribeCollection<Task>('tasks', (data) => setTasks(data));
    const unsub4 = subscribeCollection<PerformanceMetric>('performance', (data) => setPerformance(data));
    const unsub5 = subscribeCollection<AttendanceRecord>('attendance', (data) => setAttendance(data));
    const unsub6 = subscribeCollection<Meeting>('meetings', (data) => setMeetings(data));
    const unsub7 = subscribeCollection<Client>('clients', (data) => setClients(data));
    const unsub8 = subscribeCollection<CompanyDocument>('documents', (data) => setDocuments(data));
    const unsub9 = subscribeCollection<NotificationItem>('notifications', (data) => setNotifications(data));
    const unsub10 = subscribeCollection<CompanyReport>('reports', (data) => setReports(data));

    const unsub11 = subscribeCollection<GoalOKR>('goals', (data) => setGoals(data));
    const unsub12 = subscribeCollection<StrategicPlan>('strategicPlans', (data) => setPlans(data));
    const unsub13 = subscribeCollection<CEODecision>('decisions', (data) => setDecisions(data));
    const unsub14 = subscribeCollection<LeaveRequest>('leaveRequests', (data) => setLeaveRequests(data));
    const unsub15 = subscribeCollection<EmployeeRequest>('employeeRequests', (data) => setEmployeeRequests(data));
    const unsub16 = subscribeCollection<CompanyHealthData>('companyHealth', (data) => setHealthData(data[0]));

    getSettings().then((s) => {
      if (s) setSettings(s);
      setInitialLoaded(true);
    });

    return () => {
      unsub1(); unsub2(); unsub3(); unsub4(); unsub5();
      unsub6(); unsub7(); unsub8(); unsub9(); unsub10();
      unsub11(); unsub12(); unsub13(); unsub14(); unsub15(); unsub16();
    };
  }, []);

  const handleModuleChange = (modId: string) => {
    router.push(`/dashboard/${modId}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('sovryx_admin_session');
    document.cookie = 'sovryx_admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.replace('/login');
  };

  // Safe client-side mount state
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    if (!adminUser) {
      router.replace('/login');
    }
    setTimeout(() => setMounted(true), 0);
  }, [router, adminUser]);

  if (!mounted || !adminUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-100 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-400 font-medium">Authenticating Admin Session...</p>
        </div>
      </div>
    );
  }

  const refreshData = () => {
    getSettings().then((s) => s && setSettings(s));
  };

  const renderCurrentModuleView = () => {
    switch (currentModule) {
      case 'dashboard':
      case 'ceo-command':
        return (
          <CEOCommandCenter
            employees={employees}
            projects={projects}
            tasks={tasks}
            attendance={attendance}
            notifications={notifications}
            meetings={meetings}
            decisions={decisions}
            leaveRequests={leaveRequests}
            healthData={healthData}
            onSelectModule={handleModuleChange}
            onOpenAIAssistant={() => setIsAIOpen(true)}
            onRefresh={refreshData}
          />
        );
      case 'kpi':
        return (
          <KPIDashboard
            employees={employees}
            projects={projects}
            tasks={tasks}
            attendance={attendance}
            performance={performance}
          />
        );
      case 'goals':
        return (
          <GoalsOKRView
            goals={goals}
            employees={employees}
            projects={projects}
            onRefresh={refreshData}
          />
        );
      case 'strategy':
        return (
          <StrategicPlanningView
            plan={plans[0]}
          />
        );
      case 'decisions':
        return (
          <DecisionLogView
            decisions={decisions}
            projects={projects}
            onRefresh={refreshData}
          />
        );
      case 'requests':
        return (
          <RequestCenterView
            leaveRequests={leaveRequests}
            employeeRequests={employeeRequests}
            employees={employees}
            onRefresh={refreshData}
          />
        );
      case 'portal':
        return (
          <EmployeePortalView
            employees={employees}
            tasks={tasks}
            attendance={attendance}
            onRefresh={refreshData}
          />
        );
      case 'employees':
        return <EmployeeView employees={employees} onRefresh={refreshData} />;
      case 'payroll':
        return <PayrollView employees={employees} onRefresh={refreshData} />;
      case 'projects':
        return <ProjectView projects={projects} employees={employees} tasks={tasks} onRefresh={refreshData} />;
      case 'tasks':
        return <TaskView tasks={tasks} employees={employees} projects={projects} onRefresh={refreshData} />;
      case 'performance':
        return <PerformanceView employees={employees} performance={performance} tasks={tasks} attendance={attendance} onRefresh={refreshData} />;
      case 'attendance':
        return <AttendanceView attendance={attendance} employees={employees} onRefresh={refreshData} />;
      case 'meetings':
        return <MeetingsView meetings={meetings} employees={employees} onRefresh={refreshData} />;
      case 'clients':
        return <ClientView clients={clients} onRefresh={refreshData} />;
      case 'documents':
        return <DocumentView documents={documents} onRefresh={refreshData} />;
      case 'notifications':
        return <NotificationView notifications={notifications} onRefresh={refreshData} />;
      case 'reports':
        return <ReportView reports={reports} employees={employees} projects={projects} tasks={tasks} onRefresh={refreshData} />;
      case 'settings':
        return <SettingsView settings={settings} onRefresh={refreshData} />;
      default:
        return (
          <CEOCommandCenter
            employees={employees}
            projects={projects}
            tasks={tasks}
            attendance={attendance}
            notifications={notifications}
            meetings={meetings}
            decisions={decisions}
            leaveRequests={leaveRequests}
            healthData={healthData}
            onSelectModule={handleModuleChange}
            onOpenAIAssistant={() => setIsAIOpen(true)}
            onRefresh={refreshData}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white antialiased">
      {/* Sidebar */}
      <Sidebar
        currentModule={currentModule}
        onSelectModule={handleModuleChange}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        onSignOut={handleLogout}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col lg:pl-64 transition-all">
        <Header
          currentModule={currentModule}
          onSelectModule={handleModuleChange}
          notifications={notifications}
          settings={settings}
          onOpenAIAssistant={() => setIsAIOpen(true)}
          onOpenWizard={() => setIsWizardOpen(true)}
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
        />

        <main id="main-content" className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {renderCurrentModuleView()}
        </main>
      </div>

      {/* Bottom Status Bar */}
      <footer className="h-8 border-t border-slate-800 bg-slate-900/80 px-4 lg:pl-68 flex items-center justify-between text-[10px] text-slate-500 shrink-0">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Firebase Connected</span>
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>Gemini 2.5 Flash API</span>
        </div>
        <div className="hidden sm:block">Sovryx OS Operating System • Sovereign CEO Command</div>
      </footer>

      {/* AI Assistant Drawer */}
      <AIAssistantDrawer
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
        contextData={{ employees, projects, tasks, performance, attendance }}
      />

      {/* Company Setup Wizard */}
      <CompanySetupWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onComplete={refreshData}
      />
    </div>
  );
}
