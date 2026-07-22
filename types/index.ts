export type EmployeeStatus = 'Active' | 'On Leave' | 'Terminated';

export interface Employee {
  id: string;
  employeeId: string;
  name: string;
  photo?: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  salary: number;
  joinDate: string;
  status: EmployeeStatus;
  skills: string[];
  performanceScore: number; // 0 - 100
  attendanceScore: number; // 0 - 100
  warnings: { id: string; date: string; reason: string; issuedBy: string }[];
  documents: { id: string; name: string; url: string; date: string }[];
  notes: { id: string; date: string; text: string; author: string }[];
  createdAt?: string;
}

export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type TaskStatus = 'Todo' | 'In Progress' | 'Review' | 'Completed';

export interface Task {
  id: string;
  taskId: string;
  title: string;
  description: string;
  employeeId: string;
  employeeName?: string;
  projectId: string;
  projectName?: string;
  priority: TaskPriority;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  deadline: string;
  status: TaskStatus;
  estimatedHours: number;
  actualHours: number;
  qualityScore: number; // 0 - 100
  completionPercentage: number; // 0 - 100
  createdAt?: string;
}

export type ProjectStatus = 'Planning' | 'In Progress' | 'On Hold' | 'Completed' | 'At Risk';

export interface Project {
  id: string;
  projectId: string;
  name: string;
  client: string;
  clientId?: string;
  budget: number;
  spentBudget?: number;
  status: ProjectStatus;
  deadline: string;
  startDate: string;
  progress: number; // 0 - 100
  riskLevel?: 'Low' | 'Medium' | 'High' | 'Critical';
  riskReason?: string;
  employeeIds: string[];
  tasksCount?: number;
  completedTasksCount?: number;
  documents?: { id: string; name: string; url: string }[];
  createdAt?: string;
}

export interface PerformanceMetric {
  id: string;
  employeeId: string;
  employeeName: string;
  period: string; // e.g. "July 2026"
  taskCompletion: number; // 0 - 100
  attendance: number; // 0 - 100
  quality: number; // 0 - 100
  communication: number; // 0 - 100
  initiative: number; // 0 - 100
  overallScore: number; // calculated weighted average
  employeeRating: 'Exceptional' | 'Exceeds Expectations' | 'Meets Expectations' | 'Needs Improvement' | 'Critical Review';
  promotionRecommendation: string;
  trainingRecommendation: string;
  aiAnalysis?: string;
  updatedAt?: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string; // YYYY-MM-DD
  clockIn: string;
  clockOut?: string;
  status: 'Present' | 'Late' | 'Absent' | 'On Leave';
  workHours: number;
  notes?: string;
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  durationMinutes: number;
  participants: string[]; // employee IDs or emails
  participantNames?: string[];
  agenda: string;
  summary?: string;
  actionItems?: { id: string; text: string; assigneeId?: string; done: boolean }[];
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
  createdAt?: string;
}

export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  totalSpent: number;
  activeProjectsCount: number;
  status: 'Active' | 'Lead' | 'Inactive';
  notes?: string;
  createdAt?: string;
}

export interface CompanyDocument {
  id: string;
  title: string;
  category: 'Policy' | 'Contract' | 'Project Brief' | 'Financial' | 'Technical' | 'General';
  url: string;
  uploadedBy: string;
  date: string;
  tags: string[];
  size?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'risk' | 'task' | 'attendance' | 'announcement' | 'ai_insight';
  severity: 'info' | 'warning' | 'urgent';
  read: boolean;
  timestamp: string;
  linkModule?: string;
}

export interface CompanyReport {
  id: string;
  title: string;
  type: 'Daily' | 'Weekly' | 'Monthly' | 'Executive';
  date: string;
  summary: string;
  metrics: {
    totalEmployees: number;
    activeProjects: number;
    tasksCompleted: number;
    overallProductivity: number;
    revenueOrBudget?: number;
  };
  keyHighlights: string[];
  risksIdentified: string[];
  aiRecommendations: string[];
  createdBy: string;
}

export interface CompanySettings {
  companyName: string;
  ceoName: string;
  ceoEmail: string;
  currency: string;
  timezone: string;
  workingHoursStart: string;
  workingHoursEnd: string;
  aiAutoRiskDetection: boolean;
  aiDailyReportEnabled: boolean;
  theme: 'dark' | 'light' | 'system';
}
