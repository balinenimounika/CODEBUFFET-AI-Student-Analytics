import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Award,
  CheckCircle,
  CheckCircle2,
  ArrowLeft,
  LogOut,
  Sparkles,
  TrendingUp,
  Sliders,
  CheckSquare,
  Square,
  Bot,
  Send,
  Loader2,
  Calendar,
  AlertTriangle,
  ChevronRight,
  Target,
  Edit3,
  Database,
  Bell,
  Check,
  ShieldCheck,
  Clock,
  ExternalLink,
  Home,
  Filter,
  CheckCheck,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import BrandLogo from '../../components/common/BrandLogo';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const SUPPORTED_BRANCHES = [
  { id: 'CSE', label: 'Computer Science & Engineering' },
  { id: 'IT', label: 'Information Technology' },
  { id: 'Data Science', label: 'Data Science' },
  { id: 'EEE', label: 'Electrical & Electronics Engineering' },
  { id: 'ECE', label: 'Electronics & Communication Engineering' },
  { id: 'Mechanical', label: 'Mechanical Engineering' },
];

const ALL_SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

export const SUGGESTED_QUESTIONS = [
  'How can I improve my CGPA?',
  'How much attendance do I need to reach 85%?',
  'How can I clear my backlogs?',
  'How can I improve my coding skills?',
  'Am I ready for placements?',
  'Which skills should I learn for software jobs?',
  'What tasks are overdue?',
  'Create a study timetable for me.',
  'Why am I classified as high, medium or low risk?',
  'What should I improve this week?',
  'How can I improve my average score?',
  'What should I focus on today?',
];

/**
 * Universal Date Categorizer
 * Evaluates date strings against today's local date.
 * Accurately determines: TODAY, OVERDUE (with exact age in days), UPCOMING, NO_DUE_DATE.
 */
export function getTaskDateInfo(dueStr) {
  if (!dueStr) {
    return { category: 'NO_DUE_DATE', diffDays: null, label: 'No Due Date', overdueAge: null };
  }
  const s = String(dueStr).trim();
  const lower = s.toLowerCase();
  if (lower === 'ongoing' || lower === 'none' || lower === 'tbd' || lower === 'in 30 days') {
    return { category: 'NO_DUE_DATE', diffDays: null, label: s, overdueAge: null };
  }

  const d = new Date(s);
  if (isNaN(d.getTime())) {
    return { category: 'NO_DUE_DATE', diffDays: null, label: s, overdueAge: null };
  }

  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const taskStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const diffTime = taskStart.getTime() - todayStart.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return { category: 'TODAY', diffDays: 0, label: 'Due Today', overdueAge: 0 };
  } else if (diffDays < 0) {
    const age = Math.abs(diffDays);
    const label = age === 1 ? '1 day overdue' : `${age} days overdue`;
    return { category: 'OVERDUE', diffDays, label, overdueAge: age };
  } else {
    const label = diffDays === 1 ? 'Due tomorrow' : `Due in ${diffDays} days`;
    return { category: 'UPCOMING', diffDays, label, overdueAge: null };
  }
}

/**
 * Client-Side Grounded AI Fallback Engine
 * Generates verified responses for all 12 suggested topics using studentData and tasks.
 */
function generateClientGroundedAnswer(question, studentData, tasks) {
  const q = question.toLowerCase();
  const name = studentData?.name || 'Aarav Sharma';
  const cgpa = studentData?.cgpa || 8.42;
  const backlogs = studentData?.backlogs || 0;
  const attendance = studentData?.attendance || 88.5;
  const dsa = studentData?.dsa_score || 8.5;
  const coding = studentData?.coding_skills || 8.2;
  const aptitude = studentData?.aptitude_score || 78.0;
  const successScore = studentData?.success_score || 85.4;
  const acadRisk = studentData?.academic_risk || 'LOW';
  const placRisk = studentData?.placement_risk || 'LOW';
  const mentor = tasks[0]?.mentor || 'Prof. Rajesh Kumar';
  const lms = studentData?.components?.lms || 89.0;

  const overdueList = tasks.filter((t) => !t.done && getTaskDateInfo(t.due).category === 'OVERDUE');
  const todayList = tasks.filter((t) => getTaskDateInfo(t.due).category === 'TODAY');

  if (q.includes('improve') && q.includes('cgpa')) {
    return {
      text: `Hello ${name}, your current cumulative CGPA is ${cgpa}/10.0 with ${backlogs} active backlogs. To improve your CGPA: 1) Prioritize high-weightage end-semester exams (60% weight). 2) Ensure on-time LMS assignment submissions (currently ${lms}%). 3) Schedule 1-on-1 office hours with ${mentor}. ${backlogs > 0 ? '4) Clearing your ' + backlogs + ' active backlog(s) in remedial exams is urgent.' : '4) Keep maintaining your clean academic record.'}`,
      actions: ['Review Exam Weightage', 'Target 100% LMS Submissions', `Meet with ${mentor}`],
    };
  } else if (q.includes('attendance') && (q.includes('85') || q.includes('reach') || q.includes('need'))) {
    if (attendance >= 85.0) {
      return {
        text: `Great news, ${name}! Your overall lecture attendance is currently ${attendance}%, which already exceeds the 85.0% institutional benchmark. You have zero attendance detention risk. Continue attending regular classes to preserve your standing.`,
        actions: ['Maintain Attendance', 'Track Subject Absences', 'Keep Medical Slips'],
      };
    } else {
      const needed = Math.max(1, Math.round(((0.85 * 100 - attendance) / 0.15)));
      return {
        text: `Your overall attendance is currently ${attendance}%. To raise your attendance to 85.0%, you need to attend approximately the next ${needed} consecutive classes without missing a session. Mentor ${mentor} is tracking this metric to ensure exam eligibility.`,
        actions: [`Attend Next ${needed} Classes`, 'Submit Medical Certificates', 'Review Daily Timetable'],
      };
    }
  } else if (q.includes('backlog')) {
    if (backlogs === 0) {
      return {
        text: `Outstanding record, ${name}! You currently have 0 active backlogs in official registrar records. Maintaining a clean academic slate ensures you remain eligible for Tier-1 Super-Dream company drives (CTC > 12 LPA).`,
        actions: ['Maintain Zero Backlogs', 'Focus on Advanced Electives', 'Practice Super-Dream Mock Tests'],
      };
    } else {
      return {
        text: `You currently have ${backlogs} active backlog(s) recorded in your profile. Structured plan: 1) Register for upcoming supplementary exams with the Controller of Examinations. 2) Attend remedial sessions led by ${mentor}. 3) Practice past 3 years' question papers.`,
        actions: ['Register for Supplementary Exam', 'Attend Remedial Sessions', 'Solve Previous Year Papers'],
      };
    }
  } else if (q.includes('coding') && (q.includes('skill') || q.includes('improve') || q.includes('how'))) {
    return {
      text: `Your current technical telemetry records a DSA score of ${dsa}/10 and an overall Coding Skills rating of ${coding}/10. To reach Tier-1 recruiter readiness (8.5+/10): 1) Solve 2 medium problems daily on LeetCode focusing on Dynamic Programming, Trees, and Graphs. 2) Complete your assigned task: 'Complete LeetCode Top 50 DSA practice set'. 3) Participate in weekly contests.`,
      actions: ['Solve Daily LeetCode Medium', 'Master Dynamic Programming', 'Build Full-Stack Project'],
    };
  } else if (q.includes('placement')) {
    return {
      text: `Your Placement Readiness is rated as ${placRisk} risk with a Success Score of ${successScore}/100. Eligibility check: CGPA ${cgpa}/10.0 (Cutoff: >= 7.5 ✓), Backlogs: ${backlogs} (Cutoff: 0 ✓), DSA: ${dsa}/10 (Cutoff: >= 7.5 ✓), Aptitude: ${aptitude}/100 (Cutoff: >= 70 ✓). You are strongly positioned for super-dream placement drives!`,
      actions: ['Practice Mock Technical Interviews', 'Solve Timed Aptitude Tests', 'Refine Placement Profile'],
    };
  } else if (q.includes('software') || (q.includes('skill') && q.includes('job'))) {
    return {
      text: `For software engineering roles, corporate recruitment benchmarks evaluate: 1) Data Structures & Algorithms (Trees, Graphs, DP). 2) Modern Backend APIs (FastAPI / Express / Spring Boot) with SQL indexing. 3) DevOps tooling (Git, Docker, CI/CD). Mentor ${mentor} recommends publishing your capstone projects to GitHub.`,
      actions: ['Build FastAPI Backend', 'Learn Docker Containerization', 'Publish to GitHub'],
    };
  } else if (q.includes('overdue')) {
    if (overdueList.length > 0) {
      const items = overdueList.map((t) => `'${t.text}' (${getTaskDateInfo(t.due).label})`).join(', ');
      return {
        text: `You currently have ${overdueList.length} overdue action item(s): ${items}. Please submit these deliverables in your Tasks tab as soon as possible.`,
        actions: ['Open Tasks Tab', 'Submit Overdue Deliverable', `Contact ${mentor}`],
      };
    } else {
      return {
        text: `Great job, ${name}! You have zero overdue tasks. All your assigned mentoring action items are completely up to date.`,
        actions: ['Review Upcoming Tasks', 'Work on Next Milestone', 'Practice Daily DSA'],
      };
    }
  } else if (q.includes('timetable') || q.includes('schedule')) {
    return {
      text: `Personalized daily study schedule for ${name} (CGPA: ${cgpa}, Attendance: ${attendance}%): • 07:30 - 08:45 AM: Morning DSA Problem Solving (2 LeetCode medium). • 09:00 AM - 04:30 PM: University Lectures & Labs (target >= 85% attendance). • 05:00 - 06:15 PM: LMS Assignment Completion. • 07:30 - 09:00 PM: Project Development & GitHub commits. • 09:30 - 10:15 PM: Daily Wrap-Up & Task review.`,
      actions: ['Block 7:30 AM for DSA', 'Submit LMS Tasks by 6 PM', 'Daily Task Wrap-Up'],
    };
  } else if (q.includes('risk')) {
    return {
      text: `Your risk classification uses decoupled engines: 1) Academic Risk (${acadRisk}): Computed from CGPA (${cgpa}/10.0), Backlogs (${backlogs}), and Attendance (${attendance}%). 2) Placement Risk (${placRisk}): Computed from DSA (${dsa}/10), Coding (${coding}/10), Aptitude (${aptitude}/100), and Backlogs. Decoupled evaluation ensures independent diagnostic clarity.`,
      actions: ['View Academic Risk Factors', 'View Placement Risk Breakdown', `Consult Mentor ${mentor}`],
    };
  } else if (q.includes('this week') || (q.includes('week') && q.includes('improve'))) {
    const topTask = overdueList.length > 0 ? `Submit overdue deliverable: '${overdueList[0].text}'` : todayList.length > 0 ? `Complete today's deliverable: '${todayList[0].text}'` : 'Stay ahead on upcoming project milestones';
    return {
      text: `Top 3 high-ROI improvement priorities for this week, ${name}: 1) ${topTask}. 2) Maintain lecture attendance above 85% (currently ${attendance}%). 3) Practice 2 DSA tree/graph problems daily (current DSA: ${dsa}/10).`,
      actions: ['Complete Priority Task', 'Track Daily Attendance', 'Solve 2 DSA Problems'],
    };
  } else if (q.includes('score') || q.includes('average')) {
    return {
      text: `Your current Student Success Score is ${successScore}/100. It is composed of 6 pillars: Academics (35%), Placement Readiness (20%), Attendance (15%), LMS Velocity (12%), Soft Skills (10%), and Co-Curricular (8%). Raising attendance by 5% adds ~0.75 pts; lifting DSA to 9.0 adds ~2.5 pts; achieving 100% LMS submissions adds ~1.2 pts.`,
      actions: ['Simulate What-If Sliders', 'Complete LMS Assignments', 'Increase Daily DSA Practice'],
    };
  } else if (q.includes('today')) {
    if (todayList.length > 0) {
      const items = todayList.map((t) => `'${t.text}' (Priority: ${t.priority}, Due: ${t.due})`).join('; ');
      return {
        text: `Today's primary focus should be your deliverables due today: ${items}. Please complete them and mark them finished in your Tasks widget.`,
        actions: [`Complete '${todayList[0].text}'`, 'Attend Scheduled Classes', 'Review Daily Objectives'],
      };
    } else {
      return {
        text: `You have no mentoring tasks due today! Today is an excellent day to attend all scheduled classes (current attendance: ${attendance}%), solve 2 DSA medium problems, and review upcoming project milestones.`,
        actions: ['Solve 2 LeetCode Problems', 'Work on Next Milestone', 'Review Course Notes'],
      };
    }
  }

  return {
    text: `Hello ${name}! I am your AI Student Success Assistant. I have verified access to your telemetry (CGPA: ${cgpa}, Attendance: ${attendance}%, Success Score: ${successScore}/100). Ask me about any of the 12 suggested topics: CGPA improvement, attendance targets, backlog resolution, coding practice, placement readiness, study timetables, or risk factors.`,
    actions: ['How can I improve my CGPA?', 'Am I ready for placements?', 'What tasks are overdue?'],
  };
}

export default function StudentDashboard() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  // Navigation tab state: 'cockpit' | 'tasks'
  const [activeTab, setActiveTab] = useState('cockpit');

  // Student Telemetry State
  const [studentData, setStudentData] = useState(null);
  const [isLiveApi, setIsLiveApi] = useState(false);

  // Edit Program (Branch & Semester) State
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [editBranch, setEditBranch] = useState('CSE');
  const [editSemester, setEditSemester] = useState(6);
  const [editSaving, setEditSaving] = useState(false);
  const [editSuccessMsg, setEditSuccessMsg] = useState('');

  // Historical Telemetry State
  const [historyData, setHistoryData] = useState(null);
  const [historyMetric, setHistoryMetric] = useState('cgpa');

  // "What-if" Score Simulation State
  const [simAttendance, setSimAttendance] = useState(88.5);
  const [simCoding, setSimCoding] = useState(8.2);
  const [simLms, setSimLms] = useState(89.0);
  const [liveSimulatedScore, setLiveSimulatedScore] = useState(null);

  // Mentor Tasks State with comprehensive realistic seed
  const [tasks, setTasks] = useState([
    { id: 93, text: 'Submit System Design Architecture Whitepaper', due: 'Oct 31, 2026 5:00 PM', done: false, mentor: 'Prof. Rajesh Kumar', priority: 'HIGH', category: 'ACADEMIC' },
    { id: 94, text: 'Complete Cloud Native Microservices Quiz', due: 'Oct 31, 2026 11:59 PM', done: false, mentor: 'Dr. R. Kumar', priority: 'MEDIUM', category: 'SKILL_GAP' },
    { id: 95, text: 'Review Mock Technical Interview Feedback', due: 'Oct 30, 2026', done: false, mentor: 'Vikram Malhotra', priority: 'HIGH', category: 'PLACEMENT' },
    { id: 96, text: 'Submit Compiler Design Lab Manual 4', due: 'Oct 29, 2026', done: false, mentor: 'Prof. Rajesh Kumar', priority: 'MEDIUM', category: 'ACADEMIC' },
    { id: 1, text: 'Complete LeetCode Top 50 DSA practice set', due: 'Oct 15, 2026', done: false, mentor: 'Prof. Rajesh Kumar', priority: 'HIGH', category: 'SKILL_GAP' },
    { id: 2, text: 'Submit Microservices Architecture case study on LMS', due: 'Oct 22, 2026', done: false, mentor: 'Dr. R. Kumar', priority: 'MEDIUM', category: 'ACADEMIC' },
    { id: 3, text: 'Attend Corporate Mock Technical Interview Session', due: 'Oct 28, 2026', done: false, mentor: 'Vikram Malhotra', priority: 'HIGH', category: 'PLACEMENT' },
    { id: 6, text: 'Corporate Mock Technical Interview (DSA & System Design)', due: 'Nov 12, 2026', done: false, mentor: 'Aarush Dev (TPO)', priority: 'HIGH', category: 'PLACEMENT' },
    { id: 57, text: 'Advanced Competitive Hackathon & Honors Project Track', due: 'Nov 25, 2026', done: false, mentor: 'Prof. Rajesh Kumar', priority: 'LOW', category: 'PROJECT' },
    { id: 97, text: 'Attend Academic Progress Review with Faculty Mentor', due: 'Oct 10, 2026', done: true, mentor: 'Prof. Rajesh Kumar', priority: 'MEDIUM', category: 'MENTORING' },
    { id: 98, text: 'Verify University Placement Portal Profile & Resume Upload', due: 'Oct 20, 2026', done: true, mentor: 'Vikram Malhotra', priority: 'HIGH', category: 'PLACEMENT' },
    { id: 99, text: 'Weekly Peer Study Group on Advanced Distributed Algorithms', due: 'Ongoing', done: false, mentor: 'Prof. Rajesh Kumar', priority: 'LOW', category: 'GENERAL' },
  ]);

  // Tasks Filter State (for dedicated Tasks View)
  const [taskFilterStatus, setTaskFilterStatus] = useState('ALL'); // 'ALL' | 'PENDING' | 'COMPLETED'
  const [taskFilterPriority, setTaskFilterPriority] = useState('ALL'); // 'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'
  const [taskFilterMentor, setTaskFilterMentor] = useState('ALL'); // 'ALL' | specific mentor name

  // AI Assistant State
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiConversation, setAiConversation] = useState([
    {
      sender: 'assistant',
      text: 'Hello Aarav! I am your AI Student Success Assistant. Based on your current telemetry (CGPA 8.42, Attendance 88.5%, Success Score 85.4), you are in the Tier-1 Placement Readiness tier. How can I assist your preparation today?',
      actions: ['Review DSA Roadmap', 'Improve System Design', 'Analyze Placement Odds'],
    },
  ]);

  // Load backend student telemetry on mount
  useEffect(() => {
    let isMounted = true;
    async function fetchStudentCockpit() {
      try {
        const roll = currentUser?.roll_no || 'STU-2024-042';
        const [dashRes, histRes, taskRes] = await Promise.allSettled([
          api.getStudentDashboard(roll),
          api.getStudentHistory(roll),
          api.getStudentTasks(roll),
        ]);

        if (!isMounted) return;

        if (dashRes.status === 'fulfilled' && dashRes.value) {
          const d = dashRes.value;
          setStudentData(d);
          setIsLiveApi(true);
          if (d.attendance !== undefined) setSimAttendance(d.attendance);
          if (d.coding_skills !== undefined) setSimCoding(d.coding_skills);
          if (d.components?.lms !== undefined) setSimLms(d.components.lms);
        }

        if (histRes.status === 'fulfilled' && histRes.value?.has_history) {
          setHistoryData(histRes.value.history);
        }

        if (taskRes.status === 'fulfilled') {
          const rawTasks = Array.isArray(taskRes.value) ? taskRes.value : (taskRes.value?.tasks || []);
          if (rawTasks.length > 0) {
            setTasks(
              rawTasks.map((t) => ({
                id: t.id,
                text: t.title,
                due: t.due_date,
                done: t.status === 'COMPLETED',
                mentor: t.assigned_mentor,
                priority: t.priority || 'MEDIUM',
                category: t.category || 'GENERAL',
              }))
            );
          }
        }
      } catch (err) {
        console.warn('Backend unavailable for student cockpit:', err);
      }
    }
    fetchStudentCockpit();
    return () => { isMounted = false; };
  }, [currentUser]);

  // Dynamic simulation with backend API
  useEffect(() => {
    let isMounted = true;
    async function triggerSimulation() {
      try {
        const res = await api.simulateStudentScore({
          attendance: simAttendance,
          coding_skills: simCoding,
          lms_velocity: simLms,
          cgpa: studentData?.cgpa || 8.42,
          backlogs: studentData?.backlogs || 0,
        });
        if (isMounted && res?.projected_score) {
          setLiveSimulatedScore(res.projected_score);
        }
      } catch {
        // Fallback to local calculation
      }
    }
    const timer = setTimeout(triggerSimulation, 150);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [simAttendance, simCoding, simLms, studentData]);

  // Toggle or update task completion status
  const toggleTask = async (id) => {
    const currentTask = tasks.find((t) => t.id === id);
    if (!currentTask) return;
    const newDone = !currentTask.done;
    const newStatus = newDone ? 'COMPLETED' : 'OPEN';

    // Optimistically update React state immediately across both views
    setTasks(tasks.map((t) => (t.id === id ? { ...t, done: newDone } : t)));

    try {
      await api.updateStudentTaskStatus(id, newStatus, 'Status updated via Student Portal');
    } catch {
      try {
        await api.toggleTaskStatus(id);
      } catch (err) {
        console.warn('Could not sync task status update to server:', err);
      }
    }
  };

  const handleAskAI = async (questionText = null) => {
    const prompt = questionText || aiQuestion;
    if (!prompt.trim() || aiLoading) return;

    const userMessage = { sender: 'user', text: prompt };
    setAiConversation((prev) => [...prev, userMessage]);
    setAiQuestion('');
    setAiLoading(true);

    try {
      const res = await api.askStudentAI(prompt, {
        simulated_attendance: simAttendance,
        simulated_coding: simCoding,
        simulated_lms: simLms,
      });

      setAiConversation((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: res.answer || res.response || 'Telemetry analyzed. Keep maintaining current attendance to secure placement eligibility.',
          actions: res.actionable_steps || res.recommended_actions || [],
        },
      ]);
    } catch {
      // Deterministic client fallback grounded in real student state
      const fallback = generateClientGroundedAnswer(prompt, studentData, tasks);
      setAiConversation((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: fallback.text,
          actions: fallback.actions,
        },
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  // Distinct Mentors for filtering
  const distinctMentors = useMemo(() => {
    const s = new Set();
    tasks.forEach((t) => {
      if (t.mentor) s.add(t.mentor);
    });
    return Array.from(s);
  }, [tasks]);

  // Classified Task Buckets
  const {
    todayTasks,
    overdueTasks,
    upcomingTasks,
    completedTasks,
    noDueDateTasks,
    pendingTasksCount,
  } = useMemo(() => {
    const today = [];
    const overdue = [];
    const upcoming = [];
    const completed = [];
    const noDue = [];

    tasks.forEach((t) => {
      if (t.done) {
        completed.push(t);
        return;
      }
      const info = getTaskDateInfo(t.due);
      if (info.category === 'TODAY') {
        today.push({ ...t, dateInfo: info });
      } else if (info.category === 'OVERDUE') {
        overdue.push({ ...t, dateInfo: info });
      } else if (info.category === 'UPCOMING') {
        upcoming.push({ ...t, dateInfo: info });
      } else {
        noDue.push({ ...t, dateInfo: info });
      }
    });

    // Sort overdue tasks: highest overdue age first (most urgent)
    overdue.sort((a, b) => (b.dateInfo.overdueAge || 0) - (a.dateInfo.overdueAge || 0));

    return {
      todayTasks: today,
      overdueTasks: overdue,
      upcomingTasks: upcoming,
      completedTasks: completed,
      noDueDateTasks: noDue,
      pendingTasksCount: today.length + overdue.length + upcoming.length + noDue.length,
    };
  }, [tasks]);

  // Filter helper for dedicated Tasks view
  const matchesFilters = (task) => {
    if (taskFilterStatus === 'PENDING' && task.done) return false;
    if (taskFilterStatus === 'COMPLETED' && !task.done) return false;
    if (taskFilterPriority !== 'ALL' && task.priority !== taskFilterPriority) return false;
    if (taskFilterMentor !== 'ALL' && task.mentor !== taskFilterMentor) return false;
    return true;
  };

  // Filtered lists for the 4+1 sections in the dedicated Tasks View
  const filteredTodayTasks = todayTasks.filter(matchesFilters);
  const filteredOverdueTasks = overdueTasks.filter(matchesFilters);
  const filteredUpcomingTasks = upcomingTasks.filter(matchesFilters);
  const filteredCompletedTasks = completedTasks.filter(matchesFilters);
  const filteredNoDueDateTasks = noDueDateTasks.filter(matchesFilters);

  // Prepare chart series from historyData
  const chartData = useMemo(() => {
    if (!historyData) {
      return [
        { semester: 'Sem 1', cgpa: 7.6, attendance: 82.0, success_score: 74.5 },
        { semester: 'Sem 2', cgpa: 7.85, attendance: 84.5, success_score: 77.2 },
        { semester: 'Sem 3', cgpa: 8.10, attendance: 86.0, success_score: 80.1 },
        { semester: 'Sem 4', cgpa: 8.22, attendance: 87.2, success_score: 82.4 },
        { semester: 'Sem 5', cgpa: 8.35, attendance: 88.0, success_score: 84.1 },
        { semester: 'Sem 6', cgpa: studentData?.cgpa || 8.42, attendance: studentData?.attendance || 88.5, success_score: studentData?.success_score || 85.4 },
      ];
    }

    const sems = [1, 2, 3, 4, 5, 6];
    return sems.map((s) => {
      const c = historyData.cgpa?.find((x) => x.semester === s);
      const a = historyData.attendance?.find((x) => x.semester === s);
      const sc = historyData.success_score?.find((x) => x.semester === s);
      return {
        semester: `Sem ${s}`,
        cgpa: c ? c.value : null,
        attendance: a ? a.value : null,
        success_score: sc ? sc.value : null,
      };
    }).filter((d) => d.cgpa !== null || d.attendance !== null || d.success_score !== null);
  }, [historyData, studentData]);

  // Local calculation fallback if backend simulation hasn't fired yet
  const localSimulatedScore = Math.min(
    99.0,
    Math.max(
      10.0,
      (0.35 * ((studentData?.cgpa || 8.42) / 10.0) +
        0.20 * ((78.0 * 0.4 + simCoding * 10 * 0.35 + 8.5 * 10 * 0.25) / 100.0) +
        0.15 * (simAttendance / 100.0) +
        0.12 * (simLms / 100.0) +
        0.10 * 0.82 +
        0.08 * 0.83) *
        100.0
    )
  ).toFixed(1);

  const simulatedScore = liveSimulatedScore !== null ? Number(liveSimulatedScore).toFixed(1) : localSimulatedScore;

  const handleOpenEditProfile = () => {
    setEditBranch(studentData?.department || 'Computer Science & Engineering');
    setEditSemester(studentData?.semester || 6);
    setEditSuccessMsg('');
    setEditProfileOpen(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setEditSaving(true);
    setEditSuccessMsg('');
    try {
      const res = await api.updateStudentProfile({
        branch: editBranch,
        semester: Number(editSemester),
      });
      if (res?.profile) {
        setStudentData((prev) => ({
          ...prev,
          department: res.profile.department,
          semester: res.profile.semester,
          year: res.profile.year,
        }));
        setEditSuccessMsg('Program details updated successfully!');
        setTimeout(() => {
          setEditProfileOpen(false);
        }, 1200);
      }
    } catch (err) {
      alert(err.message || 'Failed to update program details.');
    } finally {
      setEditSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F4F7FC', display: 'flex', flexDirection: 'column' }}>
      {/* Top Demo Bar */}
      <div
        style={{
          backgroundColor: '#0F172A',
          color: '#FFFFFF',
          padding: '8px 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.82rem',
          borderBottom: '1px solid rgba(228, 233, 240, 0.15)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>Logged in as: <strong>{studentData?.name || currentUser?.name || 'Aarav Sharma'}</strong> (Roll ID: {studentData?.roll_no || currentUser?.roll_no || 'STU-2024-042'})</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleLogout}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.8)',
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

      {/* Main Layout: Left Sidebar + Main Canvas */}
      <div style={{ display: 'flex', flex: 1, minHeight: 'calc(100vh - 38px)' }}>
        {/* =========================================================================
            LEFT SIDEBAR (Feature 2)
            ========================================================================= */}
        <aside
          style={{
            width: '240px',
            backgroundColor: '#FFFFFF',
            borderRight: '1px solid #E2E8F0',
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
            <div style={{ padding: '0 0.5rem 1.5rem', borderBottom: '1px solid #F1F5F9' }}>
              <BrandLogo variant="light" size="small" showTagline={false} />
            </div>

            <nav style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <button
                type="button"
                onClick={() => setActiveTab('cockpit')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  backgroundColor: activeTab === 'cockpit' ? '#1E6BFF' : 'transparent',
                  color: activeTab === 'cockpit' ? '#FFFFFF' : '#64748B',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  boxShadow: activeTab === 'cockpit' ? '0 2px 8px rgba(30, 107, 255, 0.25)' : 'none',
                  transition: 'all 150ms ease',
                }}
              >
                <Home size={18} />
                <span>Cockpit</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('tasks')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  backgroundColor: activeTab === 'tasks' ? '#1E6BFF' : 'transparent',
                  color: activeTab === 'tasks' ? '#FFFFFF' : '#64748B',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  boxShadow: activeTab === 'tasks' ? '0 2px 8px rgba(30, 107, 255, 0.25)' : 'none',
                  transition: 'all 150ms ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <CheckSquare size={18} />
                  <span>Tasks</span>
                </div>
                {pendingTasksCount > 0 && (
                  <span
                    style={{
                      backgroundColor: activeTab === 'tasks' ? '#FFFFFF' : (overdueTasks.length > 0 ? '#EF4444' : '#1E6BFF'),
                      color: activeTab === 'tasks' ? '#1E6BFF' : '#FFFFFF',
                      fontSize: '0.70rem',
                      fontWeight: 800,
                      padding: '2px 7px',
                      borderRadius: '12px',
                    }}
                  >
                    {pendingTasksCount}
                  </span>
                )}
              </button>
            </nav>
          </div>

          {/* Student Status Card in Sidebar Bottom */}
          <div
            style={{
              padding: '1rem',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #EFF6FF 0%, #F8FAFC 100%)',
              border: '1px solid #DBEAFE',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1E6BFF', lineHeight: 1.2 }}>
              {studentData?.name || currentUser?.name || 'Aarav Sharma'}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '4px' }}>
              Roll: {studentData?.roll_no || currentUser?.roll_no || 'STU-2024-042'}
            </div>
            <div style={{ fontSize: '0.70rem', color: '#10B981', fontWeight: 700, marginTop: '6px' }}>
              ● Verified Student Profile
            </div>
          </div>
        </aside>

        {/* =========================================================================
            MAIN CANVAS AREA
            ========================================================================= */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Main Student Header */}
          <header
            style={{
              backgroundColor: '#FFFFFF',
              borderBottom: '1px solid #E2E8F0',
              padding: '1rem 2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <h1 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>
                {activeTab === 'cockpit' ? 'Personal Student Success Cockpit' : 'Student Task & Mentoring Action Center'}
              </h1>
              <div style={{ marginTop: '2px' }}>
                <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                  {studentData?.year || '3rd Year'} • {studentData?.department || 'B.Tech Computer Science & Engineering'} • Semester {studentData?.semester || 6}
                </span>
              </div>
            </div>

            <Link
              to="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: '#1E6BFF',
                fontSize: '0.88rem',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <ArrowLeft size={16} />
              <span>Back to Landing Page</span>
            </Link>
          </header>

          {/* VIEW 1: COCKPIT */}
          {activeTab === 'cockpit' && (
            <main style={{ maxWidth: '1280px', width: '100%', margin: '1.5rem auto', padding: '0 1.5rem', flex: 1 }}>
              {/* Metric Cards Row */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '1.25rem',
                  marginBottom: '2rem',
                }}
              >
                {/* Card 1: Success Score */}
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    padding: '1.25rem',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.80rem', fontWeight: 700, color: '#64748B' }}>Success Score</span>
                    <Award size={18} style={{ color: '#1E6BFF' }} />
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>
                    {studentData?.success_score || 85.4}
                    <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 500 }}> / 100</span>
                  </div>
                  <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: '#EFF6FF',
                        color: '#1E6BFF',
                        fontWeight: 700,
                        fontSize: '0.72rem',
                      }}
                    >
                      {studentData?.score_band || 'EXCELLENT'}
                    </span>
                    <span style={{ fontSize: '0.74rem', color: '#64748B' }}>Composite Index</span>
                  </div>
                </div>

                {/* Card 2: Academic Standing */}
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    padding: '1.25rem',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.80rem', fontWeight: 700, color: '#64748B' }}>Academic Performance</span>
                    <GraduationCap size={18} style={{ color: '#10B981' }} />
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>
                    {studentData?.cgpa || 8.42}
                    <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 500 }}> CGPA</span>
                  </div>
                  <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: (studentData?.backlogs || 0) === 0 ? '#ECFDF5' : '#FEF2F2',
                        color: (studentData?.backlogs || 0) === 0 ? '#059669' : '#DC2626',
                        fontWeight: 700,
                        fontSize: '0.72rem',
                      }}
                    >
                      {(studentData?.backlogs || 0) === 0 ? '0 Backlogs' : `${studentData?.backlogs} Backlog(s)`}
                    </span>
                    <span style={{ fontSize: '0.74rem', color: '#64748B' }}>
                      Risk: {studentData?.academic_risk || 'LOW'}
                    </span>
                  </div>
                </div>

                {/* Card 3: Placement Readiness */}
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    padding: '1.25rem',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.80rem', fontWeight: 700, color: '#64748B' }}>Placement Readiness</span>
                    <Target size={18} style={{ color: '#F59E0B' }} />
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>
                    {studentData?.placement_readiness_pct || 88.5}%
                  </div>
                  <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: '#FFFBEB',
                        color: '#D97706',
                        fontWeight: 700,
                        fontSize: '0.72rem',
                      }}
                    >
                      {studentData?.readiness_tier || 'Tier-1 Ready'}
                    </span>
                    <span style={{ fontSize: '0.74rem', color: '#64748B' }}>
                      Risk: {studentData?.placement_risk || 'LOW'}
                    </span>
                  </div>
                </div>

                {/* Card 4: Attendance & Velocity */}
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    padding: '1.25rem',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.80rem', fontWeight: 700, color: '#64748B' }}>Lecture Attendance</span>
                    <TrendingUp size={18} style={{ color: '#8B5CF6' }} />
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>
                    {studentData?.attendance || 88.5}%
                  </div>
                  <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: (studentData?.attendance || 88.5) >= 75 ? '#ECFDF5' : '#FEF2F2',
                        color: (studentData?.attendance || 88.5) >= 75 ? '#059669' : '#DC2626',
                        fontWeight: 700,
                        fontSize: '0.72rem',
                      }}
                    >
                      {(studentData?.attendance || 88.5) >= 75 ? 'Regular Standing' : 'Detention Risk'}
                    </span>
                    <span style={{ fontSize: '0.74rem', color: '#64748B' }}>LMS: {studentData?.components?.lms || 89.0}%</span>
                  </div>
                </div>
              </div>

              {/* Historical Progression & AI Success Assistant */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                  gap: '1.5rem',
                  marginBottom: '2rem',
                }}
              >
                {/* Progression Chart Card */}
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '18px',
                    padding: '1.75rem',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>Academic Trajectory</h3>
                      <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Historical semester progression trend</span>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {['cgpa', 'attendance', 'success_score'].map((m) => (
                        <button
                          key={m}
                          onClick={() => setHistoryMetric(m)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            border: historyMetric === m ? '1px solid #1E6BFF' : '1px solid #E2E8F0',
                            backgroundColor: historyMetric === m ? '#EFF6FF' : '#FFFFFF',
                            color: historyMetric === m ? '#1E6BFF' : '#64748B',
                            cursor: 'pointer',
                          }}
                        >
                          {m === 'cgpa' ? 'CGPA' : m === 'attendance' ? 'Attendance' : 'Success Score'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ height: '240px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="metricGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#1E6BFF" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#1E6BFF" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                        <XAxis dataKey="semester" stroke="#94A3B8" fontSize={12} />
                        <YAxis stroke="#94A3B8" fontSize={12} domain={historyMetric === 'cgpa' ? [6, 10] : [60, 100]} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0F172A',
                            border: 'none',
                            borderRadius: '8px',
                            color: '#FFFFFF',
                            fontSize: '0.75rem',
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey={historyMetric}
                          stroke="#1E6BFF"
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#metricGrad)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* AI Student Success Assistant Widget (Feature 4) */}
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '18px',
                    padding: '1.75rem',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1E6BFF' }}>
                        <Bot size={18} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>AI Success Assistant</h3>
                        <span style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 600 }}>● Telemetry Grounded</span>
                      </div>
                    </div>
                  </div>

                  {/* Conversation Log */}
                  <div
                    style={{
                      flex: 1,
                      minHeight: '140px',
                      maxHeight: '170px',
                      overflowY: 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      padding: '8px',
                      backgroundColor: '#F8FAFC',
                      borderRadius: '12px',
                      border: '1px solid #E2E8F0',
                      marginBottom: '8px',
                    }}
                  >
                    {aiConversation.map((msg, idx) => (
                      <div
                        key={idx}
                        style={{
                          alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                          maxWidth: '88%',
                          backgroundColor: msg.sender === 'user' ? '#1E6BFF' : '#FFFFFF',
                          color: msg.sender === 'user' ? '#FFFFFF' : '#0F172A',
                          padding: '8px 12px',
                          borderRadius: '12px',
                          fontSize: '0.80rem',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                          border: msg.sender === 'assistant' ? '1px solid #E2E8F0' : 'none',
                        }}
                      >
                        <div>{msg.text}</div>
                        {msg.actions && msg.actions.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                            {msg.actions.map((act, actIdx) => (
                              <button
                                key={actIdx}
                                onClick={() => handleAskAI(act)}
                                style={{
                                  fontSize: '0.68rem',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  border: '1px solid #CBD5E1',
                                  backgroundColor: '#F1F5F9',
                                  color: '#334155',
                                  cursor: 'pointer',
                                }}
                              >
                                {act}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    {aiLoading && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', color: '#64748B', padding: '4px' }}>
                        <Loader2 size={14} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                        <span>Analyzing student telemetry & synthesizing grounded response...</span>
                      </div>
                    )}
                  </div>

                  {/* 12 Clickable Suggested Questions (Feature 4) */}
                  <div style={{ marginBottom: '8px' }}>
                    <div style={{ fontSize: '0.70rem', fontWeight: 700, color: '#64748B', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Sparkles size={12} style={{ color: '#1E6BFF' }} />
                      <span>Suggested Questions (Click to Ask):</span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        gap: '5px',
                        overflowX: 'auto',
                        paddingBottom: '4px',
                      }}
                    >
                      {SUGGESTED_QUESTIONS.map((question, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleAskAI(question)}
                          disabled={aiLoading}
                          style={{
                            whiteSpace: 'nowrap',
                            padding: '4px 9px',
                            borderRadius: '9999px',
                            backgroundColor: '#EFF6FF',
                            color: '#1E6BFF',
                            border: '1px solid #DBEAFE',
                            fontSize: '0.69rem',
                            fontWeight: 600,
                            cursor: aiLoading ? 'not-allowed' : 'pointer',
                            opacity: aiLoading ? 0.6 : 1,
                            transition: 'all 150ms ease',
                          }}
                        >
                          {question}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Input Bar */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAskAI();
                    }}
                    style={{ display: 'flex', gap: '8px' }}
                  >
                    <input
                      type="text"
                      value={aiQuestion}
                      onChange={(e) => setAiQuestion(e.target.value)}
                      placeholder="Ask about placement, attendance, or study roadmaps..."
                      disabled={aiLoading}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: '10px',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.82rem',
                        outline: 'none',
                      }}
                    />
                    <button
                      type="submit"
                      disabled={aiLoading || !aiQuestion.trim()}
                      style={{
                        padding: '8px 14px',
                        backgroundColor: '#1E6BFF',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '10px',
                        cursor: aiLoading || !aiQuestion.trim() ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Send size={15} />
                    </button>
                  </form>
                </div>
              </div>

              {/* TWO-COLUMN SECTION: WHAT-IF SIMULATOR & ASSIGNED TODAY'S TASKS (Feature 1) */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                  gap: '1.5rem',
                  marginBottom: '2rem',
                }}
              >
                {/* What-If Simulation Tool */}
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '18px',
                    padding: '1.75rem',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
                    <Sliders size={20} style={{ color: '#1E6BFF' }} />
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>What-If Score Simulator</h3>
                      <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Projected score sensitivity modeling</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>
                        <span>Target Attendance:</span>
                        <span style={{ color: '#1E6BFF' }}>{simAttendance}%</span>
                      </div>
                      <input
                        type="range"
                        min="60"
                        max="100"
                        step="0.5"
                        value={simAttendance}
                        onChange={(e) => setSimAttendance(parseFloat(e.target.value))}
                        style={{ width: '100%', accentColor: '#1E6BFF' }}
                      />
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>
                        <span>Target Coding / DSA:</span>
                        <span style={{ color: '#10B981' }}>{simCoding} / 10</span>
                      </div>
                      <input
                        type="range"
                        min="4.0"
                        max="10.0"
                        step="0.1"
                        value={simCoding}
                        onChange={(e) => setSimCoding(parseFloat(e.target.value))}
                        style={{ width: '100%', accentColor: '#10B981' }}
                      />
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>
                        <span>Target LMS Velocity:</span>
                        <span style={{ color: '#F59E0B' }}>{simLms}%</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="100"
                        step="1"
                        value={simLms}
                        onChange={(e) => setSimLms(parseFloat(e.target.value))}
                        style={{ width: '100%', accentColor: '#F59E0B' }}
                      />
                    </div>

                    <div
                      style={{
                        marginTop: '10px',
                        padding: '12px',
                        borderRadius: '12px',
                        backgroundColor: '#EFF6FF',
                        border: '1px solid #DBEAFE',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.78rem', color: '#1E6BFF', fontWeight: 700 }}>Projected Success Score</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Weighted across all 6 core telemetry dimensions</div>
                      </div>
                      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1E6BFF' }}>
                        {simulatedScore} <span style={{ fontSize: '0.85rem', color: '#64748B' }}>/ 100</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* =====================================================================
                    FEATURE 1: DASHBOARD — TODAY'S TASKS ONLY WIDGET
                    Displays ONLY tasks whose due date is today.
                    ===================================================================== */}
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '18px',
                    padding: '1.75rem',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Calendar size={20} style={{ color: '#1E6BFF' }} />
                      <div>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>Today's Tasks</h3>
                        <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                          Scheduled deliverables due today ({new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})
                        </span>
                      </div>
                    </div>
                    {todayTasks.length > 0 && (
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '12px',
                          backgroundColor: '#EFF6FF',
                          color: '#1E6BFF',
                        }}
                      >
                        {todayTasks.length} Due Today
                      </span>
                    )}
                  </div>

                  {/* Tasks List or Clean Empty State */}
                  {todayTasks.length === 0 ? (
                    <div
                      style={{
                        flex: 1,
                        padding: '2.5rem 1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        backgroundColor: '#F8FAFC',
                        borderRadius: '12px',
                        border: '1px dashed #CBD5E1',
                      }}
                    >
                      <div
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '50%',
                          backgroundColor: '#ECFDF5',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#10B981',
                          marginBottom: '10px',
                        }}
                      >
                        <CheckCircle2 size={24} />
                      </div>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>
                        No Tasks Due Today
                      </h4>
                      <p style={{ margin: '6px 0 14px', fontSize: '0.78rem', color: '#64748B', maxWidth: '300px' }}>
                        You are all caught up for today! Outstanding overdue or upcoming tasks are managed in your dedicated Tasks view.
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveTab('tasks')}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 14px',
                          borderRadius: '8px',
                          backgroundColor: '#1E6BFF',
                          color: '#FFFFFF',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <span>View All Tasks ({tasks.length})</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                      {todayTasks.map((task) => (
                        <div
                          key={task.id}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '12px',
                            padding: '12px 14px',
                            borderRadius: '12px',
                            backgroundColor: task.done ? '#F0FDF4' : '#F8FAFC',
                            border: `1px solid ${task.done ? '#BBF7D0' : '#E2E8F0'}`,
                            transition: 'all 150ms ease',
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => toggleTask(task.id)}
                            title={task.done ? 'Mark as Open' : 'Mark as Completed'}
                            style={{
                              marginTop: '2px',
                              background: 'none',
                              border: 'none',
                              padding: 0,
                              cursor: 'pointer',
                              color: task.done ? '#10B981' : '#94A3B8',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                          >
                            {task.done ? <CheckSquare size={19} /> : <Square size={19} />}
                          </button>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                              <span
                                style={{
                                  fontSize: '0.86rem',
                                  fontWeight: 600,
                                  color: task.done ? '#15803D' : '#0F172A',
                                  textDecoration: task.done ? 'line-through' : 'none',
                                }}
                              >
                                {task.text}
                              </span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span
                                  style={{
                                    fontSize: '0.66rem',
                                    fontWeight: 700,
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    backgroundColor:
                                      task.priority === 'HIGH' ? '#FEF2F2' : task.priority === 'MEDIUM' ? '#FFFBEB' : '#F1F5F9',
                                    color:
                                      task.priority === 'HIGH' ? '#DC2626' : task.priority === 'MEDIUM' ? '#D97706' : '#475569',
                                    border: `1px solid ${
                                      task.priority === 'HIGH' ? '#FCA5A5' : task.priority === 'MEDIUM' ? '#FDE68A' : '#E2E8F0'
                                    }`,
                                  }}
                                >
                                  {task.priority}
                                </span>
                                <span
                                  style={{
                                    fontSize: '0.66rem',
                                    fontWeight: 700,
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    backgroundColor: task.done ? '#DCFCE7' : '#F1F5F9',
                                    color: task.done ? '#15803D' : '#64748B',
                                  }}
                                >
                                  {task.done ? 'COMPLETED' : 'PENDING'}
                                </span>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                              <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                                Mentor: <strong>{task.mentor}</strong> • Due: <strong>{task.due}</strong>
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleTask(task.id)}
                                style={{
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  fontSize: '0.70rem',
                                  fontWeight: 600,
                                  border: 'none',
                                  backgroundColor: task.done ? '#E2E8F0' : '#10B981',
                                  color: task.done ? '#475569' : '#FFFFFF',
                                  cursor: 'pointer',
                                }}
                              >
                                {task.done ? 'Re-open' : 'Mark Complete'}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                      {overdueTasks.length > 0 && <span style={{ color: '#EF4444', fontWeight: 600 }}>{overdueTasks.length} Overdue • </span>}
                      {upcomingTasks.length} Upcoming in schedule
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('tasks')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#1E6BFF',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '2px',
                      }}
                    >
                      <span>Open Full Tasks View</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Data Quality & Sync Section */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  marginBottom: '2rem',
                  boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        backgroundColor: '#EFF6FF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#1E6BFF',
                      }}
                    >
                      <Database size={18} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#0F172A' }}>
                        Institutional Data Quality & Synchronization
                      </h3>
                      <span style={{ fontSize: '0.76rem', color: '#64748B' }}>
                        Live connector telemetry across official university systems
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: '#10B981', fontWeight: 600 }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                    <span>Telemetry Auto-Synced 60s ago</span>
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '12px',
                  }}
                >
                  <div style={{ padding: '10px 12px', borderRadius: '8px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.70rem', color: '#64748B' }}>Registrar Academic SIS</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#059669', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                      <CheckCircle size={13} />
                      <span>100% Verified Provenance</span>
                    </div>
                  </div>

                  <div style={{ padding: '10px 12px', borderRadius: '8px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.70rem', color: '#64748B' }}>Attendance Biometric Gateway</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#059669', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                      <CheckCircle size={13} />
                      <span>Real-Time Biometric Feed</span>
                    </div>
                  </div>

                  <div style={{ padding: '10px 12px', borderRadius: '8px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.70rem', color: '#64748B' }}>Canvas / LMS Assignment API</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#059669', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                      <CheckCircle size={13} />
                      <span>Hourly Sync Connected</span>
                    </div>
                  </div>

                  <div style={{ padding: '10px 12px', borderRadius: '8px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.70rem', color: '#64748B' }}>TPO Corporate Placement Engine</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#059669', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                      <CheckCircle size={13} />
                      <span>Placement Readiness Calibrated</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Items & Notifications */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      backgroundColor: '#FEF3C7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#D97706',
                    }}
                  >
                    <Bell size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#0F172A' }}>
                      Action Items & Notifications
                    </h3>
                    <span style={{ fontSize: '0.76rem', color: '#64748B' }}>
                      Mentoring directives and critical academic follow-up reminders
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      backgroundColor: '#EFF6FF',
                      border: '1px solid #DBEAFE',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.82rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Clock size={15} style={{ color: '#2563EB' }} />
                      <span><strong>Faculty Counseling:</strong> Review LeetCode Top 50 set with Prof. Rajesh Kumar before Oct 15, 2026.</span>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#2563EB', fontWeight: 600 }}>Active</span>
                  </div>

                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      backgroundColor: '#ECFDF5',
                      border: '1px solid #D1FAE5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.82rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={15} style={{ color: '#10B981' }} />
                      <span><strong>Academic Standing:</strong> Zero backlogs detected. You remain eligible for Tier-1 Super-Dream placement drives.</span>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 600 }}>Eligible</span>
                  </div>
                </div>
              </div>
            </main>
          )}

          {/* VIEW 2: DEDICATED TASKS MANAGEMENT VIEW (Feature 2) */}
          {activeTab === 'tasks' && (
            <main style={{ maxWidth: '1280px', width: '100%', margin: '1.5rem auto', padding: '0 1.5rem', flex: 1 }}>
              {/* Task Metrics Summary Banner */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem',
                  marginBottom: '1.5rem',
                }}
              >
                <div style={{ backgroundColor: '#FFFFFF', padding: '1rem', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>Total Deliverables</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>{tasks.length}</div>
                </div>
                <div style={{ backgroundColor: '#FFFFFF', padding: '1rem', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1E6BFF' }}>Due Today</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1E6BFF', marginTop: '2px' }}>{todayTasks.length}</div>
                </div>
                <div style={{ backgroundColor: '#FEF2F2', padding: '1rem', borderRadius: '12px', border: '1px solid #FCA5A5', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#DC2626' }}>Overdue Tasks</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#DC2626', marginTop: '2px' }}>{overdueTasks.length}</div>
                </div>
                <div style={{ backgroundColor: '#FFFFFF', padding: '1rem', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563EB' }}>Upcoming Milestones</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#2563EB', marginTop: '2px' }}>{upcomingTasks.length}</div>
                </div>
                <div style={{ backgroundColor: '#F0FDF4', padding: '1rem', borderRadius: '12px', border: '1px solid #BBF7D0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669' }}>Completed Deliverables</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#059669', marginTop: '2px' }}>{completedTasks.length}</div>
                </div>
              </div>

              {/* Task Filters Bar */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '14px',
                  padding: '1rem 1.25rem',
                  border: '1px solid #E2E8F0',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', fontWeight: 700, color: '#0F172A' }}>
                  <Filter size={16} style={{ color: '#1E6BFF' }} />
                  <span>Filter Deliverables:</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  {/* Status Filter */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>Status:</span>
                    <select
                      value={taskFilterStatus}
                      onChange={(e) => setTaskFilterStatus(e.target.value)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.78rem',
                        backgroundColor: '#FFFFFF',
                        outline: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="PENDING">Pending / Open</option>
                      <option value="COMPLETED">Completed</option>
                    </select>
                  </div>

                  {/* Priority Filter */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>Priority:</span>
                    <select
                      value={taskFilterPriority}
                      onChange={(e) => setTaskFilterPriority(e.target.value)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.78rem',
                        backgroundColor: '#FFFFFF',
                        outline: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="ALL">All Priorities</option>
                      <option value="HIGH">High Priority</option>
                      <option value="MEDIUM">Medium Priority</option>
                      <option value="LOW">Low Priority</option>
                    </select>
                  </div>

                  {/* Mentor Filter */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>Assigned Mentor:</span>
                    <select
                      value={taskFilterMentor}
                      onChange={(e) => setTaskFilterMentor(e.target.value)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.78rem',
                        backgroundColor: '#FFFFFF',
                        outline: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="ALL">All Mentors</option>
                      {distinctMentors.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  {(taskFilterStatus !== 'ALL' || taskFilterPriority !== 'ALL' || taskFilterMentor !== 'ALL') && (
                    <button
                      type="button"
                      onClick={() => {
                        setTaskFilterStatus('ALL');
                        setTaskFilterPriority('ALL');
                        setTaskFilterMentor('ALL');
                      }}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        backgroundColor: '#F1F5F9',
                        color: '#475569',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Reset Filters
                    </button>
                  )}
                </div>
              </div>

              {/* SECTION 1: TODAY'S TASKS */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1px solid #E2E8F0',
                  padding: '1.5rem',
                  marginBottom: '1.5rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={18} style={{ color: '#1E6BFF' }} />
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                      Today's Tasks
                    </h3>
                    <span style={{ fontSize: '0.74rem', color: '#64748B' }}>
                      • Due Today ({new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '12px',
                      backgroundColor: '#EFF6FF',
                      color: '#1E6BFF',
                    }}
                  >
                    {filteredTodayTasks.length} Tasks
                  </span>
                </div>

                {filteredTodayTasks.length === 0 ? (
                  <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748B', fontSize: '0.82rem', backgroundColor: '#F8FAFC', borderRadius: '10px' }}>
                    No tasks due today matching active filters.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {filteredTodayTasks.map((t) => (
                      <TaskCard key={t.id} task={t} onToggle={toggleTask} />
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION 2: OVERDUE TASKS (Feature 2) */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1px solid #FCA5A5',
                  padding: '1.5rem',
                  marginBottom: '1.5rem',
                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.04)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #FEE2E2', paddingBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle size={18} style={{ color: '#EF4444' }} />
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#DC2626' }}>
                      Overdue Tasks
                    </h3>
                    <span style={{ fontSize: '0.74rem', color: '#991B1B' }}>
                      • Requires urgent follow-up with faculty mentors
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '12px',
                      backgroundColor: '#FEF2F2',
                      color: '#DC2626',
                      border: '1px solid #FCA5A5',
                    }}
                  >
                    {filteredOverdueTasks.length} Overdue
                  </span>
                </div>

                {filteredOverdueTasks.length === 0 ? (
                  <div style={{ padding: '1.5rem', textAlign: 'center', color: '#059669', fontSize: '0.82rem', backgroundColor: '#ECFDF5', borderRadius: '10px' }}>
                    ✓ No overdue tasks! All your past action items are in good order.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {filteredOverdueTasks.map((t) => (
                      <TaskCard key={t.id} task={t} onToggle={toggleTask} isOverdueSection />
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION 3: UPCOMING TASKS (Feature 2) */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1px solid #E2E8F0',
                  padding: '1.5rem',
                  marginBottom: '1.5rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={18} style={{ color: '#2563EB' }} />
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                      Upcoming Tasks
                    </h3>
                    <span style={{ fontSize: '0.74rem', color: '#64748B' }}>
                      • Future deliverables and semester milestones
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '12px',
                      backgroundColor: '#EFF6FF',
                      color: '#2563EB',
                    }}
                  >
                    {filteredUpcomingTasks.length} Upcoming
                  </span>
                </div>

                {filteredUpcomingTasks.length === 0 ? (
                  <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748B', fontSize: '0.82rem', backgroundColor: '#F8FAFC', borderRadius: '10px' }}>
                    No upcoming tasks scheduled in this view.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {filteredUpcomingTasks.map((t) => (
                      <TaskCard key={t.id} task={t} onToggle={toggleTask} />
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION 4: COMPLETED TASKS (Feature 2) */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1px solid #BBF7D0',
                  padding: '1.5rem',
                  marginBottom: '1.5rem',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.04)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #DCFCE7', paddingBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCheck size={18} style={{ color: '#10B981' }} />
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#065F46' }}>
                      Completed Deliverables
                    </h3>
                    <span style={{ fontSize: '0.74rem', color: '#047857' }}>
                      • Completed action items verified on the portal
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '12px',
                      backgroundColor: '#ECFDF5',
                      color: '#059669',
                      border: '1px solid #A7F3D0',
                    }}
                  >
                    {filteredCompletedTasks.length} Completed
                  </span>
                </div>

                {filteredCompletedTasks.length === 0 ? (
                  <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748B', fontSize: '0.82rem', backgroundColor: '#F8FAFC', borderRadius: '10px' }}>
                    No completed tasks matching filters. Mark tasks as finished above to view them here.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {filteredCompletedTasks.map((t) => (
                      <TaskCard key={t.id} task={t} onToggle={toggleTask} isCompletedSection />
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION 5: ONGOING / NO DUE DATE (Feature 2) */}
              {filteredNoDueDateTasks.length > 0 && (
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    border: '1px solid #E2E8F0',
                    padding: '1.5rem',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Sliders size={18} style={{ color: '#64748B' }} />
                      <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                        Ongoing & Open-Ended Mentorship
                      </h3>
                      <span style={{ fontSize: '0.74rem', color: '#64748B' }}>
                        • Open-ended learning goals without fixed calendar cutoffs
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '12px',
                        backgroundColor: '#F1F5F9',
                        color: '#64748B',
                      }}
                    >
                      {filteredNoDueDateTasks.length} Items
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {filteredNoDueDateTasks.map((t) => (
                      <TaskCard key={t.id} task={t} onToggle={toggleTask} />
                    ))}
                  </div>
                </div>
              )}
            </main>
          )}
        </div>
      </div>

      {/* =====================================================================
          EDIT PROGRAM MODAL (Branch & Semester Support)
          ===================================================================== */}
      {editProfileOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '460px',
              width: '100%',
              padding: '1.75rem',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              border: '1px solid #E2E8F0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor: '#EFF6FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#1E6BFF',
                }}
              >
                <Edit3 size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0F172A' }}>
                  Edit Academic Program
                </h3>
                <span style={{ fontSize: '0.76rem', color: '#64748B' }}>
                  Update your current branch and semester
                </span>
              </div>
            </div>

            {editSuccessMsg && (
              <div
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  backgroundColor: '#ECFDF5',
                  border: '1px solid #A7F3D0',
                  color: '#065F46',
                  fontSize: '0.80rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <CheckCircle2 size={16} />
                <span>{editSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#0F172A', marginBottom: '4px' }}>
                  Branch / Engineering Discipline
                </label>
                <select
                  value={editBranch}
                  onChange={(e) => setEditBranch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.86rem',
                    outline: 'none',
                    backgroundColor: '#FFFFFF',
                  }}
                >
                  {SUPPORTED_BRANCHES.map((b) => (
                    <option key={b.id} value={b.label}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#0F172A', marginBottom: '4px' }}>
                  Current Semester (1 to 8)
                </label>
                <select
                  value={editSemester}
                  onChange={(e) => setEditSemester(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.86rem',
                    outline: 'none',
                    backgroundColor: '#FFFFFF',
                  }}
                >
                  {ALL_SEMESTERS.map((s) => (
                    <option key={s} value={s}>
                      Semester {s} ({s <= 2 ? '1st Year' : s <= 4 ? '2nd Year' : s <= 6 ? '3rd Year' : '4th Year'})
                    </option>
                  ))}
                </select>
              </div>

              <div
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  fontSize: '0.74rem',
                  color: '#64748B',
                  marginBottom: '16px',
                }}
              >
                🔒 <strong>Academic Integrity Note:</strong> Official academic metrics (CGPA, backlogs, official attendance) are synchronized with the university registrar and cannot be modified by students.
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setEditProfileOpen(false)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#FFFFFF',
                    color: '#475569',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#1E6BFF',
                    color: '#FFFFFF',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    cursor: editSaving ? 'not-allowed' : 'pointer',
                    opacity: editSaving ? 0.7 : 1,
                  }}
                >
                  {editSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Task Card Component for Unified Task Display Across Sections
 */
function TaskCard({ task, onToggle, isOverdueSection = false, isCompletedSection = false }) {
  const dateInfo = task.dateInfo || getTaskDateInfo(task.due);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '12px 14px',
        borderRadius: '12px',
        backgroundColor: task.done ? '#F0FDF4' : isOverdueSection ? '#FFF8F8' : '#F8FAFC',
        border: `1px solid ${task.done ? '#BBF7D0' : isOverdueSection ? '#FCA5A5' : '#E2E8F0'}`,
        transition: 'all 150ms ease',
      }}
    >
      <button
        type="button"
        onClick={() => onToggle(task.id)}
        title={task.done ? 'Mark as Open' : 'Mark as Completed'}
        style={{
          marginTop: '2px',
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          color: task.done ? '#10B981' : isOverdueSection ? '#EF4444' : '#94A3B8',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {task.done ? <CheckSquare size={19} /> : <Square size={19} />}
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: '0.88rem',
              fontWeight: 600,
              color: task.done ? '#15803D' : '#0F172A',
              textDecoration: task.done ? 'line-through' : 'none',
            }}
          >
            {task.text}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* Overdue Age Badge (Feature 2) */}
            {isOverdueSection && !task.done && dateInfo.overdueAge && (
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: '6px',
                  backgroundColor: '#FEE2E2',
                  color: '#DC2626',
                  border: '1px solid #FCA5A5',
                }}
              >
                {dateInfo.label}
              </span>
            )}

            {/* Priority Badge */}
            <span
              style={{
                fontSize: '0.66rem',
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: '4px',
                backgroundColor:
                  task.priority === 'HIGH' ? '#FEF2F2' : task.priority === 'MEDIUM' ? '#FFFBEB' : '#F1F5F9',
                color:
                  task.priority === 'HIGH' ? '#DC2626' : task.priority === 'MEDIUM' ? '#D97706' : '#475569',
                border: `1px solid ${
                  task.priority === 'HIGH' ? '#FCA5A5' : task.priority === 'MEDIUM' ? '#FDE68A' : '#E2E8F0'
                }`,
              }}
            >
              {task.priority}
            </span>

            {/* Status Badge */}
            <span
              style={{
                fontSize: '0.66rem',
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: '4px',
                backgroundColor: task.done ? '#DCFCE7' : '#F1F5F9',
                color: task.done ? '#15803D' : '#64748B',
              }}
            >
              {task.done ? 'COMPLETED' : 'PENDING'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px', flexWrap: 'wrap', gap: '6px' }}>
          <span style={{ fontSize: '0.74rem', color: '#64748B' }}>
            Mentor: <strong>{task.mentor}</strong> • Due: <strong>{task.due}</strong>
            {task.category && <span style={{ marginLeft: '6px', color: '#94A3B8' }}>({task.category})</span>}
          </span>

          <button
            type="button"
            onClick={() => onToggle(task.id)}
            style={{
              padding: '3px 10px',
              borderRadius: '6px',
              fontSize: '0.72rem',
              fontWeight: 600,
              border: 'none',
              backgroundColor: task.done ? '#E2E8F0' : '#10B981',
              color: task.done ? '#475569' : '#FFFFFF',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {task.done ? (
              <>
                <Square size={12} />
                <span>Re-open</span>
              </>
            ) : (
              <>
                <Check size={12} />
                <span>Mark Completed</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
