import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  AlertTriangle,
  GraduationCap,
  Search,
  Bell,
  Sun,
  Moon,
  LogOut,
  Home,
  Target,
  Plus,
  Eye,
  Bot,
  Loader2,
  CheckCircle2,
  Check,
  ShieldCheck,
  Database,
  Sparkles,
  X,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import BrandLogo from '../../components/common/BrandLogo';
import StudentAvatar from '../../components/common/StudentAvatar';
import { useAuth } from '../../context/AuthContext';
import { MOCK_STUDENTS } from '../../data/mockStudents';
import api from '../../services/api';

const DEFAULT_DISTRIBUTION = [
  { name: 'On Track (Low Risk)', value: 0, count: 0, color: '#10B981' },
  { name: 'Moderate Risk', value: 0, count: 0, color: '#F59E0B' },
  { name: 'High Risk (Action Needed)', value: 0, count: 0, color: '#EF4444' },
];

export default function MentorDashboard() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [createTaskModalOpen, setCreateTaskModalOpen] = useState(false);
  const [copilotModalOpen, setCopilotModalOpen] = useState(false);
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotData, setCopilotData] = useState(null);
  const [approvedRecs, setApprovedRecs] = useState({});
  const [copilotError, setCopilotError] = useState('');
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [inspectStudent, setInspectStudent] = useState(null);
  const [approvingStudentId, setApprovingStudentId] = useState(null);
  const [actionFeedback, setActionFeedback] = useState(null);

  // Live Backend Data States
  const [mentees, setMentees] = useState([]);
  const [interventions, setInterventions] = useState([]);
  const [isLiveApi, setIsLiveApi] = useState(false);
  const [submittingTask, setSubmittingTask] = useState(false);
  const [loading, setLoading] = useState(true);

  // Pagination & Filtering States (Calculated Dynamically from SQLite Database)
  const [currentPage, setCurrentPage] = useState(1);
  const [totalMentees, setTotalMentees] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [cohortFilter, setCohortFilter] = useState('all'); // 'all' | 'verified_profile' | 'high_risk'
  const [verifiedCount, setVerifiedCount] = useState(0);
  const [cohortCount, setCohortCount] = useState(0);
  const [highRiskCount, setHighRiskCount] = useState(0);
  const [withBacklogsCount, setWithBacklogsCount] = useState(0);
  const [riskDistribution, setRiskDistribution] = useState(DEFAULT_DISTRIBUTION);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [mentorStats, setMentorStats] = useState({
    total_mentees: 0,
    verified_count: 0,
    cohort_count: 0,
    high_risk_count: 0,
    medium_risk_count: 0,
    low_risk_count: 0,
    with_backlogs_count: 0,
    avg_cgpa: 7.0,
    avg_attendance: 75.0,
    avg_success_score: 65.0,
    distribution: DEFAULT_DISTRIBUTION,
  });

  // New Task Form State
  const [newTaskRoll, setNewTaskRoll] = useState('STU-2024-001');
  const [newTaskName, setNewTaskName] = useState('Rajesh Kumar');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('ATTENDANCE');
  const [newTaskDueDate, setNewTaskDueDate] = useState('Nov 10, 2026');

  // Debounce search query to prevent excessive API invocations
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Load Mentor Live Summary Metrics & Actual Risk Segmentation from Database
  useEffect(() => {
    let isMounted = true;
    async function loadMentorSummary() {
      try {
        const mentorName = currentUser?.name || currentUser?.full_name || 'Prof. Rajesh Kumar';
        const cleanName = mentorName.replace(/^Prof\.\s*/i, '').replace(/^Dr\.\s*/i, '').trim();
        const res = await api.getMentorSummary(cleanName);
        if (isMounted && res && res.total_mentees !== undefined) {
          setMentorStats(res);
          setVerifiedCount(res.verified_count || 0);
          setCohortCount(res.cohort_count || 0);
          setHighRiskCount(res.high_risk_count || 0);
          setWithBacklogsCount(res.with_backlogs_count || 0);
          if (res.distribution && res.distribution.length > 0) {
            setRiskDistribution(res.distribution);
          }
        }
      } catch (err) {
        console.warn('Could not load mentor summary from API:', err);
      }
    }
    loadMentorSummary();
    return () => { isMounted = false; };
  }, [currentUser]);

  // Load Interventions for Assigned Mentor
  useEffect(() => {
    let isMounted = true;
    async function loadInterventions() {
      try {
        const mentorName = currentUser?.name || currentUser?.full_name || 'Prof. Rajesh Kumar';
        const cleanName = mentorName.replace(/^Prof\.\s*/i, '').replace(/^Dr\.\s*/i, '').trim();
        const res = await api.getInterventions(cleanName);
        if (isMounted && Array.isArray(res) && res.length > 0) {
          setInterventions(res);
        } else {
          try {
            const fullRes = await api.getInterventions(mentorName);
            if (isMounted && Array.isArray(fullRes) && fullRes.length > 0) {
              setInterventions(fullRes);
            }
          } catch {}
        }
      } catch (err) {
        console.warn('Failed to load interventions:', err);
      }
    }
    loadInterventions();
    return () => { isMounted = false; };
  }, [currentUser]);

  // Load Paginated, Filtered, and Sorted Mentees from Live Backend API
  useEffect(() => {
    let isMounted = true;
    async function fetchPaginatedMentees() {
      if (isMounted) setLoading(true);
      try {
        const mentorName = currentUser?.name || currentUser?.full_name || 'Prof. Rajesh Kumar';
        const cleanName = mentorName.replace(/^Prof\.\s*/i, '').replace(/^Dr\.\s*/i, '').trim();

        const params = {
          mentor: cleanName,
          page: currentPage,
          pageSize: 50,
        };

        if (cohortFilter === 'verified_profile') {
          params.recordType = 'verified_profile';
        } else if (cohortFilter === 'high_risk') {
          params.academicRisk = 'HIGH';
        }

        if (debouncedSearch && debouncedSearch.trim()) {
          params.search = debouncedSearch.trim();
        }

        const studRes = await api.getInstitutionStudents(params);

        if (isMounted) {
          if (studRes?.items) {
            setMentees(studRes.items);
            setTotalMentees(studRes.total || 0);
            setTotalPages(studRes.total_pages || Math.ceil((studRes.total || 0) / 50) || 1);
            setIsLiveApi(true);

            if (studRes.items.length > 0) {
              setNewTaskRoll(studRes.items[0].id);
              setNewTaskName(studRes.items[0].name);
            }

            if (studRes.mentor_summary) {
              setMentorStats(studRes.mentor_summary);
              setVerifiedCount(studRes.mentor_summary.verified_count || 0);
              setCohortCount(studRes.mentor_summary.cohort_count || 0);
              setHighRiskCount(studRes.mentor_summary.high_risk_count || 0);
              setWithBacklogsCount(studRes.mentor_summary.with_backlogs_count || 0);
              if (studRes.mentor_summary.distribution) {
                setRiskDistribution(studRes.mentor_summary.distribution);
              }
            }
          } else if (Array.isArray(studRes)) {
            setMentees(studRes);
            setTotalMentees(studRes.length);
            setTotalPages(1);
            setIsLiveApi(true);
          } else {
            setMentees(MOCK_STUDENTS.slice(0, 3));
            setTotalMentees(3);
            setTotalPages(1);
          }
        }
      } catch (err) {
        console.warn('Backend unavailable, using fallback data:', err);
        if (isMounted) {
          setMentees((prev) => (prev.length > 0 ? prev : MOCK_STUDENTS.slice(0, 3)));
          setTotalMentees(3);
          setTotalPages(1);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchPaginatedMentees();
    return () => {
      isMounted = false;
    };
  }, [currentUser, currentPage, cohortFilter, debouncedSearch]);

  const handleToggleIntervention = async (id) => {
    // Optimistic UI update
    setInterventions((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: item.status === 'OPEN' ? 'COMPLETED' : 'OPEN' } : item
      )
    );

    try {
      await api.toggleInstitutionIntervention(id);
    } catch {
      // Fallback
    }
  };

  // Escape key handler for accessible modal dismissal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setInspectModalOpen(false);
        setInspectStudent(null);
        setCopilotModalOpen(false);
        setCreateTaskModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-dismiss action feedback notification
  useEffect(() => {
    if (actionFeedback) {
      const timer = setTimeout(() => setActionFeedback(null), 4500);
      return () => clearTimeout(timer);
    }
  }, [actionFeedback]);

  // Persistent Mentee Intervention Approval Action
  const handleApproveMentee = async (student) => {
    const studentId = student.id || student.roll_no;
    setApprovingStudentId(studentId);
    setActionFeedback(null);
    try {
      const res = await api.approveStudentIntervention(studentId);
      if (res?.success) {
        setApprovedRecs((prev) => ({ ...prev, [studentId]: true, [student.name]: true }));
        setMentees((prev) =>
          prev.map((m) =>
            (m.id === studentId || m.roll_no === studentId)
              ? { ...m, isApproved: true }
              : m
          )
        );
        if (inspectStudent && (inspectStudent.id === studentId || inspectStudent.roll_no === studentId)) {
          setInspectStudent((prev) => ({ ...prev, isApproved: true }));
        }
        setActionFeedback({
          type: 'success',
          message: res.message || `Intervention for ${student.name} (${studentId}) successfully approved.`,
        });
        try {
          const mentorName = currentUser?.name || currentUser?.full_name || 'Prof. Rajesh Kumar';
          const cleanName = mentorName.replace(/^Prof\.\s*/i, '').replace(/^Dr\.\s*/i, '').trim();
          const updatedInterventions = await api.getInterventions(cleanName);
          if (Array.isArray(updatedInterventions)) {
            setInterventions(updatedInterventions);
          }
        } catch {}
      } else {
        setActionFeedback({
          type: 'error',
          message: res?.message || 'Approval could not be completed.',
        });
      }
    } catch (err) {
      console.error('Failed to approve mentee intervention:', err);
      setActionFeedback({
        type: 'error',
        message: err.message || 'Failed to approve intervention. Please verify mentor assignment authorization.',
      });
    } finally {
      setApprovingStudentId(null);
    }
  };

  const handleOpenCopilot = async (student) => {
    setCopilotModalOpen(true);
    setCopilotLoading(true);
    setCopilotError('');
    try {
      const res = await api.askMentorCopilot(student.id || student.roll_no);
      setCopilotData(res);
    } catch (err) {
      setCopilotError(err.message || 'Failed to generate mentor copilot briefing.');
    } finally {
      setCopilotLoading(false);
    }
  };

  const handleApproveCopilotIntervention = async (rec) => {
    if (!copilotData) return;
    try {
      const payload = {
        student_roll_no: copilotData.student_roll_no,
        student_name: copilotData.student_name,
        department: copilotData.department || 'Computer Science & Engineering',
        title: rec.title,
        category: rec.category || 'ACADEMIC',
        priority: rec.priority || 'HIGH',
        assigned_mentor: currentUser?.name || currentUser?.full_name || 'Prof. Rajesh Kumar',
        due_date: `In ${rec.due_in_days || 14} Days`,
      };
      const res = await api.createIntervention(payload);
      if (res?.id) {
        setInterventions((prev) => [{ ...payload, id: res.id, status: 'OPEN' }, ...prev]);
        setApprovedRecs((prev) => ({ ...prev, [rec.title]: true }));
      }
    } catch (err) {
      console.error('Failed to approve intervention:', err);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setSubmittingTask(true);
    try {
      const payload = {
        student_roll_no: newTaskRoll,
        student_name: newTaskName,
        department: 'Computer Science & Engineering',
        title: newTaskTitle.trim(),
        category: newTaskCategory,
        assigned_mentor: currentUser?.name || 'Prof. Rajesh Kumar',
        due_date: newTaskDueDate,
      };
      const res = await api.createIntervention(payload);
      if (res?.id) {
        setInterventions((prev) => [
          { ...payload, id: res.id, status: 'OPEN' },
          ...prev,
        ]);
      }
      setCreateTaskModalOpen(false);
      setNewTaskTitle('');
    } catch (err) {
      console.error('Failed to create intervention:', err);
    } finally {
      setSubmittingTask(false);
    }
  };

  // When connected to the live API, mentees is already queried, filtered, sorted, and paginated by the server.
  // In fallback or offline mode, compute reactive client-side filter.
  const filteredMentees = useMemo(() => {
    if (isLiveApi) return mentees;
    let list = mentees;
    if (cohortFilter === 'verified_profile') {
      list = list.filter((s) => s.recordType === 'verified_profile');
    } else if (cohortFilter === 'high_risk') {
      list = list.filter((s) => s.academicRisk === 'HIGH' || (s.backlogs && s.backlogs > 0));
    }
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        s.department.toLowerCase().includes(q)
    );
  }, [isLiveApi, mentees, cohortFilter, searchQuery]);

  const atRiskCount = useMemo(() => {
    return highRiskCount || mentorStats.high_risk_count || mentees.filter((s) => s.academicRisk === 'HIGH' || s.academicRisk === 'MEDIUM' || (s.backlogs && s.backlogs > 0)).length;
  }, [highRiskCount, mentorStats.high_risk_count, mentees]);

  const openInterventionsCount = useMemo(() => {
    return interventions.filter((i) => i.status === 'OPEN').length;
  }, [interventions]);

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
      }}
    >
      {/* =========================================================================
          TOP DEMO PERSISTENT ROLE BAR
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
          <span>
            Logged in as: <strong>{currentUser?.name || 'Prof. Rajesh Kumar'}</strong> (Faculty Mentor • CSE)
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleLogout}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.7)',
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
        {/* LEFT SIDEBAR */}
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

            <nav style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <button
                type="button"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  backgroundColor: '#1E6BFF',
                  color: '#FFFFFF',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  boxShadow: '0 2px 8px rgba(30, 107, 255, 0.25)',
                }}
              >
                <Home size={18} />
                <span>Mentoring Cockpit</span>
              </button>
            </nav>
          </div>

          <div
            style={{
              padding: '1.25rem 1rem',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #ECFDF5 0%, #EFF6FF 100%)',
              border: '1px solid #A7F3D0',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#059669', lineHeight: 1.2 }}>
              Active Faculty Mentorship
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '4px' }}>
              Dept: Computer Science & Engineering
            </div>
            <div style={{ fontSize: '0.70rem', color: '#059669', fontWeight: 700, marginTop: '6px' }}>
              ● {mentees.length} Assigned Mentees
            </div>
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
                placeholder="Search assigned CSE mentees, roll no, subjects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <StudentAvatar
                  src={currentUser?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80'}
                  name={currentUser?.name || 'Prof. Rajesh Kumar'}
                  id={currentUser?.roll_no || 'FAC-CSE-104'}
                  size={38}
                />
                <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: isDarkMode ? '#FFFFFF' : '#0F172A' }}>
                    {currentUser?.name || 'Prof. Rajesh Kumar'}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#64748B' }}>Faculty Mentor • CSE</div>
                </div>
              </div>
            </div>
          </header>

          {/* Canvas Content */}
          <main style={{ padding: '1.75rem 2rem 3rem', maxWidth: '1440px', width: '100%', margin: '0 auto' }}>
            {/* ACTION NOTIFICATION FEEDBACK BANNER */}
            {actionFeedback && (
              <div
                style={{
                  marginBottom: '1.25rem',
                  padding: '12px 18px',
                  borderRadius: '12px',
                  backgroundColor: actionFeedback.type === 'success' ? '#ECFDF5' : '#FEF2F2',
                  border: `1px solid ${actionFeedback.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
                  color: actionFeedback.type === 'success' ? '#065F46' : '#991B1B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {actionFeedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                  <span>{actionFeedback.message}</span>
                </div>
                <button
                  onClick={() => setActionFeedback(null)}
                  style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 700 }}
                  title="Dismiss"
                >
                  ✕
                </button>
              </div>
            )}
            {/* HERO BANNER */}
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
                backgroundImage: `linear-gradient(to right, rgba(6, 78, 59, 0.92) 0%, rgba(15, 23, 42, 0.75) 60%, rgba(15, 23, 42, 0.90) 100%), url('/assets/images/codebuffet_campus_entrance.jpg')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center 40%',
                boxShadow: '0 8px 24px rgba(6, 78, 59, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: '#A7F3D0',
                    marginBottom: '4px',
                  }}
                >
                  FACULTY MENTOR COCKPIT • CSE DEPARTMENT
                </div>
                <h1
                  style={{
                    fontSize: '2rem',
                    fontWeight: 800,
                    color: '#FFFFFF',
                    lineHeight: 1.15,
                    marginBottom: '6px',
                    letterSpacing: '-0.02em',
                  }}
                >
                  Welcome back, {currentUser?.name || 'Prof. Rajesh Kumar'}!
                </h1>
                <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.92rem', margin: 0, maxWidth: '520px' }}>
                  Proactive student mentorship: Review attendance trends, arrears status, and trigger targeted remedial interventions.
                </p>

                <button
                  onClick={() => setCreateTaskModalOpen(true)}
                  style={{
                    marginTop: '1rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 18px',
                    borderRadius: '9999px',
                    backgroundColor: '#10B981',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                  }}
                >
                  <Plus size={16} />
                  <span>Assign Remedial Intervention</span>
                </button>
              </div>

              {/* Stat HUD */}
              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.12)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  borderRadius: '16px',
                  padding: '1.25rem 1.5rem',
                  maxWidth: '300px',
                  color: '#FFFFFF',
                }}
              >
                <div style={{ fontSize: '0.76rem', color: '#A7F3D0', fontWeight: 700, textTransform: 'uppercase' }}>
                  Mentorship Status
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, margin: '4px 0' }}>
                  {openInterventionsCount} Active Tasks
                </div>
                <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.8)' }}>
                  Assigned across {(mentorStats.total_mentees || totalMentees).toLocaleString()} CSE students
                </div>
              </div>
            </div>

            {/* 4 KPI CARDS */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1.25rem',
                marginBottom: '1.75rem',
              }}
            >
              {/* Card 1 */}
              <div
                style={{
                  backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                  border: `1px solid ${isDarkMode ? '#334155' : '#E2E8F0'}`,
                  borderRadius: '16px',
                  padding: '1.35rem 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      backgroundColor: '#EFF6FF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#1E6BFF',
                    }}
                  >
                    <Users size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, lineHeight: 1.1 }}>
                      {loading && !mentorStats.total_mentees ? '...' : (mentorStats.total_mentees || totalMentees).toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 500 }}>Assigned CSE Mentees</div>
                    <div style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 700, marginTop: '2px' }}>
                      {verifiedCount} Verified Enrolled • {cohortCount.toLocaleString()} Benchmark Mentees
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2 */}
              <div
                style={{
                  backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                  border: `1px solid ${isDarkMode ? '#334155' : '#E2E8F0'}`,
                  borderRadius: '16px',
                  padding: '1.35rem 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      backgroundColor: '#ECFDF5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#10B981',
                    }}
                  >
                    <GraduationCap size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, lineHeight: 1.1 }}>{mentorStats.avg_success_score ? `${mentorStats.avg_success_score}%` : '86.2%'}</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 500 }}>CSE Success Score</div>
                    <div style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 700, marginTop: '2px' }}>
                      ▲ +3.4% above campus avg
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3 */}
              <div
                style={{
                  backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                  border: `1px solid ${isDarkMode ? '#334155' : '#E2E8F0'}`,
                  borderRadius: '16px',
                  padding: '1.35rem 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      backgroundColor: '#FEF2F2',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#EF4444',
                    }}
                  >
                    <AlertTriangle size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, lineHeight: 1.1 }}>{atRiskCount.toLocaleString()}</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 500 }}>At-Risk Mentees</div>
                    <div style={{ fontSize: '0.72rem', color: '#EF4444', fontWeight: 700, marginTop: '2px' }}>
                      Action required: {withBacklogsCount.toLocaleString()} with active backlogs
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 4 */}
              <div
                style={{
                  backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                  border: `1px solid ${isDarkMode ? '#334155' : '#E2E8F0'}`,
                  borderRadius: '16px',
                  padding: '1.35rem 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      backgroundColor: '#FAF5FF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#8B5CF6',
                    }}
                  >
                    <Target size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, lineHeight: 1.1 }}>
                      {loading ? '...' : interventions.length}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 500 }}>Total Interventions</div>
                    <div style={{ fontSize: '0.72rem', color: '#8B5CF6', fontWeight: 700, marginTop: '2px' }}>
                      {openInterventionsCount} Pending Completion
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ROW 2: ACTIVE MENTORING TASKS & RISK DISTRIBUTION */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.25rem', marginBottom: '1.75rem' }}>
              {/* Box 1: Mentoring Action Center (7 cols) */}
              <div
                style={{
                  gridColumn: 'span 7',
                  backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                  border: `1px solid ${isDarkMode ? '#334155' : '#E2E8F0'}`,
                  borderRadius: '16px',
                  padding: '1.5rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Active Mentoring Interventions</h3>
                    <span style={{ fontSize: '0.76rem', color: '#64748B' }}>Click checkbox to toggle completion status with live backend API</span>
                  </div>
                  <button
                    onClick={() => setCreateTaskModalOpen(true)}
                    style={{
                      backgroundColor: '#1E6BFF',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Plus size={14} />
                    <span>New Task</span>
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {loading ? (
                    <div style={{ padding: '16px', textAlign: 'center', color: '#64748B', fontSize: '0.84rem' }}>
                      Loading mentoring interventions...
                    </div>
                  ) : interventions.length === 0 ? (
                    <div style={{ padding: '16px', textAlign: 'center', color: '#64748B', fontSize: '0.84rem' }}>
                      No active interventions. Click "+ New Task" above to assign one.
                    </div>
                  ) : (
                    interventions.map((task) => {
                    const isDone = task.status === 'COMPLETED';
                    return (
                      <div
                        key={task.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          backgroundColor: isDone ? (isDarkMode ? '#0F172A' : '#F8FAFC') : (isDarkMode ? '#0F172A' : '#EFF6FF'),
                          border: `1px solid ${isDone ? (isDarkMode ? '#334155' : '#E2E8F0') : '#BFDBFE'}`,
                          transition: 'all 150ms ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <input
                            type="checkbox"
                            checked={isDone}
                            onChange={() => handleToggleIntervention(task.id)}
                            style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#10B981' }}
                          />
                          <div>
                            <div
                              style={{
                                fontSize: '0.86rem',
                                fontWeight: 600,
                                textDecoration: isDone ? 'line-through' : 'none',
                                color: isDone ? '#94A3B8' : (isDarkMode ? '#FFFFFF' : '#0F172A'),
                              }}
                            >
                              {task.title}
                            </div>
                            <div style={{ fontSize: '0.74rem', color: '#64748B', display: 'flex', gap: '8px', marginTop: '2px' }}>
                              <span>👤 {task.student_name} ({task.student_roll_no})</span>
                              <span>•</span>
                              <span>📅 Due: {task.due_date}</span>
                            </div>
                          </div>
                        </div>

                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.70rem',
                            fontWeight: 700,
                            backgroundColor:
                              task.category === 'ATTENDANCE' ? '#FEF2F2' :
                              task.category === 'ACADEMIC' ? '#FFFBEB' : '#EFF6FF',
                            color:
                              task.category === 'ATTENDANCE' ? '#DC2626' :
                              task.category === 'ACADEMIC' ? '#D97706' : '#1E6BFF',
                          }}
                        >
                          {task.category}
                        </span>
                      </div>
                    );
                  }))}
                </div>
              </div>

              {/* Box 2: Mentee Risk Segmentation Donut (5 cols) */}
              <div
                style={{
                  gridColumn: 'span 5',
                  backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                  border: `1px solid ${isDarkMode ? '#334155' : '#E2E8F0'}`,
                  borderRadius: '16px',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Mentee Risk Segmentation</h3>
                  <span style={{ fontSize: '0.76rem', color: '#64748B' }}>CSE Student Cohort breakdown</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '1rem 0' }}>
                  <div style={{ width: '140px', height: '140px', position: 'relative' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={riskDistribution}
                          innerRadius={44}
                          outerRadius={64}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {riskDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: '1rem', fontWeight: 800 }}>{(mentorStats.total_mentees || totalMentees).toLocaleString()}</div>
                      <div style={{ fontSize: '0.65rem', color: '#64748B' }}>Total Mentees</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.80rem' }}>
                    {riskDistribution.map((item) => (
                      <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color }} />
                        <span style={{ color: '#64748B' }}>{item.name}</span>
                        <strong style={{ marginLeft: 'auto', paddingLeft: '8px' }}>
                          {item.count !== undefined ? `${item.count.toLocaleString()} (${item.value}%)` : `${item.value}%`}
                        </strong>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ backgroundColor: '#F8FAFC', padding: '10px', borderRadius: '8px', fontSize: '0.76rem', color: '#475569' }}>
                  💡 <strong>Mentor Recommendation:</strong> {withBacklogsCount.toLocaleString()} students have active backlogs. Prioritize 1-on-1 academic counseling.
                </div>
              </div>
            </div>

            {/* ROW 3: ASSIGNED MENTEES ROSTER TABLE */}
            <div
              style={{
                backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                border: `1px solid ${isDarkMode ? '#334155' : '#E2E8F0'}`,
                borderRadius: '16px',
                padding: '1.5rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Assigned CSE Mentees Roster</h3>
                  <span style={{ fontSize: '0.78rem', color: '#64748B' }}>Individual telemetry, academic risk score, and LMS assignment velocity</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                  Showing Page {currentPage} of {totalPages} ({totalMentees.toLocaleString()} matching records)
                </div>
              </div>

              {/* Filter Pills */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => { setCohortFilter('all'); setCurrentPage(1); }}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '20px',
                    border: `1.5px solid ${cohortFilter === 'all' ? '#1E6BFF' : '#E2E8F0'}`,
                    backgroundColor: cohortFilter === 'all' ? '#EFF6FF' : 'transparent',
                    color: cohortFilter === 'all' ? '#1E6BFF' : '#64748B',
                    fontWeight: 600,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                  }}
                >
                  All Assigned Mentees ({(mentorStats.total_mentees || totalMentees).toLocaleString()})
                </button>
                <button
                  type="button"
                  onClick={() => { setCohortFilter('verified_profile'); setCurrentPage(1); }}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '20px',
                    border: `1.5px solid ${cohortFilter === 'verified_profile' ? '#10B981' : '#E2E8F0'}`,
                    backgroundColor: cohortFilter === 'verified_profile' ? '#ECFDF5' : 'transparent',
                    color: cohortFilter === 'verified_profile' ? '#059669' : '#64748B',
                    fontWeight: 600,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                  }}
                >
                  Verified Enrolled Cohort ({verifiedCount})
                </button>
                <button
                  type="button"
                  onClick={() => { setCohortFilter('high_risk'); setCurrentPage(1); }}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '20px',
                    border: `1.5px solid ${cohortFilter === 'high_risk' ? '#EF4444' : '#E2E8F0'}`,
                    backgroundColor: cohortFilter === 'high_risk' ? '#FEF2F2' : 'transparent',
                    color: cohortFilter === 'high_risk' ? '#DC2626' : '#64748B',
                    fontWeight: 600,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                  }}
                >
                  High Academic Risk ({highRiskCount.toLocaleString()})
                </button>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${isDarkMode ? '#334155' : '#F1F5F9'}`, textAlign: 'left', color: '#64748B' }}>
                      <th style={{ padding: '10px 8px' }}>Mentee</th>
                      <th style={{ padding: '10px 8px' }}>Year / Sem</th>
                      <th style={{ padding: '10px 8px' }}>CGPA</th>
                      <th style={{ padding: '10px 8px' }}>Attendance</th>
                      <th style={{ padding: '10px 8px' }}>Backlogs</th>
                      <th style={{ padding: '10px 8px' }}>Success Score</th>
                      <th style={{ padding: '10px 8px' }}>Academic Risk</th>
                      <th style={{ padding: '10px 8px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={8} style={{ padding: '24px 8px', textAlign: 'center', color: '#64748B' }}>
                          Loading assigned mentees...
                        </td>
                      </tr>
                    ) : filteredMentees.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ padding: '24px 8px', textAlign: 'center', color: '#64748B' }}>
                          No mentees match your search query.
                        </td>
                      </tr>
                    ) : (
                      filteredMentees.map((s) => (
                        <tr
                          key={s.id}
                          style={{
                            borderBottom: `1px solid ${isDarkMode ? '#334155' : '#F8FAFC'}`,
                            backgroundColor: selectedStudent?.id === s.id ? (isDarkMode ? '#0F172A' : '#EFF6FF') : 'transparent',
                          }}
                        >
                          <td style={{ padding: '12px 8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <StudentAvatar
                              src={s.avatar}
                              name={s.name}
                              id={s.id}
                              size={32}
                            />
                            <div>
                              <div style={{ fontWeight: 700 }}>{s.name}</div>
                              <div style={{ fontSize: '0.72rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span>{s.id}</span>
                                <span
                                  style={{
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    fontSize: '0.65rem',
                                    fontWeight: 700,
                                    backgroundColor: s.recordType === 'verified_profile' ? '#ECFDF5' : '#F1F5F9',
                                    color: s.recordType === 'verified_profile' ? '#059669' : '#64748B',
                                    border: s.recordType === 'verified_profile' ? '1px solid #A7F3D0' : '1px solid #E2E8F0',
                                  }}
                                >
                                  {s.recordType === 'verified_profile' ? 'Verified (100%)' : 'Benchmark (94%)'}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '12px 8px' }}>{s.year || '3rd Year'}</td>
                          <td style={{ padding: '12px 8px', fontWeight: 700 }}>{s.cgpa}</td>
                          <td style={{ padding: '12px 8px', color: s.attendance < 75 ? '#EF4444' : '#10B981', fontWeight: 600 }}>
                            {s.attendance}%
                          </td>
                          <td style={{ padding: '12px 8px', color: s.backlogs > 0 ? '#EF4444' : '#10B981', fontWeight: 700 }}>
                            {s.backlogs ?? 0}
                          </td>
                          <td style={{ padding: '12px 8px' }}>
                            <span
                              style={{
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontWeight: 700,
                                fontSize: '0.76rem',
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
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                backgroundColor: s.academicRisk === 'HIGH' ? '#FEF2F2' : s.academicRisk === 'MEDIUM' ? '#FFFBEB' : '#ECFDF5',
                                color: s.academicRisk === 'HIGH' ? '#DC2626' : s.academicRisk === 'MEDIUM' ? '#D97706' : '#059669',
                              }}
                            >
                              {s.academicRisk}
                            </span>
                          </td>
                          <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                            {(() => {
                              const isStudentApproved =
                                Boolean(s.isApproved) ||
                                Boolean(approvedRecs[s.id]) ||
                                Boolean(approvedRecs[s.roll_no]) ||
                                Boolean(approvedRecs[s.name]) ||
                                interventions.some(
                                  (inv) =>
                                    (inv.student_roll_no === s.id || inv.student_roll_no === s.roll_no) &&
                                    (inv.approval_status === 'APPROVED' || inv.status === 'OPEN' || inv.status === 'COMPLETED')
                                );

                              if (isStudentApproved) {
                                return (
                                  <button
                                    disabled
                                    style={{
                                      padding: '5px 10px',
                                      borderRadius: '6px',
                                      backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.2)' : '#ECFDF5',
                                      color: '#059669',
                                      border: '1px solid #A7F3D0',
                                      fontSize: '0.76rem',
                                      fontWeight: 700,
                                      cursor: 'default',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      marginRight: '6px',
                                    }}
                                    title="Intervention already approved and synced"
                                  >
                                    <Check size={13} />
                                    <span>Approved</span>
                                  </button>
                                );
                              }

                              const isApproving = approvingStudentId === (s.id || s.roll_no);

                              return (
                                <button
                                  onClick={() => handleApproveMentee(s)}
                                  disabled={isApproving}
                                  style={{
                                    padding: '5px 10px',
                                    borderRadius: '6px',
                                    backgroundColor: '#10B981',
                                    color: '#FFFFFF',
                                    border: 'none',
                                    fontSize: '0.76rem',
                                    fontWeight: 600,
                                    cursor: isApproving ? 'not-allowed' : 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    marginRight: '6px',
                                    opacity: isApproving ? 0.7 : 1,
                                    transition: 'all 150ms ease',
                                  }}
                                  title="Approve recommended intervention"
                                >
                                  {isApproving ? (
                                    <>
                                      <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                                      <span>Approving...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Check size={13} />
                                      <span>Approve</span>
                                    </>
                                  )}
                                </button>
                              );
                            })()}
                            <button
                              onClick={() => {
                                setInspectStudent(s);
                                setInspectModalOpen(true);
                              }}
                              style={{
                                padding: '5px 10px',
                                borderRadius: '6px',
                                backgroundColor: '#1E6BFF',
                                color: '#FFFFFF',
                                border: 'none',
                                fontSize: '0.76rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <Eye size={13} />
                              <span>Inspect Mentee</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '1rem',
                  borderTop: `1px solid ${isDarkMode ? '#334155' : '#F1F5F9'}`,
                  marginTop: '1rem',
                  fontSize: '0.82rem',
                  color: '#64748B',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <div>
                  Showing {totalMentees > 0 ? (currentPage - 1) * 50 + 1 : 0} to{' '}
                  {Math.min(currentPage * 50, totalMentees)} of {totalMentees.toLocaleString()} assigned mentees
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1 || loading}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      backgroundColor: '#FFFFFF',
                      color: '#334155',
                      fontWeight: 600,
                      cursor: currentPage <= 1 || loading ? 'not-allowed' : 'pointer',
                      opacity: currentPage <= 1 || loading ? 0.5 : 1,
                    }}
                  >
                    Previous
                  </button>
                  <span style={{ fontWeight: 600, color: isDarkMode ? '#FFFFFF' : '#0F172A' }}>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages || loading}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      backgroundColor: '#FFFFFF',
                      color: '#334155',
                      fontWeight: 600,
                      cursor: currentPage >= totalPages || loading ? 'not-allowed' : 'pointer',
                      opacity: currentPage >= totalPages || loading ? 0.5 : 1,
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>


            </div>
          </main>
        </div>
      </div>

      {/* AI FACULTY MENTOR COPILOT MODAL */}
      {copilotModalOpen && (
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
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '1.75rem',
              boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
              border: `1px solid ${isDarkMode ? '#334155' : '#E2E8F0'}`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#F3E8FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8B5CF6' }}>
                  <Bot size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>AI Faculty Mentor Copilot</h3>
                  <span style={{ fontSize: '0.76rem', color: '#64748B' }}>
                    Telemetry-grounded mentee diagnostic & Human-in-the-Loop intervention approval
                  </span>
                </div>
              </div>
              <button
                onClick={() => setCopilotModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>

            {copilotLoading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
                <Loader2 size={32} className="spin" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
                <div style={{ fontWeight: 600, fontSize: '0.90rem' }}>Analyzing student longitudinal telemetry...</div>
                <div style={{ fontSize: '0.76rem', color: '#94A3B8', marginTop: '4px' }}>Evaluating academic risk precedence, coding velocity & attendance trends</div>
              </div>
            ) : copilotError ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#DC2626' }}>
                <AlertTriangle size={32} style={{ margin: '0 auto 8px' }} />
                <div style={{ fontWeight: 600 }}>{copilotError}</div>
              </div>
            ) : copilotData ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Student Header Summary */}
                <div
                  style={{
                    backgroundColor: isDarkMode ? '#0F172A' : '#FAF5FF',
                    border: '1px solid #E9D5FF',
                    borderRadius: '12px',
                    padding: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: '#581C87' }}>
                      {copilotData.student_name} ({copilotData.student_roll_no})
                    </div>
                    <span style={{ fontSize: '0.74rem', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#8B5CF6', color: '#FFFFFF', fontWeight: 700 }}>
                      Success Score: {copilotData.current_metrics?.success_score}/100
                    </span>
                  </div>
                  <div style={{ fontSize: '0.80rem', color: isDarkMode ? '#E2E8F0' : '#374151', lineHeight: 1.5 }}>
                    {copilotData.executive_summary}
                  </div>
                </div>

                {/* Key Risk Drivers */}
                <div>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '0.88rem', fontWeight: 700, color: '#DC2626', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertTriangle size={16} /> Key Risk Drivers
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {copilotData.key_risk_drivers?.map((driver, idx) => (
                      <div
                        key={idx}
                        style={{
                          fontSize: '0.80rem',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          backgroundColor: isDarkMode ? '#0F172A' : '#FEF2F2',
                          border: '1px solid #FEE2E2',
                          color: isDarkMode ? '#FCA5A5' : '#991B1B',
                        }}
                      >
                        • {driver}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommended Interventions (Human-in-the-loop approval) */}
                <div>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '0.88rem', fontWeight: 700, color: '#1E6BFF', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Target size={16} /> Prescribed Remedial Interventions (Human-In-The-Loop Approval)
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {copilotData.recommended_interventions?.map((rec, idx) => {
                      const isApproved = approvedRecs[rec.title];
                      return (
                        <div
                          key={idx}
                          style={{
                            padding: '12px 14px',
                            borderRadius: '10px',
                            backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC',
                            border: `1px solid ${isApproved ? '#86EFAC' : (isDarkMode ? '#334155' : '#E2E8F0')}`,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '12px',
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                              <span style={{ fontWeight: 700, fontSize: '0.86rem' }}>{rec.title}</span>
                              <span
                                style={{
                                  fontSize: '0.66rem',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  fontWeight: 700,
                                  backgroundColor: rec.priority === 'HIGH' ? '#FEF2F2' : '#EFF6FF',
                                  color: rec.priority === 'HIGH' ? '#DC2626' : '#1E6BFF',
                                }}
                              >
                                {rec.priority} PRIORITY
                              </span>
                            </div>
                            <div style={{ fontSize: '0.76rem', color: '#64748B' }}>{rec.rationale}</div>
                          </div>

                          <button
                            onClick={() => handleApproveCopilotIntervention(rec)}
                            disabled={isApproved}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '8px',
                              border: 'none',
                              fontSize: '0.76rem',
                              fontWeight: 700,
                              cursor: isApproved ? 'default' : 'pointer',
                              backgroundColor: isApproved ? '#10B981' : '#1E6BFF',
                              color: '#FFFFFF',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {isApproved ? (
                              <>
                                <CheckCircle2 size={14} />
                                <span>Approved</span>
                              </>
                            ) : (
                              'Approve & Create'
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 1:1 Meeting Agenda */}
                <div>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '0.84rem', fontWeight: 700, color: '#475569' }}>
                    1:1 Meeting Discussion Talking Points
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.78rem', color: '#64748B', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {copilotData.meeting_agenda?.map((point, idx) => (
                      <li key={idx}>{point}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* INSPECT MENTEE MODAL POPUP */}
      {inspectModalOpen && inspectStudent && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setInspectModalOpen(false);
              setInspectStudent(null);
            }
          }}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1.25rem',
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
              borderRadius: '20px',
              maxWidth: '780px',
              width: '100%',
              maxHeight: '92vh',
              overflowY: 'auto',
              padding: '2rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              border: `1px solid ${isDarkMode ? '#334155' : '#E2E8F0'}`,
              color: isDarkMode ? '#F8FAFC' : '#0F172A',
              position: 'relative',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                paddingBottom: '1.25rem',
                borderBottom: `1px solid ${isDarkMode ? '#334155' : '#F1F5F9'}`,
                marginBottom: '1.25rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <StudentAvatar
                  src={inspectStudent.avatar}
                  name={inspectStudent.name}
                  id={inspectStudent.id}
                  size={54}
                />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
                      {inspectStudent.name}
                    </h3>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        backgroundColor:
                          inspectStudent.recordType === 'verified_profile'
                            ? (isDarkMode ? 'rgba(16, 185, 129, 0.2)' : '#ECFDF5')
                            : (isDarkMode ? 'rgba(30, 107, 255, 0.2)' : '#EFF6FF'),
                        color: inspectStudent.recordType === 'verified_profile' ? '#059669' : '#1E6BFF',
                        border: `1px solid ${inspectStudent.recordType === 'verified_profile' ? '#A7F3D0' : '#BFDBFE'}`,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      {inspectStudent.recordType === 'verified_profile' ? (
                        <>
                          <ShieldCheck size={12} />
                          <span>Verified Profile (100% Provenance)</span>
                        </>
                      ) : (
                        <>
                          <Database size={12} />
                          <span>Benchmark Cohort (94.1% Telemetry)</span>
                        </>
                      )}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '3px' }}>
                    Roll No: <strong>{inspectStudent.id || inspectStudent.roll_no}</strong> • {inspectStudent.department} • {inspectStudent.year || '3rd Year'} (Semester {inspectStudent.semester || 6})
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setInspectModalOpen(false);
                  setInspectStudent(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '6px',
                }}
                title="Close modal (Escape)"
              >
                ✕
              </button>
            </div>

            {/* 4 Metric Panels */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
              {/* Panel 1: Academic Performance */}
              <div
                style={{
                  padding: '1.25rem',
                  borderRadius: '12px',
                  backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC',
                  border: `1px solid ${isDarkMode ? '#334155' : '#E2E8F0'}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#1E6BFF', fontWeight: 700, fontSize: '0.86rem' }}>
                  <GraduationCap size={18} />
                  <span>Academic Performance</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.82rem' }}>
                  <div>
                    <div style={{ color: '#64748B', fontSize: '0.74rem' }}>Cumulative CGPA</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{inspectStudent.cgpa} <span style={{ fontSize: '0.74rem', color: '#64748B' }}>/ 10.0</span></div>
                  </div>
                  <div>
                    <div style={{ color: '#64748B', fontSize: '0.74rem' }}>Attendance Rate</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: inspectStudent.attendance < 75.0 ? '#DC2626' : '#059669' }}>
                      {inspectStudent.attendance}%
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#64748B', fontSize: '0.74rem' }}>Active Backlogs</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: (inspectStudent.backlogs || 0) > 0 ? '#DC2626' : '#059669' }}>
                      {inspectStudent.backlogs || 0}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#64748B', fontSize: '0.74rem' }}>Success Score</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1E6BFF' }}>
                      {inspectStudent.successScore} <span style={{ fontSize: '0.72rem', color: '#64748B' }}>({inspectStudent.scoreBand || 'GOOD'})</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Panel 2: Technical Skills */}
              <div
                style={{
                  padding: '1.25rem',
                  borderRadius: '12px',
                  backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC',
                  border: `1px solid ${isDarkMode ? '#334155' : '#E2E8F0'}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#10B981', fontWeight: 700, fontSize: '0.86rem' }}>
                  <Target size={18} />
                  <span>Technical Skills & Velocity</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.82rem' }}>
                  <div>
                    <div style={{ color: '#64748B', fontSize: '0.74rem' }}>Coding Assessment</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{inspectStudent.codingSkills || 8.0} <span style={{ fontSize: '0.74rem', color: '#64748B' }}>/ 10</span></div>
                  </div>
                  <div>
                    <div style={{ color: '#64748B', fontSize: '0.74rem' }}>DSA Benchmark</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{inspectStudent.dsaScore || 8.0} <span style={{ fontSize: '0.74rem', color: '#64748B' }}>/ 10</span></div>
                  </div>
                  <div>
                    <div style={{ color: '#64748B', fontSize: '0.74rem' }}>LMS Assignment Velocity</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{inspectStudent.lmsCompletion || 85}%</div>
                  </div>
                  <div>
                    <div style={{ color: '#64748B', fontSize: '0.74rem' }}>Weekly LMS Activity</div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700 }}>{inspectStudent.lmsLoginsPerWeek || 8} logins/wk</div>
                  </div>
                </div>
              </div>

              {/* Panel 3: Risk Assessment */}
              <div
                style={{
                  padding: '1.25rem',
                  borderRadius: '12px',
                  backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC',
                  border: `1px solid ${isDarkMode ? '#334155' : '#E2E8F0'}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#F59E0B', fontWeight: 700, fontSize: '0.86rem' }}>
                  <AlertTriangle size={18} />
                  <span>Decoupled Risk Assessment</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.82rem', marginBottom: '8px' }}>
                  <div>
                    <div style={{ color: '#64748B', fontSize: '0.74rem' }}>Academic Risk Band</div>
                    <span
                      style={{
                        display: 'inline-block',
                        marginTop: '4px',
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        backgroundColor: inspectStudent.academicRisk === 'HIGH' ? '#FEF2F2' : inspectStudent.academicRisk === 'MEDIUM' ? '#FFFBEB' : '#ECFDF5',
                        color: inspectStudent.academicRisk === 'HIGH' ? '#DC2626' : inspectStudent.academicRisk === 'MEDIUM' ? '#D97706' : '#059669',
                      }}
                    >
                      {inspectStudent.academicRisk} ({Math.round((inspectStudent.academicRiskProb || 0.15) * 100)}%)
                    </span>
                  </div>
                  <div>
                    <div style={{ color: '#64748B', fontSize: '0.74rem' }}>Placement Readiness</div>
                    <span
                      style={{
                        display: 'inline-block',
                        marginTop: '4px',
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        backgroundColor: inspectStudent.placementRisk === 'HIGH' ? '#FEF2F2' : inspectStudent.placementRisk === 'MEDIUM' ? '#FFFBEB' : '#ECFDF5',
                        color: inspectStudent.placementRisk === 'HIGH' ? '#DC2626' : inspectStudent.placementRisk === 'MEDIUM' ? '#D97706' : '#059669',
                      }}
                    >
                      {inspectStudent.placementRisk === 'LOW' ? 'READY' : inspectStudent.placementRisk} ({Math.round((inspectStudent.placementRiskProb || 0.20) * 100)}%)
                    </span>
                  </div>
                </div>
                <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: '6px', borderTop: `1px solid ${isDarkMode ? '#334155' : '#E2E8F0'}`, paddingTop: '6px' }}>
                  Primary Risk Factor: <strong style={{ color: isDarkMode ? '#FFFFFF' : '#0F172A' }}>{inspectStudent.topRiskFactor || 'None (On-track candidate)'}</strong>
                </div>
              </div>

              {/* Panel 4: Mentor Information & Interventions */}
              <div
                style={{
                  padding: '1.25rem',
                  borderRadius: '12px',
                  backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC',
                  border: `1px solid ${isDarkMode ? '#334155' : '#E2E8F0'}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#8B5CF6', fontWeight: 700, fontSize: '0.86rem' }}>
                  <Users size={18} />
                  <span>Faculty Mentorship & Tasks</span>
                </div>
                <div style={{ fontSize: '0.82rem', marginBottom: '8px' }}>
                  <div style={{ color: '#64748B', fontSize: '0.74rem' }}>Assigned Faculty Mentor</div>
                  <div style={{ fontWeight: 700, fontSize: '0.94rem' }}>
                    {inspectStudent.assignedMentor || currentUser?.name || 'Prof. Rajesh Kumar'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.78rem', marginBottom: '8px' }}>
                  <div>
                    Pending Tasks:{' '}
                    <strong style={{ color: '#D97706' }}>
                      {interventions.filter((i) => (i.student_roll_no === inspectStudent.id || i.student_roll_no === inspectStudent.roll_no) && i.status !== 'COMPLETED').length}
                    </strong>
                  </div>
                  <div>
                    Completed Tasks:{' '}
                    <strong style={{ color: '#059669' }}>
                      {interventions.filter((i) => (i.student_roll_no === inspectStudent.id || i.student_roll_no === inspectStudent.roll_no) && i.status === 'COMPLETED').length}
                    </strong>
                  </div>
                </div>
                <div style={{ maxHeight: '70px', overflowY: 'auto', fontSize: '0.74rem', color: '#64748B' }}>
                  {interventions.filter((i) => i.student_roll_no === inspectStudent.id || i.student_roll_no === inspectStudent.roll_no).length > 0 ? (
                    interventions
                      .filter((i) => i.student_roll_no === inspectStudent.id || i.student_roll_no === inspectStudent.roll_no)
                      .slice(0, 2)
                      .map((task) => (
                        <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: task.status === 'COMPLETED' ? '#10B981' : '#F59E0B' }} />
                          <span style={{ textDecoration: task.status === 'COMPLETED' ? 'line-through' : 'none' }}>{task.title}</span>
                        </div>
                      ))
                  ) : (
                    <div>No interventions dispatched yet.</div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '1.25rem',
                borderTop: `1px solid ${isDarkMode ? '#334155' : '#F1F5F9'}`,
                flexWrap: 'wrap',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {(() => {
                  const isApproved =
                    Boolean(inspectStudent.isApproved) ||
                    Boolean(approvedRecs[inspectStudent.id]) ||
                    Boolean(approvedRecs[inspectStudent.roll_no]) ||
                    Boolean(approvedRecs[inspectStudent.name]) ||
                    interventions.some(
                      (inv) =>
                        (inv.student_roll_no === inspectStudent.id || inv.student_roll_no === inspectStudent.roll_no) &&
                        (inv.approval_status === 'APPROVED' || inv.status === 'OPEN' || inv.status === 'COMPLETED')
                    );

                  if (isApproved) {
                    return (
                      <button
                        disabled
                        style={{
                          padding: '8px 14px',
                          borderRadius: '8px',
                          backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.2)' : '#ECFDF5',
                          color: '#059669',
                          border: '1px solid #A7F3D0',
                          fontSize: '0.84rem',
                          fontWeight: 700,
                          cursor: 'default',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <Check size={15} />
                        <span>Intervention Approved</span>
                      </button>
                    );
                  }

                  const isApproving = approvingStudentId === (inspectStudent.id || inspectStudent.roll_no);

                  return (
                    <button
                      onClick={() => handleApproveMentee(inspectStudent)}
                      disabled={isApproving}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '8px',
                        backgroundColor: '#10B981',
                        color: '#FFFFFF',
                        border: 'none',
                        fontSize: '0.84rem',
                        fontWeight: 600,
                        cursor: isApproving ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        opacity: isApproving ? 0.7 : 1,
                      }}
                    >
                      {isApproving ? (
                        <>
                          <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                          <span>Approving...</span>
                        </>
                      ) : (
                        <>
                          <Check size={15} />
                          <span>Approve Intervention</span>
                        </>
                      )}
                    </button>
                  );
                })()}

                <button
                  onClick={() => {
                    setNewTaskRoll(inspectStudent.id || inspectStudent.roll_no);
                    setNewTaskName(inspectStudent.name);
                    setInspectModalOpen(false);
                    setCreateTaskModalOpen(true);
                  }}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    backgroundColor: '#1E6BFF',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Plus size={15} />
                  <span>Assign Remedial Task</span>
                </button>
              </div>

              <button
                onClick={() => {
                  setInspectModalOpen(false);
                  setInspectStudent(null);
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  backgroundColor: isDarkMode ? '#334155' : '#F1F5F9',
                  color: isDarkMode ? '#FFFFFF' : '#475569',
                  border: `1px solid ${isDarkMode ? '#475569' : '#CBD5E1'}`,
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE REMEDIAL TASK MODAL */}
      {createTaskModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1.5rem',
          }}
        >
          <div
            style={{
              backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
              borderRadius: '20px',
              maxWidth: '520px',
              width: '100%',
              padding: '1.75rem',
              boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
              border: `1px solid ${isDarkMode ? '#334155' : '#E2E8F0'}`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
                  <Target size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Assign Remedial Intervention</h3>
                  <span style={{ fontSize: '0.74rem', color: '#64748B' }}>Directly synced to student cockpit</span>
                </div>
              </div>
              <button
                onClick={() => setCreateTaskModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '1.1rem' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px' }}>
                  Select Mentee
                </label>
                <select
                  value={newTaskRoll}
                  onChange={(e) => {
                    setNewTaskRoll(e.target.value);
                    const match = mentees.find((m) => m.id === e.target.value);
                    if (match) setNewTaskName(match.name);
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.86rem',
                  }}
                >
                  {mentees.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.id}) — {m.academicRisk} Risk
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px' }}>
                  Action / Remedial Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mandatory remedial counseling for Arrears in CS301"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.86rem',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px' }}>
                    Category
                  </label>
                  <select
                    value={newTaskCategory}
                    onChange={(e) => setNewTaskCategory(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.86rem',
                    }}
                  >
                    <option value="ATTENDANCE">Attendance Warning</option>
                    <option value="ACADEMIC">Academic Remedial</option>
                    <option value="SKILL_GAP">Skill Gap / DSA</option>
                    <option value="PLACEMENT">Placement Prep</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px' }}>
                    Target Due Date
                  </label>
                  <input
                    type="text"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    placeholder="e.g. Nov 15, 2026"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.86rem',
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingTask}
                style={{
                  marginTop: '0.5rem',
                  backgroundColor: '#10B981',
                  color: '#FFFFFF',
                  padding: '10px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.90rem',
                  border: 'none',
                  cursor: submittingTask ? 'not-allowed' : 'pointer',
                }}
              >
                {submittingTask ? 'Assigning Task...' : 'Confirm & Dispatch to Student Cockpit'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
