import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  where,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { hashPassword } from '../auth';
import {
  Employee,
  Project,
  Task,
  PerformanceMetric,
  AttendanceRecord,
  Meeting,
  Client,
  CompanyDocument,
  NotificationItem,
  CompanyReport,
  CompanySettings,
  CompanyHealthData,
  GoalOKR,
  StrategicPlan,
  CEODecision,
  SkillItem,
  EmployeeCertificate,
  EquipmentAsset,
  LeaveRequest,
  EmployeeRequest,
  ProjectRisk,
  ProjectMilestone,
  TimeLog
} from '@/types';

// Default Settings - Optimized for Nepal Operations with Bikram Sambat
export const DEFAULT_SETTINGS: CompanySettings = {
  companyName: '',
  ceoName: '',
  ceoEmail: '',
  currency: 'NPR',
  currencySymbol: 'Rs.',
  timezone: 'Asia/Kathmandu',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '12h',
  weekStartsOn: 'Sunday',
  defaultCalendar: 'BS',
  showDualDates: true,
  fiscalYearFormat: '2083/84 (BS)',
  country: 'Nepal',
  businessType: 'Private Limited (Pvt. Ltd.)',
  businessCategory: 'IT & Digital Services',
  workingHoursStart: '09:00',
  workingHoursEnd: '18:00',
  aiAutoRiskDetection: true,
  aiDailyReportEnabled: true,
  theme: 'dark'
};

// Seed Data (Disabled for Production - Clean Slate)
export async function seedInitialData() {
  console.log('Production clean slate active: Demo data seeding disabled.');
  return true;
}

export async function ensureDefaultEmployees() {
  try {
    const colRef = collection(db, 'employees');
    const snap = await getDocs(colRef);
    if (snap.empty) {
      const defaultPasswordHash = hashPassword('password123');
      const defaults = [
        { employeeId: 'EMP0001', name: 'Aarav Sharma', fullName: 'Aarav Sharma', role: 'CEO', password: defaultPasswordHash, department: 'Executive', position: 'Chief Executive Officer', email: 'ceo@sovryx.com', phone: '+977 9801112233', status: 'Active', salary: 350000, joinDate: '2024-01-01', skills: ['Strategy', 'Leadership', 'Management'], performanceScore: 98, attendanceScore: 100, warnings: [], documents: [], notes: [] },
        { employeeId: 'EMP0002', name: 'Priya Adhikari', fullName: 'Priya Adhikari', role: 'Admin', password: defaultPasswordHash, department: 'Operations', position: 'Operations Director', email: 'admin@sovryx.com', phone: '+977 9802223344', status: 'Active', salary: 250000, joinDate: '2024-02-01', skills: ['Operations', 'Security', 'Governance'], performanceScore: 95, attendanceScore: 98, warnings: [], documents: [], notes: [] },
        { employeeId: 'EMP0003', name: 'Rohan Karki', fullName: 'Rohan Karki', role: 'HR', password: defaultPasswordHash, department: 'Human Resources', position: 'HR Head', email: 'hr@sovryx.com', phone: '+977 9803334455', status: 'Active', salary: 200000, joinDate: '2024-03-01', skills: ['Recruitment', 'Payroll', 'Compliance'], performanceScore: 92, attendanceScore: 96, warnings: [], documents: [], notes: [] },
        { employeeId: 'EMP0004', name: 'Sunil Thapa', fullName: 'Sunil Thapa', role: 'Manager', password: defaultPasswordHash, department: 'Engineering', position: 'Engineering Manager', email: 'manager@sovryx.com', phone: '+977 9804445566', status: 'Active', salary: 220000, joinDate: '2024-04-01', skills: ['Architecture', 'Agile', 'React'], performanceScore: 94, attendanceScore: 95, warnings: [], documents: [], notes: [] },
        { employeeId: 'EMP0005', name: 'Sita Gurung', fullName: 'Sita Gurung', role: 'Employee', password: defaultPasswordHash, department: 'Engineering', position: 'Senior Full Stack Developer', email: 'employee@sovryx.com', phone: '+977 9805556677', status: 'Active', salary: 150000, joinDate: '2024-05-01', skills: ['TypeScript', 'Next.js', 'Tailwind'], performanceScore: 90, attendanceScore: 94, warnings: [], documents: [], notes: [] }
      ];
      for (const emp of defaults) {
        await addDoc(colRef, emp);
      }
      console.log('Default employees seeded successfully.');
    }
  } catch (err) {
    console.error('Error ensuring default employees:', err);
  }
}

// Clear Database to ZERO (Production Clean Slate)
export async function clearDatabaseToZero() {
  try {
    const collectionsToClear = [
      'employees',
      'clients',
      'projects',
      'tasks',
      'performance',
      'attendance',
      'meetings',
      'documents',
      'notifications',
      'reports',
      'companies',
      'companySettings',
      'settings',
      'users',
      'departments',
      'onboarding_progress',
      'goals',
      'okr',
      'strategicPlans',
      'decisions',
      'skills',
      'certificates',
      'equipment',
      'employeeAwards',
      'disciplinaryRecords',
      'careerPlans',
      'exitInterviews',
      'timeLogs',
      'projectRisks',
      'milestones',
      'dependencies',
      'sprints',
      'resourceAllocation',
      'leaveRequests',
      'employeeRequests',
      'companyHealth',
      'kpiReports',
      'aiReports'
    ];

    for (const colName of collectionsToClear) {
      const colRef = collection(db, colName);
      const snapshot = await getDocs(colRef);
      const deletePromises = snapshot.docs.map((docSnap) => deleteDoc(doc(db, colName, docSnap.id)));
      await Promise.all(deletePromises);
    }

    console.log('Firestore database cleared to ZERO successfully!');
    return true;
  } catch (error) {
    console.error('Error clearing database to zero:', error);
    throw error;
  }
}

// Generic collection listener
export function subscribeCollection<T>(collectionName: string, callback: (data: T[]) => void) {
  const colRef = collection(db, collectionName);
  return onSnapshot(colRef, (snapshot) => {
    const items: T[] = snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    } as unknown as T));
    callback(items);
  }, (error) => {
    console.error(`Error subscribing to ${collectionName}:`, error);
  });
}

// Single item CRUD
export async function createItem<T extends object>(collectionName: string, itemData: T): Promise<string> {
  const docRef = await addDoc(collection(db, collectionName), {
    ...itemData,
    createdAt: new Date().toISOString()
  });
  return docRef.id;
}

export async function updateItem<T extends object>(collectionName: string, id: string, updates: Partial<T>): Promise<void> {
  const itemRef = doc(db, collectionName, id);
  await updateDoc(itemRef, updates as any);
}

export async function deleteItem(collectionName: string, id: string): Promise<void> {
  const itemRef = doc(db, collectionName, id);
  await deleteDoc(itemRef);
}

export async function getSettings(): Promise<CompanySettings> {
  try {
    const docRef = doc(db, 'settings', 'config');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as CompanySettings;
    }
  } catch (err) {
    console.warn('Could not fetch settings, returning defaults:', err);
  }
  return DEFAULT_SETTINGS;
}

export async function updateSettings(settings: Partial<CompanySettings>): Promise<void> {
  const docRef = doc(db, 'settings', 'config');
  await setDoc(docRef, settings, { merge: true });
}
