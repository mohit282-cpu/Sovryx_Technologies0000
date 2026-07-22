'use client';

import React, { useState } from 'react';
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
  Brain
} from 'lucide-react';
import { Project, Employee, Task } from '@/types';
import { createItem, updateItem, deleteItem } from '@/lib/services/firestore';
import { callAI } from '@/lib/aiClient';
import EmptyState from '@/components/ui/EmptyState';
import ProjectManager from './ProjectManager';
import NepaliDatePicker from '@/components/ui/NepaliDatePicker';
import { adToBs, formatNPR } from '@/lib/nepaliCalendar';

interface ProjectViewProps {
  projects: Project[];
  employees: Employee[];
  tasks: Task[];
  onRefresh: () => void;
}

export default function ProjectView({ projects, employees, tasks, onRefresh }: ProjectViewProps) {
  const [subView, setSubView] = useState<'manager' | 'grid'>('manager');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [aiAnalysisText, setAiAnalysisText] = useState<string>('');
  const [loadingAI, setLoadingAI] = useState(false);

  // New Project Form
  const [newProject, setNewProject] = useState({
    name: '',
    client: 'Nexus Corp Global',
    budget: 250000,
    status: 'Planning' as const,
    deadline: '2026-10-31',
    assignedEmployeeIds: [] as string[]
  });

  const filtered = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.client.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

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
      alert('New Project Created in Sovryx OS!');
    } catch (err: any) {
      alert('Error creating project: ' + err.message);
    }
  };

  const handleUpdateStatus = async (projectId: string, newStatus: Project['status'], riskLevel: Project['riskLevel'] = 'Low') => {
    try {
      await updateItem('projects', projectId, { status: newStatus, riskLevel });
      setSelectedProject(prev => prev && prev.id === projectId ? { ...prev, status: newStatus, riskLevel } : prev);
    } catch (err: any) {
      alert('Error updating status: ' + err.message);
    }
  };

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

  const handleDeleteProject = async (id: string) => {
    if (confirm('Delete project from Sovryx OS database?')) {
      try {
        await deleteItem('projects', id);
        if (selectedProject?.id === id) setSelectedProject(null);
      } catch (err: any) {
        alert('Error deleting project: ' + err.message);
      }
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-emerald-400" />
            Project Command Center
          </h2>
          <p className="text-xs text-slate-400">Manage Budgets, Milestones, and Delivery Risk Levels</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs font-medium">
            <button
              onClick={() => setSubView('manager')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                subView === 'manager'
                  ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Project Manager
            </button>
            <button
              onClick={() => setSubView('grid')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                subView === 'grid'
                  ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Grid
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl transition-all shadow-md shadow-emerald-600/20 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Create Project
          </button>
        </div>
      </div>

      {subView === 'manager' ? (
        <ProjectManager
          projects={projects}
          employees={employees}
          tasks={tasks}
          onSelectProject={(prj) => setSelectedProject(prj)}
        />
      ) : (
        <>
          {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/90 p-3 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search projects or clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {['All', 'Planning', 'In Progress', 'At Risk', 'Completed'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`text-xs px-3 py-1 rounded-lg transition-colors whitespace-nowrap ${
                filterStatus === st
                  ? 'bg-emerald-600 text-white font-medium'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title={projects.length === 0 ? "No Active Projects" : "No Matching Projects"}
          description={
            projects.length === 0
              ? "Your project portfolio is currently empty. Initialize a new project or create tasks for your team."
              : `No projects match your search query "${searchTerm}" or filter "${filterStatus}".`
          }
          actionLabel="+ New Project"
          onAction={() => setShowAddModal(true)}
          secondaryActionLabel={searchTerm || filterStatus !== 'All' ? "Clear Filters" : undefined}
          onSecondaryAction={() => {
            setSearchTerm('');
            setFilterStatus('All');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((prj) => {
            const assignedEmps = employees.filter(e => prj.employeeIds?.includes(e.id));
            const projectTasks = tasks.filter(t => t.projectId === prj.id);
            const completedTasksCount = projectTasks.filter(t => t.status === 'Completed').length;

            return (
              <div
                key={prj.id}
                onClick={() => setSelectedProject(prj)}
                className={`p-5 rounded-2xl bg-slate-900/90 border cursor-pointer transition-all shadow-lg flex flex-col justify-between space-y-4 group ${
                  prj.status === 'At Risk'
                    ? 'border-rose-500/50 hover:border-rose-400'
                    : 'border-slate-800/80 hover:border-emerald-500/50'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono block">{prj.projectId}</span>
                    <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors mt-0.5">
                      {prj.name}
                    </h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <Briefcase className="w-3 h-3 text-emerald-400" /> {prj.client}
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    prj.status === 'At Risk'
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse'
                      : prj.status === 'In Progress'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : prj.status === 'Completed'
                      ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                    {prj.status}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Milestone Delivery</span>
                    <span className="font-bold text-emerald-400">{prj.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${prj.status === 'At Risk' ? 'bg-rose-500' : 'bg-emerald-500'}`}
                      style={{ width: `${prj.progress}%` }}
                    />
                  </div>
                </div>

                {/* Budget & Deadlines */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Total Budget</span>
                    <span className="font-bold text-slate-200">${prj.budget?.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Deadline</span>
                    <span className="font-bold text-amber-400">{prj.deadline}</span>
                  </div>
                </div>

                {/* Footer Team & Task Count */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex -space-x-2">
                    {(assignedEmps || []).slice(0, 3).map(e => (
                      <img
                        key={e.id}
                        src={e.photo || 'https://picsum.photos/seed/avatar/200/200'}
                        alt={e.name}
                        title={e.name}
                        className="w-6 h-6 rounded-full border-2 border-slate-900 object-cover"
                      />
                    ))}
                    {(assignedEmps || []).length > 3 && (
                      <div className="w-6 h-6 rounded-full bg-slate-800 border-2 border-slate-900 text-[10px] flex items-center justify-center font-bold text-slate-300">
                        +{(assignedEmps || []).length - 3}
                      </div>
                    )}
                  </div>

                  <span className="text-[11px] font-medium text-slate-300 flex items-center gap-1">
                    <CheckSquare className="w-3.5 h-3.5 text-purple-400" />
                    {completedTasksCount}/{projectTasks.length} Tasks
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
        </>
      )}

      {/* Selected Project Modal */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-3xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
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

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar text-xs">
              {/* Quick Status Setter */}
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

              {/* AI Risk & Progress Analyzer */}
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

              {/* Assigned Employees */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-200">Assigned Team Members</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {employees.filter(e => selectedProject.employeeIds?.includes(e.id)).map(emp => (
                    <div key={emp.id} className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 flex items-center gap-3">
                      <img src={emp.photo} alt={emp.name} className="w-8 h-8 rounded-full object-cover" />
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

      {/* Add Project Modal */}
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
