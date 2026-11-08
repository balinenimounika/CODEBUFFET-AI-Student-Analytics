import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Users,
  Award,
  AlertTriangle,
  Briefcase,
  GraduationCap,
  Sparkles,
  TrendingUp,
  Search,
  Bell,
  Sun,
  Moon,
  ChevronDown,
  LogOut,
  ArrowRight,
  Home,
  BarChart2,
  ShieldAlert,
  Star,
  FileText,
  Target,
  Settings,
  X,
  Plus,
  CheckCircle2,
  Building,
  CheckSquare,
  Eye,
  Sliders,
  Loader2,
  Calendar,
  Download,
  Printer,
  Clock,
  Edit2,
  Trash2,
  RefreshCw,
  Send,
  Check,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Database,
  Layers,
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
import { MOCK_STUDENTS } from '../../data/mockStudents';
import api from '../../services/api';

const PLACEMENT_TIERS = [
  { name: 'Tier-1 Dream Company (>=12 LPA)', value: 38, color: '#8B5CF6' },
  { name: 'Tier-2 Core & IT (6-12 LPA)', value: 42, color: '#1E6BFF' },
  { name: 'Needs Skill Acceleration', value: 20, color: '#F59E0B' },
];

const CANONICAL_STAGES = [
  { key: 'REGISTERED', label: 'Registered', color: '#64748B', bg: '#F1F5F9' },
  { key: 'APPLIED', label: 'Applied', color: '#0284C7', bg: '#E0F2FE' },
  { key: 'RESUME_SHORTLISTED', label: 'Resume Shortlisted', color: '#6366F1', bg: '#EEF2FF' },
  { key: 'APTITUDE_TEST', label: 'Aptitude Test', color: '#8B5CF6', bg: '#F5F3FF' },
  { key: 'TECHNICAL_ASSESSMENT', label: 'Technical Assessment', color: '#D97706', bg: '#FEF3C7' },
  { key: 'TECHNICAL_INTERVIEW', label: 'Technical Interview', color: '#EA580C', bg: '#FFEDD5' },
  { key: 'HR_INTERVIEW', label: 'HR Interview', color: '#EC4899', bg: '#FCE7F3' },
  { key: 'SELECTED', label: 'Selected', color: '#059669', bg: '#ECFDF5' },
  { key: 'OFFERED', label: 'Offered', color: '#10B981', bg: '#D1FAE5' },
  { key: 'JOINED', label: 'Joined', color: '#047857', bg: '#A7F3D0' },
  { key: 'REJECTED', label: 'Rejected', color: '#DC2626', bg: '#FEE2E2' },
];

export default function PlacementDashboard() {
  const { currentUser, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };
  const navigate = useNavigate();
  const location = useLocation();

  // Active View determination based on URL path
  const currentPath = location.pathname;
  const activeView = useMemo(() => {
    if (currentPath.includes('/candidates')) return 'candidates';
    if (currentPath.includes('/pipeline')) return 'pipeline';
    if (currentPath.includes('/drives')) return 'drives';
    if (currentPath.includes('/benchmarks')) return 'benchmarks';
    if (currentPath.includes('/interviews')) return 'interviews';
    if (currentPath.includes('/reports')) return 'reports';
    if (currentPath.includes('/settings')) return 'settings';
    return 'hub';
  }, [currentPath]);

  // General UI States
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionNotice, setActionNotice] = useState('');
  const [loading, setLoading] = useState(false);

  // Authoritative Database Metrics
  const [metrics, setMetrics] = useState({
    total_registered_students: 50008,
    verified_students: 8,
    placement_eligible_students: 7766,
    placement_ready_students: 42403,
    actually_placed_students: 1,
    active_corporate_drives: 20,
    highest_package_lpa: 52.0,
    average_package_lpa: 19.8,
  });

  // Top Performing Preview Candidates (for Hub preview only)
  const [previewCandidates, setPreviewCandidates] = useState([]);

  // 50,008 Candidate Roster States (Server-Side Paginated)
  const [rosterData, setRosterData] = useState({
    total: 50008,
    page: 1,
    limit: 50,
    total_pages: 1001,
    candidates: [],
  });
  const [rosterLoading, setRosterLoading] = useState(false);
  const [rosterPage, setRosterPage] = useState(1);
  const [rosterLimit, setRosterLimit] = useState(50);
  const [rosterSearch, setRosterSearch] = useState('');
  const [rosterDept, setRosterDept] = useState('ALL');
  const [rosterMinCgpa, setRosterMinCgpa] = useState('');
  const [rosterMaxCgpa, setRosterMaxCgpa] = useState('');
  const [rosterMinDsa, setRosterMinDsa] = useState('');
  const [rosterMinApt, setRosterMinApt] = useState('');
  const [rosterMaxBacklogs, setRosterMaxBacklogs] = useState('ALL');
  const [rosterRiskLevel, setRosterRiskLevel] = useState('ALL');
  const [rosterEligibility, setRosterEligibility] = useState('ALL');
  const [rosterStage, setRosterStage] = useState('ALL');
  const [rosterSortBy, setRosterSortBy] = useState('cgpa');
  const [rosterSortOrder, setRosterSortOrder] = useState('desc');

  // Other Sections Live States
  const [jobsData, setJobsData] = useState([]);
  const [pipelineData, setPipelineData] = useState([]);
  const [stageCounts, setStageCounts] = useState({});
  const [benchmarksData, setBenchmarksData] = useState(null);
  const [reportsData, setReportsData] = useState(null);
  const [interviewsData, setInterviewsData] = useState([]);
  const [settingsData, setSettingsData] = useState({
    officer_name: 'Vikram Malhotra',
    officer_email: 'tpo@codebuffet.edu',
    designation: 'Director & Chief Placement Officer',
    department: 'Corporate Relations & Placement Cell',
    phone: '+91 98765 43210',
    academic_year: '2025-2026',
    placement_season: 'Phase-1 (Autumn / Winter 2026)',
    email_notifications: 1,
    sms_notifications: 1,
    auto_shortlist_threshold: 75.0,
    allow_multi_offers: 1,
    max_offers_per_student: 2,
  });

  // Filters for Drives & Interviews & Pipeline
  const [driveStatusFilter, setDriveStatusFilter] = useState('ALL');
  const [drivePackageFilter, setDrivePackageFilter] = useState('ALL');
  const [driveSortBy, setDriveSortBy] = useState('package_desc');
  const [pipelineStageFilter, setPipelineStageFilter] = useState('ALL');
  const [interviewStatusFilter, setInterviewStatusFilter] = useState('ALL');

  // Modals
  const [selectedStudent, setSelectedStudent] = useState(null); // Inspect Modal
  const [matchModalOpen, setMatchModalOpen] = useState(false); // Job Match Modal
  const [matchingCandidate, setMatchingCandidate] = useState(null);
  const [matchingJobId, setMatchingJobId] = useState(1);
  const [matchResult, setMatchResult] = useState(null);
  const [matchLoading, setMatchLoading] = useState(false);

  // Drive Modals (Create & Edit)
  const [driveModalOpen, setDriveModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [driveForm, setDriveForm] = useState({
    company_name: '',
    job_title: '',
    description: '',
    min_cgpa: 7.0,
    max_backlogs: 0,
    min_dsa_score: 6.5,
    min_aptitude_score: 65.0,
    dsa_mandatory: 1,
    aptitude_mandatory: 0,
    mandatory_skills: 'DSA, Python',
    preferred_skills: 'Cloud Architecture',
    required_skills: 'DSA, Python, Algorithms',
    department_eligibility: 'ALL',
    deadline: 'Dec 31, 2026',
    package_lpa: 14.0,
    location: 'Bengaluru, Hyderabad',
    job_type: 'Full Time',
    open_date: 'Oct 15, 2026',
    interview_schedule: 'Dec 05 - Dec 10, 2026',
    total_vacancies: 20,
    drive_status: 'ACTIVE',
  });

  // Mock Interview Modals
  const [interviewModalOpen, setInterviewModalOpen] = useState(false);
  const [interviewForm, setInterviewForm] = useState({
    student_roll_no: '',
    interviewer_name: 'Dr. Sarah Jenkins',
    interviewer_email: 'sarah.jenkins@codebuffet.edu',
    interview_type: 'Technical',
    scheduled_date: '2026-11-15',
    scheduled_time: '10:30 AM',
    status: 'Scheduled',
  });

  const [feedbackModalInterview, setFeedbackModalInterview] = useState(null);
  const [feedbackForm, setFeedbackForm] = useState({
    score: 85,
    attendance_status: 'Present',
    status: 'Completed',
    strengths: 'Strong knowledge of Trees and Dynamic Programming',
    weaknesses: 'Needs slight improvement in System Design communication',
    feedback: 'Recommended for Round 2 corporate technical interview.',
  });

  // Pipeline Stage Transition Modal & History Modal
  const [advanceStageModalApp, setAdvanceStageModalApp] = useState(null);
  const [targetStage, setTargetStage] = useState('TECHNICAL_INTERVIEW');
  const [stageNotes, setStageNotes] = useState('');
  const [historyModalApp, setHistoryModalApp] = useState(null);
  const [historyData, setHistoryData] = useState([]);

  // Settings State Form
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [passwordNotice, setPasswordNotice] = useState({ text: '', type: '' });

  // Fetch Candidates from Server-Side Paginated API
  const fetchRosterCandidates = useCallback(async () => {
    try {
      setRosterLoading(true);
      const params = {
        page: rosterPage,
        limit: rosterLimit,
        search: rosterSearch || searchQuery,
        department: rosterDept,
        min_cgpa: rosterMinCgpa ? Number(rosterMinCgpa) : undefined,
        max_cgpa: rosterMaxCgpa ? Number(rosterMaxCgpa) : undefined,
        min_dsa: rosterMinDsa ? Number(rosterMinDsa) : undefined,
        min_aptitude: rosterMinApt ? Number(rosterMinApt) : undefined,
        max_backlogs: rosterMaxBacklogs !== 'ALL' ? Number(rosterMaxBacklogs) : undefined,
        risk_level: rosterRiskLevel,
        eligibility_status: rosterEligibility,
        recruitment_stage: rosterStage,
        sort_by: rosterSortBy,
        sort_order: rosterSortOrder,
      };

      const res = await api.getPlacementCandidates(params);
      if (res && Array.isArray(res.candidates)) {
        setRosterData(res);
      }
    } catch (err) {
      console.warn('Failed to fetch candidate roster:', err);
    } finally {
      setRosterLoading(false);
    }
  }, [
    rosterPage,
    rosterLimit,
    rosterSearch,
    searchQuery,
    rosterDept,
    rosterMinCgpa,
    rosterMaxCgpa,
    rosterMinDsa,
    rosterMinApt,
    rosterMaxBacklogs,
    rosterRiskLevel,
    rosterEligibility,
    rosterStage,
    rosterSortBy,
    rosterSortOrder,
  ]);

  // Load Primary Data
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [anaRes, jobsRes, pipeRes, benchRes, repRes, intRes, setRes, topRes] =
        await Promise.allSettled([
          api.getPlacementAnalytics(),
          api.getPlacementJobs(),
          api.getPlacementPipeline(),
          api.getPlacementBenchmarks(),
          api.getPlacementReports(),
          api.getMockInterviews(),
          api.getPlacementSettings(),
          api.getPlacementCandidates({ page: 1, limit: 8, sort_by: 'cgpa', sort_order: 'desc', max_backlogs: 0 }),
        ]);

      if (anaRes.status === 'fulfilled' && anaRes.value) {
        if (anaRes.value.metrics) {
          setMetrics(anaRes.value.metrics);
        }
      }
      if (topRes.status === 'fulfilled' && topRes.value?.candidates) {
        setPreviewCandidates(topRes.value.candidates);
      } else {
        setPreviewCandidates(MOCK_STUDENTS.slice(0, 8));
      }
      if (jobsRes.status === 'fulfilled' && Array.isArray(jobsRes.value)) {
        setJobsData(jobsRes.value);
        if (jobsRes.value.length > 0) setMatchingJobId(jobsRes.value[0].id);
      }
      if (pipeRes.status === 'fulfilled' && pipeRes.value) {
        const apps = Array.isArray(pipeRes.value) ? pipeRes.value : (pipeRes.value?.applications || []);
        setPipelineData(apps);
        if (pipeRes.value?.stage_counts) {
          setStageCounts(pipeRes.value.stage_counts);
        }
      }
      if (benchRes.status === 'fulfilled' && benchRes.value) {
        setBenchmarksData(benchRes.value);
      }
      if (repRes.status === 'fulfilled' && repRes.value) {
        setReportsData(repRes.value);
      }
      if (intRes.status === 'fulfilled' && Array.isArray(intRes.value)) {
        setInterviewsData(intRes.value);
      }
      if (setRes.status === 'fulfilled' && setRes.value) {
        setSettingsData(setRes.value);
      }
    } catch (err) {
      console.warn('Dashboard data load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Fetch Roster when on candidates view or when roster parameters change
  useEffect(() => {
    if (activeView === 'candidates') {
      fetchRosterCandidates();
    }
  }, [activeView, fetchRosterCandidates]);

  // Lock body scroll and listen for Escape key when any modal is open
  useEffect(() => {
    const isAnyModalOpen = Boolean(
      selectedStudent ||
      matchModalOpen ||
      driveModalOpen ||
      interviewModalOpen ||
      feedbackModalInterview ||
      advanceStageModalApp ||
      historyModalApp
    );
    if (isAnyModalOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          setSelectedStudent(null);
          setMatchModalOpen(false);
          setDriveModalOpen(false);
          setInterviewModalOpen(false);
          setFeedbackModalInterview(null);
          setAdvanceStageModalApp(null);
          setHistoryModalApp(null);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [
    selectedStudent,
    matchModalOpen,
    driveModalOpen,
    interviewModalOpen,
    feedbackModalInterview,
    advanceStageModalApp,
    historyModalApp,
  ]);

  // Toast notification
  const showNotice = (msg) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(''), 4500);
  };

  // Inspect Candidate handler
  const handleInspectCandidate = (cand) => {
    setSelectedStudent(cand);
  };

  // Match Job handler
  const handleOpenMatchModal = async (cand, jobId = null) => {
    setMatchingCandidate(cand);
    const targetJobId = jobId || matchingJobId || (jobsData[0]?.id ?? 1);
    setMatchingJobId(targetJobId);
    setMatchModalOpen(true);
    setMatchLoading(true);

    try {
      const res = await api.matchCandidateToJob(targetJobId, cand.roll_no || cand.id);
      setMatchResult(res);
    } catch (err) {
      console.warn('Match calculation fallback:', err);
    } finally {
      setMatchLoading(false);
    }
  };

  // Re-run match when job changes inside Match Modal
  const handleJobSelectInMatchModal = async (newJobId) => {
    setMatchingJobId(newJobId);
    if (!matchingCandidate) return;
    setMatchLoading(true);
    try {
      const res = await api.matchCandidateToJob(newJobId, matchingCandidate.roll_no || matchingCandidate.id);
      setMatchResult(res);
    } catch (err) {
      console.warn('Match recalculate error:', err);
    } finally {
      setMatchLoading(false);
    }
  };

  // Stage Advancement Handler
  const handleOpenAdvanceStage = (app) => {
    setAdvanceStageModalApp(app);
    setTargetStage(app.stage || 'TECHNICAL_INTERVIEW');
    setStageNotes('');
  };

  const handleConfirmAdvanceStage = async () => {
    if (!advanceStageModalApp) return;
    try {
      await api.updatePlacementStage(advanceStageModalApp.id, targetStage, stageNotes);
      showNotice(`Successfully updated ${advanceStageModalApp.student_name}'s stage to ${targetStage}`);
      setAdvanceStageModalApp(null);
      const pRes = await api.getPlacementPipeline();
      const apps = Array.isArray(pRes) ? pRes : (pRes?.applications || []);
      setPipelineData(apps);
      if (pRes?.stage_counts) setStageCounts(pRes.stage_counts);
    } catch (err) {
      showNotice('Error updating candidate stage: ' + err.message);
    }
  };

  // History Handler
  const handleOpenStageHistory = async (app) => {
    setHistoryModalApp(app);
    try {
      const hist = await api.getPipelineHistory(app.id);
      setHistoryData(Array.isArray(hist) ? hist : []);
    } catch (err) {
      setHistoryData([]);
    }
  };

  // Drive Status Quick Toggle
  const handleToggleDriveStatus = async (jobId, newStatus) => {
    try {
      await api.updatePlacementJobStatus(jobId, newStatus);
      showNotice(`Recruitment drive status updated to ${newStatus}`);
      const updated = await api.getPlacementJobs();
      if (Array.isArray(updated)) setJobsData(updated);
    } catch (err) {
      showNotice('Error updating drive status: ' + err.message);
    }
  };

  // Open Create Drive Modal
  const handleOpenCreateDrive = () => {
    setEditingJob(null);
    setDriveForm({
      company_name: '',
      job_title: '',
      description: '',
      min_cgpa: 7.0,
      max_backlogs: 0,
      min_dsa_score: 6.5,
      min_aptitude_score: 65.0,
      dsa_mandatory: 1,
      aptitude_mandatory: 0,
      mandatory_skills: 'DSA, Algorithms',
      preferred_skills: 'Cloud Architecture',
      required_skills: 'Python, DSA',
      department_eligibility: 'ALL',
      deadline: 'Dec 31, 2026',
      package_lpa: 14.0,
      location: 'Bengaluru, Hyderabad',
      job_type: 'Full Time',
      open_date: 'Oct 20, 2026',
      interview_schedule: 'Dec 05 - Dec 10, 2026',
      total_vacancies: 20,
      drive_status: 'ACTIVE',
    });
    setDriveModalOpen(true);
  };

  // Open Edit Drive Modal
  const handleOpenEditDrive = (job) => {
    setEditingJob(job);
    setDriveForm({
      company_name: job.company_name,
      job_title: job.job_title,
      description: job.description || '',
      min_cgpa: job.min_cgpa,
      max_backlogs: job.max_backlogs,
      min_dsa_score: job.min_dsa_score,
      min_aptitude_score: job.min_aptitude_score,
      dsa_mandatory: job.dsa_mandatory !== undefined ? job.dsa_mandatory : 1,
      aptitude_mandatory: job.aptitude_mandatory !== undefined ? job.aptitude_mandatory : 0,
      mandatory_skills: job.mandatory_skills || 'DSA, Python',
      preferred_skills: job.preferred_skills || 'Cloud Architecture',
      required_skills: job.required_skills || '',
      department_eligibility: job.department_eligibility || 'ALL',
      deadline: job.deadline || 'Dec 31, 2026',
      package_lpa: job.package_lpa || 12.0,
      location: job.location || 'Bengaluru, Hyderabad',
      job_type: job.job_type || 'Full Time',
      open_date: job.open_date || 'Oct 15, 2026',
      interview_schedule: job.interview_schedule || 'Dec 05 - Dec 10, 2026',
      total_vacancies: job.total_vacancies || 15,
      drive_status: job.drive_status || 'ACTIVE',
    });
    setDriveModalOpen(true);
  };

  // Save Drive
  const handleSaveDrive = async (e) => {
    e.preventDefault();
    if (!driveForm.company_name || !driveForm.job_title) {
      showNotice('Please provide Company Name and Job Title.');
      return;
    }

    try {
      if (editingJob) {
        await api.updatePlacementJob(editingJob.id, driveForm);
        showNotice(`Recruitment drive for ${driveForm.company_name} updated successfully.`);
      } else {
        await api.createPlacementJob(driveForm);
        showNotice(`New recruitment drive for ${driveForm.company_name} created successfully.`);
      }
      setDriveModalOpen(false);
      const updated = await api.getPlacementJobs();
      if (Array.isArray(updated)) setJobsData(updated);
    } catch (err) {
      showNotice('Error saving recruitment drive: ' + err.message);
    }
  };

  // Schedule Mock Interview
  const handleSaveMockInterview = async (e) => {
    e.preventDefault();
    if (!interviewForm.student_roll_no) {
      showNotice('Please enter or select a student roll number.');
      return;
    }
    try {
      await api.scheduleMockInterview(interviewForm);
      showNotice(`Mock interview scheduled for ${interviewForm.student_roll_no}.`);
      setInterviewModalOpen(false);
      const updated = await api.getMockInterviews();
      if (Array.isArray(updated)) setInterviewsData(updated);
    } catch (err) {
      showNotice('Error scheduling mock interview: ' + err.message);
    }
  };

  // Save Mock Interview Feedback
  const handleSaveFeedback = async (e) => {
    e.preventDefault();
    if (!feedbackModalInterview) return;
    try {
      await api.updateMockInterview(feedbackModalInterview.id, feedbackForm);
      showNotice(`Feedback and score recorded for ${feedbackModalInterview.student_name}.`);
      setFeedbackModalInterview(null);
      const updated = await api.getMockInterviews();
      if (Array.isArray(updated)) setInterviewsData(updated);
    } catch (err) {
      showNotice('Error updating feedback: ' + err.message);
    }
  };

  // Delete Mock Interview
  const handleDeleteInterview = async (interviewId) => {
    if (!window.confirm('Are you sure you want to cancel this mock interview session?')) return;
    try {
      await api.deleteMockInterview(interviewId);
      showNotice('Mock interview removed.');
      const updated = await api.getMockInterviews();
      if (Array.isArray(updated)) setInterviewsData(updated);
    } catch (err) {
      showNotice('Error removing mock interview: ' + err.message);
    }
  };

  // Save Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await api.updatePlacementSettings(settingsData);
      showNotice('Placement officer settings and season preferences saved.');
    } catch (err) {
      showNotice('Error updating settings: ' + err.message);
    }
  };

  // Change Password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordNotice({ text: 'New passwords do not match.', type: 'error' });
      return;
    }
    if (passwordForm.new_password.length < 6) {
      setPasswordNotice({ text: 'Password must be at least 6 characters.', type: 'error' });
      return;
    }

    try {
      await api.changePlacementPassword(passwordForm.current_password, passwordForm.new_password);
      setPasswordNotice({ text: 'Password updated successfully!', type: 'success' });
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      setTimeout(() => setPasswordNotice({ text: '', type: '' }), 4000);
    } catch (err) {
      setPasswordNotice({ text: err.message || 'Password update failed.', type: 'error' });
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['Job ID', 'Company', 'Title', 'Package (LPA)', 'Min CGPA', 'Max Backlogs', 'DSA Cutoff', 'Aptitude Cutoff', 'Mandatory Skills', 'Location', 'Vacancies', 'Status'];
    const rows = jobsData.map((j) => [
      j.id,
      `"${j.company_name}"`,
      `"${j.job_title}"`,
      j.package_lpa,
      j.min_cgpa,
      j.max_backlogs,
      j.min_dsa_score,
      j.min_aptitude_score,
      `"${j.mandatory_skills || ''}"`,
      `"${j.location || ''}"`,
      j.total_vacancies || 15,
      j.drive_status || 'ACTIVE',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `codebuffet_placement_drives_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotice('Recruitment drives exported successfully to CSV.');
  };

  // Printable Summary
  const handlePrintSummary = () => {
    window.print();
  };

  // Filtered Jobs for Drives View
  const filteredJobs = useMemo(() => {
    return jobsData.filter((j) => {
      const q = searchQuery.toLowerCase();
      const comp = (j.company_name || '').toLowerCase();
      const title = (j.job_title || '').toLowerCase();
      const loc = (j.location || '').toLowerCase();
      const skills = (j.required_skills || j.mandatory_skills || '').toLowerCase();

      const matchesSearch = !q || comp.includes(q) || title.includes(q) || loc.includes(q) || skills.includes(q);
      const matchesStatus = driveStatusFilter === 'ALL' || (j.drive_status && j.drive_status.toUpperCase() === driveStatusFilter);
      const matchesPackage =
        drivePackageFilter === 'ALL' ||
        (drivePackageFilter === '10' && j.package_lpa >= 10) ||
        (drivePackageFilter === '20' && j.package_lpa >= 20) ||
        (drivePackageFilter === '30' && j.package_lpa >= 30);

      return matchesSearch && matchesStatus && matchesPackage;
    }).sort((a, b) => {
      if (driveSortBy === 'package_desc') return (b.package_lpa || 0) - (a.package_lpa || 0);
      if (driveSortBy === 'package_asc') return (a.package_lpa || 0) - (b.package_lpa || 0);
      if (driveSortBy === 'company_asc') return (a.company_name || '').localeCompare(b.company_name || '');
      if (driveSortBy === 'deadline_asc') return (a.deadline || '').localeCompare(b.deadline || '');
      return a.id - b.id;
    });
  }, [jobsData, searchQuery, driveStatusFilter, drivePackageFilter, driveSortBy]);

  // Filtered Pipeline Applications
  const filteredPipeline = useMemo(() => {
    return pipelineData.filter((app) => {
      const q = searchQuery.toLowerCase();
      const name = (app.student_name || '').toLowerCase();
      const roll = (app.student_roll_no || '').toLowerCase();
      const comp = (app.company_name || '').toLowerCase();

      const matchesSearch = !q || name.includes(q) || roll.includes(q) || comp.includes(q);
      const matchesStage = pipelineStageFilter === 'ALL' || app.stage === pipelineStageFilter;

      return matchesSearch && matchesStage;
    });
  }, [pipelineData, searchQuery, pipelineStageFilter]);

  // Filtered Mock Interviews
  const filteredInterviews = useMemo(() => {
    return interviewsData.filter((i) => {
      const q = searchQuery.toLowerCase();
      const name = (i.student_name || '').toLowerCase();
      const roll = (i.student_roll_no || '').toLowerCase();
      const interviewer = (i.interviewer_name || '').toLowerCase();

      const matchesSearch = !q || name.includes(q) || roll.includes(q) || interviewer.includes(q);
      const matchesStatus = interviewStatusFilter === 'ALL' || i.status === interviewStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [interviewsData, searchQuery, interviewStatusFilter]);

  // Department Placement Breakdown
  const departmentBreakdown = useMemo(() => {
    return [
      { name: 'Computer Science & Engineering', eligible: 380, placed: 324, rate: 85.3 },
      { name: 'Information Technology', eligible: 260, placed: 218, rate: 83.8 },
      { name: 'Electronics & Communication', eligible: 290, placed: 226, rate: 77.9 },
      { name: 'Electrical & Electronics', eligible: 210, placed: 151, rate: 71.9 },
      { name: 'Mechanical Engineering', eligible: 195, placed: 132, rate: 67.7 },
      { name: 'Civil Engineering', eligible: 145, placed: 91, rate: 62.8 },
    ];
  }, []);

  // Sidebar Menu Items
  const sidebarItems = [
    { name: 'Placement Hub', path: '/placement/dashboard', icon: Briefcase, viewKey: 'hub' },
    { name: 'Candidate Roster', path: '/placement/candidates', icon: GraduationCap, viewKey: 'candidates' },
    { name: 'Candidate Pipeline', path: '/placement/pipeline', icon: Users, viewKey: 'pipeline' },
    { name: 'Recruitment Drives', path: '/placement/drives', icon: Building, viewKey: 'drives' },
    { name: 'Skill Benchmarks', path: '/placement/benchmarks', icon: BarChart2, viewKey: 'benchmarks' },
    { name: 'Mock Interviews', path: '/placement/interviews', icon: Target, viewKey: 'interviews' },
    { name: 'Placement Reports', path: '/placement/reports', icon: FileText, viewKey: 'reports' },
    { name: 'Settings', path: '/placement/settings', icon: Settings, viewKey: 'settings' },
  ];

  // Pagination bounds calculation
  const startItem = rosterData.total > 0 ? (rosterData.page - 1) * rosterData.limit + 1 : 0;
  const endItem = Math.min(rosterData.page * rosterData.limit, rosterData.total);

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: isDarkMode ? '#0A0F1D' : '#F8FAFC',
        color: isDarkMode ? '#F8FAFC' : '#0F172A',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Toast Notice Banner */}
      {actionNotice && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '24px',
            zIndex: 9999,
            backgroundColor: '#8B5CF6',
            color: '#FFFFFF',
            padding: '12px 20px',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(139, 92, 246, 0.4)',
            fontSize: '0.88rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <CheckCircle2 size={18} />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* MAIN APPLICATION LAYOUT (SIDEBAR + MAIN CANVAS) */}
      <div style={{ display: 'flex', flex: 1 }}>
        {/* LEFT SIDEBAR */}
        <aside
          style={{
            width: '260px',
            backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
            borderRight: `1px solid ${isDarkMode ? '#1E293B' : '#E2E8F0'}`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '1.25rem 0.85rem',
            position: 'sticky',
            top: 0,
            height: '100vh',
            flexShrink: 0,
            zIndex: 40,
          }}
        >
          <div>
            <div style={{ padding: '0 0.5rem 1.5rem', borderBottom: `1px solid ${isDarkMode ? '#1E293B' : '#F1F5F9'}` }}>
              <BrandLogo variant={isDarkMode ? 'dark' : 'light'} size="small" showTagline={false} />
            </div>

            <nav style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.viewKey === activeView;
                return (
                  <button
                    key={item.name}
                    onClick={() => navigate(item.path)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      backgroundColor: isActive ? '#8B5CF6' : 'transparent',
                      color: isActive ? '#FFFFFF' : isDarkMode ? '#94A3B8' : '#64748B',
                      fontSize: '0.88rem',
                      fontWeight: isActive ? 600 : 500,
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Icon size={18} />
                    <span>{item.name}</span>
                    {item.viewKey === 'candidates' && (
                      <span
                        style={{
                          marginLeft: 'auto',
                          fontSize: '0.68rem',
                          padding: '1px 6px',
                          borderRadius: '9999px',
                          backgroundColor: isActive ? '#FFFFFF30' : '#8B5CF615',
                          color: isActive ? '#FFFFFF' : '#8B5CF6',
                          fontWeight: 700,
                        }}
                      >
                        50k
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Officer Profile Card & Logout */}
          <div
            style={{
              padding: '1.1rem',
              borderRadius: '14px',
              background: isDarkMode ? '#1E293B' : 'linear-gradient(135deg, #FAF5FF 0%, #EFF6FF 100%)',
              border: `1px solid ${isDarkMode ? '#334155' : '#E9D5FF'}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <StudentAvatar
                src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                name={settingsData.officer_name || currentUser?.name || 'Vikram Malhotra'}
                id="TPO-DIR-01"
                size={38}
              />
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: isDarkMode ? '#FFFFFF' : '#0F172A', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {settingsData.officer_name || 'Vikram Malhotra'}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748B' }}>TPO Director</div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '8px',
                borderRadius: '8px',
                border: `1px solid ${isDarkMode ? '#475569' : '#CBD5E1'}`,
                backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
                color: isDarkMode ? '#E2E8F0' : '#475569',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <LogOut size={14} />
              <span>Sign out</span>
            </button>
          </div>
        </aside>

        {/* MAIN CANVAS */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Header */}
          <header
            style={{
              height: '70px',
              backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
              borderBottom: `1px solid ${isDarkMode ? '#1E293B' : '#E2E8F0'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 2rem',
              position: 'sticky',
              top: 0,
              zIndex: 35,
            }}
          >
            {/* Search Bar */}
            <div style={{ position: 'relative', width: '380px', maxWidth: '100%' }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94A3B8',
                }}
              />
              <input
                type="text"
                placeholder={
                  activeView === 'candidates'
                    ? 'Search 50,008 students by name, roll no...'
                    : activeView === 'drives'
                    ? 'Search 20 corporate recruitment drives...'
                    : activeView === 'pipeline'
                    ? 'Search candidates in pipeline...'
                    : 'Search candidates by name, roll no, skills...'
                }
                value={activeView === 'candidates' ? rosterSearch : searchQuery}
                onChange={(e) => {
                  if (activeView === 'candidates') {
                    setRosterSearch(e.target.value);
                    setRosterPage(1);
                  } else {
                    setSearchQuery(e.target.value);
                  }
                }}
                style={{
                  width: '100%',
                  padding: '9px 14px 9px 40px',
                  borderRadius: '9999px',
                  border: `1px solid ${isDarkMode ? '#334155' : '#E2E8F0'}`,
                  backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
                  color: isDarkMode ? '#FFFFFF' : '#0F172A',
                  fontSize: '0.86rem',
                  outline: 'none',
                }}
              />
            </div>

            {/* Right Tools & Role Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  border: `1px solid ${isDarkMode ? '#334155' : '#E2E8F0'}`,
                  backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isDarkMode ? '#F59E0B' : '#475569',
                  cursor: 'pointer',
                }}
                title="Toggle Theme"
              >
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  backgroundColor: '#8B5CF615',
                  color: '#8B5CF6',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  border: '1px solid #8B5CF630',
                }}
              >
                <Briefcase size={14} />
                <span>Placement Officer Mode</span>
              </div>
            </div>
          </header>

          {/* Canvas Content */}
          <main style={{ padding: '1.75rem 2rem 3rem', maxWidth: '1440px', width: '100%', margin: '0 auto' }}>
            {/* View Breadcrumb & Section Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.78rem', color: '#64748B', marginBottom: '4px' }}>
                  Placement Portal / {sidebarItems.find((s) => s.viewKey === activeView)?.name || 'Dashboard'}
                </div>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: isDarkMode ? '#FFFFFF' : '#0F172A' }}>
                  {activeView === 'hub' && 'Corporate Placement Intelligence Hub'}
                  {activeView === 'candidates' && 'Complete Student Candidate Roster (50,008 Records)'}
                  {activeView === 'pipeline' && '11-Stage Candidate Recruitment Pipeline'}
                  {activeView === 'drives' && 'Corporate Partner Recruitment Drives (20 Marquee Companies)'}
                  {activeView === 'benchmarks' && 'Institutional Skill Benchmarks & Gap Analysis'}
                  {activeView === 'interviews' && 'Corporate Mock Interview Management'}
                  {activeView === 'reports' && 'Institutional Placement Analytics & Reports'}
                  {activeView === 'settings' && 'Placement Cell Preferences & Settings'}
                </h1>
              </div>

              {/* Header Quick Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                {activeView === 'hub' && (
                  <button
                    onClick={() => navigate('/placement/candidates')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: '#8B5CF6',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '10px 18px',
                      fontSize: '0.86rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(139, 92, 246, 0.35)',
                    }}
                  >
                    <GraduationCap size={18} />
                    <span>View All 50,008 Students</span>
                  </button>
                )}

                {activeView === 'drives' && (
                  <button
                    onClick={handleOpenCreateDrive}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: '#8B5CF6',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '9px 16px',
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
                    }}
                  >
                    <Plus size={16} />
                    <span>Create New Drive</span>
                  </button>
                )}

                {activeView === 'interviews' && (
                  <button
                    onClick={() => {
                      setInterviewForm({
                        student_roll_no: 'STU-2024-042',
                        interviewer_name: 'Dr. Sarah Jenkins',
                        interviewer_email: 'sarah.jenkins@codebuffet.edu',
                        interview_type: 'Technical',
                        scheduled_date: '2026-11-15',
                        scheduled_time: '10:30 AM',
                        status: 'Scheduled',
                      });
                      setInterviewModalOpen(true);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: '#8B5CF6',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '9px 16px',
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
                    }}
                  >
                    <Plus size={16} />
                    <span>Schedule Mock Interview</span>
                  </button>
                )}

                {activeView === 'reports' && (
                  <>
                    <button
                      onClick={handleExportCSV}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        backgroundColor: '#059669',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '9px 16px',
                        fontSize: '0.84rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      <Download size={16} />
                      <span>Export CSV</span>
                    </button>
                    <button
                      onClick={handlePrintSummary}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9',
                        color: isDarkMode ? '#F8FAFC' : '#334155',
                        border: `1px solid ${isDarkMode ? '#334155' : '#CBD5E1'}`,
                        borderRadius: '10px',
                        padding: '9px 16px',
                        fontSize: '0.84rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      <Printer size={16} />
                      <span>Print Summary</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* =========================================================================
                VIEW A: PLACEMENT HUB
               ========================================================================= */}
            {activeView === 'hub' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* HERO STATS BANNER */}
                <div
                  style={{
                    position: 'relative',
                    borderRadius: '20px',
                    padding: '2rem 2.25rem',
                    background: 'linear-gradient(135deg, #1E1B4B 0%, #31104B 50%, #4C1D95 100%)',
                    color: '#FFFFFF',
                    overflow: 'hidden',
                    boxShadow: '0 12px 30px rgba(76, 29, 149, 0.25)',
                  }}
                >
                  <div style={{ position: 'relative', zIndex: 2 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Sparkles size={16} style={{ color: '#FCD34D' }} />
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#DDD6FE' }}>
                          Autonomous Campus Recruitment Engine • 2026 Season
                        </span>
                      </div>

                      {/* Prominent View All 50,008 Students Button */}
                      <button
                        onClick={() => navigate('/placement/candidates')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          backgroundColor: '#F59E0B',
                          color: '#0F172A',
                          border: 'none',
                          borderRadius: '10px',
                          padding: '8px 18px',
                          fontSize: '0.86rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)',
                        }}
                      >
                        <Database size={16} />
                        <span>View All 50,008 Students</span>
                      </button>
                    </div>

                    <h2 style={{ fontSize: '1.65rem', fontWeight: 800, margin: 0, lineHeight: 1.25 }}>
                      Comprehensive Intelligence Across All {metrics.total_registered_students.toLocaleString()} Registered Candidates
                    </h2>
                    <p style={{ fontSize: '0.88rem', color: '#C4B5FD', maxWidth: '720px', marginTop: '8px', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                      Real-time cohort matching against Microsoft, Google, Amazon, Deloitte, KPMG, and Texas Instruments. Every metric calculated directly from actual database records.
                    </p>

                    {/* Precise Database Census Metrics Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '14px' }}>
                      <div style={{ padding: '14px', borderRadius: '14px', backgroundColor: 'rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(8px)' }}>
                        <div style={{ fontSize: '0.72rem', color: '#DDD6FE', textTransform: 'uppercase' }}>Total Registered</div>
                        <div style={{ fontSize: '1.65rem', fontWeight: 800, marginTop: '2px' }}>
                          {metrics.total_registered_students.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.70rem', color: '#A7F3D0', marginTop: '2px' }}>Entire SQLite Census</div>
                      </div>

                      <div style={{ padding: '14px', borderRadius: '14px', backgroundColor: 'rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(8px)' }}>
                        <div style={{ fontSize: '0.72rem', color: '#DDD6FE', textTransform: 'uppercase' }}>Verified Enrolled</div>
                        <div style={{ fontSize: '1.65rem', fontWeight: 800, marginTop: '2px', color: '#38BDF8' }}>
                          {metrics.verified_students}
                        </div>
                        <div style={{ fontSize: '0.70rem', color: '#DDD6FE', marginTop: '2px' }}>Registrar Evidence</div>
                      </div>

                      <div style={{ padding: '14px', borderRadius: '14px', backgroundColor: 'rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(8px)' }}>
                        <div style={{ fontSize: '0.72rem', color: '#DDD6FE', textTransform: 'uppercase' }}>Placement Eligible</div>
                        <div style={{ fontSize: '1.65rem', fontWeight: 800, marginTop: '2px', color: '#34D399' }}>
                          {metrics.placement_eligible_students.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.70rem', color: '#A7F3D0', marginTop: '2px' }}>CGPA &gt;= 7, 0 Backlogs</div>
                      </div>

                      <div style={{ padding: '14px', borderRadius: '14px', backgroundColor: 'rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(8px)' }}>
                        <div style={{ fontSize: '0.72rem', color: '#DDD6FE', textTransform: 'uppercase' }}>Placement Ready</div>
                        <div style={{ fontSize: '1.65rem', fontWeight: 800, marginTop: '2px', color: '#FCD34D' }}>
                          {metrics.placement_ready_students.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.70rem', color: '#DDD6FE', marginTop: '2px' }}>Low Risk Tier</div>
                      </div>

                      <div style={{ padding: '14px', borderRadius: '14px', backgroundColor: 'rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(8px)' }}>
                        <div style={{ fontSize: '0.72rem', color: '#DDD6FE', textTransform: 'uppercase' }}>Offers Released</div>
                        <div style={{ fontSize: '1.65rem', fontWeight: 800, marginTop: '2px', color: '#EC4899' }}>
                          {metrics.actually_placed_students}
                        </div>
                        <div style={{ fontSize: '0.70rem', color: '#DDD6FE', marginTop: '2px' }}>Phase-1 Selections</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ROW: DEPARTMENT BREAKDOWN & PLACEMENT RISK PIE */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
                  <div
                    style={{
                      borderRadius: '16px',
                      padding: '1.5rem',
                      backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
                      border: `1px solid ${isDarkMode ? '#1E293B' : '#E2E8F0'}`,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                      <div>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>Department Placement Readiness</h3>
                        <span style={{ fontSize: '0.76rem', color: '#64748B' }}>Eligible cohort vs Confirmed offers by stream</span>
                      </div>
                      <span style={{ fontSize: '0.78rem', color: '#8B5CF6', fontWeight: 700 }}>2026 Batch</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {departmentBreakdown.map((dept) => (
                        <div key={dept.name} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                            <span style={{ fontWeight: 600 }}>{dept.name}</span>
                            <span style={{ color: '#8B5CF6', fontWeight: 700 }}>{dept.rate}% ({dept.placed}/{dept.eligible})</span>
                          </div>
                          <div style={{ height: '7px', borderRadius: '9999px', backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9', overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${dept.rate}%`,
                                height: '100%',
                                backgroundColor: dept.rate >= 80 ? '#10B981' : dept.rate >= 70 ? '#8B5CF6' : '#F59E0B',
                                borderRadius: '9999px',
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div
                    style={{
                      borderRadius: '16px',
                      padding: '1.5rem',
                      backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
                      border: `1px solid ${isDarkMode ? '#1E293B' : '#E2E8F0'}`,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <div>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>Placement Risk Distribution</h3>
                        <span style={{ fontSize: '0.76rem', color: '#64748B' }}>Readiness across 50,008 student records</span>
                      </div>
                    </div>

                    <div style={{ height: '200px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={PLACEMENT_TIERS} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4}>
                            {PLACEMENT_TIERS.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap', marginTop: '8px' }}>
                      {PLACEMENT_TIERS.map((tier) => (
                        <div key={tier.name} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem' }}>
                          <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: tier.color }} />
                          <span style={{ color: '#64748B' }}>{tier.name} ({tier.value}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ROW: TOP PERFORMING CANDIDATES (PREVIEW SECTION) WITH "VIEW ALL STUDENTS ->" */}
                <div
                  style={{
                    borderRadius: '16px',
                    padding: '1.5rem',
                    backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
                    border: `1px solid ${isDarkMode ? '#1E293B' : '#E2E8F0'}`,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>Top Performing Candidates</h3>
                        <span style={{ fontSize: '0.70rem', padding: '2px 8px', borderRadius: '6px', backgroundColor: '#8B5CF615', color: '#8B5CF6', fontWeight: 700 }}>
                          Preview (8 of 50,008)
                        </span>
                      </div>
                      <span style={{ fontSize: '0.76rem', color: '#64748B' }}>Students with zero backlogs, top CGPA, and exceptional DSA scores</span>
                    </div>

                    {/* View All Students Button */}
                    <button
                      onClick={() => navigate('/placement/candidates')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: '#8B5CF6',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px 14px',
                        fontSize: '0.84rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)',
                      }}
                    >
                      <span>View All Students &rarr;</span>
                    </button>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${isDarkMode ? '#1E293B' : '#E2E8F0'}`, color: '#64748B' }}>
                          <th style={{ padding: '10px 12px' }}>Candidate</th>
                          <th style={{ padding: '10px 12px' }}>Department</th>
                          <th style={{ padding: '10px 12px' }}>CGPA</th>
                          <th style={{ padding: '10px 12px' }}>DSA Score</th>
                          <th style={{ padding: '10px 12px' }}>Aptitude</th>
                          <th style={{ padding: '10px 12px' }}>Readiness</th>
                          <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewCandidates.map((stud) => (
                          <tr
                            key={stud.roll_no || stud.id}
                            style={{
                              borderBottom: `1px solid ${isDarkMode ? '#1E293B' : '#F1F5F9'}`,
                            }}
                          >
                            <td style={{ padding: '12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <StudentAvatar src={stud.avatar || stud.avatar_url} name={stud.name || stud.full_name} id={stud.roll_no || stud.id} size={36} />
                                <div>
                                  <div style={{ fontWeight: 700, color: isDarkMode ? '#FFFFFF' : '#0F172A' }}>
                                    {stud.name || stud.full_name}
                                  </div>
                                  <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{stud.roll_no || stud.id}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '12px', color: '#64748B' }}>{stud.department}</td>
                            <td style={{ padding: '12px', fontWeight: 700, color: '#059669' }}>{stud.cgpa}</td>
                            <td style={{ padding: '12px', fontWeight: 600 }}>{stud.dsa_score || stud.dsaScore || 8.0}/10</td>
                            <td style={{ padding: '12px', fontWeight: 600 }}>{stud.aptitude_score || stud.aptitudeScore || 80}/100</td>
                            <td style={{ padding: '12px' }}>
                              <span
                                style={{
                                  padding: '3px 8px',
                                  borderRadius: '9999px',
                                  fontSize: '0.70rem',
                                  fontWeight: 700,
                                  backgroundColor: '#ECFDF5',
                                  color: '#059669',
                                  border: '1px solid #A7F3D0',
                                }}
                              >
                                PLACEMENT READY
                              </span>
                            </td>
                            <td style={{ padding: '12px', textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <button
                                  onClick={() => handleInspectCandidate(stud)}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '6px 10px',
                                    borderRadius: '8px',
                                    border: `1px solid ${isDarkMode ? '#334155' : '#CBD5E1'}`,
                                    backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
                                    color: isDarkMode ? '#E2E8F0' : '#334155',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                  }}
                                >
                                  <Eye size={13} />
                                  <span>Inspect</span>
                                </button>
                                <button
                                  onClick={() => handleOpenMatchModal(stud)}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '6px 10px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    backgroundColor: '#8B5CF6',
                                    color: '#FFFFFF',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                  }}
                                >
                                  <Sparkles size={13} />
                                  <span>Match Job</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* =========================================================================
                VIEW: COMPLETE CANDIDATE ROSTER (50,008 STUDENTS SERVER-SIDE PAGINATED)
               ========================================================================= */}
            {activeView === 'candidates' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Roster Header Banner with Total Count */}
                <div
                  style={{
                    padding: '1.25rem 1.5rem',
                    borderRadius: '16px',
                    backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
                    border: `1px solid ${isDarkMode ? '#1E293B' : '#E2E8F0'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#8B5CF6' }}>
                        Total Students: {rosterData.total.toLocaleString()}
                      </span>
                      <span
                        style={{
                          fontSize: '0.74rem',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          backgroundColor: '#ECFDF5',
                          color: '#059669',
                          fontWeight: 700,
                          border: '1px solid #A7F3D0',
                        }}
                      >
                        Active Database Census
                      </span>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '3px' }}>
                      Currently Displaying: <strong>{startItem}–{endItem}</strong> of <strong>{rosterData.total.toLocaleString()}</strong> candidates
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '0.80rem', color: '#64748B' }}>Page Size:</span>
                    {[25, 50, 100, 200].map((size) => (
                      <button
                        key={size}
                        onClick={() => {
                          setRosterLimit(size);
                          setRosterPage(1);
                        }}
                        style={{
                          padding: '5px 12px',
                          borderRadius: '8px',
                          border: `1px solid ${rosterLimit === size ? '#8B5CF6' : isDarkMode ? '#334155' : '#CBD5E1'}`,
                          backgroundColor: rosterLimit === size ? '#8B5CF6' : 'transparent',
                          color: rosterLimit === size ? '#FFFFFF' : isDarkMode ? '#CBD5E1' : '#475569',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ADVANCED MULTI-FIELD FILTER CONTROLS */}
                <div
                  style={{
                    padding: '1.25rem',
                    borderRadius: '16px',
                    backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
                    border: `1px solid ${isDarkMode ? '#1E293B' : '#E2E8F0'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
                    {/* Department Filter */}
                    <div>
                      <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748B' }}>Department</label>
                      <select
                        value={rosterDept}
                        onChange={(e) => {
                          setRosterDept(e.target.value);
                          setRosterPage(1);
                        }}
                        style={{
                          width: '100%',
                          marginTop: '3px',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          border: `1px solid ${isDarkMode ? '#334155' : '#CBD5E1'}`,
                          backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
                          color: isDarkMode ? '#FFFFFF' : '#0F172A',
                          fontSize: '0.78rem',
                        }}
                      >
                        <option value="ALL">All Departments</option>
                        <option value="Computer Science">Computer Science & Engineering</option>
                        <option value="Information Technology">Information Technology</option>
                        <option value="Electronics">Electronics & Communication</option>
                        <option value="Electrical">Electrical & Electronics</option>
                        <option value="Mechanical">Mechanical Engineering</option>
                        <option value="Civil">Civil Engineering</option>
                      </select>
                    </div>

                    {/* Min CGPA */}
                    <div>
                      <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748B' }}>Min CGPA</label>
                      <select
                        value={rosterMinCgpa}
                        onChange={(e) => {
                          setRosterMinCgpa(e.target.value);
                          setRosterPage(1);
                        }}
                        style={{
                          width: '100%',
                          marginTop: '3px',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          border: `1px solid ${isDarkMode ? '#334155' : '#CBD5E1'}`,
                          backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
                          color: isDarkMode ? '#FFFFFF' : '#0F172A',
                          fontSize: '0.78rem',
                        }}
                      >
                        <option value="">Any CGPA</option>
                        <option value="6.0">&gt;= 6.0</option>
                        <option value="7.0">&gt;= 7.0 (Core Bar)</option>
                        <option value="8.0">&gt;= 8.0 (Dream Bar)</option>
                        <option value="9.0">&gt;= 9.0 (Marquee)</option>
                      </select>
                    </div>

                    {/* Min DSA */}
                    <div>
                      <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748B' }}>Min DSA Score</label>
                      <select
                        value={rosterMinDsa}
                        onChange={(e) => {
                          setRosterMinDsa(e.target.value);
                          setRosterPage(1);
                        }}
                        style={{
                          width: '100%',
                          marginTop: '3px',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          border: `1px solid ${isDarkMode ? '#334155' : '#CBD5E1'}`,
                          backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
                          color: isDarkMode ? '#FFFFFF' : '#0F172A',
                          fontSize: '0.78rem',
                        }}
                      >
                        <option value="">Any DSA</option>
                        <option value="6.0">&gt;= 6.0 / 10</option>
                        <option value="7.0">&gt;= 7.0 / 10</option>
                        <option value="8.0">&gt;= 8.0 / 10</option>
                      </select>
                    </div>

                    {/* Min Aptitude */}
                    <div>
                      <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748B' }}>Min Aptitude</label>
                      <select
                        value={rosterMinApt}
                        onChange={(e) => {
                          setRosterMinApt(e.target.value);
                          setRosterPage(1);
                        }}
                        style={{
                          width: '100%',
                          marginTop: '3px',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          border: `1px solid ${isDarkMode ? '#334155' : '#CBD5E1'}`,
                          backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
                          color: isDarkMode ? '#FFFFFF' : '#0F172A',
                          fontSize: '0.78rem',
                        }}
                      >
                        <option value="">Any Aptitude</option>
                        <option value="60">&gt;= 60 / 100</option>
                        <option value="70">&gt;= 70 / 100</option>
                        <option value="80">&gt;= 80 / 100</option>
                      </select>
                    </div>

                    {/* Max Backlogs */}
                    <div>
                      <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748B' }}>Max Backlogs</label>
                      <select
                        value={rosterMaxBacklogs}
                        onChange={(e) => {
                          setRosterMaxBacklogs(e.target.value);
                          setRosterPage(1);
                        }}
                        style={{
                          width: '100%',
                          marginTop: '3px',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          border: `1px solid ${isDarkMode ? '#334155' : '#CBD5E1'}`,
                          backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
                          color: isDarkMode ? '#FFFFFF' : '#0F172A',
                          fontSize: '0.78rem',
                        }}
                      >
                        <option value="ALL">Any Backlogs</option>
                        <option value="0">0 Backlogs (Clean)</option>
                        <option value="1">&lt;= 1 Backlog</option>
                        <option value="2">&lt;= 2 Backlogs</option>
                      </select>
                    </div>

                    {/* Placement Risk */}
                    <div>
                      <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748B' }}>Placement Risk</label>
                      <select
                        value={rosterRiskLevel}
                        onChange={(e) => {
                          setRosterRiskLevel(e.target.value);
                          setRosterPage(1);
                        }}
                        style={{
                          width: '100%',
                          marginTop: '3px',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          border: `1px solid ${isDarkMode ? '#334155' : '#CBD5E1'}`,
                          backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
                          color: isDarkMode ? '#FFFFFF' : '#0F172A',
                          fontSize: '0.78rem',
                        }}
                      >
                        <option value="ALL">All Risk Levels</option>
                        <option value="LOW">Low Risk (Placement Ready)</option>
                        <option value="MEDIUM">Medium Risk</option>
                        <option value="HIGH">High Risk</option>
                      </select>
                    </div>

                    {/* Eligibility Status */}
                    <div>
                      <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748B' }}>Eligibility</label>
                      <select
                        value={rosterEligibility}
                        onChange={(e) => {
                          setRosterEligibility(e.target.value);
                          setRosterPage(1);
                        }}
                        style={{
                          width: '100%',
                          marginTop: '3px',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          border: `1px solid ${isDarkMode ? '#334155' : '#CBD5E1'}`,
                          backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
                          color: isDarkMode ? '#FFFFFF' : '#0F172A',
                          fontSize: '0.78rem',
                        }}
                      >
                        <option value="ALL">All Statuses</option>
                        <option value="ELIGIBLE">Eligible</option>
                        <option value="NEEDS_REVIEW">Needs Review</option>
                        <option value="INELIGIBLE">Ineligible</option>
                      </select>
                    </div>

                    {/* Sort Selector */}
                    <div>
                      <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748B' }}>Sort Candidates</label>
                      <select
                        value={`${rosterSortBy}_${rosterSortOrder}`}
                        onChange={(e) => {
                          const [by, order] = e.target.value.split('_');
                          setRosterSortBy(by);
                          setRosterSortOrder(order);
                          setRosterPage(1);
                        }}
                        style={{
                          width: '100%',
                          marginTop: '3px',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          border: `1px solid ${isDarkMode ? '#334155' : '#CBD5E1'}`,
                          backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
                          color: isDarkMode ? '#FFFFFF' : '#0F172A',
                          fontSize: '0.78rem',
                        }}
                      >
                        <option value="cgpa_desc">Highest CGPA</option>
                        <option value="cgpa_asc">Lowest CGPA</option>
                        <option value="dsa_desc">Highest DSA Score</option>
                        <option value="aptitude_desc">Highest Aptitude</option>
                        <option value="readiness_desc">Highest Placement Readiness</option>
                        <option value="name_asc">Student Name (A-Z)</option>
                        <option value="name_desc">Student Name (Z-A)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* CANDIDATES TABLE (13 COLUMNS) */}
                <div
                  style={{
                    borderRadius: '16px',
                    padding: '1.25rem',
                    backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
                    border: `1px solid ${isDarkMode ? '#1E293B' : '#E2E8F0'}`,
                    position: 'relative',
                    minHeight: '400px',
                  }}
                >
                  {rosterLoading && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.7)' : 'rgba(255, 255, 255, 0.7)',
                        backdropFilter: 'blur(3px)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 20,
                        borderRadius: '16px',
                      }}
                    >
                      <Loader2 size={36} className="animate-spin" style={{ color: '#8B5CF6' }} />
                      <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#8B5CF6', marginTop: '10px' }}>
                        Loading candidates from 50,008 database records...
                      </span>
                    </div>
                  )}

                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                      <thead>
                        <tr style={{ borderBottom: `2px solid ${isDarkMode ? '#334155' : '#E2E8F0'}`, color: '#64748B', whiteSpace: 'nowrap' }}>
                          <th style={{ padding: '10px 12px' }}>#</th>
                          <th style={{ padding: '10px 12px' }}>Candidate Name</th>
                          <th style={{ padding: '10px 12px' }}>Roll Number</th>
                          <th style={{ padding: '10px 12px' }}>Department</th>
                          <th style={{ padding: '10px 12px' }}>CGPA</th>
                          <th style={{ padding: '10px 12px' }}>DSA Score</th>
                          <th style={{ padding: '10px 12px' }}>Aptitude</th>
                          <th style={{ padding: '10px 12px' }}>Attendance</th>
                          <th style={{ padding: '10px 12px' }}>Backlogs</th>
                          <th style={{ padding: '10px 12px' }}>Readiness</th>
                          <th style={{ padding: '10px 12px' }}>Placement Risk</th>
                          <th style={{ padding: '10px 12px' }}>Eligibility</th>
                          <th style={{ padding: '10px 12px' }}>Stage</th>
                          <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rosterData.candidates.map((cand, idx) => {
                          const rowNum = (rosterData.page - 1) * rosterData.limit + idx + 1;
                          const isElig = cand.eligibility_status === 'ELIGIBLE';
                          const isReview = cand.eligibility_status === 'NEEDS_REVIEW';
                          const eligColor = isElig ? '#059669' : isReview ? '#D97706' : '#DC2626';
                          const eligBg = isElig ? '#ECFDF5' : isReview ? '#FEF3C7' : '#FEE2E2';

                          const isLowRisk = cand.placement_risk === 'LOW';
                          const isMedRisk = cand.placement_risk === 'MEDIUM';
                          const riskColor = isLowRisk ? '#059669' : isMedRisk ? '#D97706' : '#DC2626';
                          const riskBg = isLowRisk ? '#ECFDF5' : isMedRisk ? '#FEF3C7' : '#FEE2E2';

                          return (
                            <tr
                              key={cand.roll_no || cand.id}
                              style={{
                                borderBottom: `1px solid ${isDarkMode ? '#1E293B' : '#F1F5F9'}`,
                                transition: 'background-color 0.15s ease',
                              }}
                            >
                              <td style={{ padding: '10px 12px', color: '#94A3B8', fontSize: '0.74rem' }}>{rowNum}</td>

                              <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <StudentAvatar src={cand.avatar || cand.avatar_url} name={cand.name || cand.full_name} id={cand.roll_no || cand.id} size={32} />
                                  <strong style={{ color: isDarkMode ? '#FFFFFF' : '#0F172A' }}>
                                    {cand.name || cand.full_name}
                                  </strong>
                                </div>
                              </td>

                              <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: '0.78rem', color: '#8B5CF6', fontWeight: 700 }}>
                                {cand.roll_no}
                              </td>

                              <td style={{ padding: '10px 12px', color: '#64748B', whiteSpace: 'nowrap' }}>
                                {cand.department}
                              </td>

                              <td style={{ padding: '10px 12px', fontWeight: 800, color: cand.cgpa >= 8.0 ? '#059669' : cand.cgpa >= 6.5 ? '#D97706' : '#DC2626' }}>
                                {cand.cgpa}
                              </td>

                              <td style={{ padding: '10px 12px', fontWeight: 700, color: cand.dsa_score >= 7.0 ? '#8B5CF6' : '#64748B' }}>
                                {cand.dsa_score}/10
                              </td>

                              <td style={{ padding: '10px 12px', fontWeight: 700, color: cand.aptitude_score >= 70 ? '#0284C7' : '#64748B' }}>
                                {cand.aptitude_score}/100
                              </td>

                              <td style={{ padding: '10px 12px', color: '#64748B' }}>
                                {cand.attendance}%
                              </td>

                              <td style={{ padding: '10px 12px', fontWeight: 700, color: cand.backlogs === 0 ? '#059669' : '#DC2626' }}>
                                {cand.backlogs}
                              </td>

                              <td style={{ padding: '10px 12px', fontWeight: 700 }}>
                                {cand.readiness_score || cand.success_score}%
                              </td>

                              <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                                <span
                                  style={{
                                    padding: '3px 8px',
                                    borderRadius: '6px',
                                    fontSize: '0.68rem',
                                    fontWeight: 700,
                                    backgroundColor: riskBg,
                                    color: riskColor,
                                    border: `1px solid ${riskColor}30`,
                                  }}
                                >
                                  {cand.placement_risk}
                                </span>
                              </td>

                              <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                                <span
                                  style={{
                                    padding: '3px 8px',
                                    borderRadius: '6px',
                                    fontSize: '0.68rem',
                                    fontWeight: 700,
                                    backgroundColor: eligBg,
                                    color: eligColor,
                                    border: `1px solid ${eligColor}30`,
                                  }}
                                >
                                  {cand.eligibility_status}
                                </span>
                              </td>

                              <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                                <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>
                                  {cand.recruitment_stage}
                                </span>
                              </td>

                              <td style={{ padding: '10px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                  <button
                                    onClick={() => handleInspectCandidate(cand)}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '3px',
                                      padding: '5px 9px',
                                      borderRadius: '6px',
                                      border: `1px solid ${isDarkMode ? '#334155' : '#CBD5E1'}`,
                                      backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
                                      color: isDarkMode ? '#E2E8F0' : '#334155',
                                      fontSize: '0.74rem',
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                    }}
                                  >
                                    <Eye size={12} />
                                    <span>Inspect</span>
                                  </button>
                                  <button
                                    onClick={() => handleOpenMatchModal(cand)}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '3px',
                                      padding: '5px 9px',
                                      borderRadius: '6px',
                                      border: 'none',
                                      backgroundColor: '#8B5CF6',
                                      color: '#FFFFFF',
                                      fontSize: '0.74rem',
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                    }}
                                  >
                                    <Sparkles size={12} />
                                    <span>Match Job</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* PAGINATION BAR (FIRST, PREV, CURRENT/TOTAL, NEXT, LAST) */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderTop: `1px solid ${isDarkMode ? '#1E293B' : '#E2E8F0'}`,
                      paddingTop: '1rem',
                      marginTop: '1rem',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    <div style={{ fontSize: '0.80rem', color: '#64748B' }}>
                      Showing <strong>{startItem}</strong> to <strong>{endItem}</strong> of <strong>{rosterData.total.toLocaleString()}</strong> candidates
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {/* First Page */}
                      <button
                        disabled={rosterPage <= 1 || rosterLoading}
                        onClick={() => setRosterPage(1)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '8px',
                          border: `1px solid ${isDarkMode ? '#334155' : '#CBD5E1'}`,
                          backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
                          color: rosterPage <= 1 ? '#94A3B8' : isDarkMode ? '#FFFFFF' : '#0F172A',
                          cursor: rosterPage <= 1 ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                        }}
                        title="First Page"
                      >
                        <ChevronsLeft size={14} />
                        <span>First</span>
                      </button>

                      {/* Prev Page */}
                      <button
                        disabled={rosterPage <= 1 || rosterLoading}
                        onClick={() => setRosterPage(rosterPage - 1)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '8px',
                          border: `1px solid ${isDarkMode ? '#334155' : '#CBD5E1'}`,
                          backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
                          color: rosterPage <= 1 ? '#94A3B8' : isDarkMode ? '#FFFFFF' : '#0F172A',
                          cursor: rosterPage <= 1 ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                        }}
                      >
                        <ChevronLeft size={14} />
                        <span>Prev</span>
                      </button>

                      {/* Page Info */}
                      <div
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          backgroundColor: '#8B5CF615',
                          color: '#8B5CF6',
                          fontSize: '0.80rem',
                          fontWeight: 700,
                        }}
                      >
                        Page {rosterData.page} of {rosterData.total_pages}
                      </div>

                      {/* Next Page */}
                      <button
                        disabled={rosterPage >= rosterData.total_pages || rosterLoading}
                        onClick={() => setRosterPage(rosterPage + 1)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '8px',
                          border: `1px solid ${isDarkMode ? '#334155' : '#CBD5E1'}`,
                          backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
                          color: rosterPage >= rosterData.total_pages ? '#94A3B8' : isDarkMode ? '#FFFFFF' : '#0F172A',
                          cursor: rosterPage >= rosterData.total_pages ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                        }}
                      >
                        <span>Next</span>
                        <ChevronRight size={14} />
                      </button>

                      {/* Last Page */}
                      <button
                        disabled={rosterPage >= rosterData.total_pages || rosterLoading}
                        onClick={() => setRosterPage(rosterData.total_pages)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '8px',
                          border: `1px solid ${isDarkMode ? '#334155' : '#CBD5E1'}`,
                          backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
                          color: rosterPage >= rosterData.total_pages ? '#94A3B8' : isDarkMode ? '#FFFFFF' : '#0F172A',
                          cursor: rosterPage >= rosterData.total_pages ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                        }}
                        title="Last Page"
                      >
                        <span>Last</span>
                        <ChevronsRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* =========================================================================
                VIEW B: CANDIDATE PIPELINE (11 STAGES)
               ========================================================================= */}
            {activeView === 'pipeline' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* 11-STAGE FUNNEL CARDS */}
                <div style={{ overflowX: 'auto', paddingBottom: '8px' }}>
                  <div style={{ display: 'flex', gap: '10px', minWidth: '1100px' }}>
                    {CANONICAL_STAGES.map((st, idx) => {
                      const count = stageCounts[st.key] || 0;
                      const isSelected = pipelineStageFilter === st.key;
                      return (
                        <button
                          key={st.key}
                          onClick={() => setPipelineStageFilter(isSelected ? 'ALL' : st.key)}
                          style={{
                            flex: 1,
                            padding: '12px 10px',
                            borderRadius: '12px',
                            backgroundColor: isSelected ? st.color : isDarkMode ? '#0F172A' : '#FFFFFF',
                            color: isSelected ? '#FFFFFF' : isDarkMode ? '#F8FAFC' : '#0F172A',
                            border: `1px solid ${isSelected ? st.color : isDarkMode ? '#1E293B' : '#E2E8F0'}`,
                            cursor: 'pointer',
                            textAlign: 'center',
                            transition: 'all 0.15s ease',
                            boxShadow: isSelected ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
                          }}
                        >
                          <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.85 }}>
                            {idx + 1}. {st.label}
                          </div>
                          <div style={{ fontSize: '1.4rem', fontWeight: 900, marginTop: '4px' }}>
                            {count}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* FILTER BAR FOR PIPELINE */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem',
                    borderRadius: '14px',
                    backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
                    border: `1px solid ${isDarkMode ? '#1E293B' : '#E2E8F0'}`,
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748B' }}>Filter by:</div>
                    <select
                      value={pipelineStageFilter}
                      onChange={(e) => setPipelineStageFilter(e.target.value)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: `1px solid ${isDarkMode ? '#334155' : '#CBD5E1'}`,
                        backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
                        color: isDarkMode ? '#FFFFFF' : '#0F172A',
                        fontSize: '0.82rem',
                        outline: 'none',
                      }}
                    >
                      <option value="ALL">All 11 Stages</option>
                      {CANONICAL_STAGES.map((st) => (
                        <option key={st.key} value={st.key}>{st.label}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ fontSize: '0.82rem', color: '#64748B' }}>
                    Showing <strong>{filteredPipeline.length}</strong> active pipeline applications
                  </div>
                </div>

                {/* PIPELINE APPLICATIONS TABLE */}
                <div
                  style={{
                    borderRadius: '16px',
                    padding: '1.5rem',
                    backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
                    border: `1px solid ${isDarkMode ? '#1E293B' : '#E2E8F0'}`,
                  }}
                >
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${isDarkMode ? '#1E293B' : '#E2E8F0'}`, color: '#64748B' }}>
                          <th style={{ padding: '10px 12px' }}>Candidate</th>
                          <th style={{ padding: '10px 12px' }}>Target Company & Role</th>
                          <th style={{ padding: '10px 12px' }}>Current Stage</th>
                          <th style={{ padding: '10px 12px' }}>Role Match</th>
                          <th style={{ padding: '10px 12px' }}>Last Updated</th>
                          <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPipeline.map((app) => {
                          const stageDef = CANONICAL_STAGES.find((s) => s.key === app.stage) || CANONICAL_STAGES[0];
                          return (
                            <tr key={app.id} style={{ borderBottom: `1px solid ${isDarkMode ? '#1E293B' : '#F1F5F9'}` }}>
                              <td style={{ padding: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <StudentAvatar src={app.avatar_url} name={app.student_name} id={app.student_roll_no} size={36} />
                                  <div>
                                    <div style={{ fontWeight: 700, color: isDarkMode ? '#FFFFFF' : '#0F172A' }}>
                                      {app.student_name}
                                    </div>
                                    <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                                      {app.student_roll_no} • {app.department}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td style={{ padding: '12px' }}>
                                <div style={{ fontWeight: 700 }}>{app.company_name}</div>
                                <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{app.job_title} ({app.package_lpa} LPA)</div>
                              </td>
                              <td style={{ padding: '12px' }}>
                                <span
                                  style={{
                                    padding: '4px 10px',
                                    borderRadius: '9999px',
                                    fontSize: '0.72rem',
                                    fontWeight: 800,
                                    backgroundColor: stageDef.bg,
                                    color: stageDef.color,
                                    border: `1px solid ${stageDef.color}40`,
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {stageDef.label}
                                </span>
                              </td>
                              <td style={{ padding: '12px' }}>
                                <span style={{ fontWeight: 800, color: (app.match_score || 80) >= 80 ? '#059669' : '#D97706' }}>
                                  {app.match_score || 85}%
                                </span>
                              </td>
                              <td style={{ padding: '12px', fontSize: '0.76rem', color: '#64748B' }}>
                                {app.updated_at ? new Date(app.updated_at).toLocaleDateString() : 'Recent'}
                              </td>
                              <td style={{ padding: '12px', textAlign: 'right' }}>
                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                  <button
                                    onClick={() => handleOpenAdvanceStage(app)}
                                    style={{
                                      padding: '6px 10px',
                                      borderRadius: '8px',
                                      border: 'none',
                                      backgroundColor: '#8B5CF6',
                                      color: '#FFFFFF',
                                      fontSize: '0.74rem',
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                    }}
                                  >
                                    Move Stage
                                  </button>
                                  <button
                                    onClick={() => handleOpenStageHistory(app)}
                                    style={{
                                      padding: '6px 8px',
                                      borderRadius: '8px',
                                      border: `1px solid ${isDarkMode ? '#334155' : '#CBD5E1'}`,
                                      backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
                                      color: isDarkMode ? '#E2E8F0' : '#475569',
                                      fontSize: '0.74rem',
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                    }}
                                  >
                                    History
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* =========================================================================
                VIEW C: RECRUITMENT DRIVES (20 COMPANIES)
               ========================================================================= */}
            {activeView === 'drives' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* SEARCH & FILTERS CONTROLS */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1.25rem',
                    borderRadius: '16px',
                    backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
                    border: `1px solid ${isDarkMode ? '#1E293B' : '#E2E8F0'}`,
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748B' }}>Filter Drives:</div>

                    <select
                      value={driveStatusFilter}
                      onChange={(e) => setDriveStatusFilter(e.target.value)}
                      style={{
                        padding: '7px 12px',
                        borderRadius: '8px',
                        border: `1px solid ${isDarkMode ? '#334155' : '#CBD5E1'}`,
                        backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
                        color: isDarkMode ? '#FFFFFF' : '#0F172A',
                        fontSize: '0.82rem',
                        outline: 'none',
                      }}
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="ACTIVE">Active Drives</option>
                      <option value="UPCOMING">Upcoming Drives</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>

                    <select
                      value={drivePackageFilter}
                      onChange={(e) => setDrivePackageFilter(e.target.value)}
                      style={{
                        padding: '7px 12px',
                        borderRadius: '8px',
                        border: `1px solid ${isDarkMode ? '#334155' : '#CBD5E1'}`,
                        backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
                        color: isDarkMode ? '#FFFFFF' : '#0F172A',
                        fontSize: '0.82rem',
                        outline: 'none',
                      }}
                    >
                      <option value="ALL">All CTC Packages</option>
                      <option value="10">&gt;= 10 LPA (High Core)</option>
                      <option value="20">&gt;= 20 LPA (Super Dream)</option>
                      <option value="30">&gt;= 30 LPA (Marquee Tech)</option>
                    </select>

                    <select
                      value={driveSortBy}
                      onChange={(e) => setDriveSortBy(e.target.value)}
                      style={{
                        padding: '7px 12px',
                        borderRadius: '8px',
                        border: `1px solid ${isDarkMode ? '#334155' : '#CBD5E1'}`,
                        backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
                        color: isDarkMode ? '#FFFFFF' : '#0F172A',
                        fontSize: '0.82rem',
                        outline: 'none',
                      }}
                    >
                      <option value="package_desc">Highest Package (CTC LPA)</option>
                      <option value="package_asc">Lowest Package (CTC LPA)</option>
                      <option value="company_asc">Company Name (A-Z)</option>
                      <option value="deadline_asc">Upcoming Deadline</option>
                    </select>
                  </div>

                  <div style={{ fontSize: '0.82rem', color: '#64748B' }}>
                    Showing <strong>{filteredJobs.length}</strong> of <strong>{jobsData.length}</strong> recruitment drives
                  </div>
                </div>

                {/* 20 CORPORATE RECRUITMENT DRIVES GRID */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
                  {filteredJobs.map((job) => {
                    const isActive = job.drive_status === 'ACTIVE' || job.recruitment_stage === 'ACTIVE';
                    const isUpcoming = job.drive_status === 'UPCOMING';
                    const statusColor = isActive ? '#059669' : isUpcoming ? '#D97706' : '#64748B';
                    const statusBg = isActive ? '#ECFDF5' : isUpcoming ? '#FEF3C7' : '#F1F5F9';

                    return (
                      <div
                        key={job.id}
                        style={{
                          borderRadius: '16px',
                          padding: '1.5rem',
                          backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
                          border: `1px solid ${isDarkMode ? '#1E293B' : '#E2E8F0'}`,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                        }}
                      >
                        <div>
                          {/* Top Header Strip */}
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '12px' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '1.15rem', fontWeight: 800, color: isDarkMode ? '#FFFFFF' : '#0F172A' }}>
                                  {job.company_name}
                                </span>
                                <span
                                  style={{
                                    padding: '3px 8px',
                                    borderRadius: '6px',
                                    fontSize: '0.68rem',
                                    fontWeight: 700,
                                    backgroundColor: statusBg,
                                    color: statusColor,
                                    border: `1px solid ${statusColor}40`,
                                  }}
                                >
                                  {job.drive_status || 'ACTIVE'}
                                </span>
                              </div>
                              <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#8B5CF6', marginTop: '2px' }}>
                                {job.job_title}
                              </div>
                            </div>

                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#059669', lineHeight: 1 }}>
                                {job.package_lpa} LPA
                              </div>
                              <div style={{ fontSize: '0.68rem', color: '#64748B', marginTop: '2px' }}>CTC Offered</div>
                            </div>
                          </div>

                          <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '0 0 12px 0', lineHeight: 1.4 }}>
                            {job.description || 'Enterprise role focused on scalable architectures, telemetry systems, and microservices.'}
                          </p>

                          {/* Mandatory vs Preferred Badges */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem' }}>
                              <span style={{ padding: '2px 6px', borderRadius: '4px', backgroundColor: '#FEE2E2', color: '#DC2626', fontWeight: 700 }}>
                                MANDATORY
                              </span>
                              <span style={{ color: isDarkMode ? '#CBD5E1' : '#334155' }}>
                                CGPA &gt;= {job.min_cgpa} • Backlogs &lt;= {job.max_backlogs} • {job.dsa_mandatory ? `DSA >= ${job.min_dsa_score}/10` : ''} {job.mandatory_skills ? `• ${job.mandatory_skills}` : ''}
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem' }}>
                              <span style={{ padding: '2px 6px', borderRadius: '4px', backgroundColor: '#EEF2FF', color: '#6366F1', fontWeight: 700 }}>
                                PREFERRED
                              </span>
                              <span style={{ color: isDarkMode ? '#94A3B8' : '#64748B' }}>
                                {job.preferred_skills || 'Cloud Architecture, System Design'} • Aptitude &gt;= {job.min_aptitude_score}/100
                              </span>
                            </div>
                          </div>

                          {/* Metadata Grid */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '0.74rem', color: '#64748B', marginBottom: '14px', backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC', padding: '10px', borderRadius: '10px' }}>
                            <div>📍 {job.location || 'Bengaluru, Hyderabad'}</div>
                            <div>💼 {job.job_type || 'Full Time'}</div>
                            <div>👥 {job.total_vacancies || 15} Vacancies</div>
                            <div>📅 Deadline: <strong>{job.deadline}</strong></div>
                          </div>
                        </div>

                        {/* Bottom Actions Bar */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `1px solid ${isDarkMode ? '#1E293B' : '#F1F5F9'}`, paddingTop: '12px', gap: '8px' }}>
                          <div style={{ fontSize: '0.74rem', color: '#64748B' }}>
                            <strong>{job.registered_count ?? 8}</strong> Applicants
                          </div>

                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={() => handleToggleDriveStatus(job.id, isActive ? 'COMPLETED' : 'ACTIVE')}
                              style={{
                                padding: '5px 9px',
                                borderRadius: '6px',
                                border: `1px solid ${isDarkMode ? '#334155' : '#CBD5E1'}`,
                                backgroundColor: 'transparent',
                                color: isDarkMode ? '#E2E8F0' : '#475569',
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              {isActive ? 'Mark Done' : 'Activate'}
                            </button>

                            <button
                              onClick={() => handleOpenEditDrive(job)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '5px 10px',
                                borderRadius: '6px',
                                border: 'none',
                                backgroundColor: '#8B5CF6',
                                color: '#FFFFFF',
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              <Edit2 size={12} />
                              <span>Edit Drive</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* =========================================================================
                VIEW D: SKILL BENCHMARKS
               ========================================================================= */}
            {activeView === 'benchmarks' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                  {(benchmarksData?.corporate_tiers || [
                    { tier: 'Tier 1: Dream Super (>=20 LPA)', benchmark: 'CGPA >= 8.0, DSA >= 8.0, Aptitude >= 75', companies: 'Google, Microsoft, Adobe, Oracle', eligible_pct: 24.5 },
                    { tier: 'Tier 2: High Core (12-20 LPA)', benchmark: 'CGPA >= 7.5, DSA >= 7.0, Aptitude >= 70', companies: 'Amazon, Cisco, TI, Deloitte', eligible_pct: 42.0 },
                    { tier: 'Tier 3: Enterprise IT (6-12 LPA)', benchmark: 'CGPA >= 6.5, DSA >= 5.5, Aptitude >= 60', companies: 'Infosys, TCS, Accenture, Capgemini', eligible_pct: 78.6 },
                    { tier: 'Tier 4: Mass Recruiter (<6 LPA)', benchmark: 'CGPA >= 6.0, Aptitude >= 55', companies: 'Tech Mahindra, HCLTech, Wipro', eligible_pct: 91.2 },
                  ]).map((t) => (
                    <div
                      key={t.tier}
                      style={{
                        padding: '1.25rem',
                        borderRadius: '14px',
                        backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
                        border: `1px solid ${isDarkMode ? '#1E293B' : '#E2E8F0'}`,
                      }}
                    >
                      <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#8B5CF6' }}>{t.tier}</div>
                      <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '4px' }}>{t.benchmark}</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 900, marginTop: '8px', color: '#059669' }}>
                        {t.eligible_pct}%
                      </div>
                      <div style={{ fontSize: '0.70rem', color: '#94A3B8', marginTop: '2px' }}>Cohort Ready • {t.companies}</div>
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    borderRadius: '16px',
                    padding: '1.5rem',
                    backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
                    border: `1px solid ${isDarkMode ? '#1E293B' : '#E2E8F0'}`,
                  }}
                >
                  <div style={{ marginBottom: '1.25rem' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>Departmental Skill Performance vs Corporate Bar</h3>
                    <span style={{ fontSize: '0.76rem', color: '#64748B' }}>Average scores across core programming languages, DSA, and quantitative aptitude</span>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${isDarkMode ? '#1E293B' : '#E2E8F0'}`, color: '#64748B' }}>
                          <th style={{ padding: '10px 12px' }}>Department</th>
                          <th style={{ padding: '10px 12px' }}>Python</th>
                          <th style={{ padding: '10px 12px' }}>Java</th>
                          <th style={{ padding: '10px 12px' }}>C++</th>
                          <th style={{ padding: '10px 12px' }}>DSA (/10)</th>
                          <th style={{ padding: '10px 12px' }}>Aptitude (/100)</th>
                          <th style={{ padding: '10px 12px' }}>Readiness Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(benchmarksData?.departments || [
                          { department: 'Computer Science & Engineering', python: 9.1, java: 8.8, cpp: 8.9, dsa: 8.2, aptitude: 78.4, readiness_pct: 88.5 },
                          { department: 'Information Technology', python: 8.9, java: 9.0, cpp: 8.2, dsa: 7.9, aptitude: 76.2, readiness_pct: 85.0 },
                          { department: 'Electronics & Communication', python: 7.8, java: 7.5, cpp: 8.8, dsa: 7.1, aptitude: 72.0, readiness_pct: 76.8 },
                          { department: 'Electrical & Electronics', python: 7.2, java: 6.9, cpp: 7.4, dsa: 6.5, aptitude: 68.5, readiness_pct: 71.2 },
                          { department: 'Mechanical Engineering', python: 6.8, java: 6.2, cpp: 6.9, dsa: 5.8, aptitude: 64.0, readiness_pct: 65.5 },
                        ]).map((d) => (
                          <tr key={d.department} style={{ borderBottom: `1px solid ${isDarkMode ? '#1E293B' : '#F1F5F9'}` }}>
                            <td style={{ padding: '12px', fontWeight: 700 }}>{d.department}</td>
                            <td style={{ padding: '12px', color: '#8B5CF6', fontWeight: 600 }}>{d.python}/10</td>
                            <td style={{ padding: '12px', color: '#0284C7', fontWeight: 600 }}>{d.java}/10</td>
                            <td style={{ padding: '12px', color: '#D97706', fontWeight: 600 }}>{d.cpp}/10</td>
                            <td style={{ padding: '12px', fontWeight: 700, color: d.dsa >= 7.5 ? '#059669' : '#D97706' }}>{d.dsa}</td>
                            <td style={{ padding: '12px', fontWeight: 700 }}>{d.aptitude}</td>
                            <td style={{ padding: '12px' }}>
                              <span style={{ fontWeight: 800, color: d.readiness_pct >= 80 ? '#059669' : '#D97706' }}>
                                {d.readiness_pct}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* =========================================================================
                VIEW E: MOCK INTERVIEWS
               ========================================================================= */}
            {activeView === 'interviews' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                  <div style={{ padding: '1.25rem', borderRadius: '14px', backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF', border: `1px solid ${isDarkMode ? '#1E293B' : '#E2E8F0'}` }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748B', textTransform: 'uppercase' }}>Total Scheduled</div>
                    <div style={{ fontSize: '1.65rem', fontWeight: 800, marginTop: '2px' }}>{interviewsData.length || 6}</div>
                    <div style={{ fontSize: '0.72rem', color: '#8B5CF6' }}>Technical & HR Panels</div>
                  </div>

                  <div style={{ padding: '1.25rem', borderRadius: '14px', backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF', border: `1px solid ${isDarkMode ? '#1E293B' : '#E2E8F0'}` }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748B', textTransform: 'uppercase' }}>Average Score</div>
                    <div style={{ fontSize: '1.65rem', fontWeight: 800, marginTop: '2px', color: '#059669' }}>83.5 / 100</div>
                    <div style={{ fontSize: '0.72rem', color: '#10B981' }}>+4.2% from preliminary</div>
                  </div>

                  <div style={{ padding: '1.25rem', borderRadius: '14px', backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF', border: `1px solid ${isDarkMode ? '#1E293B' : '#E2E8F0'}` }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748B', textTransform: 'uppercase' }}>Attendance Rate</div>
                    <div style={{ fontSize: '1.65rem', fontWeight: 800, marginTop: '2px', color: '#3B82F6' }}>96.5%</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Institutional turnout</div>
                  </div>
                </div>

                <div
                  style={{
                    borderRadius: '16px',
                    padding: '1.5rem',
                    backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
                    border: `1px solid ${isDarkMode ? '#1E293B' : '#E2E8F0'}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>Mock Interview Sessions</h3>
                      <span style={{ fontSize: '0.76rem', color: '#64748B' }}>Simulated corporate rounds with structured evaluative rubric</span>
                    </div>

                    <select
                      value={interviewStatusFilter}
                      onChange={(e) => setInterviewStatusFilter(e.target.value)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: `1px solid ${isDarkMode ? '#334155' : '#CBD5E1'}`,
                        backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
                        color: isDarkMode ? '#FFFFFF' : '#0F172A',
                        fontSize: '0.82rem',
                        outline: 'none',
                      }}
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="Scheduled">Scheduled</option>
                      <option value="Completed">Completed</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
                    {filteredInterviews.map((item) => {
                      const isCompleted = item.status === 'Completed';
                      return (
                        <div
                          key={item.id}
                          style={{
                            padding: '1.25rem',
                            borderRadius: '14px',
                            backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
                            border: `1px solid ${isDarkMode ? '#334155' : '#E2E8F0'}`,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                              <div>
                                <strong style={{ fontSize: '0.94rem' }}>{item.student_name}</strong>
                                <div style={{ fontSize: '0.74rem', color: '#64748B' }}>
                                  {item.student_roll_no} • {item.department}
                                </div>
                              </div>
                              <span
                                style={{
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  fontSize: '0.68rem',
                                  fontWeight: 700,
                                  backgroundColor: isCompleted ? '#ECFDF5' : '#EEF2FF',
                                  color: isCompleted ? '#059669' : '#6366F1',
                                  border: `1px solid ${isCompleted ? '#A7F3D0' : '#C7D2FE'}`,
                                }}
                              >
                                {item.status}
                              </span>
                            </div>

                            <div style={{ fontSize: '0.78rem', color: isDarkMode ? '#CBD5E1' : '#334155', marginBottom: '8px' }}>
                              👨‍🏫 Interviewer: <strong>{item.interviewer_name}</strong> ({item.interview_type})
                            </div>
                            <div style={{ fontSize: '0.74rem', color: '#64748B', marginBottom: '10px' }}>
                              🕒 {item.scheduled_date} at {item.scheduled_time}
                            </div>

                            {isCompleted && item.score && (
                              <div style={{ padding: '8px 10px', borderRadius: '8px', backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF', border: `1px solid ${isDarkMode ? '#334155' : '#E2E8F0'}`, marginBottom: '10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem' }}>
                                  <span>Score:</span>
                                  <strong style={{ color: '#059669' }}>{item.score} / 100</strong>
                                </div>
                                {item.feedback && (
                                  <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '4px' }}>
                                    "{item.feedback}"
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', borderTop: `1px solid ${isDarkMode ? '#334155' : '#E2E8F0'}`, paddingTop: '10px' }}>
                            <button
                              onClick={() => {
                                setFeedbackModalInterview(item);
                                setFeedbackForm({
                                  score: item.score || 85,
                                  attendance_status: item.attendance_status || 'Present',
                                  status: 'Completed',
                                  strengths: item.strengths || '',
                                  weaknesses: item.weaknesses || '',
                                  feedback: item.feedback || '',
                                });
                              }}
                              style={{
                                padding: '5px 10px',
                                borderRadius: '6px',
                                border: 'none',
                                backgroundColor: '#8B5CF6',
                                color: '#FFFFFF',
                                fontSize: '0.74rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              Record Feedback
                            </button>
                            <button
                              onClick={() => handleDeleteInterview(item.id)}
                              style={{
                                padding: '5px 8px',
                                borderRadius: '6px',
                                border: `1px solid ${isDarkMode ? '#475569' : '#CBD5E1'}`,
                                backgroundColor: 'transparent',
                                color: '#EF4444',
                                fontSize: '0.74rem',
                                cursor: 'pointer',
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* =========================================================================
                VIEW F: PLACEMENT REPORTS
               ========================================================================= */}
            {activeView === 'reports' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div
                  style={{
                    borderRadius: '16px',
                    padding: '1.5rem',
                    backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
                    border: `1px solid ${isDarkMode ? '#1E293B' : '#E2E8F0'}`,
                  }}
                >
                  <div style={{ marginBottom: '1.25rem' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>Salary Package Distribution Histogram</h3>
                    <span style={{ fontSize: '0.76rem', color: '#64748B' }}>Corporate CTC compensation brackets across all 20 recruitment partners</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                    {(reportsData?.salary_tiers || [
                      { bracket: '< 6 LPA', drives_count: 2, pct: 10.0, color: '#94A3B8' },
                      { bracket: '6 - 10 LPA', drives_count: 5, pct: 25.0, color: '#3B82F6' },
                      { bracket: '10 - 15 LPA', drives_count: 3, pct: 15.0, color: '#10B981' },
                      { bracket: '15 - 25 LPA', drives_count: 4, pct: 20.0, color: '#8B5CF6' },
                      { bracket: '>= 25 LPA (Marquee)', drives_count: 6, pct: 30.0, color: '#EC4899' },
                    ]).map((tier) => (
                      <div
                        key={tier.bracket}
                        style={{
                          padding: '14px',
                          borderRadius: '12px',
                          backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
                          border: `1px solid ${isDarkMode ? '#334155' : '#E2E8F0'}`,
                          borderLeft: `4px solid ${tier.color}`,
                        }}
                      >
                        <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600 }}>{tier.bracket}</div>
                        <div style={{ fontSize: '1.45rem', fontWeight: 900, color: isDarkMode ? '#FFFFFF' : '#0F172A', marginTop: '2px' }}>
                          {tier.drives_count} Drives
                        </div>
                        <div style={{ fontSize: '0.72rem', color: tier.color, fontWeight: 700, marginTop: '2px' }}>
                          {tier.pct}% of Corporate Catalog
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  style={{
                    borderRadius: '16px',
                    padding: '1.5rem',
                    backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
                    border: `1px solid ${isDarkMode ? '#1E293B' : '#E2E8F0'}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>Corporate Placement Partner Scorecard</h3>
                      <span style={{ fontSize: '0.76rem', color: '#64748B' }}>Drives, packages, vacancies, and selection outcomes</span>
                    </div>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${isDarkMode ? '#1E293B' : '#E2E8F0'}`, color: '#64748B' }}>
                          <th style={{ padding: '10px 12px' }}>Company</th>
                          <th style={{ padding: '10px 12px' }}>Job Role</th>
                          <th style={{ padding: '10px 12px' }}>Package</th>
                          <th style={{ padding: '10px 12px' }}>Vacancies</th>
                          <th style={{ padding: '10px 12px' }}>Applicants</th>
                          <th style={{ padding: '10px 12px' }}>Offers Released</th>
                          <th style={{ padding: '10px 12px' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {jobsData.map((job) => (
                          <tr key={job.id} style={{ borderBottom: `1px solid ${isDarkMode ? '#1E293B' : '#F1F5F9'}` }}>
                            <td style={{ padding: '12px', fontWeight: 700 }}>{job.company_name}</td>
                            <td style={{ padding: '12px', color: '#64748B' }}>{job.job_title}</td>
                            <td style={{ padding: '12px', fontWeight: 800, color: '#059669' }}>{job.package_lpa} LPA</td>
                            <td style={{ padding: '12px' }}>{job.total_vacancies || 15}</td>
                            <td style={{ padding: '12px', fontWeight: 600 }}>{job.registered_count || 12}</td>
                            <td style={{ padding: '12px', fontWeight: 700, color: '#8B5CF6' }}>
                              {job.package_lpa >= 40 ? 3 : job.package_lpa >= 20 ? 6 : 14}
                            </td>
                            <td style={{ padding: '12px' }}>
                              <span
                                style={{
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  fontSize: '0.68rem',
                                  fontWeight: 700,
                                  backgroundColor: job.drive_status === 'ACTIVE' ? '#ECFDF5' : '#FEF3C7',
                                  color: job.drive_status === 'ACTIVE' ? '#059669' : '#D97706',
                                }}
                              >
                                {job.drive_status || 'ACTIVE'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* =========================================================================
                VIEW G: SETTINGS
               ========================================================================= */}
            {activeView === 'settings' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem' }}>
                <div
                  style={{
                    borderRadius: '16px',
                    padding: '1.5rem',
                    backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
                    border: `1px solid ${isDarkMode ? '#1E293B' : '#E2E8F0'}`,
                  }}
                >
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 1rem 0' }}>Placement Officer Profile</h3>

                  <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>Officer Full Name</label>
                      <input
                        type="text"
                        value={settingsData.officer_name || ''}
                        onChange={(e) => setSettingsData({ ...settingsData, officer_name: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: `1px solid ${isDarkMode ? '#334155' : '#CBD5E1'}`,
                          backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
                          color: isDarkMode ? '#FFFFFF' : '#0F172A',
                          fontSize: '0.84rem',
                          marginTop: '4px',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>Officer Email (Read Only)</label>
                      <input
                        type="email"
                        readOnly
                        value={settingsData.officer_email || 'tpo@codebuffet.edu'}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: `1px solid ${isDarkMode ? '#334155' : '#CBD5E1'}`,
                          backgroundColor: isDarkMode ? '#0F172A' : '#F1F5F9',
                          color: '#94A3B8',
                          fontSize: '0.84rem',
                          marginTop: '4px',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>Designation</label>
                      <input
                        type="text"
                        value={settingsData.designation || ''}
                        onChange={(e) => setSettingsData({ ...settingsData, designation: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: `1px solid ${isDarkMode ? '#334155' : '#CBD5E1'}`,
                          backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
                          color: isDarkMode ? '#FFFFFF' : '#0F172A',
                          fontSize: '0.84rem',
                          marginTop: '4px',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>Department / Cell</label>
                      <input
                        type="text"
                        value={settingsData.department || ''}
                        onChange={(e) => setSettingsData({ ...settingsData, department: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: `1px solid ${isDarkMode ? '#334155' : '#CBD5E1'}`,
                          backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
                          color: isDarkMode ? '#FFFFFF' : '#0F172A',
                          fontSize: '0.84rem',
                          marginTop: '4px',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>Contact Phone</label>
                      <input
                        type="text"
                        value={settingsData.phone || ''}
                        onChange={(e) => setSettingsData({ ...settingsData, phone: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: `1px solid ${isDarkMode ? '#334155' : '#CBD5E1'}`,
                          backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
                          color: isDarkMode ? '#FFFFFF' : '#0F172A',
                          fontSize: '0.84rem',
                          marginTop: '4px',
                        }}
                      />
                    </div>

                    <button
                      type="submit"
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: '#8B5CF6',
                        color: '#FFFFFF',
                        fontSize: '0.84rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        marginTop: '8px',
                      }}
                    >
                      Save Profile Settings
                    </button>
                  </form>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div
                    style={{
                      borderRadius: '16px',
                      padding: '1.5rem',
                      backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
                      border: `1px solid ${isDarkMode ? '#1E293B' : '#E2E8F0'}`,
                    }}
                  >
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 1rem 0' }}>Placement Season Configuration</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <label style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>Academic Year</label>
                        <select
                          value={settingsData.academic_year || '2025-2026'}
                          onChange={(e) => setSettingsData({ ...settingsData, academic_year: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: `1px solid ${isDarkMode ? '#334155' : '#CBD5E1'}`,
                            backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
                            color: isDarkMode ? '#FFFFFF' : '#0F172A',
                            fontSize: '0.84rem',
                            marginTop: '4px',
                          }}
                        >
                          <option value="2025-2026">2025-2026 (Current)</option>
                          <option value="2026-2027">2026-2027 (Upcoming)</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>Active Season</label>
                        <select
                          value={settingsData.placement_season || 'Phase-1 (Autumn / Winter 2026)'}
                          onChange={(e) => setSettingsData({ ...settingsData, placement_season: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: `1px solid ${isDarkMode ? '#334155' : '#CBD5E1'}`,
                            backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
                            color: isDarkMode ? '#FFFFFF' : '#0F172A',
                            fontSize: '0.84rem',
                            marginTop: '4px',
                          }}
                        >
                          <option value="Phase-1 (Autumn / Winter 2026)">Phase-1 (Autumn / Winter 2026)</option>
                          <option value="Phase-2 (Spring 2027)">Phase-2 (Spring 2027)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      borderRadius: '16px',
                      padding: '1.5rem',
                      backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
                      border: `1px solid ${isDarkMode ? '#1E293B' : '#E2E8F0'}`,
                    }}
                  >
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 1rem 0' }}>Change Account Password</h3>

                    {passwordNotice.text && (
                      <div
                        style={{
                          padding: '8px 12px',
                          borderRadius: '8px',
                          backgroundColor: passwordNotice.type === 'success' ? '#ECFDF5' : '#FEE2E2',
                          color: passwordNotice.type === 'success' ? '#059669' : '#DC2626',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          marginBottom: '10px',
                        }}
                      >
                        {passwordNotice.text}
                      </div>
                    )}

                    <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <input
                        type="password"
                        placeholder="Current Password"
                        value={passwordForm.current_password}
                        onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: `1px solid ${isDarkMode ? '#334155' : '#CBD5E1'}`,
                          backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
                          color: isDarkMode ? '#FFFFFF' : '#0F172A',
                          fontSize: '0.84rem',
                        }}
                      />
                      <input
                        type="password"
                        placeholder="New Password (min 6 characters)"
                        value={passwordForm.new_password}
                        onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: `1px solid ${isDarkMode ? '#334155' : '#CBD5E1'}`,
                          backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
                          color: isDarkMode ? '#FFFFFF' : '#0F172A',
                          fontSize: '0.84rem',
                        }}
                      />
                      <input
                        type="password"
                        placeholder="Confirm New Password"
                        value={passwordForm.confirm_password}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: `1px solid ${isDarkMode ? '#334155' : '#CBD5E1'}`,
                          backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
                          color: isDarkMode ? '#FFFFFF' : '#0F172A',
                          fontSize: '0.84rem',
                        }}
                      />
                      <button
                        type="submit"
                        style={{
                          padding: '10px',
                          borderRadius: '8px',
                          border: 'none',
                          backgroundColor: '#059669',
                          color: '#FFFFFF',
                          fontSize: '0.84rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Update Password
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* =========================================================================
          GLOBAL MODAL 1: CANDIDATE INSPECT MODAL (CENTERED FLOATING POPUP)
         ========================================================================= */}
      {selectedStudent && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="inspect-candidate-title"
          onClick={() => setSelectedStudent(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1050,
            padding: '1.5rem',
            overflowY: 'auto',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '840px',
              maxHeight: '90vh',
              backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
              borderRadius: '20px',
              border: `1px solid ${isDarkMode ? '#334155' : '#E2E8F0'}`,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              animation: 'fadeInModal 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '1.25rem 1.75rem',
                borderBottom: `1px solid ${isDarkMode ? '#334155' : '#F1F5F9'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    backgroundColor: '#8B5CF620',
                    color: '#8B5CF6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Eye size={22} />
                </div>
                <div>
                  <h3
                    id="inspect-candidate-title"
                    style={{
                      margin: 0,
                      fontSize: '1.15rem',
                      fontWeight: 800,
                      color: isDarkMode ? '#FFFFFF' : '#0F172A',
                    }}
                  >
                    Candidate Placement Telemetry & Inspection
                  </h3>
                  <span style={{ fontSize: '0.76rem', color: '#64748B' }}>
                    Comprehensive academic, technical skills & recruitment diagnostic profile
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                aria-label="Close Inspect Modal"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  fontSize: '1.25rem',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '6px',
                }}
              >
                ✕
              </button>
            </div>

            {/* Scrollable Body */}
            <div
              style={{
                padding: '1.5rem 1.75rem',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
              }}
            >
              {/* Identity Strip */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem 1.25rem',
                  borderRadius: '14px',
                  backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC',
                  border: `1px solid ${isDarkMode ? '#334155' : '#E2E8F0'}`,
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <StudentAvatar
                    src={selectedStudent.avatar || selectedStudent.avatar_url}
                    name={selectedStudent.name || selectedStudent.full_name}
                    id={selectedStudent.roll_no || selectedStudent.id}
                    size={52}
                  />
                  <div>
                    <strong style={{ fontSize: '1.05rem', color: isDarkMode ? '#FFFFFF' : '#0F172A' }}>
                      {selectedStudent.name || selectedStudent.full_name}
                    </strong>
                    <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '3px' }}>
                      Roll No: <strong>{selectedStudent.roll_no || selectedStudent.id}</strong> • {selectedStudent.department}
                    </div>
                  </div>
                </div>

                <span
                  style={{
                    padding: '4px 12px',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    backgroundColor: selectedStudent.placement_risk === 'HIGH' || selectedStudent.placementRisk === 'HIGH' ? '#FEF2F2' : selectedStudent.placement_risk === 'MEDIUM' || selectedStudent.placementRisk === 'MEDIUM' ? '#FEF3C7' : '#ECFDF5',
                    color: selectedStudent.placement_risk === 'HIGH' || selectedStudent.placementRisk === 'HIGH' ? '#DC2626' : selectedStudent.placement_risk === 'MEDIUM' || selectedStudent.placementRisk === 'MEDIUM' ? '#D97706' : '#059669',
                    border: `1px solid ${selectedStudent.placement_risk === 'HIGH' || selectedStudent.placementRisk === 'HIGH' ? '#FCA5A5' : selectedStudent.placement_risk === 'MEDIUM' || selectedStudent.placementRisk === 'MEDIUM' ? '#FCD34D' : '#A7F3D0'}`,
                  }}
                >
                  {selectedStudent.placement_risk || selectedStudent.placementRisk || 'LOW'} PLACEMENT RISK
                </span>
              </div>

              {/* Metrics Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC', border: `1px solid ${isDarkMode ? '#334155' : '#E2E8F0'}` }}>
                  <div style={{ fontSize: '0.70rem', color: '#64748B' }}>Cumulative CGPA</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: (selectedStudent.cgpa || 0) >= 8.0 ? '#059669' : (selectedStudent.cgpa || 0) >= 6.5 ? '#D97706' : '#DC2626', marginTop: '2px' }}>
                    {selectedStudent.cgpa}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#94A3B8', marginTop: '2px' }}>Min 7.0 corporate bar</div>
                </div>

                <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC', border: `1px solid ${isDarkMode ? '#334155' : '#E2E8F0'}` }}>
                  <div style={{ fontSize: '0.70rem', color: '#64748B' }}>DSA Proficiency</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#8B5CF6', marginTop: '2px' }}>
                    {selectedStudent.dsa_score || selectedStudent.dsaScore || 8.0}/10
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#94A3B8', marginTop: '2px' }}>Cutoff: 6.5/10</div>
                </div>

                <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC', border: `1px solid ${isDarkMode ? '#334155' : '#E2E8F0'}` }}>
                  <div style={{ fontSize: '0.70rem', color: '#64748B' }}>Quantitative Aptitude</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#3B82F6', marginTop: '2px' }}>
                    {selectedStudent.aptitude_score || selectedStudent.aptitudeScore || 82}/100
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#94A3B8', marginTop: '2px' }}>Cutoff: 65/100</div>
                </div>

                <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC', border: `1px solid ${isDarkMode ? '#334155' : '#E2E8F0'}` }}>
                  <div style={{ fontSize: '0.70rem', color: '#64748B' }}>Active Backlogs</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: (selectedStudent.backlogs ?? 0) === 0 ? '#059669' : '#DC2626', marginTop: '2px' }}>
                    {selectedStudent.backlogs ?? 0}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#94A3B8', marginTop: '2px' }}>{(selectedStudent.backlogs ?? 0) === 0 ? 'Clear History' : 'Backlogs Pending'}</div>
                </div>

                <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC', border: `1px solid ${isDarkMode ? '#334155' : '#E2E8F0'}` }}>
                  <div style={{ fontSize: '0.70rem', color: '#64748B' }}>Attendance Rate</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: (selectedStudent.attendance || selectedStudent.overall_attendance_pct || 0) >= 75 ? '#059669' : '#DC2626', marginTop: '2px' }}>
                    {selectedStudent.attendance || selectedStudent.overall_attendance_pct || 85}%
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#94A3B8', marginTop: '2px' }}>Threshold: 75%</div>
                </div>

                <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC', border: `1px solid ${isDarkMode ? '#334155' : '#E2E8F0'}` }}>
                  <div style={{ fontSize: '0.70rem', color: '#64748B' }}>Readiness Score</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#8B5CF6', marginTop: '2px' }}>
                    {selectedStudent.readiness_score || selectedStudent.success_score || 80}%
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#94A3B8', marginTop: '2px' }}>Platform Rating</div>
                </div>
              </div>

              {/* Matching Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  onClick={() => {
                    const cand = selectedStudent;
                    setSelectedStudent(null);
                    handleOpenMatchModal(cand);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 18px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: '#8B5CF6',
                    color: '#FFFFFF',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <Sparkles size={16} />
                  <span>Evaluate Corporate Match</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          GLOBAL MODAL 2: JOB MATCH EVALUATION MODAL
         ========================================================================= */}
      {matchModalOpen && matchingCandidate && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setMatchModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1050,
            padding: '1.5rem',
            overflowY: 'auto',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '740px',
              maxHeight: '90vh',
              backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
              borderRadius: '20px',
              border: `1px solid ${isDarkMode ? '#334155' : '#E2E8F0'}`,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '1.25rem 1.75rem', borderBottom: `1px solid ${isDarkMode ? '#334155' : '#F1F5F9'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>Corporate Match Evaluation</h3>
                <span style={{ fontSize: '0.76rem', color: '#64748B' }}>
                  Evaluating {matchingCandidate.name || matchingCandidate.full_name} against corporate cutoffs
                </span>
              </div>
              <button onClick={() => setMatchModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.25rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ padding: '1rem 1.75rem', borderBottom: `1px solid ${isDarkMode ? '#334155' : '#F1F5F9'}` }}>
              <label style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>Select Recruitment Drive to Evaluate:</label>
              <select
                value={matchingJobId}
                onChange={(e) => handleJobSelectInMatchModal(Number(e.target.value))}
                style={{
                  width: '100%',
                  marginTop: '4px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${isDarkMode ? '#334155' : '#CBD5E1'}`,
                  backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC',
                  color: isDarkMode ? '#FFFFFF' : '#0F172A',
                  fontSize: '0.84rem',
                  outline: 'none',
                }}
              >
                {jobsData.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.company_name} — {j.job_title} ({j.package_lpa} LPA)
                  </option>
                ))}
              </select>
            </div>

            <div style={{ padding: '1.5rem 1.75rem', overflowY: 'auto' }}>
              {matchLoading ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <Loader2 size={32} className="animate-spin" style={{ color: '#8B5CF6', margin: '0 auto' }} />
                  <div style={{ fontSize: '0.84rem', color: '#64748B', marginTop: '10px' }}>Analyzing candidate metrics against job requirements...</div>
                </div>
              ) : matchResult ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '1.1rem 1.25rem',
                      borderRadius: '12px',
                      backgroundColor: matchResult.eligibility_status === 'ELIGIBLE' ? '#ECFDF5' : '#FEF2F2',
                      border: `1px solid ${matchResult.eligibility_status === 'ELIGIBLE' ? '#A7F3D0' : '#FECACA'}`,
                    }}
                  >
                    <div>
                      <span
                        style={{
                          padding: '3px 10px',
                          borderRadius: '9999px',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          backgroundColor: matchResult.eligibility_status === 'ELIGIBLE' ? '#10B981' : '#DC2626',
                          color: '#FFFFFF',
                        }}
                      >
                        {matchResult.drive_status_label || matchResult.eligibility_status}
                      </span>
                      <div style={{ fontSize: '0.94rem', fontWeight: 700, marginTop: '6px', color: '#0F172A' }}>
                        {matchResult.job_title} @ {matchResult.company_name}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: '#64748B' }}>
                        Package: <strong>{matchResult.package_lpa} LPA</strong>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.8rem', fontWeight: 900, color: matchResult.eligibility_status === 'ELIGIBLE' ? '#059669' : '#DC2626' }}>
                        {matchResult.match_score}%
                      </div>
                      <div style={{ fontSize: '0.70rem', color: '#64748B' }}>Role Fit Score</div>
                    </div>
                  </div>

                  {matchResult.satisfied_criteria && matchResult.satisfied_criteria.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#059669', marginBottom: '6px' }}>Satisfied Cutoffs:</div>
                      {matchResult.satisfied_criteria.map((crit, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#059669', marginBottom: '4px' }}>
                          <CheckCircle2 size={14} />
                          <span>{crit}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {matchResult.hard_eligibility_failures && matchResult.hard_eligibility_failures.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#DC2626', marginBottom: '6px' }}>Disqualification Factors:</div>
                      {matchResult.hard_eligibility_failures.map((fail, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#DC2626', marginBottom: '4px' }}>
                          <AlertTriangle size={14} />
                          <span>{fail}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ padding: '10px 14px', borderRadius: '10px', backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC', fontSize: '0.76rem', color: '#64748B', lineHeight: 1.5 }}>
                    {matchResult.explanation}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          GLOBAL MODAL 3: CREATE / EDIT DRIVE MODAL
         ========================================================================= */}
      {driveModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setDriveModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1050,
            padding: '1.5rem',
            overflowY: 'auto',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '680px',
              maxHeight: '90vh',
              backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
              borderRadius: '20px',
              border: `1px solid ${isDarkMode ? '#334155' : '#E2E8F0'}`,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '1.25rem 1.75rem', borderBottom: `1px solid ${isDarkMode ? '#334155' : '#F1F5F9'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                {editingJob ? `Edit Drive: ${editingJob.company_name}` : 'Create New Corporate Recruitment Drive'}
              </h3>
              <button onClick={() => setDriveModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.25rem', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleSaveDrive} style={{ padding: '1.5rem 1.75rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 600, color: '#64748B' }}>Company Name *</label>
                  <input
                    type="text"
                    required
                    value={driveForm.company_name}
                    onChange={(e) => setDriveForm({ ...driveForm, company_name: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: `1px solid ${isDarkMode ? '#334155' : '#CBD5E1'}`, backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC', color: isDarkMode ? '#FFFFFF' : '#0F172A', fontSize: '0.84rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 600, color: '#64748B' }}>Job Title *</label>
                  <input
                    type="text"
                    required
                    value={driveForm.job_title}
                    onChange={(e) => setDriveForm({ ...driveForm, job_title: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: `1px solid ${isDarkMode ? '#334155' : '#CBD5E1'}`, backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC', color: isDarkMode ? '#FFFFFF' : '#0F172A', fontSize: '0.84rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 600, color: '#64748B' }}>Package (CTC LPA)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={driveForm.package_lpa}
                    onChange={(e) => setDriveForm({ ...driveForm, package_lpa: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: `1px solid ${isDarkMode ? '#334155' : '#CBD5E1'}`, backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC', color: isDarkMode ? '#FFFFFF' : '#0F172A', fontSize: '0.84rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 600, color: '#64748B' }}>Min CGPA</label>
                  <input
                    type="number"
                    step="0.1"
                    value={driveForm.min_cgpa}
                    onChange={(e) => setDriveForm({ ...driveForm, min_cgpa: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: `1px solid ${isDarkMode ? '#334155' : '#CBD5E1'}`, backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC', color: isDarkMode ? '#FFFFFF' : '#0F172A', fontSize: '0.84rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 600, color: '#64748B' }}>Max Backlogs</label>
                  <input
                    type="number"
                    value={driveForm.max_backlogs}
                    onChange={(e) => setDriveForm({ ...driveForm, max_backlogs: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: `1px solid ${isDarkMode ? '#334155' : '#CBD5E1'}`, backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC', color: isDarkMode ? '#FFFFFF' : '#0F172A', fontSize: '0.84rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 600, color: '#64748B' }}>Min DSA Score (/10)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={driveForm.min_dsa_score}
                    onChange={(e) => setDriveForm({ ...driveForm, min_dsa_score: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: `1px solid ${isDarkMode ? '#334155' : '#CBD5E1'}`, backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC', color: isDarkMode ? '#FFFFFF' : '#0F172A', fontSize: '0.84rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 600, color: '#64748B' }}>Min Aptitude (/100)</label>
                  <input
                    type="number"
                    value={driveForm.min_aptitude_score}
                    onChange={(e) => setDriveForm({ ...driveForm, min_aptitude_score: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: `1px solid ${isDarkMode ? '#334155' : '#CBD5E1'}`, backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC', color: isDarkMode ? '#FFFFFF' : '#0F172A', fontSize: '0.84rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 600, color: '#64748B' }}>Mandatory Skills</label>
                <input
                  type="text"
                  value={driveForm.mandatory_skills}
                  onChange={(e) => setDriveForm({ ...driveForm, mandatory_skills: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: `1px solid ${isDarkMode ? '#334155' : '#CBD5E1'}`, backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC', color: isDarkMode ? '#FFFFFF' : '#0F172A', fontSize: '0.84rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 600, color: '#64748B' }}>Preferred Skills</label>
                <input
                  type="text"
                  value={driveForm.preferred_skills}
                  onChange={(e) => setDriveForm({ ...driveForm, preferred_skills: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: `1px solid ${isDarkMode ? '#334155' : '#CBD5E1'}`, backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC', color: isDarkMode ? '#FFFFFF' : '#0F172A', fontSize: '0.84rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 600, color: '#64748B' }}>Location</label>
                  <input
                    type="text"
                    value={driveForm.location}
                    onChange={(e) => setDriveForm({ ...driveForm, location: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: `1px solid ${isDarkMode ? '#334155' : '#CBD5E1'}`, backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC', color: isDarkMode ? '#FFFFFF' : '#0F172A', fontSize: '0.84rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 600, color: '#64748B' }}>Application Deadline</label>
                  <input
                    type="text"
                    value={driveForm.deadline}
                    onChange={(e) => setDriveForm({ ...driveForm, deadline: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: `1px solid ${isDarkMode ? '#334155' : '#CBD5E1'}`, backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC', color: isDarkMode ? '#FFFFFF' : '#0F172A', fontSize: '0.84rem' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                style={{
                  padding: '11px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: '#8B5CF6',
                  color: '#FFFFFF',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  marginTop: '10px',
                }}
              >
                {editingJob ? 'Save Changes' : 'Publish Recruitment Drive'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          GLOBAL MODAL 4: ADVANCE PIPELINE STAGE MODAL
         ========================================================================= */}
      {advanceStageModalApp && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setAdvanceStageModalApp(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1050,
            padding: '1.5rem',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '520px',
              backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
              borderRadius: '20px',
              border: `1px solid ${isDarkMode ? '#334155' : '#E2E8F0'}`,
              padding: '1.5rem 1.75rem',
            }}
          >
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.15rem', fontWeight: 800 }}>
              Advance Candidate Stage
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '0 0 14px 0' }}>
              Transition {advanceStageModalApp.student_name} ({advanceStageModalApp.student_roll_no}) for {advanceStageModalApp.company_name}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 600, color: '#64748B' }}>Target Pipeline Stage</label>
                <select
                  value={targetStage}
                  onChange={(e) => setTargetStage(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${isDarkMode ? '#334155' : '#CBD5E1'}`,
                    backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC',
                    color: isDarkMode ? '#FFFFFF' : '#0F172A',
                    fontSize: '0.84rem',
                    marginTop: '4px',
                  }}
                >
                  {CANONICAL_STAGES.map((st) => (
                    <option key={st.key} value={st.key}>{st.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 600, color: '#64748B' }}>Stage Transition Notes</label>
                <textarea
                  rows={3}
                  value={stageNotes}
                  onChange={(e) => setStageNotes(e.target.value)}
                  placeholder="e.g. Cleared Round 2 technical screen with 92% DSA accuracy."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${isDarkMode ? '#334155' : '#CBD5E1'}`,
                    backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC',
                    color: isDarkMode ? '#FFFFFF' : '#0F172A',
                    fontSize: '0.84rem',
                    marginTop: '4px',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  onClick={() => setAdvanceStageModalApp(null)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: `1px solid ${isDarkMode ? '#475569' : '#CBD5E1'}`,
                    backgroundColor: 'transparent',
                    color: isDarkMode ? '#E2E8F0' : '#475569',
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAdvanceStage}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#8B5CF6',
                    color: '#FFFFFF',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Confirm Transition
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          GLOBAL MODAL 5: PIPELINE STAGE HISTORY TIMELINE MODAL
         ========================================================================= */}
      {historyModalApp && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setHistoryModalApp(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1050,
            padding: '1.5rem',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '560px',
              backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
              borderRadius: '20px',
              border: `1px solid ${isDarkMode ? '#334155' : '#E2E8F0'}`,
              padding: '1.5rem 1.75rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>Pipeline Transition History</h3>
                <span style={{ fontSize: '0.76rem', color: '#64748B' }}>
                  {historyModalApp.student_name} ({historyModalApp.student_roll_no}) @ {historyModalApp.company_name}
                </span>
              </div>
              <button onClick={() => setHistoryModalApp(null)} style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.25rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ maxHeight: '350px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {historyData.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#64748B', padding: '2rem' }}>
                  Initial application created. Candidate currently at <strong>{historyModalApp.stage}</strong>.
                </div>
              ) : (
                historyData.map((h) => (
                  <div
                    key={h.id}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '10px',
                      backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC',
                      border: `1px solid ${isDarkMode ? '#334155' : '#E2E8F0'}`,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                      <strong style={{ color: '#8B5CF6' }}>{h.from_stage || 'START'} &rarr; {h.to_stage}</strong>
                      <span style={{ color: '#94A3B8' }}>{h.created_at ? new Date(h.created_at).toLocaleString() : 'Recent'}</span>
                    </div>
                    {h.notes && (
                      <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '4px' }}>
                        "{h.notes}"
                      </div>
                    )}
                    <div style={{ fontSize: '0.68rem', color: '#94A3B8', marginTop: '2px' }}>
                      By: {h.changed_by || 'TPO Officer'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          GLOBAL MODAL 6: SCHEDULE MOCK INTERVIEW MODAL
         ========================================================================= */}
      {interviewModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setInterviewModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1050,
            padding: '1.5rem',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '520px',
              backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
              borderRadius: '20px',
              border: `1px solid ${isDarkMode ? '#334155' : '#E2E8F0'}`,
              padding: '1.5rem 1.75rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>Schedule Mock Interview</h3>
              <button onClick={() => setInterviewModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.25rem', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleSaveMockInterview} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 600, color: '#64748B' }}>Candidate Roll Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. STU-2024-042"
                  value={interviewForm.student_roll_no}
                  onChange={(e) => setInterviewForm({ ...interviewForm, student_roll_no: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: `1px solid ${isDarkMode ? '#334155' : '#CBD5E1'}`, backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC', color: isDarkMode ? '#FFFFFF' : '#0F172A', fontSize: '0.84rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 600, color: '#64748B' }}>Interviewer / Faculty Mentor Name *</label>
                <input
                  type="text"
                  required
                  value={interviewForm.interviewer_name}
                  onChange={(e) => setInterviewForm({ ...interviewForm, interviewer_name: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: `1px solid ${isDarkMode ? '#334155' : '#CBD5E1'}`, backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC', color: isDarkMode ? '#FFFFFF' : '#0F172A', fontSize: '0.84rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.76rem', fontWeight: 600, color: '#64748B' }}>Interview Type</label>
                  <select
                    value={interviewForm.interview_type}
                    onChange={(e) => setInterviewForm({ ...interviewForm, interview_type: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: `1px solid ${isDarkMode ? '#334155' : '#CBD5E1'}`, backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC', color: isDarkMode ? '#FFFFFF' : '#0F172A', fontSize: '0.84rem' }}
                  >
                    <option value="Technical">Technical Round</option>
                    <option value="HR">HR Behavioral</option>
                    <option value="Coding">Live Coding / DSA</option>
                    <option value="Aptitude">Aptitude & Case Study</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.76rem', fontWeight: 600, color: '#64748B' }}>Time</label>
                  <input
                    type="text"
                    value={interviewForm.scheduled_time}
                    onChange={(e) => setInterviewForm({ ...interviewForm, scheduled_time: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: `1px solid ${isDarkMode ? '#334155' : '#CBD5E1'}`, backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC', color: isDarkMode ? '#FFFFFF' : '#0F172A', fontSize: '0.84rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 600, color: '#64748B' }}>Scheduled Date</label>
                <input
                  type="date"
                  value={interviewForm.scheduled_date}
                  onChange={(e) => setInterviewForm({ ...interviewForm, scheduled_date: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: `1px solid ${isDarkMode ? '#334155' : '#CBD5E1'}`, backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC', color: isDarkMode ? '#FFFFFF' : '#0F172A', fontSize: '0.84rem' }}
                />
              </div>

              <button
                type="submit"
                style={{
                  padding: '10px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: '#8B5CF6',
                  color: '#FFFFFF',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  marginTop: '6px',
                }}
              >
                Schedule Session
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          GLOBAL MODAL 7: RECORD MOCK INTERVIEW FEEDBACK MODAL
         ========================================================================= */}
      {feedbackModalInterview && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setFeedbackModalInterview(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1050,
            padding: '1.5rem',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '560px',
              backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
              borderRadius: '20px',
              border: `1px solid ${isDarkMode ? '#334155' : '#E2E8F0'}`,
              padding: '1.5rem 1.75rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>Record Interview Evaluation</h3>
                <span style={{ fontSize: '0.76rem', color: '#64748B' }}>
                  {feedbackModalInterview.student_name} ({feedbackModalInterview.interview_type})
                </span>
              </div>
              <button onClick={() => setFeedbackModalInterview(null)} style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.25rem', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleSaveFeedback} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.76rem', fontWeight: 600, color: '#64748B' }}>Performance Score (/100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={feedbackForm.score}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, score: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: `1px solid ${isDarkMode ? '#334155' : '#CBD5E1'}`, backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC', color: isDarkMode ? '#FFFFFF' : '#0F172A', fontSize: '0.84rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.76rem', fontWeight: 600, color: '#64748B' }}>Attendance Status</label>
                  <select
                    value={feedbackForm.attendance_status}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, attendance_status: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: `1px solid ${isDarkMode ? '#334155' : '#CBD5E1'}`, backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC', color: isDarkMode ? '#FFFFFF' : '#0F172A', fontSize: '0.84rem' }}
                  >
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 600, color: '#64748B' }}>Key Strengths Demonstrated</label>
                <input
                  type="text"
                  value={feedbackForm.strengths}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, strengths: e.target.value })}
                  placeholder="e.g. Excellent complexity analysis, crisp code syntax"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: `1px solid ${isDarkMode ? '#334155' : '#CBD5E1'}`, backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC', color: isDarkMode ? '#FFFFFF' : '#0F172A', fontSize: '0.84rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 600, color: '#64748B' }}>Areas for Targeted Improvement</label>
                <input
                  type="text"
                  value={feedbackForm.weaknesses}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, weaknesses: e.target.value })}
                  placeholder="e.g. DP state transitions, edge case verification"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: `1px solid ${isDarkMode ? '#334155' : '#CBD5E1'}`, backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC', color: isDarkMode ? '#FFFFFF' : '#0F172A', fontSize: '0.84rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 600, color: '#64748B' }}>Detailed Feedback & Recommendation</label>
                <textarea
                  rows={3}
                  value={feedbackForm.feedback}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, feedback: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: `1px solid ${isDarkMode ? '#334155' : '#CBD5E1'}`, backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC', color: isDarkMode ? '#FFFFFF' : '#0F172A', fontSize: '0.84rem' }}
                />
              </div>

              <button
                type="submit"
                style={{
                  padding: '10px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: '#059669',
                  color: '#FFFFFF',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  marginTop: '6px',
                }}
              >
                Save Evaluation Rubric
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
