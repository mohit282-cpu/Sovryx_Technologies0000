'use client';

import React, { useState } from 'react';
import {
  Briefcase,
  Users,
  CheckSquare,
  Search,
  Filter,
  TrendingUp,
  Clock,
  DollarSign,
  AlertTriangle,
  Sparkles,
  ChevronRight,
  UserCheck,
  LayoutGrid,
  List
} from 'lucide-react';
import { Project, Employee, Task } from '@/types';

interface ProjectManagerProps {
  projects: Project[];
  employees: Employee[];
  tasks?: Task[];
  onSelectProject?: (project: Project) => void;
}

export default function ProjectManager({
  projects,
  employees,
  tasks = [],
  onSelectProject
}: ProjectManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Active' | 'All' | 'Planning' | 'At Risk' | 'Completed'>('Active');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filter active projects (active = In Progress, Planning, At Risk)
  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.projectId.toLowerCase().includes(searchTerm.toLowerCase());

    if (statusFilter === 'Active') {
      return matchesSearch && p.status !== 'Completed';
    }
    if (statusFilter === 'All') {
      return matchesSearch;
    }
    return matchesSearch && p.status === statusFilter;
  });

  const activeCount = projects.filter((p) => p.status !== 'Completed').length;
  const avgCompletion =
    projects.length > 0
      ? Math.round(
          projects.reduce((acc, p) => acc + (p.progress || 0), 0) / projects.length
        )
      : 0;
  const atRiskCount = projects.filter((p) => p.status === 'At Risk').length;

  return (
    <div className="space-y-6">
      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium block uppercase tracking-wider">
              Active Projects
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-extrabold text-white">{activeCount}</span>
              <span className="text-[10px] text-emerald-400 font-semibold">In Pipeline</span>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Briefcase className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium block uppercase tracking-wider">
              Avg. Completion Rate
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-extrabold text-emerald-400">{avgCompletion}%</span>
              <span className="text-[10px] text-slate-400">across deliverables</span>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium block uppercase tracking-wider">
              At Risk Milestones
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-extrabold text-rose-400">{atRiskCount}</span>
              <span className="text-[10px] text-rose-300 italic">Attention required</span>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Control Bar: Search & Status Filters & View Toggle */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/90 p-3 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search active projects or clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {(['Active', 'All', 'Planning', 'At Risk', 'Completed'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`text-xs px-3 py-1.5 rounded-xl transition-all whitespace-nowrap font-medium ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {st} {st === 'Active' ? `(${activeCount})` : ''}
            </button>
          ))}

          <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block" />

          <div className="flex items-center bg-slate-950 rounded-xl p-1 border border-slate-800">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Projects List / Grid */}
      {filteredProjects.length === 0 ? (
        <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-slate-800 space-y-2">
          <Briefcase className="w-8 h-8 text-slate-500 mx-auto" />
          <p className="text-sm font-bold text-slate-300">No projects found matching filter</p>
          <p className="text-xs text-slate-500">Try adjusting your search criteria or filter tabs</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((prj) => {
            const assignedEmps = employees.filter((e) =>
              prj.employeeIds?.includes(e.id)
            );
            const projectTasks = tasks.filter((t) => t.projectId === prj.id);
            const completedTasks = projectTasks.filter(
              (t) => t.status === 'Completed'
            ).length;

            return (
              <div
                key={prj.id}
                onClick={() => onSelectProject && onSelectProject(prj)}
                className={`p-5 rounded-2xl bg-slate-900/90 border transition-all shadow-lg flex flex-col justify-between space-y-4 hover:border-indigo-500/50 group ${
                  prj.status === 'At Risk'
                    ? 'border-rose-500/40 bg-rose-950/10'
                    : 'border-slate-800'
                } ${onSelectProject ? 'cursor-pointer' : ''}`}
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block">
                      {prj.projectId}
                    </span>
                    <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors mt-0.5">
                      {prj.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">{prj.client}</p>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      prj.status === 'At Risk'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse'
                        : prj.status === 'In Progress'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : prj.status === 'Completed'
                        ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}
                  >
                    {prj.status}
                  </span>
                </div>

                {/* Completion Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 flex items-center gap-1 font-medium">
                      <TrendingUp className="w-3.5 h-3.5 text-indigo-400" /> Completion Rate
                    </span>
                    <span className="font-extrabold text-emerald-400 font-mono">
                      {prj.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        prj.status === 'At Risk'
                          ? 'bg-gradient-to-r from-rose-500 to-amber-500'
                          : prj.progress >= 90
                          ? 'bg-gradient-to-r from-emerald-500 to-indigo-500'
                          : 'bg-gradient-to-r from-indigo-500 to-emerald-400'
                      }`}
                      style={{ width: `${Math.max(2, prj.progress)}%` }}
                    />
                  </div>
                </div>

                {/* Info Pills */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Budget</span>
                    <span className="font-bold text-slate-200">${prj.budget?.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Deadline</span>
                    <span className="font-bold text-amber-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-400" /> {prj.deadline}
                    </span>
                  </div>
                </div>

                {/* Assigned Team Members Section */}
                <div className="pt-3 border-t border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-indigo-400" /> Assigned Team ({assignedEmps.length})
                    </span>
                    {projectTasks.length > 0 && (
                      <span className="text-[10px] font-mono text-purple-300">
                        {completedTasks}/{projectTasks.length} Tasks
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {assignedEmps.length === 0 ? (
                      <span className="text-[11px] text-slate-500 italic">No assigned personnel</span>
                    ) : (
                      assignedEmps.map((emp) => (
                        <div
                          key={emp.id}
                          className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-2 py-1 rounded-lg text-[11px] text-slate-200"
                        >
                          <img
                            src={emp.photo || 'https://picsum.photos/seed/avatar/200/200'}
                            alt={emp.name}
                            className="w-4 h-4 rounded-full object-cover shrink-0"
                          />
                          <span className="font-medium text-slate-200">{(emp.name || 'Member').split(' ')[0]}</span>
                          <span className="text-[9px] text-slate-500">({(emp.department || 'GEN').slice(0, 3)})</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-x-auto shadow-xl">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-3.5">ID & Project</th>
                <th className="p-3.5">Client</th>
                <th className="p-3.5">Completion Track</th>
                <th className="p-3.5">Budget</th>
                <th className="p-3.5">Deadline</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Assigned Team</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredProjects.map((prj) => {
                const assignedEmps = employees.filter((e) =>
                  prj.employeeIds?.includes(e.id)
                );

                return (
                  <tr
                    key={prj.id}
                    onClick={() => onSelectProject && onSelectProject(prj)}
                    className={`hover:bg-slate-950/60 transition-colors ${
                      onSelectProject ? 'cursor-pointer' : ''
                    }`}
                  >
                    <td className="p-3.5">
                      <span className="font-mono text-[10px] text-slate-500 block">{prj.projectId}</span>
                      <span className="font-bold text-white text-xs">{prj.name}</span>
                    </td>
                    <td className="p-3.5 text-slate-400">{prj.client}</td>
                    <td className="p-3.5 w-48">
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <span className="font-mono text-emerald-400 font-bold">{prj.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${prj.progress}%` }}
                        />
                      </div>
                    </td>
                    <td className="p-3.5 font-bold font-mono text-slate-200">
                      ${prj.budget?.toLocaleString()}
                    </td>
                    <td className="p-3.5 font-mono text-amber-400">{prj.deadline}</td>
                    <td className="p-3.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          prj.status === 'At Risk'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            : prj.status === 'In Progress'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : prj.status === 'Completed'
                            ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}
                      >
                        {prj.status}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="flex -space-x-1.5">
                        {assignedEmps.map((emp) => (
                          <img
                            key={emp.id}
                            src={emp.photo || 'https://picsum.photos/seed/avatar/200/200'}
                            alt={emp.name}
                            title={`${emp.name} (${emp.position})`}
                            className="w-6 h-6 rounded-full border-2 border-slate-900 object-cover"
                          />
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
