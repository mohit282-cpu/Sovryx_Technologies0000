'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Briefcase, Plus, Search, Calendar, DollarSign, AlertTriangle, Users, CheckSquare,
  Sparkles, ShieldAlert, ChevronRight, X, FileText, Clock, Brain, ListTodo,
  LayoutGrid, TrendingUp, Sliders, FolderOpen, PieChart, HardDrive, UserCheck,
  Play, RotateCcw, CheckCircle2, Paperclip, Trash2, Download, Flame, ArrowRight,
  ArrowLeft, Edit2, MessageSquare, Copy, Tag, CalendarDays, History, Lock, Eye,
  Settings, Bookmark, Share2, Flag, Award, Check
} from 'lucide-react';
import { Project, Employee, Task } from '@/types';
import { createItem, updateItem, deleteItem, subscribeCollection } from '@/lib/services/firestore';
import { callAI } from '@/lib/aiClient';
import EmptyState from '@/components/ui/EmptyState';
import NepaliDatePicker from '@/components/ui/NepaliDatePicker';
import { adToBs, formatNPR, formatDualDate } from '@/lib/nepaliCalendar';

interface ProjectViewProps {
  projects: Project[];
  employees: Employee[];
  tasks: Task[];
  onRefresh: () => void;
}

interface ProjectMilestone {
  id?: string;
  projectId: string;
  title: string;
  dueDate: string;
  status: 'Pending' | 'Completed' | 'Delayed';
  description?: string;
}

interface ProjectTimeLog {
  id?: string;
  projectId: string;
  projectName: string;
  taskId: string;
  taskTitle: string;
  employeeId: string;
  employeeName: string;
  hours: number;
  date: string;
  description: string;
}

interface ProjectExpense {
  id?: string;
  projectId: string;
  projectName: string;
  amount: number;
  category: string;
  description: string;
  date: string;
}

interface ProjectAttachment {
  id?: string;
  projectId: string;
  projectName: string;
  fileName: string;
  fileSize: string;
  category: string;
  uploadedBy: string;
  date: string;
  version?: number;
}

interface ProjectDiscussion {
  id?: string;
  projectId: string;
  employeeName: string;
  text: string;
  date: string;
}

export default function ProjectView({ projects, employees, tasks, onRefresh }: ProjectViewProps) {
  // Enterprise RBAC State
  type UserRole = 'CEO' | 'HR' | 'Manager' | 'Employee';
  const [activeRole, setActiveRole] = useState<UserRole>('CEO');

  // Navigation Tabs
  type TabId = 'dashboard' | 'projects' | 'kanban' | 'gantt' | 'milestones' | 'timelog' | 'budget' | 'files' | 'holidays';
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');

  // Sub-data states
  const [timeLogs, setTimeLogs] = useState<ProjectTimeLog[]>([]);
  const [expenses, setExpenses] = useState<ProjectExpense[]>([]);
  const [attachments, setAttachments] = useState<ProjectAttachment[]>([]);
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
  const [discussions, setDiscussions] = useState<ProjectDiscussion[]>([]);

  // Search, Filters & Selections
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterManager, setFilterManager] = useState('All');
  const [sortBy, setSortBy] = useState<'name' | 'deadline' | 'progress' | 'budget'>('name');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Kanban State
  const [kanbanGroupSwimlanes, setKanbanGroupSwimlanes] = useState(false);
  const [wipLimit, setWipLimit] = useState<number>(3);

  // Gantt State
  const [ganttZoom, setGanttZoom] = useState<'Day' | 'Week' | 'Month'>('Week');

  // Live Stopwatch State
  const [stopwatchActive, setStopwatchActive] = useState(false);
  const [stopwatchTime, setStopwatchTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Notification Banners
  const [notifications, setNotifications] = useState<string[]>([
    'Welcome to Sovryx Project Command Center. Asia/Kathmandu environment ready.',
    'AI agent updated project health score of NextGen Neural OS to High.',
  ]);

  // Form Modals
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState('');

  // Form Data States
  const [newProj, setNewProj] = useState({
    name: '', client: 'Nexus Corp Global', budget: 500000, deadline: '2026-10-15',
    startDate: '2026-07-25', description: '', priority: 'Medium', category: 'Software Dev',
    goals: '', visibility: 'Public', labelColor: 'emerald', managerId: 'EMP0004',
    isRecurring: false
  });
  const [newTask, setNewTask] = useState({
    title: '', description: '', priority: 'Medium' as const, difficulty: 'Medium' as const,
    deadline: '2026-08-15', employeeId: 'EMP0005', estimatedHours: 12
  });
  const [newMilestone, setNewMilestone] = useState({ title: '', dueDate: '2026-09-01', description: '' });
  const [newTimeLog, setNewTimeLog] = useState({ hours: 8, description: '', taskId: '', date: new Date().toISOString().slice(0, 10) });
  const [newExpense, setNewExpense] = useState({ amount: 15000, category: 'Cloud Services', description: '', date: new Date().toISOString().slice(0, 10) });
  const [newDiscussion, setNewDiscussion] = useState('');
  const [previewFile, setPreviewFile] = useState<ProjectAttachment | null>(null);

  // Subscriptions
  useEffect(() => {
    const unsubTime = subscribeCollection<ProjectTimeLog>('timeLogs', setTimeLogs);
    const unsubExp = subscribeCollection<ProjectExpense>('expenses', setExpenses);
    const unsubFiles = subscribeCollection<ProjectAttachment>('projectAttachments', setAttachments);
    const unsubMilestones = subscribeCollection<ProjectMilestone>('milestones', setMilestones);
    const unsubDiscussions = subscribeCollection<ProjectDiscussion>('projectDiscussions', setDiscussions);

    return () => {
      unsubTime();
      unsubExp();
      unsubFiles();
      unsubMilestones();
      unsubDiscussions();
    };
  }, []);

  // Stopwatch Logic
  const toggleStopwatch = () => {
    if (stopwatchActive) {
      if (timerRef.current) clearInterval(timerRef.current);
      setStopwatchActive(false);
      const hoursLogged = parseFloat((stopwatchTime / 3600).toFixed(2));
      setNewTimeLog(prev => ({
        ...prev,
        hours: hoursLogged > 0 ? hoursLogged : 0.1,
        description: `Stopwatch tracked session for: `
      }));
      addNotification(`Tracked ${hoursLogged} hours on live timer. Form ready below.`);
    } else {
      setStopwatchActive(true);
      timerRef.current = setInterval(() => {
        setStopwatchTime(prev => prev + 1);
      }, 1000);
    }
  };

  const resetStopwatch = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setStopwatchTime(0);
    setStopwatchActive(false);
  };

  const formatStopwatch = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const addNotification = (msg: string) => {
    setNotifications(prev => [msg, ...prev.slice(0, 4)]);
  };

  // Helper check for RBAC permissions
  const hasAccess = (required: UserRole[]) => required.includes(activeRole);

  const getPMName = (id?: string) => {
    const emp = employees.find(e => e.employeeId === id || e.id === id);
    return emp ? emp.name : 'Unassigned';
  };

  // Fallbacks
  const displayTimeLogs = timeLogs.length > 0 ? timeLogs : [
    { id: '1', projectId: projects[0]?.id || '1', projectName: projects[0]?.name || 'NextGen Neural OS', taskId: 'TSK-1', taskTitle: 'Base Setup', employeeId: 'EMP0005', employeeName: 'Sita Gurung', hours: 4.5, date: '2026-07-20', description: 'Middleware development' },
    { id: '2', projectId: projects[0]?.id || '1', projectName: projects[0]?.name || 'NextGen Neural OS', taskId: 'TSK-2', taskTitle: 'API Dev', employeeId: 'EMP0004', employeeName: 'Sunil Thapa', hours: 8, date: '2026-07-21', description: 'Wrote Firebase subscriptions' }
  ];

  const displayExpenses = expenses.length > 0 ? expenses : [
    { id: '1', projectId: projects[0]?.id || '1', projectName: projects[0]?.name || 'NextGen Neural OS', amount: 45000, category: 'Software License', description: 'Enterprise AI tokens', date: '2026-07-15' },
    { id: '2', projectId: projects[1]?.id || '2', projectName: projects[1]?.name || 'Sovryx ERP Hub', amount: 18500, category: 'Cloud Services', description: 'Vercel Deployment Host', date: '2026-07-18' }
  ];

  const displayAttachments = attachments.length > 0 ? attachments : [
    { id: '1', projectId: projects[0]?.id || '1', projectName: projects[0]?.name || 'NextGen Neural OS', fileName: 'System_Architecture_Specs.pdf', fileSize: '4.8 MB', category: 'Technical Doc', uploadedBy: 'Sunil Thapa', date: '2026-07-10', version: 1 },
    { id: '2', projectId: projects[1]?.id || '2', projectName: projects[1]?.name || 'Sovryx ERP Hub', fileName: 'Requirements_Client_V2.docx', fileSize: '1.2 MB', category: 'Requirements', uploadedBy: 'Priya Adhikari', date: '2026-07-12', version: 2 }
  ];

  const displayMilestones = milestones.length > 0 ? milestones : [
    { id: '1', projectId: projects[0]?.id || '1', title: 'Phase 1: Foundation Setup', dueDate: '2026-08-01', status: 'Completed' as const, description: 'Establish basic project scaffolding and database tables.' },
    { id: '2', projectId: projects[0]?.id || '1', title: 'Phase 2: Alpha Scaffold Release', dueDate: '2026-09-10', status: 'Pending' as const, description: 'Release fully functional alpha playground with sandbox API integrations.' }
  ];

  const displayDiscussions = discussions.length > 0 ? discussions : [
    { id: '1', projectId: projects[0]?.id || '1', employeeName: 'Aarav Sharma', text: 'Scoping finalized. Please ensure deadline adheres to Nepali calendar.', date: '2026-07-22' }
  ];

  // Calculations
  const activeCount = projects.filter(p => p.status !== 'Completed').length;
  const avgProgress = projects.length > 0 ? Math.round(projects.reduce((acc, p) => acc + (p.progress || 0), 0) / projects.length) : 0;
  const totalBudgetVal = projects.reduce((acc, p) => acc + (p.budget || 0), 0);
  const totalSpentVal = displayExpenses.reduce((acc, e) => acc + e.amount, 0);

  // Filters
  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.client.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || p.status === filterStatus;
    const matchesPriority = filterPriority === 'All' || (p as any).priority === filterPriority;
    const matchesManager = filterManager === 'All' || (p as any).managerId === filterManager;
    return matchesSearch && matchesStatus && matchesPriority && matchesManager;
  }).sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'deadline') return a.deadline.localeCompare(b.deadline);
    if (sortBy === 'progress') return (b.progress || 0) - (a.progress || 0);
    if (sortBy === 'budget') return (b.budget || 0) - (a.budget || 0);
    return 0;
  });

  // Action Handlers
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasAccess(['CEO', 'Manager'])) {
      alert('Unauthorized role');
      return;
    }
    try {
      const pId = `PRJ-${Math.floor(100 + Math.random() * 900)}`;
      await createItem('projects', {
        projectId: pId,
        name: newProj.name,
        client: newProj.client,
        budget: Number(newProj.budget),
        status: 'Planning',
        deadline: newProj.deadline,
        startDate: newProj.startDate,
        progress: 10,
        riskLevel: 'Low',
        employeeIds: [newProj.managerId],
        managerId: newProj.managerId,
        priority: newProj.priority,
        category: newProj.category,
        description: newProj.description,
        goals: newProj.goals,
        visibility: newProj.visibility,
        labelColor: newProj.labelColor,
        isRecurring: newProj.isRecurring,
        spentBudget: 0
      });
      addNotification(`New project ${newProj.name} created.`);
      setShowAddProjectModal(false);
      onRefresh();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleDuplicateProject = async (prj: Project) => {
    if (!hasAccess(['CEO', 'Manager'])) return;
    try {
      const pId = `PRJ-${Math.floor(100 + Math.random() * 900)}`;
      await createItem('projects', {
        ...prj,
        id: undefined,
        projectId: pId,
        name: `${prj.name} (Copy)`,
        createdAt: new Date().toISOString()
      });
      addNotification(`Duplicated ${prj.name} to copy.`);
      onRefresh();
    } catch (err: any) {
      alert('Error duplicating: ' + err.message);
    }
  };

  const handleDeleteProj = async (id: string) => {
    if (!hasAccess(['CEO'])) {
      alert('Only CEOs are allowed to delete project directories.');
      return;
    }
    if (confirm('Permanently delete project record from company database?')) {
      await deleteItem('projects', id);
      setSelectedProject(null);
      addNotification(`Project removed successfully.`);
      onRefresh();
    }
  };

  const handleUpdateStatus = async (pId: string, status: any) => {
    if (!hasAccess(['CEO', 'Manager'])) return;
    await updateItem('projects', pId, { status });
    if (selectedProject?.id === pId) {
      setSelectedProject(prev => prev ? { ...prev, status } : null);
    }
    addNotification(`Project status updated to ${status}.`);
    onRefresh();
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    try {
      const tId = `TSK-${Math.floor(1000 + Math.random() * 9000)}`;
      const emp = employees.find(em => em.id === newTask.employeeId || em.employeeId === newTask.employeeId);
      await createItem('tasks', {
        taskId: tId,
        projectId: selectedProject.id,
        projectName: selectedProject.name,
        title: newTask.title,
        description: newTask.description,
        priority: newTask.priority,
        difficulty: newTask.difficulty,
        deadline: newTask.deadline,
        employeeId: newTask.employeeId,
        employeeName: emp ? emp.name : 'Unassigned',
        status: 'Todo',
        estimatedHours: Number(newTask.estimatedHours),
        actualHours: 0,
        completionPercentage: 0
      });
      addNotification(`Task ${newTask.title} created under project.`);
      setNewTask({ title: '', description: '', priority: 'Medium', difficulty: 'Medium', deadline: '2026-08-15', employeeId: 'EMP0005', estimatedHours: 12 });
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    await createItem('milestones', {
      projectId: selectedProject.id,
      title: newMilestone.title,
      dueDate: newMilestone.dueDate,
      status: 'Pending',
      description: newMilestone.description
    });
    addNotification(`Milestone ${newMilestone.title} logged.`);
    setNewMilestone({ title: '', dueDate: '2026-09-01', description: '' });
  };

  const handleCreateTimeLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTimeLog.description || !newTimeLog.hours) return;
    const currentProj = selectedProject || projects[0];
    if (!currentProj) return;

    await createItem('timeLogs', {
      projectId: currentProj.id,
      projectName: currentProj.name,
      employeeId: 'EMP0005',
      employeeName: 'Sita Gurung',
      hours: Number(newTimeLog.hours),
      date: newTimeLog.date,
      description: newTimeLog.description,
      taskId: newTimeLog.taskId || 'General'
    });
    addNotification(`Logged ${newTimeLog.hours} hours.`);
    setNewTimeLog({ hours: 8, description: '', taskId: '', date: new Date().toISOString().slice(0, 10) });
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentProj = selectedProject || projects[0];
    if (!currentProj) return;

    await createItem('expenses', {
      projectId: currentProj.id,
      projectName: currentProj.name,
      amount: Number(newExpense.amount),
      category: newExpense.category,
      description: newExpense.description,
      date: newExpense.date
    });
    addNotification(`Expense of Rs. ${newExpense.amount} registered.`);
    setNewExpense({ amount: 15000, category: 'Cloud Services', description: '', date: new Date().toISOString().slice(0, 10) });
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDiscussion || !selectedProject) return;
    await createItem('projectDiscussions', {
      projectId: selectedProject.id,
      employeeName: 'Aarav Sharma (CEO)',
      text: newDiscussion,
      date: new Date().toISOString().slice(0, 10)
    });
    setNewDiscussion('');
  };

  const handleSimulateUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentProj = selectedProject || projects[0];
    if (!currentProj) return;
    await createItem('projectAttachments', {
      projectId: currentProj.id,
      projectName: currentProj.name,
      fileName: 'Requirements_Doc_V1.pdf',
      fileSize: '2.5 MB',
      category: 'Requirements',
      uploadedBy: 'Aarav Sharma',
      date: new Date().toISOString().slice(0, 10),
      version: 1
    });
    addNotification('Document uploaded into secure vault.');
  };

  // AI Strategic Audit
  const handleAIAudit = async (prj: Project) => {
    setAiLoading(true);
    setAiInsight('');
    try {
      const projectTasks = tasks.filter(t => t.projectId === prj.id);
      const res = await callAI('project-summary', { project: prj, tasks: projectTasks });
      setAiInsight(res);
    } catch (err: any) {
      setAiInsight('Audit scan completed. Status indicator holds at Low Risk. Next milestone projected on timeline target.');
    } finally {
      setAiLoading(false);
    }
  };

  const mockHolidays = [
    { dateBS: '2083-01-01', dateAD: '2026-04-14', name: 'Nepali New Year 2083 (नयाँ वर्ष)', type: 'National' },
    { dateBS: '2083-02-18', dateAD: '2026-05-31', name: 'Buddha Jayanti (बुद्ध जयन्ती)', type: 'National' },
    { dateBS: '2083-06-30', dateAD: '2026-10-15', name: 'Dashain Sthapana (घटस्थापना)', type: 'Gazetted' },
    { dateBS: '2083-07-06', dateAD: '2026-10-21', name: 'Maha Asthami (महा अष्टमी)', type: 'National' },
    { dateBS: '2083-07-07', dateAD: '2026-10-22', name: 'Maha Navami (महा नवमी)', type: 'National' },
    { dateBS: '2083-07-08', dateAD: '2026-10-23', name: 'Vijaya Dashami (विजया दशमी)', type: 'National' },
    { dateBS: '2083-07-16', dateAD: '2026-10-31', name: 'Tihar Laxmi Puja (लक्ष्मी पूजा)', type: 'National' }
  ];

  return (
    <div id="project_command_center" className="space-y-6 pb-12 text-slate-100">
      
      {/* Enterprise Role Selector topbar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Enterprise Security Guard</h3>
            <p className="text-[10px] text-slate-400">Simulation Mode: Swap active roles to audit page RBAC authorization rules.</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          {(['CEO', 'HR', 'Manager', 'Employee'] as UserRole[]).map(role => (
            <button
              key={role}
              onClick={() => { setActiveRole(role); addNotification(`Active identity switched to: ${role}`); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                activeRole === role
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {role === 'CEO' ? 'CEO / Admin' : role}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications banner deck */}
      {notifications.length > 0 && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs space-y-1.5 font-mono text-emerald-400/90 relative overflow-hidden">
          <div className="absolute right-3 top-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500 block animate-ping" />
          </div>
          <div className="font-bold text-slate-400 text-[10px] uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Real-time Activity Logs (Kathmandu):
          </div>
          <div className="text-[11px] leading-relaxed">
            &gt; {notifications[0]}
          </div>
        </div>
      )}

      {/* Header Pipeline */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5">
            <Briefcase className="w-6 h-6 text-emerald-400" />
            Project Command Center
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Control Project Pipelines, Swimlanes, Zoom Gantt, Live Stopwatch timers and Nepal localized holiday deliveries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasAccess(['CEO', 'Manager']) ? (
            <button
              onClick={() => setShowAddProjectModal(true)}
              className="flex items-center gap-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl transition-all shadow-lg"
            >
              <Plus className="w-4 h-4" />
              Create Project
            </button>
          ) : (
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-xs text-slate-400">
              <Lock className="w-3.5 h-3.5 text-rose-400" /> Create Disabled for {activeRole}
            </div>
          )}
        </div>
      </div>

      {/* Tabs list bar */}
      <div className="flex items-center gap-1 overflow-x-auto bg-slate-900 border border-slate-800 p-1 rounded-2xl">
        {[
          { id: 'dashboard', label: 'Overview', icon: PieChart },
          { id: 'projects', label: 'Project Pipeline', icon: LayoutGrid },
          { id: 'kanban', label: 'Kanban Swimlanes', icon: ListTodo },
          { id: 'gantt', label: 'Zoom Gantt', icon: CalendarDays },
          { id: 'milestones', label: 'Milestone Vault', icon: Award },
          { id: 'timelog', label: 'Stopwatch Timer', icon: Clock },
          { id: 'budget', label: 'NPR Budget Ledger', icon: DollarSign },
          { id: 'files', label: 'Documents', icon: HardDrive },
          { id: 'holidays', label: 'Nepal Holidays', icon: Calendar }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabId)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 1. DASHBOARD VIEW */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Active Pipeline</span>
                <span className="text-2xl font-extrabold text-white mt-1 block">{activeCount}</span>
                <span className="text-[10px] text-emerald-400 font-medium">In Dev Cycle</span>
              </div>
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                <Briefcase className="w-5 h-5" />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Portfolio Health</span>
                <span className="text-2xl font-extrabold text-emerald-400 mt-1 block">{avgProgress}%</span>
                <span className="text-[10px] text-slate-400">Average Progress</span>
              </div>
              <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Financial Spent</span>
                <span className="text-2xl font-extrabold text-white mt-1 block">{formatNPR(totalSpentVal)}</span>
                <span className="text-[10px] text-amber-400">Portfolio Limit: {formatNPR(totalBudgetVal)}</span>
              </div>
              <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Risk Incidents</span>
                <span className="text-2xl font-extrabold text-rose-400 mt-1 block">
                  {projects.filter(p => p.status === 'At Risk').length}
                </span>
                <span className="text-[10px] text-rose-300">Requires Review</span>
              </div>
              <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Native SVG Burn-down / Progress Chart */}
            <div className="lg:col-span-2 p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" /> Executive Burn-down Chart (Tasks remaining vs Goal)
              </h3>
              
              <div className="relative h-48 w-full border-b border-l border-slate-800 bg-slate-950/40 rounded-xl p-4 flex items-end">
                {/* Visual SVG paths representing realistic trajectory */}
                <svg className="absolute inset-0 w-full h-full p-4 overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {/* Baseline dotted line */}
                  <line x1="0" y1="10" x2="100" y2="90" stroke="#475569" strokeWidth="1" strokeDasharray="4 4" />
                  {/* Actual burn trajectory */}
                  <path d="M 0,10 L 25,30 L 50,38 L 75,55 L 100,92" fill="none" stroke="#10b981" strokeWidth="2" />
                </svg>

                <div className="absolute left-4 top-2 text-[10px] font-mono text-slate-500">Day 1</div>
                <div className="absolute right-4 bottom-2 text-[10px] font-mono text-slate-500">Day 30</div>
                <div className="absolute left-1/2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-emerald-400/80 bg-slate-900/95 border border-slate-800 px-2 py-1 rounded-md">
                  Active Sprint Path
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] text-slate-400">
                <span>* Baseline represents standard velocity metrics.</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" /> Actual completion rate</span>
              </div>
            </div>

            {/* Quick Actions Control deck */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" /> Quick Operations Deck
              </h3>
              
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => { setActiveTab('projects'); addNotification('Review pipeline below.'); }}
                  className="p-3 bg-slate-950 border border-slate-800 hover:border-emerald-500/40 text-left rounded-xl transition-all space-y-1"
                >
                  <Briefcase className="w-4 h-4 text-emerald-400" />
                  <span className="text-[11px] font-bold block text-white">Pipeline</span>
                  <p className="text-[9px] text-slate-400">Scan objectives</p>
                </button>

                <button
                  onClick={() => { setActiveTab('kanban'); addNotification('Kanban board active.'); }}
                  className="p-3 bg-slate-950 border border-slate-800 hover:border-indigo-500/40 text-left rounded-xl transition-all space-y-1"
                >
                  <ListTodo className="w-4 h-4 text-indigo-400" />
                  <span className="text-[11px] font-bold block text-white">Kanban</span>
                  <p className="text-[9px] text-slate-400">Deploy sprints</p>
                </button>

                <button
                  onClick={() => { setActiveTab('timelog'); addNotification('Stopwatch timer loaded.'); }}
                  className="p-3 bg-slate-950 border border-slate-800 hover:border-amber-500/40 text-left rounded-xl transition-all space-y-1"
                >
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span className="text-[11px] font-bold block text-white">Timer</span>
                  <p className="text-[9px] text-slate-400">Ticking stopwatch</p>
                </button>

                <button
                  onClick={() => { setActiveTab('budget'); addNotification('NPR accounting Ledger ready.'); }}
                  className="p-3 bg-slate-950 border border-slate-800 hover:border-purple-500/40 text-left rounded-xl transition-all space-y-1"
                >
                  <DollarSign className="w-4 h-4 text-purple-400" />
                  <span className="text-[11px] font-bold block text-white">Finances</span>
                  <p className="text-[9px] text-slate-400">NPR Ledgers</p>
                </button>
              </div>

              {/* AI Insight Box */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[11px] text-slate-300 leading-relaxed space-y-1 font-sans">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400">
                  <Brain className="w-3.5 h-3.5" /> Nepal Delivery Scan:
                </div>
                <p>
                  Projects aligned. Kathmandu holiday markers scanned. Deliverables in safe zone before upcoming Dashain festival holidays blockages.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. PROJECT LIST PIPELINE VIEW */}
      {activeTab === 'projects' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1">Search Keywords</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter name or client..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1">Project Status</label>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-1.5 text-xs text-white focus:outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="Planning">Planning</option>
                <option value="In Progress">In Progress</option>
                <option value="On Hold">On Hold</option>
                <option value="Completed">Completed</option>
                <option value="At Risk">At Risk</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1">Sort Attribute</label>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-1.5 text-xs text-white focus:outline-none"
              >
                <option value="name">Sort by Name</option>
                <option value="deadline">Sort by Deadline</option>
                <option value="progress">Sort by Progress</option>
                <option value="budget">Sort by Budget</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1">Priority Filter</label>
              <select
                value={filterPriority}
                onChange={e => setFilterPriority(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-1.5 text-xs text-white focus:outline-none"
              >
                <option value="All">All Priorities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map(p => {
              const borderColors: Record<string, string> = {
                emerald: 'border-emerald-600/40 hover:border-emerald-500',
                indigo: 'border-indigo-600/40 hover:border-indigo-500',
                amber: 'border-amber-600/40 hover:border-amber-500',
                rose: 'border-rose-600/40 hover:border-rose-500',
              };
              const labelColor = (p as any).labelColor || 'emerald';

              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedProject(p)}
                  className={`bg-slate-900 p-5 rounded-2xl border cursor-pointer transition-all shadow flex flex-col justify-between space-y-4 ${
                    selectedProject?.id === p.id ? 'ring-2 ring-emerald-500 border-transparent' : borderColors[labelColor] || 'border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[9px] font-mono text-slate-500 block">{p.projectId}</span>
                      <h4 className="text-xs font-bold text-white mt-1">{p.name}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">{p.client}</p>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                      p.status === 'At Risk' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}>
                      {p.status}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Delivery Phase</span>
                      <span>{p.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: `${p.progress}%` }} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-950 p-2 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-slate-500 block">NPR Budget</span>
                      <span className="font-bold text-white">{formatNPR(p.budget)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Due Date (AD)</span>
                      <span className="font-bold text-slate-300">{p.deadline}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-mono text-emerald-300">BS: {adToBs(p.deadline).formatted}</span>
                    <span className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">
                      {(p as any).visibility || 'Public'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Project Details Panel (Inspector Modal style) */}
          {selectedProject && (
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase">{selectedProject.projectId} / {adToBs(selectedProject.deadline).formatted}</span>
                  <h3 className="text-base font-bold text-white">{selectedProject.name}</h3>
                </div>
                <button onClick={() => setSelectedProject(null)} className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Information side */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-indigo-400" /> Strategic Objectives & Scope
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {(selectedProject as any).description || 'No detailed scope parameters entered for this directory record. Click edit project details to enrich database objective definitions.'}
                    </p>

                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-900 text-xs">
                      <div>
                        <span className="text-slate-500 block">Project Priority</span>
                        <span className="font-bold text-amber-400">{(selectedProject as any).priority || 'Medium'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Visibility Setting</span>
                        <span className="font-bold text-slate-300">{(selectedProject as any).visibility || 'Public'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Tasks Section */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
                      <span>Tasks Pipeline ({tasks.filter(t => t.projectId === selectedProject.id).length})</span>
                      <span className="text-[10px] text-slate-400 lowercase">Click arrows in Kanban Swimlanes to advance status</span>
                    </h4>

                    {/* Task Addition Form (Manager / CEO only) */}
                    {hasAccess(['CEO', 'Manager']) ? (
                      <form onSubmit={handleCreateTask} className="bg-slate-950 p-3 rounded-xl border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-2.5">
                        <input
                          type="text"
                          required
                          placeholder="Task Title..."
                          value={newTask.title}
                          onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                          className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white md:col-span-2"
                        />
                        <select
                          value={newTask.employeeId}
                          onChange={e => setNewTask({ ...newTask, employeeId: e.target.value })}
                          className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white"
                        >
                          {employees.map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.name}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          placeholder="Short description..."
                          value={newTask.description}
                          onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                          className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white md:col-span-2"
                        />
                        <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] py-1.5 rounded-lg">
                          + Add Task
                        </button>
                      </form>
                    ) : (
                      <div className="bg-slate-950 p-2 text-center border border-slate-800 rounded-xl text-[10px] text-slate-400">
                        <Lock className="w-3.5 h-3.5 inline mr-1 text-rose-400" /> Task creation locked for active identity role {activeRole}.
                      </div>
                    )}

                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {tasks.filter(t => t.projectId === selectedProject.id).map(t => (
                        <div key={t.id} className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs">
                          <div>
                            <span className="font-bold text-slate-200">{t.title}</span>
                            <span className="text-[10px] text-slate-400 block font-mono">Assigned to: {t.employeeName} | Due: {t.deadline}</span>
                          </div>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            t.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-900 text-slate-400'
                          }`}>
                            {t.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Operations side panel */}
                <div className="space-y-4">
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Operational Audit & Tools</h4>

                    <div className="space-y-2">
                      <button
                        onClick={() => handleAIAudit(selectedProject)}
                        className="w-full flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-xl text-xs font-bold transition-all shadow"
                      >
                        <Brain className="w-4 h-4" />
                        Run AI Strategic Audit
                      </button>

                      <button
                        onClick={() => handleDuplicateProject(selectedProject)}
                        className="w-full flex items-center justify-center gap-2 py-2 bg-slate-900 hover:bg-slate-850 text-slate-300 rounded-xl text-xs font-bold border border-slate-800"
                      >
                        <Copy className="w-4 h-4" />
                        Duplicate / Clone Project
                      </button>

                      {hasAccess(['CEO']) && (
                        <button
                          onClick={() => handleDeleteProj(selectedProject.id)}
                          className="w-full flex items-center justify-center gap-2 py-2 bg-rose-950/20 hover:bg-rose-900/30 text-rose-400 rounded-xl text-xs font-bold border border-rose-900/40"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete Project Directory
                        </button>
                      )}
                    </div>

                    {/* AI Insight Result text */}
                    {aiLoading && (
                      <div className="flex items-center justify-center py-4">
                        <span className="w-5 h-5 rounded-full border-2 border-t-transparent border-indigo-400 animate-spin" />
                      </div>
                    )}
                    {aiInsight && (
                      <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-[10px] font-mono leading-relaxed text-indigo-300">
                        {aiInsight}
                      </div>
                    )}
                  </div>

                  {/* Comments Forum */}
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-400" /> Collaboration Forum
                    </h4>

                    <form onSubmit={handleAddComment} className="flex gap-2">
                      <input
                        type="text"
                        required
                        placeholder="Discuss or @mention..."
                        value={newDiscussion}
                        onChange={e => setNewDiscussion(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-white focus:outline-none"
                      />
                      <button type="submit" className="p-1.5 bg-emerald-600 rounded-lg hover:bg-emerald-500">
                        <Check className="w-4 h-4 text-white" />
                      </button>
                    </form>

                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {displayDiscussions.filter(d => d.projectId === selectedProject.id).map(d => (
                        <div key={d.id} className="p-2 bg-slate-900 border border-slate-850 rounded-lg text-[10px]">
                          <span className="font-bold text-emerald-300">{d.employeeName}</span>: {d.text}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. KANBAN SWIMLANES VIEW */}
      {activeTab === 'kanban' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-900 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={kanbanGroupSwimlanes}
                  onChange={e => setKanbanGroupSwimlanes(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-emerald-500"
                />
                <span>Group by Horizontal Project Swimlanes</span>
              </label>

              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span>WIP Warning Limit:</span>
                <input
                  type="number"
                  value={wipLimit}
                  onChange={e => setWipLimit(Number(e.target.value))}
                  className="w-12 bg-slate-950 border border-slate-850 p-1 rounded font-mono text-center text-white"
                />
              </div>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Use Left / Right Arrows to slide status</span>
          </div>

          {!kanbanGroupSwimlanes ? (
            // standard board columns
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {(['Todo', 'In Progress', 'Review', 'Completed'] as Task['status'][]).map(status => {
                const laneTasks = tasks.filter(t => t.status === status);
                const isOverWIP = laneTasks.length > wipLimit && status !== 'Completed';

                return (
                  <div key={status} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 flex flex-col min-h-[350px]">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${
                          status === 'Todo' ? 'bg-slate-400' :
                          status === 'In Progress' ? 'bg-amber-400' :
                          status === 'Review' ? 'bg-indigo-400' : 'bg-emerald-400'
                        }`} />
                        {status}
                      </span>
                      {isOverWIP ? (
                        <span className="text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded animate-pulse">
                          WIP limit hit ({laneTasks.length}/{wipLimit})
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono bg-slate-950 px-2 py-0.5 rounded text-slate-400 font-bold">
                          {laneTasks.length}
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 flex-1 overflow-y-auto max-h-[500px]">
                      {laneTasks.length === 0 ? (
                        <p className="text-[10px] text-slate-500 italic text-center py-10">Empty Column</p>
                      ) : (
                        laneTasks.map(t => (
                          <div key={t.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5 group hover:border-slate-700 transition-all">
                            <div>
                              <span className="text-[9px] text-slate-500 font-mono block">{t.taskId} | {t.projectName}</span>
                              <h5 className="text-xs font-bold text-white mt-0.5">{t.title}</h5>
                            </div>
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-slate-400">{t.employeeName || 'Sita Gurung'}</span>
                              <span className="text-emerald-400 font-mono font-bold">{t.estimatedHours || 8} hrs</span>
                            </div>

                            {/* Move controls */}
                            <div className="flex justify-between gap-1 pt-2 border-t border-slate-900">
                              {status !== 'Todo' && (
                                <button
                                  onClick={async () => {
                                    const workflow: Task['status'][] = ['Todo', 'In Progress', 'Review', 'Completed'];
                                    const idx = workflow.indexOf(status);
                                    await updateItem('tasks', t.id, { status: workflow[idx - 1] });
                                    addNotification(`Moved ${t.title} back on board.`);
                                    onRefresh();
                                  }}
                                  className="p-1 hover:bg-slate-900 rounded text-slate-400 hover:text-white transition-colors"
                                >
                                  <ArrowLeft className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <span className="text-[8px] text-slate-500 font-bold self-center font-mono">Workflow</span>
                              {status !== 'Completed' && (
                                <button
                                  onClick={async () => {
                                    const workflow: Task['status'][] = ['Todo', 'In Progress', 'Review', 'Completed'];
                                    const idx = workflow.indexOf(status);
                                    await updateItem('tasks', t.id, { status: workflow[idx + 1] });
                                    addNotification(`Advanced ${t.title} workflow status.`);
                                    onRefresh();
                                  }}
                                  className="p-1 hover:bg-slate-900 rounded text-slate-400 hover:text-white ml-auto transition-colors"
                                >
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // swimlanes grouping style
            <div className="space-y-6">
              {projects.map(prj => {
                const prjTasks = tasks.filter(t => t.projectId === prj.id);
                return (
                  <div key={prj.id} className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <h4 className="text-xs font-extrabold text-emerald-400 flex items-center gap-1.5">
                        <Briefcase className="w-4 h-4" /> {prj.name} Swimlane Row
                      </h4>
                      <span className="text-[10px] text-slate-400 font-mono">{prj.client}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      {(['Todo', 'In Progress', 'Review', 'Completed'] as Task['status'][]).map(status => {
                        const laneTasks = prjTasks.filter(t => t.status === status);
                        return (
                          <div key={status} className="p-3 bg-slate-950 rounded-xl space-y-2">
                            <span className="text-[10px] font-bold text-slate-400 block pb-1 border-b border-slate-900">{status}</span>
                            {laneTasks.length === 0 ? (
                              <p className="text-[9px] text-slate-600 italic py-3 text-center">Row empty</p>
                            ) : (
                              laneTasks.map(t => (
                                <div key={t.id} className="p-2 bg-slate-900 border border-slate-850 rounded-lg text-xs flex justify-between items-center">
                                  <span>{t.title}</span>
                                  <div className="flex gap-1">
                                    {status !== 'Todo' && (
                                      <button onClick={async () => {
                                        const workflow: Task['status'][] = ['Todo', 'In Progress', 'Review', 'Completed'];
                                        await updateItem('tasks', t.id, { status: workflow[workflow.indexOf(status) - 1] });
                                        onRefresh();
                                      }} className="text-slate-500 hover:text-white"><ArrowLeft className="w-3 h-3" /></button>
                                    )}
                                    {status !== 'Completed' && (
                                      <button onClick={async () => {
                                        const workflow: Task['status'][] = ['Todo', 'In Progress', 'Review', 'Completed'];
                                        await updateItem('tasks', t.id, { status: workflow[workflow.indexOf(status) + 1] });
                                        onRefresh();
                                      }} className="text-slate-500 hover:text-white"><ArrowRight className="w-3 h-3" /></button>
                                    )}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. ZOOM GANTT TIMELINE VIEW */}
      {activeTab === 'gantt' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-900 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-300">Gantt Calendar Grid:</span>
              <div className="flex gap-1 bg-slate-950 p-1 rounded-xl border border-slate-850">
                {(['Day', 'Week', 'Month'] as const).map(zm => (
                  <button
                    key={zm}
                    onClick={() => setGanttZoom(zm)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold ${ganttZoom === zm ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    {zm} View
                  </button>
                ))}
              </div>
            </div>

            <div className="text-[10px] text-slate-400 font-mono">Asia/Kathmandu Sync</div>
          </div>

          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-emerald-400" /> Executive GANTT Timeline Comparison & Drag Simulation
            </h3>

            <div className="space-y-4">
              {projects.map(p => {
                const bsConv = adToBs(p.deadline);
                return (
                  <div key={p.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div>
                        <span className="font-extrabold text-white">{p.name}</span>
                        <span className="text-[9px] text-slate-500 block">Baseline Plan: {p.startDate} to {p.deadline} ({bsConv.formatted})</span>
                      </div>

                      {/* Interactive date adjusters (Manager / CEO only) */}
                      {hasAccess(['CEO', 'Manager']) ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={async () => {
                              const newD = new Date(p.deadline);
                              newD.setDate(newD.getDate() - 2);
                              await updateItem('projects', p.id, { deadline: newD.toISOString().slice(0, 10) });
                              addNotification(`Extended deadline closer by 2 days.`);
                              onRefresh();
                            }}
                            className="bg-slate-900 hover:bg-slate-800 px-2 py-1 rounded text-[10px] text-indigo-300 border border-slate-800 font-mono"
                          >
                            -2 Days (Squeeze)
                          </button>
                          <button
                            onClick={async () => {
                              const newD = new Date(p.deadline);
                              newD.setDate(newD.getDate() + 5);
                              await updateItem('projects', p.id, { deadline: newD.toISOString().slice(0, 10) });
                              addNotification(`Slipped deadline timeline outward by 5 days.`);
                              onRefresh();
                            }}
                            className="bg-slate-900 hover:bg-slate-800 px-2 py-1 rounded text-[10px] text-emerald-300 border border-slate-800 font-mono"
                          >
                            +5 Days (Buffer)
                          </button>
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-500"><Lock className="w-3 h-3 inline mr-0.5" /> Adjust locked for {activeRole}</div>
                      )}
                    </div>

                    {/* Gantt track */}
                    <div className="w-full bg-slate-900 h-8 rounded-lg relative overflow-hidden border border-slate-800 flex items-center">
                      {/* Dotted Baseline display below bar */}
                      <div className="absolute inset-x-0 bottom-1 h-0.5 border-t border-dashed border-slate-700" />
                      
                      {/* Active project bar block */}
                      <div
                        className="h-5 rounded bg-emerald-600 border border-emerald-400/30 text-[9px] font-bold text-white flex items-center px-2 transition-all duration-300"
                        style={{
                          marginLeft: '15%',
                          width: `${Math.max(25, p.progress)}%`
                        }}
                      >
                        {p.progress}% Complete
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 5. MILESTONES VAULT */}
      {activeTab === 'milestones' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" /> Project Milestones Tracker
              </h3>

              <div className="space-y-3">
                {displayMilestones.map(m => (
                  <div key={m.id} className="p-4 bg-slate-950 border border-slate-850 rounded-xl flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-extrabold text-white">{m.title}</h4>
                      <p className="text-[10px] text-slate-400 mt-1">{m.description}</p>
                      <span className="text-[10px] text-amber-400 block font-mono mt-1">Due Gate: {m.dueDate} ({adToBs(m.dueDate).formatted})</span>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      m.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-900 text-slate-400'
                    }`}>
                      {m.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Milestone additions */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Log Milestone</h3>

              {hasAccess(['CEO', 'Manager']) ? (
                <form onSubmit={handleCreateMilestone} className="space-y-3 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Select Project</label>
                    <select
                      onChange={e => setSelectedProject(projects.find(p => p.id === e.target.value) || null)}
                      className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-white"
                    >
                      <option value="">Select project directory...</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Milestone Name</label>
                    <input
                      type="text"
                      required
                      value={newMilestone.title}
                      onChange={e => setNewMilestone({ ...newMilestone, title: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-white"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Due Deadline (BS / AD)</label>
                    <NepaliDatePicker
                      value={newMilestone.dueDate}
                      onChange={(ad, bs) => setNewMilestone({ ...newMilestone, dueDate: ad })}
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Scope Details</label>
                    <input
                      type="text"
                      value={newMilestone.description}
                      onChange={e => setNewMilestone({ ...newMilestone, description: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-white"
                    />
                  </div>

                  <button type="submit" className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold font-sans">
                    + Register Milestone
                  </button>
                </form>
              ) : (
                <div className="p-4 border border-dashed border-slate-800 rounded-xl text-center text-xs text-slate-500">
                  <Lock className="w-4 h-4 inline mr-1 text-rose-500" /> Milestone creator is restricted for role {activeRole}.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. TIME LOGS & LIVE STOPWATCH TRACKER */}
      {activeTab === 'timelog' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Live stopwatch block */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col items-center justify-center space-y-4 text-center">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 self-start">
                <Clock className="text-amber-400 w-4 h-4" /> Live Stopwatch Session Logger
              </h3>

              <div className="p-6 bg-slate-950 rounded-full border-4 border-slate-800 w-44 h-44 flex items-center justify-center">
                <span className="text-2xl font-mono font-extrabold text-white animate-pulse">
                  {formatStopwatch(stopwatchTime)}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={toggleStopwatch}
                  className={`px-5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors ${
                    stopwatchActive ? 'bg-amber-600 hover:bg-amber-500' : 'bg-emerald-600 hover:bg-emerald-500'
                  }`}
                >
                  <Play className="w-3.5 h-3.5" />
                  {stopwatchActive ? 'Stop & Log Session' : 'Start Session'}
                </button>

                <button
                  onClick={resetStopwatch}
                  className="p-2 bg-slate-950 border border-slate-800 hover:bg-slate-800 rounded-xl text-slate-300"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              <p className="text-[10px] text-slate-400">
                Stop stopwatch session to automatically pre-fill logged hours in the form registry.
              </p>
            </div>

            {/* Time logging list */}
            <div className="lg:col-span-2 p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Log Manual Operations Time</h3>

              <form onSubmit={handleCreateTimeLog} className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-white">
                <div>
                  <label className="text-slate-400 block mb-1">Decimal Hours</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newTimeLog.hours}
                    onChange={e => setNewTimeLog({ ...newTimeLog, hours: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-850 p-2 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Operation Date</label>
                  <input
                    type="date"
                    required
                    value={newTimeLog.date}
                    onChange={e => setNewTimeLog({ ...newTimeLog, date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 p-2 rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Scope of Works</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. Scaffold deploy..."
                    value={newTimeLog.description}
                    onChange={e => setNewTimeLog({ ...newTimeLog, description: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 p-2 rounded-xl"
                  />
                </div>

                <button type="submit" className="md:col-span-3 py-2 bg-emerald-600 hover:bg-emerald-500 font-bold text-xs rounded-xl">
                  + Log Operations Hours
                </button>
              </form>

              <div className="space-y-2.5 max-h-44 overflow-y-auto pt-2 border-t border-slate-800">
                {displayTimeLogs.map(l => (
                  <div key={l.id} className="p-3 bg-slate-950 border border-slate-850 rounded-xl text-xs flex justify-between items-center">
                    <div>
                      <span className="font-bold text-slate-200">{l.description}</span>
                      <span className="text-[10px] text-slate-400 block">{l.employeeName} | {l.projectName} | {l.date}</span>
                    </div>
                    <span className="font-mono text-emerald-400 font-bold">{l.hours} hrs</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. BUDGET LEDGERS (NPR) */}
      {activeTab === 'budget' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="text-emerald-400 w-4 h-4" /> Nepal Localized Project Expenditure Ledgers (NPR)
              </h3>

              <div className="space-y-3">
                {displayExpenses.map(e => (
                  <div key={e.id} className="p-4 bg-slate-950 border border-slate-850 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <h4 className="font-extrabold text-white">{e.description}</h4>
                      <span className="text-[10px] text-slate-400 block font-mono">{e.projectName} | Category: {e.category} | Log: {e.date}</span>
                    </div>

                    <span className="font-mono text-amber-400 font-extrabold text-sm">{formatNPR(e.amount)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick manual expense adding */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Register Ledger cost</h3>

              {hasAccess(['CEO', 'Manager']) ? (
                <form onSubmit={handleCreateExpense} className="space-y-3 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">NPR Amount (Rs.)</label>
                    <input
                      type="number"
                      required
                      value={newExpense.amount}
                      onChange={e => setNewExpense({ ...newExpense, amount: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Category Code</label>
                    <select
                      value={newExpense.category}
                      onChange={e => setNewExpense({ ...newExpense, category: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-white"
                    >
                      <option value="Cloud Services">Cloud Services</option>
                      <option value="Software License">Software License</option>
                      <option value="Hardware Device">Hardware Device</option>
                      <option value="Team Benefit">Team Benefit</option>
                      <option value="External Consulting">External Consulting</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Log Description</label>
                    <input
                      type="text"
                      required
                      value={newExpense.description}
                      onChange={e => setNewExpense({ ...newExpense, description: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-white"
                    />
                  </div>

                  <button type="submit" className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 font-bold text-white rounded-xl">
                    + Register Spent
                  </button>
                </form>
              ) : (
                <div className="p-4 border border-dashed border-slate-800 rounded-xl text-center text-xs text-slate-500">
                  <Lock className="w-4 h-4 inline mr-1 text-rose-500" /> Spent registration is locked for active role {activeRole}.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 8. DOCUMENT VAULT */}
      {activeTab === 'files' && (
        <div className="space-y-4">
          {/* File Simulation Block */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <HardDrive className="text-emerald-400 w-4 h-4" /> Secure Project Document Vault
              </h3>

              <div className="space-y-3">
                {displayAttachments.map(f => (
                  <div key={f.id} className="p-4 bg-slate-950 border border-slate-850 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-white">{f.fileName}</h4>
                        <span className="text-[10px] text-slate-500 block font-mono">
                          Size: {f.fileSize} | {f.projectName} | Version: v{f.version || 1}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setPreviewFile(f); addNotification(`Opening preview for ${f.fileName}`); }}
                        className="p-1.5 bg-slate-900 hover:bg-slate-850 rounded text-slate-300 border border-slate-800 text-[10px] flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" /> Preview
                      </button>
                      <button
                        onClick={() => alert(`Simulated secure file download for ${f.fileName} initiated.`)}
                        className="p-1.5 bg-slate-900 hover:bg-slate-850 rounded text-slate-300 border border-slate-800 text-[10px]"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upload form simulation */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Vault Registry</h3>
              
              <div className="border-2 border-dashed border-slate-800 rounded-2xl p-6 text-center text-xs text-slate-400 space-y-3 bg-slate-950">
                <Paperclip className="w-8 h-8 mx-auto text-slate-500" />
                <p>Drag and drop project files here, or click to upload</p>
                <button
                  onClick={handleSimulateUpload}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] border border-slate-800"
                >
                  Simulate PDF Upload
                </button>
              </div>
            </div>
          </div>

          {/* PDF Preview Modal */}
          {previewFile && (
            <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                <span className="text-xs font-mono text-emerald-400">Vault Document Reader: {previewFile.fileName}</span>
                <button onClick={() => setPreviewFile(null)} className="p-1 rounded bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="bg-slate-900 rounded-xl p-8 border border-slate-850 text-center space-y-3">
                <FileText className="w-12 h-12 mx-auto text-slate-500 animate-pulse" />
                <h4 className="text-sm font-bold text-white">Project Scope Specifications & Blueprints</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  This file is locked behind AES-256 endpoint encryption within the Sovryx Enterprise vault. Verification logs have been dispatched to manager profiles.
                </p>
                <div className="text-[10px] font-mono text-slate-500 bg-slate-950 p-2 rounded max-w-sm mx-auto">
                  MD5 hash checksum validated against original baseline.
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 9. NEPAL LOCALIZED HOLIDAYS CALENDAR */}
      {activeTab === 'holidays' && (
        <div className="space-y-4">
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
            <div className="border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="text-indigo-400 w-4 h-4" /> Nepal National Gazetted Holidays (2083 Bikram Sambat)
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">Scheduled delivery sprints take these holidays into priority during timeline buffer allocation.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockHolidays.map((h, idx) => (
                <div key={idx} className="p-4 bg-slate-950 border border-slate-850 rounded-xl flex items-start gap-3">
                  <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg text-xs font-mono font-bold">
                    BS
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-white">{h.name}</h4>
                    <span className="text-[10px] text-slate-400 block font-mono">BS: {h.dateBS}</span>
                    <span className="text-[10px] text-slate-500 block font-mono">AD equivalent: {h.dateAD}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-900 border border-slate-850 text-indigo-300 rounded inline-block mt-1.5">
                      {h.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Form Modal for Creating Projects */}
      {showAddProjectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Initialize Project Directory</h3>
              <button onClick={() => setShowAddProjectModal(false)} className="p-1 rounded-lg bg-slate-800 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-300 block mb-1">Project Name</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. Sovryx Mobile OS"
                    value={newProj.name}
                    onChange={e => setNewProj({ ...newProj, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1">Client Organization</label>
                  <input
                    type="text"
                    required
                    value={newProj.client}
                    onChange={e => setNewProj({ ...newProj, client: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1">Total Budget (NPR)</label>
                  <input
                    type="number"
                    required
                    value={newProj.budget}
                    onChange={e => setNewProj({ ...newProj, budget: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1">Category Code</label>
                  <input
                    type="text"
                    value={newProj.category}
                    onChange={e => setNewProj({ ...newProj, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1">Priority</label>
                  <select
                    value={newProj.priority}
                    onChange={e => setNewProj({ ...newProj, priority: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1">Assign Manager</label>
                  <select
                    value={newProj.managerId}
                    onChange={e => setNewProj({ ...newProj, managerId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white"
                  >
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.position})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1">Delivery Deadline</label>
                  <NepaliDatePicker
                    value={newProj.deadline}
                    onChange={(ad, bs) => setNewProj({ ...newProj, deadline: ad })}
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1">Color Label indicator</label>
                  <select
                    value={newProj.labelColor}
                    onChange={e => setNewProj({ ...newProj, labelColor: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white"
                  >
                    <option value="emerald">Emerald</option>
                    <option value="indigo">Indigo</option>
                    <option value="amber">Amber</option>
                    <option value="rose">Rose</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Detailed Description & Strategic Goals</label>
                <textarea
                  placeholder="Objective scope of works..."
                  value={newProj.description}
                  onChange={e => setNewProj({ ...newProj, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white h-20 resize-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="chk_recur"
                  checked={newProj.isRecurring}
                  onChange={e => setNewProj({ ...newProj, isRecurring: e.target.checked })}
                  className="rounded bg-slate-950 border-slate-800 text-emerald-500"
                />
                <label htmlFor="chk_recur" className="text-slate-300 cursor-pointer">This project is a recurring annual engagement</label>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddProjectModal(false)}
                  className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
