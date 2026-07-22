'use client';

import React, { useState } from 'react';
import {
  Inbox,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Calendar,
  FileText,
  AlertCircle,
  Plus,
  X
} from 'lucide-react';
import { LeaveRequest, EmployeeRequest, Employee } from '@/types';
import { updateItem, createItem } from '@/lib/services/firestore';
import NepaliDatePicker from '@/components/ui/NepaliDatePicker';
import { adToBs, formatDualDate } from '@/lib/nepaliCalendar';

interface RequestCenterViewProps {
  leaveRequests: LeaveRequest[];
  employeeRequests: EmployeeRequest[];
  employees: Employee[];
  onRefresh?: () => void;
}

export default function RequestCenterView({
  leaveRequests,
  employeeRequests,
  employees,
  onRefresh
}: RequestCenterViewProps) {
  const [activeTab, setActiveTab] = useState<'leave' | 'general'>('leave');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Leave Application state
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(employees[0]?.id || '');
  const [leaveType, setLeaveType] = useState<LeaveRequest['type']>('Annual Leave');
  const [startDateAD, setStartDateAD] = useState(new Date().toISOString().split('T')[0]);
  const [endDateAD, setEndDateAD] = useState(new Date().toISOString().split('T')[0]);
  const [totalDays, setTotalDays] = useState(1);
  const [leaveReason, setLeaveReason] = useState('');

  const handleCreateLeaveRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveReason || !startDateAD || !endDateAD) return;

    const emp = employees.find(e => e.id === selectedEmployeeId) || employees[0];
    const empName = emp ? emp.name : 'Employee';

    try {
      await createItem<Omit<LeaveRequest, 'id'>>('leaveRequests', {
        employeeId: selectedEmployeeId || 'EMP-1',
        employeeName: empName,
        type: leaveType,
        startDate: startDateAD,
        endDate: endDateAD,
        totalDays: Number(totalDays) || 1,
        reason: leaveReason,
        status: 'Pending'
      });

      setIsLeaveModalOpen(false);
      setLeaveReason('');
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert('Error creating leave request: ' + err.message);
    }
  };

  // Quick Approve/Reject for Leave Requests
  const handleReviewLeave = async (id: string, status: 'Approved' | 'Rejected') => {
    setIsSubmitting(true);
    try {
      await updateItem('leaveRequests', id, {
        status,
        reviewedBy: 'CEO Sovereign',
        reviewDate: new Date().toISOString().split('T')[0]
      });
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to review leave request:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Approve/Reject for Employee Requests
  const handleReviewRequest = async (id: string, status: 'Approved' | 'Rejected') => {
    setIsSubmitting(true);
    try {
      await updateItem('employeeRequests', id, {
        status,
        reviewNote: `Reviewed by CEO Sovereign on ${new Date().toISOString().split('T')[0]}`
      });
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to review request:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-bold">
            APPROVAL WORKFLOW
          </span>
          <h1 className="text-2xl font-extrabold text-white mt-1">Request Center & Leave Workflow</h1>
          <p className="text-xs text-slate-400">1-Click CEO approvals for employee leave, equipment requests, and operational support.</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('leave')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'leave' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Leave Requests ({leaveRequests.filter(l => l.status === 'Pending').length} Pending)
            </button>
            <button
              onClick={() => setActiveTab('general')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'general' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Employee Requests ({employeeRequests.filter(r => r.status === 'Pending').length} Pending)
            </button>
          </div>

          <button
            onClick={() => setIsLeaveModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg"
          >
            <Plus className="w-4 h-4" /> New Leave Application
          </button>
        </div>
      </div>

      {activeTab === 'leave' && (
        <div className="space-y-3">
          {leaveRequests.length === 0 ? (
            <div className="p-8 text-center bg-slate-900 rounded-2xl border border-slate-800 text-slate-500 text-xs italic">
              No leave requests submitted in Firestore.
            </div>
          ) : (
            leaveRequests.map(l => {
              const startBS = adToBs(l.startDate);
              const endBS = adToBs(l.endDate);

              return (
                <div key={l.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 hover:border-slate-700 transition-all">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-slate-950 text-indigo-400 border border-slate-800">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-extrabold text-white">{l.employeeName}</p>
                        <p className="text-[10px] text-indigo-400 font-mono">{l.type} • {l.totalDays} Days</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        l.status === 'Approved' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                        l.status === 'Rejected' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                        'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {l.status}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-slate-300">
                    <p><strong className="text-white">Reason:</strong> {l.reason}</p>
                    <p className="text-[11px] text-emerald-400 font-bold">
                      BS Duration: {startBS.formatted} to {endBS.formatted}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      AD Duration: {l.startDate} to {l.endDate}
                    </p>
                  </div>

                  {l.status === 'Pending' && (
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                      <button
                        onClick={() => handleReviewLeave(l.id, 'Rejected')}
                        disabled={isSubmitting}
                        className="px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 text-xs font-bold border border-rose-800/80 flex items-center gap-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                      <button
                        onClick={() => handleReviewLeave(l.id, 'Approved')}
                        disabled={isSubmitting}
                        className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve Leave
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'general' && (
        <div className="space-y-3">
          {employeeRequests.length === 0 ? (
            <div className="p-8 text-center bg-slate-900 rounded-2xl border border-slate-800 text-slate-500 text-xs italic">
              No employee requests submitted in Firestore.
            </div>
          ) : (
            employeeRequests.map(r => (
              <div key={r.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 hover:border-slate-700 transition-all">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div>
                    <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider">{r.type}</span>
                    <h3 className="text-sm font-extrabold text-white">{r.title}</h3>
                    <p className="text-[10px] text-slate-400 font-mono">By {r.employeeName}</p>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    r.status === 'Approved' ? 'bg-emerald-500/20 text-emerald-300' :
                    r.status === 'Rejected' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {r.status}
                  </span>
                </div>

                <p className="text-xs text-slate-300">{r.details}</p>

                {r.status === 'Pending' && (
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => handleReviewRequest(r.id, 'Rejected')}
                      disabled={isSubmitting}
                      className="px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 text-xs font-bold border border-rose-800/80 flex items-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                    <button
                      onClick={() => handleReviewRequest(r.id, 'Approved')}
                      disabled={isSubmitting}
                      className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approve Request
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* New Leave Application Modal */}
      {isLeaveModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <h3 className="font-bold text-white text-sm">Submit New Employee Leave Request</h3>
              <button onClick={() => setIsLeaveModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateLeaveRequest} className="p-5 space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">Select Employee *</label>
                <select
                  value={selectedEmployeeId}
                  onChange={e => setSelectedEmployeeId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Leave Category</label>
                <select
                  value={leaveType}
                  onChange={e => setLeaveType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                >
                  <option value="Annual Leave">Annual Leave</option>
                  <option value="Sick Leave">Sick Leave</option>
                  <option value="Casual">Casual Leave</option>
                  <option value="Maternity/Paternity">Maternity/Paternity Leave</option>
                  <option value="Unpaid">Unpaid Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1">Start Date (BS / AD)</label>
                  <NepaliDatePicker
                    value={startDateAD}
                    onChange={val => setStartDateAD(val)}
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1">End Date (BS / AD)</label>
                  <NepaliDatePicker
                    value={endDateAD}
                    onChange={val => setEndDateAD(val)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1">Total Days</label>
                  <input
                    type="number"
                    min="1"
                    value={totalDays}
                    onChange={e => setTotalDays(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Reason for Leave *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="State reason for requested leave..."
                  value={leaveReason}
                  onChange={e => setLeaveReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsLeaveModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  Submit Leave Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
