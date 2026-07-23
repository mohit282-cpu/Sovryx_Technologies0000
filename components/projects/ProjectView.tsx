'use client';

import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Plus,
  Search,
  Calendar,
  DollarSign,
  AlertTriangle,
  Users,
  CheckSquare,
  Sparkles,
  ShieldAlert,
  ChevronRight,
  X,
  FileText,
  Clock,
  Brain,
  ListTodo,
  LayoutGrid,
  TrendingUp,
  Sliders,
  FolderOpen,
  PieChart,
  HardDrive,
  UserCheck,
  Play,
  RotateCcw,
  CheckCircle2,
  Paperclip,
  Trash2,
  Download,
  Flame,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { Project, Employee, Task } from '@/types';
import { createItem, updateItem, deleteItem, subscribeCollection } from '@/lib/services/firestore';
import { callAI } from '@/lib/aiClient';
import EmptyState from '@/components/ui/EmptyState';
import NepaliDatePicker from '@/components/ui/NepaliDatePicker';
import { adToBs, formatNPR } from '@/lib/nepaliCalendar';

interface ProjectViewProps {
  projects: Project[];
  employees: Employee[];
  tasks: Task[];
  onRefresh: () => void;
}

// Sub-interfaces for tracking custom states in Firestore
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
}

export default function ProjectView({ projects, employees, tasks, onRefresh }: ProjectViewProps) {
  // Navigation Tabs
  type TabId = 'dashboard' | 'projects' | 'kanban' | 'gantt' | 'resources' | 'timelog' | 'budget' | 'files';
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');

  // Search & Filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [aiAnalysisText, setAiAnalysisText] = useState<string>('');
  const [loadingAI, setLoadingAI] = useState(false);

  // Kanban Specific States
  const [kanbanProjectFilter, setKanbanProjectFilter] = useState<string>('All');

  // New Project Form
  const [newProject, setNewProject] = useState({
    name: '',
    client: 'Nexus Corp Global',
    budget: 250000,
    status: 'Planning' as const,
    deadline: '2026-10-31',
    assignedEmployeeIds: [] as string[]
  });

  // Time Logs List & Form State
  const [timeLogs, setTimeLogs] = useState<ProjectTimeLog[]>([]);
  const [newTimeLog, setNewTimeLog] = useState({
    projectId: '',
    taskId: '',
    hours: 8,
    date: new Date().toISOString().slice(0, 10),
    description: '',
    employeeId: employees[0]?.id || 'EMP0001'
  });

  // Expenses List & Form State
  const [expenses, setExpenses] = useState<ProjectExpense[]>([]);
  const [newExpense, setNewExpense] = useState({
    projectId: '',
    category: 'Cloud Services',
    amount: 15000,
    description: 'AWS Production Host bill',
    date: new Date().toISOString().slice(0, 10)
  });

  // Attachments List & Form State
  const [attachments, setAttachments] = useState<ProjectAttachment[]>([]);
  const [newAttachment, setNewAttachment] = useState({
    projectId: '',
    fileName: '',
    category: 'Technical Doc',
    fileSize: '2.4 MB'
  });

  // Subscribe to auxiliary sub-tables
  useEffect(() => {
    const unsubTime = subscribeCollection<ProjectTimeLog>('timeLogs', (data) => setTimeLogs(data));
    const unsubExp = subscribeCollection<ProjectExpense>('expenses', (data) => setExpenses(data));
    const unsubFiles = subscribeCollection<ProjectAttachment>('projectAttachments', (data) => setAttachments(data));

    return () => {
      unsubTime();
      unsubExp();
      unsubFiles();
    };
  }, []);

  // Pre-populate time tracking, budget expenses, and document files with highly realistic fallback lists if empty
  const getDisplayTimeLogs = (): ProjectTimeLog[] => {
    if (timeLogs.length > 0) return timeLogs;
    // Default high-quality fallbacks
    return [
      {
        projectId: projects[0]?.id || 'PRJ1',
        projectName: projects[0]?.name || 'NextGen Neural OS',
        taskId: 'TSK-1',
        taskTitle: 'Establish Base Router Infrastructure',
        employeeId: 'EMP0005',
        employeeName: 'Sita Gurung',
        hours: 6,
        date: '2026-07-20',
        description: 'Completed Next.js base middleware optimization'
      },
      {
        projectId: projects[0]?.id || 'PRJ1',
        projectName: projects[0]?.name || 'NextGen Neural OS',
        taskId: 'TSK-2',
        taskTitle: 'Integrate Firestore Database',
        employeeId: 'EMP0004',
        employeeName: 'Sunil Thapa',
        hours: 8,
        date: '2026-07-21',
        description: 'Wrote abstract document subscribers and CRUD tests'
      }
    ];
  };

  const getDisplayExpenses = (): ProjectExpense[] => {
    if (expenses.length > 0) return expenses;
    return [
      {
        projectId: projects[0]?.id || 'PRJ1',
        projectName: projects[0]?.name || 'NextGen Neural OS',
        amount: 45000,
        category: 'Software License',
        description: 'Enterprise AI API credits',
        date: '2026-07-15'
      },
      {
        projectId: projects[1]?.id || 'PRJ2',
        projectName: projects[1]?.name || 'Sovryx ERP Hub',
        amount: 18500,
        category: 'Cloud Services',
        description: 'Vercel premium serverless deployment',
        date: '2026-07-18'
      }
    ];
  };

  const getDisplayAttachments = (): ProjectAttachment[] => {
    if (attachments.length > 0) return attachments;
    return [
      {
        projectId: projects[0]?.id || 'PRJ1',
        projectName: projects[0]?.name || 'NextGen Neural OS',
        fileName: 'System_Architecture_V2.pdf',
        fileSize: '4.8 MB',
        category: 'Specification',
        uploadedBy: 'Sunil Thapa',
        date: '2026-07-10'
      },
      {
        projectId: projects[1]?.id || 'PRJ2',
        projectName: projects[1]?.name || 'Sovryx ERP Hub',
        fileName: 'Client_Requirements_v1.docx',
        fileSize: '1.2 MB',
        category: 'Requirements',
        uploadedBy: 'Priya Adhikari',
        date: '2026-07-12'
      }
    ];
  };

  // Helper selectors
  const activeProjects = projects.filter((p) => p.status !== 'Completed');
  const totalBudget = projects.reduce((acc, p) => acc + (p.budget || 0), 0);
  const totalSpent = projects.reduce((acc, p) => acc + (p.spentBudget || 0), 0) + expenses.reduce((acc, e) => acc + e.amount, 0);
  const avgCompletion = projects.length > 0
    ? Math.round(projects.reduce((acc, p) => acc + (p.progress || 0), 0) / projects.length)
    : 0;

  // Filtered projects for Project Pipeline
  const filteredProjects = projects.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.client.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Handle Create Project
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.name) return;

    try {
      const prjId = `PRJ-${Math.floor(100 + Math.random() * 900)}`;
      await createItem<Omit<Project, 'id'>>('projects', {
        projectId: prjId,
        name: newProject.name,
        client: newProject.client,
        budget: Number(newProject.budget),
        spentBudget: 0,
        status: newProject.status,
        startDate: new Date().toISOString().split('T')[0],
        deadline: newProject.deadline,
        progress: 10,
        riskLevel: 'Low',
        employeeIds: newProject.assignedEmployeeIds
      });

      setShowAddModal(false);
      setNewProject({
        name: '',
        client: 'Nexus Corp Global',
        budget: 250000,
        status: 'Planning',
        deadline: '2026-10-31',
        assignedEmployeeIds: []
      });
      onRefresh();
    } catch (err: any) {
      alert('Error creating project: ' + err.message);
    }
  };

  // Handle Update Status
  const handleUpdateStatus = async (projectId: string, newStatus: Project['status'], riskLevel: Project['riskLevel'] = 'Low') => {
    try {
      await updateItem('projects', projectId, { status: newStatus, riskLevel });
      setSelectedProject(prev => prev && prev.id === projectId ? { ...prev, status: newStatus, riskLevel } : prev);
      onRefresh();
    } catch (err: any) {
      alert('Error updating status: ' + err.message);
    }
  };

  // Run AI Risk & Analysis
  const handleRunAIRiskDetection = async (prj: Project) => {
    setLoadingAI(true);
    setAiAnalysisText('');
    try {
      const projectTasks = tasks.filter(t => t.projectId === prj.id);
      const res = await callAI('project-summary', { project: prj, tasks: projectTasks });
      setAiAnalysisText(res);
    } catch (err: any) {
      setAiAnalysisText('Failed to run AI analysis: ' + err.message);
    } finally {
      setLoadingAI(false);
    }
  };

  // Delete Project
  const handleDeleteProject = async (id: string) => {
    if (confirm('Delete project from Sovryx OS database?')) {
      try {
        await deleteItem('projects', id);
        if (selectedProject?.id === id) setSelectedProject(null);
        onRefresh();
      } catch (err: any) {
        alert('Error deleting project: ' + err.message);
      }
    }
  };

  // Time log creation
  const handleLogTime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTimeLog.projectId || !newTimeLog.description) {
      alert('Please select a project and provide a description.');
      return;
    }

    const prj = projects.find(p => p.id === newTimeLog.projectId);
    const tsk = tasks.find(t => t.id === newTimeLog.taskId);
    const emp = employees.find(e => e.id === newTimeLog.employeeId);

    try {
      await createItem<Omit<ProjectTimeLog, 'id'>>('timeLogs', {
        projectId: newTimeLog.projectId,
        projectName: prj ? prj.name : 'Unknown Project',
        taskId: newTimeLog.taskId || 'General Task',
        taskTitle: tsk ? tsk.title : 'General Delivery Duty',
        employeeId: newTimeLog.employeeId,
        employeeName: emp ? emp.name : 'Aarav Sharma',
        hours: Number(newTimeLog.hours),
        date: newTimeLog.date,
        description: newTimeLog.description
      });

      // Update Task completed hours if matching
      if (tsk) {
        await updateItem('tasks', tsk.id, {
          actualHours: (tsk.actualHours || 0) + Number(newTimeLog.hours)
        });
      }

      setNewTimeLog(prev => ({
        ...prev,
        description: '',
        hours: 8
      }));
      onRefresh();
      alert('Time logged successfully!');
    } catch (err: any) {
      alert('Failed to log time: ' + err.message);
    }
  };

  // Budget expense creation
  const handleLogExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.projectId || !newExpense.description) {
      alert('Please fill out the project and budget description.');
      return;
    }

    const prj = projects.find(p => p.id === newExpense.projectId);

    try {
      await createItem<Omit<ProjectExpense, 'id'>>('expenses', {
        projectId: newExpense.projectId,
        projectName: prj ? prj.name : 'Unknown Project',
        amount: Number(newExpense.amount),
        category: newExpense.category,
        description: newExpense.description,
        date: newExpense.date
      });

      // Update spentBudget on project
      if (prj) {
        await updateItem('projects', prj.id, {
          spentBudget: (prj.spentBudget || 0) + Number(newExpense.amount)
        });
      }

      setNewExpense({
        projectId: '',
        category: 'Cloud Services',
        amount: 15000,
        description: '',
        date: new Date().toISOString().slice(0, 10)
      });
      onRefresh();
      alert('Expense logged successfully. Project budget spent was updated.');
    } catch (err: any) {
      alert('Failed to log expense: ' + err.message);
    }
  };

  // Attachment creation
  const handleAddAttachment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAttachment.projectId || !newAttachment.fileName) {
      alert('Please provide a file name and select a project.');
      return;
    }

    const prj = projects.find(p => p.id === newAttachment.projectId);

    try {
      await createItem<Omit<ProjectAttachment, 'id'>>('projectAttachments', {
        projectId: newAttachment.projectId,
        projectName: prj ? prj.name : 'Unknown Project',
        fileName: newAttachment.fileName,
        fileSize: newAttachment.fileSize,
        category: newAttachment.category,
        uploadedBy: 'Aarav Sharma (CEO)',
        date: new Date().toISOString().slice(0, 10)
      });

      setNewAttachment(prev => ({
        ...prev,
        fileName: ''
      }));
      onRefresh();
      alert('Document uploaded successfully to vault.');
    } catch (err: any) {
      alert('Failed to add attachment: ' + err.message);
    }
  };

  // Move task status in Kanban
  const handleMoveTaskStatus = async (taskId: string, nextStatus: Task['status']) => {
    try {
      await updateItem('tasks', taskId, { status: nextStatus });
      onRefresh();
    } catch (err: any) {
      alert('Error updating task status: ' + err.message);
    }
  };

  return (
    <div id="project_command_center" className="space-y-6 pb-12">
      
      {/* Visual Command Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5">
            <Briefcase className="w-6 h-6 text-emerald-400" />
            Project Command Center
          </h2>
          <p className="text-xs text-slate-400">
            Control Project Pipelines, Kanban Boards, Resource Overloads, GANTT Timelines, and Nepalese Currency Expenses
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-600/10 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create Project
        </button>
      </div>

      {/* Tab bar Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto bg-slate-900 border border-slate-800 p-1 rounded-2xl">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: PieChart },
          { id: 'projects', label: 'Project List', icon: LayoutGrid },
          { id: 'kanban', label: 'Kanban Board', icon: ListTodo },
          { id: 'gantt', label: 'Gantt Timeline', icon: Calendar },
          { id: 'resources', label: 'Resource Allocations', icon: Users },
          { id: 'timelog', label: 'Time Tracker', icon: Clock },
          { id: 'budget', label: 'Budget Ledger', icon: DollarSign },
          { id: 'files', label: 'Document Vault', icon: HardDrive }
        ].map((tab) => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabId)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <IconComponent className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* -------------------- 1. DASHBOARD VIEW -------------------- */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Active Deliverables</span>
                <span className="text-2xl font-extrabold text-white mt-1 block">{activeProjects.length}</span>
                <p className="text-[10px] text-emerald-400 font-semibold mt-0.5">In Dev Lifecycle</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Briefcase className="w-5 h-5" />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Portfolio Completion</span>
                <span className="text-2xl font-extrabold text-white mt-1 block">{avgCompletion}%</span>
                <p className="text-[10px] text-slate-400 mt-0.5">Across all objectives</p>
              </div>
              <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Financial Burn</span>
                <span className="text-2xl font-extrabold text-white mt-1 block">Rs. {totalSpent.toLocaleString()}</span>
                <p className="text-[10px] text-amber-400 font-semibold mt-0.5">Spent of Rs. {totalBudget.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Risk Incidents</span>
                <span className="text-2xl font-extrabold text-rose-400 mt-1 block">
                  {projects.filter(p => p.status === 'At Risk').length}
                </span>
                <p className="text-[10px] text-rose-300 italic mt-0.5">Needs immediate review</p>
              </div>
              <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Budget Progress Meter */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" /> Financial Burn Rate & Project Spent Indicators
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((p) => {
                const spent = p.spentBudget || 0;
                const budget = p.budget || 1;
                const ratio = Math.min(100, Math.round((spent / budget) * 100));
                return (
                  <div key={p.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">{p.name}</span>
                      <span className="text-slate-400 font-semibold">
                        Rs. {spent.toLocaleString()} / Rs. {budget.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${ratio > 85 ? 'bg-rose-500' : ratio > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${ratio}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-400">Budget Depletion</span>
                      <span className={`font-bold ${ratio > 85 ? 'text-rose-400' : 'text-slate-300'}`}>{ratio}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Core Visual Progress Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" /> Deliverables Risk & Progress Matrix
              </h3>
              <div className="space-y-3">
                {projects.slice(0, 4).map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${p.status === 'At Risk' ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-white text-xs">{p.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">Client: {p.client} | DL: {p.deadline}</p>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                        p.status === 'At Risk' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}>
                        {p.status}
                      </span>
                      <div className="text-xs font-bold text-slate-200">{p.progress}% Complete</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Brain className="w-4 h-4 text-emerald-400" /> CEO AI Portfolio Brief
              </h3>
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 text-xs leading-relaxed text-slate-300">
                <p>
                  <strong className="text-emerald-400">Scan Result:</strong> 
                  There are currently <strong className="text-white">{projects.length} active initiatives</strong>. Average development velocity is standing at <strong className="text-white">{avgCompletion}%</strong>.
                </p>
                <p>
                  No critical resource blockages detected. Portfolio budgets are in healthy zones, with average depleted funds sitting around <strong className="text-white">Rs. {(totalSpent / (totalBudget || 1) * 100).toFixed(1)}%</strong>. Recommend immediate timeline review for projects nearing Q3 deadline.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- 2. PROJECTS LIST PIPELINE -------------------- */}
      {activeTab === 'projects' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 p-3 rounded-2xl border border-slate-800">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search projects or clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-medium"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
              {['All', 'Planning', 'In Progress', 'At Risk', 'Completed'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                    filterStatus === st
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Projects Grid */}
          {filteredProjects.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title={projects.length === 0 ? "No Active Projects" : "No Matching Projects"}
              description={
                projects.length === 0
                  ? "Your project portfolio is currently empty. Initialize a new project to get started."
                  : `No projects match your search query "${searchTerm}" or filter "${filterStatus}".`
              }
              actionLabel="+ New Project"
              onAction={() => setShowAddModal(true)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProjects.map((prj) => {
                const assignedEmps = employees.filter(e => prj.employeeIds?.includes(e.id));
                const projectTasks = tasks.filter(t => t.projectId === prj.id);
                const completedTasksCount = projectTasks.filter(t => t.status === 'Completed').length;

                return (
                  <div
                    key={prj.id}
                    onClick={() => setSelectedProject(prj)}
                    className={`p-5 rounded-2xl bg-slate-900 border cursor-pointer hover:scale-[1.01] transition-all shadow-lg flex flex-col justify-between space-y-4 group ${
                      prj.status === 'At Risk' ? 'border-rose-500/50 hover:border-rose-400' : 'border-slate-800 hover:border-emerald-500/50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 font-mono block">{prj.projectId}</span>
                        <h3 className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors mt-0.5">
                          {prj.name}
                        </h3>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Briefcase className="w-3 h-3 text-emerald-400" /> {prj.client}
                        </p>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                        prj.status === 'At Risk'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          : prj.status === 'In Progress'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {prj.status}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-400">Milestone Delivery</span>
                        <span className="font-bold text-emerald-400">{prj.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${prj.status === 'At Risk' ? 'bg-rose-500' : 'bg-emerald-500'}`}
                          style={{ width: `${prj.progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-950 p-2 rounded-xl border border-slate-800">
                      <div>
                        <span className="text-slate-500 block">Total Budget</span>
                        <span className="font-bold text-slate-200">Rs. {prj.budget?.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Deadline</span>
                        <span className="font-bold text-amber-400">{prj.deadline}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                      <div className="flex -space-x-1.5">
                        {assignedEmps.slice(0, 3).map(e => (
                          <div
                            key={e.id}
                            className="w-6 h-6 rounded-full bg-slate-800 border border-slate-950 text-[9px] flex items-center justify-center text-white font-bold font-mono"
                            title={e.name}
                          >
                            {e.name.charAt(0)}
                          </div>
                        ))}
                        {assignedEmps.length > 3 && (
                          <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-950 text-[8px] flex items-center justify-center font-bold text-slate-300">
                            +{assignedEmps.length - 3}
                          </div>
                        )}
                      </div>

                      <span className="flex items-center gap-1 font-medium text-slate-300">
                        <CheckSquare className="w-3.5 h-3.5 text-purple-400" />
                        {completedTasksCount}/{projectTasks.length} Tasks
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* -------------------- 3. KANBAN BOARD VIEW -------------------- */}
      {activeTab === 'kanban' && (
        <div className="space-y-4">
          {/* Board controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 p-3 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-300">Project Column:</span>
              <select
                value={kanbanProjectFilter}
                onChange={(e) => setKanbanProjectFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 p-2 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="All">All Projects</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Interactive Status Transitions</span>
          </div>

          {/* Kanban Lanes */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {(['Todo', 'In Progress', 'Review', 'Completed'] as Task['status'][]).map((status) => {
              const laneTasks = tasks.filter(t => {
                const matchesPrj = kanbanProjectFilter === 'All' || t.projectId === kanbanProjectFilter;
                return matchesPrj && t.status === status;
              });

              return (
                <div key={status} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 flex flex-col min-h-[300px]">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${
                        status === 'Todo' ? 'bg-slate-400' :
                        status === 'In Progress' ? 'bg-amber-400' :
                        status === 'Review' ? 'bg-indigo-400' : 'bg-emerald-400'
                      }`} />
                      {status}
                    </span>
                    <span className="text-[10px] font-mono bg-slate-950 px-2 py-0.5 rounded text-slate-400 font-bold">
                      {laneTasks.length}
                    </span>
                  </div>

                  <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[500px]">
                    {laneTasks.length === 0 ? (
                      <p className="text-[10px] text-slate-500 italic text-center py-6">No tasks in lane</p>
                    ) : (
                      laneTasks.map((t) => (
                        <div key={t.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3 shadow hover:border-slate-700 transition-all group">
                          <div>
                            <span className="text-[9px] text-slate-500 font-mono block">{t.taskId}</span>
                            <h4 className="text-xs font-bold text-slate-200 mt-0.5">{t.title}</h4>
                            <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{t.description}</p>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                              t.priority === 'Urgent' || t.priority === 'High' ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-800 text-slate-400'
                            }`}>
                              {t.priority}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">{t.employeeName || 'Assigned'}</span>
                          </div>

                          <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full" style={{ width: `${t.completionPercentage || 0}%` }} />
                          </div>

                          {/* Interactive Move Buttons */}
                          <div className="pt-2 border-t border-slate-900 flex justify-between gap-1">
                            {status !== 'Todo' && (
                              <button
                                onClick={() => {
                                  const statuses: Task['status'][] = ['Todo', 'In Progress', 'Review', 'Completed'];
                                  const idx = statuses.indexOf(status);
                                  handleMoveTaskStatus(t.id, statuses[idx - 1]);
                                }}
                                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                                title="Move status left"
                              >
                                <ArrowLeft className="w-3 h-3" />
                              </button>
                            )}
                            <span className="text-[8px] font-bold text-slate-500 self-center">Transitions</span>
                            {status !== 'Completed' && (
                              <button
                                onClick={() => {
                                  const statuses: Task['status'][] = ['Todo', 'In Progress', 'Review', 'Completed'];
                                  const idx = statuses.indexOf(status);
                                  handleMoveTaskStatus(t.id, statuses[idx + 1]);
                                }}
                                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white ml-auto"
                                title="Move status right"
                              >
                                <ArrowRight className="w-3 h-3" />
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
        </div>
      )}

      {/* -------------------- 4. GANTT CHART VIEW -------------------- */}
      {activeTab === 'gantt' && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" /> Project Timeline Execution & Gantt Charts
              </h3>
              <span className="text-[10px] font-mono text-slate-400">2026 BS / AD Projection</span>
            </div>

            <div className="space-y-4">
              {projects.length === 0 ? (
                <p className="text-xs text-slate-500 italic text-center py-6">No active projects to construct timeline</p>
              ) : (
                projects.map((p) => {
                  const projectTasks = tasks.filter(t => t.projectId === p.id);
                  return (
                    <div key={p.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{p.name}</span>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                            {p.status}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">
                          {p.startDate} → {p.deadline} ({p.progress}% Complete)
                        </span>
                      </div>

                      {/* Timeline Bar */}
                      <div className="w-full bg-slate-900 h-3.5 rounded-full overflow-hidden relative border border-slate-800">
                        <div
                          className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                          style={{ width: `${Math.max(5, p.progress)}%` }}
                        />
                      </div>

                      {/* Milestones under project */}
                      {projectTasks.length > 0 && (
                        <div className="pl-3 border-l border-slate-800 space-y-1.5 pt-1">
                          {projectTasks.slice(0, 3).map(t => (
                            <div key={t.id} className="flex items-center justify-between text-[10px] text-slate-400">
                              <span className="truncate max-w-[240px] flex items-center gap-1.5">
                                <CheckCircle2 className={`w-3.5 h-3.5 ${t.status === 'Completed' ? 'text-emerald-400' : 'text-slate-600'}`} />
                                {t.title}
                              </span>
                              <span className="font-mono text-[9px] text-slate-500">{t.deadline}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* -------------------- 5. RESOURCE ALLOCATION -------------------- */}
      {activeTab === 'resources' && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" /> Team Resource Workload & Allocation Grid
              </h3>
              <span className="text-[10px] font-mono text-slate-400">Workforce Balance Panel</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {employees.map((emp) => {
                const assignedTasks = tasks.filter(t => t.employeeId === emp.id && t.status !== 'Completed');
                const totalHours = assignedTasks.reduce((acc, t) => acc + (t.estimatedHours || 0), 0);
                
                // Workload status
                let workload: 'Underloaded' | 'Balanced' | 'Overloaded' = 'Balanced';
                if (totalHours > 40) workload = 'Overloaded';
                else if (totalHours < 20) workload = 'Underloaded';

                return (
                  <div key={emp.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center font-bold font-mono text-xs text-white border border-slate-800">
                        {emp.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">{emp.name}</h4>
                        <p className="text-[10px] text-slate-400">{emp.position}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-400">Total Workload Hours</span>
                        <span className="font-bold text-slate-200">{totalHours} hrs / 40 max</span>
                      </div>
                      <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${workload === 'Overloaded' ? 'bg-rose-500' : workload === 'Underloaded' ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(100, (totalHours / 40) * 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-500">Allocation Health</span>
                      <span className={`font-bold px-2 py-0.5 rounded text-[8px] ${
                        workload === 'Overloaded' ? 'bg-rose-500/20 text-rose-300' :
                        workload === 'Underloaded' ? 'bg-amber-500/20 text-amber-300' :
                        'bg-emerald-500/20 text-emerald-300'
                      }`}>
                        {workload}
                      </span>
                    </div>

                    {/* Interactive Allocation Actions */}
                    <div className="pt-2 border-t border-slate-900">
                      <p className="text-[10px] text-slate-400">
                        Active Backlog tasks: <strong className="text-white">{assignedTasks.length}</strong>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* -------------------- 6. TIME TRACKER VIEW -------------------- */}
      {activeTab === 'timelog' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Logging form */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" /> Log Deliverable Hours
            </h3>

            <form onSubmit={handleLogTime} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">Select Project *</label>
                <select
                  required
                  value={newTimeLog.projectId}
                  onChange={(e) => {
                    const prjId = e.target.value;
                    const prjTasks = tasks.filter(t => t.projectId === prjId);
                    setNewTimeLog(prev => ({
                      ...prev,
                      projectId: prjId,
                      taskId: prjTasks[0]?.id || ''
                    }));
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- Choose Project --</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Select Delivery Task</label>
                <select
                  value={newTimeLog.taskId}
                  onChange={(e) => setNewTimeLog({ ...newTimeLog, taskId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">General Work / Other</option>
                  {tasks.filter(t => t.projectId === newTimeLog.projectId).map(t => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 block mb-1">Hours Logged</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={24}
                    value={newTimeLog.hours}
                    onChange={(e) => setNewTimeLog({ ...newTimeLog, hours: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={newTimeLog.date}
                    onChange={(e) => setNewTimeLog({ ...newTimeLog, date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Resource Logging Account</label>
                <select
                  value={newTimeLog.employeeId}
                  onChange={(e) => setNewTimeLog({ ...newTimeLog, employeeId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                >
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.name} ({e.position})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Work Description *</label>
                <textarea
                  required
                  placeholder="Summarize engineering milestone completed..."
                  value={newTimeLog.description}
                  onChange={(e) => setNewTimeLog({ ...newTimeLog, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500 h-20"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold p-2.5 rounded-xl transition-all"
              >
                Log Labor Hours
              </button>
            </form>
          </div>

          {/* Logs History */}
          <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Recent Labor Time Log Entries
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2.5 font-bold">Employee</th>
                    <th className="py-2.5 font-bold">Project & Task</th>
                    <th className="py-2.5 font-bold">Log Details</th>
                    <th className="py-2.5 font-bold">Hours</th>
                    <th className="py-2.5 font-bold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {getDisplayTimeLogs().map((entry, idx) => (
                    <tr key={idx} className="hover:bg-slate-950/30">
                      <td className="py-2.5 font-bold text-white">{entry.employeeName}</td>
                      <td className="py-2.5">
                        <p className="font-semibold text-slate-300">{entry.projectName}</p>
                        <p className="text-[10px] text-slate-500">{entry.taskTitle}</p>
                      </td>
                      <td className="py-2.5 text-slate-400 italic text-[11px] max-w-[180px] truncate" title={entry.description}>
                        {entry.description}
                      </td>
                      <td className="py-2.5 font-bold font-mono text-emerald-400">{entry.hours} hrs</td>
                      <td className="py-2.5 font-mono text-slate-400">{entry.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- 7. BUDGET TRACKING VIEW -------------------- */}
      {activeTab === 'budget' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Log Expense Form */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 font-sans">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" /> Log Capital Expense
            </h3>

            <form onSubmit={handleLogExpense} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">Target Project *</label>
                <select
                  required
                  value={newExpense.projectId}
                  onChange={(e) => setNewExpense({ ...newExpense, projectId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- Choose Project --</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Expense Category</label>
                <select
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500 font-medium"
                >
                  <option value="Cloud Services">Cloud Services</option>
                  <option value="Software License">Software License</option>
                  <option value="Hardware Device">Hardware Device</option>
                  <option value="Team Benefit">Team Benefit</option>
                  <option value="External Consulting">External Consulting</option>
                  <option value="Other Overhead">Other Overhead</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 block mb-1">Cost Amount (NPR)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={newExpense.date}
                    onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Transaction Note *</label>
                <textarea
                  required
                  placeholder="AWS hosting server deployment costs..."
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500 h-20"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold p-2.5 rounded-xl transition-all"
              >
                Record Expense & Update Project Budget
              </button>
            </form>
          </div>

          {/* Expenses History */}
          <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Expense Ledger & cost distribution
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2.5 font-bold">Category</th>
                    <th className="py-2.5 font-bold">Project Allocation</th>
                    <th className="py-2.5 font-bold">Description</th>
                    <th className="py-2.5 font-bold">Amount</th>
                    <th className="py-2.5 font-bold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {getDisplayExpenses().map((expense, idx) => (
                    <tr key={idx} className="hover:bg-slate-950/30">
                      <td className="py-2.5">
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-950 border border-slate-800 text-slate-300">
                          {expense.category}
                        </span>
                      </td>
                      <td className="py-2.5 font-bold text-slate-200">{expense.projectName}</td>
                      <td className="py-2.5 text-slate-400 italic max-w-[180px] truncate">{expense.description}</td>
                      <td className="py-2.5 font-bold font-mono text-rose-400">Rs. {expense.amount.toLocaleString()}</td>
                      <td className="py-2.5 font-mono text-slate-400">{expense.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- 8. SECURE DOCUMENT FILES VAULT -------------------- */}
      {activeTab === 'files' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload File Form */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-emerald-400" /> Vault Document Uploader
            </h3>

            <form onSubmit={handleAddAttachment} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">Project Link *</label>
                <select
                  required
                  value={newAttachment.projectId}
                  onChange={(e) => setNewAttachment({ ...newAttachment, projectId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- Choose Project --</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Document File Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. System_Schema_v1.png"
                  value={newAttachment.fileName}
                  onChange={(e) => setNewAttachment({ ...newAttachment, fileName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 block mb-1">Doc Category</label>
                  <select
                    value={newAttachment.category}
                    onChange={(e) => setNewAttachment({ ...newAttachment, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500 font-medium"
                  >
                    <option value="Technical Doc">Technical Doc</option>
                    <option value="Specification">Specification</option>
                    <option value="Requirements">Requirements</option>
                    <option value="Agreement">Agreement</option>
                    <option value="Milestone Asset">Milestone Asset</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Simulated Size</label>
                  <input
                    type="text"
                    required
                    placeholder="2.4 MB"
                    value={newAttachment.fileSize}
                    onChange={(e) => setNewAttachment({ ...newAttachment, fileSize: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="border border-dashed border-slate-800 bg-slate-950 rounded-xl p-5 text-center space-y-2">
                <Paperclip className="w-5 h-5 text-indigo-400 mx-auto" />
                <p className="text-[10px] text-slate-400">Drag files here or utilize manual logging above</p>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold p-2.5 rounded-xl transition-all"
              >
                Log File to Vault
              </button>
            </form>
          </div>

          {/* Files List */}
          <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Project Vault Artifacts & Documents
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {getDisplayAttachments().map((file, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 hover:border-slate-700 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white truncate max-w-[160px]" title={file.fileName}>
                          {file.fileName}
                        </h4>
                        <span className="text-[9px] text-slate-500 block">Category: {file.category}</span>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono text-slate-400">{file.fileSize}</span>
                  </div>

                  <div className="bg-slate-900 p-2 rounded-lg text-[10px] text-slate-400 font-mono space-y-0.5">
                    <p className="truncate">Project: {file.projectName}</p>
                    <p>Uploaded: {file.date} by {file.uploadedBy}</p>
                  </div>

                  <div className="flex justify-end gap-2 pt-1 border-t border-slate-900">
                    <button
                      onClick={() => alert(`Simulated downloading secure document artifact: ${file.fileName}`)}
                      className="p-1 text-slate-400 hover:text-white"
                      title="Download Secure File"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* -------------------- SELECTED PROJECT DETAIL MODAL -------------------- */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-3xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
              <div>
                <span className="text-xs text-emerald-400 font-mono">{selectedProject.projectId}</span>
                <h3 className="text-lg font-bold text-white">{selectedProject.name}</h3>
                <p className="text-xs text-slate-400">Client: {selectedProject.client}</p>
              </div>
              <button onClick={() => setSelectedProject(null)} className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar text-xs">
              <div className="flex items-center justify-between p-4 bg-slate-900 rounded-xl border border-slate-800">
                <span className="font-bold text-white">Project Status Command:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpdateStatus(selectedProject.id, 'In Progress', 'Low')}
                    className="px-3 py-1 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-lg font-semibold hover:bg-emerald-600 hover:text-white transition-colors"
                  >
                    Mark Healthy
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedProject.id, 'At Risk', 'High')}
                    className="px-3 py-1 bg-rose-600/20 text-rose-400 border border-rose-500/30 rounded-lg font-semibold hover:bg-rose-600 hover:text-white transition-colors"
                  >
                    Mark At Risk
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedProject.id, 'Completed', 'Low')}
                    className="px-3 py-1 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-lg font-semibold hover:bg-indigo-600 hover:text-white transition-colors"
                  >
                    Mark Completed
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white flex items-center gap-2">
                    <Brain className="w-4 h-4 text-emerald-400" /> AI Project Risk & Milestone Brief
                  </h4>
                  <button
                    onClick={() => handleRunAIRiskDetection(selectedProject)}
                    disabled={loadingAI}
                    className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-semibold"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {loadingAI ? 'Scanning...' : 'Analyze Project via AI'}
                  </button>
                </div>

                {aiAnalysisText ? (
                  <div className="p-3 bg-slate-950 rounded-xl text-slate-200 whitespace-pre-wrap leading-relaxed text-xs border border-slate-800">
                    {aiAnalysisText}
                  </div>
                ) : (
                  <p className="text-slate-400 text-xs italic">
                    Run AI analysis to examine associated tasks, team capacity, and budget depletion rate.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-200">Assigned Team Members</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {employees.filter(e => selectedProject.employeeIds?.includes(e.id)).map(emp => (
                    <div key={emp.id} className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-950 text-white font-bold font-mono flex items-center justify-center border border-slate-800">
                        {emp.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-white">{emp.name}</p>
                        <p className="text-[10px] text-slate-400">{emp.position}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-between">
              <button
                onClick={() => handleDeleteProject(selectedProject.id)}
                className="text-rose-400 hover:text-rose-300 font-semibold"
              >
                Delete Project
              </button>
              <button onClick={() => setSelectedProject(null)} className="px-4 py-2 bg-slate-800 text-white rounded-xl font-bold">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- NEW PROJECT CREATION MODAL -------------------- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-emerald-400" />
                New Company Project
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">Project Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NextGen Neural OS"
                  value={newProject.name}
                  onChange={e => setNewProject({ ...newProject, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Client Name</label>
                <input
                  type="text"
                  placeholder="Nexus Corp Global"
                  value={newProject.client}
                  onChange={e => setNewProject({ ...newProject, client: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 block mb-1">Total Budget (NPR)</label>
                  <input
                    type="number"
                    value={newProject.budget}
                    onChange={e => setNewProject({ ...newProject, budget: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Deadline (BS / AD)</label>
                  <NepaliDatePicker
                    value={newProject.deadline}
                    onChange={val => setNewProject({ ...newProject, deadline: val })}
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Assign Employees</label>
                <div className="max-h-32 overflow-y-auto space-y-1 bg-slate-900 p-2 rounded-xl border border-slate-800">
                  {employees.map(emp => (
                    <label key={emp.id} className="flex items-center gap-2 text-slate-300 hover:text-white cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newProject.assignedEmployeeIds.includes(emp.id)}
                        onChange={e => {
                          if (e.target.checked) {
                            setNewProject({ ...newProject, assignedEmployeeIds: [...newProject.assignedEmployeeIds, emp.id] });
                          } else {
                            setNewProject({ ...newProject, assignedEmployeeIds: newProject.assignedEmployeeIds.filter(id => id !== emp.id) });
                          }
                        }}
                      />
                      <span>{emp.name} ({emp.position})</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-900 text-slate-300 rounded-xl font-semibold"
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
