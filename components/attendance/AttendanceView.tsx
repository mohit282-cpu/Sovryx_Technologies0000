'use client';

import React, { useState, useEffect } from 'react';
import {
  Clock,
  UserCheck,
  UserX,
  AlertTriangle,
  CheckCircle2,
  Calendar as CalendarIcon,
  Search,
  Plus,
  Sparkles,
  PartyPopper,
  Trash2
} from 'lucide-react';
import { AttendanceRecord, Employee, Holiday } from '@/types';
import { createItem, deleteItem, subscribeCollection } from '@/lib/services/firestore';
import { adToBs, formatDualDate, BS_MONTHS_EN } from '@/lib/nepaliCalendar';

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
  const [activeTab, setActiveTab] = useState<'attendance' | 'holidays'>('attendance');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [holidays, setHolidays] = useState<Holiday[]>([]);

  // Holiday modal state
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
  const [holidayTitle, setHolidayTitle] = useState('');
  const [holidayTitleNp, setHolidayTitleNp] = useState('');
  const [holidayDateAD, setHolidayDateAD] = useState('');
  const [holidayType, setHolidayType] = useState<Holiday['type']>('Public Holiday');
  const [isRecurring, setIsRecurring] = useState(true);

  useEffect(() => {
    const unsub = subscribeCollection<Holiday>('holidays', (data) => setHolidays(data));
    return () => unsub();
  }, []);

  const bsDate = adToBs(selectedDate);

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

  const handleCreateHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!holidayTitle || !holidayDateAD) return;

    const bs = adToBs(holidayDateAD);

    try {
      await createItem<Omit<Holiday, 'id'>>('holidays', {
        title: holidayTitle,
        titleNp: holidayTitleNp,
        dateAD: holidayDateAD,
        dateBS: bs.strBS,
        type: holidayType,
        isRecurringYearly: isRecurring
      });

      setIsHolidayModalOpen(false);
      setHolidayTitle('');
      setHolidayTitleNp('');
      setHolidayDateAD('');
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert('Failed to save holiday: ' + err.message);
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    if (confirm('Delete this public holiday entry?')) {
      await deleteItem('holidays', id);
      if (onRefresh) onRefresh();
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" />
            Attendance & Public Holiday Register
          </h2>
          <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
            <CalendarIcon className="w-3.5 h-3.5 text-indigo-400" />
            <span>Today BS: <strong className="text-emerald-400">{bsDate.formatted} ({bsDate.strBS})</strong></span>
            <span className="text-slate-600">•</span>
            <span>AD: {selectedDate}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('attendance')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'attendance' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Daily Shift Log
            </button>
            <button
              onClick={() => setActiveTab('holidays')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'holidays' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Nepal Public Holidays ({holidays.length})
            </button>
          </div>

          {activeTab === 'holidays' && (
            <button
              onClick={() => setIsHolidayModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg"
            >
              <Plus className="w-4 h-4" /> Add Holiday
            </button>
          )}
        </div>
      </div>

      {activeTab === 'attendance' ? (
        <>
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
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Quick CEO Shift Log Override
              </h3>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-200 text-xs px-3 py-1.5 rounded-xl focus:outline-none font-mono"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {employees.map((emp) => {
                const todayLog = attendance.find(a => a.employeeId === emp.id && a.date === selectedDate);

                return (
                  <div
                    key={emp.id}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      {emp.photo ? (
                        <img src={emp.photo} alt={emp.name} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-white text-xs">
                          {emp.name.charAt(0)}
                        </div>
                      )}
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
                  <th className="p-3">Date (BS & AD)</th>
                  <th className="p-3">Clock In</th>
                  <th className="p-3">Clock Out</th>
                  <th className="p-3">Work Hours</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredAttendance.map((a) => {
                  const itemBS = adToBs(a.date);
                  return (
                    <tr key={a.id} className="hover:bg-slate-950/50 transition-colors">
                      <td className="p-3 font-bold text-white">{a.employeeName}</td>
                      <td className="p-3 text-slate-300">
                        <span className="font-bold text-emerald-400">{itemBS.formatted}</span>
                        <span className="text-[10px] text-slate-500 block font-mono">{a.date}</span>
                      </td>
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
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        /* Nepal Public Holidays Tab */
        <div className="space-y-4">
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <PartyPopper className="w-4 h-4 text-amber-400" />
              Nepal Public Holidays & Company Leave Calendar
            </h3>
            <p className="text-xs text-slate-400">
              Official Nepal gazetted holidays and custom company holidays. Days are automatically highlighted in employee leave schedules and attendance registers.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {holidays.map((h) => {
                const holidayBS = adToBs(h.dateAD);
                return (
                  <div key={h.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 relative group">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          {h.type}
                        </span>
                        <h4 className="font-bold text-white text-sm mt-1">{h.title}</h4>
                        {h.titleNp && <p className="text-xs text-amber-400 font-medium">{h.titleNp}</p>}
                      </div>
                      <button
                        onClick={() => handleDeleteHoliday(h.id)}
                        className="text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 text-xs font-mono space-y-0.5">
                      <p className="text-emerald-400 font-bold">BS: {holidayBS.formatted} ({holidayBS.strBS})</p>
                      <p className="text-slate-500 text-[11px]">AD: {h.dateAD}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Add Holiday Modal */}
      {isHolidayModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <h3 className="font-bold text-white text-sm">Add Nepal Public / Company Holiday</h3>
              <button onClick={() => setIsHolidayModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateHoliday} className="p-5 space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">Holiday Title (English) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dashain (Vijaya Dashami)"
                  value={holidayTitle}
                  onChange={e => setHolidayTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Holiday Title (Nepali Devanagari)</label>
                <input
                  type="text"
                  placeholder="e.g. बडा दशैं (विजया दशमी)"
                  value={holidayTitleNp}
                  onChange={e => setHolidayTitleNp(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Holiday Date (AD Gregorian) *</label>
                <input
                  type="date"
                  required
                  value={holidayDateAD}
                  onChange={e => setHolidayDateAD(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                />
                {holidayDateAD && (
                  <p className="text-[11px] text-emerald-400 mt-1 font-mono">
                    Equivalent BS: {adToBs(holidayDateAD).formatted}
                  </p>
                )}
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Holiday Type</label>
                <select
                  value={holidayType}
                  onChange={e => setHolidayType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                >
                  <option value="Public Holiday">Nepal Public Holiday</option>
                  <option value="Festival">Festival Holiday</option>
                  <option value="Company Holiday">Company Specific Holiday</option>
                  <option value="Optional">Optional Holiday</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsHolidayModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  Save Holiday
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

