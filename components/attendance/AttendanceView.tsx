'use client';

import React, { useState } from 'react';
import {
  Clock,
  UserCheck,
  UserX,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Search,
  Plus
} from 'lucide-react';
import { AttendanceRecord, Employee } from '@/types';
import { createItem, updateItem } from '@/lib/services/firestore';

interface AttendanceViewProps {
  attendance: AttendanceRecord[];
  employees: Employee[];
  onRefresh: () => void;
}

export default function AttendanceView({
  attendance,
  employees,
  onRefresh
}: AttendanceViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const filteredAttendance = attendance.filter(a =>
    a.employeeName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const presentCount = attendance.filter(a => a.status === 'Present').length;
  const lateCount = attendance.filter(a => a.status === 'Late').length;
  const absentCount = attendance.filter(a => a.status === 'Absent').length;

  const handleManualClockIn = async (emp: Employee, status: AttendanceRecord['status']) => {
    try {
      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      await createItem<Omit<AttendanceRecord, 'id'>>('attendance', {
        employeeId: emp.id,
        employeeName: emp.name,
        date: selectedDate,
        clockIn: status === 'Absent' ? '--:--' : nowTime,
        status,
        workHours: status === 'Present' ? 8 : status === 'Late' ? 7.5 : 0,
        notes: `Logged manually by CEO Sovereign`
      });
      alert(`Attendance recorded for ${emp.name} as ${status}`);
    } catch (err: any) {
      alert('Error updating attendance: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" />
            Attendance & Work Shift Logs
          </h2>
          <p className="text-xs text-slate-400">Verify clock-ins, late arrivals, and daily work hours</p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-200 text-xs px-3 py-1.5 rounded-xl focus:outline-none"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block">On Shift / Present</span>
            <span className="text-2xl font-extrabold text-emerald-400">{presentCount}</span>
          </div>
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block">Late Clock-Ins</span>
            <span className="text-2xl font-extrabold text-amber-400">{lateCount}</span>
          </div>
          <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block">Absences / On Leave</span>
            <span className="text-2xl font-extrabold text-rose-400">{absentCount}</span>
          </div>
          <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
            <UserX className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Quick CEO Clock-In Grid */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          Quick CEO Shift Log Override
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {employees.map((emp) => {
            const todayLog = attendance.find(a => a.employeeId === emp.id && a.date === selectedDate);

            return (
              <div
                key={emp.id}
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <img src={emp.photo} alt={emp.name} className="w-8 h-8 rounded-full object-cover" />
                  <div>
                    <p className="font-bold text-white">{emp.name}</p>
                    <p className="text-[10px] text-slate-400">{emp.position}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {todayLog ? (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      todayLog.status === 'Present' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      todayLog.status === 'Late' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {todayLog.status} ({todayLog.clockIn})
                    </span>
                  ) : (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleManualClockIn(emp, 'Present')}
                        className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold"
                      >
                        Present
                      </button>
                      <button
                        onClick={() => handleManualClockIn(emp, 'Late')}
                        className="px-2 py-0.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-[10px] font-bold"
                      >
                        Late
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Attendance Log Table */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
            <tr>
              <th className="p-3">Employee</th>
              <th className="p-3">Date</th>
              <th className="p-3">Clock In</th>
              <th className="p-3">Clock Out</th>
              <th className="p-3">Work Hours</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {filteredAttendance.map((a) => (
              <tr key={a.id} className="hover:bg-slate-950/50 transition-colors">
                <td className="p-3 font-bold text-white">{a.employeeName}</td>
                <td className="p-3 font-mono text-slate-400">{a.date}</td>
                <td className="p-3 font-mono text-emerald-400">{a.clockIn}</td>
                <td className="p-3 font-mono text-slate-400">{a.clockOut || '18:00'}</td>
                <td className="p-3 font-mono text-slate-200">{a.workHours}h</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    a.status === 'Present' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    a.status === 'Late' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                    'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {a.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
