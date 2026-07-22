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
  CompanySettings
} from '@/types';

// Default Settings
export const DEFAULT_SETTINGS: CompanySettings = {
  companyName: 'Sovryx Technologies',
  ceoName: 'CEO Sovereign',
  ceoEmail: 'ceo@sovryx.com',
  currency: 'USD',
  timezone: 'UTC',
  workingHoursStart: '09:00',
  workingHoursEnd: '18:00',
  aiAutoRiskDetection: true,
  aiDailyReportEnabled: true,
  theme: 'dark'
};

// Seed Data
export async function seedInitialData() {
  try {
    // 1. Settings
    const settingsRef = doc(db, 'settings', 'config');
    await setDoc(settingsRef, DEFAULT_SETTINGS, { merge: true });

    // 2. Employees
    const employeesData: Omit<Employee, 'id'>[] = [
      {
        employeeId: 'EMP-001',
        name: 'Elena Rostova',
        email: 'elena.rostova@sovryx.com',
        phone: '+1 (555) 234-5678',
        position: 'Lead AI Engineer',
        department: 'Engineering',
        salary: 185000,
        joinDate: '2024-01-15',
        status: 'Active',
        skills: ['Python', 'TensorFlow', 'LLMs', 'System Architecture'],
        performanceScore: 96,
        attendanceScore: 98,
        warnings: [],
        documents: [{ id: 'doc-1', name: 'Employment Agreement', url: '#', date: '2024-01-15' }],
        notes: [{ id: 'note-1', date: '2026-06-10', text: 'Promoted to Lead AI Engineer after delivering Core Engine v2.', author: 'CEO' }],
        photo: 'https://picsum.photos/seed/elena/200/200'
      },
      {
        employeeId: 'EMP-002',
        name: 'Marcus Vance',
        email: 'marcus.vance@sovryx.com',
        phone: '+1 (555) 345-6789',
        position: 'Senior Frontend Architect',
        department: 'Engineering',
        salary: 165000,
        joinDate: '2024-03-01',
        status: 'Active',
        skills: ['React', 'TypeScript', 'Tailwind CSS', 'WebGL'],
        performanceScore: 92,
        attendanceScore: 95,
        warnings: [],
        documents: [],
        notes: [],
        photo: 'https://picsum.photos/seed/marcus/200/200'
      },
      {
        employeeId: 'EMP-003',
        name: 'Sophia Chen',
        email: 'sophia.chen@sovryx.com',
        phone: '+1 (555) 456-7890',
        position: 'Principal Product Designer',
        department: 'Design',
        salary: 155000,
        joinDate: '2024-05-10',
        status: 'Active',
        skills: ['Figma', 'UI/UX Design', 'Design Systems', 'User Research'],
        performanceScore: 94,
        attendanceScore: 99,
        warnings: [],
        documents: [],
        notes: [],
        photo: 'https://picsum.photos/seed/sophia/200/200'
      },
      {
        employeeId: 'EMP-004',
        name: 'David Miller',
        email: 'david.miller@sovryx.com',
        phone: '+1 (555) 567-8901',
        position: 'Backend Developer',
        department: 'Engineering',
        salary: 130000,
        joinDate: '2025-02-01',
        status: 'Active',
        skills: ['Node.js', 'PostgreSQL', 'Docker', 'GraphQL'],
        performanceScore: 78,
        attendanceScore: 84,
        warnings: [{ id: 'warn-1', date: '2026-06-20', reason: 'Missed 2 sprint deadlines without prior alert.', issuedBy: 'CEO' }],
        notes: [{ id: 'note-2', date: '2026-06-21', text: 'Assigned senior mentor for architecture patterns.', author: 'CEO' }],
        documents: [],
        photo: 'https://picsum.photos/seed/david/200/200'
      },
      {
        employeeId: 'EMP-005',
        name: 'Amara Okafor',
        email: 'amara.okafor@sovryx.com',
        phone: '+1 (555) 678-9012',
        position: 'Growth & Client Manager',
        department: 'Business',
        salary: 140000,
        joinDate: '2024-11-12',
        status: 'Active',
        skills: ['Enterprise Sales', 'Key Account Mgmt', 'Negotiation', 'CRM'],
        performanceScore: 95,
        attendanceScore: 97,
        warnings: [],
        documents: [],
        notes: [],
        photo: 'https://picsum.photos/seed/amara/200/200'
      }
    ];

    const empDocs = [];
    for (const emp of employeesData) {
      const docRef = await addDoc(collection(db, 'employees'), emp);
      empDocs.push({ id: docRef.id, ...emp });
    }

    // 3. Clients
    const clientsData: Omit<Client, 'id'>[] = [
      {
        name: 'Nexus Corp Global',
        company: 'Nexus Corp',
        email: 'partners@nexuscorp.io',
        phone: '+1 (800) 555-0199',
        totalSpent: 450000,
        activeProjectsCount: 2,
        status: 'Active',
        notes: 'Enterprise account requiring quarterly AI performance audits.'
      },
      {
        name: 'Aetheria BioLabs',
        company: 'Aetheria Health',
        email: 'cto@aetheriabio.com',
        phone: '+1 (800) 555-0244',
        totalSpent: 280000,
        activeProjectsCount: 1,
        status: 'Active',
        notes: 'High margin healthcare AI pipeline.'
      },
      {
        name: 'Vanguard Capital',
        company: 'Vanguard',
        email: 'tech@vanguardcap.com',
        phone: '+1 (800) 555-0311',
        totalSpent: 120000,
        activeProjectsCount: 1,
        status: 'Lead'
      }
    ];

    const clientDocs = [];
    for (const client of clientsData) {
      const cRef = await addDoc(collection(db, 'clients'), client);
      clientDocs.push({ id: cRef.id, ...client });
    }

    // 4. Projects
    const projectsData: Omit<Project, 'id'>[] = [
      {
        projectId: 'PRJ-101',
        name: 'Sovryx AI Neural OS Core',
        client: 'Nexus Corp Global',
        clientId: clientDocs[0]?.id,
        budget: 350000,
        spentBudget: 210000,
        status: 'In Progress',
        startDate: '2026-01-10',
        deadline: '2026-09-30',
        progress: 68,
        riskLevel: 'Low',
        employeeIds: [empDocs[0]?.id, empDocs[1]?.id, empDocs[2]?.id]
      },
      {
        projectId: 'PRJ-102',
        name: 'BioGen AI Predictive Pipeline',
        client: 'Aetheria BioLabs',
        clientId: clientDocs[1]?.id,
        budget: 280000,
        spentBudget: 240000,
        status: 'At Risk',
        startDate: '2026-03-01',
        deadline: '2026-08-15',
        progress: 52,
        riskLevel: 'High',
        riskReason: 'Backend data parsing latency blocking validation phase.',
        employeeIds: [empDocs[0]?.id, empDocs[3]?.id]
      },
      {
        projectId: 'PRJ-103',
        name: 'Vanguard Wealth Dashboard UI',
        client: 'Vanguard Capital',
        clientId: clientDocs[2]?.id,
        budget: 150000,
        spentBudget: 30000,
        status: 'Planning',
        startDate: '2026-07-01',
        deadline: '2026-11-30',
        progress: 15,
        riskLevel: 'Low',
        employeeIds: [empDocs[2]?.id, empDocs[4]?.id]
      }
    ];

    const prjDocs = [];
    for (const prj of projectsData) {
      const pRef = await addDoc(collection(db, 'projects'), prj);
      prjDocs.push({ id: pRef.id, ...prj });
    }

    // 5. Tasks
    const tasksData: Omit<Task, 'id'>[] = [
      {
        taskId: 'TSK-801',
        title: 'Optimize Neural Model Inference Speed',
        description: 'Quantize FP32 model parameters to INT8 to achieve under 40ms token response time.',
        employeeId: empDocs[0]?.id || '',
        employeeName: empDocs[0]?.name || '',
        projectId: prjDocs[0]?.id || '',
        projectName: prjDocs[0]?.name || '',
        priority: 'Urgent',
        difficulty: 'Expert',
        deadline: '2026-07-28',
        status: 'In Progress',
        estimatedHours: 40,
        actualHours: 28,
        qualityScore: 98,
        completionPercentage: 75
      },
      {
        taskId: 'TSK-802',
        title: 'Refactor Design System Component Tokens',
        description: 'Implement dark glassmorphism theme variables across all interactive cards.',
        employeeId: empDocs[2]?.id || '',
        employeeName: empDocs[2]?.name || '',
        projectId: prjDocs[0]?.id || '',
        projectName: prjDocs[0]?.name || '',
        priority: 'High',
        difficulty: 'Medium',
        deadline: '2026-07-25',
        status: 'Review',
        estimatedHours: 20,
        actualHours: 18,
        qualityScore: 95,
        completionPercentage: 90
      },
      {
        taskId: 'TSK-803',
        title: 'Fix PostgreSQL Connection Pool Exhaustion',
        description: 'Resolve max connection leaks under heavy concurrent GraphQL requests.',
        employeeId: empDocs[3]?.id || '',
        employeeName: empDocs[3]?.name || '',
        projectId: prjDocs[1]?.id || '',
        projectName: prjDocs[1]?.name || '',
        priority: 'Urgent',
        difficulty: 'Hard',
        deadline: '2026-07-23',
        status: 'In Progress',
        estimatedHours: 30,
        actualHours: 35,
        qualityScore: 72,
        completionPercentage: 60
      },
      {
        taskId: 'TSK-804',
        title: 'Client Enterprise Q3 Renewal Proposal',
        description: 'Draft custom SLA contract terms and pitch deck for Nexus Corp expansion.',
        employeeId: empDocs[4]?.id || '',
        employeeName: empDocs[4]?.name || '',
        projectId: prjDocs[0]?.id || '',
        projectName: prjDocs[0]?.name || '',
        priority: 'High',
        difficulty: 'Medium',
        deadline: '2026-07-24',
        status: 'Completed',
        estimatedHours: 15,
        actualHours: 14,
        qualityScore: 98,
        completionPercentage: 100
      }
    ];

    for (const tsk of tasksData) {
      await addDoc(collection(db, 'tasks'), tsk);
    }

    // 6. Performance
    for (const emp of empDocs) {
      const perf: Omit<PerformanceMetric, 'id'> = {
        employeeId: emp.id,
        employeeName: emp.name,
        period: 'July 2026',
        taskCompletion: emp.performanceScore,
        attendance: emp.attendanceScore,
        quality: emp.performanceScore > 90 ? 96 : 75,
        communication: 92,
        initiative: emp.performanceScore > 90 ? 95 : 70,
        overallScore: Math.round((emp.performanceScore + emp.attendanceScore + (emp.performanceScore > 90 ? 95 : 72)) / 3),
        employeeRating: emp.performanceScore >= 90 ? 'Exceptional' : 'Needs Improvement',
        promotionRecommendation: emp.performanceScore >= 90 ? 'Recommended for Senior Principal track' : 'Provide 1-on-1 engineering mentoring',
        trainingRecommendation: emp.performanceScore >= 90 ? 'Advanced AI Safety Architectures' : 'Async Node.js Concurrency Patterns',
        aiAnalysis: `Employee ${emp.name} has demonstrated strong technical execution. Productivity score is ${emp.performanceScore}%.`
      };
      await addDoc(collection(db, 'performance'), perf);
    }

    // 7. Attendance
    const today = new Date().toISOString().split('T')[0];
    for (const emp of empDocs) {
      const att: Omit<AttendanceRecord, 'id'> = {
        employeeId: emp.id,
        employeeName: emp.name,
        date: today,
        clockIn: '08:55',
        clockOut: '18:10',
        status: emp.name === 'David Miller' ? 'Late' : 'Present',
        workHours: 9.25,
        notes: emp.name === 'David Miller' ? 'Clocked in at 09:35 due to transit delay' : 'Standard shift'
      };
      await addDoc(collection(db, 'attendance'), att);
    }

    // 8. Meetings
    const meetingData: Omit<Meeting, 'id'>[] = [
      {
        title: 'CEO Weekly Executive Strategy & Risk Sync',
        date: today,
        time: '10:00 AM',
        durationMinutes: 45,
        participants: empDocs.map(e => e.id),
        participantNames: empDocs.map(e => e.name),
        agenda: 'Review BioGen AI project risk, approve Q3 hiring roadmap, and examine client renewal progress.',
        status: 'Scheduled',
        actionItems: [
          { id: 'act-1', text: 'Resolve BioGen latency issue', done: false },
          { id: 'act-2', text: 'Finalize Nexus Corp extension contract', done: true }
        ]
      },
      {
        title: '1-on-1 Engineering Review: David Miller',
        date: today,
        time: '03:00 PM',
        durationMinutes: 30,
        participants: [empDocs[3]?.id || ''],
        participantNames: [empDocs[3]?.name || 'David Miller'],
        agenda: 'Sprint task blockages, PostgreSQL query performance, and improvement targets.',
        status: 'Scheduled'
      }
    ];
    for (const m of meetingData) {
      await addDoc(collection(db, 'meetings'), m);
    }

    // 9. Documents
    const docsData: Omit<CompanyDocument, 'id'>[] = [
      {
        title: 'Sovryx 2026 Company Policy & Ethics Guide',
        category: 'Policy',
        url: '#',
        uploadedBy: 'CEO Sovereign',
        date: '2026-01-01',
        tags: ['Governance', 'Policy', 'HR-Free Rules'],
        size: '1.2 MB'
      },
      {
        title: 'Nexus Corp Enterprise Master Service Agreement',
        category: 'Contract',
        url: '#',
        uploadedBy: 'CEO Sovereign',
        date: '2026-02-10',
        tags: ['Contract', 'Legal', 'Client'],
        size: '2.8 MB'
      },
      {
        title: 'BioGen AI Predictive Pipeline Tech Spec',
        category: 'Project Brief',
        url: '#',
        uploadedBy: 'Elena Rostova',
        date: '2026-03-05',
        tags: ['Engineering', 'Specification'],
        size: '4.5 MB'
      }
    ];
    for (const d of docsData) {
      await addDoc(collection(db, 'documents'), d);
    }

    // 10. Notifications
    const notificationsData: Omit<NotificationItem, 'id'>[] = [
      {
        title: 'PROJECT AT RISK ALERT',
        message: 'Project BioGen AI Predictive Pipeline is marked AT RISK due to backend query delays.',
        type: 'risk',
        severity: 'urgent',
        read: false,
        timestamp: '10 mins ago',
        linkModule: 'projects'
      },
      {
        title: 'Task Milestone Achieved',
        message: 'Amara Okafor completed Nexus Corp Renewal Proposal with 98% quality score.',
        type: 'task',
        severity: 'info',
        read: false,
        timestamp: '1 hour ago',
        linkModule: 'tasks'
      },
      {
        title: 'Attendance Anomaly',
        message: 'David Miller clocked in 35 minutes late today.',
        type: 'attendance',
        severity: 'warning',
        read: false,
        timestamp: '2 hours ago',
        linkModule: 'attendance'
      }
    ];
    for (const n of notificationsData) {
      await addDoc(collection(db, 'notifications'), n);
    }

    // 11. Reports
    const reportsData: Omit<CompanyReport, 'id'>[] = [
      {
        title: 'Daily CEO Executive Summary - July 21, 2026',
        type: 'Daily',
        date: '2026-07-21',
        summary: 'Company operated at 91% overall efficiency. High velocity achieved in AI Core development. Critical focus required on BioGen dataset ingestion.',
        metrics: {
          totalEmployees: 5,
          activeProjects: 3,
          tasksCompleted: 14,
          overallProductivity: 91,
          revenueOrBudget: 780000
        },
        keyHighlights: [
          'Elena Rostova optimized neural token latency to under 45ms.',
          'Amara Okafor secured preliminary approval for Nexus Corp $450k renewal.'
        ],
        risksIdentified: [
          'Database query latency in BioGen project needs developer coaching.'
        ],
        aiRecommendations: [
          'Pair Lead AI Engineer with Backend team to unblock database concurrency.'
        ],
        createdBy: 'Gemini AI Assistant'
      }
    ];
    for (const r of reportsData) {
      await addDoc(collection(db, 'reports'), r);
    }

    console.log('Sovryx Company OS Initial Data Seeded Successfully!');
    return true;
  } catch (error) {
    console.error('Error seeding initial data:', error);
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
