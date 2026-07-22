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
  Plus,
  Home,
  Briefcase,
  Sun,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { AttendanceRecord, Employee, PublicHoliday } from '@/types';
import { createItem, updateItem } from '@/lib/services/firestore';
import { DEFAULT_NEPAL_HOLIDAYS, formatDate } from '@/lib/utils';

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
  const [activeTab, setActiveTab] = useState<'daily' | 'holidays'>('daily');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [holidays, setHolidays] = useState<PublicHoliday[]>(DEFAULT_NEPAL_HOLIDAYS);
  const [newHolidayName, setNewHolidayName] = useState('');
  const [newHolidayDate, setNewHolidayDate] = useState('');
  const [newHolidayBS, setNewHolidayBS] = useState('');

  const filteredAttendance = attendance.filter(a =>
    a.employeeName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const presentCount = attendance.filter(a => a.status === 'Present' || a.status === 'Work From Home' || a.status === 'Official Visit').length;
  const lateCount = attendance.filter(a => a.status === 'Late' || a.status === 'Early Leave').length;
  const absentCount = attendance.filter(a => a.status === 'Absent' || a.status === 'On Leave' || a.status === 'Half Day').length;

  const handleManualClockIn = async (emp: Employee, status: AttendanceRecord['status']) => {
    try {
      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      await createItem<Omit<AttendanceRecord, 'id'>>('attendance', {
        employeeId: emp.id,
        employeeName: emp.name,
        date: selectedDate,
        clockIn: status === 'Absent' ? '--:--' : nowTime,
        status,
        workHours: status === 'Present' || status === 'Work From Home' || status === 'Official Visit' ? 8 : status === 'Half Day' ? 4 : status === 'Late' ? 7.5 : 0,
        notes: `Recorded via Sovryx Nepal OS`
      });
      onRefresh();
    } catch (err: any) {
      alert('Error updating attendance: ' + err.message);
    }
  };

  const handleAddHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHolidayName || !newHolidayDate) return;
    const hol: PublicHoliday = {
      id: `hol-${Date.now()}`,
      name: newHolidayName,
      date: newHolidayDate,
      dateBS: newHolidayBS || undefined,
      type: 'Festival',
      isRecurring: true
    };
    setHolidays([...holidays, hol]);
    setNewHolidayName('');
    setNewHolidayDate('');
    setNewHolidayBS('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" />
            Nepal Attendance & Holidays Center
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Office Check-in, Check-out, Late Arrival, Early Leave, Half Day, WFH, Official Visit & Yearly Nepal Public Holidays
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('daily')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'daily'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Daily Log
          </button>
          <button
            onClick={() => setActiveTab('holidays')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'holidays'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Public Holidays ({holidays.length})
          </button>
        </div>
      </div>

      {activeTab === 'daily' ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block">On Duty / Active</span>
                <span className="text-2xl font-extrabold text-emerald-400">{presentCount}</span>
              </div>
              <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block">Late / Early Leave</span>
                <span className="text-2xl font-extrabold text-amber-400">{lateCount}</span>
              </div>
              <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block">Absent / Leave / Half Day</span>
                <span className="text-2xl font-extrabold text-rose-400">{absentCount}</span>
              </div>
              <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
                <UserX className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Quick Shift Override Grid */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Quick Attendance Override ({selectedDate})
              </h3>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-200 text-xs px-3 py-1.5 rounded-xl focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {employees.map((emp) => {
                const todayLog = attendance.find(a => a.employeeId === emp.id && a.date === selectedDate);

                return (
                  <div
                    key={emp.id}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between gap-2.5 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <img src={emp.photo || 'https://picsum.photos/seed/avatar/200/200'} alt={emp.name} className="w-8 h-8 rounded-full object-cover" />
                      <div>
                        <p className="font-bold text-white">{emp.name}</p>
                        <p className="text-[10px] text-slate-400">{emp.position}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-800/80 pt-2">
                      {todayLog ? (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          todayLog.status === 'Present' || todayLog.status === 'Work From Home' || todayLog.status === 'Official Visit'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : todayLog.status === 'Late' || todayLog.status === 'Early Leave'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {todayLog.status} ({todayLog.clockIn})
                        </span>
                      ) : (
                        <div className="flex flex-wrap items-center gap-1">
                          <button
                            onClick={() => handleManualClockIn(emp, 'Present')}
                            className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold"
                          >
                            Office
                          </button>
                          <button
                            onClick={() => handleManualClockIn(emp, 'Work From Home')}
                            className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-bold"
                          >
                            WFH
                          </button>
                          <button
                            onClick={() => handleManualClockIn(emp, 'Official Visit')}
                            className="px-2 py-0.5 bg-purple-600 hover:bg-purple-500 text-white rounded text-[10px] font-bold"
                          >
                            Visit
                          </button>
                          <button
                            onClick={() => handleManualClockIn(emp, 'Late')}
                            className="px-2 py-0.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-[10px] font-bold"
                          >
                            Late
                          </button>
                          <button
                            onClick={() => handleManualClockIn(emp, 'Half Day')}
                            className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-bold"
                          >
                            Half Day
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
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Employee</th>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Clock In</th>
                    <th className="p-3.5">Clock Out</th>
                    <th className="p-3.5">Work Hours</th>
                    <th className="p-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredAttendance.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 font-bold text-white">{a.employeeName}</td>
                      <td className="p-3.5 font-mono text-slate-400">{formatDate(a.date)}</td>
                      <td className="p-3.5 font-mono text-emerald-400">{a.clockIn}</td>
                      <td className="p-3.5 font-mono text-slate-400">{a.clockOut || '17:00'}</td>
                      <td className="p-3.5 font-mono text-slate-200">{a.workHours}h</td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          a.status === 'Present' || a.status === 'Work From Home' || a.status === 'Official Visit'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : a.status === 'Late' || a.status === 'Early Leave'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
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
        </>
      ) : (
        /* Nepal Holidays Tab */
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-400" />
              Configure Nepal Public & Festival Holidays
            </h3>

            <form onSubmit={handleAddHoliday} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Holiday Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Indra Jatra"
                  value={newHolidayName}
                  onChange={e => setNewHolidayName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Date (AD) *</label>
                <input
                  type="date"
                  required
                  value={newHolidayDate}
                  onChange={e => setNewHolidayDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Vikram Sambat (BS)</label>
                <input
                  type="text"
                  placeholder="e.g. 2083-06-12"
                  value={newHolidayBS}
                  onChange={e => setNewHolidayBS(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg"
                >
                  Add Holiday
                </button>
              </div>
            </form>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {holidays.map((h) => (
              <div key={h.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-start justify-between">
                  <h4 className="font-bold text-white text-sm">{h.name}</h4>
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">
                    {h.type}
                  </span>
                </div>
                <div className="text-xs text-slate-400 space-y-1">
                  <p>AD Date: <span className="font-mono text-slate-200">{formatDate(h.date)}</span></p>
                  {h.dateBS && <p>BS Date: <span className="font-mono text-indigo-300">{h.dateBS}</span></p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

