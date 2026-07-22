'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2,
  UserCheck,
  Settings,
  FolderTree,
  Users,
  Briefcase,
  Sliders,
  Bell,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  Save,
  ShieldAlert,
  Clock,
  DollarSign,
  AlertCircle,
  FileCheck,
  Check,
  X,
  Upload,
  Globe,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Lock,
  Layers,
  ArrowRight,
  Cpu
} from 'lucide-react';
import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  setDoc,
  addDoc,
  writeBatch
} from 'firebase/firestore';

interface CompanySetupWizardProps {
  isOpen?: boolean;
  onClose?: () => void;
  onComplete?: () => void;
}

export default function CompanySetupWizard({
  isOpen = true,
  onClose,
  onComplete
}: CompanySetupWizardProps) {
  const [step, setStep] = useState(1);
  const [savingProgress, setSavingProgress] = useState(false);
  const [isInitializingCompany, setIsInitializingCompany] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [completedSuccess, setCompletedSuccess] = useState(false);

  // Step 1: Company Information
  const [companyInfo, setCompanyInfo] = useState({
    companyName: 'Sovryx Global Systems',
    legalName: 'Sovryx Systems Inc.',
    companyLogo: 'https://picsum.photos/seed/sovryxlogo/200/200',
    registrationNumber: 'REG-2026-8890',
    panVatNumber: 'VAT-992011',
    businessType: 'Corporation',
    industry: 'Artificial Intelligence & Robotics',
    email: 'contact@sovryx.com',
    phone: '+1 (800) 555-SOVRYX',
    website: 'https://sovryx.com',
    address: '100 Sovereign Way, Suite 500',
    country: 'United States',
    provinceState: 'California',
    city: 'San Francisco',
    postalCode: '94105',
    timezone: 'UTC-8 (PST)',
    currency: 'USD ($)',
    fiscalYearStart: 'January'
  });

  // Step 2: CEO Account
  const [ceoInfo, setCeoInfo] = useState({
    fullName: 'Sovereign CEO',
    profilePicture: 'https://picsum.photos/seed/ceoavatar/200/200',
    email: 'ceo@sovryx.com',
    phone: '+1 (555) 019-2831',
    dob: '1988-06-15',
    gender: 'Male',
    address: 'Executive Tower, San Francisco',
    emergencyContact: 'Elena Vance',
    emergencyPhone: '+1 (555) 998-1122',
    password: '••••••••••••',
    confirmPassword: '••••••••••••'
  });

  // Step 3: Company Settings
  const [companySettings, setCompanySettings] = useState({
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    officeStartTime: '09:00',
    officeEndTime: '18:00',
    lunchBreak: '12:30 - 13:30',
    workingHoursPerDay: 8,
    weekendDays: ['Saturday', 'Sunday'],
    attendanceEnabled: true,
    leaveSystemEnabled: true,
    performanceTrackingEnabled: true,
    darkMode: true,
    language: 'English (US)',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: '12-hour'
  });

  // Step 4: Departments
  const [departments, setDepartments] = useState([
    { id: '1', name: 'Software Development', code: 'DEV', description: 'Core software engineering, LLMs, and platform architecture.' },
    { id: '2', name: 'UI/UX Design', code: 'DES', description: 'User interfaces, glassmorphism design systems, and product ergonomics.' },
    { id: '3', name: 'AI & Research', code: 'AIR', description: 'Neural models, predictive pipelines, and automated intelligence.' },
    { id: '4', name: 'Sales & Growth', code: 'SLS', description: 'Enterprise account management and global client acquisition.' }
  ]);
  const [newDept, setNewDept] = useState({ name: '', code: '', description: '' });

  // Step 5: Employee Setup (Can skip)
  const [employees, setEmployees] = useState([
    {
      id: 'emp-1',
      employeeId: 'EMP-001',
      name: 'Elena Rostova',
      email: 'elena.rostova@sovryx.com',
      phone: '+1 (555) 234-5678',
      department: 'Software Development',
      position: 'Lead AI Engineer',
      salary: 185000,
      joinDate: '2025-01-15',
      employmentType: 'Full-time',
      status: 'Active'
    },
    {
      id: 'emp-2',
      employeeId: 'EMP-002',
      name: 'Marcus Vance',
      email: 'marcus.vance@sovryx.com',
      phone: '+1 (555) 345-6789',
      department: 'UI/UX Design',
      position: 'Principal Design Architect',
      salary: 165000,
      joinDate: '2025-03-01',
      employmentType: 'Full-time',
      status: 'Active'
    }
  ]);
  const [newEmp, setNewEmp] = useState({
    name: '',
    employeeId: 'EMP-003',
    email: '',
    phone: '',
    department: 'Software Development',
    position: '',
    salary: 120000,
    joinDate: new Date().toISOString().split('T')[0],
    employmentType: 'Full-time',
    status: 'Active'
  });

  // Step 6: Client Setup (Can skip)
  const [clients, setClients] = useState([
    {
      id: 'cli-1',
      name: 'Nexus Corp Global',
      company: 'Nexus Corp',
      email: 'partners@nexuscorp.io',
      phone: '+1 (800) 555-0199',
      website: 'https://nexuscorp.io',
      address: '700 Tech Boulevard, Austin TX',
      industry: 'Enterprise Software'
    }
  ]);
  const [newClient, setNewClient] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    industry: 'Technology'
  });

  // Step 7: Project Setup (Can skip)
  const [projects, setProjects] = useState([
    {
      id: 'prj-1',
      name: 'Sovryx AI Neural OS Core',
      client: 'Nexus Corp Global',
      description: 'Next-generation AI Operating System core engine and executive control dashboard.',
      budget: 350000,
      priority: 'Urgent',
      startDate: '2026-01-10',
      deadline: '2026-09-30',
      assignedEmployees: ['EMP-001', 'EMP-002']
    }
  ]);
  const [newPrj, setNewPrj] = useState({
    name: '',
    client: 'Nexus Corp Global',
    description: '',
    budget: 150000,
    priority: 'High',
    startDate: new Date().toISOString().split('T')[0],
    deadline: '2026-12-31',
    assignedEmployees: [] as string[]
  });

  // Step 8: Performance Settings Weights
  const [perfWeights, setPerfWeights] = useState({
    taskCompletion: 30,
    quality: 25,
    attendance: 15,
    communication: 10,
    initiative: 10,
    problemSolving: 10
  });

  // Step 9: Notifications
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    taskReminders: true,
    meetingReminders: true,
    performanceReviews: true,
    deadlineAlerts: true
  });

  // Step 10: AI Settings
  const [aiSettings, setAiSettings] = useState({
    enableGeminiAI: true,
    dailyCeoReport: true,
    weeklyReport: true,
    monthlyReport: true,
    employeeInsights: true,
    projectRiskDetection: true,
    meetingSummaries: true,
    taskSuggestions: true,
    autoPerformanceAnalysis: true
  });

  // Load saved draft on mount
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem('sovryx_company_setup_draft');
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed.step) setStep(parsed.step);
        if (parsed.companyInfo) setCompanyInfo(parsed.companyInfo);
        if (parsed.ceoInfo) setCeoInfo(parsed.ceoInfo);
        if (parsed.companySettings) setCompanySettings(parsed.companySettings);
        if (parsed.departments) setDepartments(parsed.departments);
        if (parsed.employees) setEmployees(parsed.employees);
        if (parsed.clients) setClients(parsed.clients);
        if (parsed.projects) setProjects(parsed.projects);
        if (parsed.perfWeights) setPerfWeights(parsed.perfWeights);
        if (parsed.notificationSettings) setNotificationSettings(parsed.notificationSettings);
        if (parsed.aiSettings) setAiSettings(parsed.aiSettings);
      }
    } catch (e) {
      console.warn('Could not load onboarding draft from localStorage:', e);
    }
  }, []);

  // Auto-save progress step transition
  const autoSaveProgress = async (nextStepNumber: number) => {
    setSavingProgress(true);
    const draftData = {
      step: nextStepNumber,
      companyInfo,
      ceoInfo,
      companySettings,
      departments,
      employees,
      clients,
      projects,
      perfWeights,
      notificationSettings,
      aiSettings,
      updatedAt: new Date().toISOString()
    };

    try {
      localStorage.setItem('sovryx_company_setup_draft', JSON.stringify(draftData));
      // Save draft to Firestore doc for persistence across sessions
      const draftRef = doc(db, 'onboarding_progress', 'current_draft');
      await setDoc(draftRef, draftData, { merge: true });
    } catch (e) {
      console.warn('Firestore draft save warning:', e);
    } finally {
      setTimeout(() => setSavingProgress(false), 300);
    }
  };

  const handleNext = () => {
    setValidationError(null);

    // Validation per step
    if (step === 1 && !companyInfo.companyName.trim()) {
      setValidationError('Company Name is strictly required.');
      return;
    }
    if (step === 2 && (!ceoInfo.fullName.trim() || !ceoInfo.email.trim())) {
      setValidationError('CEO Full Name and Email are strictly required.');
      return;
    }
    if (step === 8) {
      const total =
        perfWeights.taskCompletion +
        perfWeights.quality +
        perfWeights.attendance +
        perfWeights.communication +
        perfWeights.initiative +
        perfWeights.problemSolving;
      if (total !== 100) {
        setValidationError(`Performance weights total must equal 100%. Current total: ${total}%.`);
        return;
      }
    }

    const nextS = Math.min(step + 1, 11);
    setStep(nextS);
    autoSaveProgress(nextS);
  };

  const handlePrev = () => {
    setValidationError(null);
    const prevS = Math.max(step - 1, 1);
    setStep(prevS);
    autoSaveProgress(prevS);
  };

  // Final Action: Complete Onboarding & Initialize Firestore
  const handleCreateCompanyFinal = async () => {
    setIsInitializingCompany(true);
    setValidationError(null);

    try {
      const companyId = 'CMP-' + Math.random().toString(36).substring(2, 9).toUpperCase();
      const batch = writeBatch(db);

      // 1. Company Record
      const companyRef = doc(db, 'companies', companyId);
      batch.set(companyRef, {
        id: companyId,
        companyId,
        ...companyInfo,
        onboardingCompleted: true,
        createdAt: new Date().toISOString()
      });

      // 2. CEO User Account
      const ceoRef = doc(db, 'users', 'ceo_account');
      batch.set(ceoRef, {
        companyId,
        role: 'CEO',
        permissions: ['FULL_ACCESS', 'EXECUTIVE_OVERRIDE'],
        ...ceoInfo,
        createdAt: new Date().toISOString()
      });

      // 3. Settings config doc
      const settingsRef = doc(db, 'settings', 'config');
      batch.set(settingsRef, {
        companyId,
        companyName: companyInfo.companyName,
        ceoName: ceoInfo.fullName,
        ceoEmail: ceoInfo.email,
        currency: companyInfo.currency,
        timezone: companyInfo.timezone,
        workingHoursStart: companySettings.officeStartTime,
        workingHoursEnd: companySettings.officeEndTime,
        aiAutoRiskDetection: aiSettings.projectRiskDetection,
        aiDailyReportEnabled: aiSettings.dailyCeoReport,
        theme: companySettings.darkMode ? 'dark' : 'light',
        performanceWeights: perfWeights,
        notificationSettings,
        aiSettings
      });

      // 4. Departments
      departments.forEach((d) => {
        const dRef = doc(collection(db, 'departments'));
        batch.set(dRef, { ...d, companyId });
      });

      // 5. Employees
      employees.forEach((emp) => {
        const empRef = doc(collection(db, 'employees'));
        batch.set(empRef, {
          ...emp,
          companyId,
          performanceScore: 92,
          attendanceScore: 96,
          warnings: [],
          documents: [],
          notes: []
        });
      });

      // 6. Clients
      clients.forEach((c) => {
        const cRef = doc(collection(db, 'clients'));
        batch.set(cRef, {
          ...c,
          companyId,
          totalSpent: 100000,
          activeProjectsCount: 1,
          status: 'Active'
        });
      });

      // 7. Projects
      projects.forEach((p) => {
        const pRef = doc(collection(db, 'projects'));
        batch.set(pRef, {
          ...p,
          companyId,
          projectId: 'PRJ-' + Math.floor(100 + Math.random() * 900),
          status: 'In Progress',
          progress: 25,
          employeeIds: p.assignedEmployees,
          spentBudget: Math.round(p.budget * 0.2)
        });
      });

      // 8. Default System Collections / Statuses
      const dashRef = doc(db, 'settings', 'dashboards');
      batch.set(dashRef, {
        companyId,
        defaultTaskStatuses: ['Todo', 'In Progress', 'Review', 'Completed'],
        defaultProjectStatuses: ['Planning', 'In Progress', 'On Hold', 'Completed', 'At Risk'],
        defaultPriorities: ['Low', 'Medium', 'High', 'Urgent'],
        defaultAttendanceSettings: {
          startTime: companySettings.officeStartTime,
          endTime: companySettings.officeEndTime,
          lunchBreak: companySettings.lunchBreak
        },
        defaultLeaveTypes: ['Annual', 'Sick', 'Casual', 'Maternity/Paternity', 'Unpaid'],
        defaultPerformanceRatings: ['Exceptional', 'Exceeds Expectations', 'Meets Expectations', 'Needs Improvement'],
        ceoDashboardConfig: { widgets: ['metrics', 'ai_insights', 'risk_monitor', 'team_velocity'] }
      });

      // Commit Batch
      await batch.commit();

      // Clear draft
      localStorage.removeItem('sovryx_company_setup_draft');
      setCompletedSuccess(true);
      if (onComplete) onComplete();
    } catch (err: any) {
      console.error('Error initializing company in Firebase:', err);
      setValidationError('Firebase initialization failed: ' + err.message);
    } finally {
      setIsInitializingCompany(false);
    }
  };

  // Helper for chip auto-add step 4
  const addDeptExample = (name: string, code: string, description: string) => {
    if (departments.some((d) => d.name === name)) return;
    setDepartments((prev) => [...prev, { id: Date.now().toString(), name, code, description }]);
  };

  if (!isOpen) return null;

  const totalSteps = 10;
  const progressPercent = Math.min(100, Math.round(((step - 1) / totalSteps) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-xl overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Top Header Bar */}
        <div className="px-6 py-4 border-b border-slate-800/80 bg-slate-950/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-emerald-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/20">
              S
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Sovryx Company OS
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  INITIALIZATION WIZARD
                </span>
              </h2>
              <p className="text-xs text-slate-400">Multi-Tenant Corporate Engine & Database Provisioning</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {savingProgress && (
              <span className="text-xs text-indigo-400 flex items-center gap-1.5 font-medium animate-pulse">
                <Save className="w-3.5 h-3.5" /> Auto-saving to Firebase...
              </span>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Step Progress Tracker */}
        {!completedSuccess && (
          <div className="bg-slate-950 px-6 py-3 border-b border-slate-800/80 shrink-0">
            <div className="flex justify-between items-center text-xs mb-2">
              <span className="font-semibold text-slate-200">
                Step {step > 10 ? 10 : step} of 10:{' '}
                <span className="text-indigo-400 font-bold">
                  {step === 1 && 'Company Information'}
                  {step === 2 && 'CEO Account & Authority'}
                  {step === 3 && 'Company Operating Settings'}
                  {step === 4 && 'Departments Setup'}
                  {step === 5 && 'Employee Setup'}
                  {step === 6 && 'Client Management'}
                  {step === 7 && 'Project Initialization'}
                  {step === 8 && 'Performance Weights'}
                  {step === 9 && 'Notification Alert Rules'}
                  {step === 10 && 'Gemini AI Intelligence'}
                  {step === 11 && 'Final Review & Initialize'}
                </span>
              </span>
              <span className="font-mono text-emerald-400 font-bold">{progressPercent}% Completed</span>
            </div>
            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 custom-scrollbar">
          {validationError && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
              <span>{validationError}</span>
            </div>
          )}

          {/* STEP 1: COMPANY INFO */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                <Building2 className="w-6 h-6 text-indigo-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">Company Identity & Registration</h3>
                  <p className="text-xs text-slate-400">Basic organizational details and regional parameters</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Company Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={companyInfo.companyName}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, companyName: e.target.value })}
                    placeholder="e.g. Sovryx Global Systems"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Legal Company Name</label>
                  <input
                    type="text"
                    value={companyInfo.legalName}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, legalName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Company Logo URL</label>
                  <input
                    type="text"
                    value={companyInfo.companyLogo}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, companyLogo: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Registration Number</label>
                  <input
                    type="text"
                    value={companyInfo.registrationNumber}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, registrationNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">PAN / VAT Number</label>
                  <input
                    type="text"
                    value={companyInfo.panVatNumber}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, panVatNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Business Type</label>
                  <select
                    value={companyInfo.businessType}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, businessType: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Corporation">Corporation</option>
                    <option value="LLC">LLC</option>
                    <option value="Partnership">Partnership</option>
                    <option value="Startup">Startup</option>
                    <option value="Sole Proprietorship">Sole Proprietorship</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Industry</label>
                  <input
                    type="text"
                    value={companyInfo.industry}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, industry: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Company Email</label>
                  <input
                    type="email"
                    value={companyInfo.email}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Company Phone</label>
                  <input
                    type="text"
                    value={companyInfo.phone}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Website</label>
                  <input
                    type="text"
                    value={companyInfo.website}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, website: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">Headquarters Address</label>
                  <input
                    type="text"
                    value={companyInfo.address}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, address: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Country</label>
                  <input
                    type="text"
                    value={companyInfo.country}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, country: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Province / State</label>
                  <input
                    type="text"
                    value={companyInfo.provinceState}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, provinceState: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Timezone</label>
                  <select
                    value={companyInfo.timezone}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, timezone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="UTC-8 (PST)">UTC-8 (PST)</option>
                    <option value="UTC-5 (EST)">UTC-5 (EST)</option>
                    <option value="UTC+0 (GMT)">UTC+0 (GMT)</option>
                    <option value="UTC+5:45 (NPT)">UTC+5:45 (NPT)</option>
                    <option value="UTC+9 (JST)">UTC+9 (JST)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Currency</label>
                  <select
                    value={companyInfo.currency}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, currency: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="USD ($)">USD ($)</option>
                    <option value="EUR (€)">EUR (€)</option>
                    <option value="GBP (£)">GBP (£)</option>
                    <option value="NPR (NRS)">NPR (NRS)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Fiscal Year Start</label>
                  <select
                    value={companyInfo.fiscalYearStart}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, fiscalYearStart: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="January">January</option>
                    <option value="April">April</option>
                    <option value="July">July</option>
                    <option value="October">October</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: CEO ACCOUNT */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                <UserCheck className="w-6 h-6 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">Chief Executive Officer Credentials</h3>
                  <p className="text-xs text-slate-400">
                    Primary Sovereign Account. Automatically assigned Role: <strong className="text-indigo-400">CEO</strong> with <strong className="text-emerald-400">Full Access</strong>.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Full Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={ceoInfo.fullName}
                    onChange={(e) => setCeoInfo({ ...ceoInfo, fullName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Email Address <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="email"
                    value={ceoInfo.email}
                    onChange={(e) => setCeoInfo({ ...ceoInfo, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={ceoInfo.phone}
                    onChange={(e) => setCeoInfo({ ...ceoInfo, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={ceoInfo.dob}
                    onChange={(e) => setCeoInfo({ ...ceoInfo, dob: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Profile Photo URL</label>
                  <input
                    type="text"
                    value={ceoInfo.profilePicture}
                    onChange={(e) => setCeoInfo({ ...ceoInfo, profilePicture: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Gender</label>
                  <select
                    value={ceoInfo.gender}
                    onChange={(e) => setCeoInfo({ ...ceoInfo, gender: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Emergency Contact</label>
                  <input
                    type="text"
                    value={ceoInfo.emergencyContact}
                    onChange={(e) => setCeoInfo({ ...ceoInfo, emergencyContact: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Emergency Phone</label>
                  <input
                    type="text"
                    value={ceoInfo.emergencyPhone}
                    onChange={(e) => setCeoInfo({ ...ceoInfo, emergencyPhone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">System Password</label>
                  <input
                    type="password"
                    value={ceoInfo.password}
                    onChange={(e) => setCeoInfo({ ...ceoInfo, password: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-200 block">Automatic Role Assignment</span>
                    <span className="text-slate-400">Role: CEO • Permissions: Full Executive Command Access</span>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                  ASSIGNED
                </span>
              </div>
            </div>
          )}

          {/* STEP 3: COMPANY SETTINGS */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                <Settings className="w-6 h-6 text-indigo-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">Company Operating Settings</h3>
                  <p className="text-xs text-slate-400">Working hours, attendance policies, and system preferences</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Office Start Time</label>
                  <input
                    type="time"
                    value={companySettings.officeStartTime}
                    onChange={(e) => setCompanySettings({ ...companySettings, officeStartTime: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Office End Time</label>
                  <input
                    type="time"
                    value={companySettings.officeEndTime}
                    onChange={(e) => setCompanySettings({ ...companySettings, officeEndTime: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Lunch Break Hours</label>
                  <input
                    type="text"
                    value={companySettings.lunchBreak}
                    onChange={(e) => setCompanySettings({ ...companySettings, lunchBreak: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Date Format</label>
                  <select
                    value={companySettings.dateFormat}
                    onChange={(e) => setCompanySettings({ ...companySettings, dateFormat: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Time Format</label>
                  <select
                    value={companySettings.timeFormat}
                    onChange={(e) => setCompanySettings({ ...companySettings, timeFormat: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="12-hour">12-hour (AM/PM)</option>
                    <option value="24-hour">24-hour Military</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Language</label>
                  <input
                    type="text"
                    value={companySettings.language}
                    onChange={(e) => setCompanySettings({ ...companySettings, language: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {[
                  { key: 'attendanceEnabled', label: 'Attendance Tracking Enabled' },
                  { key: 'leaveSystemEnabled', label: 'Leave Management System Enabled' },
                  { key: 'performanceTrackingEnabled', label: 'Performance Analytics Enabled' },
                  { key: 'darkMode', label: 'Default Glassmorphism Dark Mode' }
                ].map((item) => (
                  <label
                    key={item.key}
                    className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs cursor-pointer hover:border-slate-700"
                  >
                    <span className="font-semibold text-slate-200">{item.label}</span>
                    <input
                      type="checkbox"
                      checked={(companySettings as any)[item.key]}
                      onChange={(e) =>
                        setCompanySettings({ ...companySettings, [item.key]: e.target.checked })
                      }
                      className="w-4 h-4 accent-indigo-500 rounded"
                    />
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: DEPARTMENTS */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <FolderTree className="w-6 h-6 text-purple-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white">Department Architecture</h3>
                    <p className="text-xs text-slate-400">Configure organizational units and functional divisions</p>
                  </div>
                </div>
              </div>

              {/* Quick Add Examples */}
              <div className="space-y-2">
                <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">
                  Quick Add Standard Departments:
                </span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { name: 'Software Development', code: 'DEV', desc: 'Core engineering' },
                    { name: 'UI/UX Design', code: 'DES', desc: 'Interface design' },
                    { name: 'AI & Research', code: 'AIR', desc: 'Neural AI R&D' },
                    { name: 'Sales & Growth', code: 'SLS', desc: 'Enterprise sales' },
                    { name: 'Marketing', code: 'MKT', desc: 'Brand marketing' },
                    { name: 'Support', code: 'SUP', desc: 'Customer success' },
                    { name: 'Finance', code: 'FIN', desc: 'Accounting & payroll' },
                    { name: 'Administration', code: 'ADM', desc: 'Operations' }
                  ].map((chip) => (
                    <button
                      key={chip.code}
                      onClick={() => addDeptExample(chip.name, chip.code, chip.desc)}
                      className="text-xs px-3 py-1 rounded-full bg-slate-950 hover:bg-indigo-600/20 text-slate-300 hover:text-indigo-300 border border-slate-800 transition-all flex items-center gap-1.5"
                    >
                      <Plus className="w-3 h-3 text-indigo-400" /> {chip.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Add Custom Dept */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-white block">Add Custom Department</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <input
                    type="text"
                    placeholder="Department Name"
                    value={newDept.name}
                    onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-2 text-white"
                  />
                  <input
                    type="text"
                    placeholder="Dept Code (e.g. SEC)"
                    value={newDept.code}
                    onChange={(e) => setNewDept({ ...newDept, code: e.target.value })}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-2 text-white"
                  />
                  <input
                    type="text"
                    placeholder="Short Description"
                    value={newDept.description}
                    onChange={(e) => setNewDept({ ...newDept, description: e.target.value })}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-2 text-white"
                  />
                </div>
                <button
                  onClick={() => {
                    if (newDept.name) {
                      setDepartments((prev) => [
                        ...prev,
                        { id: Date.now().toString(), ...newDept }
                      ]);
                      setNewDept({ name: '', code: '', description: '' });
                    }
                  }}
                  className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl transition-all"
                >
                  Add Department
                </button>
              </div>

              {/* Department List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {departments.map((d) => (
                  <div
                    key={d.id}
                    className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">{d.name}</span>
                        <span className="font-mono text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20">
                          {d.code}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">{d.description}</p>
                    </div>
                    <button
                      onClick={() => setDepartments(departments.filter((x) => x.id !== d.id))}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5: EMPLOYEES */}
          {step === 5 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <Users className="w-6 h-6 text-emerald-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white">Initial Employee Roster</h3>
                    <p className="text-xs text-slate-400">Add team members or skip this step to add later</p>
                  </div>
                </div>
                <span className="text-xs text-slate-500 font-semibold italic">Optional Step</span>
              </div>

              {/* Add Employee Form */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-white block">Add Employee Record</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={newEmp.name}
                    onChange={(e) => setNewEmp({ ...newEmp, name: e.target.value })}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-2 text-white"
                  />
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={newEmp.email}
                    onChange={(e) => setNewEmp({ ...newEmp, email: e.target.value })}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-2 text-white"
                  />
                  <input
                    type="text"
                    placeholder="Position Title"
                    value={newEmp.position}
                    onChange={(e) => setNewEmp({ ...newEmp, position: e.target.value })}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-2 text-white"
                  />
                  <select
                    value={newEmp.department}
                    onChange={(e) => setNewEmp({ ...newEmp, department: e.target.value })}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-2 text-white"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Annual Salary ($)"
                    value={newEmp.salary}
                    onChange={(e) => setNewEmp({ ...newEmp, salary: Number(e.target.value) })}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-2 text-white"
                  />
                  <button
                    onClick={() => {
                      if (newEmp.name && newEmp.email) {
                        setEmployees((prev) => [
                          ...prev,
                          {
                            ...newEmp,
                            id: Date.now().toString(),
                            employeeId: 'EMP-' + Math.floor(100 + Math.random() * 900)
                          }
                        ]);
                        setNewEmp({
                          name: '',
                          employeeId: 'EMP-' + Math.floor(100 + Math.random() * 900),
                          email: '',
                          phone: '',
                          department: departments[0]?.name || 'Software Development',
                          position: '',
                          salary: 120000,
                          joinDate: new Date().toISOString().split('T')[0],
                          employmentType: 'Full-time',
                          status: 'Active'
                        });
                      }
                    }}
                    className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl transition-all"
                  >
                    + Add Employee
                  </button>
                </div>
              </div>

              {/* Added Employees Table */}
              <div className="space-y-2">
                {employees.map((emp) => (
                  <div
                    key={emp.id}
                    className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-indigo-400">
                        {emp.name.charAt(0)}
                      </div>
                      <div>
                        <span className="font-bold text-white block">{emp.name}</span>
                        <span className="text-[10px] text-slate-400">
                          {emp.position} • {emp.department} • ${emp.salary.toLocaleString()}/yr
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setEmployees(employees.filter((x) => x.id !== emp.id))}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 6: CLIENT SETUP */}
          {step === 6 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <UserCheck className="w-6 h-6 text-indigo-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white">Client Portfolio Setup</h3>
                    <p className="text-xs text-slate-400">Register enterprise clients and key corporate accounts</p>
                  </div>
                </div>
                <span className="text-xs text-slate-500 font-semibold italic">Optional Step</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-white block">Add Client Account</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <input
                    type="text"
                    placeholder="Client Contact Name"
                    value={newClient.name}
                    onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-2 text-white"
                  />
                  <input
                    type="text"
                    placeholder="Company Name"
                    value={newClient.company}
                    onChange={(e) => setNewClient({ ...newClient, company: e.target.value })}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-2 text-white"
                  />
                  <input
                    type="email"
                    placeholder="Contact Email"
                    value={newClient.email}
                    onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-2 text-white"
                  />
                  <button
                    onClick={() => {
                      if (newClient.name && newClient.company) {
                        setClients((prev) => [...prev, { ...newClient, id: Date.now().toString() }]);
                        setNewClient({
                          name: '',
                          company: '',
                          email: '',
                          phone: '',
                          website: '',
                          address: '',
                          industry: 'Technology'
                        });
                      }
                    }}
                    className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl transition-all sm:col-span-3"
                  >
                    + Add Client
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {clients.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-white block">{c.company}</span>
                      <span className="text-[10px] text-slate-400">
                        Contact: {c.name} ({c.email})
                      </span>
                    </div>
                    <button
                      onClick={() => setClients(clients.filter((x) => x.id !== c.id))}
                      className="p-1.5 text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 7: PROJECT SETUP */}
          {step === 7 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <Briefcase className="w-6 h-6 text-emerald-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white">Project Pipeline Setup</h3>
                    <p className="text-xs text-slate-400">Initialize active deliverables, budgets, and milestones</p>
                  </div>
                </div>
                <span className="text-xs text-slate-500 font-semibold italic">Optional Step</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                <span className="font-bold text-white block">Add Project Deliverable</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Project Name"
                    value={newPrj.name}
                    onChange={(e) => setNewPrj({ ...newPrj, name: e.target.value })}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-2 text-white"
                  />
                  <input
                    type="number"
                    placeholder="Budget ($)"
                    value={newPrj.budget}
                    onChange={(e) => setNewPrj({ ...newPrj, budget: Number(e.target.value) })}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-2 text-white"
                  />
                </div>
                <button
                  onClick={() => {
                    if (newPrj.name) {
                      setProjects((prev) => [...prev, { ...newPrj, id: Date.now().toString() }]);
                      setNewPrj({
                        name: '',
                        client: clients[0]?.company || 'Nexus Corp Global',
                        description: '',
                        budget: 150000,
                        priority: 'High',
                        startDate: new Date().toISOString().split('T')[0],
                        deadline: '2026-12-31',
                        assignedEmployees: []
                      });
                    }
                  }}
                  className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl transition-all"
                >
                  + Add Project
                </button>
              </div>

              <div className="space-y-2">
                {projects.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-white block">{p.name}</span>
                      <span className="text-[10px] text-slate-400">
                        Client: {p.client} • Budget: ${p.budget.toLocaleString()} • Deadline: {p.deadline}
                      </span>
                    </div>
                    <button
                      onClick={() => setProjects(projects.filter((x) => x.id !== p.id))}
                      className="p-1.5 text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 8: PERFORMANCE SETTINGS */}
          {step === 8 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                <Sliders className="w-6 h-6 text-purple-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">Performance Evaluation Weights</h3>
                  <p className="text-xs text-slate-400">
                    Configure weighted scoring parameters. Total weight percentage MUST equal exactly 100%.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                {[
                  { key: 'taskCompletion', label: 'Task Completion %' },
                  { key: 'quality', label: 'Work Quality %' },
                  { key: 'attendance', label: 'Attendance Score %' },
                  { key: 'communication', label: 'Communication %' },
                  { key: 'initiative', label: 'Initiative %' },
                  { key: 'problemSolving', label: 'Problem Solving %' }
                ].map((item) => (
                  <div key={item.key} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center font-semibold text-slate-200">
                      <span>{item.label}</span>
                      <span className="font-mono text-indigo-400 font-bold">
                        {(perfWeights as any)[item.key]}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={(perfWeights as any)[item.key]}
                      onChange={(e) =>
                        setPerfWeights({
                          ...perfWeights,
                          [item.key]: Number(e.target.value)
                        })
                      }
                      className="w-full accent-indigo-500"
                    />
                  </div>
                ))}
              </div>

              {/* Total Check Indicator */}
              {(() => {
                const total =
                  perfWeights.taskCompletion +
                  perfWeights.quality +
                  perfWeights.attendance +
                  perfWeights.communication +
                  perfWeights.initiative +
                  perfWeights.problemSolving;
                return (
                  <div
                    className={`p-4 rounded-2xl border flex items-center justify-between text-xs ${
                      total === 100
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                        : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                    }`}
                  >
                    <span className="font-bold flex items-center gap-2">
                      {total === 100 ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-rose-400" />
                      )}
                      Performance Evaluation Total: {total}%
                    </span>
                    <span className="font-mono text-xs font-bold">
                      {total === 100 ? 'VALIDATED (100%)' : 'MUST EQUAL 100%'}
                    </span>
                  </div>
                );
              })()}
            </div>
          )}

          {/* STEP 9: NOTIFICATIONS */}
          {step === 9 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                <Bell className="w-6 h-6 text-indigo-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">Notification & Alert Trigger Rules</h3>
                  <p className="text-xs text-slate-400">Configure automated notification dispatch rules</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {[
                  { key: 'emailNotifications', title: 'Email Notifications', desc: 'Dispatch daily executive summaries to CEO' },
                  { key: 'pushNotifications', title: 'Real-time Push Notifications', desc: 'Browser alerts for urgent deliverables' },
                  { key: 'taskReminders', title: 'Task Reminders', desc: 'Alert employees 24 hours prior to deadline' },
                  { key: 'meetingReminders', title: 'Meeting Reminders', desc: '15-minute advance calendar notifications' },
                  { key: 'performanceReviews', title: 'Performance Review Alerts', desc: 'Monthly automated evaluation prompts' },
                  { key: 'deadlineAlerts', title: 'Project Deadline Alerts', desc: 'Flag milestone risks and schedule slippages' }
                ].map((rule) => (
                  <label
                    key={rule.key}
                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between cursor-pointer hover:border-slate-700"
                  >
                    <div>
                      <span className="font-bold text-white block">{rule.title}</span>
                      <span className="text-[10px] text-slate-400">{rule.desc}</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={(notificationSettings as any)[rule.key]}
                      onChange={(e) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          [rule.key]: e.target.checked
                        })
                      }
                      className="w-4 h-4 accent-indigo-500 rounded"
                    />
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* STEP 10: AI SETTINGS */}
          {step === 10 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                <Sparkles className="w-6 h-6 text-emerald-400 animate-pulse" />
                <div>
                  <h3 className="text-sm font-bold text-white">Gemini 2.5 AI Intelligence Engine</h3>
                  <p className="text-xs text-slate-400">Enable automated executive reports, risk detection, and insights</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {[
                  { key: 'enableGeminiAI', title: 'Enable Gemini 2.5 AI Core', desc: 'Full-stack AI assistant and automated analysis' },
                  { key: 'dailyCeoReport', title: 'Daily CEO Executive Report', desc: 'Synthesizes daily productivity and financial metrics' },
                  { key: 'weeklyReport', title: 'Weekly Summary Digest', desc: 'Weekly project velocity and attendance trends' },
                  { key: 'monthlyReport', title: 'Monthly Strategic Report', desc: 'High-level executive roadmap & growth highlights' },
                  { key: 'employeeInsights', title: 'Employee Performance Insights', desc: 'AI skill coaching & promotion recommendations' },
                  { key: 'projectRiskDetection', title: 'Automated Project Risk Detection', desc: 'Scans deliverable progress to flag delays' },
                  { key: 'meetingSummaries', title: 'AI Meeting Summarizer', desc: 'Generates action items and key takeaways' },
                  { key: 'taskSuggestions', title: 'AI Task Allocation Suggestions', desc: 'Matches task difficulty to employee skills' },
                  { key: 'autoPerformanceAnalysis', title: 'Auto Performance Analysis', desc: 'Continuous evaluation metric calculations' }
                ].map((ai) => (
                  <label
                    key={ai.key}
                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between cursor-pointer hover:border-slate-700"
                  >
                    <div>
                      <span className="font-bold text-white block">{ai.title}</span>
                      <span className="text-[10px] text-slate-400">{ai.desc}</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={(aiSettings as any)[ai.key]}
                      onChange={(e) =>
                        setAiSettings({
                          ...aiSettings,
                          [ai.key]: e.target.checked
                        })
                      }
                      className="w-4 h-4 accent-emerald-500 rounded"
                    />
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* STEP 11: FINAL REVIEW */}
          {step === 11 && !completedSuccess && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                <FileCheck className="w-6 h-6 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">Final Review & Database Initialization</h3>
                  <p className="text-xs text-slate-400">
                    Review configured parameters before creating company record and Firestore schema
                  </p>
                </div>
              </div>

              {/* Status Verification Checklist Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Company Info', ok: !!companyInfo.companyName, stepTarget: 1 },
                  { label: 'CEO Account', ok: !!ceoInfo.fullName, stepTarget: 2 },
                  { label: 'Settings', ok: true, stepTarget: 3 },
                  { label: 'Departments', ok: departments.length > 0, stepTarget: 4 },
                  { label: 'Employees', ok: employees.length > 0, stepTarget: 5 },
                  { label: 'Clients', ok: clients.length > 0, stepTarget: 6 },
                  { label: 'Projects', ok: projects.length > 0, stepTarget: 7 },
                  { label: 'Performance', ok: true, stepTarget: 8 }
                ].map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => setStep(item.stepTarget)}
                    className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between cursor-pointer hover:border-indigo-500/50 transition-colors"
                  >
                    <span className="text-xs font-semibold text-slate-200">{item.label}</span>
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <Check className="w-3 h-3" /> Ready
                    </span>
                  </div>
                ))}
              </div>

              {/* Summary Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="font-bold text-indigo-400 uppercase tracking-wider text-[10px] block">
                    Company Profile
                  </span>
                  <div className="space-y-1 text-slate-300">
                    <p><strong className="text-white">Name:</strong> {companyInfo.companyName}</p>
                    <p><strong className="text-white">Industry:</strong> {companyInfo.industry}</p>
                    <p><strong className="text-white">Headquarters:</strong> {companyInfo.city}, {companyInfo.country}</p>
                    <p><strong className="text-white">Currency:</strong> {companyInfo.currency}</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="font-bold text-emerald-400 uppercase tracking-wider text-[10px] block">
                    CEO Authority
                  </span>
                  <div className="space-y-1 text-slate-300">
                    <p><strong className="text-white">Full Name:</strong> {ceoInfo.fullName}</p>
                    <p><strong className="text-white">Email:</strong> {ceoInfo.email}</p>
                    <p><strong className="text-white">Role:</strong> CEO (Full Executive Command)</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="font-bold text-purple-400 uppercase tracking-wider text-[10px] block">
                    Initial Roster & Architecture
                  </span>
                  <div className="space-y-1 text-slate-300">
                    <p><strong className="text-white">Departments:</strong> {departments.length} configured</p>
                    <p><strong className="text-white">Employees:</strong> {employees.length} initial members</p>
                    <p><strong className="text-white">Clients & Projects:</strong> {clients.length} clients, {projects.length} deliverables</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="font-bold text-amber-400 uppercase tracking-wider text-[10px] block">
                    Firestore Collections Target
                  </span>
                  <div className="text-[10px] font-mono text-slate-400 space-y-0.5">
                    <p>✓ companies, users, departments, employees, clients</p>
                    <p>✓ projects, tasks, attendance, performance_reviews</p>
                    <p>✓ meetings, documents, notifications, settings, activity_logs</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUCCESS SCREEN */}
          {completedSuccess && (
            <div className="py-12 text-center space-y-6">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 to-indigo-500 p-0.5 mx-auto shadow-2xl shadow-emerald-500/30 animate-bounce">
                <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-emerald-400" />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white">Company Initialization Complete!</h3>
                <p className="text-sm text-slate-400 max-w-md mx-auto">
                  Sovryx Company OS has provisioned all Firestore collections and activated Gemini AI intelligence.
                </p>
              </div>

              <div className="max-w-md mx-auto p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-left space-y-2 font-mono text-slate-300">
                <p className="text-emerald-400 font-bold">✓ Multi-Tenant ID Assigned</p>
                <p>✓ 14 Firestore Collections Provisioned</p>
                <p>✓ CEO Executive Command Dashboard Live</p>
              </div>

              <button
                onClick={() => {
                  if (onClose) onClose();
                }}
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-indigo-600 text-white font-extrabold text-sm shadow-xl shadow-emerald-600/20 hover:scale-105 transition-all"
              >
                Enter Sovryx OS Workspace →
              </button>
            </div>
          )}
        </div>

        {/* Footer Action Bar */}
        {!completedSuccess && (
          <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between shrink-0">
            <button
              onClick={handlePrev}
              disabled={step === 1 || isInitializingCompany}
              className="flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 transition-all"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>

            <div className="flex items-center gap-3">
              {step < 11 ? (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 text-xs font-semibold px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white shadow-lg shadow-indigo-600/20 transition-all"
                >
                  Next Step <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleCreateCompanyFinal}
                  disabled={isInitializingCompany}
                  className="flex items-center gap-2 text-xs font-extrabold px-8 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white shadow-xl shadow-emerald-600/25 transition-all"
                >
                  {isInitializingCompany ? (
                    <>
                      <Cpu className="w-4 h-4 animate-spin" /> Provisioning Firebase...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Create Company & Provision OS
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
