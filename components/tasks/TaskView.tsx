'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  CheckSquare,
  Plus,
  Search,
  Sparkles,
  User,
  Users,
  Briefcase,
  Clock,
  Award,
  AlertTriangle,
  X,
  ChevronRight,
  Filter,
  Brain,
  Trash2,
  Edit,
  Calendar,
  FolderKanban,
  Check,
  Play,
  Square,
  Paperclip,
  MessageSquare,
  Reply,
  Bookmark,
  RefreshCw,
  Send,
  Download,
  BarChart2,
  CheckCircle2,
  Shield,
  Eye,
  Copy,
  Archive,
  FileText
} from 'lucide-react';
import { Task, Employee, Project } from '@/types';
import { createItem, updateItem, deleteItem } from '@/lib/services/firestore';
import { callAI } from '@/lib/aiClient';
import EmptyState from '@/components/ui/EmptyState';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface TaskViewProps {
  tasks: Task[];
  employees: Employee[];
  projects: Project[];
  onRefresh: () => void;
}

const ALL_STATUSES = ['Not Started', 'To Do', 'In Progress', 'Under Review', 'Testing', 'Completed', 'Cancelled'] as const;
type DetailedStatus = typeof ALL_STATUSES[number];

const TASK_TEMPLATES = [
  {
    name: 'Software Feature Deliverable',
    title: 'Implement Core Feature API and UI Integration',
    description: 'Design, write, test, and integrate the full-stack feature block including database schema, API handlers, and dashboard components.',
    priority: 'High',
    difficulty: 'Hard',
    estimatedHours: 35,
    category: 'Engineering',
    subtasks: [
      { id: 'sub-1', title: 'Draft database model and schema migrations', completed: false },
      { id: 'sub-2', title: 'Implement back-end server routes and validations', completed: false },
      { id: 'sub-3', title: 'Build React UI components with responsive mockups', completed: false },
      { id: 'sub-4', title: 'Review security rules and complete testing', completed: false }
    ],
    checklist: [
      { id: 'chk-1', label: 'PR submitted & approved', done: false, required: true },
      { id: 'chk-2', label: 'Verify light/dark mode styling consistency', done: false, required: false },
      { id: 'chk-3', label: 'E2E tests pass 100%', done: false, required: true }
    ]
  },
  {
    name: 'Employee Onboarding Flow',
    title: 'Complete Onboarding & System Setup for New Hire',
    description: 'Provide secure accounts, set up hardware workstation, complete policy reviews, and introduce team coordinates.',
    priority: 'Medium',
    difficulty: 'Medium',
    estimatedHours: 12,
    category: 'Human Resources',
    subtasks: [
      { id: 'sub-5', title: 'Configure official GSuite and Github account logins', completed: false },
      { id: 'sub-6', title: 'Dispatch company laptop & access credentials', completed: false },
      { id: 'sub-7', title: 'Schedule welcome meeting & introduction', completed: false }
    ],
    checklist: [
      { id: 'chk-4', label: 'Signed handbook and code of conduct', done: false, required: true },
      { id: 'chk-5', label: 'Completed direct deposit payroll config', done: false, required: true }
    ]
  },
  {
    name: 'Monthly Client Audit',
    title: 'Conduct Project Health Audit & Review Meeting',
    description: 'Aggregate milestones, log billable hours, prepare visual budget progress charts, and coordinate with accounts.',
    priority: 'High',
    difficulty: 'Medium',
    estimatedHours: 8,
    category: 'Finance',
    subtasks: [
      { id: 'sub-8', title: 'Analyze billable engineering hours vs estimate', completed: false },
      { id: 'sub-9', title: 'Generate project health visual presentation deck', completed: false }
    ],
    checklist: [
      { id: 'chk-6', label: 'Review with project manager', done: false, required: true }
    ]
  }
];

export default function TaskView({ tasks = [], employees = [], projects = [], onRefresh }: TaskViewProps) {
  const [activeTab, setActiveTab] = useState<'board' | 'reports' | 'templates'>('board');
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [projectFilter, setProjectFilter] = useState<string>('All');
  const [employeeFilter, setEmployeeFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sortOption, setSortOption] = useState<'deadline' | 'progress'>('deadline');
  
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAITaskModal, setShowAITaskModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [showArchived, setShowArchived] = useState(false);

  // User session state for role permissions
  const [sessionUser] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      const savedAdmin = localStorage.getItem('sovryx_admin_session');
      const savedEmp = localStorage.getItem('sovryx_employee_session');
      if (savedAdmin) return JSON.parse(savedAdmin);
      if (savedEmp) return JSON.parse(savedEmp);
    }
    return null;
  });
  const userRole = sessionUser?.role || 'CEO'; // Fallback to CEO for the admin panel view
  const userEmpName = sessionUser?.name || 'Administrator';

  // Permission flags based on user role
  const isCEOOrAdmin = userRole === 'CEO' || userRole === 'Admin';
  const isHR = userRole === 'HR';
  const isManager = userRole === 'Manager';
  const canManageAllTasks = isCEOOrAdmin || isHR;
  const canCreateAndAssign = isCEOOrAdmin || isHR || isManager;

  // AI Generator Goal
  const [aiGoalBrief, setAiGoalBrief] = useState('');
  const [selectedProjectIdForAI, setSelectedProjectIdForAI] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);

  // New Task form state
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    employeeId: '',
    projectId: '',
    priority: 'Medium' as Task['priority'],
    difficulty: 'Medium' as Task['difficulty'],
    deadline: '2026-08-01',
    startDate: '2026-07-23',
    endDate: '2026-08-15',
    estimatedHours: 20,
    category: 'Engineering',
    taskType: 'Feature',
    teamAssignee: '',
    reviewerId: '',
    approverId: '',
    isRecurring: false,
    recurringInterval: 'Weekly' as any,
    subtasksJson: '[]',
    checklistJson: '[]'
  });

  // Time Tracker state in Detail view
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Mention system state in Comments
  const [commentText, setCommentText] = useState('');
  const [showMentionsList, setShowMentionsList] = useState(false);
  const [commentReplies, setCommentReplies] = useState<{ [commentId: string]: string }>({});

  // Active Detail Task Checklist / Subtasks states
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [newChecklistRequired, setNewChecklistRequired] = useState(false);

  // Simulated Drag-and-Drop state
  const [dragActive, setDragActive] = useState(false);

  // Run timer ticking
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

  // Synchronize detailed detail changes when task database refreshes
  useEffect(() => {
    if (selectedTask) {
      const refreshed = tasks.find(t => t.id === selectedTask.id);
      if (refreshed) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedTask(refreshed);
      }
    }
  }, [tasks, selectedTask]);

  // Filter & Sort Tasks
  const filteredTasks = tasks.filter(t => {
    const isArchivedMatch = showArchived ? t.isArchived === true : !t.isArchived;
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (t.taskId && t.taskId.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesPriority = priorityFilter === 'All' || t.priority === priorityFilter;
    const matchesProject = projectFilter === 'All' || t.projectId === projectFilter;
    const matchesEmployee = employeeFilter === 'All' || t.employeeId === employeeFilter;
    
    // Support dual mapping for standard vs custom status
    let matchesStatus = true;
    if (statusFilter !== 'All') {
      matchesStatus = t.status === statusFilter || (t as any).detailedStatus === statusFilter;
    }
    
    return isArchivedMatch && matchesSearch && matchesPriority && matchesProject && matchesEmployee && matchesStatus;
  }).sort((a, b) => {
    if (sortOption === 'deadline') {
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    } else {
      return (b.completionPercentage || 0) - (a.completionPercentage || 0);
    }
  });

  // Action: Create manual task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title) return;

    try {
      const emp = employees.find(e => e.id === newTask.employeeId);
      const prj = projects.find(p => p.id === newTask.projectId);
      const reviewer = employees.find(e => e.id === newTask.reviewerId);
      const approver = employees.find(e => e.id === newTask.approverId);

      const tskId = `TSK-${Math.floor(1000 + Math.random() * 9000)}`;
      
      const parsedSubtasks = JSON.parse(newTask.subtasksJson || '[]');
      const parsedChecklist = JSON.parse(newTask.checklistJson || '[]');

      await createItem<any>('tasks', {
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
        startDate: newTask.startDate,
        endDate: newTask.endDate,
        status: 'Todo',
        detailedStatus: 'To Do',
        estimatedHours: Number(newTask.estimatedHours),
        actualHours: 0,
        qualityScore: 90,
        completionPercentage: 0,
        category: newTask.category,
        taskType: newTask.taskType,
        teamAssignee: newTask.teamAssignee,
        reviewerId: newTask.reviewerId,
        reviewerName: reviewer?.name || '',
        approverId: newTask.approverId,
        approverName: approver?.name || '',
        ownerId: sessionUser?.employeeId || 'EMP0001',
        ownerName: userEmpName,
        isRecurring: newTask.isRecurring,
        recurringInterval: newTask.isRecurring ? newTask.recurringInterval : null,
        subtasks: parsedSubtasks,
        checklist: parsedChecklist,
        attachments: [],
        comments: [],
        timeLogs: [],
        activities: [
          {
            id: `act-${Date.now()}`,
            user: userEmpName,
            text: 'Created the task',
            time: new Date().toLocaleString()
          }
        ],
        isArchived: false
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
        startDate: '2026-07-23',
        endDate: '2026-08-15',
        estimatedHours: 20,
        category: 'Engineering',
        taskType: 'Feature',
        teamAssignee: '',
        reviewerId: '',
        approverId: '',
        isRecurring: false,
        recurringInterval: 'Weekly',
        subtasksJson: '[]',
        checklistJson: '[]'
      });
      alert('Task Created Successfully!');
      onRefresh();
    } catch (err: any) {
      alert('Error creating task: ' + err.message);
    }
  };

  // Load Task Template
  const loadTemplate = (tpl: any) => {
    setNewTask(prev => ({
      ...prev,
      title: tpl.title,
      description: tpl.description,
      priority: tpl.priority,
      difficulty: tpl.difficulty,
      estimatedHours: tpl.estimatedHours,
      category: tpl.category,
      subtasksJson: JSON.stringify(tpl.subtasks),
      checklistJson: JSON.stringify(tpl.checklist)
    }));
    alert(`Loaded "${tpl.name}" template parameters successfully!`);
  };

  // Action: Duplicate Task
  const handleDuplicateTask = async (tsk: any) => {
    try {
      const duplicatedId = `TSK-${Math.floor(1000 + Math.random() * 9000)}`;
      await createItem('tasks', {
        ...tsk,
        id: undefined, // Let firestore create new doc ID
        taskId: duplicatedId,
        title: `${tsk.title} (Duplicate)`,
        createdAt: new Date().toISOString(),
        comments: [],
        timeLogs: [],
        activities: [
          {
            id: `act-${Date.now()}`,
            user: userEmpName,
            text: `Duplicated from ${tsk.taskId}`,
            time: new Date().toLocaleString()
          }
        ]
      });
      alert(`Task ${tsk.taskId} duplicated successfully as ${duplicatedId}!`);
      onRefresh();
    } catch (err: any) {
      alert('Error duplicating task: ' + err.message);
    }
  };

  // Action: Toggle Archive status
  const handleToggleArchive = async (tsk: any) => {
    try {
      await updateItem('tasks', tsk.id, { isArchived: !tsk.isArchived });
      alert(tsk.isArchived ? 'Task unarchived!' : 'Task archived successfully!');
      if (selectedTask?.id === tsk.id) {
        setSelectedTask(prev => ({ ...prev, isArchived: !tsk.isArchived }));
      }
      onRefresh();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  // Action: Update detailed status & percentage
  const handleUpdateStatus = async (taskId: string, newStatus: string) => {
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

      const tsk = tasks.find(t => t.id === taskId);
      const activityLog = tsk?.activities || [];
      const newActivity = {
        id: `act-${Date.now()}`,
        user: userEmpName,
        text: `Changed status to ${newStatus}`,
        time: new Date().toLocaleString()
      };

      await updateItem('tasks', taskId, {
        status: coreStatus,
        detailedStatus: newStatus,
        completionPercentage: pct,
        activities: [...activityLog, newActivity]
      });
      onRefresh();
    } catch (err: any) {
      alert('Error updating status: ' + err.message);
    }
  };

  // Action: Delete task
  const handleDeleteTask = async (id: string) => {
    if (!canManageAllTasks) {
      alert('Access Denied: Only Administrator or HR can delete tasks.');
      return;
    }
    if (confirm('Are you absolutely sure you want to delete this task? This action is irreversible.')) {
      try {
        await deleteItem('tasks', id);
        alert('Task deleted successfully!');
        setShowDetailModal(false);
        onRefresh();
      } catch (err: any) {
        alert('Error deleting task: ' + err.message);
      }
    }
  };

  // AI Task Generation with prompt grounding
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
        alert('AI response loaded conceptually: ' + res);
        setLoadingAI(false);
        return;
      }

      if (Array.isArray(parsedTasks)) {
        for (const item of parsedTasks) {
          const tskId = `TSK-${Math.floor(1000 + Math.random() * 9000)}`;
          await createItem<any>('tasks', {
            taskId: tskId,
            title: item.title || 'AI Task',
            description: item.description || aiGoalBrief,
            employeeId: employees[0]?.id || '',
            employeeName: employees[0]?.name || 'Unassigned',
            projectId: selectedProjectIdForAI || projects[0]?.id || '',
            projectName: projects.find(p => p.id === selectedProjectIdForAI)?.name || 'AI Generated Project',
            priority: item.priority || 'High',
            difficulty: item.difficulty || 'Hard',
            deadline: '2026-08-10',
            startDate: '2026-07-23',
            endDate: '2026-08-15',
            status: 'Todo',
            detailedStatus: 'To Do',
            estimatedHours: item.estimatedHours || 15,
            actualHours: 0,
            qualityScore: 95,
            completionPercentage: 0,
            category: 'Engineering',
            taskType: 'Feature',
            subtasks: [],
            checklist: [],
            attachments: [],
            comments: [],
            timeLogs: [],
            activities: [
              {
                id: `act-${Date.now()}`,
                user: 'Gemini AI Assistant',
                text: 'Generated task automatically from company goals',
                time: new Date().toLocaleString()
              }
            ],
            isArchived: false
          });
        }
        alert(`Successfully generated and synchronized ${parsedTasks.length} AI Tasks in Firestore!`);
        setShowAITaskModal(false);
        setAiGoalBrief('');
        onRefresh();
      }
    } catch (err: any) {
      alert('AI Generation error: ' + err.message);
    } finally {
      setLoadingAI(false);
    }
  };

  // STOPWATCH TIMING LOGGERS
  const toggleTimer = () => {
    if (isTimerRunning) {
      // Stop timer and log hours
      const hoursLogged = Number((timerSeconds / 3600).toFixed(2));
      const currentLogs = selectedTask?.timeLogs || [];
      const currentAct = selectedTask?.activities || [];
      const newSessionLog = {
        id: `session-${Date.now()}`,
        user: userEmpName,
        hours: hoursLogged > 0 ? hoursLogged : 0.1, // Minimum 6 mins log
        date: new Date().toLocaleDateString(),
        notes: 'Stopwatch active tracking session'
      };
      
      const newActivity = {
        id: `act-${Date.now()}`,
        user: userEmpName,
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
        alert(`Logged ${newSessionLog.hours} hours to task actual hours!`);
      });
    } else {
      setIsTimerRunning(true);
    }
  };

  // Add Manual Time Entry
  const handleAddManualTime = async (hours: number, note: string) => {
    if (!hours || hours <= 0) return;
    try {
      const currentLogs = selectedTask?.timeLogs || [];
      const currentAct = selectedTask?.activities || [];
      const newLog = {
        id: `session-${Date.now()}`,
        user: userEmpName,
        hours,
        date: new Date().toLocaleDateString(),
        notes: note || 'Manual time entry'
      };

      const newActivity = {
        id: `act-${Date.now()}`,
        user: userEmpName,
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

  // SUBTASKS MANAGER
  const handleAddSubtask = async () => {
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

  const handleToggleSubtask = async (subId: string) => {
    if (!selectedTask) return;
    try {
      const currentSub = selectedTask.subtasks || [];
      const updated = currentSub.map((s: any) => s.id === subId ? { ...s, completed: !s.completed } : s);
      await updateItem('tasks', selectedTask.id, { subtasks: updated });
    } catch (err: any) {
      alert('Error updating subtask: ' + err.message);
    }
  };

  const handleDeleteSubtask = async (subId: string) => {
    if (!selectedTask) return;
    try {
      const currentSub = selectedTask.subtasks || [];
      const updated = currentSub.filter((s: any) => s.id !== subId);
      await updateItem('tasks', selectedTask.id, { subtasks: updated });
    } catch (err: any) {
      alert('Error deleting subtask: ' + err.message);
    }
  };

  // CHECKLISTS MANAGER
  const handleAddChecklist = async () => {
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

  const handleToggleChecklist = async (chkId: string) => {
    if (!selectedTask) return;
    try {
      const currentCheck = selectedTask.checklist || [];
      const updated = currentCheck.map((c: any) => c.id === chkId ? { ...c, done: !c.done } : c);
      await updateItem('tasks', selectedTask.id, { checklist: updated });
    } catch (err: any) {
      alert('Error updating checklist item: ' + err.message);
    }
  };

  const handleDeleteChecklist = async (chkId: string) => {
    if (!selectedTask) return;
    try {
      const currentCheck = selectedTask.checklist || [];
      const updated = currentCheck.filter((c: any) => c.id !== chkId);
      await updateItem('tasks', selectedTask.id, { checklist: updated });
    } catch (err: any) {
      alert('Error deleting checklist item: ' + err.message);
    }
  };

  // DRAG & DROP SIMULATED FILE ATTACHMENTS
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      await attachSimulatedFile(file.name, `${(file.size / 1024).toFixed(1)} KB`, file.type);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
        user: userEmpName,
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

  const handleDeleteAttachment = async (fileId: string) => {
    if (!selectedTask) return;
    try {
      const currentAtt = selectedTask.attachments || [];
      const updated = currentAtt.filter((a: any) => a.id !== fileId);
      await updateItem('tasks', selectedTask.id, { attachments: updated });
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  // COMMENTING WITH THREADED REPLIES AND @MENTIONS
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !selectedTask) return;
    try {
      const currentComments = selectedTask.comments || [];
      const newComment = {
        id: `comment-${Date.now()}`,
        authorName: userEmpName,
        text: commentText,
        timestamp: new Date().toLocaleString(),
        replies: []
      };

      const currentAct = selectedTask.activities || [];
      const newActivity = {
        id: `act-${Date.now()}`,
        user: userEmpName,
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

  const handleAddReply = async (commentId: string) => {
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
                authorName: userEmpName,
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

  // REPORT STATISTICS DATA
  const getStatsData = () => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'Completed').length;
    const pending = tasks.filter(t => t.status !== 'Completed').length;
    const overdue = tasks.filter(t => {
      const isPast = new Date(t.deadline).getTime() < Date.now();
      return isPast && t.status !== 'Completed';
    }).length;

    const inProgress = tasks.filter(t => t.status === 'In Progress').length;
    const review = tasks.filter(t => t.status === 'Review').length;

    // Build status pie chart
    const statusPie = [
      { name: 'Completed', value: completed, color: '#10B981' },
      { name: 'In Progress', value: inProgress, color: '#6366F1' },
      { name: 'Review / Testing', value: review, color: '#A855F7' },
      { name: 'To Do', value: tasks.filter(t => t.status === 'Todo').length, color: '#F59E0B' }
    ].filter(x => x.value > 0);

    // Productivity by Employee
    const employeeChart: { [name: string]: { completed: number; total: number } } = {};
    tasks.forEach(t => {
      const name = t.employeeName || 'Unassigned';
      if (!employeeChart[name]) employeeChart[name] = { completed: 0, total: 0 };
      employeeChart[name].total += 1;
      if (t.status === 'Completed') employeeChart[name].completed += 1;
    });

    const empData = Object.entries(employeeChart).map(([name, stats]) => ({
      name,
      Completed: stats.completed,
      Total: stats.total
    }));

    // Time Tracking hours: Estimated vs Actual
    const timeData = tasks.slice(0, 10).map(t => ({
      name: t.taskId || t.title.slice(0, 8),
      Estimated: t.estimatedHours || 0,
      Actual: t.actualHours || 0
    }));

    return { total, completed, pending, overdue, statusPie, empData, timeData };
  };

  const reports = getStatsData();

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-indigo-400" />
            Enterprise Task Management Workspace
          </h2>
          <p className="text-xs text-slate-400">
            Sprint tracking, checklists, custom attachments, collaborative forums, and time stopwatch logs.
          </p>
        </div>

        {/* Workspace Tab Switcher */}
        <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('board')}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg transition-colors ${
              activeTab === 'board' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckSquare className="w-4 h-4" /> Board Workspace
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg transition-colors ${
              activeTab === 'reports' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart2 className="w-4 h-4" /> Reports & Productivity
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg transition-colors ${
              activeTab === 'templates' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bookmark className="w-4 h-4" /> Load Templates
          </button>
        </div>
      </div>

      {/* QUICK STATS BAR */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800/80">
          <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Tasks</p>
          <p className="text-2xl font-extrabold text-white font-mono mt-1">{reports.total}</p>
        </div>
        <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800/80">
          <p className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">Completed</p>
          <p className="text-2xl font-extrabold text-emerald-400 font-mono mt-1">
            {reports.completed} <span className="text-xs font-normal text-slate-400">({reports.total > 0 ? Math.round((reports.completed / reports.total) * 100) : 0}%)</span>
          </p>
        </div>
        <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800/80">
          <p className="text-[10px] uppercase font-bold tracking-wider text-amber-400">Pending Execution</p>
          <p className="text-2xl font-extrabold text-amber-400 font-mono mt-1">{reports.pending}</p>
        </div>
        <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800/80">
          <p className="text-[10px] uppercase font-bold tracking-wider text-rose-400">Overdue SLA</p>
          <p className="text-2xl font-extrabold text-rose-400 font-mono mt-1">{reports.overdue}</p>
        </div>
      </div>

      {/* RENDER ACTIVE TAB */}
      {activeTab === 'board' && (
        <div className="space-y-6">
          {/* CONTROL SWITCHERS AND SEARCH FILTERS */}
          <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Left search */}
              <div className="relative w-full lg:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search Task ID, title, brief..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setShowAITaskModal(true)}
                  className="flex items-center gap-1.5 text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-4 py-2 rounded-xl transition-all shadow-md shadow-purple-600/20"
                >
                  <Sparkles className="w-4 h-4 text-purple-200" /> AI Task Planner
                </button>
                {canCreateAndAssign && (
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl transition-colors shadow-md shadow-indigo-600/25"
                  >
                    <Plus className="w-4 h-4" /> Create Manual Task
                  </button>
                )}
                <button
                  onClick={() => setShowArchived(!showArchived)}
                  className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border transition-colors ${
                    showArchived ? 'bg-rose-900/40 text-rose-300 border-rose-500/30' : 'bg-slate-950 text-slate-300 border-slate-800'
                  }`}
                >
                  <Archive className="w-4 h-4" /> {showArchived ? 'Showing Archived' : 'Show Archived'}
                </button>
              </div>
            </div>

            {/* EXPANDED FILTER SHELF */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-3 border-t border-slate-800/60 text-xs">
              <div>
                <label className="block text-slate-400 text-[10px] font-bold mb-1">Filter Project</label>
                <select
                  value={projectFilter}
                  onChange={e => setProjectFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none"
                >
                  <option value="All">All Projects</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] font-bold mb-1">Filter Employee</label>
                <select
                  value={employeeFilter}
                  onChange={e => setEmployeeFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none"
                >
                  <option value="All">All Staff</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] font-bold mb-1">Filter Priority</label>
                <select
                  value={priorityFilter}
                  onChange={e => setPriorityFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none"
                >
                  <option value="All">All Priorities</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] font-bold mb-1">Filter Status</label>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none"
                >
                  <option value="All">All Statuses</option>
                  {ALL_STATUSES.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] font-bold mb-1">Sort Metric</label>
                <select
                  value={sortOption}
                  onChange={e => setSortOption(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none"
                >
                  <option value="deadline">SLA Due Date</option>
                  <option value="progress">Task Progress %</option>
                </select>
              </div>

              <div className="flex items-end justify-end">
                <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 w-full justify-between">
                  <button
                    onClick={() => setViewMode('kanban')}
                    className={`text-[10px] font-bold py-1 px-3.5 rounded-md w-1/2 ${
                      viewMode === 'kanban' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    Kanban
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`text-[10px] font-bold py-1 px-3.5 rounded-md w-1/2 ${
                      viewMode === 'table' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    Table
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* RENDERING CORE WORKSPACE */}
          {viewMode === 'kanban' ? (
            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar select-none">
              {ALL_STATUSES.map(col => {
                const colTasks = filteredTasks.filter(t => t.detailedStatus === col || (col === 'Todo' && !t.detailedStatus && t.status === 'Todo'));

                return (
                  <div
                    key={col}
                    className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80 min-w-[280px] max-w-[280px] space-y-4 flex flex-col min-h-[600px] shrink-0"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${
                          col === 'Completed' ? 'bg-emerald-500' :
                          col === 'In Progress' ? 'bg-indigo-500' :
                          col === 'Under Review' ? 'bg-purple-500' :
                          col === 'Testing' ? 'bg-pink-500' :
                          col === 'Cancelled' ? 'bg-slate-500' :
                          col === 'Not Started' ? 'bg-slate-400' : 'bg-amber-500'
                        }`} />
                        {col}
                      </h3>
                      <span className="text-[10px] font-mono text-indigo-400 bg-slate-950 px-2 py-0.5 rounded-full border border-slate-800">
                        {colTasks.length}
                      </span>
                    </div>

                    {/* Task Stack */}
                    <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-1">
                      {colTasks.length === 0 ? (
                        <div className="py-12 text-center text-slate-500 italic text-[11px] border border-dashed border-slate-800 rounded-xl bg-slate-950/20">
                          Empty Lane
                        </div>
                      ) : (
                        colTasks.map(tsk => {
                          const isOverdue = new Date(tsk.deadline).getTime() < Date.now() && tsk.status !== 'Completed';

                          return (
                            <div
                              key={tsk.id}
                              onClick={() => {
                                setSelectedTask(tsk);
                                setShowDetailModal(true);
                              }}
                              className="p-4 bg-slate-950 border border-slate-800 hover:border-indigo-500/50 rounded-xl transition-all cursor-pointer shadow-md space-y-3 group"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] font-mono font-bold text-indigo-400">{tsk.taskId}</span>
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${
                                  tsk.priority === 'Urgent' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                                  tsk.priority === 'High' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                  'bg-slate-900 text-slate-300 border-slate-800'
                                }`}>
                                  {tsk.priority}
                                </span>
                              </div>

                              <h4 className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-1">
                                {tsk.title}
                              </h4>
                              <p className="text-[10px] text-slate-400 line-clamp-2">{tsk.description}</p>

                              {/* Progress Slider */}
                              <div className="space-y-1">
                                <div className="flex justify-between text-[9px] text-slate-400">
                                  <span>Progress</span>
                                  <span>{tsk.completionPercentage || 0}%</span>
                                </div>
                                <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                                  <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${tsk.completionPercentage || 0}%` }} />
                                </div>
                              </div>

                              <div className="pt-2 border-t border-slate-900/60 flex items-center justify-between text-[10px] text-slate-400">
                                <span className="flex items-center gap-1">
                                  <User className="w-3 h-3 text-indigo-400" /> {tsk.employeeName || 'Unassigned'}
                                </span>
                                <span className={`flex items-center gap-1 font-mono ${isOverdue ? 'text-rose-400 font-bold' : 'text-amber-400'}`}>
                                  <Calendar className="w-3 h-3" /> {tsk.deadline}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* TABLE LIST VIEW */
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950 border-b border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider font-extrabold font-mono">
                      <th className="p-4">Task ID</th>
                      <th className="p-4">Title / Project</th>
                      <th className="p-4">Assignee</th>
                      <th className="p-4">Priority</th>
                      <th className="p-4">Difficulty</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">SLA Deadline</th>
                      <th className="p-4">Progress</th>
                      <th className="p-4">Hours</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-xs">
                    {filteredTasks.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="p-8 text-center text-slate-500 italic">No tasks match your filter criteria.</td>
                      </tr>
                    ) : (
                      filteredTasks.map(t => (
                        <tr
                          key={t.id}
                          onClick={() => {
                            setSelectedTask(t);
                            setShowDetailModal(true);
                          }}
                          className="hover:bg-slate-950/40 cursor-pointer transition-colors"
                        >
                          <td className="p-4 font-mono font-bold text-indigo-400">{t.taskId}</td>
                          <td className="p-4">
                            <p className="font-bold text-white">{t.title}</p>
                            <p className="text-[10px] text-slate-400">{t.projectName || 'Operational General'}</p>
                          </td>
                          <td className="p-4 font-medium text-slate-300">{t.employeeName || 'Unassigned'}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              t.priority === 'Urgent' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                              t.priority === 'High' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                              'bg-slate-950 text-slate-300 border border-slate-800'
                            }`}>
                              {t.priority}
                            </span>
                          </td>
                          <td className="p-4 font-mono">{t.difficulty}</td>
                          <td className="p-4 font-mono text-[10px] text-indigo-400">{(t as any).category || 'Engineering'}</td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded font-mono text-[10px]">
                              {(t as any).detailedStatus || t.status}
                            </span>
                          </td>
                          <td className="p-4 font-mono text-slate-300">{t.deadline}</td>
                          <td className="p-4 font-mono font-bold text-indigo-400">{t.completionPercentage || 0}%</td>
                          <td className="p-4 font-mono text-slate-300">{t.actualHours || 0} / {t.estimatedHours || 0} hrs</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ANALYTICS REPORTS TAB */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart: Status Distribution */}
            <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-indigo-400" /> Task Status Distribution
              </h3>
              <div className="h-64 flex items-center justify-center">
                {reports.statusPie.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No tasks created yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={reports.statusPie}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {reports.statusPie.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#1E293B', color: '#fff' }} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Bar Chart: Estimated vs Actual Hours */}
            <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" /> SLA Hours vs actual logged hours
              </h3>
              <div className="h-64">
                {reports.timeData.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No work hours logged yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reports.timeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                      <XAxis dataKey="name" stroke="#64748B" fontSize={10} />
                      <YAxis stroke="#64748B" fontSize={10} />
                      <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#1E293B' }} />
                      <Legend />
                      <Bar dataKey="Estimated" fill="#6366F1" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Actual" fill="#10B981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Full Bar Chart: Employee completion rates */}
            <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 space-y-4 lg:col-span-2">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" /> Employee Task Execution & Productivity Metrics
              </h3>
              <div className="h-80">
                {reports.empData.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No task assignments found.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reports.empData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                      <XAxis dataKey="name" stroke="#64748B" fontSize={10} />
                      <YAxis stroke="#64748B" fontSize={10} />
                      <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#1E293B' }} />
                      <Legend />
                      <Bar dataKey="Total" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Completed" fill="#10B981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TEMPLATES WORKSPACE TAB */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Standard Task Templates
            </h3>
            <p className="text-xs text-slate-400">
              Pre-built tasks containing descriptive workflows, subtasks, and checklists. Click any template to pre-fill the Task form.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              {TASK_TEMPLATES.map((tpl, index) => (
                <div
                  key={index}
                  className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <span className="text-[9px] uppercase font-bold tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                      {tpl.category}
                    </span>
                    <h4 className="text-xs font-bold text-white">{tpl.name}</h4>
                    <p className="text-[11px] text-slate-400">{tpl.description}</p>
                    
                    {/* Specs info */}
                    <div className="grid grid-cols-2 gap-2 pt-2 text-[10px] font-mono text-slate-500">
                      <div>Priority: <span className="text-white font-bold">{tpl.priority}</span></div>
                      <div>Difficulty: <span className="text-white font-bold">{tpl.difficulty}</span></div>
                      <div>Subtasks: <span className="text-indigo-400 font-bold">{tpl.subtasks.length}</span></div>
                      <div>Checklist: <span className="text-indigo-400 font-bold">{tpl.checklist.length}</span></div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      loadTemplate(tpl);
                      setShowAddModal(true);
                    }}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-colors"
                  >
                    Use Template Parameters
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AI TASK PLANNER MODAL */}
      {showAITaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-400" />
                AI Task Planner
              </h3>
              <button onClick={() => setShowAITaskModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">Company Goal / Feature Brief *</label>
                <textarea
                  rows={4}
                  placeholder="e.g. Develop safe dual-date Nepali calendars with automated public holidays..."
                  value={aiGoalBrief}
                  onChange={e => setAiGoalBrief(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Target Project Context</label>
                <select
                  value={selectedProjectIdForAI}
                  onChange={e => setSelectedProjectIdForAI(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="">Select Project Context</option>
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
                  {loadingAI ? 'AI Planner active...' : 'AI Planner Execute'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE MANUAL TASK MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-xl bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-indigo-400" />
                Create New Task
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-slate-300 block mb-1">Task Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="Provide short action task title..."
                    value={newTask.title}
                    onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500 font-bold"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-slate-300 block mb-1">Detailed Description</label>
                  <textarea
                    rows={2}
                    placeholder="Provide specifications and execution guidelines..."
                    value={newTask.description}
                    onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1">Assignee Staff</label>
                  <select
                    value={newTask.employeeId}
                    onChange={e => setNewTask({ ...newTask, employeeId: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                  >
                    <option value="">Unassigned Staff</option>
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>{e.name} ({e.position})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1">Linked Project</label>
                  <select
                    value={newTask.projectId}
                    onChange={e => setNewTask({ ...newTask, projectId: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                  >
                    <option value="">General Operations</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1">Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={e => setNewTask({ ...newTask, priority: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1">Difficulty</label>
                  <select
                    value={newTask.difficulty}
                    onChange={e => setNewTask({ ...newTask, difficulty: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                    <option value="Expert">Expert</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1">Start Date</label>
                  <input
                    type="date"
                    value={newTask.startDate}
                    onChange={e => setNewTask({ ...newTask, startDate: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1">SLA Due Date (Deadline)</label>
                  <input
                    type="date"
                    value={newTask.deadline}
                    onChange={e => setNewTask({ ...newTask, deadline: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1">Category</label>
                  <select
                    value={newTask.category}
                    onChange={e => setNewTask({ ...newTask, category: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Finance">Finance</option>
                    <option value="Executive">Executive</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1">Estimated Hours</label>
                  <input
                    type="number"
                    value={newTask.estimatedHours}
                    onChange={e => setNewTask({ ...newTask, estimatedHours: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1">Reviewer staff</label>
                  <select
                    value={newTask.reviewerId}
                    onChange={e => setNewTask({ ...newTask, reviewerId: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                  >
                    <option value="">None</option>
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>{e.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1">Approver Executive</label>
                  <select
                    value={newTask.approverId}
                    onChange={e => setNewTask({ ...newTask, approverId: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                  >
                    <option value="">None</option>
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>{e.name}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center gap-2 text-slate-300 font-bold mb-1">
                    <input
                      type="checkbox"
                      checked={newTask.isRecurring}
                      onChange={e => setNewTask({ ...newTask, isRecurring: e.target.checked })}
                      className="rounded bg-slate-900 border-slate-800 text-indigo-600 focus:ring-0"
                    />
                    Is Recurring Task SLA
                  </label>
                  {newTask.isRecurring && (
                    <select
                      value={newTask.recurringInterval}
                      onChange={e => setNewTask({ ...newTask, recurringInterval: e.target.value as any })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none mt-2"
                    >
                      <option value="Daily">Daily Recurring</option>
                      <option value="Weekly">Weekly Recurring</option>
                      <option value="Monthly">Monthly Recurring</option>
                    </select>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/60 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-900 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl"
                >
                  Save Task Parameters
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMPREHENSIVE DETAIL / WORKSPACE FORUM DIALOG */}
      {showDetailModal && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl p-6 my-8 flex flex-col md:flex-row gap-6">
            
            {/* LEFT MAIN BAR: Details, subtasks, checklists, discussion */}
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
                  <p className="text-slate-400 text-[10px]">Status</p>
                  <p className="font-extrabold text-white mt-0.5">{selectedTask.detailedStatus || selectedTask.status}</p>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                  <p className="text-slate-400 text-[10px]">Priority</p>
                  <p className="font-extrabold text-amber-400 mt-0.5">{selectedTask.priority}</p>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                  <p className="text-slate-400 text-[10px]">Completion Percentage</p>
                  <p className="font-extrabold text-indigo-400 mt-0.5 font-mono">{selectedTask.completionPercentage || 0}%</p>
                </div>
              </div>

              {/* SUBTASKS SECTION */}
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
                        onClick={() => handleToggleSubtask(sub.id)}
                        className="flex items-center gap-2 text-xs text-left"
                      >
                        <span className={`p-0.5 rounded border ${sub.completed ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-700 text-transparent'}`}>
                          <Check className="w-3 h-3" />
                        </span>
                        <span className={`${sub.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>{sub.title}</span>
                      </button>
                      <button onClick={() => handleDeleteSubtask(sub.id)} className="text-slate-500 hover:text-rose-400">
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
                  <button onClick={handleAddSubtask} className="px-3.5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold">
                    Add
                  </button>
                </div>
              </div>

              {/* CHECKLISTS SECTION */}
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
                        onClick={() => handleToggleChecklist(chk.id)}
                        className="flex items-center gap-2 text-xs text-left"
                      >
                        <span className={`p-0.5 rounded border ${chk.done ? 'bg-emerald-600 border-emerald-500 text-white' : 'border-slate-700 text-transparent'}`}>
                          <Check className="w-3 h-3" />
                        </span>
                        <span className={`${chk.done ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                          {chk.label} {chk.required && <span className="text-rose-400 font-bold ml-1">*Required</span>}
                        </span>
                      </button>
                      <button onClick={() => handleDeleteChecklist(chk.id)} className="text-slate-500 hover:text-rose-400">
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
                    <button onClick={handleAddChecklist} className="px-3.5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold">
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
                    Mark as Required Checklist Quality Gate (Cannot complete task without this checked)
                  </label>
                </div>
              </div>

              {/* ATTACHMENTS VAULT */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  📎 Attachments & File Vault
                </h4>

                {/* Drag and Drop box */}
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors text-xs ${
                    dragActive ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-800 hover:border-indigo-500/40 bg-slate-900/30'
                  }`}
                >
                  <Paperclip className="w-5 h-5 mx-auto text-slate-500 mb-1.5" />
                  <p className="text-slate-300 font-bold">Drag and drop files here, or click to browse</p>
                  <p className="text-[10px] text-slate-500 mt-1">Accepts images, PDFs, word documents</p>
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="attachment-file-input"
                  />
                  <label htmlFor="attachment-file-input" className="mt-2 inline-block px-3 py-1 bg-slate-800 text-slate-300 rounded text-[10px] font-bold">
                    Select File
                  </label>
                </div>

                {/* Attachments List */}
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
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 text-slate-400 hover:text-white"
                          title="Download Preview File"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        <button onClick={() => handleDeleteAttachment(att.id)} className="p-1 text-slate-500 hover:text-rose-400">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* COMMENTS & COLLABORATIVE DISCUSSION */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-4">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-indigo-400" /> Collaborative Discussions
                </h4>

                {/* Comment Box */}
                <form onSubmit={handleAddComment} className="space-y-2">
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
                    
                    {/* Mention popover */}
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
                    <button type="submit" className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/25">
                      <Send className="w-3.5 h-3.5" /> Post Comment
                    </button>
                  </div>
                </form>

                {/* Render Comments */}
                <div className="space-y-4 pt-3 border-t border-slate-900">
                  {selectedTask.comments?.length === 0 ? (
                    <p className="text-[11px] text-slate-500 italic py-2 text-center">No comments posted yet. Start the conversation!</p>
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

                        {/* Indented Threaded Replies */}
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

                          {/* Reply box */}
                          <div className="flex gap-2 pt-2">
                            <input
                              type="text"
                              placeholder="Reply directly to this thread..."
                              value={commentReplies[com.id] || ''}
                              onChange={e => setCommentReplies({ ...commentReplies, [com.id]: e.target.value })}
                              className="bg-slate-950 border border-slate-900 text-[11px] text-slate-200 px-3 py-1.5 rounded-xl focus:outline-none flex-1"
                            />
                            <button
                              onClick={() => handleAddReply(com.id)}
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

            {/* RIGHT SIDEBAR: Time Stopwatch, manual logger, meta info, actions */}
            <div className="w-full md:w-80 space-y-6">
              
              {/* STOPWATCH TIMER SECTION */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-4">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-400" /> Stopwatch session timer
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
                    onClick={toggleTimer}
                    className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 uppercase tracking-wider ${
                      isTimerRunning ? 'bg-rose-600 hover:bg-rose-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    {isTimerRunning ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    {isTimerRunning ? 'Stop Timer & Log' : 'Start Session Timer'}
                  </button>
                </div>

                {/* Manual Time Entry log form */}
                <div className="pt-3 border-t border-slate-900 space-y-2">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Log Manual Hours</p>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      id="manual-log-hours"
                      placeholder="Hours"
                      className="w-20 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-200 focus:outline-none"
                    />
                    <input
                      type="text"
                      id="manual-log-note"
                      placeholder="Log session description notes..."
                      className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-200 focus:outline-none flex-1"
                    />
                    <button
                      onClick={() => {
                        const h = Number((document.getElementById('manual-log-hours') as HTMLInputElement)?.value || 0);
                        const n = (document.getElementById('manual-log-note') as HTMLInputElement)?.value || '';
                        handleAddManualTime(h, n);
                        (document.getElementById('manual-log-hours') as HTMLInputElement).value = '';
                        (document.getElementById('manual-log-note') as HTMLInputElement).value = '';
                      }}
                      className="px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold"
                    >
                      Log
                    </button>
                  </div>
                </div>

                {/* Time logs history list */}
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

              {/* TASK META DESCRIPTION INFO AND ACCESS ROLES */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 text-xs">
                <h4 className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Meta Execution Specs</h4>
                
                <div className="space-y-2">
                  <div>
                    <span className="text-slate-500 text-[10px] block">Project Context</span>
                    <span className="font-bold text-white">{selectedTask.projectName || 'General Operational'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Assigned Developer</span>
                    <span className="font-bold text-white">{selectedTask.employeeName || 'Unassigned'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Difficulty rating</span>
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
                    <span className="text-slate-500 text-[10px] block">Reviewer Gatekeeper</span>
                    <span className="font-bold text-slate-300">{(selectedTask as any).reviewerName || 'None'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Approver Executive</span>
                    <span className="font-bold text-slate-300">{(selectedTask as any).approverName || 'None'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">SLA Timeline (Start to End)</span>
                    <span className="font-bold text-white">{(selectedTask as any).startDate || '2026-07-23'} to {selectedTask.deadline}</span>
                  </div>
                </div>
              </div>

              {/* ACTION QUICK BAR */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
                <h4 className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Quick SLA Actions</h4>
                
                <button
                  onClick={() => handleDuplicateTask(selectedTask)}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Copy className="w-4 h-4" /> Duplicate Task
                </button>
                
                <button
                  onClick={() => handleToggleArchive(selectedTask)}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Archive className="w-4 h-4" /> {selectedTask.isArchived ? 'Unarchive Task' : 'Archive Task'}
                </button>

                {canManageAllTasks && (
                  <button
                    onClick={() => handleDeleteTask(selectedTask.id)}
                    className="w-full py-2 bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 border border-rose-900/50 font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" /> Delete Task
                  </button>
                )}
              </div>

              {/* ACTIVITY LOG TIMELINE */}
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
