'use client';

import React, { useState } from 'react';
import {
  CheckSquare,
  Plus,
  Search,
  Sparkles,
  User,
  Briefcase,
  Clock,
  Award,
  AlertTriangle,
  X,
  ChevronRight,
  Filter,
  Brain
} from 'lucide-react';
import { Task, Employee, Project } from '@/types';
import { createItem, updateItem, deleteItem } from '@/lib/services/firestore';
import { callAI } from '@/lib/aiClient';

interface TaskViewProps {
  tasks: Task[];
  employees: Employee[];
  projects: Project[];
  onRefresh: () => void;
}

export default function TaskView({ tasks, employees, projects, onRefresh }: TaskViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAITaskModal, setShowAITaskModal] = useState(false);

  // AI Generator Goal
  const [aiGoalBrief, setAiGoalBrief] = useState('');
  const [selectedProjectIdForAI, setSelectedProjectIdForAI] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);

  // New Task form
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    employeeId: '',
    projectId: '',
    priority: 'Medium' as Task['priority'],
    difficulty: 'Medium' as Task['difficulty'],
    deadline: '2026-08-01',
    estimatedHours: 20
  });

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = priorityFilter === 'All' || t.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title) return;

    try {
      const emp = employees.find(e => e.id === newTask.employeeId);
      const prj = projects.find(p => p.id === newTask.projectId);

      const tskId = `TSK-${Math.floor(100 + Math.random() * 900)}`;
      await createItem<Omit<Task, 'id'>>('tasks', {
        taskId: tskId,
        title: newTask.title,
        description: newTask.description,
        employeeId: newTask.employeeId,
        employeeName: emp?.name || 'Unassigned',
        projectId: newTask.projectId,
        projectName: prj?.name || 'General Operational',
        priority: newTask.priority,
        difficulty: newTask.difficulty,
        deadline: newTask.deadline,
        status: 'Todo',
        estimatedHours: Number(newTask.estimatedHours),
        actualHours: 0,
        qualityScore: 90,
        completionPercentage: 0
      });

      setShowAddModal(false);
      setNewTask({
        title: '',
        description: '',
        employeeId: '',
        projectId: '',
        priority: 'Medium',
        difficulty: 'Medium',
        deadline: '2026-08-01',
        estimatedHours: 20
      });
      alert('Task Created!');
    } catch (err: any) {
      alert('Error creating task: ' + err.message);
    }
  };

  const handleUpdateStatus = async (taskId: string, newStatus: Task['status']) => {
    try {
      const pct = newStatus === 'Completed' ? 100 : newStatus === 'In Progress' ? 50 : newStatus === 'Review' ? 90 : 0;
      await updateItem('tasks', taskId, { status: newStatus, completionPercentage: pct });
    } catch (err: any) {
      alert('Error updating task: ' + err.message);
    }
  };

  const handleUpdateQuality = async (taskId: string, qualityScore: number) => {
    try {
      await updateItem('tasks', taskId, { qualityScore });
    } catch (err: any) {
      alert('Error updating quality: ' + err.message);
    }
  };

  const handleGenerateTasksWithAI = async () => {
    if (!aiGoalBrief.trim()) return;
    setLoadingAI(true);
    try {
      const res = await callAI('task-generation', {
        brief: aiGoalBrief,
        projectId: selectedProjectIdForAI,
        employees
      });

      let parsedTasks: any[] = [];
      try {
        parsedTasks = JSON.parse(res);
      } catch (e) {
        alert('AI Generated Response: ' + res);
        setLoadingAI(false);
        return;
      }

      if (Array.isArray(parsedTasks)) {
        for (const item of parsedTasks) {
          const tskId = `TSK-${Math.floor(100 + Math.random() * 900)}`;
          await createItem<Omit<Task, 'id'>>('tasks', {
            taskId: tskId,
            title: item.title || 'AI Task',
            description: item.description || aiGoalBrief,
            employeeId: employees[0]?.id || '',
            employeeName: employees[0]?.name || 'CEO Unassigned',
            projectId: selectedProjectIdForAI || projects[0]?.id || '',
            projectName: projects.find(p => p.id === selectedProjectIdForAI)?.name || 'AI Generated Project',
            priority: item.priority || 'High',
            difficulty: item.difficulty || 'Hard',
            deadline: '2026-08-10',
            status: 'Todo',
            estimatedHours: item.estimatedHours || 15,
            actualHours: 0,
            qualityScore: 95,
            completionPercentage: 0
          });
        }
        alert(`Successfully generated ${parsedTasks.length} AI Tasks in Firestore!`);
        setShowAITaskModal(false);
        setAiGoalBrief('');
      }
    } catch (err: any) {
      alert('AI Generation error: ' + err.message);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (confirm('Delete task?')) {
      await deleteItem('tasks', id);
    }
  };

  const kanbanColumns: Task['status'][] = ['Todo', 'In Progress', 'Review', 'Completed'];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-purple-400" />
            Task Execution Board
          </h2>
          <p className="text-xs text-slate-400">Task difficulty ratings, quality scoring, and employee assignment</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAITaskModal(true)}
            className="flex items-center gap-2 text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-3.5 py-2 rounded-xl transition-all shadow-md shadow-purple-600/20"
          >
            <Sparkles className="w-4 h-4 text-purple-200" />
            AI Task Generator
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white px-3.5 py-2 rounded-xl transition-all border border-slate-700"
          >
            <Plus className="w-4 h-4" />
            Manual Task
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/90 p-3 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {['kanban', 'table'].map((m) => (
              <button
                key={m}
                onClick={() => setViewMode(m as any)}
                className={`text-xs px-3 py-1 rounded-lg capitalize transition-colors ${
                  viewMode === m ? 'bg-purple-600 text-white font-bold' : 'text-slate-400'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Kanban View */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kanbanColumns.map((col) => {
            const colTasks = filteredTasks.filter(t => t.status === col);

            return (
              <div key={col} className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80 space-y-3 flex flex-col min-h-[500px]">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      col === 'Todo' ? 'bg-amber-400' :
                      col === 'In Progress' ? 'bg-indigo-400' :
                      col === 'Review' ? 'bg-purple-400' : 'bg-emerald-400'
                    }`} />
                    {col}
                  </h3>
                  <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded-full border border-slate-800">
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar">
                  {colTasks.map((tsk) => (
                    <div
                      key={tsk.id}
                      className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-purple-500/50 transition-all space-y-3 shadow-md group"
                    >
                      <div className="flex items-start justify-between">
                        <span className="text-[10px] font-mono text-slate-500">{tsk.taskId}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                          tsk.priority === 'Urgent' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                          tsk.priority === 'High' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          'bg-slate-900 text-slate-300 border-slate-800'
                        }`}>
                          {tsk.priority}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                        {tsk.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 line-clamp-2">{tsk.description}</p>

                      <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-400">
                        <span className="flex items-center gap-1 font-medium text-slate-300">
                          <User className="w-3 h-3 text-purple-400" /> {tsk.employeeName || 'Unassigned'}
                        </span>
                        <span className="flex items-center gap-1 font-mono text-amber-400">
                          <Clock className="w-3 h-3" /> {tsk.estimatedHours}h
                        </span>
                      </div>

                      {/* CEO Quick Status Move */}
                      <div className="pt-2 border-t border-slate-900/80 flex items-center justify-between">
                        <select
                          value={tsk.status}
                          onChange={(e) => handleUpdateStatus(tsk.id, e.target.value as any)}
                          className="bg-slate-900 border border-slate-800 text-slate-300 rounded px-1.5 py-0.5 text-[10px] focus:outline-none"
                        >
                          {kanbanColumns.map(st => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>

                        <button
                          onClick={() => handleDeleteTask(tsk.id)}
                          className="text-slate-500 hover:text-rose-400 text-[10px]"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-3">ID</th>
                <th className="p-3">Title</th>
                <th className="p-3">Assignee</th>
                <th className="p-3">Priority</th>
                <th className="p-3">Difficulty</th>
                <th className="p-3">Status</th>
                <th className="p-3">Quality Score</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredTasks.map((t) => (
                <tr key={t.id} className="hover:bg-slate-950/50 transition-colors">
                  <td className="p-3 font-mono text-indigo-400">{t.taskId}</td>
                  <td className="p-3 font-bold text-white">{t.title}</td>
                  <td className="p-3 text-slate-300">{t.employeeName}</td>
                  <td className="p-3">
                    <span className="font-bold text-amber-400">{t.priority}</span>
                  </td>
                  <td className="p-3">{t.difficulty}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-200">
                      {t.status}
                    </span>
                  </td>
                  <td className="p-3 font-mono font-bold text-emerald-400">{t.qualityScore}%</td>
                  <td className="p-3">
                    <button onClick={() => handleDeleteTask(t.id)} className="text-rose-400 hover:underline">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* AI Task Generator Modal */}
      {showAITaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-400" />
                AI Auto Task Generator
              </h3>
              <button onClick={() => setShowAITaskModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">Company Goal / Feature Brief *</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Implement zero-trust OAuth 2.0 microservice with Redis session cache..."
                  value={aiGoalBrief}
                  onChange={(e) => setAiGoalBrief(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Target Project</label>
                <select
                  value={selectedProjectIdForAI}
                  onChange={e => setSelectedProjectIdForAI(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="">Select Project</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  onClick={() => setShowAITaskModal(false)}
                  className="px-4 py-2 bg-slate-900 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateTasksWithAI}
                  disabled={loadingAI || !aiGoalBrief.trim()}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold rounded-xl flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  {loadingAI ? 'Generating Tasks...' : 'Generate AI Tasks'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-purple-400" />
                Create New Task
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="Task title..."
                  value={newTask.title}
                  onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Step details..."
                  value={newTask.description}
                  onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 block mb-1">Assign Employee</label>
                  <select
                    value={newTask.employeeId}
                    onChange={e => setNewTask({ ...newTask, employeeId: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="">Unassigned</option>
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>{e.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Project</label>
                  <select
                    value={newTask.projectId}
                    onChange={e => setNewTask({ ...newTask, projectId: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="">General</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 block mb-1">Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={e => setNewTask({ ...newTask, priority: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Estimated Hours</label>
                  <input
                    type="number"
                    value={newTask.estimatedHours}
                    onChange={e => setNewTask({ ...newTask, estimatedHours: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white focus:outline-none focus:border-purple-500"
                  />
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
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
