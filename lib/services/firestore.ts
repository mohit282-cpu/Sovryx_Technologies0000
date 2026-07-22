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

// Default Settings (Localized for Nepal)
export const DEFAULT_SETTINGS: CompanySettings = {
  companyName: 'Sovryx Nepal Pvt. Ltd.',
  ceoName: 'Executive Director',
  ceoEmail: 'ceo@sovryx.np',
  country: 'Nepal',
  currency: 'NPR',
  currencySymbol: 'Rs.',
  timezone: 'Asia/Kathmandu',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '12h',
  weekStartsOn: 'Sunday',
  weekendDays: ['Saturday'],
  workingHoursStart: '10:00',
  workingHoursEnd: '17:00',
  companyRegistrationNo: '284910/080/081',
  panNo: '609812345',
  vatNo: '609812345',
  ocrRegistrationNo: 'OCR-NP-2080-112',
  irdRegistration: 'Kathmandu-IRD-04',
  province: 'Bagmati Province',
  district: 'Kathmandu',
  localMunicipality: 'Kathmandu Metropolitan City',
  wardNumber: '4',
  businessType: 'Private Limited',
  businessCategory: 'IT & Software',
  address: {
    province: 'Bagmati Province',
    district: 'Kathmandu',
    municipality: 'Kathmandu Metropolitan City',
    wardNo: '4',
    tole: 'Maharajgunj',
    postalCode: '44600',
    country: 'Nepal'
  },
  aiAutoRiskDetection: true,
  aiDailyReportEnabled: true,
  theme: 'dark'
};

// Seed Data (Disabled for Production - Clean Slate)
export async function seedInitialData() {
  console.log('Production clean slate active: Demo data seeding disabled.');
  return true;
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
