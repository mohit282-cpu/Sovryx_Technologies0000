'use client';

import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  DollarSign,
  FileText,
  Award,
  GraduationCap,
  UploadCloud,
  Shield,
  Key,
  Clock,
  Calendar,
  Target,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  RefreshCw,
  Eye,
  FileCheck,
  Building,
  UserCheck,
  Check
} from 'lucide-react';
import { Employee } from '@/types';
import { createItem } from '@/lib/services/firestore';
import NepaliDatePicker from '@/components/ui/NepaliDatePicker';
import { adToBs, formatNPR } from '@/lib/nepaliCalendar';

interface AddEmployeeWizardProps {
  existingEmployees: Employee[];
  onClose: () => void;
  onSuccess: () => void;
}

const NEPAL_PROVINCES = [
  'Province 1 (Koshi)',
  'Madhesh Province',
  'Bagmati Province',
  'Gandaki Province',
  'Lumbini Province',
  'Karnali Province',
  'Sudurpashchim Province'
];

const NEPAL_DISTRICTS = [
  'Kathmandu', 'Lalitpur', 'Bhaktapur', 'Kaski (Pokhara)', 'Chitwan',
  'Morang (Biratnagar)', 'Rupandehi (Butwal)', 'Jhapa', 'Sunsari', 'Kavrepalanchok',
  'Makwanpur', 'Dhanusha', 'Parsa', 'Banke', 'Kailali', 'Gorkha', 'Tanahu', 'Dhading', 'Surkhet'
];

function computeFutureDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function calculateAgeFromAD(dobStr: string): number {
  if (!dobStr) return 25;
  const birthDate = new Date(dobStr);
  const today = new Date();
  let calculatedAge = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    calculatedAge--;
  }
  return Math.max(18, calculatedAge);
}

export default function AddEmployeeWizard({
  existingEmployees,
  onClose,
  onSuccess
}: AddEmployeeWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoSaveTime, setAutoSaveTime] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdEmployeeInfo, setCreatedEmployeeInfo] = useState<any>(null);

  // Auto Generate Employee ID
  const generateEmpId = () => {
    const numbers = existingEmployees
      .map(e => parseInt(e.employeeId?.replace(/\D/g, '') || '0', 10))
      .filter(n => !isNaN(n));
    const maxNum = numbers.length > 0 ? Math.max(...numbers) : 0;
    const nextNum = maxNum + 1;
    return `EMP-${String(nextNum).padStart(4, '0')}`;
  };

  const [employeeId] = useState<string>(generateEmpId());

  // Form State covering all 15 Sections
  const [formData, setFormData] = useState(() => {
    const initialProbation = computeFutureDate(90);
    const initialReview = computeFutureDate(180);
    const todayStr = new Date().toISOString().split('T')[0];

    return {
      // Section 1: Personal
      photoUrl: '',
      firstName: '',
      middleName: '',
      lastName: '',
      fullName: '',
      gender: 'Male' as 'Male' | 'Female' | 'Other',
      dobAD: '1998-05-15',
      dobBS: adToBs('1998-05-15').formatted,
      age: calculateAgeFromAD('1998-05-15'),
      bloodGroup: 'O+',
      maritalStatus: 'Single' as 'Single' | 'Married' | 'Divorced' | 'Widowed',
      nationality: 'Nepali',
      citizenshipNo: '',
      citizenshipDistrict: 'Kathmandu',
      nationalId: '',
      passportNo: '',
      panNo: '',
      religion: 'Hinduism',
      profileBio: '',

      // Section 2: Contact
      personalEmail: '',
      officialEmail: '',
      primaryPhone: '+977 ',
      secondaryPhone: '',
      whatsappNumber: '',
      emergencyContactName: '',
      emergencyContactRelation: 'Parent',
      emergencyContactPhone: '',

      // Section 3: Address
      permanentProvince: 'Bagmati Province',
      permanentDistrict: 'Kathmandu',
      permanentMunicipality: 'Kathmandu Metropolitan City',
      permanentWardNo: '10',
      permanentTole: 'New Baneshwor',
      permanentPostalCode: '44600',
      permanentCountry: 'Nepal',

      sameAsPermanent: true,
      temporaryProvince: 'Bagmati Province',
      temporaryDistrict: 'Kathmandu',
      temporaryMunicipality: 'Kathmandu Metropolitan City',
      temporaryWardNo: '10',
      temporaryTole: 'New Baneshwor',
      temporaryPostalCode: '44600',
      temporaryCountry: 'Nepal',

      // Section 4: Employment
      joinDateAD: todayStr,
      joinDateBS: adToBs(todayStr).formatted,
      employmentType: 'Full Time' as 'Full Time' | 'Part Time' | 'Contract' | 'Intern' | 'Freelancer',
      department: 'Engineering',
      position: 'Software Engineer',
      employeeLevel: 'Mid' as 'Junior' | 'Mid' | 'Senior' | 'Lead' | 'Director',
      employmentStatus: 'Active' as 'Active' | 'Inactive' | 'Resigned' | 'Terminated' | 'Probation',
      reportingManagerId: existingEmployees[0]?.id || '',
      reportingManagerName: existingEmployees[0]?.name || 'CEO / Operations Head',
      workLocation: 'Office' as 'Office' | 'Remote' | 'Hybrid',
      employeeCategory: 'Technical Staff',

      // Section 5: Salary
      basicSalaryNPR: 65000,
      allowancesNPR: 12000,
      festivalBonusNPR: 65000,
      overtimeRateNPR: 500,
      bankName: 'Nabil Bank Ltd.',
      bankBranch: 'New Baneshwor Branch',
      bankAccountName: '',
      bankAccountNumber: '',
      esewaNumber: '',
      khaltiNumber: '',
      imePayNumber: '',

      // Section 6: Work Details
      workingHours: 8,
      officeShift: 'Day Shift (10:00 AM - 6:00 PM)',
      workingDays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      joiningLetterUrl: '',
      offerLetterUrl: '',
      contractUrl: '',
      ndaUrl: '',

      // Section 7: Skills
      skillTags: ['React', 'Node.js', 'TypeScript', 'PostgreSQL'],
      newSkillInput: '',
      skillLevel: 'Advanced' as 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert',
      programmingLanguages: 'TypeScript, JavaScript, Python',
      frameworks: 'React, Next.js, Express, Tailwind CSS',
      softwareTools: 'VS Code, Git, Figma, Docker, Postman',
      languagesSpoken: 'Nepali, English, Hindi',
      certificates: 'AWS Certified Developer, Agile Scrum Master',
      experienceYears: 3,

      // Section 8: Education
      highestQualification: 'Bachelor of Science in Computer Science (BSc. CSIT)',
      institution: 'Tribhuvan University (TU)',
      graduationYear: 2021,

      // Section 9: Documents
      documents: [
        { id: 'DOC-1', type: 'Citizenship Front', fileName: '', url: '' },
        { id: 'DOC-2', type: 'Citizenship Back', fileName: '', url: '' },
        { id: 'DOC-3', type: 'PAN Card Copy', fileName: '', url: '' },
        { id: 'DOC-4', type: 'Academic Transcript', fileName: '', url: '' },
        { id: 'DOC-5', type: 'CV / Resume', fileName: '', url: '' }
      ] as { id: string; type: string; fileName: string; url: string }[],

      // Section 10: Account
      createAuthAccount: true,
      tempPassword: 'SovryxUser2026!',
      sendWelcomeEmail: true,
      requirePasswordChange: true,
      mfaEnabled: false,

      // Section 11: Permissions
      role: 'Employee' as 'CEO' | 'Admin' | 'HR' | 'Manager' | 'Employee',
      permissionTemplate: 'Standard Employee Role',
      customPermissions: ['View Own Tasks', 'Submit Leave Requests', 'Clock Attendance'],

      // Section 12: Attendance
      attendanceEnabled: true,
      biometricId: `BIO-${Math.floor(1000 + Math.random() * 9000)}`,
      qrAttendance: true,
      gpsAttendance: false,
      officeStartTime: '10:00',
      officeEndTime: '18:00',

      // Section 13: Leave
      annualLeave: 12,
      sickLeave: 12,
      casualLeave: 6,
      festivalLeave: 6,

      // Section 14: Performance
      defaultKPI: 'Deliver 95%+ assigned tasks on schedule with <2% bug rate',
      monthlyGoals: 'Complete onboard training, complete security compliance module',
      trainingPlan: 'Sovryx Engineering Best Practices & Architecture 101',
      probationEndDateAD: initialProbation,
      nextReviewDateAD: initialReview
    };
  });

  // Helper to update name and derived full name
  const updateNameField = (field: 'firstName' | 'middleName' | 'lastName', value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      const full = [updated.firstName, updated.middleName, updated.lastName]
        .filter(Boolean)
        .join(' ')
        .trim();
      return {
        ...updated,
        fullName: full,
        bankAccountName: prev.bankAccountName || full
      };
    });
  };

  // Helper to update DOB and age
  const updateDob = (adStr: string) => {
    const bs = adToBs(adStr);
    const calculatedAge = calculateAgeFromAD(adStr);
    setFormData(prev => ({
      ...prev,
      dobAD: adStr,
      dobBS: bs.formatted,
      age: calculatedAge
    }));
  };

  // Helper to handle permanent address change with same-as-permanent sync
  const updatePermanentAddress = (key: string, value: string) => {
    setFormData(prev => {
      const updatedPerm = { ...prev, [key]: value };
      if (prev.sameAsPermanent) {
        return {
          ...updatedPerm,
          temporaryProvince: key === 'permanentProvince' ? value : prev.temporaryProvince,
          temporaryDistrict: key === 'permanentDistrict' ? value : prev.temporaryDistrict,
          temporaryMunicipality: key === 'permanentMunicipality' ? value : prev.temporaryMunicipality,
          temporaryWardNo: key === 'permanentWardNo' ? value : prev.temporaryWardNo,
          temporaryTole: key === 'permanentTole' ? value : prev.temporaryTole,
          temporaryPostalCode: key === 'permanentPostalCode' ? value : prev.temporaryPostalCode,
          temporaryCountry: key === 'permanentCountry' ? value : prev.temporaryCountry
        };
      }
      return updatedPerm;
    });
  };

  const toggleSameAsPermanent = (checked: boolean) => {
    setFormData(prev => {
      if (checked) {
        return {
          ...prev,
          sameAsPermanent: true,
          temporaryProvince: prev.permanentProvince,
          temporaryDistrict: prev.permanentDistrict,
          temporaryMunicipality: prev.permanentMunicipality,
          temporaryWardNo: prev.permanentWardNo,
          temporaryTole: prev.permanentTole,
          temporaryPostalCode: prev.permanentPostalCode,
          temporaryCountry: prev.permanentCountry
        };
      }
      return { ...prev, sameAsPermanent: false };
    });
  };

  // Auto local save draft
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem('sovryx_add_emp_draft', JSON.stringify(formData));
        setAutoSaveTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      } catch (e) {
        // quota check fallback
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [formData]);

  // Validate current step
  const validateStep = (stepNumber: number) => {
    const errors: Record<string, string> = {};

    if (stepNumber === 1) {
      if (!formData.firstName.trim()) errors.firstName = 'First Name is required.';
      if (!formData.lastName.trim()) errors.lastName = 'Last Name is required.';
      if (!formData.personalEmail.trim() || !formData.personalEmail.includes('@')) {
        errors.personalEmail = 'Valid Personal Email is required.';
      }
      if (!formData.officialEmail.trim() || !formData.officialEmail.includes('@')) {
        errors.officialEmail = 'Valid Company Email is required.';
      } else {
        const dupEmail = existingEmployees.find(
          e => e.email?.toLowerCase() === formData.officialEmail.trim().toLowerCase()
        );
        if (dupEmail) errors.officialEmail = 'Official Email already exists in the system!';
      }

      if (!formData.primaryPhone.trim() || formData.primaryPhone.length < 7) {
        errors.primaryPhone = 'Primary Phone Number is required.';
      } else {
        const dupPhone = existingEmployees.find(e => e.phone === formData.primaryPhone.trim());
        if (dupPhone) errors.primaryPhone = 'Phone Number is registered with another employee!';
      }

      if (!formData.citizenshipNo.trim()) {
        errors.citizenshipNo = 'Citizenship Number is required.';
      } else {
        const dupCit = existingEmployees.find(e => e.citizenshipNo === formData.citizenshipNo.trim());
        if (dupCit) errors.citizenshipNo = 'Citizenship Number already registered!';
      }

      if (formData.panNo.trim() && !/^\d{9}$/.test(formData.panNo.trim())) {
        errors.panNo = 'PAN Number must be exactly 9 digits.';
      }
    }

    if (stepNumber === 2) {
      if (!formData.position.trim()) errors.position = 'Job Position is required.';
      if (!formData.basicSalaryNPR || formData.basicSalaryNPR <= 0) {
        errors.basicSalaryNPR = 'Basic Salary must be greater than 0.';
      }
      if (!formData.bankAccountNumber.trim()) {
        errors.bankAccountNumber = 'Bank Account Number is required.';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(5, prev + 1));
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const handleAddSkillTag = () => {
    if (formData.newSkillInput.trim() && !formData.skillTags.includes(formData.newSkillInput.trim())) {
      setFormData(prev => ({
        ...prev,
        skillTags: [...prev.skillTags, prev.newSkillInput.trim()],
        newSkillInput: ''
      }));
    }
  };

  const handleRemoveSkillTag = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skillTags: prev.skillTags.filter(s => s !== skillToRemove)
    }));
  };

  const handleFileUpload = (docId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      const dataUrl = e.target?.result as string;
      setFormData(prev => ({
        ...prev,
        documents: prev.documents.map(d =>
          d.id === docId ? { ...d, fileName: file.name, url: dataUrl } : d
        )
      }));
    };
    reader.readAsDataURL(file);
  };

  // Submit and Automate Creation
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(1) || !validateStep(2)) {
      alert('Please correct validation errors in previous steps before submitting.');
      return;
    }

    setIsSubmitting(true);

    try {
      const todayISO = new Date().toISOString();
      const generatedUuid = `EMP-UUID-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

      // 1. Create Main Employee Document
      const newEmpPayload: Omit<Employee, 'id'> = {
        employeeId: employeeId,
        name: formData.fullName,
        photo: formData.photoUrl || `https://picsum.photos/seed/${formData.fullName.replace(/\s+/g, '')}/200/200`,
        email: formData.officialEmail,
        phone: formData.primaryPhone,
        position: formData.position,
        department: formData.department,
        salary: Number(formData.basicSalaryNPR) + Number(formData.allowancesNPR),
        joinDate: formData.joinDateAD,
        status: formData.employmentStatus,
        skills: formData.skillTags,
        performanceScore: 88,
        attendanceScore: 100,
        warnings: [],
        documents: formData.documents
          .filter(d => d.url)
          .map(d => ({ id: d.id, name: d.type, url: d.url, date: todayISO.split('T')[0] })),
        notes: [
          {
            id: 'NOTE-1',
            date: todayISO.split('T')[0],
            text: `Registered employee with ${formData.employmentType} contract in ${formData.department} department.`,
            author: 'HR Admin'
          }
        ],
        biography: formData.profileBio || `${formData.fullName} is a ${formData.employeeLevel} ${formData.position} in ${formData.department}.`,
        emergencyContact: {
          name: formData.emergencyContactName || 'Family Member',
          relation: formData.emergencyContactRelation,
          phone: formData.emergencyContactPhone || formData.primaryPhone
        },

        // Extended Nepal Enterprise Fields
        firstName: formData.firstName,
        middleName: formData.middleName,
        lastName: formData.lastName,
        fullName: formData.fullName,
        gender: formData.gender,
        dobAD: formData.dobAD,
        dobBS: formData.dobBS,
        age: formData.age,
        bloodGroup: formData.bloodGroup,
        maritalStatus: formData.maritalStatus,
        nationality: formData.nationality,
        citizenshipNo: formData.citizenshipNo,
        citizenshipDistrict: formData.citizenshipDistrict,
        nationalId: formData.nationalId,
        passportNo: formData.passportNo,
        panNo: formData.panNo,
        religion: formData.religion,

        personalEmail: formData.personalEmail,
        officialEmail: formData.officialEmail,
        primaryPhone: formData.primaryPhone,
        secondaryPhone: formData.secondaryPhone,
        whatsappNumber: formData.whatsappNumber,

        permanentAddress: {
          province: formData.permanentProvince,
          district: formData.permanentDistrict,
          municipality: formData.permanentMunicipality,
          wardNo: formData.permanentWardNo,
          tole: formData.permanentTole,
          postalCode: formData.permanentPostalCode,
          country: formData.permanentCountry
        },

        temporaryAddress: {
          sameAsPermanent: formData.sameAsPermanent,
          province: formData.temporaryProvince,
          district: formData.temporaryDistrict,
          municipality: formData.temporaryMunicipality,
          wardNo: formData.temporaryWardNo,
          tole: formData.temporaryTole,
          postalCode: formData.temporaryPostalCode,
          country: formData.temporaryCountry
        },

        employmentType: formData.employmentType,
        employeeLevel: formData.employeeLevel,
        reportingManagerId: formData.reportingManagerId,
        reportingManagerName: formData.reportingManagerName,
        workLocation: formData.workLocation,
        employeeCategory: formData.employeeCategory,

        basicSalaryNPR: formData.basicSalaryNPR,
        allowancesNPR: formData.allowancesNPR,
        festivalBonusNPR: formData.festivalBonusNPR,
        overtimeRateNPR: formData.overtimeRateNPR,
        bankInfo: {
          bankName: formData.bankName,
          branch: formData.bankBranch,
          accountName: formData.bankAccountName || formData.fullName,
          accountNumber: formData.bankAccountNumber,
          esewaNumber: formData.esewaNumber,
          khaltiNumber: formData.khaltiNumber,
          imePayNumber: formData.imePayNumber
        },

        workDetails: {
          workingHours: formData.workingHours,
          officeShift: formData.officeShift,
          workingDays: formData.workingDays,
          joiningLetterUrl: formData.joiningLetterUrl,
          offerLetterUrl: formData.offerLetterUrl,
          employmentContractUrl: formData.contractUrl,
          ndaUrl: formData.ndaUrl
        },

        skillDetails: {
          skillsList: formData.skillTags.map(s => ({ name: s, level: formData.skillLevel })),
          programmingLanguages: formData.programmingLanguages.split(',').map(s => s.trim()),
          frameworks: formData.frameworks.split(',').map(s => s.trim()),
          softwareTools: formData.softwareTools.split(',').map(s => s.trim()),
          languagesSpoken: formData.languagesSpoken.split(',').map(s => s.trim()),
          certificates: formData.certificates.split(',').map(s => s.trim()),
          trainings: [],
          experienceYears: formData.experienceYears
        },

        educationDetails: {
          highestQualification: formData.highestQualification,
          institution: formData.institution,
          graduationYear: formData.graduationYear
        },

        accountDetails: {
          createAuthAccount: formData.createAuthAccount,
          officialEmail: formData.officialEmail,
          sendWelcomeEmail: formData.sendWelcomeEmail,
          requirePasswordChange: formData.requirePasswordChange,
          mfaEnabled: formData.mfaEnabled
        },

        permissions: {
          role: formData.role,
          template: formData.permissionTemplate,
          customPermissions: formData.customPermissions
        },

        attendanceConfig: {
          enabled: formData.attendanceEnabled,
          biometricId: formData.biometricId,
          qrAttendance: formData.qrAttendance,
          gpsAttendance: formData.gpsAttendance,
          officeStartTime: formData.officeStartTime,
          officeEndTime: formData.officeEndTime
        },

        leaveBalances: {
          annualLeave: formData.annualLeave,
          sickLeave: formData.sickLeave,
          casualLeave: formData.casualLeave,
          festivalLeave: formData.festivalLeave,
          totalRemaining: formData.annualLeave + formData.sickLeave + formData.casualLeave + formData.festivalLeave
        },

        performanceConfig: {
          defaultKPI: formData.defaultKPI,
          monthlyGoals: formData.monthlyGoals.split(',').map(g => g.trim()),
          trainingPlan: formData.trainingPlan,
          probationEndDateAD: formData.probationEndDateAD,
          probationEndDateBS: adToBs(formData.probationEndDateAD).formatted,
          nextReviewDateAD: formData.nextReviewDateAD
        },

        companyId: 'SOVRYX-COMP-01',
        employeeUuid: generatedUuid,
        createdBy: 'Admin User',
        createdAt: todayISO,
        updatedAt: todayISO
      };

      const firestoreEmpId = await createItem('employees', newEmpPayload);

      // 2. Automate Firestore Collections Sync
      await createItem('employeeDocuments', {
        employeeId: firestoreEmpId,
        empCode: employeeId,
        documents: formData.documents.filter(d => d.url)
      });

      await createItem('employeeSkills', {
        employeeId: firestoreEmpId,
        empCode: employeeId,
        skills: formData.skillTags,
        level: formData.skillLevel,
        languages: formData.programmingLanguages
      });

      await createItem('employeeEducation', {
        employeeId: firestoreEmpId,
        qualification: formData.highestQualification,
        institution: formData.institution,
        year: formData.graduationYear
      });

      await createItem('employeeLeave', {
        employeeId: firestoreEmpId,
        empCode: employeeId,
        employeeName: formData.fullName,
        annualLeave: formData.annualLeave,
        sickLeave: formData.sickLeave,
        casualLeave: formData.casualLeave,
        festivalLeave: formData.festivalLeave,
        totalRemaining: formData.annualLeave + formData.sickLeave + formData.casualLeave + formData.festivalLeave,
        fiscalYearBS: adToBs(new Date()).year
      });

      await createItem('employeeAttendance', {
        employeeId: firestoreEmpId,
        empCode: employeeId,
        biometricId: formData.biometricId,
        officeShift: formData.officeShift,
        startTime: formData.officeStartTime,
        endTime: formData.officeEndTime
      });

      await createItem('employeePerformance', {
        employeeId: firestoreEmpId,
        employeeName: formData.fullName,
        defaultKPI: formData.defaultKPI,
        probationEndDate: formData.probationEndDateAD,
        nextReviewDate: formData.nextReviewDateAD,
        overallScore: 88
      });

      await createItem('employeeActivity', {
        employeeId: firestoreEmpId,
        employeeName: formData.fullName,
        action: 'EMPLOYEE_REGISTERED',
        details: `Registered ${formData.fullName} (${employeeId}) with ${formData.role} permissions.`,
        timestamp: todayISO
      });

      await createItem('notifications', {
        title: `New Team Member Onboarded: ${formData.fullName}`,
        message: `${formData.fullName} (${formData.position}) joined the ${formData.department} team today!`,
        type: 'announcement',
        severity: 'info',
        read: false,
        timestamp: todayISO
      });

      localStorage.removeItem('sovryx_add_emp_draft');

      setCreatedEmployeeInfo({
        empId: employeeId,
        fullName: formData.fullName,
        email: formData.officialEmail,
        department: formData.department,
        position: formData.position,
        salary: formatNPR(formData.basicSalaryNPR + formData.allowancesNPR),
        joinDateBS: adToBs(formData.joinDateAD).formatted,
        tempPassword: formData.tempPassword
      });

      setIsSubmitting(false);
      setShowSuccessModal(true);
    } catch (err: any) {
      setIsSubmitting(false);
      alert('Error creating employee: ' + err.message);
    }
  };

  const stepsList = [
    { num: 1, label: '1. Personal & Contact', desc: 'Identity, Dual DOB, Contact & Address' },
    { num: 2, label: '2. Employment & Salary', desc: 'Role, Department, NPR Salary & Bank' },
    { num: 3, label: '3. Skills & Education', desc: 'Technical Stack & Qualifications' },
    { num: 4, label: '4. Docs & Credentials', desc: 'Document Uploads & Firebase Auth' },
    { num: 5, label: '5. Attendance & Review', desc: 'Leave, Shift, KPI & Final Approval' }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl my-auto overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {employeeId}
                </span>
                <span className="text-xs text-slate-400 font-mono">Enterprise HR Registration</span>
                {autoSaveTime && (
                  <span className="text-[10px] text-slate-500 hidden sm:inline">
                    • Auto-Saved {autoSaveTime}
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-extrabold text-white">Add New Employee Profile</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Stepper Progress Bar */}
        <div className="bg-slate-950/60 border-b border-slate-800 px-4 py-3 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[650px] gap-2">
            {stepsList.map(s => {
              const isActive = currentStep === s.num;
              const isCompleted = currentStep > s.num;

              return (
                <button
                  key={s.num}
                  onClick={() => {
                    if (s.num < currentStep || validateStep(currentStep)) {
                      setCurrentStep(s.num);
                    }
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-all ${
                    isActive
                      ? 'bg-indigo-600/20 border border-indigo-500/50 text-white'
                      : isCompleted
                      ? 'bg-slate-800/60 text-emerald-400 hover:bg-slate-800'
                      : 'text-slate-400 hover:bg-slate-800/40'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center font-mono ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/40'
                        : isCompleted
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isCompleted ? <Check className="w-3.5 h-3.5" /> : s.num}
                  </div>
                  <div>
                    <p className="text-xs font-bold leading-none">{s.label}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{s.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="w-full bg-slate-800 h-1 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-indigo-500 h-full transition-all duration-300"
              style={{ width: `${(currentStep / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6 text-xs text-slate-200">
          {/* STEP 1: PERSONAL & CONTACT INFORMATION */}
          {currentStep === 1 && (
            <div className="space-y-6">
              {/* Section 1: Personal Info */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <User className="w-4 h-4 text-indigo-400" />
                  <h3 className="font-bold text-white text-sm">1. Personal Information</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-slate-300 block mb-1">First Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Aayush"
                      value={formData.firstName}
                      onChange={e => updateNameField('firstName', e.target.value)}
                      className={`w-full bg-slate-900 border rounded-xl p-2.5 text-white focus:outline-none ${
                        validationErrors.firstName ? 'border-rose-500' : 'border-slate-800 focus:border-indigo-500'
                      }`}
                    />
                    {validationErrors.firstName && (
                      <p className="text-[10px] text-rose-400 mt-1">{validationErrors.firstName}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-slate-300 block mb-1">Middle Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Raj"
                      value={formData.middleName}
                      onChange={e => updateNameField('middleName', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 block mb-1">Last Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Shrestha"
                      value={formData.lastName}
                      onChange={e => updateNameField('lastName', e.target.value)}
                      className={`w-full bg-slate-900 border rounded-xl p-2.5 text-white focus:outline-none ${
                        validationErrors.lastName ? 'border-rose-500' : 'border-slate-800 focus:border-indigo-500'
                      }`}
                    />
                    {validationErrors.lastName && (
                      <p className="text-[10px] text-rose-400 mt-1">{validationErrors.lastName}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-slate-300 block mb-1">Full Name (Auto)</label>
                    <input
                      type="text"
                      disabled
                      value={formData.fullName}
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl p-2.5 text-indigo-300 font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 block mb-1">Gender</label>
                    <select
                      value={formData.gender}
                      onChange={e => setFormData({ ...formData, gender: e.target.value as any })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-300 block mb-1">Date of Birth (BS & AD)</label>
                    <NepaliDatePicker
                      value={formData.dobAD}
                      onChange={val => updateDob(val)}
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 block mb-1">Calculated Age</label>
                    <input
                      type="number"
                      disabled
                      value={formData.age}
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl p-2.5 text-emerald-400 font-bold font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-slate-300 block mb-1">Blood Group</label>
                    <select
                      value={formData.bloodGroup}
                      onChange={e => setFormData({ ...formData, bloodGroup: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                    >
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-300 block mb-1">Marital Status</label>
                    <select
                      value={formData.maritalStatus}
                      onChange={e => setFormData({ ...formData, maritalStatus: e.target.value as any })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                    >
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Divorced">Divorced</option>
                      <option value="Widowed">Widowed</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-300 block mb-1">Citizenship Number *</label>
                    <input
                      type="text"
                      placeholder="e.g. 27-01-78-04921"
                      value={formData.citizenshipNo}
                      onChange={e => setFormData({ ...formData, citizenshipNo: e.target.value })}
                      className={`w-full bg-slate-900 border rounded-xl p-2.5 text-white focus:outline-none font-mono ${
                        validationErrors.citizenshipNo ? 'border-rose-500' : 'border-slate-800'
                      }`}
                    />
                    {validationErrors.citizenshipNo && (
                      <p className="text-[10px] text-rose-400 mt-1">{validationErrors.citizenshipNo}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-slate-300 block mb-1">Citizenship District</label>
                    <select
                      value={formData.citizenshipDistrict}
                      onChange={e => setFormData({ ...formData, citizenshipDistrict: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                    >
                      {NEPAL_DISTRICTS.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-slate-300 block mb-1">PAN Number (9 Digits)</label>
                    <input
                      type="text"
                      maxLength={9}
                      placeholder="e.g. 109847291"
                      value={formData.panNo}
                      onChange={e => setFormData({ ...formData, panNo: e.target.value })}
                      className={`w-full bg-slate-900 border rounded-xl p-2.5 text-white focus:outline-none font-mono ${
                        validationErrors.panNo ? 'border-rose-500' : 'border-slate-800'
                      }`}
                    />
                    {validationErrors.panNo && (
                      <p className="text-[10px] text-rose-400 mt-1">{validationErrors.panNo}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-slate-300 block mb-1">Passport Number (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. 11984201"
                      value={formData.passportNo}
                      onChange={e => setFormData({ ...formData, passportNo: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 block mb-1">Nationality</label>
                    <input
                      type="text"
                      value={formData.nationality}
                      onChange={e => setFormData({ ...formData, nationality: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Contact Info */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <Mail className="w-4 h-4 text-indigo-400" />
                  <h3 className="font-bold text-white text-sm">2. Contact Information</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-300 block mb-1">Official Company Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. aayush@sovryx.com"
                      value={formData.officialEmail}
                      onChange={e => setFormData({ ...formData, officialEmail: e.target.value })}
                      className={`w-full bg-slate-900 border rounded-xl p-2.5 text-white focus:outline-none ${
                        validationErrors.officialEmail ? 'border-rose-500' : 'border-slate-800'
                      }`}
                    />
                    {validationErrors.officialEmail && (
                      <p className="text-[10px] text-rose-400 mt-1">{validationErrors.officialEmail}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-slate-300 block mb-1">Personal Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. aayush.personal@gmail.com"
                      value={formData.personalEmail}
                      onChange={e => setFormData({ ...formData, personalEmail: e.target.value })}
                      className={`w-full bg-slate-900 border rounded-xl p-2.5 text-white focus:outline-none ${
                        validationErrors.personalEmail ? 'border-rose-500' : 'border-slate-800'
                      }`}
                    />
                    {validationErrors.personalEmail && (
                      <p className="text-[10px] text-rose-400 mt-1">{validationErrors.personalEmail}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-slate-300 block mb-1">Primary Phone Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. +977 9841234567"
                      value={formData.primaryPhone}
                      onChange={e => setFormData({ ...formData, primaryPhone: e.target.value })}
                      className={`w-full bg-slate-900 border rounded-xl p-2.5 text-white focus:outline-none font-mono ${
                        validationErrors.primaryPhone ? 'border-rose-500' : 'border-slate-800'
                      }`}
                    />
                    {validationErrors.primaryPhone && (
                      <p className="text-[10px] text-rose-400 mt-1">{validationErrors.primaryPhone}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-slate-300 block mb-1">Secondary Phone</label>
                    <input
                      type="text"
                      placeholder="e.g. +977 01-4412345"
                      value={formData.secondaryPhone}
                      onChange={e => setFormData({ ...formData, secondaryPhone: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 block mb-1">WhatsApp Number</label>
                    <input
                      type="text"
                      placeholder="e.g. +977 9841234567"
                      value={formData.whatsappNumber}
                      onChange={e => setFormData({ ...formData, whatsappNumber: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-3">
                  <span className="text-xs font-bold text-amber-400 block">Emergency Contact</span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-slate-400 block mb-1">Contact Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Ramesh Shrestha"
                        value={formData.emergencyContactName}
                        onChange={e => setFormData({ ...formData, emergencyContactName: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Relationship</label>
                      <input
                        type="text"
                        placeholder="e.g. Father / Spouse"
                        value={formData.emergencyContactRelation}
                        onChange={e => setFormData({ ...formData, emergencyContactRelation: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Emergency Phone</label>
                      <input
                        type="text"
                        placeholder="e.g. +977 9801234567"
                        value={formData.emergencyContactPhone}
                        onChange={e => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Permanent & Temporary Address */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <MapPin className="w-4 h-4 text-indigo-400" />
                  <h3 className="font-bold text-white text-sm">3. Permanent & Temporary Address</h3>
                </div>

                <div className="space-y-3">
                  <span className="text-xs font-bold text-indigo-300 block">Permanent Address</span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-slate-400 block mb-1">Province</label>
                      <select
                        value={formData.permanentProvince}
                        onChange={e => updatePermanentAddress('permanentProvince', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white"
                      >
                        {NEPAL_PROVINCES.map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1">District</label>
                      <select
                        value={formData.permanentDistrict}
                        onChange={e => updatePermanentAddress('permanentDistrict', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white"
                      >
                        {NEPAL_DISTRICTS.map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1">Municipality / Local Body</label>
                      <input
                        type="text"
                        value={formData.permanentMunicipality}
                        onChange={e => updatePermanentAddress('permanentMunicipality', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-slate-400 block mb-1">Ward No.</label>
                      <input
                        type="text"
                        value={formData.permanentWardNo}
                        onChange={e => updatePermanentAddress('permanentWardNo', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1">Tole / Area Name</label>
                      <input
                        type="text"
                        value={formData.permanentTole}
                        onChange={e => updatePermanentAddress('permanentTole', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1">Postal Code</label>
                      <input
                        type="text"
                        value={formData.permanentPostalCode}
                        onChange={e => updatePermanentAddress('permanentPostalCode', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="sameAddr"
                    checked={formData.sameAsPermanent}
                    onChange={e => toggleSameAsPermanent(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-800 focus:ring-0"
                  />
                  <label htmlFor="sameAddr" className="text-xs text-indigo-300 font-bold cursor-pointer">
                    Temporary Address is same as Permanent Address
                  </label>
                </div>

                {!formData.sameAsPermanent && (
                  <div className="space-y-3 pt-2">
                    <span className="text-xs font-bold text-amber-300 block">Temporary Address</span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="text-slate-400 block mb-1">Province</label>
                        <select
                          value={formData.temporaryProvince}
                          onChange={e => setFormData({ ...formData, temporaryProvince: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white"
                        >
                          {NEPAL_PROVINCES.map(p => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-slate-400 block mb-1">District</label>
                        <select
                          value={formData.temporaryDistrict}
                          onChange={e => setFormData({ ...formData, temporaryDistrict: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white"
                        >
                          {NEPAL_DISTRICTS.map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-slate-400 block mb-1">Tole / Municipality</label>
                        <input
                          type="text"
                          value={formData.temporaryTole}
                          onChange={e => setFormData({ ...formData, temporaryTole: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: EMPLOYMENT, SALARY & BANKING */}
          {currentStep === 2 && (
            <div className="space-y-6">
              {/* Section 4: Employment Details */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <Briefcase className="w-4 h-4 text-indigo-400" />
                  <h3 className="font-bold text-white text-sm">4. Employment Details</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-slate-300 block mb-1">Joining Date (BS / AD)</label>
                    <NepaliDatePicker
                      value={formData.joinDateAD}
                      onChange={val => {
                        const bs = adToBs(val);
                        setFormData({ ...formData, joinDateAD: val, joinDateBS: bs.formatted });
                      }}
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 block mb-1">Department</label>
                    <select
                      value={formData.department}
                      onChange={e => setFormData({ ...formData, department: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                    >
                      <option value="Engineering">Engineering</option>
                      <option value="HR & People Operations">HR & People Operations</option>
                      <option value="Sales & Marketing">Sales & Marketing</option>
                      <option value="Finance & Accounts">Finance & Accounts</option>
                      <option value="Operations">Operations</option>
                      <option value="Product & Design">Product & Design</option>
                      <option value="Legal & Compliance">Legal & Compliance</option>
                      <option value="Customer Success">Customer Success</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-300 block mb-1">Position / Job Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Senior Fullstack Developer"
                      value={formData.position}
                      onChange={e => setFormData({ ...formData, position: e.target.value })}
                      className={`w-full bg-slate-900 border rounded-xl p-2.5 text-white focus:outline-none ${
                        validationErrors.position ? 'border-rose-500' : 'border-slate-800'
                      }`}
                    />
                    {validationErrors.position && (
                      <p className="text-[10px] text-rose-400 mt-1">{validationErrors.position}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-slate-300 block mb-1">Employment Type</label>
                    <select
                      value={formData.employmentType}
                      onChange={e => setFormData({ ...formData, employmentType: e.target.value as any })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                    >
                      <option value="Full Time">Full Time</option>
                      <option value="Part Time">Part Time</option>
                      <option value="Contract">Contract</option>
                      <option value="Intern">Intern</option>
                      <option value="Freelancer">Freelancer</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-300 block mb-1">Employee Level</label>
                    <select
                      value={formData.employeeLevel}
                      onChange={e => setFormData({ ...formData, employeeLevel: e.target.value as any })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                    >
                      <option value="Junior">Junior</option>
                      <option value="Mid">Mid</option>
                      <option value="Senior">Senior</option>
                      <option value="Lead">Lead</option>
                      <option value="Director">Director</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-300 block mb-1">Employment Status</label>
                    <select
                      value={formData.employmentStatus}
                      onChange={e => setFormData({ ...formData, employmentStatus: e.target.value as any })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                    >
                      <option value="Active">Active</option>
                      <option value="Probation">Probation</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-300 block mb-1">Work Location</label>
                    <select
                      value={formData.workLocation}
                      onChange={e => setFormData({ ...formData, workLocation: e.target.value as any })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                    >
                      <option value="Office">Office</option>
                      <option value="Remote">Remote</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 5: Salary & Payment Details (NPR) */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-bold text-white text-sm">5. Salary & Bank Account Information (NPR)</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-slate-300 block mb-1">Monthly Basic Salary (NPR) *</label>
                    <input
                      type="number"
                      required
                      value={formData.basicSalaryNPR}
                      onChange={e => setFormData({ ...formData, basicSalaryNPR: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white font-mono text-sm focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 block mb-1">Monthly Allowances (NPR)</label>
                    <input
                      type="number"
                      value={formData.allowancesNPR}
                      onChange={e => setFormData({ ...formData, allowancesNPR: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white font-mono text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 block mb-1">Festival Bonus (Dashain NPR)</label>
                    <input
                      type="number"
                      value={formData.festivalBonusNPR}
                      onChange={e => setFormData({ ...formData, festivalBonusNPR: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white font-mono text-sm"
                    />
                  </div>
                </div>

                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Total Monthly Gross Package</span>
                  <span className="text-base font-black text-emerald-400">
                    {formatNPR(formData.basicSalaryNPR + formData.allowancesNPR)}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-slate-300 block mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={formData.bankName}
                      onChange={e => setFormData({ ...formData, bankName: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 block mb-1">Bank Branch</label>
                    <input
                      type="text"
                      value={formData.bankBranch}
                      onChange={e => setFormData({ ...formData, bankBranch: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 block mb-1">Bank Account Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 0100017500123"
                      value={formData.bankAccountNumber}
                      onChange={e => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                      className={`w-full bg-slate-900 border rounded-xl p-2.5 text-white font-mono ${
                        validationErrors.bankAccountNumber ? 'border-rose-500' : 'border-slate-800'
                      }`}
                    />
                    {validationErrors.bankAccountNumber && (
                      <p className="text-[10px] text-rose-400 mt-1">{validationErrors.bankAccountNumber}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-slate-300 block mb-1">eSewa Number</label>
                    <input
                      type="text"
                      placeholder="e.g. 9841234567"
                      value={formData.esewaNumber}
                      onChange={e => setFormData({ ...formData, esewaNumber: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 block mb-1">Khalti Number</label>
                    <input
                      type="text"
                      placeholder="e.g. 9841234567"
                      value={formData.khaltiNumber}
                      onChange={e => setFormData({ ...formData, khaltiNumber: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 block mb-1">IME Pay Number</label>
                    <input
                      type="text"
                      placeholder="e.g. 9841234567"
                      value={formData.imePayNumber}
                      onChange={e => setFormData({ ...formData, imePayNumber: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Section 6: Work Schedule */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  <h3 className="font-bold text-white text-sm">6. Work Schedule & Shift Details</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-slate-300 block mb-1">Shift Schedule</label>
                    <input
                      type="text"
                      value={formData.officeShift}
                      onChange={e => setFormData({ ...formData, officeShift: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 block mb-1">Daily Work Hours</label>
                    <input
                      type="number"
                      value={formData.workingHours}
                      onChange={e => setFormData({ ...formData, workingHours: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 block mb-1">Overtime Hourly Rate (NPR)</label>
                    <input
                      type="number"
                      value={formData.overtimeRateNPR}
                      onChange={e => setFormData({ ...formData, overtimeRateNPR: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: SKILLS & EDUCATION */}
          {currentStep === 3 && (
            <div className="space-y-6">
              {/* Section 7: Skills */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <Award className="w-4 h-4 text-indigo-400" />
                  <h3 className="font-bold text-white text-sm">7. Skills & Expertise Stack</h3>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1">Add Key Skills Tags</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="e.g. React, Next.js, Docker, Python"
                      value={formData.newSkillInput}
                      onChange={e => setFormData({ ...formData, newSkillInput: e.target.value })}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSkillTag();
                        }
                      }}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                    />
                    <button
                      type="button"
                      onClick={handleAddSkillTag}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold"
                    >
                      Add Tag
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 p-3 bg-slate-900 rounded-xl border border-slate-800 min-h-[44px]">
                    {formData.skillTags.map(st => (
                      <span
                        key={st}
                        className="px-2.5 py-1 rounded-lg bg-indigo-950 text-indigo-300 border border-indigo-800/60 text-xs font-semibold flex items-center gap-1"
                      >
                        {st}
                        <button onClick={() => handleRemoveSkillTag(st)} className="text-indigo-400 hover:text-white">✕</button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-300 block mb-1">Programming Languages</label>
                    <input
                      type="text"
                      value={formData.programmingLanguages}
                      onChange={e => setFormData({ ...formData, programmingLanguages: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 block mb-1">Frameworks & Libraries</label>
                    <input
                      type="text"
                      value={formData.frameworks}
                      onChange={e => setFormData({ ...formData, frameworks: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-slate-300 block mb-1">Software & Tools</label>
                    <input
                      type="text"
                      value={formData.softwareTools}
                      onChange={e => setFormData({ ...formData, softwareTools: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 block mb-1">Languages Spoken</label>
                    <input
                      type="text"
                      value={formData.languagesSpoken}
                      onChange={e => setFormData({ ...formData, languagesSpoken: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 block mb-1">Experience (Years)</label>
                    <input
                      type="number"
                      value={formData.experienceYears}
                      onChange={e => setFormData({ ...formData, experienceYears: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Section 8: Education */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <GraduationCap className="w-4 h-4 text-indigo-400" />
                  <h3 className="font-bold text-white text-sm">8. Academic Qualifications</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-slate-300 block mb-1">Highest Degree / Qualification</label>
                    <input
                      type="text"
                      value={formData.highestQualification}
                      onChange={e => setFormData({ ...formData, highestQualification: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 block mb-1">School / College / University</label>
                    <input
                      type="text"
                      value={formData.institution}
                      onChange={e => setFormData({ ...formData, institution: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 block mb-1">Graduation Year</label>
                    <input
                      type="number"
                      value={formData.graduationYear}
                      onChange={e => setFormData({ ...formData, graduationYear: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: DOCUMENTS & FIREBASE AUTH ACCOUNT */}
          {currentStep === 4 && (
            <div className="space-y-6">
              {/* Section 9: Document Uploads */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <UploadCloud className="w-4 h-4 text-indigo-400" />
                  <h3 className="font-bold text-white text-sm">9. Document Uploads (Firebase Storage)</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {formData.documents.map(docItem => (
                    <div key={docItem.id} className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{docItem.type}</span>
                        {docItem.fileName ? (
                          <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                            <FileCheck className="w-3 h-3" /> Attached
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500">Pending</span>
                        )}
                      </div>

                      <div className="relative border border-dashed border-slate-700 hover:border-indigo-500 rounded-xl p-3 text-center transition-colors">
                        <input
                          type="file"
                          accept="image/*,.pdf,.doc,.docx"
                          onChange={e => {
                            if (e.target.files && e.target.files[0]) {
                              handleFileUpload(docItem.id, e.target.files[0]);
                            }
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        <div className="space-y-1">
                          <UploadCloud className="w-5 h-5 text-indigo-400 mx-auto" />
                          <p className="text-[11px] text-slate-300">
                            {docItem.fileName || 'Click or Drag & Drop File'}
                          </p>
                          <p className="text-[9px] text-slate-500">PNG, JPG, PDF up to 10MB</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 10: Firebase Authentication Account */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <Key className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-bold text-white text-sm">10. Firebase Authentication Account</h3>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <input
                    type="checkbox"
                    id="authCheck"
                    checked={formData.createAuthAccount}
                    onChange={e => setFormData({ ...formData, createAuthAccount: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 bg-slate-950 border-slate-800"
                  />
                  <label htmlFor="authCheck" className="text-xs text-white font-bold cursor-pointer">
                    Provision Firebase Auth User Account for {formData.officialEmail}
                  </label>
                </div>

                {formData.createAuthAccount && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-slate-300 block mb-1">Temporary Login Password</label>
                      <input
                        type="text"
                        value={formData.tempPassword}
                        onChange={e => setFormData({ ...formData, tempPassword: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                      />
                    </div>

                    <div className="space-y-2 pt-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="reqPwd"
                          checked={formData.requirePasswordChange}
                          onChange={e => setFormData({ ...formData, requirePasswordChange: e.target.checked })}
                          className="w-4 h-4 rounded text-indigo-600 bg-slate-950 border-slate-800"
                        />
                        <label htmlFor="reqPwd" className="text-xs text-slate-300">
                          Require password change upon first login
                        </label>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="sendWelcome"
                          checked={formData.sendWelcomeEmail}
                          onChange={e => setFormData({ ...formData, sendWelcomeEmail: e.target.checked })}
                          className="w-4 h-4 rounded text-indigo-600 bg-slate-950 border-slate-800"
                        />
                        <label htmlFor="sendWelcome" className="text-xs text-slate-300">
                          Send automated welcome email with login details
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Section 11: Permissions & RBAC */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <Shield className="w-4 h-4 text-indigo-400" />
                  <h3 className="font-bold text-white text-sm">11. Role & System Permissions</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-300 block mb-1">System Role</label>
                    <select
                      value={formData.role}
                      onChange={e => setFormData({ ...formData, role: e.target.value as any })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                    >
                      <option value="Employee">Employee (Self-Service Portal)</option>
                      <option value="Manager">Manager (Team Approval & Metrics)</option>
                      <option value="HR">HR Admin (Full People Operations)</option>
                      <option value="Admin">System Admin</option>
                      <option value="CEO">CEO / Executive Board</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-300 block mb-1">Permission Template</label>
                    <input
                      type="text"
                      value={formData.permissionTemplate}
                      onChange={e => setFormData({ ...formData, permissionTemplate: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: ATTENDANCE, LEAVE, PERFORMANCE & REVIEW */}
          {currentStep === 5 && (
            <div className="space-y-6">
              {/* Section 12 & 13: Attendance & Leave */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                    <Clock className="w-4 h-4 text-indigo-400" />
                    <h3 className="font-bold text-white text-xs uppercase">12. Attendance Config</h3>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Biometric ID:</span>
                      <span className="font-mono text-white font-bold">{formData.biometricId}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">QR Attendance:</span>
                      <span className="text-emerald-400 font-bold">Enabled</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Office Hours:</span>
                      <span className="text-indigo-300 font-mono">
                        {formData.officeStartTime} - {formData.officeEndTime}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                    <Calendar className="w-4 h-4 text-emerald-400" />
                    <h3 className="font-bold text-white text-xs uppercase">13. Annual Leave Balances</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Annual Leave</span>
                      <span className="font-bold text-white">{formData.annualLeave} Days</span>
                    </div>
                    <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Sick Leave</span>
                      <span className="font-bold text-white">{formData.sickLeave} Days</span>
                    </div>
                    <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Casual Leave</span>
                      <span className="font-bold text-white">{formData.casualLeave} Days</span>
                    </div>
                    <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Festival Leave</span>
                      <span className="font-bold text-white">{formData.festivalLeave} Days</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 14: Performance & Probation */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <Target className="w-4 h-4 text-amber-400" />
                  <h3 className="font-bold text-white text-sm">14. Performance Targets & Probation</h3>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1">Default KPI Expectations</label>
                  <textarea
                    rows={2}
                    value={formData.defaultKPI}
                    onChange={e => setFormData({ ...formData, defaultKPI: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-300 block mb-1">Probation End Date</label>
                    <input
                      type="date"
                      value={formData.probationEndDateAD}
                      onChange={e => setFormData({ ...formData, probationEndDateAD: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 block mb-1">First Performance Review Date</label>
                    <input
                      type="date"
                      value={formData.nextReviewDateAD}
                      onChange={e => setFormData({ ...formData, nextReviewDateAD: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Section 15: Final Review & Automations Checklist */}
              <div className="bg-gradient-to-r from-indigo-950/40 to-slate-950 p-4 rounded-xl border border-indigo-800/40 space-y-3">
                <div className="flex items-center gap-2 border-b border-indigo-800/60 pb-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <h3 className="font-bold text-white text-sm">15. Registration Summary & Automated Actions</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Employee ID</span>
                    <span className="font-extrabold text-emerald-400 text-sm font-mono">{employeeId}</span>
                  </div>
                  <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Full Name</span>
                    <span className="font-extrabold text-white text-sm">{formData.fullName}</span>
                  </div>
                  <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Monthly Salary</span>
                    <span className="font-extrabold text-indigo-300 text-sm font-mono">
                      {formatNPR(formData.basicSalaryNPR + formData.allowancesNPR)}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-indigo-300 block">Automatic Operations upon Submission:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Create Employee Profile (`employees`)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Provision Firebase Auth Account</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Sync `employeeDocuments` & `employeeSkills`</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Assign Leave Quotas (`employeeLeave`)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Setup Biometric Attendance (`employeeAttendance`)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Log Activity & Welcome Announcement</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Controls */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={handlePrevStep}
            disabled={currentStep === 1 || isSubmitting}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold disabled:opacity-40 flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 text-xs font-semibold"
            >
              Cancel
            </button>

            {currentStep < 5 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-1"
              >
                Next Step <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Provisioning Employee...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Complete Registration
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Success Celebration Modal */}
      {showSuccessModal && createdEmployeeInfo && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 text-center shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {createdEmployeeInfo.empId} REGISTERED
              </span>
              <h3 className="text-xl font-black text-white mt-2">{createdEmployeeInfo.fullName}</h3>
              <p className="text-xs text-slate-400">{createdEmployeeInfo.position} • {createdEmployeeInfo.department}</p>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-left text-xs space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Official Email:</span>
                <span className="text-indigo-300 font-bold">{createdEmployeeInfo.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Gross Salary:</span>
                <span className="text-emerald-400 font-bold">{createdEmployeeInfo.salary}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Join Date BS:</span>
                <span className="text-white font-bold">{createdEmployeeInfo.joinDateBS}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Temp Password:</span>
                <span className="text-amber-400 font-bold">{createdEmployeeInfo.tempPassword}</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  onSuccess();
                }}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30"
              >
                Go to Employee Directory
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
