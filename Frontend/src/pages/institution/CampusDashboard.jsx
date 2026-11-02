import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  Award,
  AlertTriangle,
  Briefcase,
  GraduationCap,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Search,
  Bell,
  Sun,
  Moon,
  ChevronDown,
  ChevronRight,
  LogOut,
  ArrowLeft,
  ArrowRight,
  Home,
  BarChart2,
  ShieldAlert,
  Star,
  FileText,
  Target,
  Settings,
  X,
  Download,
  Filter,
  CheckCircle,
  Eye,
  Sliders,
  Send,
  Compass,
  UserPlus,
  ShieldCheck,
  CheckCircle2,
  Activity,
  Layers,
  HelpCircle,
  RefreshCw,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import BrandLogo from '../../components/common/BrandLogo';
import StudentAvatar from '../../components/common/StudentAvatar';
import { useAuth } from '../../context/AuthContext';
import {
  MOCK_STUDENTS,
  SUCCESS_TREND_DATA,
  DISTRIBUTION_DATA,
  DEPARTMENT_SCORES,
} from '../../data/mockStudents';
import StudentDigitalTwin from '../../components/analytics/StudentDigitalTwin';
import api from '../../services/api';

/**
 * CODEBUFFET — Central Executive Administrator & Institutional Analytics Dashboard
 * 
 * Master Release Features:
 * 1. Canonical Student-Data Architecture (Reconciled 8 Registrar Profiles vs 50,000 Kaggle Benchmark Telemetry)
 * 2. Differentiator 1: Student Success Digital Twin (3D Campus Hotspots + 3D Coordinate Space + 2D Matrix Fallback)
 * 3. Differentiator 2: Decoupled Risk Intelligence (2-Axis Risk Quadrant: Academic vs Placement)
 * 4. Differentiator 3: Intervention Impact Simulator (Live Cohort Scenario Modeling with Institutional ROI)
 * 5. Differentiator 4: Explainable Student Success Score (0-100 across 6 Weighted Dimensions + Data Completeness)
 * 6. Differentiator 5: Guided At-Risk Recovery Demonstration (Interactive 5-Step Evaluator Walkthrough)
 * 7. Faculty Mentorship Governance (3 Institutional Faculty Mentors with Real Student Assignments)
 * 8. Audited ML Model Intelligence & Checksum Transparency (LightGBM Placement vs Deterministic Academic Engine)
 */
export default function CampusDashboard() {
  const { currentUser, logout, loginWithDemo } = useAuth();
  const navigate = useNavigate();

  // Navigation & Theme
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Digital Twin Sub-Mode ('spatial-3d' | 'coordinate-3d' | 'matrix-2d')
  const [digitalTwinMode, setDigitalTwinMode] = useState('scatter-2d');

  // Roster Switcher: 'all' | 'verified_profile' | 'anonymous_cohort'
  const [recordTypeFilter, setRecordTypeFilter] = useState('all');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [academicRiskFilter, setAcademicRiskFilter] = useState('ALL');
  const [placementRiskFilter, setPlacementRiskFilter] = useState('ALL');
  const [mentorFilter, setMentorFilter] = useState('ALL');
  const [attendanceRangeFilter, setAttendanceRangeFilter] = useState('ALL');

  // Server-side Pagination & Sorting
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortBy, setSortBy] = useState('success_score');
  const [sortOrder, setSortOrder] = useState('desc');
  const [totalRecords, setTotalRecords] = useState(50008);
  const [totalPages, setTotalPages] = useState(2001);
  const [rosterCounts, setRosterCounts] = useState({
    verified_profiles: 8,
    anonymous_cohort: 50000,
    total_records: 50008,
  });

  // Digital Twin Telemetry State (Complete 50,008 Student Records & Database Aggregations)
  const [digitalTwinStudents, setDigitalTwinStudents] = useState([]);
  const [digitalTwinAggregations, setDigitalTwinAggregations] = useState(null);
  const [isLoadingDigitalTwin, setIsLoadingDigitalTwin] = useState(false);

  // Live Backend Data States
  const [summaryData, setSummaryData] = useState({
    total_students: 50008,
    verified_students_count: 8,
    cohort_records_count: 50000,
    total_accessible_records: 50008,
    avg_success_score: 72.6,
    cohort_avg_success_score: 67.8,
    at_risk_count: 2,
    at_risk_pct: 25.0,
    placement_readiness_pct: 50.0,
    placement_ready_count: 4,
    attendance_shortage_count: 1,
    active_mentors_count: 3,
    open_interventions_count: 9,
    reconciliation: {
      verified_profiles: 8,
      anonymous_cohort: 50000,
      total_database_records: 50008,
    },
    data_source: 'CODEBUFFET Multi-Tier Telemetry Engine',
  });
  const [departmentData, setDepartmentData] = useState(DEPARTMENT_SCORES);
  const [cohortStudents, setCohortStudents] = useState([]);
  const [mentorsList, setMentorsList] = useState([]);
  const [modelStatus, setModelStatus] = useState(null);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isLiveApi, setIsLiveApi] = useState(false);

  // Selected Student for 360-Degree Detail Drawer
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Modals
  const [addStudentModalOpen, setAddStudentModalOpen] = useState(false);
  const [addFacultyModalOpen, setAddFacultyModalOpen] = useState(false);
  const [addPlacementOfficerModalOpen, setAddPlacementOfficerModalOpen] = useState(false);
  const [campus3DModalOpen, setCampus3DModalOpen] = useState(false);
  const [aiCopilotOpen, setAiCopilotOpen] = useState(false);
  const [interventionModalOpen, setInterventionModalOpen] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Guided Walkthrough State (Differentiator 5)
  const [walkthroughActive, setWalkthroughActive] = useState(false);
  const [walkthroughStep, setWalkthroughStep] = useState(1);

  // Cohort Simulator State (Differentiator 3)
  const [simAttendanceBoost, setSimAttendanceBoost] = useState(10.0);
  const [simDsaBoost, setSimDsaBoost] = useState(1.5);
  const [simLmsBoost, setSimLmsBoost] = useState(15.0);
  const [simMentorCapacity, setSimMentorCapacity] = useState(40);
  const [simResults, setSimResults] = useState({
    total_analyzed: 1000,
    students_rescued_count: 58,
    baseline_high_academic_risk: 184,
    projected_high_academic_risk: 132,
    baseline_high_placement_risk: 220,
    projected_high_placement_risk: 156,
    score_improvement: 4.8,
    readiness_improvement_pct: 12.4,
    roi_summary: 'Simulated intervention rescues 58 high-risk students, elevating placement readiness by +12.4%.',
  });
  const [isSimulating, setIsSimulating] = useState(false);

  // New Student Enrollment Form State
  const [newStudentRoll, setNewStudentRoll] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentDept, setNewStudentDept] = useState('Computer Science & Engineering');
  const [newStudentCgpa, setNewStudentCgpa] = useState('7.8');
  const [newStudentAtt, setNewStudentAtt] = useState('85.0');
  const [newStudentBacklogs, setNewStudentBacklogs] = useState('0');
  const [newStudentMentor, setNewStudentMentor] = useState('Prof. Rajesh Kumar');
  const [enrollSubmitting, setEnrollSubmitting] = useState(false);
  const [enrollNotice, setEnrollNotice] = useState('');

  // Faculty/Mentor Enrollment Form State
  const [facultyStaffId, setFacultyStaffId] = useState('');
  const [facultyFirstName, setFacultyFirstName] = useState('');
  const [facultyLastName, setFacultyLastName] = useState('');
  const [facultyEmail, setFacultyEmail] = useState('');
  const [facultyDept, setFacultyDept] = useState('Computer Science & Engineering');
  const [facultyDesignation, setFacultyDesignation] = useState('Assistant Professor');
  const [facultyPhone, setFacultyPhone] = useState('');
  const [facultyStatus, setFacultyStatus] = useState('ACTIVE');
  const [facultySubmitting, setFacultySubmitting] = useState(false);

  // Placement Officer Enrollment Form State
  const [tpoStaffId, setTpoStaffId] = useState('');
  const [tpoFirstName, setTpoFirstName] = useState('');
  const [tpoLastName, setTpoLastName] = useState('');
  const [tpoEmail, setTpoEmail] = useState('');
  const [tpoDept, setTpoDept] = useState('Career & Corporate Relations');
  const [tpoDesignation, setTpoDesignation] = useState('Placement Officer');
  const [tpoPhone, setTpoPhone] = useState('');
  const [tpoStatus, setTpoStatus] = useState('ACTIVE');
  const [tpoSubmitting, setTpoSubmitting] = useState(false);

  // Account Approval Workflow State
  const [approvalsList, setApprovalsList] = useState([]);
  const [approvalsCounts, setApprovalsCounts] = useState({
    total_pending: 0,
    pending_faculty: 0,
    pending_admin: 0,
    pending_tpo: 0,
    total_active: 0,
    total_rejected: 0,
  });
  const [approvalTab, setApprovalTab] = useState('ALL_PENDING'); // 'ALL_PENDING' | 'mentor' | 'admin' | 'tpo' | 'HISTORICAL'
  const [approvalSearch, setApprovalSearch] = useState('');
  const [isLoadingApprovals, setIsLoadingApprovals] = useState(false);
  const [approvalActionLoadingId, setApprovalActionLoadingId] = useState(null);
  const [approvalToast, setApprovalToast] = useState(null);
  const [approvalError, setApprovalError] = useState(null);

  // Filtered approvals list based on approvalSearch (safely declared after approvalsList & approvalSearch)
  const filteredApprovals = useMemo(() => {
    if (!Array.isArray(approvalsList)) return [];
    return approvalsList.filter((app) => {
      if (!app) return false;
      if (!approvalSearch) return true;
      const q = approvalSearch.toLowerCase();
      return (
        (app.full_name && app.full_name.toLowerCase().includes(q)) ||
        (app.email && app.email.toLowerCase().includes(q)) ||
        (app.roll_no && app.roll_no.toLowerCase().includes(q)) ||
        (app.department && app.department.toLowerCase().includes(q))
      );
    });
  }, [approvalsList, approvalSearch]);

  // Load account approvals
  const loadApprovals = async (statusFilter = 'PENDING_APPROVAL', roleFilter = '') => {
    setIsLoadingApprovals(true);
    setApprovalError(null);
    try {
      const data = await api.getPendingApprovals(statusFilter, roleFilter);
      if (data?.success) {
        setApprovalsList(Array.isArray(data.approvals) ? data.approvals : []);
        if (data.counts) {
          setApprovalsCounts(data.counts);
        }
      } else {
        const msg = data?.detail || 'Unable to retrieve pending approvals from server.';
        setApprovalError(msg);
      }
    } catch (err) {
      console.warn('Could not load account approvals:', err.message);
      setApprovalError(err.message || 'Unable to connect to CODEBUFFET backend service.');
    } finally {
      setIsLoadingApprovals(false);
    }
  };

  const handleApprovalAction = async (userId, action, applicantName) => {
    setApprovalActionLoadingId(userId);
    try {
      const res = await api.processAccountApproval(userId, action);
      if (res?.success) {
        setApprovalToast({
          type: action === 'APPROVE' ? 'success' : 'info',
          message: res.message || `${applicantName} has been ${action.toLowerCase()}ed.`,
        });
        setTimeout(() => setApprovalToast(null), 5000);
        // Refresh active list and counts
        const curStatus = approvalTab === 'HISTORICAL' ? 'ALL' : 'PENDING_APPROVAL';
        const curRole = ['mentor', 'admin', 'tpo'].includes(approvalTab) ? approvalTab : '';
        await loadApprovals(curStatus, curRole);
      }
    } catch (err) {
      setApprovalToast({
        type: 'error',
        message: err.message || `Failed to ${action.toLowerCase()} account.`,
      });
      setTimeout(() => setApprovalToast(null), 5000);
    } finally {
      setApprovalActionLoadingId(null);
    }
  };

  // 1. Initial Load: Summary, Departments, Mentors, Model Status
  useEffect(() => {
    let isMounted = true;
    async function loadInitialData() {
      try {
        const [sumRes, deptRes, mentorsRes, modelRes] = await Promise.allSettled([
          api.getInstitutionSummary(),
          api.getInstitutionDepartments(),
          api.getMentors(),
          api.getModelStatus(),
        ]);

        // Fetch pending institutional approvals count for administrator notification
        try {
          const appRes = await api.getPendingApprovals('PENDING_APPROVAL');
          if (appRes?.counts && isMounted) {
            setApprovalsCounts(appRes.counts);
          }
        } catch {
          // Non-blocking for unauthenticated or test contexts
        }

        if (isMounted) {
          if (sumRes.status === 'fulfilled' && sumRes.value) {
            setSummaryData(sumRes.value);
            setIsLiveApi(true);
            // summaryData.reconciliation preserves the 50,008 total database records telemetry
            // rosterCounts maintains the counts for the active 50-student selected cohort
          }
          if (deptRes.status === 'fulfilled' && Array.isArray(deptRes.value)) {
            setDepartmentData(deptRes.value);
          }
          if (mentorsRes.status === 'fulfilled' && Array.isArray(mentorsRes.value)) {
            setMentorsList(mentorsRes.value);
          }
          if (modelRes.status === 'fulfilled' && modelRes.value) {
            setModelStatus(modelRes.value);
          }
        }
      } catch (err) {
        console.warn('Initial data load warning:', err);
      }
    }
    loadInitialData();
    return () => {
      isMounted = false;
    };
  }, []);


  // Re-fetch approvals when navigating to Approvals tab or switching role sub-tabs
  useEffect(() => {
    if (activeNav === 'Approvals') {
      const curStatus = approvalTab === 'HISTORICAL' ? 'ALL' : 'PENDING_APPROVAL';
      const curRole = ['mentor', 'admin', 'tpo'].includes(approvalTab) ? approvalTab : '';
      loadApprovals(curStatus, curRole);
    }
  }, [activeNav, approvalTab]);

  // 2A. Load Complete 50,008 Student Telemetry for Student Success Digital Twin
  useEffect(() => {
    let isMounted = true;
    async function loadDigitalTwinTelemetry() {
      setIsLoadingDigitalTwin(true);
      try {
        const res = await api.getDigitalTwinTelemetry({
          mentor: mentorFilter !== 'ALL' ? mentorFilter : undefined,
          recordType: recordTypeFilter,
          department: deptFilter !== 'ALL' ? deptFilter : undefined,
          riskBand: riskFilter !== 'ALL' ? riskFilter : undefined,
          academicRisk: academicRiskFilter !== 'ALL' ? academicRiskFilter : undefined,
          placementRisk: placementRiskFilter !== 'ALL' ? placementRiskFilter : undefined,
          search: searchQuery,
          all: true,
        });

        if (isMounted && res) {
          if (res.items) {
            setDigitalTwinStudents(res.items);
          }
          if (res.aggregations) {
            setDigitalTwinAggregations(res.aggregations);
          }
        }
      } catch (err) {
        console.warn('Digital twin telemetry fetch failed:', err);
      } finally {
        if (isMounted) setIsLoadingDigitalTwin(false);
      }
    }

    loadDigitalTwinTelemetry();
    return () => {
      isMounted = false;
    };
  }, [
    mentorFilter,
    recordTypeFilter,
    deptFilter,
    riskFilter,
    academicRiskFilter,
    placementRiskFilter,
    searchQuery,
  ]);

  // 2B. Query Student Directory Table (Server-side Paginated Roster across 50,008 Records)
  useEffect(() => {
    let isMounted = true;
    async function fetchStudents() {
      setIsLoadingStudents(true);
      try {
        const res = await api.getInstitutionStudents({
          search: searchQuery,
          riskBand: riskFilter !== 'ALL' ? riskFilter : undefined,
          academicRisk: academicRiskFilter !== 'ALL' ? academicRiskFilter : undefined,
          placementRisk: placementRiskFilter !== 'ALL' ? placementRiskFilter : undefined,
          department: deptFilter !== 'ALL' ? deptFilter : undefined,
          mentor: mentorFilter !== 'ALL' ? mentorFilter : undefined,
          recordType: recordTypeFilter,
          attendanceRange: attendanceRangeFilter !== 'ALL' ? attendanceRangeFilter : undefined,
          sortBy,
          sortOrder,
          page: currentPage,
          pageSize,
        });

        if (isMounted) {
          if (res && res.items) {
            setCohortStudents(res.items);
            setTotalRecords(res.total || res.items.length);
            setTotalPages(res.total_pages || Math.ceil((res.total || res.items.length) / pageSize) || 1);
            if (res.counts) {
              setRosterCounts({
                verified_profiles: res.counts.verified_profiles ?? 8,
                anonymous_cohort: res.counts.anonymous_cohort ?? 50000,
                total_records: res.counts.total_records ?? (res.total || 50008),
              });
            }
          } else if (Array.isArray(res)) {
            setCohortStudents(res);
            setTotalRecords(res.length);
            setTotalPages(Math.ceil(res.length / pageSize) || 1);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch students from API, using fallback:', err);
        setCohortStudents(MOCK_STUDENTS);
        setTotalRecords(MOCK_STUDENTS.length);
        const verified = MOCK_STUDENTS.filter((s) => s.recordType === 'verified_profile').length;
        const benchmark = MOCK_STUDENTS.filter((s) => s.recordType !== 'verified_profile').length;
        setRosterCounts({
          verified_profiles: verified,
          anonymous_cohort: benchmark,
          total_records: MOCK_STUDENTS.length,
        });
      } finally {
        if (isMounted) setIsLoadingStudents(false);
      }
    }

    fetchStudents();
    return () => {
      isMounted = false;
    };
  }, [
    searchQuery,
    deptFilter,
    riskFilter,
    academicRiskFilter,
    placementRiskFilter,
    mentorFilter,
    recordTypeFilter,
    attendanceRangeFilter,
    sortBy,
    sortOrder,
    currentPage,
    pageSize,
  ]);

  // 3. Run Live Cohort Simulation
  const handleRunSimulation = async () => {
    setIsSimulating(true);
    try {
      const res = await api.simulateCohort({
        attendance_boost: simAttendanceBoost,
        dsa_coding_boost: simDsaBoost,
        lms_velocity_boost: simLmsBoost,
        mentor_capacity: simMentorCapacity,
        target_department: deptFilter !== 'ALL' ? deptFilter : undefined,
      });
      if (res) {
        setSimResults(res);
      }
    } catch (err) {
      console.warn('Simulation API failed, calculating reactive fallback:', err);
      const rescued = Math.round((simMentorCapacity * 0.7) + (simDsaBoost * 14) + (simAttendanceBoost * 1.5));
      setSimResults({
        total_analyzed: 1000,
        students_rescued_count: rescued,
        baseline_high_academic_risk: 184,
        projected_high_academic_risk: Math.max(40, 184 - Math.round(rescued * 0.55)),
        baseline_high_placement_risk: 220,
        projected_high_placement_risk: Math.max(50, 220 - Math.round(rescued * 0.65)),
        score_improvement: Number(((simAttendanceBoost * 0.15) + (simDsaBoost * 2.2)).toFixed(1)),
        readiness_improvement_pct: Number(((simDsaBoost * 4.5) + (simAttendanceBoost * 0.4)).toFixed(1)),
        roi_summary: `Simulated intervention rescues ${rescued} high-risk students under ${simMentorCapacity} allocated mentor slots.`,
      });
    } finally {
      setIsSimulating(false);
    }
  };

  // 4. Enroll Student
  const handleEnrollStudent = async (e) => {
    e.preventDefault();
    if (!newStudentRoll.trim() || !newStudentName.trim()) return;
    setEnrollSubmitting(true);
    try {
      const payload = {
        roll_no: newStudentRoll.trim().toUpperCase(),
        full_name: newStudentName.trim(),
        department: newStudentDept,
        year: '3rd Year',
        semester: 6,
        cgpa: parseFloat(newStudentCgpa) || 7.5,
        backlogs: parseInt(newStudentBacklogs, 10) || 0,
        overall_attendance_pct: parseFloat(newStudentAtt) || 85.0,
        coding_skills: 7.0,
        dsa_score: 7.0,
        aptitude_score: 75.0,
        communication_skills: 7.5,
        lms_assignment_completion_pct: 80.0,
        assigned_mentor: newStudentMentor,
      };
      const res = await api.createStudent(payload);
      if (res?.success && res?.student) {
        setCohortStudents((prev) => [res.student, ...prev]);
        setEnrollNotice(`Student ${payload.full_name} (${payload.roll_no}) successfully registered with 100% verified provenance!`);
        setTimeout(() => setEnrollNotice(''), 4500);
        setAddStudentModalOpen(false);
        setNewStudentRoll('');
        setNewStudentName('');
        // Refresh summary
        const updatedSum = await api.getInstitutionSummary();
        if (updatedSum) setSummaryData(updatedSum);
      }
    } catch (err) {
      alert(err.message || 'Failed to enroll student.');
    } finally {
      setEnrollSubmitting(false);
    }
  };

  // 4b. Enroll Faculty / Mentor
  const handleEnrollFaculty = async (e) => {
    e.preventDefault();
    if (!facultyStaffId.trim() || !facultyFirstName.trim() || !facultyLastName.trim() || !facultyEmail.trim()) {
      alert('Please fill in all required fields.');
      return;
    }
    setFacultySubmitting(true);
    try {
      const payload = {
        staff_id: facultyStaffId.trim().toUpperCase(),
        first_name: facultyFirstName.trim(),
        last_name: facultyLastName.trim(),
        email: facultyEmail.trim().toLowerCase(),
        department: facultyDept,
        designation: facultyDesignation,
        phone_number: facultyPhone.trim() || undefined,
        status: facultyStatus,
      };
      const res = await api.enrollMentor(payload);
      if (res?.success) {
        setEnrollNotice(`Faculty Mentor ${res.mentor?.full_name || payload.first_name + ' ' + payload.last_name} (${payload.staff_id}) successfully enrolled!`);
        setTimeout(() => setEnrollNotice(''), 4500);
        setAddFacultyModalOpen(false);
        setFacultyStaffId('');
        setFacultyFirstName('');
        setFacultyLastName('');
        setFacultyEmail('');
        setFacultyPhone('');
        const [updatedMentors, updatedSum] = await Promise.all([
          api.getMentors().catch(() => null),
          api.getInstitutionSummary().catch(() => null),
        ]);
        if (updatedMentors && Array.isArray(updatedMentors)) setMentorsList(updatedMentors);
        if (updatedSum) setSummaryData(updatedSum);
      }
    } catch (err) {
      alert(err.message || 'Failed to enroll faculty mentor.');
    } finally {
      setFacultySubmitting(false);
    }
  };

  // 4c. Enroll Placement Officer
  const handleEnrollPlacementOfficer = async (e) => {
    e.preventDefault();
    if (!tpoStaffId.trim() || !tpoFirstName.trim() || !tpoLastName.trim() || !tpoEmail.trim()) {
      alert('Please fill in all required fields.');
      return;
    }
    setTpoSubmitting(true);
    try {
      const payload = {
        staff_id: tpoStaffId.trim().toUpperCase(),
        first_name: tpoFirstName.trim(),
        last_name: tpoLastName.trim(),
        email: tpoEmail.trim().toLowerCase(),
        department: tpoDept,
        designation: tpoDesignation,
        phone_number: tpoPhone.trim() || undefined,
        status: tpoStatus,
      };
      const res = await api.enrollPlacementOfficer(payload);
      if (res?.success) {
        setEnrollNotice(`Placement Officer ${res.officer?.full_name || payload.first_name + ' ' + payload.last_name} (${payload.staff_id}) successfully enrolled!`);
        setTimeout(() => setEnrollNotice(''), 4500);
        setAddPlacementOfficerModalOpen(false);
        setTpoStaffId('');
        setTpoFirstName('');
        setTpoLastName('');
        setTpoEmail('');
        setTpoPhone('');
        const updatedSum = await api.getInstitutionSummary().catch(() => null);
        if (updatedSum) setSummaryData(updatedSum);
      }
    } catch (err) {
      alert(err.message || 'Failed to enroll placement officer.');
    } finally {
      setTpoSubmitting(false);
    }
  };

  // 5. Mentor Reassignment
  const handleAssignMentor = async (rollNo, mentorName) => {
    setCohortStudents((prev) =>
      prev.map((s) => (s.id === rollNo ? { ...s, assignedMentor: mentorName } : s))
    );
    setSelectedStudent((prev) => (prev && prev.id === rollNo ? { ...prev, assignedMentor: mentorName } : prev));
    try {
      await api.assignMentor(rollNo, mentorName);
      // Refresh mentors list
      const updatedMentors = await api.getMentors();
      if (updatedMentors) setMentorsList(updatedMentors);
    } catch (err) {
      console.error('Failed to assign mentor:', err);
    }
  };

  // 6. CSV Export Trigger
  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      await api.downloadStudentsExportCSV({
        search: searchQuery,
        riskBand: riskFilter !== 'ALL' ? riskFilter : undefined,
        academicRisk: academicRiskFilter !== 'ALL' ? academicRiskFilter : undefined,
        placementRisk: placementRiskFilter !== 'ALL' ? placementRiskFilter : undefined,
        department: deptFilter !== 'ALL' ? deptFilter : undefined,
        mentor: mentorFilter !== 'ALL' ? mentorFilter : undefined,
        recordType: recordTypeFilter,
      });
      setReportGenerated(true);
      setTimeout(() => setReportGenerated(false), 4000);
    } catch (err) {
      console.warn('Direct authenticated download failed, trying browser URL fallback:', err);
      const exportUrl = api.getExportStudentsUrl({
        search: searchQuery,
        riskBand: riskFilter !== 'ALL' ? riskFilter : undefined,
        academicRisk: academicRiskFilter !== 'ALL' ? academicRiskFilter : undefined,
        placementRisk: placementRiskFilter !== 'ALL' ? placementRiskFilter : undefined,
        department: deptFilter !== 'ALL' ? deptFilter : undefined,
        mentor: mentorFilter !== 'ALL' ? mentorFilter : undefined,
        recordType: recordTypeFilter,
      });
      window.open(exportUrl, '_blank');
      setReportGenerated(true);
      setTimeout(() => setReportGenerated(false), 4000);
    } finally {
      setIsExporting(false);
    }
  };

  // 7. Active Mentors Data
  const defaultMentors = [
    { name: 'Prof. Rajesh Kumar', department: 'Computer Science & Engineering', assigned_students_count: 3, open_interventions_count: 3 },
    { name: 'Dr. Sunita Sharma', department: 'Electronics & Communication', assigned_students_count: 3, open_interventions_count: 2 },
    { name: 'Prof. K. Murthy', department: 'Mechanical Engineering', assigned_students_count: 2, open_interventions_count: 2 },
  ];
  const activeMentorsDisplay = mentorsList.length > 0 ? mentorsList : defaultMentors;

  // 8. Decoupled Risk Quadrant Counts
  const riskQuadrantStats = useMemo(() => {
    let starCount = 0;       // Low Acad / Low Plac
    let examDeficit = 0;     // High Acad / Low Plac
    let skillDeficit = 0;    // Low Acad / High Plac (High CGPA, but low coding)
    let criticalCount = 0;   // High Acad / High Plac

    cohortStudents.forEach((s) => {
      const acadHigh = s.academicRisk === 'HIGH';
      const placHigh = s.placementRisk === 'HIGH';
      if (!acadHigh && !placHigh) starCount++;
      else if (acadHigh && !placHigh) examDeficit++;
      else if (!acadHigh && placHigh) skillDeficit++;
      else criticalCount++;
    });

    return { starCount, examDeficit, skillDeficit, criticalCount };
  }, [cohortStudents]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: isDarkMode ? '#0B1120' : '#F4F7FC',
        color: isDarkMode ? '#F8FAFC' : '#0F172A',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      }}
    >
      {/* =========================================================================
          TOP DEMO PERSISTENT CONTROL BAR
          ========================================================================= */}
      <div
        style={{
          backgroundColor: '#0F172A',
          color: '#FFFFFF',
          padding: '8px 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.82rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          zIndex: 60,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '4px',
              backgroundColor: isLiveApi ? '#10B981' : '#1E6BFF',
              fontWeight: 700,
              fontSize: '0.74rem',
              letterSpacing: '0.04em',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#FFFFFF' }} />
            <span>{isLiveApi ? 'FASTAPI ML BACKEND ACTIVE' : 'STANDALONE MODE'}</span>
          </span>
          <span>
            Institutional Commander: <strong>{currentUser?.name || 'Dr. R. Kumar'}</strong> ({currentUser?.roleLabel || 'Institution Admin'})
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.72rem', color: '#94A3B8', marginRight: '4px' }}>Quick Switcher:</span>
          <button
            onClick={async () => {
              await loginWithDemo('mentor');
              navigate('/mentor/dashboard');
            }}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#FFFFFF',
              borderRadius: '6px',
              padding: '3px 8px',
              cursor: 'pointer',
              fontSize: '0.74rem',
              fontWeight: 600,
            }}
          >
            👨‍🏫 Faculty Mentor
          </button>
          <button
            onClick={async () => {
              await loginWithDemo('tpo');
              navigate('/placement/dashboard');
            }}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#FFFFFF',
              borderRadius: '6px',
              padding: '3px 8px',
              cursor: 'pointer',
              fontSize: '0.74rem',
              fontWeight: 600,
            }}
          >
            💼 TPO Office
          </button>
          <button
            onClick={async () => {
              await loginWithDemo('student');
              navigate('/student/dashboard');
            }}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#FFFFFF',
              borderRadius: '6px',
              padding: '3px 8px',
              cursor: 'pointer',
              fontSize: '0.74rem',
              fontWeight: 600,
            }}
          >
            🎓 Student Portal
          </button>
          <button
            onClick={handleLogout}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.75)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              fontSize: '0.76rem',
              marginLeft: '8px',
            }}
          >
            <LogOut size={13} />
            <span>Sign out</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          MAIN APPLICATION LAYOUT (SIDEBAR + MAIN CANVAS)
          ========================================================================= */}
      <div style={{ display: 'flex', flex: 1 }}>
        {/* =======================================================================
            LEFT SIDEBAR
            ======================================================================= */}
        <aside
          style={{
            width: '240px',
            backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
            borderRight: `1px solid ${isDarkMode ? '#1E293B' : '#E2E8F0'}`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '1.25rem 0.85rem',
            position: 'sticky',
            top: 0,
            height: 'calc(100vh - 38px)',
            flexShrink: 0,
            zIndex: 40,
          }}
        >
          <div>
            <div style={{ padding: '0 0.5rem 1.5rem', borderBottom: `1px solid ${isDarkMode ? '#1E293B' : '#F1F5F9'}` }}>
              <BrandLogo variant={isDarkMode ? 'dark' : 'light'} size="small" showTagline={false} />
            </div>

            <nav style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <button
                onClick={() => setActiveNav('Dashboard')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  backgroundColor: activeNav === 'Dashboard' ? (isDarkMode ? '#1E293B' : '#EFF6FF') : 'transparent',
                  color: activeNav === 'Dashboard' ? '#1E6BFF' : (isDarkMode ? '#94A3B8' : '#64748B'),
                  fontWeight: 700,
                  fontSize: '0.86rem',
                  border: 'none',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                }}
              >
                <Home size={18} />
                <span>Executive Command</span>
              </button>

              <button
                onClick={() => setActiveNav('Approvals')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  backgroundColor: activeNav === 'Approvals' ? (isDarkMode ? '#1E293B' : '#EFF6FF') : 'transparent',
                  color: activeNav === 'Approvals' ? '#1E6BFF' : (isDarkMode ? '#94A3B8' : '#64748B'),
                  fontWeight: 700,
                  fontSize: '0.86rem',
                  border: 'none',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <ShieldCheck size={18} />
                  <span>Account Approvals</span>
                </div>
                {approvalsCounts.total_pending > 0 && (
                  <span
                    style={{
                      backgroundColor: '#EF4444',
                      color: '#FFFFFF',
                      fontSize: '0.70rem',
                      fontWeight: 800,
                      padding: '2px 7px',
                      borderRadius: '12px',
                    }}
                  >
                    {approvalsCounts.total_pending}
                  </span>
                )}
              </button>
            </nav>

            {/* Quick Navigation Anchor Links */}
            <div style={{ marginTop: '2rem', padding: '0 0.5rem' }}>
              <div style={{ fontSize: '0.70rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94A3B8', marginBottom: '8px' }}>
                Command Anchors
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.78rem' }}>
                <a href="#digital-twin-section" style={{ textDecoration: 'none', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Compass size={13} style={{ color: '#1E6BFF' }} />
                  <span>Student Digital Twin</span>
                </a>
                <a href="#decoupled-risk-section" style={{ textDecoration: 'none', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Layers size={13} style={{ color: '#8B5CF6' }} />
                  <span>Decoupled Risk Matrix</span>
                </a>
                <a href="#intervention-simulator-section" style={{ textDecoration: 'none', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sliders size={13} style={{ color: '#F97316' }} />
                  <span>Intervention Simulator</span>
                </a>
                <a href="#student-directory-section" style={{ textDecoration: 'none', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={13} style={{ color: '#10B981' }} />
                  <span>Student Directory</span>
                </a>
                <a href="#model-intelligence-section" style={{ textDecoration: 'none', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Zap size={13} style={{ color: '#EC4899' }} />
                  <span>Model Intelligence</span>
                </a>
              </div>
            </div>
          </div>

          {/* Sidebar Footer: Evaluator Walkthrough Action */}
          <div
            style={{
              padding: '1rem',
              borderRadius: '12px',
              backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
              border: `1px solid ${isDarkMode ? '#334155' : '#E2E8F0'}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <Sparkles size={16} style={{ color: '#F59E0B' }} />
              <strong style={{ fontSize: '0.80rem' }}>KPMG Evaluator Demo</strong>
            </div>
            <p style={{ fontSize: '0.72rem', color: '#64748B', margin: 0, marginBottom: '8px', lineHeight: 1.4 }}>
              Demonstrate 5-step interactive at-risk recovery with verifiable ML impact.
            </p>
            <button
              onClick={() => {
                setWalkthroughActive(true);
                setWalkthroughStep(1);
                const el = document.getElementById('walkthrough-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              style={{
                width: '100%',
                padding: '6px 10px',
                borderRadius: '6px',
                backgroundColor: '#1E6BFF',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Launch Walkthrough →
            </button>
          </div>
        </aside>

        {/* =======================================================================
            MAIN CANVAS WORKSPACE
            ======================================================================= */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Top Canvas Bar */}
          <header
            style={{
              height: '64px',
              backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
              borderBottom: `1px solid ${isDarkMode ? '#1E293B' : '#E2E8F0'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 2rem',
              position: 'sticky',
              top: 0,
              zIndex: 30,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ position: 'relative', width: '320px' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type="text"
                  placeholder="Global search student ID, name, branch..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 36px',
                    borderRadius: '8px',
                    border: `1px solid ${isDarkMode ? '#334155' : '#E2E8F0'}`,
                    backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
                    color: isDarkMode ? '#FFFFFF' : '#0F172A',
                    fontSize: '0.84rem',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Roster Switcher Selector */}
              <div style={{ display: 'flex', backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9', borderRadius: '8px', padding: '3px' }}>
                <button
                  onClick={() => { setRecordTypeFilter('all'); setCurrentPage(1); }}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    backgroundColor: recordTypeFilter === 'all' ? '#1E6BFF' : 'transparent',
                    color: recordTypeFilter === 'all' ? '#FFFFFF' : '#64748B',
                  }}
                >
                  All Students ({(rosterCounts.total_records || 50008).toLocaleString()})
                </button>
                <button
                  onClick={() => { setRecordTypeFilter('verified_profile'); setCurrentPage(1); }}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    backgroundColor: recordTypeFilter === 'verified_profile' ? '#1E6BFF' : 'transparent',
                    color: recordTypeFilter === 'verified_profile' ? '#FFFFFF' : '#64748B',
                  }}
                >
                  Verified Profiles ({(rosterCounts.verified_profiles || 8).toLocaleString()})
                </button>
                <button
                  onClick={() => { setRecordTypeFilter('anonymous_cohort'); setCurrentPage(1); }}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    backgroundColor: recordTypeFilter === 'anonymous_cohort' ? '#1E6BFF' : 'transparent',
                    color: recordTypeFilter === 'anonymous_cohort' ? '#FFFFFF' : '#64748B',
                  }}
                >
                  Benchmark Cohort ({(rosterCounts.anonymous_cohort || 50000).toLocaleString()})
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: isDarkMode ? '#F8FAFC' : '#64748B',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '8px',
                }}
              >
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              <button
                onClick={() => setAddStudentModalOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  backgroundColor: '#1E6BFF',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(30, 107, 255, 0.3)',
                }}
              >
                <UserPlus size={15} />
                <span>+ Enroll Student</span>
              </button>

              <button
                onClick={() => setAddFacultyModalOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  backgroundColor: '#8B5CF6',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)',
                }}
              >
                <Award size={15} />
                <span>+ Enroll Faculty / Mentor</span>
              </button>

              <button
                onClick={() => setAddPlacementOfficerModalOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  backgroundColor: '#D97706',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(217, 119, 6, 0.3)',
                }}
              >
                <Briefcase size={15} />
                <span>+ Enroll Placement Officer</span>
              </button>

              <button
                onClick={handleExportCSV}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9',
                  color: isDarkMode ? '#FFFFFF' : '#0F172A',
                  border: `1px solid ${isDarkMode ? '#334155' : '#CBD5E1'}`,
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Download size={14} />
                <span>{reportGenerated ? 'Exported!' : 'Export CSV'}</span>
              </button>
            </div>
          </header>

          <main style={{ padding: '1.75rem 2rem 4rem', maxWidth: '1440px', width: '100%', margin: '0 auto' }}>
            {enrollNotice && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  backgroundColor: '#ECFDF5',
                  border: '1px solid #10B981',
                  color: '#065F46',
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <CheckCircle2 size={18} style={{ color: '#10B981' }} />
                <span>{enrollNotice}</span>
              </div>
            )}

            {activeNav === 'Approvals' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Page Header */}
                <div
                  style={{
                    backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                    borderRadius: '16px',
                    border: `1px solid ${isDarkMode ? '#334155' : '#E2E8F0'}`,
                    padding: '1.75rem 2rem',
                    boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <ShieldCheck size={24} style={{ color: '#1E6BFF' }} />
                      <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: isDarkMode ? '#FFFFFF' : '#0F172A' }}>
                        Institutional Account Approvals
                      </h1>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.86rem', color: isDarkMode ? '#94A3B8' : '#64748B' }}>
                      Verify and approve restricted institutional accounts (Faculty, Institution Officers, Placement Officers) before granting dashboard access. All actions are recorded in the institutional audit log.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      const curStatus = approvalTab === 'HISTORICAL' ? 'ALL' : 'PENDING_APPROVAL';
                      const curRole = ['mentor', 'admin', 'tpo'].includes(approvalTab) ? approvalTab : '';
                      loadApprovals(curStatus, curRole);
                    }}
                    disabled={isLoadingApprovals}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      backgroundColor: isDarkMode ? '#0F172A' : '#F1F5F9',
                      color: isDarkMode ? '#FFFFFF' : '#334155',
                      border: `1px solid ${isDarkMode ? '#334155' : '#CBD5E1'}`,
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <RefreshCw size={14} className={isLoadingApprovals ? 'spin' : ''} />
                    <span>Refresh List</span>
                  </button>
                </div>

                {/* Toast notification banner */}
                {approvalToast && (
                  <div
                    style={{
                      padding: '12px 16px',
                      borderRadius: '10px',
                      backgroundColor: approvalToast.type === 'success' ? '#ECFDF5' : (approvalToast.type === 'error' ? '#FEF2F2' : '#EFF6FF'),
                      border: `1px solid ${approvalToast.type === 'success' ? '#10B981' : (approvalToast.type === 'error' ? '#EF4444' : '#3B82F6')}`,
                      color: approvalToast.type === 'success' ? '#065F46' : (approvalToast.type === 'error' ? '#991B1B' : '#1E40AF'),
                      fontSize: '0.86rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {approvalToast.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                      <span>{approvalToast.message}</span>
                    </div>
                    <button
                      onClick={() => setApprovalToast(null)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 800 }}
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Error notification banner */}
                {approvalError && (
                  <div
                    style={{
                      padding: '12px 16px',
                      borderRadius: '10px',
                      backgroundColor: '#FEF2F2',
                      border: '1px solid #FECACA',
                      color: '#991B1B',
                      fontSize: '0.86rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <AlertTriangle size={18} style={{ color: '#EF4444', flexShrink: 0 }} />
                      <span>{approvalError}</span>
                    </div>
                    <button
                      onClick={() => {
                        const curStatus = approvalTab === 'HISTORICAL' ? 'ALL' : 'PENDING_APPROVAL';
                        const curRole = ['mentor', 'admin', 'tpo'].includes(approvalTab) ? approvalTab : '';
                        loadApprovals(curStatus, curRole);
                      }}
                      style={{
                        padding: '4px 12px',
                        borderRadius: '6px',
                        backgroundColor: '#DC2626',
                        color: '#FFFFFF',
                        border: 'none',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Retry
                    </button>
                  </div>
                )}

                {/* Filter Navigation Tabs & Search */}
                <div
                  style={{
                    backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                    borderRadius: '16px',
                    border: `1px solid ${isDarkMode ? '#334155' : '#E2E8F0'}`,
                    padding: '1rem 1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem',
                  }}
                >
                  {/* Role Tabs */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {[
                      { id: 'ALL_PENDING', label: 'All Pending', count: approvalsCounts.total_pending },
                      { id: 'mentor', label: 'Faculty / Mentor', count: approvalsCounts.pending_faculty },
                      { id: 'admin', label: 'Institution Officer', count: approvalsCounts.pending_admin },
                      { id: 'tpo', label: 'Placement Officer', count: approvalsCounts.pending_tpo },
                      { id: 'HISTORICAL', label: 'All Records / History', count: approvalsCounts.total_active + approvalsCounts.total_rejected },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setApprovalTab(tab.id)}
                        style={{
                          padding: '7px 14px',
                          borderRadius: '8px',
                          border: 'none',
                          fontSize: '0.80rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          backgroundColor: approvalTab === tab.id ? '#1E6BFF' : (isDarkMode ? '#0F172A' : '#F1F5F9'),
                          color: approvalTab === tab.id ? '#FFFFFF' : (isDarkMode ? '#94A3B8' : '#64748B'),
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <span>{tab.label}</span>
                        <span
                          style={{
                            fontSize: '0.70rem',
                            padding: '1px 6px',
                            borderRadius: '10px',
                            backgroundColor: approvalTab === tab.id ? 'rgba(255,255,255,0.25)' : (isDarkMode ? '#1E293B' : '#E2E8F0'),
                            color: approvalTab === tab.id ? '#FFFFFF' : (isDarkMode ? '#CBD5E1' : '#475569'),
                          }}
                        >
                          {tab.count}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Search Bar */}
                  <div style={{ position: 'relative', width: '280px' }}>
                    <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                    <input
                      type="text"
                      placeholder="Filter applicant name, email..."
                      value={approvalSearch}
                      onChange={(e) => setApprovalSearch(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '7px 10px 7px 32px',
                        borderRadius: '8px',
                        border: `1px solid ${isDarkMode ? '#334155' : '#E2E8F0'}`,
                        backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC',
                        color: isDarkMode ? '#FFFFFF' : '#0F172A',
                        fontSize: '0.80rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                {/* Applicants List Table */}
                <div
                  style={{
                    backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                    borderRadius: '16px',
                    border: `1px solid ${isDarkMode ? '#334155' : '#E2E8F0'}`,
                    overflow: 'hidden',
                    boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
                  }}
                >
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                      <thead>
                        <tr style={{ backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC', borderBottom: `1px solid ${isDarkMode ? '#334155' : '#E2E8F0'}` }}>
                          <th style={{ padding: '12px 16px', fontWeight: 700, color: isDarkMode ? '#94A3B8' : '#64748B', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            APPLICANT & CONTACT
                          </th>
                          <th style={{ padding: '12px 16px', fontWeight: 700, color: isDarkMode ? '#94A3B8' : '#64748B', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            REQUESTED ROLE
                          </th>
                          <th style={{ padding: '12px 16px', fontWeight: 700, color: isDarkMode ? '#94A3B8' : '#64748B', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            DEPARTMENT
                          </th>
                          <th style={{ padding: '12px 16px', fontWeight: 700, color: isDarkMode ? '#94A3B8' : '#64748B', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            APPLIED DATE
                          </th>
                          <th style={{ padding: '12px 16px', fontWeight: 700, color: isDarkMode ? '#94A3B8' : '#64748B', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            APPROVAL STATUS
                          </th>
                          <th style={{ padding: '12px 16px', fontWeight: 700, color: isDarkMode ? '#94A3B8' : '#64748B', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>
                            ADMIN ACTION
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {approvalError ? (
                          <tr>
                            <td colSpan={6} style={{ padding: '3rem 2rem', textAlign: 'center', color: '#991B1B' }}>
                              <AlertTriangle size={40} style={{ color: '#EF4444', margin: '0 auto 12px auto', display: 'block' }} />
                              <div style={{ fontWeight: 700, fontSize: '1rem', color: isDarkMode ? '#FFFFFF' : '#0F172A', marginBottom: '4px' }}>
                                Failed to Retrieve Approvals
                              </div>
                              <div style={{ fontSize: '0.84rem', color: '#64748B', maxWidth: '480px', margin: '0 auto 12px auto' }}>
                                {approvalError}
                              </div>
                              <button
                                onClick={() => {
                                  const curStatus = approvalTab === 'HISTORICAL' ? 'ALL' : 'PENDING_APPROVAL';
                                  const curRole = ['mentor', 'admin', 'tpo'].includes(approvalTab) ? approvalTab : '';
                                  loadApprovals(curStatus, curRole);
                                }}
                                style={{
                                  padding: '6px 14px',
                                  borderRadius: '6px',
                                  backgroundColor: '#1E6BFF',
                                  color: '#FFFFFF',
                                  border: 'none',
                                  fontSize: '0.80rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                }}
                              >
                                Retry
                              </button>
                            </td>
                          </tr>
                        ) : filteredApprovals.length === 0 ? (
                          <tr>
                            <td colSpan={6} style={{ padding: '3rem 2rem', textAlign: 'center', color: '#94A3B8' }}>
                              <ShieldCheck size={40} style={{ color: '#10B981', margin: '0 auto 12px auto', display: 'block', opacity: 0.8 }} />
                              <div style={{ fontWeight: 700, fontSize: '1rem', color: isDarkMode ? '#FFFFFF' : '#0F172A', marginBottom: '4px' }}>
                                No Applications Found
                              </div>
                              <div style={{ fontSize: '0.84rem' }}>
                                {approvalSearch ? 'No registrations match your search criteria.' : 'All institutional registrations have been reviewed.'}
                              </div>
                            </td>
                          </tr>
                        ) : (
                          filteredApprovals.map((app) => (
                            <tr
                              key={app.id}
                              style={{
                                borderBottom: `1px solid ${isDarkMode ? '#334155' : '#F1F5F9'}`,
                                transition: 'background-color 0.15s ease',
                              }}
                            >
                              <td style={{ padding: '14px 16px' }}>
                                <div style={{ fontWeight: 700, color: isDarkMode ? '#FFFFFF' : '#0F172A', fontSize: '0.90rem' }}>
                                  {app.full_name}
                                </div>
                                <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: '2px' }}>
                                  {app.email} {app.phone_number && `• ${app.phone_number}`}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontFamily: 'monospace' }}>
                                  ID: {app.roll_no || `EMP-${app.id}`}
                                </div>
                              </td>
                              <td style={{ padding: '14px 16px' }}>
                                <span
                                  style={{
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    backgroundColor:
                                      app.role === 'mentor' ? 'rgba(139, 92, 246, 0.12)' :
                                      app.role === 'admin' ? 'rgba(30, 107, 255, 0.12)' :
                                      app.role === 'tpo' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                                    color:
                                      app.role === 'mentor' ? '#8B5CF6' :
                                      app.role === 'admin' ? '#1E6BFF' :
                                      app.role === 'tpo' ? '#F59E0B' : '#10B981',
                                  }}
                                >
                                  {app.role_label || app.role}
                                </span>
                              </td>
                              <td style={{ padding: '14px 16px', color: isDarkMode ? '#CBD5E1' : '#334155', fontSize: '0.82rem' }}>
                                {app.department || 'Institutional Administration'}
                              </td>
                              <td style={{ padding: '14px 16px', color: '#64748B', fontSize: '0.78rem' }}>
                                {app.created_at ? new Date(app.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent'}
                              </td>
                              <td style={{ padding: '14px 16px' }}>
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    padding: '3px 8px',
                                    borderRadius: '9999px',
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    backgroundColor:
                                      app.status === 'PENDING_APPROVAL' ? '#FEF3C7' :
                                      app.status === 'ACTIVE' ? '#DCFCE7' : '#FEE2E2',
                                    color:
                                      app.status === 'PENDING_APPROVAL' ? '#B45309' :
                                      app.status === 'ACTIVE' ? '#15803D' : '#B91C1C',
                                  }}
                                >
                                  {app.status === 'PENDING_APPROVAL' && <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#D97706' }} />}
                                  {app.status === 'PENDING_APPROVAL' ? 'Pending Verification' : (app.status === 'ACTIVE' ? 'Approved & Active' : 'Rejected')}
                                </span>
                              </td>
                              <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                                {app.status === 'PENDING_APPROVAL' ? (
                                  <div style={{ display: 'inline-flex', gap: '8px' }}>
                                    <button
                                      onClick={() => handleApprovalAction(app.id, 'APPROVE', app.full_name)}
                                      disabled={approvalActionLoadingId === app.id}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '5px',
                                        padding: '6px 12px',
                                        borderRadius: '6px',
                                        backgroundColor: '#10B981',
                                        color: '#FFFFFF',
                                        border: 'none',
                                        fontSize: '0.78rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        boxShadow: '0 1px 3px rgba(16,185,129,0.3)',
                                      }}
                                    >
                                      <CheckCircle size={13} />
                                      <span>{approvalActionLoadingId === app.id ? 'Processing...' : 'Approve'}</span>
                                    </button>
                                    <button
                                      onClick={() => handleApprovalAction(app.id, 'REJECT', app.full_name)}
                                      disabled={approvalActionLoadingId === app.id}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '5px',
                                        padding: '6px 12px',
                                        borderRadius: '6px',
                                        backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
                                        color: '#EF4444',
                                        border: '1px solid #FECACA',
                                        fontSize: '0.78rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                      }}
                                    >
                                      <X size={13} />
                                      <span>Reject</span>
                                    </button>
                                  </div>
                                ) : app.status === 'ACTIVE' ? (
                                  <span style={{ fontSize: '0.76rem', color: '#10B981', fontWeight: 600 }}>
                                    Verified ✓
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handleApprovalAction(app.id, 'APPROVE', app.full_name)}
                                    disabled={approvalActionLoadingId === app.id}
                                    style={{
                                      padding: '4px 10px',
                                      borderRadius: '6px',
                                      backgroundColor: '#EFF6FF',
                                      color: '#1E6BFF',
                                      border: '1px solid #BFDBFE',
                                      fontSize: '0.75rem',
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                    }}
                                  >
                                    Re-evaluate & Approve
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <>

            {/* High-Visibility Institutional Account Approval Alert Callout */}
            {approvalsCounts.total_pending > 0 && activeNav !== 'Approvals' && (
              <div
                style={{
                  padding: '14px 20px',
                  borderRadius: '12px',
                  backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.12)' : '#FFFBEB',
                  border: `1px solid ${isDarkMode ? 'rgba(245, 158, 11, 0.3)' : '#FDE68A'}`,
                  color: isDarkMode ? '#FCD34D' : '#92400E',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: '0 2px 6px rgba(245, 158, 11, 0.08)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ShieldAlert size={20} style={{ color: '#F59E0B', flexShrink: 0 }} />
                  <span>
                    <strong>{approvalsCounts.total_pending} Institutional Account{approvalsCounts.total_pending > 1 ? 's' : ''}</strong> pending administrative verification. Restricted institutional roles require approval before dashboard access is unlocked.
                  </span>
                </div>
                <button
                  onClick={() => setActiveNav('Approvals')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    backgroundColor: '#D97706',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: '0.80rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    marginLeft: '12px',
                  }}
                >
                  Review & Approve →
                </button>
              </div>
            )}

            {/* ===================================================================
                SECTION A: EXECUTIVE OVERVIEW & PROVENANCE RECONCILIATION
                =================================================================== */}
            <div
              style={{
                position: 'relative',
                borderRadius: '20px',
                overflow: 'hidden',
                marginBottom: '1.75rem',
                minHeight: '170px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '2rem 2.5rem',
                backgroundImage: `linear-gradient(to right, rgba(15, 23, 42, 0.94) 0%, rgba(15, 23, 42, 0.76) 55%, rgba(15, 23, 42, 0.92) 100%), url('/assets/images/codebuffet_campus_entrance.jpg')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center 40%',
                boxShadow: '0 8px 24px rgba(15, 23, 42, 0.12)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <div>
                <div style={{ fontSize: '0.74rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#38BDF8', marginBottom: '6px' }}>
                  CENTRAL DECISION-INTELLIGENCE COMMAND
                </div>
                <h1 style={{ fontSize: '2.0rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.15, marginBottom: '6px', letterSpacing: '-0.02em' }}>
                  Institutional Student Success Platform
                </h1>
                <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.90rem', margin: 0, maxWidth: '580px' }}>
                  Decoupled academic and placement risk monitoring powered by LightGBM and deterministic multi-factor policy engines across 50,008 total accessible records.
                </p>
              </div>

              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.10)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255, 255, 255, 0.20)',
                  borderRadius: '16px',
                  padding: '1.15rem 1.4rem',
                  maxWidth: '340px',
                  color: '#FFFFFF',
                }}
              >
                <div style={{ fontSize: '0.74rem', color: '#38BDF8', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>
                  DATA RECONCILIATION AUDIT
                </div>
                <div style={{ fontSize: '0.84rem', lineHeight: 1.45, fontWeight: 500 }}>
                  <strong>8 Verified Profiles</strong> (Registrar B.Tech Cohort) + <strong>50,000 Benchmark Records</strong> (kaggle.csv). Zero synthetic duplication.
                </div>
              </div>
            </div>

            {/* MANDATORY PROVENANCE BANNER */}
            <div
              style={{
                backgroundColor: isDarkMode ? '#1E293B' : '#EFF6FF',
                border: `1px solid ${isDarkMode ? '#334155' : '#BFDBFE'}`,
                borderRadius: '12px',
                padding: '1rem 1.25rem',
                marginBottom: '1.75rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
              }}
            >
              <HelpCircle size={20} style={{ color: '#1E6BFF', flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '0.82rem', color: isDarkMode ? '#E2E8F0' : '#1E3A8A', lineHeight: 1.5 }}>
                <strong>Data Architecture Disclosure:</strong> CODEBUFFET explicitly separates identifiable enrolled student accounts from anonymous cohort benchmark data.
                The <strong>8 verified profiles</strong> belong to registered university students with full 100% telemetry completeness and direct mentor assignments.
                The <strong>50,000 Kaggle benchmark records</strong> provide institutional normative distributions for early warning ML modeling without fabricating synthetic student identities.
                Additionally, <strong>~12,424 records</strong> (8,000 placement training records + 4,424 UCI dropout benchmark records) discovered in the local research cache were verified as independent research artifacts.
              </div>
            </div>

            {/* 6 EXECUTIVE METRIC STAT CARDS */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '1.75rem',
              }}
            >
              {/* Card 1: Total Students */}
              <div
                style={{
                  backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                  border: `1px solid ${isDarkMode ? '#334155' : '#E2E8F0'}`,
                  borderRadius: '14px',
                  padding: '1.15rem 1.25rem',
                  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600 }}>Total Records (Database)</div>
                    <div style={{ fontSize: '1.65rem', fontWeight: 800, marginTop: '2px' }}>
                      {summaryData.total_students ? summaryData.total_students.toLocaleString() : '50,008'}
                    </div>
                  </div>
                  <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#EFF6FF', color: '#1E6BFF' }}>
                    <Users size={20} />
                  </div>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 600, marginTop: '6px' }}>
                  {cohortStudents.length || 50} Displayed Cohort · {summaryData.total_students ? summaryData.total_students.toLocaleString() : '50,008'} Total in DB
                </div>
              </div>

              {/* Card 2: Average Success Score */}
              <div
                style={{
                  backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                  border: `1px solid ${isDarkMode ? '#334155' : '#E2E8F0'}`,
                  borderRadius: '14px',
                  padding: '1.15rem 1.25rem',
                  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600 }}>Avg. Success Score</div>
                    <div style={{ fontSize: '1.65rem', fontWeight: 800, marginTop: '2px', color: '#10B981' }}>
                      {summaryData.avg_success_score || 72.6}%
                    </div>
                  </div>
                  <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#ECFDF5', color: '#10B981' }}>
                    <GraduationCap size={20} />
                  </div>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '6px' }}>
                  6-Factor Composite Index
                </div>
              </div>

              {/* Card 3: Placement Readiness */}
              <div
                style={{
                  backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                  border: `1px solid ${isDarkMode ? '#334155' : '#E2E8F0'}`,
                  borderRadius: '14px',
                  padding: '1.15rem 1.25rem',
                  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600 }}>Placement Ready</div>
                    <div style={{ fontSize: '1.65rem', fontWeight: 800, marginTop: '2px', color: '#1E6BFF' }}>
                      {summaryData.cohort_placement_readiness_pct || 77.8}%
                    </div>
                  </div>
                  <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#EFF6FF', color: '#1E6BFF' }}>
                    <Briefcase size={20} />
                  </div>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 600, marginTop: '6px' }}>
                  ▲ +6.8% MoM Conversion
                </div>
              </div>

              {/* Card 4: At-Risk Population */}
              <div
                style={{
                  backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                  border: `1px solid ${isDarkMode ? '#334155' : '#E2E8F0'}`,
                  borderRadius: '14px',
                  padding: '1.15rem 1.25rem',
                  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600 }}>At-Risk Population</div>
                    <div style={{ fontSize: '1.65rem', fontWeight: 800, marginTop: '2px', color: '#EF4444' }}>
                      {summaryData.at_risk_count ?? 2} Students
                    </div>
                  </div>
                  <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#FEF2F2', color: '#EF4444' }}>
                    <AlertTriangle size={20} />
                  </div>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#DC2626', fontWeight: 600, marginTop: '6px' }}>
                  {summaryData.at_risk_pct || 25.0}% of Enrolled Cohort
                </div>
              </div>

              {/* Card 5: Attendance Shortage */}
              <div
                style={{
                  backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                  border: `1px solid ${isDarkMode ? '#334155' : '#E2E8F0'}`,
                  borderRadius: '14px',
                  padding: '1.15rem 1.25rem',
                  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600 }}>Attendance Shortage</div>
                    <div style={{ fontSize: '1.65rem', fontWeight: 800, marginTop: '2px', color: '#F59E0B' }}>
                      {summaryData.attendance_shortage_count ?? 1}
                    </div>
                  </div>
                  <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#FFFBEB', color: '#F59E0B' }}>
                    <Activity size={20} />
                  </div>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#D97706', fontWeight: 600, marginTop: '6px' }}>
                  Below 75.0% Mandatory Cutoff
                </div>
              </div>

              {/* Card 6: Active Mentors */}
              <div
                style={{
                  backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                  border: `1px solid ${isDarkMode ? '#334155' : '#E2E8F0'}`,
                  borderRadius: '14px',
                  padding: '1.15rem 1.25rem',
                  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600 }}>Faculty Mentors</div>
                    <div style={{ fontSize: '1.65rem', fontWeight: 800, marginTop: '2px', color: '#8B5CF6' }}>
                      {summaryData.active_mentors_count || 3} Mentors
                    </div>
                  </div>
                  <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#FAF5FF', color: '#8B5CF6' }}>
                    <ShieldCheck size={20} />
                  </div>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '6px' }}>
                  {summaryData.open_interventions_count || 9} Active Action Items
                </div>
              </div>
            </div>

            {/* MENTOR SCOPE SWITCHER BAR */}
            <div
              style={{
                backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                border: `1px solid ${isDarkMode ? '#334155' : '#E2E8F0'}`,
                borderRadius: '14px',
                padding: '0.9rem 1.25rem',
                marginBottom: '1.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.80rem', fontWeight: 700, color: '#64748B' }}>
                  Faculty Mentor Scope:
                </span>
                <button
                  onClick={() => { setMentorFilter('ALL'); setCurrentPage(1); }}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    border: mentorFilter === 'ALL' ? '2px solid #1E6BFF' : `1px solid ${isDarkMode ? '#334155' : '#CBD5E1'}`,
                    backgroundColor: mentorFilter === 'ALL' ? '#EFF6FF' : 'transparent',
                    color: mentorFilter === 'ALL' ? '#1E6BFF' : isDarkMode ? '#FFFFFF' : '#475569',
                    cursor: 'pointer',
                  }}
                >
                  All Faculty Mentors
                </button>
                {activeMentorsDisplay.map((m) => (
                  <button
                    key={m.name}
                    onClick={() => { setMentorFilter(m.name); setCurrentPage(1); }}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      border: mentorFilter === m.name ? '2px solid #1E6BFF' : `1px solid ${isDarkMode ? '#334155' : '#CBD5E1'}`,
                      backgroundColor: mentorFilter === m.name ? '#EFF6FF' : 'transparent',
                      color: mentorFilter === m.name ? '#1E6BFF' : isDarkMode ? '#FFFFFF' : '#475569',
                      cursor: 'pointer',
                    }}
                  >
                    {m.name} ({m.assigned_students_count || 3} assigned)
                  </button>
                ))}
              </div>
            </div>

            {/* ===================================================================
                DIFFERENTIATOR 1: STUDENT SUCCESS DIGITAL TWIN
                =================================================================== */}
            <div
              id="digital-twin-section"
              style={{
                backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                borderRadius: '16px',
                border: `1px solid ${isDarkMode ? '#334155' : '#E2E8F0'}`,
                padding: '1.5rem',
                boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
                marginBottom: '1.75rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Compass size={20} style={{ color: '#1E6BFF' }} />
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                      Differentiator 1: Student Success Digital Twin
                    </h2>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                    Telemetry visualization mapping student performance, attendance, and risk classification across 2D visual dimensions.
                  </span>
                </div>
              </div>

              <StudentDigitalTwin
                students={digitalTwinStudents.length > 0 ? digitalTwinStudents : cohortStudents}
                aggregations={digitalTwinAggregations}
                totalDatabaseRecords={summaryData.total_students || 50008}
                isLoading={isLoadingDigitalTwin}
                mode={digitalTwinMode}
                onModeChange={setDigitalTwinMode}
                isDarkMode={isDarkMode}
                onStudentSelect={(st) => setSelectedStudent(st)}
                activeRiskFilter={riskFilter}
                onRiskFilterChange={(risk) => {
                  setRiskFilter(risk);
                  setCurrentPage(1);
                }}
                currentMentor={mentorFilter}
                currentCohort={recordTypeFilter}
                onResetFilters={() => {
                  setRiskFilter('ALL');
                  setAcademicRiskFilter('ALL');
                  setPlacementRiskFilter('ALL');
                  setCurrentPage(1);
                }}
              />
            </div>

            {/* ===================================================================
                DIFFERENTIATOR 2: DECOUPLED RISK INTELLIGENCE MATRIX
                =================================================================== */}
            <div
              id="decoupled-risk-section"
              style={{
                backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                borderRadius: '16px',
                border: `1px solid ${isDarkMode ? '#334155' : '#E2E8F0'}`,
                padding: '1.5rem',
                boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
                marginBottom: '1.75rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Layers size={20} style={{ color: '#8B5CF6' }} />
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                      Differentiator 2: Decoupled Risk Intelligence Matrix
                    </h2>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                    Separating Academic Risk (Backlogs, Attendance, Exam GPA) from Placement Risk (Coding, DSA, Aptitude).
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                {/* Quadrant 1: Star Performers */}
                <div
                  onClick={() => { setAcademicRiskFilter('LOW'); setPlacementRiskFilter('LOW'); setCurrentPage(1); }}
                  style={{
                    padding: '1.25rem',
                    borderRadius: '12px',
                    backgroundColor: academicRiskFilter === 'LOW' && placementRiskFilter === 'LOW' ? '#ECFDF5' : isDarkMode ? '#0F172A' : '#F8FAFC',
                    border: '1px solid #10B981',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#059669' }}>
                      🌟 Star Tier-1 Candidates
                    </span>
                    <span style={{ padding: '2px 8px', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 700, backgroundColor: '#D1FAE5', color: '#065F46' }}>
                      Low / Low
                    </span>
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#64748B', lineHeight: 1.4 }}>
                    High academic standing and ready for corporate technical interviews. Zero remediation required.
                  </div>
                </div>

                {/* Quadrant 2: High Academic / Low Placement */}
                <div
                  onClick={() => { setAcademicRiskFilter('HIGH'); setPlacementRiskFilter('LOW'); setCurrentPage(1); }}
                  style={{
                    padding: '1.25rem',
                    borderRadius: '12px',
                    backgroundColor: academicRiskFilter === 'HIGH' && placementRiskFilter === 'LOW' ? '#FFFBEB' : isDarkMode ? '#0F172A' : '#F8FAFC',
                    border: '1px solid #F59E0B',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#D97706' }}>
                      ⚡ Coding Wizards (Arrear Risk)
                    </span>
                    <span style={{ padding: '2px 8px', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 700, backgroundColor: '#FEF3C7', color: '#92400E' }}>
                      High Acad / Low Plac
                    </span>
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#64748B', lineHeight: 1.4 }}>
                    Exceptional DSA & hackathon proficiency but failing attendance or core theory subjects.
                  </div>
                </div>

                {/* Quadrant 3: Low Academic / High Placement (Skill Gap) */}
                <div
                  onClick={() => { setAcademicRiskFilter('LOW'); setPlacementRiskFilter('HIGH'); setCurrentPage(1); }}
                  style={{
                    padding: '1.25rem',
                    borderRadius: '12px',
                    backgroundColor: academicRiskFilter === 'LOW' && placementRiskFilter === 'HIGH' ? '#EFF6FF' : isDarkMode ? '#0F172A' : '#F8FAFC',
                    border: '1px solid #1E6BFF',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#1E6BFF' }}>
                      🎯 Exam Toppers (Skill Gap)
                    </span>
                    <span style={{ padding: '2px 8px', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 700, backgroundColor: '#DBEAFE', color: '#1E40AF' }}>
                      Low Acad / High Plac
                    </span>
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#64748B', lineHeight: 1.4 }}>
                    High CGPA (8.0+) but deficient in DSA, coding speed, and communication. Prime bootcamp targets.
                  </div>
                </div>

                {/* Quadrant 4: Critical Dual-Risk */}
                <div
                  onClick={() => { setAcademicRiskFilter('HIGH'); setPlacementRiskFilter('HIGH'); setCurrentPage(1); }}
                  style={{
                    padding: '1.25rem',
                    borderRadius: '12px',
                    backgroundColor: academicRiskFilter === 'HIGH' && placementRiskFilter === 'HIGH' ? '#FEF2F2' : isDarkMode ? '#0F172A' : '#F8FAFC',
                    border: '1px solid #EF4444',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#DC2626' }}>
                      🚨 Critical Dual-Risk Cohort
                    </span>
                    <span style={{ padding: '2px 8px', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 700, backgroundColor: '#FEE2E2', color: '#991B1B' }}>
                      High / High
                    </span>
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#64748B', lineHeight: 1.4 }}>
                    Facing probation and unplaced. Requires immediate mandatory mentor assignment and attendance recovery.
                  </div>
                </div>
              </div>
            </div>

            {/* ===================================================================
                DIFFERENTIATOR 3: INTERVENTION IMPACT SIMULATOR
                =================================================================== */}
            <div
              id="intervention-simulator-section"
              style={{
                backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                borderRadius: '16px',
                border: `1px solid ${isDarkMode ? '#334155' : '#E2E8F0'}`,
                padding: '1.5rem',
                boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
                marginBottom: '1.75rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sliders size={20} style={{ color: '#F97316' }} />
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                      Differentiator 3: Intervention Impact Simulator
                    </h2>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                    Resource-constrained cohort modeling with dynamic ROI calculation.
                  </span>
                </div>
                <button
                  onClick={handleRunSimulation}
                  disabled={isSimulating}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    backgroundColor: '#F97316',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: isSimulating ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isSimulating ? 'Simulating...' : 'Recalculate Projections ⟳'}
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '1.25rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.80rem', fontWeight: 600, marginBottom: '4px' }}>
                    <span>Attendance Remedial Campaign:</span>
                    <strong>+{simAttendanceBoost}%</strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    step="1"
                    value={simAttendanceBoost}
                    onChange={(e) => setSimAttendanceBoost(parseFloat(e.target.value))}
                    style={{ width: '100%', accentColor: '#F97316' }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.80rem', fontWeight: 600, marginBottom: '4px' }}>
                    <span>DSA & Coding Bootcamps:</span>
                    <strong>+{simDsaBoost} pts</strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="3.0"
                    step="0.1"
                    value={simDsaBoost}
                    onChange={(e) => setSimDsaBoost(parseFloat(e.target.value))}
                    style={{ width: '100%', accentColor: '#F97316' }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.80rem', fontWeight: 600, marginBottom: '4px' }}>
                    <span>LMS Engagement Drive:</span>
                    <strong>+{simLmsBoost}%</strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    step="2"
                    value={simLmsBoost}
                    onChange={(e) => setSimLmsBoost(parseFloat(e.target.value))}
                    style={{ width: '100%', accentColor: '#F97316' }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.80rem', fontWeight: 600, marginBottom: '4px' }}>
                    <span>Faculty Mentor Slots:</span>
                    <strong>{simMentorCapacity} Students</strong>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={simMentorCapacity}
                    onChange={(e) => setSimMentorCapacity(parseInt(e.target.value, 10))}
                    style={{ width: '100%', accentColor: '#F97316' }}
                  />
                </div>
              </div>

              {/* Simulation Projected Impact Cards */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem',
                  padding: '1.25rem',
                  borderRadius: '12px',
                  backgroundColor: isDarkMode ? '#0F172A' : '#FFF7ED',
                  border: '1px solid #FFEDD5',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#9A3412', fontWeight: 600 }}>Students Rescued</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#EA580C' }}>
                    {simResults.students_rescued_count} Students
                  </div>
                  <div style={{ fontSize: '0.70rem', color: '#64748B' }}>De-risked from Academic & Placement Failure</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: '#9A3412', fontWeight: 600 }}>Projected Readiness Gain</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10B981' }}>
                    +{simResults.readiness_improvement_pct}%
                  </div>
                  <div style={{ fontSize: '0.70rem', color: '#64748B' }}>In Corporate Eligibility Conversion</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: '#9A3412', fontWeight: 600 }}>Cohort Avg Score Delta</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1E6BFF' }}>
                    +{simResults.score_improvement} pts
                  </div>
                  <div style={{ fontSize: '0.70rem', color: '#64748B' }}>Across 6 Weighted Success Dimensions</div>
                </div>
              </div>
            </div>

            {/* ===================================================================
                DIFFERENTIATOR 4: EXPLAINABLE SUCCESS SCORE ARCHITECTURE
                =================================================================== */}
            <div
              style={{
                backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                borderRadius: '16px',
                border: `1px solid ${isDarkMode ? '#334155' : '#E2E8F0'}`,
                padding: '1.5rem',
                boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
                marginBottom: '1.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                <CheckCircle2 size={20} style={{ color: '#10B981' }} />
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                  Differentiator 4: Explainable Student Success Score (0–100)
                </h2>
              </div>
              <p style={{ fontSize: '0.80rem', color: '#64748B', margin: 0, marginBottom: '1rem' }}>
                No black boxes: Every student's score is a mathematically provable composite of 6 educational dimensions.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                {[
                  { name: 'Academic Foundation', weight: '35%', desc: 'CGPA & Backlog penalty' },
                  { name: 'Placement Readiness', weight: '20%', desc: 'DSA, Aptitude, Coding Speed' },
                  { name: 'Attendance & Diligence', weight: '15%', desc: 'Class attendance velocity' },
                  { name: 'LMS Course Velocity', weight: '12%', desc: 'Assignment completion rate' },
                  { name: 'Technical Depth', weight: '10%', desc: 'System design & communication' },
                  { name: 'Applied Innovation', weight: '8%', desc: 'Hackathons & certifications' },
                ].map((dim) => (
                  <div
                    key={dim.name}
                    style={{
                      padding: '1rem',
                      borderRadius: '10px',
                      backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC',
                      border: `1px solid ${isDarkMode ? '#334155' : '#E2E8F0'}`,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <strong style={{ fontSize: '0.82rem' }}>{dim.name}</strong>
                      <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#1E6BFF' }}>{dim.weight}</span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{dim.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ===================================================================
                DIFFERENTIATOR 5: GUIDED AT-RISK RECOVERY DEMO
                =================================================================== */}
            <div
              id="walkthrough-section"
              style={{
                backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                borderRadius: '16px',
                border: '2px solid #3B82F6',
                padding: '1.5rem',
                boxShadow: '0 4px 20px rgba(59, 130, 246, 0.1)',
                marginBottom: '1.75rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={20} style={{ color: '#3B82F6' }} />
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                    Differentiator 5: Guided At-Risk Recovery Walkthrough
                  </h2>
                </div>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, padding: '3px 10px', borderRadius: '9999px', backgroundColor: '#EFF6FF', color: '#1E6BFF' }}>
                  Step {walkthroughStep} of 5
                </span>
              </div>

              {/* 5-Step Progress Indicators */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginBottom: '1.25rem' }}>
                {[
                  { num: 1, title: '1. Detect At-Risk' },
                  { num: 2, title: '2. Root Diagnosis' },
                  { num: 3, title: '3. Assign Mentor' },
                  { num: 4, title: '4. Prescribe Tasks' },
                  { num: 5, title: '5. Projected Recovery' },
                ].map((st) => (
                  <button
                    key={st.num}
                    onClick={() => setWalkthroughStep(st.num)}
                    style={{
                      padding: '8px 4px',
                      borderRadius: '8px',
                      border: walkthroughStep === st.num ? '2px solid #1E6BFF' : '1px solid #E2E8F0',
                      backgroundColor: walkthroughStep === st.num ? '#EFF6FF' : 'transparent',
                      color: walkthroughStep === st.num ? '#1E6BFF' : '#64748B',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {st.title}
                  </button>
                ))}
              </div>

              {/* Step Detail Content */}
              <div
                style={{
                  padding: '1.25rem',
                  borderRadius: '12px',
                  backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC',
                  border: `1px solid ${isDarkMode ? '#334155' : '#E2E8F0'}`,
                }}
              >
                {walkthroughStep === 1 && (
                  <div>
                    <h3 style={{ fontSize: '0.94rem', fontWeight: 700, margin: '0 0 6px 0', color: '#EF4444' }}>
                      Step 1: Early At-Risk Detection (Student: Rajesh Kumar, STU-2024-001)
                    </h3>
                    <p style={{ fontSize: '0.80rem', color: '#64748B', margin: 0, lineHeight: 1.5 }}>
                      The early warning engine flagged <strong>Rajesh Kumar (CSE)</strong> with a Success Score of <strong>51.4 / 100</strong> and <strong>High Academic Risk</strong> probability of 0.78.
                    </p>
                  </div>
                )}
                {walkthroughStep === 2 && (
                  <div>
                    <h3 style={{ fontSize: '0.94rem', fontWeight: 700, margin: '0 0 6px 0', color: '#F59E0B' }}>
                      Step 2: Transparent Driver Diagnosis
                    </h3>
                    <p style={{ fontSize: '0.80rem', color: '#64748B', margin: 0, lineHeight: 1.5 }}>
                      Identified Risk Drivers: Attendance shortage (<strong>68.0%</strong> &lt; 75.0% threshold), <strong>2 active arrears/backlogs</strong>, and DSA proficiency gap (score: 4.2 / 10).
                    </p>
                  </div>
                )}
                {walkthroughStep === 3 && (
                  <div>
                    <h3 style={{ fontSize: '0.94rem', fontWeight: 700, margin: '0 0 6px 0', color: '#1E6BFF' }}>
                      Step 3: Governance & Mentor Allocation
                    </h3>
                    <p style={{ fontSize: '0.80rem', color: '#64748B', margin: 0, lineHeight: 1.5 }}>
                      Assigned to <strong>Prof. Rajesh Kumar (CSE Department Head)</strong> with automated calendar notification and weekly check-in mandates.
                    </p>
                  </div>
                )}
                {walkthroughStep === 4 && (
                  <div>
                    <h3 style={{ fontSize: '0.94rem', fontWeight: 700, margin: '0 0 6px 0', color: '#8B5CF6' }}>
                      Step 4: Targeted Prescriptive Interventions
                    </h3>
                    <p style={{ fontSize: '0.80rem', color: '#64748B', margin: 0, lineHeight: 1.5 }}>
                      Active interventions created: "Urgent Attendance Counseling & Arrears Remedial" + "Complete LeetCode Top 50 Practice Set" (Status: OPEN).
                    </p>
                  </div>
                )}
                {walkthroughStep === 5 && (
                  <div>
                    <h3 style={{ fontSize: '0.94rem', fontWeight: 700, margin: '0 0 6px 0', color: '#10B981' }}>
                      Step 5: Simulated Recovery Trajectory
                    </h3>
                    <p style={{ fontSize: '0.80rem', color: '#64748B', margin: 0, lineHeight: 1.5 }}>
                      Upon attending 4 remedial classes (+14% attendance) and completing the DSA bootcamp (+2.5 pts), projected success score climbs from <strong>51.4 → 74.8</strong>, moving the student safely to <strong>Good Standing / Placement Ready</strong>.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* ===================================================================
                SECTION C: COMPLETE STUDENT DIRECTORY & ROSTER EXPLORER
                =================================================================== */}
            <div
              id="student-directory-section"
              style={{
                backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                borderRadius: '16px',
                border: `1px solid ${isDarkMode ? '#334155' : '#E2E8F0'}`,
                padding: '1.5rem',
                boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
                marginBottom: '1.75rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                    Student Directory & Analytics Roster
                  </h2>
                  <span style={{ fontSize: '0.80rem', color: '#64748B' }}>
                    Displaying {((currentPage - 1) * pageSize) + 1}–{Math.min(currentPage * pageSize, totalRecords).toLocaleString()} of {totalRecords.toLocaleString()} Student Records · Page {currentPage} of {totalPages.toLocaleString()} · {summaryData.total_students ? summaryData.total_students.toLocaleString() : '50,008'} Total in Database
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setAddStudentModalOpen(true)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      backgroundColor: '#1E6BFF',
                      color: '#FFFFFF',
                      border: 'none',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    + Enroll Student
                  </button>
                  <button
                    onClick={() => setAddFacultyModalOpen(true)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      backgroundColor: '#8B5CF6',
                      color: '#FFFFFF',
                      border: 'none',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    + Enroll Faculty
                  </button>
                  <button
                    onClick={() => setAddPlacementOfficerModalOpen(true)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      backgroundColor: '#D97706',
                      color: '#FFFFFF',
                      border: 'none',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    + Enroll Placement Officer
                  </button>
                  <button
                    onClick={handleExportCSV}
                    disabled={isExporting}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      backgroundColor: isDarkMode ? '#0F172A' : '#F1F5F9',
                      color: isDarkMode ? '#FFFFFF' : '#0F172A',
                      border: `1px solid ${isDarkMode ? '#334155' : '#CBD5E1'}`,
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: isExporting ? 'wait' : 'pointer',
                      opacity: isExporting ? 0.7 : 1,
                    }}
                  >
                    {isExporting ? 'Exporting...' : 'Export CSV'}
                  </button>
                </div>
              </div>

              {/* Multi-Domain Filters */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1.25rem' }}>
                <select
                  value={deptFilter}
                  onChange={(e) => { setDeptFilter(e.target.value); setCurrentPage(1); }}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '8px',
                    fontSize: '0.80rem',
                    border: `1px solid ${isDarkMode ? '#334155' : '#CBD5E1'}`,
                    backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC',
                    color: isDarkMode ? '#FFFFFF' : '#0F172A',
                  }}
                >
                  <option value="ALL">All Departments</option>
                  <option value="Computer Science">Computer Science & Engineering</option>
                  <option value="Electronics">Electronics & Communication</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Mechanical">Mechanical Engineering</option>
                  <option value="Civil">Civil Engineering</option>
                  <option value="Electrical">Electrical & Electronics</option>
                </select>

                <select
                  value={riskFilter}
                  onChange={(e) => { setRiskFilter(e.target.value); setCurrentPage(1); }}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '8px',
                    fontSize: '0.80rem',
                    border: `1px solid ${isDarkMode ? '#334155' : '#CBD5E1'}`,
                    backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC',
                    color: isDarkMode ? '#FFFFFF' : '#0F172A',
                  }}
                >
                  <option value="ALL">All Risk Bands</option>
                  <option value="HIGH">High Risk</option>
                  <option value="MEDIUM">Medium Risk</option>
                  <option value="LOW">Low Risk</option>
                </select>

                <select
                  value={attendanceRangeFilter}
                  onChange={(e) => { setAttendanceRangeFilter(e.target.value); setCurrentPage(1); }}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '8px',
                    fontSize: '0.80rem',
                    border: `1px solid ${isDarkMode ? '#334155' : '#CBD5E1'}`,
                    backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC',
                    color: isDarkMode ? '#FFFFFF' : '#0F172A',
                  }}
                >
                  <option value="ALL">All Attendance</option>
                  <option value="<75">&lt; 75% (Shortage)</option>
                  <option value="75-85">75% – 85%</option>
                  <option value=">85">&gt; 85% (Optimal)</option>
                </select>

                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.78rem', color: '#64748B' }}>Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    style={{
                      padding: '5px 8px',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      border: `1px solid ${isDarkMode ? '#334155' : '#CBD5E1'}`,
                      backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC',
                      color: isDarkMode ? '#FFFFFF' : '#0F172A',
                    }}
                  >
                    <option value="success_score">Success Score</option>
                    <option value="cgpa">CGPA</option>
                    <option value="attendance">Attendance</option>
                    <option value="backlogs">Backlogs</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                    style={{
                      padding: '5px 8px',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      border: `1px solid ${isDarkMode ? '#334155' : '#CBD5E1'}`,
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      color: isDarkMode ? '#FFFFFF' : '#0F172A',
                    }}
                  >
                    {sortOrder === 'desc' ? '▼ Desc' : '▲ Asc'}
                  </button>
                </div>
              </div>

              {/* Student Table */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${isDarkMode ? '#334155' : '#F1F5F9'}`, textAlign: 'left', color: '#64748B' }}>
                      <th style={{ padding: '10px 8px' }}>Student</th>
                      <th style={{ padding: '10px 8px' }}>Provenance</th>
                      <th style={{ padding: '10px 8px' }}>Department</th>
                      <th style={{ padding: '10px 8px' }}>CGPA</th>
                      <th style={{ padding: '10px 8px' }}>Attendance</th>
                      <th style={{ padding: '10px 8px' }}>Score</th>
                      <th style={{ padding: '10px 8px' }}>Academic Risk</th>
                      <th style={{ padding: '10px 8px' }}>Placement Risk</th>
                      <th style={{ padding: '10px 8px' }}>Assigned Mentor</th>
                      <th style={{ padding: '10px 8px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoadingStudents ? (
                      <tr>
                        <td colSpan="10" style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8' }}>
                          Loading student intelligence telemetry...
                        </td>
                      </tr>
                    ) : cohortStudents.length === 0 ? (
                      <tr>
                        <td colSpan="10" style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8' }}>
                          No student records matching current filters.
                        </td>
                      </tr>
                    ) : (
                      cohortStudents.map((s) => (
                        <tr
                          key={s.id}
                          style={{
                            borderBottom: `1px solid ${isDarkMode ? '#334155' : '#F8FAFC'}`,
                            backgroundColor: selectedStudent?.id === s.id ? (isDarkMode ? '#0F172A' : '#EFF6FF') : 'transparent',
                          }}
                        >
                          <td style={{ padding: '12px 8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <StudentAvatar
                              src={s.avatar}
                              name={s.name}
                              id={s.id}
                              size={30}
                            />
                            <div>
                              <div style={{ fontWeight: 700 }}>{s.name}</div>
                              <div style={{ fontSize: '0.70rem', color: '#94A3B8' }}>{s.id}</div>
                            </div>
                          </td>

                          {/* Provenance Badge */}
                          <td style={{ padding: '12px 8px' }}>
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: '9999px',
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                backgroundColor: s.recordType === 'verified_profile' ? '#ECFDF5' : '#F1F5F9',
                                color: s.recordType === 'verified_profile' ? '#059669' : '#475569',
                                border: `1px solid ${s.recordType === 'verified_profile' ? '#A7F3D0' : '#CBD5E1'}`,
                              }}
                            >
                              {s.recordType === 'verified_profile' ? 'Verified (100%)' : 'Benchmark (94%)'}
                            </span>
                          </td>

                          <td style={{ padding: '12px 8px', fontWeight: 600 }}>{s.department}</td>
                          <td style={{ padding: '12px 8px', fontWeight: 700 }}>{s.cgpa}</td>
                          <td style={{ padding: '12px 8px', color: s.attendance < 75 ? '#EF4444' : '#10B981', fontWeight: 600 }}>
                            {s.attendance}%
                          </td>
                          <td style={{ padding: '12px 8px' }}>
                            <span
                              style={{
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontWeight: 700,
                                fontSize: '0.74rem',
                                backgroundColor: s.successScore >= 80 ? '#ECFDF5' : s.successScore >= 65 ? '#EFF6FF' : '#FEF2F2',
                                color: s.successScore >= 80 ? '#059669' : s.successScore >= 65 ? '#1E6BFF' : '#DC2626',
                              }}
                            >
                              {s.successScore}
                            </span>
                          </td>
                          <td style={{ padding: '12px 8px' }}>
                            <span
                              style={{
                                padding: '3px 8px',
                                borderRadius: '9999px',
                                fontSize: '0.70rem',
                                fontWeight: 700,
                                backgroundColor: s.academicRisk === 'HIGH' ? '#FEF2F2' : s.academicRisk === 'MEDIUM' ? '#FFFBEB' : '#ECFDF5',
                                color: s.academicRisk === 'HIGH' ? '#DC2626' : s.academicRisk === 'MEDIUM' ? '#D97706' : '#059669',
                              }}
                            >
                              {s.academicRisk}
                            </span>
                          </td>
                          <td style={{ padding: '12px 8px' }}>
                            <span
                              style={{
                                padding: '3px 8px',
                                borderRadius: '9999px',
                                fontSize: '0.70rem',
                                fontWeight: 700,
                                backgroundColor:
                                  s.placementRisk === 'HIGH'
                                    ? '#FEF2F2'
                                    : s.placementRisk === 'MEDIUM'
                                    ? '#FAF5FF'
                                    : s.placementRisk === 'LOW'
                                    ? '#ECFDF5'
                                    : '#F1F5F9',
                                color:
                                  s.placementRisk === 'HIGH'
                                    ? '#DC2626'
                                    : s.placementRisk === 'MEDIUM'
                                    ? '#7C3AED'
                                    : s.placementRisk === 'LOW'
                                    ? '#059669'
                                    : '#64748B',
                                border:
                                  s.placementRisk === 'NOT_ASSESSED' || s.placementRisk === 'UNKNOWN'
                                    ? '1px dashed #CBD5E1'
                                    : 'none',
                              }}
                            >
                              {s.placementRisk || 'NOT_ASSESSED'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 8px' }}>
                            <select
                              value={s.assignedMentor || 'Prof. Rajesh Kumar'}
                              onChange={(e) => handleAssignMentor(s.id, e.target.value)}
                              style={{
                                padding: '4px 6px',
                                borderRadius: '6px',
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                backgroundColor: isDarkMode ? '#0F172A' : '#F1F5F9',
                                color: isDarkMode ? '#F8FAFC' : '#0F172A',
                                border: `1px solid ${isDarkMode ? '#334155' : '#CBD5E1'}`,
                                cursor: 'pointer',
                              }}
                            >
                              {activeMentorsDisplay.map((m) => (
                                <option key={m.id || m.name} value={m.name}>
                                  {m.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                            <button
                              onClick={() => setSelectedStudent(s)}
                              style={{
                                padding: '4px 10px',
                                borderRadius: '6px',
                                backgroundColor: '#1E6BFF',
                                color: '#FFFFFF',
                                border: 'none',
                                fontSize: '0.74rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Directory Roster Pagination & Navigation Controls */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                  marginTop: '1.25rem',
                  paddingTop: '1rem',
                  borderTop: `1px solid ${isDarkMode ? '#334155' : '#F1F5F9'}`,
                  fontSize: '0.80rem',
                  color: '#64748B',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>
                    Showing <strong>{((currentPage - 1) * pageSize) + 1}–{Math.min(currentPage * pageSize, totalRecords).toLocaleString()}</strong> of <strong>{totalRecords.toLocaleString()}</strong> students
                  </span>
                  <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>•</span>
                  <span style={{ fontSize: '0.74rem' }}>
                    {rosterCounts.verified_profiles || 8} verified profiles · {(rosterCounts.anonymous_cohort || 50000).toLocaleString()} benchmark records
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {/* Page Size Selector */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.76rem' }}>
                    <span>Rows:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      style={{
                        padding: '3px 6px',
                        borderRadius: '6px',
                        fontSize: '0.74rem',
                        border: `1px solid ${isDarkMode ? '#334155' : '#CBD5E1'}`,
                        backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
                        color: isDarkMode ? '#FFFFFF' : '#0F172A',
                      }}
                    >
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>

                  {/* Previous Page Button */}
                  <button
                    type="button"
                    disabled={currentPage <= 1 || isLoadingStudents}
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: `1px solid ${isDarkMode ? '#334155' : '#CBD5E1'}`,
                      backgroundColor: currentPage <= 1 ? (isDarkMode ? '#1E293B' : '#F1F5F9') : '#1E6BFF',
                      color: currentPage <= 1 ? '#94A3B8' : '#FFFFFF',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    ◀ Prev
                  </button>

                  {/* Page Indicator */}
                  <span style={{ fontSize: '0.76rem', fontWeight: 600, color: isDarkMode ? '#FFFFFF' : '#0F172A' }}>
                    Page {currentPage} of {totalPages.toLocaleString()}
                  </span>

                  {/* Next Page Button */}
                  <button
                    type="button"
                    disabled={currentPage >= totalPages || isLoadingStudents}
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: `1px solid ${isDarkMode ? '#334155' : '#CBD5E1'}`,
                      backgroundColor: currentPage >= totalPages ? (isDarkMode ? '#1E293B' : '#F1F5F9') : '#1E6BFF',
                      color: currentPage >= totalPages ? '#94A3B8' : '#FFFFFF',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Next ▶
                  </button>
                </div>
              </div>

              {/* 360-DEGREE STUDENT DETAIL DRAWER */}
              {selectedStudent && (
                <div
                  style={{
                    marginTop: '1.5rem',
                    padding: '1.5rem',
                    borderRadius: '14px',
                    backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC',
                    border: '2px solid #1E6BFF',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <StudentAvatar
                        src={selectedStudent.avatar}
                        name={selectedStudent.name}
                        id={selectedStudent.id}
                        size={48}
                      />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                            {selectedStudent.name}
                          </h3>
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '9999px', backgroundColor: '#ECFDF5', color: '#065F46' }}>
                            Data Completeness: {selectedStudent.dataCompleteness || 100}%
                          </span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                          Roll ID: <strong>{selectedStudent.id}</strong> • {selectedStudent.department} • Assigned to <strong>{selectedStudent.assignedMentor || 'Prof. Rajesh Kumar'}</strong>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedStudent(null)}
                      style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '1.2rem' }}
                    >
                      ✕
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF', border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Success Score</div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1E6BFF' }}>{selectedStudent.successScore} / 100</div>
                    </div>
                    <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF', border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: '0.72rem', color: '#64748B' }}>CGPA & Backlogs</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{selectedStudent.cgpa} CGPA • {selectedStudent.backlogs || 0} Backlogs</div>
                    </div>
                    <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF', border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Attendance Rate</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: selectedStudent.attendance < 75 ? '#EF4444' : '#10B981' }}>
                        {selectedStudent.attendance}%
                      </div>
                    </div>
                    <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF', border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: '0.72rem', color: '#64748B' }}>DSA & Coding Speed</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{selectedStudent.codingSkills || 7.0} / 10</div>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.80rem', color: '#475569', padding: '10px', borderRadius: '8px', backgroundColor: '#EFF6FF', border: '1px solid #DBEAFE' }}>
                    <strong>Key Identified Risk Factor:</strong> {selectedStudent.topRiskFactor || 'None (On-track Tier-1 candidate)'}
                  </div>
                </div>
              )}
            </div>

            {/* ===================================================================
                SECTION E: AUDITED MODEL INTELLIGENCE & TRANSPARENCY
                =================================================================== */}
            <div
              id="model-intelligence-section"
              style={{
                backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                borderRadius: '16px',
                border: `1px solid ${isDarkMode ? '#334155' : '#E2E8F0'}`,
                padding: '1.5rem',
                boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                <Zap size={20} style={{ color: '#EC4899' }} />
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                  Model Intelligence & Architecture Transparency
                </h2>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
                <div style={{ padding: '1.25rem', borderRadius: '12px', backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC', border: `1px solid ${isDarkMode ? '#334155' : '#E2E8F0'}` }}>
                  <div style={{ fontWeight: 800, fontSize: '0.94rem', marginBottom: '4px' }}>
                    Placement Risk Classifier (LightGBM)
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#64748B', marginBottom: '8px' }}>
                    Artifact: <code>placement_risk_model.joblib</code> (Cutoff Threshold: 0.35)
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#475569', lineHeight: 1.5 }}>
                    Evaluates multi-domain employability features: CGPA (0.28), Coding proficiency (0.24), DSA (0.20), Aptitude (0.14), Soft skills (0.08).
                  </div>
                </div>

                <div style={{ padding: '1.25rem', borderRadius: '12px', backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC', border: `1px solid ${isDarkMode ? '#334155' : '#E2E8F0'}` }}>
                  <div style={{ fontWeight: 800, fontSize: '0.94rem', marginBottom: '4px' }}>
                    Academic Risk Multi-Factor Policy Engine
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#D97706', marginBottom: '8px' }}>
                    Audited: Rule-Governed Telemetry Engine (Prevents Data Leakage)
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#475569', lineHeight: 1.5 }}>
                    Code audit revealed identical binary checksums between placement and academic joblib files. Academic risk is therefore computed with high-integrity institutional policy rules (backlogs &ge; 2, attendance &lt; 75%, CGPA &lt; 6.5).
                  </div>
                </div>
              </div>
            </div>
              </>
            )}
          </main>
        </div>
      </div>

      {/* =========================================================================
          MODAL: ENROLL STUDENT
          ========================================================================= */}
      {addStudentModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 110,
            padding: '1.5rem',
          }}
        >
          <div
            style={{
              backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
              borderRadius: '20px',
              width: '540px',
              maxWidth: '95vw',
              padding: '2rem',
              boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
              border: `1px solid ${isDarkMode ? '#334155' : '#E2E8F0'}`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Enroll New Student Record</h3>
                <span style={{ fontSize: '0.80rem', color: '#64748B' }}>Persists directly into SQLite with 100% verified provenance</span>
              </div>
              <button onClick={() => setAddStudentModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '1.2rem' }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleEnrollStudent} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px' }}>Roll / Registration ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. STU-2024-150"
                  value={newStudentRoll}
                  onChange={(e) => setNewStudentRoll(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.86rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px' }}>Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Meera Nair"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.86rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px' }}>Department</label>
                  <select
                    value={newStudentDept}
                    onChange={(e) => setNewStudentDept(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.86rem' }}
                  >
                    <option value="Computer Science & Engineering">CSE</option>
                    <option value="Electronics & Communication">ECE</option>
                    <option value="Information Technology">IT</option>
                    <option value="Mechanical Engineering">MECH</option>
                    <option value="Civil Engineering">CIVIL</option>
                    <option value="Electrical & Electronics">EEE</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px' }}>Assigned Faculty Mentor</label>
                  <select
                    value={newStudentMentor}
                    onChange={(e) => setNewStudentMentor(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.86rem' }}
                  >
                    {activeMentorsDisplay.map((m) => (
                      <option key={m.id || m.name} value={m.name}>
                        {m.name} ({m.department || 'Faculty'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px' }}>CGPA (0–10)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    required
                    value={newStudentCgpa}
                    onChange={(e) => setNewStudentCgpa(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.86rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px' }}>Attendance %</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    required
                    value={newStudentAtt}
                    onChange={(e) => setNewStudentAtt(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.86rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px' }}>Backlogs</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    required
                    value={newStudentBacklogs}
                    onChange={(e) => setNewStudentBacklogs(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.86rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setAddStudentModalOpen(false)}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #CBD5E1', background: 'transparent', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={enrollSubmitting}
                  style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#1E6BFF', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
                >
                  {enrollSubmitting ? 'Enrolling...' : 'Persist & Enroll'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* =========================================================================
          MODAL: ENROLL FACULTY / MENTOR
          ========================================================================= */}
      {addFacultyModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 110,
            padding: '1.5rem',
          }}
        >
          <div
            style={{
              backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
              borderRadius: '20px',
              width: '560px',
              maxWidth: '95vw',
              padding: '2rem',
              boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
              border: `1px solid ${isDarkMode ? '#334155' : '#E2E8F0'}`,
              color: isDarkMode ? '#FFFFFF' : '#0F172A',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(139, 92, 246, 0.15)',
                    color: '#8B5CF6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Award size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Enroll Faculty / Mentor</h3>
                  <span style={{ fontSize: '0.80rem', color: '#64748B' }}>Adds faculty to institutional mentorship governance</span>
                </div>
              </div>
              <button
                onClick={() => setAddFacultyModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEnrollFaculty} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px' }}>
                  Faculty / Staff ID *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FAC-CSE-105"
                  value={facultyStaffId}
                  onChange={(e) => setFacultyStaffId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${isDarkMode ? '#475569' : '#CBD5E1'}`,
                    backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
                    color: isDarkMode ? '#FFFFFF' : '#0F172A',
                    fontSize: '0.86rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px' }}>
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Arvind"
                    value={facultyFirstName}
                    onChange={(e) => setFacultyFirstName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: `1px solid ${isDarkMode ? '#475569' : '#CBD5E1'}`,
                      backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
                      color: isDarkMode ? '#FFFFFF' : '#0F172A',
                      fontSize: '0.86rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px' }}>
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nair"
                    value={facultyLastName}
                    onChange={(e) => setFacultyLastName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: `1px solid ${isDarkMode ? '#475569' : '#CBD5E1'}`,
                      backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
                      color: isDarkMode ? '#FFFFFF' : '#0F172A',
                      fontSize: '0.86rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px' }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. arvind.nair@codebuffet.edu"
                    value={facultyEmail}
                    onChange={(e) => setFacultyEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: `1px solid ${isDarkMode ? '#475569' : '#CBD5E1'}`,
                      backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
                      color: isDarkMode ? '#FFFFFF' : '#0F172A',
                      fontSize: '0.86rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px' }}>
                    Contact Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +91 98765 43210"
                    value={facultyPhone}
                    onChange={(e) => setFacultyPhone(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: `1px solid ${isDarkMode ? '#475569' : '#CBD5E1'}`,
                      backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
                      color: isDarkMode ? '#FFFFFF' : '#0F172A',
                      fontSize: '0.86rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px' }}>
                    Department *
                  </label>
                  <select
                    value={facultyDept}
                    onChange={(e) => setFacultyDept(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: `1px solid ${isDarkMode ? '#475569' : '#CBD5E1'}`,
                      backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
                      color: isDarkMode ? '#FFFFFF' : '#0F172A',
                      fontSize: '0.86rem',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Electronics & Communication">Electronics & Communication</option>
                    <option value="Electrical & Electronics">Electrical & Electronics</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                    <option value="Civil Engineering">Civil Engineering</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px' }}>
                    Designation
                  </label>
                  <select
                    value={facultyDesignation}
                    onChange={(e) => setFacultyDesignation(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: `1px solid ${isDarkMode ? '#475569' : '#CBD5E1'}`,
                      backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
                      color: isDarkMode ? '#FFFFFF' : '#0F172A',
                      fontSize: '0.86rem',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="Assistant Professor">Assistant Professor</option>
                    <option value="Associate Professor">Associate Professor</option>
                    <option value="Professor">Professor</option>
                    <option value="Head of Department (HOD)">Head of Department (HOD)</option>
                    <option value="Faculty Mentor">Faculty Mentor</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px' }}>
                  Account Status
                </label>
                <select
                  value={facultyStatus}
                  onChange={(e) => setFacultyStatus(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${isDarkMode ? '#475569' : '#CBD5E1'}`,
                    backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
                    color: isDarkMode ? '#FFFFFF' : '#0F172A',
                    fontSize: '0.86rem',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="ACTIVE">ACTIVE (Authorized to Mentor Students)</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setAddFacultyModalOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: `1px solid ${isDarkMode ? '#475569' : '#CBD5E1'}`,
                    background: 'transparent',
                    color: isDarkMode ? '#FFFFFF' : '#475569',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={facultySubmitting}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#8B5CF6',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    cursor: facultySubmitting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 10px rgba(139, 92, 246, 0.35)',
                  }}
                >
                  {facultySubmitting ? 'Enrolling...' : 'Persist & Enroll Faculty'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ENROLL PLACEMENT OFFICER
          ========================================================================= */}
      {addPlacementOfficerModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 110,
            padding: '1.5rem',
          }}
        >
          <div
            style={{
              backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
              borderRadius: '20px',
              width: '560px',
              maxWidth: '95vw',
              padding: '2rem',
              boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
              border: `1px solid ${isDarkMode ? '#334155' : '#E2E8F0'}`,
              color: isDarkMode ? '#FFFFFF' : '#0F172A',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(217, 119, 6, 0.15)',
                    color: '#D97706',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Briefcase size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Enroll Placement Officer</h3>
                  <span style={{ fontSize: '0.80rem', color: '#64748B' }}>Adds officer to Career & Corporate Relations portal</span>
                </div>
              </div>
              <button
                onClick={() => setAddPlacementOfficerModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEnrollPlacementOfficer} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px' }}>
                  Placement Officer / Staff ID *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TPO-OFFICER-03"
                  value={tpoStaffId}
                  onChange={(e) => setTpoStaffId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${isDarkMode ? '#475569' : '#CBD5E1'}`,
                    backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
                    color: isDarkMode ? '#FFFFFF' : '#0F172A',
                    fontSize: '0.86rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px' }}>
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Snehal"
                    value={tpoFirstName}
                    onChange={(e) => setTpoFirstName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: `1px solid ${isDarkMode ? '#475569' : '#CBD5E1'}`,
                      backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
                      color: isDarkMode ? '#FFFFFF' : '#0F172A',
                      fontSize: '0.86rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px' }}>
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kulkarni"
                    value={tpoLastName}
                    onChange={(e) => setTpoLastName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: `1px solid ${isDarkMode ? '#475569' : '#CBD5E1'}`,
                      backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
                      color: isDarkMode ? '#FFFFFF' : '#0F172A',
                      fontSize: '0.86rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px' }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. snehal.tpo@codebuffet.edu"
                    value={tpoEmail}
                    onChange={(e) => setTpoEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: `1px solid ${isDarkMode ? '#475569' : '#CBD5E1'}`,
                      backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
                      color: isDarkMode ? '#FFFFFF' : '#0F172A',
                      fontSize: '0.86rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px' }}>
                    Contact Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +91 98765 12345"
                    value={tpoPhone}
                    onChange={(e) => setTpoPhone(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: `1px solid ${isDarkMode ? '#475569' : '#CBD5E1'}`,
                      backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
                      color: isDarkMode ? '#FFFFFF' : '#0F172A',
                      fontSize: '0.86rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px' }}>
                    Department / Placement Cell *
                  </label>
                  <select
                    value={tpoDept}
                    onChange={(e) => setTpoDept(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: `1px solid ${isDarkMode ? '#475569' : '#CBD5E1'}`,
                      backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
                      color: isDarkMode ? '#FFFFFF' : '#0F172A',
                      fontSize: '0.86rem',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="Career & Corporate Relations">Career & Corporate Relations</option>
                    <option value="Training & Placement Cell">Training & Placement Cell</option>
                    <option value="Industry Partnerships">Industry Partnerships</option>
                    <option value="Alumni & Employer Relations">Alumni & Employer Relations</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px' }}>
                    Designation
                  </label>
                  <select
                    value={tpoDesignation}
                    onChange={(e) => setTpoDesignation(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: `1px solid ${isDarkMode ? '#475569' : '#CBD5E1'}`,
                      backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
                      color: isDarkMode ? '#FFFFFF' : '#0F172A',
                      fontSize: '0.86rem',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="Placement Officer">Placement Officer</option>
                    <option value="Training & Placement Officer">Training & Placement Officer</option>
                    <option value="Placement Director">Placement Director</option>
                    <option value="Corporate Relations Lead">Corporate Relations Lead</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px' }}>
                  Account Status
                </label>
                <select
                  value={tpoStatus}
                  onChange={(e) => setTpoStatus(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${isDarkMode ? '#475569' : '#CBD5E1'}`,
                    backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
                    color: isDarkMode ? '#FFFFFF' : '#0F172A',
                    fontSize: '0.86rem',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="ACTIVE">ACTIVE (Authorized to Manage Placements)</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setAddPlacementOfficerModalOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: `1px solid ${isDarkMode ? '#475569' : '#CBD5E1'}`,
                    background: 'transparent',
                    color: isDarkMode ? '#FFFFFF' : '#475569',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={tpoSubmitting}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#D97706',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    cursor: tpoSubmitting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 10px rgba(217, 119, 6, 0.35)',
                  }}
                >
                  {tpoSubmitting ? 'Enrolling...' : 'Persist & Enroll Placement Officer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
