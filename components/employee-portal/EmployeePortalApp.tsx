'use client';

import React, { useState, useEffect } from 'react';
import {
  User,
  CheckSquare,
  Clock,
  TrendingUp,
  Calendar,
  Sparkles,
  Award,
  Bell,
  CheckCircle2,
  X,
  Briefcase,
  FileText,
  Settings,
  HelpCircle,
  LogOut,
  ShieldAlert,
  Menu,
  Moon,
  Sun,
  ChevronRight,
  Send,
  Lock,
  Mail,
  Phone,
  MapPin,
  Heart,
  BookOpen,
  FolderKanban,
  Users,
  Video,
  AlertCircle
} from 'lucide-react';
import { Employee, Task, AttendanceRecord, LeaveRequest, Project, Meeting, NotificationItem } from '@/types';
import { subscribeCollection, updateItem, createItem, getSettings, DEFAULT_SETTINGS, ensureDefaultEmployees, STATIC_DEFAULT_EMPLOYEES } from '@/lib/services/firestore';
import { usePathname, useRouter } from 'next/navigation';
import { comparePassword, hashPassword } from '@/lib/auth';

export default function EmployeePortalApp() {
  const pathname = usePathname();
  const router = useRouter();
  
  // Derive currentTab directly from the pathname to avoid setState in effect
  const currentTab = typeof window !== 'undefined' && pathname
    ? (pathname.split('/').filter(Boolean)[1] || 'dashboard')
    : 'dashboard';

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  
  // Auth state
  const [currentUser, setCurrentUser] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sovryx_employee_session');
      if (saved) return JSON.parse(saved);
      return null;
    }
    return null;
  });

  const [loginEmpId, setLoginEmpId] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');

  // Firestore Data State
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  // Selected Employee profile view
  const [selectedEmpId, setSelectedEmpId] = useState<string>('');
  
  // Leave form state
  const [leaveType, setLeaveType] = useState<'Annual Leave' | 'Sick Leave' | 'Casual Leave'>('Annual Leave');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveMsg, setLeaveMsg] = useState(false);

  // Profile edit state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');

  // Password change state
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [passMsg, setPassMsg] = useState(false);

  // Support ticket state
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketSent, setTicketSent] = useState(false);

  useEffect(() => {
    ensureDefaultEmployees();

    const unsub1 = subscribeCollection<Employee>('employees', (data) => {
      setEmployees(data);
      if (data.length > 0) {
        const matched = data.find(e => e.employeeId === currentUser?.employeeId || e.id === currentUser?.id);
        if (matched) {
          setSelectedEmpId(matched.id);
        } else if (!selectedEmpId) {
          setSelectedEmpId(data[0].id);
        }
      }
    });
    const unsub2 = subscribeCollection<Task>('tasks', (data) => setTasks(data));
    const unsub3 = subscribeCollection<AttendanceRecord>('attendance', (data) => setAttendance(data));
    const unsub4 = subscribeCollection<LeaveRequest>('leaveRequests', (data) => setLeaveRequests(data));
    const unsub5 = subscribeCollection<Project>('projects', (data) => setProjects(data));
    const unsub6 = subscribeCollection<Meeting>('meetings', (data) => setMeetings(data));
    const unsub7 = subscribeCollection<NotificationItem>('notifications', (data) => setNotifications(data));
    
    getSettings().then(s => s && setSettings(s));

    return () => {
      unsub1(); unsub2(); unsub3(); unsub4(); unsub5(); unsub6(); unsub7();
    };
  }, []);

  // Safe client-side mount state
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    if (!currentUser) {
      router.replace('/employee/login');
    }
    setTimeout(() => setMounted(true), 0);
  }, [router, currentUser]);

  useEffect(() => {
    if (mounted && currentUser && employees.length > 0) {
      const matched = employees.find(e => e.employeeId === currentUser?.employeeId || e.id === currentUser?.id);
      if (matched) {
        setTimeout(() => setSelectedEmpId(matched.id), 0);
      }
    }
  }, [mounted, currentUser, employees]);

  const handleTabChange = (tabId: string) => {
    router.push(`/employee/${tabId}`);
  };

  if (!mounted || !currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-100 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-400 font-medium">Authenticating Employee Session...</p>
        </div>
      </div>
    );
  }

  const currentEmployee = employees.find(e => e.id === selectedEmpId) || employees[0];
  const empTasks = tasks.filter(t => t.employeeId === currentEmployee?.id);
  const empProjects = projects.filter(p => p.employeeIds?.includes(currentEmployee?.id));
  const empLeaveRequests = leaveRequests.filter(l => l.employeeId === currentEmployee?.id);
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAttendance = attendance.find(a => a.employeeId === currentEmployee?.id && a.date === todayStr);



  const handleClockIn = async () => {
    if (!currentEmployee) return;
    try {
      const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (todayAttendance) {
        await updateItem('attendance', todayAttendance.id, { clockIn: timeNow, status: 'Present' });
      } else {
        await createItem('attendance', {
          employeeId: currentEmployee.id,
          employeeName: currentEmployee.name,
          date: todayStr,
          clockIn: timeNow,
          clockOut: '--:--',
          status: 'Present',
          workHours: 0,
          companyId: 'sovryx-hq'
        });
      }
      alert('Checked In Successfully!');
    } catch (err: any) {
      alert('Error clocking in: ' + err.message);
    }
  };

  const handleClockOut = async () => {
    if (!currentEmployee || !todayAttendance) return;
    try {
      const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      await updateItem('attendance', todayAttendance.id, { clockOut: timeNow, workHours: 8.5 });
      alert('Checked Out Successfully!');
    } catch (err: any) {
      alert('Error clocking out: ' + err.message);
    }
  };

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEmployee || !startDate || !endDate || !leaveReason) return;
    try {
      await createItem('leaveRequests', {
        employeeId: currentEmployee.id,
        employeeName: currentEmployee.name,
        companyId: 'sovryx-hq',
        type: leaveType,
        startDate,
        endDate,
        totalDays: 2,
        reason: leaveReason,
        status: 'Pending',
        createdAt: todayStr
      });
      setLeaveReason('');
      setStartDate('');
      setEndDate('');
      setLeaveMsg(true);
      setTimeout(() => setLeaveMsg(false), 4000);
    } catch (err: any) {
      alert('Error submitting leave: ' + err.message);
    }
  };

  const handleTaskToggle = async (taskId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'Completed' ? 'In Progress' : 'Completed';
    try {
      await updateItem('tasks', taskId, {
        status: nextStatus,
        completionPercentage: nextStatus === 'Completed' ? 100 : 50
      });
    } catch (err: any) {
      alert('Error updating task: ' + err.message);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEmployee) return;
    try {
      await updateItem('employees', currentEmployee.id, {
        phone: editPhone || currentEmployee.phone,
        permanentAddress: { ...currentEmployee.permanentAddress, municipality: editAddress || currentEmployee.permanentAddress?.municipality }
      });
      setIsEditingProfile(false);
      alert('Profile updated successfully!');
    } catch (err: any) {
      alert('Error updating profile: ' + err.message);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPass || !newPass) return;
    if (!comparePassword(currentPass, currentEmployee.password)) {
      alert('Current password incorrect!');
      return;
    }
    try {
      await updateItem('employees', currentEmployee.id, { password: hashPassword(newPass) });
      setPassMsg(true);
      setCurrentPass('');
      setNewPass('');
      setTimeout(() => setPassMsg(false), 4000);
    } catch (err: any) {
      alert('Error changing password: ' + err.message);
    }
  };

  const handleSendTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject || !ticketMessage) return;
    setTicketSent(true);
    setTicketSubject('');
    setTicketMessage('');
    setTimeout(() => setTicketSent(false), 4000);
  };



  return (
    <div className={`min-h-screen ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} flex`}>
      {/* Employee Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 border-r border-slate-800 transition-all duration-300 flex flex-col z-20`}>
        <div className="p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-base shrink-0 shadow-lg shadow-indigo-600/30">
              S
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="text-xs font-extrabold text-white tracking-wider uppercase">Sovryx OS</h1>
                <p className="text-[10px] text-indigo-400 font-mono">Employee Portal</p>
              </div>
            )}
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-400 hover:text-white p-1">
            <Menu className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: Briefcase },
            { id: 'profile', label: 'My Profile', icon: User },
            { id: 'attendance', label: 'Attendance', icon: Clock },
            { id: 'leave', label: 'Leave & Time Off', icon: Calendar },
            { id: 'tasks', label: 'Assigned Tasks', icon: CheckSquare },
            { id: 'projects', label: 'Projects', icon: FolderKanban },
            { id: 'calendar', label: 'BS/AD Calendar', icon: Calendar },
            { id: 'meetings', label: 'Meetings', icon: Video },
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'settings', label: 'Settings', icon: Settings },
            { id: 'help', label: 'Help Center', icon: HelpCircle },
          ].map(item => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  active
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Footer Role / Switcher */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          {sidebarOpen && currentEmployee && (
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <p className="text-[10px] text-slate-400 font-medium">Logged in as:</p>
              <p className="text-xs font-bold text-white truncate">{currentEmployee.name}</p>
              <p className="text-[10px] text-indigo-400 font-mono truncate">{currentEmployee.position}</p>
            </div>
          )}
          <a
            href="/login"
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            {sidebarOpen && <span>Switch to Admin</span>}
          </a>
          <button
            onClick={() => {
              setCurrentUser(null);
              localStorage.removeItem('sovryx_employee_session');
              document.cookie = 'sovryx_employee_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax';
              router.replace('/employee/login');
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-900/50 rounded-xl text-xs font-bold transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <span className="text-xs font-mono uppercase bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full border border-indigo-500/20 font-bold">
              Employee Self-Service Portal
            </span>
            <div className="hidden md:flex items-center gap-2">
              <label className="text-xs text-slate-400">Simulate Employee:</label>
              <select
                value={selectedEmpId}
                onChange={(e) => setSelectedEmpId(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none font-bold"
              >
                {employees.map(e => (
                  <option key={e.id} value={e.id}>{e.name} — {e.position}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition-colors"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
            </button>
            <div className="relative">
              <button className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white relative">
                <Bell className="w-4 h-4" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
              </button>
            </div>
            {currentEmployee && (
              <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
                <img
                  src={currentEmployee.photo || 'https://picsum.photos/seed/user/100/100'}
                  alt={currentEmployee.name}
                  className="w-9 h-9 rounded-full object-cover border border-indigo-500/40"
                />
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-bold text-white">{currentEmployee.name}</p>
                  <p className="text-[10px] text-slate-400">{currentEmployee.department}</p>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Dynamic Workspace Body */}
        <main className="flex-1 p-6 overflow-y-auto space-y-6">
          {currentEmployee && (
            <>
              {/* DASHBOARD TAB */}
              {currentTab === 'dashboard' && (
                <div className="space-y-6">
                  {/* Welcome Banner */}
                  <div className="bg-gradient-to-r from-indigo-900/60 via-slate-900 to-slate-900 p-6 rounded-2xl border border-indigo-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider">Welcome Back, Employee</span>
                      <h2 className="text-2xl font-black text-white">{currentEmployee.name} 👋</h2>
                      <p className="text-xs text-slate-400">Position: {currentEmployee.position} • Department: {currentEmployee.department}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-center">
                        <p className="text-[10px] text-slate-400">Attendance Score</p>
                        <p className="text-lg font-black text-emerald-400 font-mono">{currentEmployee.attendanceScore}%</p>
                      </div>
                      <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-center">
                        <p className="text-[10px] text-slate-400">Performance Score</p>
                        <p className="text-lg font-black text-indigo-400 font-mono">{currentEmployee.performanceScore}%</p>
                      </div>
                    </div>
                  </div>

                  {/* Attendance & Clock-In Widget */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                          <Clock className="w-4 h-4 text-emerald-400" /> Today&apos;s Attendance
                        </h3>
                        <span className="text-[10px] font-mono text-slate-400">{todayStr}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                        <div>
                          <p className="text-[10px] text-slate-400">Clock In</p>
                          <p className="text-sm font-bold text-white font-mono">{todayAttendance ? todayAttendance.clockIn : 'Not Checked In'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400">Clock Out</p>
                          <p className="text-sm font-bold text-white font-mono">{todayAttendance ? todayAttendance.clockOut : '--:--'}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={handleClockIn}
                          className="py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs transition-colors shadow-lg shadow-emerald-600/20"
                        >
                          Check In
                        </button>
                        <button
                          onClick={handleClockOut}
                          className="py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs transition-colors shadow-lg shadow-rose-600/20"
                        >
                          Check Out
                        </button>
                      </div>
                    </div>

                    {/* Quick Leave Balance */}
                    <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 space-y-4">
                      <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-indigo-400" /> Leave Balance
                      </h3>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                          <p className="text-[10px] text-slate-400">Annual</p>
                          <p className="text-base font-extrabold text-white font-mono">12 Days</p>
                        </div>
                        <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                          <p className="text-[10px] text-slate-400">Sick</p>
                          <p className="text-base font-extrabold text-white font-mono">8 Days</p>
                        </div>
                        <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                          <p className="text-[10px] text-slate-400">Casual</p>
                          <p className="text-base font-extrabold text-white font-mono">5 Days</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleTabChange('leave')}
                        className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs transition-colors"
                      >
                        Request Time Off →
                      </button>
                    </div>

                    {/* Quick Stats / Active Projects */}
                    <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 space-y-4">
                      <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                        <FolderKanban className="w-4 h-4 text-amber-400" /> Assigned Projects ({empProjects.length})
                      </h3>
                      <div className="space-y-2 max-h-28 overflow-y-auto">
                        {empProjects.length === 0 ? (
                          <p className="text-xs text-slate-500 italic">No active projects assigned.</p>
                        ) : (
                          empProjects.map(p => (
                            <div key={p.id} className="p-2 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                              <span className="font-bold text-white">{p.name}</span>
                              <span className="text-indigo-400 font-mono">{p.progress}%</span>
                            </div>
                          ))
                        )}
                      </div>
                      <button
                        onClick={() => handleTabChange('projects')}
                        className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs transition-colors"
                      >
                        View Projects →
                      </button>
                    </div>
                  </div>

                  {/* Tasks List */}
                  <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                        <CheckSquare className="w-4 h-4 text-indigo-400" /> My Assigned Tasks ({empTasks.length})
                      </h3>
                      <button onClick={() => handleTabChange('tasks')} className="text-xs text-indigo-400 hover:underline">View All</button>
                    </div>
                    <div className="space-y-2">
                      {empTasks.length === 0 ? (
                        <p className="text-xs text-slate-500 italic py-4 text-center">No tasks assigned.</p>
                      ) : (
                        empTasks.slice(0, 5).map(t => (
                          <div key={t.id} className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between gap-4">
                            <div>
                              <p className="text-xs font-bold text-white">{t.title}</p>
                              <p className="text-[10px] text-slate-400 font-mono">Deadline: {t.deadline} • Priority: {t.priority}</p>
                            </div>
                            <button
                              onClick={() => handleTaskToggle(t.id, t.status)}
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
                </div>
              )}

              {/* PROFILE TAB */}
              {currentTab === 'profile' && (
                <div className="space-y-6 max-w-4xl mx-auto">
                  <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                      <div className="flex items-center gap-4">
                        <img
                          src={currentEmployee.photo || 'https://picsum.photos/seed/user/100/100'}
                          alt={currentEmployee.name}
                          className="w-16 h-16 rounded-full object-cover border-2 border-indigo-500/40"
                        />
                        <div>
                          <h2 className="text-xl font-extrabold text-white">{currentEmployee.name}</h2>
                          <p className="text-xs text-slate-400">{currentEmployee.position} • {currentEmployee.department}</p>
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            {currentEmployee.status}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setIsEditingProfile(!isEditingProfile)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-colors"
                      >
                        {isEditingProfile ? 'Cancel' : 'Edit Profile'}
                      </button>
                    </div>

                    {isEditingProfile ? (
                      <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-semibold text-slate-300 block mb-1">Phone Number</label>
                            <input
                              type="text"
                              defaultValue={currentEmployee.phone}
                              onChange={(e) => setEditPhone(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-slate-300 block mb-1">Address / Municipality</label>
                            <input
                              type="text"
                              defaultValue={currentEmployee.permanentAddress?.municipality || ''}
                              onChange={(e) => setEditAddress(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                            />
                          </div>
                        </div>
                        <button type="submit" className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl">
                          Save Changes
                        </button>
                      </form>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                          <p className="text-slate-400 text-[10px]">Email Address</p>
                          <p className="font-bold text-white">{currentEmployee.email}</p>
                        </div>
                        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                          <p className="text-slate-400 text-[10px]">Phone</p>
                          <p className="font-bold text-white">{currentEmployee.phone}</p>
                        </div>
                        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                          <p className="text-slate-400 text-[10px]">Location</p>
                          <p className="font-bold text-white">{currentEmployee.permanentAddress?.municipality || 'Kathmandu, Nepal'}</p>
                        </div>
                      </div>
                    )}

                    {/* Skills & Experience */}
                    <div className="space-y-3 pt-4 border-t border-slate-800">
                      <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Skills & Expertise</h3>
                      <div className="flex flex-wrap gap-2">
                        {currentEmployee.skills.map((s, idx) => (
                          <span key={idx} className="px-3 py-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-lg text-xs font-bold">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ATTENDANCE TAB */}
              {currentTab === 'attendance' && (
                <div className="space-y-6">
                  <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                        <Clock className="w-5 h-5 text-emerald-400" /> Attendance Records & Logs
                      </h3>
                      <div className="flex gap-2">
                        <button onClick={handleClockIn} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs">
                          Check In Now
                        </button>
                        <button onClick={handleClockOut} className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs">
                          Check Out Now
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                          <tr>
                            <th className="p-3">Date</th>
                            <th className="p-3">Clock In</th>
                            <th className="p-3">Clock Out</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Hours Worked</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-mono">
                          {attendance.filter(a => a.employeeId === currentEmployee.id).length === 0 ? (
                            <tr>
                              <td colSpan={5} className="p-6 text-center text-slate-500 italic">No attendance records found.</td>
                            </tr>
                          ) : (
                            attendance.filter(a => a.employeeId === currentEmployee.id).map(a => (
                              <tr key={a.id} className="hover:bg-slate-800/30">
                                <td className="p-3 text-white">{a.date}</td>
                                <td className="p-3 text-emerald-400">{a.clockIn}</td>
                                <td className="p-3 text-rose-400">{a.clockOut}</td>
                                <td className="p-3">
                                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-300 rounded border border-emerald-500/25">
                                    {a.status}
                                  </span>
                                </td>
                                <td className="p-3 text-indigo-400">{a.workHours || 8.0} hrs</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* LEAVE TAB */}
              {currentTab === 'leave' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 space-y-4">
                      <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-indigo-400" /> Apply For Leave
                      </h3>
                      {leaveMsg && (
                        <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-xs text-emerald-300">
                          Leave request submitted successfully for approval!
                        </div>
                      )}
                      <form onSubmit={handleApplyLeave} className="space-y-3">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-300 block mb-1">Leave Type</label>
                          <select
                            value={leaveType}
                            onChange={(e: any) => setLeaveType(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-xl p-2.5 focus:outline-none"
                          >
                            <option value="Annual Leave">Annual Leave</option>
                            <option value="Sick Leave">Sick Leave</option>
                            <option value="Casual Leave">Casual Leave</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-300 block mb-1">Start Date</label>
                          <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-xl p-2.5 focus:outline-none"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-300 block mb-1">End Date</label>
                          <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-xl p-2.5 focus:outline-none"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-300 block mb-1">Reason</label>
                          <textarea
                            rows={3}
                            value={leaveReason}
                            onChange={(e) => setLeaveReason(e.target.value)}
                            placeholder="Reason for leave..."
                            className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-xl p-2.5 focus:outline-none"
                            required
                          />
                        </div>
                        <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs">
                          Submit Leave Request
                        </button>
                      </form>
                    </div>

                    <div className="lg:col-span-2 p-6 bg-slate-900 rounded-2xl border border-slate-800 space-y-4">
                      <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Leave History & Status</h3>
                      <div className="space-y-3">
                        {empLeaveRequests.length === 0 ? (
                          <p className="text-xs text-slate-500 italic py-6 text-center">No leave requests submitted yet.</p>
                        ) : (
                          empLeaveRequests.map(l => (
                            <div key={l.id} className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                              <div>
                                <p className="text-xs font-bold text-white">{l.type} ({l.startDate} to {l.endDate})</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">{l.reason}</p>
                              </div>
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                l.status === 'Approved' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                                l.status === 'Rejected' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                                'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              }`}>
                                {l.status}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TASKS TAB */}
              {currentTab === 'tasks' && (
                <div className="space-y-6">
                  <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 space-y-4">
                    <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <CheckSquare className="w-5 h-5 text-indigo-400" /> Assigned Tasks ({empTasks.length})
                    </h3>
                    <div className="space-y-3">
                      {empTasks.length === 0 ? (
                        <p className="text-xs text-slate-500 italic py-8 text-center">No tasks assigned to {currentEmployee.name}.</p>
                      ) : (
                        empTasks.map(t => (
                          <div key={t.id} className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between gap-4">
                            <div className="space-y-1">
                              <p className="text-xs font-bold text-white">{t.title}</p>
                              <p className="text-[10px] text-slate-400">{t.description}</p>
                              <p className="text-[10px] font-mono text-indigo-400">Deadline: {t.deadline} • Priority: {t.priority}</p>
                            </div>
                            <button
                              onClick={() => handleTaskToggle(t.id, t.status)}
                              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                t.status === 'Completed'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-indigo-600 text-white hover:bg-indigo-500'
                              }`}
                            >
                              {t.status === 'Completed' ? '✓ Completed' : 'Mark Complete'}
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* PROJECTS TAB */}
              {currentTab === 'projects' && (
                <div className="space-y-6">
                  <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 space-y-4">
                    <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <FolderKanban className="w-5 h-5 text-amber-400" /> Assigned Projects ({empProjects.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {empProjects.length === 0 ? (
                        <p className="text-xs text-slate-500 italic py-8 text-center col-span-2">No projects assigned.</p>
                      ) : (
                        empProjects.map(p => (
                          <div key={p.id} className="p-5 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-bold text-white">{p.name}</h4>
                              <span className="text-xs font-mono text-indigo-400 font-bold">{p.progress}%</span>
                            </div>
                            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                              <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${p.progress}%` }} />
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                              <span>Client: {p.client}</span>
                              <span>Deadline: {p.deadline}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* CALENDAR TAB */}
              {currentTab === 'calendar' && (
                <div className="space-y-6 max-w-4xl mx-auto">
                  <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 space-y-4 text-center">
                    <h3 className="text-base font-extrabold text-white">Nepali (BS) & English (AD) Calendar</h3>
                    <p className="text-xs text-slate-400">View upcoming company holidays, meetings, and personal events.</p>
                    <div className="p-8 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                      <p className="text-xl font-black text-indigo-400 font-mono">Shrawan 2083 BS / July 2026 AD</p>
                      <p className="text-xs text-slate-300">Today: Shrawan 8, 2083 (July 22, 2026)</p>
                      <div className="grid grid-cols-7 gap-2 pt-4 text-xs font-mono">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                          <div key={d} className="font-bold text-slate-500">{d}</div>
                        ))}
                        {Array.from({ length: 31 }).map((_, i) => (
                          <div key={i} className={`p-2 rounded-lg border ${i + 1 === 22 ? 'bg-indigo-600 text-white border-indigo-500 font-bold' : 'bg-slate-900 border-slate-800 text-slate-300'}`}>
                            {i + 1}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* MEETINGS TAB */}
              {currentTab === 'meetings' && (
                <div className="space-y-6">
                  <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 space-y-4">
                    <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <Video className="w-5 h-5 text-indigo-400" /> Upcoming Meetings ({meetings.length})
                    </h3>
                    <div className="space-y-3">
                      {meetings.length === 0 ? (
                        <p className="text-xs text-slate-500 italic py-6 text-center">No scheduled meetings.</p>
                      ) : (
                        meetings.map(m => (
                          <div key={m.id} className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                            <div>
                              <p className="text-xs font-bold text-white">{m.title}</p>
                              <p className="text-[10px] text-slate-400 font-mono">{m.date} at {m.time} ({m.durationMinutes || 30} mins)</p>
                            </div>
                            <a
                              href={(m as any).link || '#'}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold"
                            >
                              Join Meeting
                            </a>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* NOTIFICATIONS TAB */}
              {currentTab === 'notifications' && (
                <div className="space-y-6 max-w-3xl mx-auto">
                  <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 space-y-4">
                    <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <Bell className="w-5 h-5 text-amber-400" /> Recent Notifications
                    </h3>
                    <div className="space-y-2">
                      {notifications.length === 0 ? (
                        <p className="text-xs text-slate-500 italic py-6 text-center">No notifications.</p>
                      ) : (
                        notifications.map(n => (
                          <div key={n.id} className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                            <div>
                              <p className="text-xs font-bold text-white">{n.title || n.message}</p>
                              <p className="text-[10px] text-slate-400">{n.timestamp}</p>
                            </div>
                            <span className="w-2 h-2 bg-indigo-500 rounded-full" />
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* SETTINGS TAB */}
              {currentTab === 'settings' && (
                <div className="space-y-6 max-w-3xl mx-auto">
                  <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 space-y-6">
                    <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <Settings className="w-5 h-5 text-indigo-400" /> Account Security & Password
                    </h3>
                    {passMsg && (
                      <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-xs text-emerald-300">
                        Password updated successfully!
                      </div>
                    )}
                    <form onSubmit={handleChangePassword} className="space-y-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-300 block mb-1">Current Password</label>
                        <input
                          type="password"
                          value={currentPass}
                          onChange={(e) => setCurrentPass(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-300 block mb-1">New Password</label>
                        <input
                          type="password"
                          value={newPass}
                          onChange={(e) => setNewPass(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                          required
                        />
                      </div>
                      <button type="submit" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl">
                        Update Password
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* HELP CENTER TAB */}
              {currentTab === 'help' && (
                <div className="space-y-6 max-w-3xl mx-auto">
                  <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 space-y-6">
                    <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <HelpCircle className="w-5 h-5 text-indigo-400" /> Help Center & Support Ticket
                    </h3>
                    {ticketSent && (
                      <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-xs text-emerald-300">
                        Support ticket submitted to HR & IT department successfully!
                      </div>
                    )}
                    <form onSubmit={handleSendTicket} className="space-y-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-300 block mb-1">Subject</label>
                        <input
                          type="text"
                          value={ticketSubject}
                          onChange={(e) => setTicketSubject(e.target.value)}
                          placeholder="e.g. Payroll inquiry or IT hardware request"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-300 block mb-1">Message / Issue Details</label>
                        <textarea
                          rows={4}
                          value={ticketMessage}
                          onChange={(e) => setTicketMessage(e.target.value)}
                          placeholder="Describe your issue or request..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white"
                          required
                        />
                      </div>
                      <button type="submit" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl">
                        Submit Support Ticket
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
