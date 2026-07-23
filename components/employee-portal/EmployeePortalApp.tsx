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
  AlertCircle,
  Trash2,
  Play,
  Square,
  Reply,
  Paperclip,
  Download,
  Check,
  Plus,
  MessageSquare
} from 'lucide-react';
import { Employee, Task, AttendanceRecord, LeaveRequest, Project, Meeting, NotificationItem } from '@/types';
import { subscribeCollection, updateItem, createItem, getSettings, DEFAULT_SETTINGS, ensureDefaultEmployees } from '@/lib/services/firestore';
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

  // Interactive task detail states
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Subtask & Checklist form
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [newChecklistRequired, setNewChecklistRequired] = useState(false);

  // Comments / Mentions / Threaded Replies
  const [commentText, setCommentText] = useState('');
  const [showMentionsList, setShowMentionsList] = useState(false);
  const [commentReplies, setCommentReplies] = useState<{ [commentId: string]: string }>({});

  // File Upload states
  const [dragActive, setDragActive] = useState(false);

  // Timer ticking logic
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

  // Sync selected task with global task list refreshes
  useEffect(() => {
    if (selectedTask) {
      const refreshed = tasks.find(t => t.id === selectedTask.id);
      if (refreshed) {
        setSelectedTask(refreshed);
      }
    }
  }, [tasks, selectedTask]);

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

  // Synchronize route and handle redirects for a real separate page experience
  useEffect(() => {
    if (typeof window !== 'undefined' && pathname) {
      const segments = pathname.split('/').filter(Boolean);
      if (segments[0] === 'employee') {
        const subroute = segments[1] || '';
        
        if (!currentUser) {
          // If not logged in, enforce redirecting to login screen URL
          if (subroute !== 'login') {
            router.replace('/employee/login');
          }
        } else {
          // If logged in
          if (subroute === 'login' || subroute === '') {
            router.replace('/employee/dashboard');
          }
        }
      }
    }
  }, [pathname, currentUser, router]);

  const handleTabChange = (tabId: string) => {
    router.push(`/employee/${tabId}`);
  };

  const handleEmployeeLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const found = employees.find(emp => (emp.employeeId === loginEmpId || emp.email === loginEmpId));
    if (!found) {
      setLoginError('Employee ID not found. Try EMP0005.');
      return;
    }
    // Secure bcrypt verification
    if (found.password && !comparePassword(loginPass, found.password)) {
      setLoginError('Incorrect password.');
      return;
    }
    const sessionData = { employeeId: found.employeeId, name: found.name, role: found.role || 'Employee', email: found.email, id: found.id };
    setCurrentUser(sessionData);
    setSelectedEmpId(found.id);
    localStorage.setItem('sovryx_employee_session', JSON.stringify(sessionData));
    document.cookie = `sovryx_employee_session=${JSON.stringify(sessionData)}; path=/; max-age=86400; SameSite=Lax`;
    router.replace('/employee/dashboard');
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-100">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-600/20 text-emerald-400 mb-4 border border-emerald-500/30">
              <Users className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">Sovryx Employee Portal</h1>
            <p className="text-xs text-slate-400 mt-1">Sign in with Employee ID (/employee/login)</p>
          </div>

          {loginError && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 text-center">
              {loginError}
            </div>
          )}

          <form onSubmit={handleEmployeeLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Employee ID (e.g. EMP0005)</label>
              <input
                type="text"
                value={loginEmpId}
                onChange={(e) => setLoginEmpId(e.target.value)}
                placeholder="EMP0005"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
              <input
                type="password"
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-600/20"
            >
              Sign In to Employee Portal
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800 text-center space-y-3">
            <p className="text-[11px] text-slate-400">Quick Test Credentials (Password: password123):</p>
            <div className="flex flex-wrap gap-2 justify-center">
              <button type="button" onClick={() => { setLoginEmpId('EMP0005'); setLoginPass('password123'); }} className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-[10px] text-emerald-300 font-mono">Employee: EMP0005</button>
            </div>
            <div className="mt-4">
              <a href="/" className="text-xs text-emerald-400 hover:underline">Switch to Admin Portal →</a>
            </div>
          </div>
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

  // Employee Task Detail Handlers
  const handleEmpAddSubtask = async () => {
    if (!newSubtaskTitle.trim() || !selectedTask) return;
    try {
      const currentSub = selectedTask.subtasks || [];
      const updated = [...currentSub, { id: `sub-${Date.now()}`, title: newSubtaskTitle.trim(), completed: false }];
      await updateItem('tasks', selectedTask.id, { subtasks: updated });
      setNewSubtaskTitle('');
    } catch (err: any) {
      alert('Error adding subtask: ' + err.message);
    }
  };

  const handleEmpToggleSubtask = async (subId: string) => {
    if (!selectedTask) return;
    try {
      const currentSub = selectedTask.subtasks || [];
      const updated = currentSub.map((s: any) => s.id === subId ? { ...s, completed: !s.completed } : s);
      await updateItem('tasks', selectedTask.id, { subtasks: updated });
    } catch (err: any) {
      alert('Error updating subtask: ' + err.message);
    }
  };

  const handleEmpDeleteSubtask = async (subId: string) => {
    if (!selectedTask) return;
    try {
      const currentSub = selectedTask.subtasks || [];
      const updated = currentSub.filter((s: any) => s.id !== subId);
      await updateItem('tasks', selectedTask.id, { subtasks: updated });
    } catch (err: any) {
      alert('Error deleting subtask: ' + err.message);
    }
  };

  const handleEmpAddChecklist = async () => {
    if (!newChecklistTitle.trim() || !selectedTask) return;
    try {
      const currentCheck = selectedTask.checklist || [];
      const updated = [...currentCheck, { id: `chk-${Date.now()}`, label: newChecklistTitle.trim(), done: false, required: newChecklistRequired }];
      await updateItem('tasks', selectedTask.id, { checklist: updated });
      setNewChecklistTitle('');
      setNewChecklistRequired(false);
    } catch (err: any) {
      alert('Error adding checklist: ' + err.message);
    }
  };

  const handleEmpToggleChecklist = async (chkId: string) => {
    if (!selectedTask) return;
    try {
      const currentCheck = selectedTask.checklist || [];
      const updated = currentCheck.map((c: any) => c.id === chkId ? { ...c, done: !c.done } : c);
      await updateItem('tasks', selectedTask.id, { checklist: updated });
    } catch (err: any) {
      alert('Error updating checklist item: ' + err.message);
    }
  };

  const handleEmpDeleteChecklist = async (chkId: string) => {
    if (!selectedTask) return;
    try {
      const currentCheck = selectedTask.checklist || [];
      const updated = currentCheck.filter((c: any) => c.id !== chkId);
      await updateItem('tasks', selectedTask.id, { checklist: updated });
    } catch (err: any) {
      alert('Error deleting checklist item: ' + err.message);
    }
  };

  const handleEmpDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleEmpDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      await attachSimulatedFile(file.name, `${(file.size / 1024).toFixed(1)} KB`, file.type);
    }
  };

  const handleEmpFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      await attachSimulatedFile(file.name, `${(file.size / 1024).toFixed(1)} KB`, file.type);
    }
  };

  const attachSimulatedFile = async (name: string, size: string, type: string) => {
    if (!selectedTask) return;
    try {
      const currentAtt = selectedTask.attachments || [];
      const fileId = `file-${Date.now()}`;
      
      let mockUrl = 'https://picsum.photos/seed/doc/400/300';
      if (type.includes('image')) mockUrl = 'https://picsum.photos/seed/image/800/600';
      else if (type.includes('pdf')) mockUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

      const updated = [...currentAtt, {
        id: fileId,
        name,
        url: mockUrl,
        size,
        type: type || 'application/octet-stream'
      }];

      const currentAct = selectedTask.activities || [];
      const newActivity = {
        id: `act-${Date.now()}`,
        user: currentUser?.name || 'Employee',
        text: `Uploaded attachment: ${name}`,
        time: new Date().toLocaleString()
      };

      await updateItem('tasks', selectedTask.id, {
        attachments: updated,
        activities: [...currentAct, newActivity]
      });
      alert('Attachment uploaded successfully!');
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleEmpDeleteAttachment = async (fileId: string) => {
    if (!selectedTask) return;
    try {
      const currentAtt = selectedTask.attachments || [];
      const updated = currentAtt.filter((a: any) => a.id !== fileId);
      await updateItem('tasks', selectedTask.id, { attachments: updated });
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleEmpAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !selectedTask) return;
    try {
      const currentComments = selectedTask.comments || [];
      const newComment = {
        id: `comment-${Date.now()}`,
        authorName: currentUser?.name || 'Employee',
        text: commentText,
        timestamp: new Date().toLocaleString(),
        replies: []
      };

      const currentAct = selectedTask.activities || [];
      const newActivity = {
        id: `act-${Date.now()}`,
        user: currentUser?.name || 'Employee',
        text: `Added comment: "${commentText.slice(0, 30)}..."`,
        time: new Date().toLocaleString()
      };

      await updateItem('tasks', selectedTask.id, {
        comments: [...currentComments, newComment],
        activities: [...currentAct, newActivity]
      });
      setCommentText('');
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleEmpAddReply = async (commentId: string) => {
    const replyTxt = commentReplies[commentId];
    if (!replyTxt || !replyTxt.trim() || !selectedTask) return;
    try {
      const currentComments = selectedTask.comments || [];
      const updated = currentComments.map((c: any) => {
        if (c.id === commentId) {
          const reps = c.replies || [];
          return {
            ...c,
            replies: [
              ...reps,
              {
                id: `reply-${Date.now()}`,
                authorName: currentUser?.name || 'Employee',
                text: replyTxt,
                timestamp: new Date().toLocaleString()
              }
            ]
          };
        }
        return c;
      });

      await updateItem('tasks', selectedTask.id, { comments: updated });
      setCommentReplies(prev => ({ ...prev, [commentId]: '' }));
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleEmpToggleTimer = () => {
    if (!selectedTask) return;
    if (isTimerRunning) {
      // Stop timer and log hours
      const hoursLogged = Number((timerSeconds / 3600).toFixed(2));
      const currentLogs = selectedTask?.timeLogs || [];
      const currentAct = selectedTask?.activities || [];
      const newSessionLog = {
        id: `session-${Date.now()}`,
        user: currentUser?.name || 'Employee',
        hours: hoursLogged > 0 ? hoursLogged : 0.1, // Minimum 6 mins log
        date: new Date().toLocaleDateString(),
        notes: 'Employee portal active stopwatch session'
      };
      
      const newActivity = {
        id: `act-${Date.now()}`,
        user: currentUser?.name || 'Employee',
        text: `Tracked ${newSessionLog.hours} hours using stopwatch`,
        time: new Date().toLocaleString()
      };

      const updatedActual = Number(((selectedTask?.actualHours || 0) + newSessionLog.hours).toFixed(2));

      updateItem('tasks', selectedTask.id, {
        actualHours: updatedActual,
        timeLogs: [...currentLogs, newSessionLog],
        activities: [...currentAct, newActivity]
      }).then(() => {
        setIsTimerRunning(false);
        setTimerSeconds(0);
        alert(`Logged ${newSessionLog.hours} hours to task work log!`);
      });
    } else {
      setIsTimerRunning(true);
    }
  };

  const handleEmpAddManualTime = async (hours: number, note: string) => {
    if (!hours || hours <= 0 || !selectedTask) return;
    try {
      const currentLogs = selectedTask?.timeLogs || [];
      const currentAct = selectedTask?.activities || [];
      const newLog = {
        id: `session-${Date.now()}`,
        user: currentUser?.name || 'Employee',
        hours,
        date: new Date().toLocaleDateString(),
        notes: note || 'Manual time entry'
      };

      const newActivity = {
        id: `act-${Date.now()}`,
        user: currentUser?.name || 'Employee',
        text: `Added manual time entry of ${hours} hours`,
        time: new Date().toLocaleString()
      };

      await updateItem('tasks', selectedTask.id, {
        actualHours: Number(((selectedTask.actualHours || 0) + hours).toFixed(2)),
        timeLogs: [...currentLogs, newLog],
        activities: [...currentAct, newActivity]
      });
      alert(`Manual log of ${hours} hrs logged!`);
    } catch (err: any) {
      alert('Error logging time: ' + err.message);
    }
  };

  const handleEmpUpdateDetailedStatus = async (taskId: string, newStatus: string) => {
    try {
      let pct = 0;
      let coreStatus: Task['status'] = 'Todo';

      if (newStatus === 'Not Started') { pct = 0; coreStatus = 'Todo'; }
      else if (newStatus === 'To Do') { pct = 10; coreStatus = 'Todo'; }
      else if (newStatus === 'In Progress') { pct = 40; coreStatus = 'In Progress'; }
      else if (newStatus === 'Under Review') { pct = 80; coreStatus = 'Review'; }
      else if (newStatus === 'Testing') { pct = 90; coreStatus = 'Review'; }
      else if (newStatus === 'Completed') { pct = 100; coreStatus = 'Completed'; }
      else if (newStatus === 'Cancelled') { pct = 100; coreStatus = 'Completed'; }

      // Required checklist validation check
      const tsk = tasks.find(t => t.id === taskId);
      if (newStatus === 'Completed' && tsk?.checklist) {
        const uncompletedRequired = tsk.checklist.filter((c: any) => c.required && !c.done);
        if (uncompletedRequired.length > 0) {
          alert(`Quality Gate Block: You must complete all required checklist items first!\nPending items: ${uncompletedRequired.map(r => r.label).join(', ')}`);
          return;
        }
      }

      const activityLog = tsk?.activities || [];
      const newActivity = {
        id: `act-${Date.now()}`,
        user: currentUser?.name || 'Employee',
        text: `Changed status to ${newStatus}`,
        time: new Date().toLocaleString()
      };

      await updateItem('tasks', taskId, {
        status: coreStatus,
        detailedStatus: newStatus,
        completionPercentage: pct,
        activities: [...activityLog, newActivity]
      });
      alert(`Status updated successfully to ${newStatus}!`);
    } catch (err: any) {
      alert('Error updating status: ' + err.message);
    }
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
            href="/"
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
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                          <CheckSquare className="w-5 h-5 text-indigo-400" /> My Assigned Action Tasks ({empTasks.length})
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">Click any task to launch the detailed workplace stopwatch, checklists, and discussions forum.</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {empTasks.length === 0 ? (
                        <p className="text-xs text-slate-500 italic py-8 text-center">No tasks assigned to {currentEmployee.name}.</p>
                      ) : (
                        empTasks.map(t => (
                          <div
                            key={t.id}
                            onClick={() => {
                              setSelectedTask(t);
                              setShowDetailModal(true);
                            }}
                            className="p-4 bg-slate-950 hover:bg-slate-900/60 transition-all rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer group"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-mono text-indigo-400 font-bold">{t.taskId}</span>
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                  t.priority === 'Urgent' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                  t.priority === 'High' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                  'bg-slate-900 text-slate-300'
                                }`}>
                                  {t.priority}
                                </span>
                              </div>
                              <p className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors">{t.title}</p>
                              <p className="text-[10px] text-slate-400 line-clamp-1">{t.description}</p>
                              <p className="text-[10px] font-mono text-slate-500">
                                SLA Timeline: {t.deadline} • Est Hours: {t.estimatedHours || 0} hrs • Logged: {t.actualHours || 0} hrs
                              </p>
                            </div>

                            <div className="flex items-center gap-2 self-start md:self-auto">
                              <span className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded font-mono text-[10px] text-indigo-400">
                                {t.completionPercentage || 0}%
                              </span>
                              <span className="px-2 py-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded font-mono text-[10px] uppercase font-bold">
                                {(t as any).detailedStatus || t.status}
                              </span>
                            </div>
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

      {/* DETAILED WORKSPACE MODAL FOR THE PORTAL */}
      {showDetailModal && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm overflow-y-auto text-slate-100">
          <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl p-6 my-8 flex flex-col md:flex-row gap-6">
            
            {/* LEFT MAIN AREA */}
            <div className="flex-1 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold text-indigo-400">{selectedTask.taskId}</span>
                  <h3 className="text-base font-extrabold text-white">{selectedTask.title}</h3>
                </div>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setIsTimerRunning(false);
                  }}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* STATS STRIP */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                  <p className="text-slate-400 text-[10px]">Current Status</p>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <select
                      value={(selectedTask as any).detailedStatus || selectedTask.status}
                      onChange={e => handleEmpUpdateDetailedStatus(selectedTask.id, e.target.value)}
                      className="bg-slate-900 border border-slate-800 text-[11px] font-bold rounded-lg text-indigo-400 focus:outline-none p-1 w-full text-center"
                    >
                      {['Not Started', 'To Do', 'In Progress', 'Under Review', 'Testing', 'Completed', 'Cancelled'].map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                  <p className="text-slate-400 text-[10px]">Priority</p>
                  <p className="font-extrabold text-amber-400 mt-1.5">{selectedTask.priority}</p>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                  <p className="text-slate-400 text-[10px]">Completion Percentage</p>
                  <p className="font-extrabold text-indigo-400 mt-1.5 font-mono">{selectedTask.completionPercentage || 0}%</p>
                </div>
              </div>

              {/* DESCRIPTION BOX */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                <h4 className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Description Guidelines</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{selectedTask.description}</p>
              </div>

              {/* SUBTASKS MANAGER */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center justify-between">
                  <span>🗂️ Subtasks ({selectedTask.subtasks?.length || 0})</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Completed: {selectedTask.subtasks?.filter((s: any) => s.completed).length || 0}
                  </span>
                </h4>
                
                <div className="space-y-2">
                  {selectedTask.subtasks?.map((sub: any) => (
                    <div key={sub.id} className="flex items-center justify-between gap-3 p-2 bg-slate-900 rounded-lg border border-slate-800">
                      <button
                        onClick={() => handleEmpToggleSubtask(sub.id)}
                        className="flex items-center gap-2 text-xs text-left"
                      >
                        <span className={`p-0.5 rounded border ${sub.completed ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-700 text-transparent'}`}>
                          <Check className="w-3 h-3" />
                        </span>
                        <span className={`${sub.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>{sub.title}</span>
                      </button>
                      <button onClick={() => handleEmpDeleteSubtask(sub.id)} className="text-slate-500 hover:text-rose-400">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-1.5">
                  <input
                    type="text"
                    placeholder="Add subtask title..."
                    value={newSubtaskTitle}
                    onChange={e => setNewSubtaskTitle(e.target.value)}
                    className="bg-slate-900 border border-slate-800 text-xs text-slate-200 px-3 py-2 rounded-xl focus:outline-none flex-1"
                  />
                  <button onClick={handleEmpAddSubtask} className="px-3.5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold">
                    Add
                  </button>
                </div>
              </div>

              {/* CHECKLISTS QUALITY GATES */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center justify-between">
                  <span>✅ Checklist Quality Gates</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Completed: {selectedTask.checklist?.filter((c: any) => c.done).length || 0}
                  </span>
                </h4>

                <div className="space-y-2">
                  {selectedTask.checklist?.map((chk: any) => (
                    <div key={chk.id} className="flex items-center justify-between gap-3 p-2 bg-slate-900 rounded-lg border border-slate-800">
                      <button
                        onClick={() => handleEmpToggleChecklist(chk.id)}
                        className="flex items-center gap-2 text-xs text-left"
                      >
                        <span className={`p-0.5 rounded border ${chk.done ? 'bg-emerald-600 border-emerald-500 text-white' : 'border-slate-700 text-transparent'}`}>
                          <Check className="w-3 h-3" />
                        </span>
                        <span className={`${chk.done ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                          {chk.label} {chk.required && <span className="text-rose-400 font-bold ml-1">*Required Gate</span>}
                        </span>
                      </button>
                      <button onClick={() => handleEmpDeleteChecklist(chk.id)} className="text-slate-500 hover:text-rose-400">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 pt-1.5 border-t border-slate-900">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add checklist item..."
                      value={newChecklistTitle}
                      onChange={e => setNewChecklistTitle(e.target.value)}
                      className="bg-slate-900 border border-slate-800 text-xs text-slate-200 px-3 py-2 rounded-xl focus:outline-none flex-1"
                    />
                    <button onClick={handleEmpAddChecklist} className="px-3.5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold">
                      Add Item
                    </button>
                  </div>
                  <label className="flex items-center gap-1.5 text-[10px] text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newChecklistRequired}
                      onChange={e => setNewChecklistRequired(e.target.checked)}
                      className="rounded bg-slate-900 border-slate-800 text-indigo-600 focus:ring-0"
                    />
                    Mark as Required Checklist Gate (Task completion block)
                  </label>
                </div>
              </div>

              {/* ATTACHMENTS VAULT */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  📎 Attachments & File Vault
                </h4>

                <div
                  onDragEnter={handleEmpDrag}
                  onDragOver={handleEmpDrag}
                  onDragLeave={handleEmpDrag}
                  onDrop={handleEmpDrop}
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors text-xs ${
                    dragActive ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-800 hover:border-indigo-500/40 bg-slate-900/30'
                  }`}
                >
                  <Paperclip className="w-5 h-5 mx-auto text-slate-500 mb-1.5" />
                  <p className="text-slate-300 font-bold">Drag and drop files here, or click to browse</p>
                  <input
                    type="file"
                    onChange={handleEmpFileSelect}
                    className="hidden"
                    id="emp-attachment-file-input"
                  />
                  <label htmlFor="emp-attachment-file-input" className="mt-2 inline-block px-3 py-1 bg-slate-800 text-slate-300 rounded text-[10px] font-bold">
                    Select File
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                  {selectedTask.attachments?.map((att: any) => (
                    <div key={att.id} className="p-2 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between text-xs gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-slate-200 font-bold truncate">{att.name}</p>
                          <p className="text-[9px] text-slate-500 font-mono">{att.size || '320 KB'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <a href={att.url} target="_blank" rel="noreferrer" className="p-1 text-slate-400 hover:text-white">
                          <Download className="w-4 h-4" />
                        </a>
                        <button onClick={() => handleEmpDeleteAttachment(att.id)} className="p-1 text-slate-500 hover:text-rose-400">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* COMMENTS COLLABORATION */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-4">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-indigo-400" /> Discussion Board Forum
                </h4>

                <form onSubmit={handleEmpAddComment} className="space-y-2">
                  <div className="relative">
                    <textarea
                      rows={2}
                      placeholder="Add conversation comments... use @Name to mention"
                      value={commentText}
                      onChange={e => {
                        setCommentText(e.target.value);
                        if (e.target.value.endsWith('@')) {
                          setShowMentionsList(true);
                        } else {
                          setShowMentionsList(false);
                        }
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                    {showMentionsList && (
                      <div className="absolute left-0 bottom-full bg-slate-950 border border-slate-800 rounded-xl p-1 shadow-2xl z-20 max-h-32 overflow-y-auto w-48 text-xs">
                        <p className="p-1.5 text-[9px] text-slate-500 font-mono font-bold uppercase border-b border-slate-900">Mention staff</p>
                        {employees.map(e => (
                          <button
                            key={e.id}
                            type="button"
                            onClick={() => {
                              setCommentText(prev => prev.slice(0, -1) + `@${e.name} `);
                              setShowMentionsList(false);
                            }}
                            className="w-full text-left p-1.5 hover:bg-indigo-600 rounded text-slate-200 hover:text-white"
                          >
                            {e.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end">
                    <button type="submit" className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold">
                      <Send className="w-3.5 h-3.5" /> Post Comment
                    </button>
                  </div>
                </form>

                <div className="space-y-4 pt-3 border-t border-slate-900">
                  {selectedTask.comments?.length === 0 ? (
                    <p className="text-[11px] text-slate-500 italic py-2 text-center">No comments posted yet.</p>
                  ) : (
                    selectedTask.comments?.map((com: any) => (
                      <div key={com.id} className="space-y-3 p-3 bg-slate-900/60 rounded-xl border border-slate-800/60 text-xs">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-white flex items-center gap-1">
                            <User className="w-3 h-3 text-indigo-400" /> {com.authorName}
                          </p>
                          <span className="text-[9px] text-slate-500 font-mono">{com.timestamp}</span>
                        </div>
                        <p className="text-slate-300 leading-relaxed pl-1">{com.text}</p>

                        <div className="pl-6 space-y-2 border-l-2 border-indigo-500/20">
                          {com.replies?.map((rep: any) => (
                            <div key={rep.id} className="p-2 bg-slate-950 rounded-lg border border-slate-900/80">
                              <div className="flex items-center justify-between">
                                <p className="font-bold text-slate-300 font-mono text-[10px]">{rep.authorName}</p>
                                <span className="text-[9px] text-slate-500">{rep.timestamp}</span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-1">{rep.text}</p>
                            </div>
                          ))}

                          <div className="flex gap-2 pt-2">
                            <input
                              type="text"
                              placeholder="Reply directly to this thread..."
                              value={commentReplies[com.id] || ''}
                              onChange={e => setCommentReplies({ ...commentReplies, [com.id]: e.target.value })}
                              className="bg-slate-950 border border-slate-900 text-[11px] text-slate-200 px-3 py-1.5 rounded-xl focus:outline-none flex-1"
                            />
                            <button
                              onClick={() => handleEmpAddReply(com.id)}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-[10px]"
                            >
                              Reply
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT SIDEBAR PANEL */}
            <div className="w-full md:w-80 space-y-6">
              
              {/* STOPWATCH TIMER SECTION */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-4">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-400" /> Stopwatch Timer Track
                </h4>

                <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-center space-y-1">
                  <p className="text-[9px] uppercase font-bold tracking-wider text-slate-400">Current Session Running</p>
                  <p className="text-2xl font-black text-emerald-400 font-mono">
                    {Math.floor(timerSeconds / 3600).toString().padStart(2, '0')}:
                    {Math.floor((timerSeconds % 3600) / 60).toString().padStart(2, '0')}:
                    {(timerSeconds % 60).toString().padStart(2, '0')}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={handleEmpToggleTimer}
                    className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 uppercase tracking-wider ${
                      isTimerRunning ? 'bg-rose-600 hover:bg-rose-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    {isTimerRunning ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    {isTimerRunning ? 'Stop Timer & Log' : 'Start Session Timer'}
                  </button>
                </div>

                {/* Manual entry log form */}
                <div className="pt-3 border-t border-slate-900 space-y-2">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Log Manual Hours</p>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      id="emp-manual-log-hours"
                      placeholder="Hours"
                      className="w-20 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-200 focus:outline-none"
                    />
                    <input
                      type="text"
                      id="emp-manual-log-note"
                      placeholder="Session notes..."
                      className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-200 focus:outline-none flex-1"
                    />
                    <button
                      onClick={() => {
                        const h = Number((document.getElementById('emp-manual-log-hours') as HTMLInputElement)?.value || 0);
                        const n = (document.getElementById('emp-manual-log-note') as HTMLInputElement)?.value || '';
                        handleEmpAddManualTime(h, n);
                        (document.getElementById('emp-manual-log-hours') as HTMLInputElement).value = '';
                        (document.getElementById('emp-manual-log-note') as HTMLInputElement).value = '';
                      }}
                      className="px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold"
                    >
                      Log
                    </button>
                  </div>
                </div>

                {/* Log history list */}
                <div className="pt-3 border-t border-slate-900 space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Work Log Session Ledger</p>
                  {selectedTask.timeLogs?.length === 0 ? (
                    <p className="text-[10px] text-slate-500 italic">No work sessions logged.</p>
                  ) : (
                    selectedTask.timeLogs?.map((log: any) => (
                      <div key={log.id} className="p-2 bg-slate-900 rounded border border-slate-800 text-[10px] space-y-0.5">
                        <div className="flex justify-between font-bold">
                          <span className="text-slate-300 truncate">{log.user}</span>
                          <span className="text-emerald-400">{log.hours} hrs</span>
                        </div>
                        <p className="text-slate-500 truncate">{log.notes}</p>
                        <p className="text-[8px] text-slate-500 text-right">{log.date}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* SPECIFICATION SPECS PANEL */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 text-xs">
                <h4 className="text-[10px] uppercase font-bold tracking-wider text-slate-400">SLA SPECIFICATIONS</h4>
                <div className="space-y-2">
                  <div>
                    <span className="text-slate-500 text-[10px] block">Project Context</span>
                    <span className="font-bold text-white">{selectedTask.projectName || 'General Operations'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Task Difficulty</span>
                    <span className="font-bold text-indigo-400">{selectedTask.difficulty}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Task Category</span>
                    <span className="font-bold text-white">{(selectedTask as any).category || 'Engineering'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Task Type</span>
                    <span className="font-bold text-white">{(selectedTask as any).taskType || 'Feature'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">SLA Timeline (Start to End)</span>
                    <span className="font-bold text-white">{(selectedTask as any).startDate || '2026-07-23'} to {selectedTask.deadline}</span>
                  </div>
                </div>
              </div>

              {/* TIMELINE ACTIVITIES */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <h4 className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Activity Timeline Logs</h4>
                <div className="space-y-3 max-h-56 overflow-y-auto custom-scrollbar text-[10px]">
                  {selectedTask.activities?.map((act: any) => (
                    <div key={act.id} className="border-l-2 border-indigo-500/30 pl-2.5 py-0.5 space-y-0.5">
                      <p className="text-slate-300 font-bold">{act.user}</p>
                      <p className="text-slate-400">{act.text}</p>
                      <p className="text-[8px] text-slate-500 font-mono">{act.time}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
