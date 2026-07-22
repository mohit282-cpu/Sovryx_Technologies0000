export type EmployeeStatus = 'Active' | 'On Leave' | 'Terminated' | 'Inactive' | 'Resigned' | 'Probation';

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
  commendations?: { id: string; date: string; reason: string; awardedBy: string }[];
  documents: { id: string; name: string; url: string; date: string }[];
  notes: { id: string; date: string; text: string; author: string }[];
  biography?: string;
  emergencyContact?: { name: string; relation: string; phone: string };
  dob?: string;
  citizenshipNo?: string;
  panNo?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  fullName?: string;
  gender?: string;
  dobAD?: string;
  dobBS?: string;
  age?: number;
  bloodGroup?: string;
  maritalStatus?: string;
  nationality?: string;
  citizenshipDistrict?: string;
  nationalId?: string;
  passportNo?: string;
  religion?: string;
  personalEmail?: string;
  officialEmail?: string;
  primaryPhone?: string;
  secondaryPhone?: string;
  whatsappNumber?: string;
  permanentAddress?: NepalAddress;
  temporaryAddress?: NepalAddress;
  designation?: string;
  subDepartment?: string;
  workLocation?: string;
  employmentType?: string;
  joinDateBS?: string;
  probationEndDateAD?: string;
  probationEndDateBS?: string;
  managerId?: string;
  managerName?: string;
  basicSalaryNPR?: number;
  allowancesNPR?: number;
  grade?: string;
  bankName?: string;
  bankAccountNo?: string;
  bankBranch?: string;
  ssfNo?: string;
  citNo?: string;
  epfNo?: string;
  createdAt?: string;
  [key: string]: any;
}

export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type TaskStatus = 'Todo' | 'In Progress' | 'Review' | 'Completed';

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface TaskComment {
  id: string;
  authorName: string;
  text: string;
  timestamp: string;
}

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
  subtasks?: SubTask[];
  checklist?: { id: string; label: string; done: boolean }[];
  attachments?: { id: string; name: string; url: string }[];
  comments?: TaskComment[];
  isRecurring?: boolean;
  recurringInterval?: 'Daily' | 'Weekly' | 'Monthly';
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
  currencySymbol?: string;
  timezone: string;
  dateFormat?: string;
  timeFormat?: '12h' | '24h';
  weekStartsOn?: string;
  defaultCalendar?: 'BS' | 'AD';
  showDualDates?: boolean;
  fiscalYearFormat?: string;
  companyRegistrationNo?: string;
  panNo?: string;
  vatNo?: string;
  ocrRegistrationNo?: string;
  irdRegistration?: string;
  businessType?: string;
  businessCategory?: string;
  country?: string;
  address?: {
    province?: string;
    district?: string;
    municipality?: string;
    wardNo?: string;
    tole?: string;
    postalCode?: string;
  };
  workingHoursStart: string;
  workingHoursEnd: string;
  aiAutoRiskDetection: boolean;
  aiDailyReportEnabled: boolean;
  theme: 'dark' | 'light' | 'system';
}

// ==========================================
// NEW ENTERPRISE MODULE INTERFACES
// ==========================================

export type HealthStatus = 'Excellent' | 'Good' | 'Average' | 'Poor' | 'Critical';

export interface CompanyHealthData {
  id?: string;
  score: number; // 0 - 100
  status: HealthStatus;
  productivityScore: number;
  attendanceScore: number;
  projectProgressScore: number;
  taskCompletionRate: number;
  lateTasksCount: number;
  projectRisksCount: number;
  clientSatisfaction: number;
  updatedAt: string;
}

export interface GoalOKR {
  id: string;
  goal: string;
  description: string;
  ownerId: string;
  ownerName: string;
  department: string;
  targetDate: string;
  progress: number; // 0 - 100
  status: 'Not Started' | 'On Track' | 'At Risk' | 'Achieved';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  linkedProjectIds?: string[];
  linkedTaskIds?: string[];
  aiRecommendation?: string;
  createdAt?: string;
}

export interface StrategicPlan {
  id: string;
  title: string;
  mission: string;
  vision: string;
  quarterlyObjectives: string[];
  annualObjectives: string[];
  swot: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  risks: { risk: string; mitigation: string; level: 'Low' | 'Medium' | 'High' }[];
  roadmap: { phase: string; period: string; focus: string; progress: number }[];
  milestones: { id: string; title: string; date: string; completed: boolean }[];
  updatedAt?: string;
}

export interface CEODecision {
  id: string;
  title: string;
  decision: string;
  reason: string;
  impact: string;
  relatedProjectId?: string;
  relatedProjectName?: string;
  date: string;
  followUpDate?: string;
  outcome?: string;
  status: 'Pending' | 'In Progress' | 'Implemented' | 'Reviewed';
  createdAt?: string;
}

export type SkillLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';

export interface SkillItem {
  id: string;
  name: string;
  category: string;
  level: SkillLevel;
  employeeCount?: number;
  certifiedCount?: number;
}

export interface EmployeeCertificate {
  id: string;
  employeeId: string;
  employeeName: string;
  certificateName: string;
  issuer: string;
  issueDate: string;
  expiryDate: string;
  fileUrl?: string;
  reminderDaysBefore: number;
  isExpired?: boolean;
}

export interface EquipmentAsset {
  id: string;
  assetNumber: string;
  name: string;
  type: 'Laptop' | 'Monitor' | 'Phone' | 'Software License' | 'Access Card' | 'Other';
  purchaseDate: string;
  warrantyExpiry: string;
  condition: 'New' | 'Good' | 'Fair' | 'Maintenance Required' | 'Retired';
  assignedEmployeeId?: string;
  assignedEmployeeName?: string;
  assignedDate?: string;
  notes?: string;
}

export interface EmployeeAward {
  id: string;
  employeeId: string;
  employeeName: string;
  title: string;
  category: string;
  date: string;
  description: string;
  awardedBy: string;
}

export interface DisciplinaryRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  issue: string;
  actionTaken: string;
  status: 'Active Warning' | 'Resolved' | 'Escalated';
  issuedBy: string;
}

export interface CareerDevelopmentPlan {
  id: string;
  employeeId: string;
  employeeName: string;
  currentRole: string;
  targetRole: string;
  targetTimeline: string;
  requiredSkills: string[];
  actionSteps: { step: string; done: boolean }[];
  mentorId?: string;
  mentorName?: string;
  status: 'In Progress' | 'On Track' | 'Promoted';
}

export interface ExitInterview {
  id: string;
  employeeId: string;
  employeeName: string;
  exitDate: string;
  reason: string;
  feedback: string;
  conductedBy: string;
}

export interface TimeLog {
  id: string;
  employeeId: string;
  employeeName: string;
  taskId: string;
  taskTitle: string;
  projectId: string;
  projectName?: string;
  date: string;
  startTime: string;
  endTime?: string;
  hoursSpent: number;
  notes?: string;
}

export interface ProjectRisk {
  id: string;
  projectId: string;
  projectName: string;
  riskTitle: string;
  category: 'Technical' | 'Resource' | 'Budget' | 'Client' | 'Schedule';
  impact: 'Low' | 'Medium' | 'High' | 'Critical';
  likelihood: 'Low' | 'Medium' | 'High';
  mitigationPlan: string;
  ownerName: string;
  status: 'Open' | 'Mitigated' | 'Closed';
}

export interface ProjectMilestone {
  id: string;
  projectId: string;
  title: string;
  dueDate: string;
  completed: boolean;
  progress: number;
}

export interface ProjectDependency {
  id: string;
  projectId: string;
  dependentTaskId: string;
  dependentTaskTitle: string;
  prerequisiteTaskId: string;
  prerequisiteTaskTitle: string;
  type: 'Finish-to-Start' | 'Start-to-Start';
}

export interface Sprint {
  id: string;
  projectId: string;
  projectName: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'Planning' | 'Active' | 'Completed';
  goal: string;
}

export interface ResourceAllocation {
  id: string;
  employeeId: string;
  employeeName: string;
  projectId: string;
  projectName: string;
  allocatedPercentage: number; // e.g. 50%
  startDate: string;
  endDate: string;
}

export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'Annual Leave' | 'Sick Leave' | 'Maternity/Paternity' | 'Casual' | 'Unpaid';
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: LeaveStatus;
  reviewedBy?: string;
  reviewDate?: string;
  reviewNote?: string;
  createdAt?: string;
}

export type RequestType = 'Equipment Request' | 'Leave Request' | 'Document Request' | 'Support Request' | 'Other Request';

export interface EmployeeRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  type: RequestType;
  title: string;
  details: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Pending' | 'Approved' | 'Rejected' | 'In Progress';
  reviewNote?: string;
  createdAt?: string;
}

export interface Holiday {
  id: string;
  title: string;
  titleNp?: string;
  dateAD: string; // YYYY-MM-DD
  dateBS: string; // YYYY-MM-DD (BS)
  type: 'Public Holiday' | 'Festival' | 'Company Holiday' | 'Optional';
  isRecurringYearly?: boolean;
  description?: string;
}

export interface NepalAddress {
  province?: string;
  district?: string;
  municipality?: string;
  wardNo?: string;
  tole?: string;
  postalCode?: string;
  country?: string;
  sameAsPermanent?: boolean;
}

export interface PublicHoliday {
  id: string;
  name: string;
  date: string;
  dateBS?: string;
  type: 'National' | 'Festival' | 'Regional';
  isRecurring?: boolean;
}


