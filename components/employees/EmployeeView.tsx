'use client';

import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  AlertTriangle,
  Award,
  FileText,
  Sparkles,
  Edit2,
  Trash2,
  X,
  UserPlus,
  TrendingUp,
  ShieldAlert,
  CheckCircle2,
  Brain
} from 'lucide-react';
import { Employee } from '@/types';
import { createItem, updateItem, deleteItem } from '@/lib/services/firestore';
import { callAI } from '@/lib/aiClient';

interface EmployeeViewProps {
  employees: Employee[];
  onRefresh: () => void;
}

export default function EmployeeView({ employees, onRefresh }: EmployeeViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [aiReviewText, setAiReviewText] = useState<string>('');
  const [loadingAI, setLoadingAI] = useState(false);

  // New Employee Form state
  const [newEmp, setNewEmp] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    department: 'Engineering',
    salary: 120000,
    skills: 'React, TypeScript, Node.js',
    photo: ''
  });

  // Warning modal state
  const [warningReason, setWarningReason] = useState('');
  const [noteText, setNoteText] = useState('');

  const filtered = employees.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          e.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          e.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || e.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmp.name || !newEmp.email || !newEmp.position) return;

    try {
      const skillsArr = newEmp.skills.split(',').map(s => s.trim()).filter(Boolean);
      const empId = `EMP-${Math.floor(100 + Math.random() * 900)}`;

      await createItem<Omit<Employee, 'id'>>('employees', {
        employeeId: empId,
        name: newEmp.name,
        email: newEmp.email,
        phone: newEmp.phone || '+1 (555) 000-0000',
        position: newEmp.position,
        department: newEmp.department,
        salary: Number(newEmp.salary),
        joinDate: new Date().toISOString().split('T')[0],
        status: 'Active',
        skills: skillsArr,
        performanceScore: 85,
        attendanceScore: 90,
        warnings: [],
        documents: [],
        notes: [],
        photo: newEmp.photo || `https://picsum.photos/seed/${newEmp.name.replace(/\s+/g, '')}/200/200`
      });

      setShowAddModal(false);
      setNewEmp({
        name: '',
        email: '',
        phone: '',
        position: '',
        department: 'Engineering',
        salary: 120000,
        skills: 'React, TypeScript, Node.js',
        photo: ''
      });
      alert('New Employee Added to Sovryx OS!');
    } catch (err: any) {
      alert('Error creating employee: ' + err.message);
    }
  };

  const handleIssueWarning = async () => {
    if (!selectedEmp || !warningReason.trim()) return;
    try {
      const updatedWarnings = [
        ...selectedEmp.warnings,
        {
          id: Date.now().toString(),
          date: new Date().toISOString().split('T')[0],
          reason: warningReason,
          issuedBy: 'CEO Sovereign'
        }
      ];
      // Reduce performance score slightly as CEO penalty
      const newScore = Math.max(0, selectedEmp.performanceScore - 10);
      await updateItem('employees', selectedEmp.id, {
        warnings: updatedWarnings,
        performanceScore: newScore
      });

      setSelectedEmp(prev => prev ? { ...prev, warnings: updatedWarnings, performanceScore: newScore } : null);
      setWarningReason('');
      alert('Formal CEO Warning Issued!');
    } catch (err: any) {
      alert('Error issuing warning: ' + err.message);
    }
  };

  const handleAddNote = async () => {
    if (!selectedEmp || !noteText.trim()) return;
    try {
      const updatedNotes = [
        ...selectedEmp.notes,
        {
          id: Date.now().toString(),
          date: new Date().toISOString().split('T')[0],
          text: noteText,
          author: 'CEO Sovereign'
        }
      ];
      await updateItem('employees', selectedEmp.id, { notes: updatedNotes });
      setSelectedEmp(prev => prev ? { ...prev, notes: updatedNotes } : null);
      setNoteText('');
    } catch (err: any) {
      alert('Error adding note: ' + err.message);
    }
  };

  const handleGenerateAIReview = async (emp: Employee) => {
    setLoadingAI(true);
    setAiReviewText('');
    try {
      const review = await callAI('employee-review', { employee: emp });
      setAiReviewText(review);
    } catch (err: any) {
      setAiReviewText('Failed to generate review: ' + err.message);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (confirm('Are you sure you want to terminate/remove this employee record?')) {
      try {
        await deleteItem('employees', id);
        if (selectedEmp?.id === id) setSelectedEmp(null);
      } catch (err: any) {
        alert('Error removing employee: ' + err.message);
      }
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            Employee Management
          </h2>
          <p className="text-xs text-slate-400">Direct CEO Command of All Company Personnel</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl transition-all shadow-md shadow-indigo-600/20"
        >
          <UserPlus className="w-4 h-4" />
          Add Employee
        </button>
      </div>

      {/* Search & Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/90 p-3 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name, position, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400">Status:</span>
          {['All', 'Active', 'On Leave', 'Terminated'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`text-xs px-3 py-1 rounded-lg transition-colors ${
                filterStatus === st
                  ? 'bg-indigo-600 text-white font-medium'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Employee Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((emp) => (
          <div
            key={emp.id}
            onClick={() => setSelectedEmp(emp)}
            className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 hover:border-indigo-500/50 cursor-pointer transition-all shadow-lg hover:shadow-indigo-500/10 flex flex-col justify-between space-y-4 group"
          >
            {/* Top row */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={emp.photo || 'https://picsum.photos/seed/avatar/200/200'}
                  alt={emp.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-slate-800 group-hover:border-indigo-500 transition-colors"
                />
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                    {emp.name}
                  </h3>
                  <p className="text-xs text-slate-400">{emp.position}</p>
                  <span className="text-[10px] text-indigo-400 font-mono mt-0.5 block">{emp.employeeId}</span>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                emp.status === 'Active'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : emp.status === 'On Leave'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              }`}>
                {emp.status}
              </span>
            </div>

            {/* Performance Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Performance Score</span>
                <span className={`font-bold ${emp.performanceScore >= 90 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {emp.performanceScore}%
                </span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${emp.performanceScore >= 90 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                  style={{ width: `${emp.performanceScore}%` }}
                />
              </div>
            </div>

            {/* Skills Badges */}
            <div className="flex flex-wrap gap-1">
              {emp.skills.slice(0, 3).map((sk, idx) => (
                <span key={idx} className="text-[10px] bg-slate-950 text-slate-300 border border-slate-800 px-2 py-0.5 rounded-md">
                  {sk}
                </span>
              ))}
              {emp.skills.length > 3 && (
                <span className="text-[10px] text-slate-500 py-0.5">+{emp.skills.length - 3} more</span>
              )}
            </div>

            {/* Bottom Details */}
            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>${emp.salary.toLocaleString()}/yr</span>
              </div>
              {emp.warnings.length > 0 && (
                <span className="text-rose-400 font-medium text-[10px] flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {emp.warnings.length} Warning
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Employee Modal */}
      {selectedEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-3xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img
                  src={selectedEmp.photo || 'https://picsum.photos/seed/avatar/200/200'}
                  alt={selectedEmp.name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-indigo-500"
                />
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    {selectedEmp.name}
                    <span className="text-xs text-indigo-400 font-mono">({selectedEmp.employeeId})</span>
                  </h3>
                  <p className="text-xs text-slate-400">{selectedEmp.position} • {selectedEmp.department}</p>
                </div>
              </div>
              <button
                onClick={() => { setSelectedEmp(null); setAiReviewText(''); }}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar text-xs">
              {/* Profile Overview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Annual Salary</span>
                  <span className="text-sm font-bold text-white">${selectedEmp.salary.toLocaleString()}</span>
                </div>
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Performance</span>
                  <span className="text-sm font-bold text-emerald-400">{selectedEmp.performanceScore}%</span>
                </div>
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Attendance</span>
                  <span className="text-sm font-bold text-indigo-400">{selectedEmp.attendanceScore}%</span>
                </div>
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Join Date</span>
                  <span className="text-xs font-bold text-slate-200">{selectedEmp.joinDate}</span>
                </div>
              </div>

              {/* Skills & Contact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
                  <h4 className="font-bold text-white">Contact & Credentials</h4>
                  <p className="text-slate-300 flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-indigo-400" /> {selectedEmp.email}</p>
                  <p className="text-slate-300 flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-indigo-400" /> {selectedEmp.phone}</p>
                </div>
                <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
                  <h4 className="font-bold text-white">Technical Skillset</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedEmp.skills.map((s, idx) => (
                      <span key={idx} className="bg-slate-950 text-indigo-300 border border-slate-800 px-2 py-1 rounded-md text-[10px]">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* AI Performance Evaluation */}
              <div className="p-4 rounded-xl bg-slate-900 border border-indigo-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white flex items-center gap-2">
                    <Brain className="w-4 h-4 text-indigo-400" /> AI Executive Employee Review
                  </h4>
                  <button
                    onClick={() => handleGenerateAIReview(selectedEmp)}
                    disabled={loadingAI}
                    className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-semibold"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {loadingAI ? 'Analyzing...' : 'Generate AI Review'}
                  </button>
                </div>

                {aiReviewText ? (
                  <div className="p-3 bg-slate-950 rounded-xl text-slate-200 whitespace-pre-wrap leading-relaxed text-xs border border-slate-800">
                    {aiReviewText}
                  </div>
                ) : (
                  <p className="text-slate-400 text-xs italic">
                    Click &quot;Generate AI Review&quot; to synthesize employee performance score, project history, and career promotion recommendation via Gemini 2.5.
                  </p>
                )}
              </div>

              {/* Issue CEO Warning & Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Warning issuer */}
                <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
                  <h4 className="font-bold text-rose-400 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4" /> Issue Formal CEO Warning
                  </h4>
                  <textarea
                    rows={2}
                    placeholder="Reason for warning (e.g. Missed critical deliverable)..."
                    value={warningReason}
                    onChange={(e) => setWarningReason(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs focus:outline-none focus:border-rose-500"
                  />
                  <button
                    onClick={handleIssueWarning}
                    disabled={!warningReason.trim()}
                    className="w-full py-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold rounded-lg transition-colors text-xs"
                  >
                    Issue Warning (-10 Score)
                  </button>

                  {selectedEmp.warnings.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="font-semibold text-slate-400 text-[10px]">Warning History:</p>
                      {selectedEmp.warnings.map(w => (
                        <div key={w.id} className="p-2 bg-slate-950 rounded border border-rose-900/50 text-[10px] text-rose-300">
                          <span className="font-bold">{w.date}:</span> {w.reason}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* CEO Notes */}
                <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
                  <h4 className="font-bold text-slate-200">Private CEO Notes</h4>
                  <textarea
                    rows={2}
                    placeholder="Add CEO confidential note..."
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={handleAddNote}
                    disabled={!noteText.trim()}
                    className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 font-bold rounded-lg transition-colors text-xs"
                  >
                    Save CEO Note
                  </button>

                  {selectedEmp.notes.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {selectedEmp.notes.map(n => (
                        <div key={n.id} className="p-2 bg-slate-950 rounded border border-slate-800 text-[10px] text-slate-300">
                          <span className="font-bold text-indigo-400">{n.date}:</span> {n.text}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between">
              <button
                onClick={() => handleDeleteEmployee(selectedEmp.id)}
                className="flex items-center gap-1.5 text-rose-400 hover:text-rose-300 text-xs font-semibold"
              >
                <Trash2 className="w-4 h-4" /> Terminate Employee Record
              </button>
              <button
                onClick={() => setSelectedEmp(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
              >
                Close Modal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-indigo-400" />
                Add New Company Employee
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Mercer"
                  value={newEmp.name}
                  onChange={e => setNewEmp({ ...newEmp, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 block mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="alex@sovryx.com"
                    value={newEmp.email}
                    onChange={e => setNewEmp({ ...newEmp, email: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Phone</label>
                  <input
                    type="text"
                    placeholder="+1 (555) 123-4567"
                    value={newEmp.phone}
                    onChange={e => setNewEmp({ ...newEmp, phone: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 block mb-1">Position *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AI Architect"
                    value={newEmp.position}
                    onChange={e => setNewEmp({ ...newEmp, position: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Annual Salary ($)</label>
                  <input
                    type="number"
                    value={newEmp.salary}
                    onChange={e => setNewEmp({ ...newEmp, salary: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Skills (comma separated)</label>
                <input
                  type="text"
                  placeholder="Python, LLMs, PyTorch"
                  value={newEmp.skills}
                  onChange={e => setNewEmp({ ...newEmp, skills: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold"
                >
                  Save Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
