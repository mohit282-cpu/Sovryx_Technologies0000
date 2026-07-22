'use client';

import React, { useState, useEffect } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import AIAssistantDrawer from '../ai/AIAssistantDrawer';
import CompanySetupWizard from '../onboarding/CompanySetupWizard';

// Module Views
import DashboardView from '../dashboard/DashboardView';
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
  CompanySettings
} from '@/types';

import {
  subscribeCollection,
  getSettings,
  DEFAULT_SETTINGS,
  seedInitialData
} from '@/lib/services/firestore';

export default function CEOLayout() {
  const [currentModule, setCurrentModule] = useState<string>('dashboard');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);

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
  const [initialLoaded, setInitialLoaded] = useState(false);

  // Subscribe to all 12 collections in real-time
  useEffect(() => {
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

    getSettings().then((s) => {
      if (s) setSettings(s);
      setInitialLoaded(true);
    });

    return () => {
      unsub1(); unsub2(); unsub3(); unsub4(); unsub5();
      unsub6(); unsub7(); unsub8(); unsub9(); unsub10();
    };
  }, []);

  // Auto seed on first launch if empty
  useEffect(() => {
    if (initialLoaded && employees.length === 0 && projects.length === 0) {
      seedInitialData().catch(console.error);
    }
  }, [initialLoaded, employees.length, projects.length]);

  const refreshData = () => {
    getSettings().then((s) => s && setSettings(s));
  };

  const renderCurrentModuleView = () => {
    switch (currentModule) {
      case 'dashboard':
        return (
          <DashboardView
            employees={employees}
            projects={projects}
            tasks={tasks}
            attendance={attendance}
            notifications={notifications}
            onSelectModule={setCurrentModule}
            onOpenAIAssistant={() => setIsAIOpen(true)}
          />
        );
      case 'employees':
        return <EmployeeView employees={employees} onRefresh={refreshData} />;
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
          <DashboardView
            employees={employees}
            projects={projects}
            tasks={tasks}
            attendance={attendance}
            notifications={notifications}
            onSelectModule={setCurrentModule}
            onOpenAIAssistant={() => setIsAIOpen(true)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white antialiased">
      {/* Sidebar */}
      <Sidebar
        currentModule={currentModule}
        onSelectModule={setCurrentModule}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col lg:pl-64 transition-all">
        <Header
          currentModule={currentModule}
          onSelectModule={setCurrentModule}
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
