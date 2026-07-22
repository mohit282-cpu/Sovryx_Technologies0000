'use client';

import React, { useState } from 'react';
import {
  User,
  CheckSquare,
  Clock,
  TrendingUp,
  Send,
  Calendar,
  Sparkles,
  Award,
  Bell,
  CheckCircle2,
  X
} from 'lucide-react';
import { Employee, Task, AttendanceRecord, LeaveRequest } from '@/types';
import { createItem, updateItem } from '@/lib/services/firestore';

interface EmployeePortalViewProps {
  employees: Employee[];
  tasks: Task[];
  attendance: AttendanceRecord[];
  onRefresh?: () => void;
}

export default function EmployeePortalView({
  employees,
  tasks,
  attendance,
  onRefresh
}: EmployeePortalViewProps) {
  const [selectedEmpId, setSelectedEmpId] = useState(employees[0]?.id || '');
  const [leaveType, setLeaveType] = useState<'Annual Leave' | 'Sick Leave' | 'Casual'>('Annual Leave');
  const [startDate, setStartDate] = useState('2026-08-10');
  const [endDate, setEndDate] = useState('2026-08-12');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState(false);

  const currentEmp = employees.find(e => e.id === selectedEmpId) || employees[0];
  const empTasks = tasks.filter(t => t.employeeId === currentEmp?.id);
  const empAttendance = attendance.find(a => a.employeeId === currentEmp?.id && a.date === new Date().toISOString().split('T')[0]);

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || !currentEmp) return;
    setIsSubmitting(true);
    try {
      await createItem('leaveRequests', {
        employeeId: currentEmp.id,
        employeeName: currentEmp.name,
        type: leaveType,
        startDate,
        endDate,
        totalDays: 3,
        reason,
        status: 'Pending',
        createdAt: new Date().toISOString().split('T')[0]
      });

      setReason('');
      setSubmittedMessage(true);
      setTimeout(() => setSubmittedMessage(false), 4000);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to submit leave request:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTaskStatusToggle = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Completed' ? 'In Progress' : 'Completed';
    try {
      await updateItem('tasks', taskId, { status: newStatus, completionPercentage: newStatus === 'Completed' ? 100 : 50 });
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Employee Selector */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider bg-indigo-500/10 text-indigo-400 px-2.5 py-0.5 rounded-full border border-indigo-500/20 font-bold">
            SELF-SERVICE PORTAL
          </span>
          <h1 className="text-2xl font-extrabold text-white mt-1">Employee Workspace View</h1>
          <p className="text-xs text-slate-400">Simulate employee portal dashboard, task updates, clock-in status, and leave submission.</p>
        </div>

        {/* Employee Switcher */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 font-medium">Switch View:</label>
          <select
            value={selectedEmpId}
            onChange={(e) => setSelectedEmpId(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs text-white rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 font-bold"
          >
            {employees.map(e => (
              <option key={e.id} value={e.id}>{e.name} ({e.position})</option>
            ))}
          </select>
        </div>
      </div>

      {currentEmp && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Employee Profile & Metric Sidebar */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
              <img
                src={currentEmp.photo || 'https://picsum.photos/seed/user/100/100'}
                alt={currentEmp.name}
                className="w-14 h-14 rounded-full object-cover border-2 border-indigo-500/40"
              />
              <div>
                <h3 className="text-base font-extrabold text-white">{currentEmp.name}</h3>
                <p className="text-xs text-slate-400">{currentEmp.position}</p>
                <span className="text-[10px] font-mono text-indigo-400">{currentEmp.department}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Performance Score</span>
                <span className="font-bold text-indigo-400 font-mono">{currentEmp.performanceScore}%</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Attendance Score</span>
                <span className="font-bold text-emerald-400 font-mono">{currentEmp.attendanceScore}%</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Today Clock-In</span>
                <span className="font-bold text-white font-mono">{empAttendance ? empAttendance.clockIn : '08:55 AM'}</span>
              </div>
            </div>
          </div>

          {/* Assigned Tasks & Leave Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Assigned Tasks */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-indigo-400" /> My Assigned Tasks ({empTasks.length})
              </h3>

              <div className="space-y-2">
                {empTasks.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-4 text-center">No tasks assigned to {currentEmp.name}.</p>
                ) : (
                  empTasks.map(t => (
                    <div key={t.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold text-white">{t.title}</p>
                        <p className="text-[10px] text-slate-400 font-mono">Deadline: {t.deadline} • Priority: {t.priority}</p>
                      </div>
                      <button
                        onClick={() => handleTaskStatusToggle(t.id, t.status)}
                        className={`text-[11px] font-bold px-3 py-1.5 rounded-xl border transition-all ${
                          t.status === 'Completed'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        {t.status === 'Completed' ? '✓ Completed' : 'Mark Complete'}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Submit Leave Request Form */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" /> Submit Leave Request
              </h3>

              {submittedMessage && (
                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Leave request submitted directly to CEO Sovereign for approval!</span>
                </div>
              )}

              <form onSubmit={handleApplyLeave} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Leave Type</label>
                    <select
                      value={leaveType}
                      onChange={(e: any) => setLeaveType(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-xl px-3 py-2 focus:outline-none"
                    >
                      <option value="Annual Leave">Annual Leave</option>
                      <option value="Sick Leave">Sick Leave</option>
                      <option value="Casual">Casual Leave</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-xl px-3 py-2 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-xl px-3 py-2 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Reason for Leave</label>
                  <textarea
                    required
                    rows={2}
                    placeholder="Provide reason for time off..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" /> Submit to CEO
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
