/**
 * CODEBUFFET — Frontend API Client & Backend Integration Service
 * Connects React UI to FastAPI backend with JWT bearer auth,
 * error normalization, and offline resiliency.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

function getAuthHeader() {
  const token = sessionStorage.getItem('codebuffet_access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  try {
    const response = await fetch(url, { ...options, headers });
    
    if (response.status === 401) {
      sessionStorage.removeItem('codebuffet_access_token');
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data?.detail || `API error (${response.status}): ${response.statusText}`;
      throw new Error(errorMsg);
    }

    return data;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error(`Unable to reach CODEBUFFET API at ${API_BASE}. Ensure backend is running.`);
    }
    throw error;
  }
}

export const api = {
  // System Health
  checkHealth: () => request('/api/health'),

  // Authentication
  register: async (registrationData) => {
    return request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(registrationData),
    });
  },

  login: async (identifier, password, role) => {
    const data = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password, role }),
    });
    if (data?.access_token) {
      sessionStorage.setItem('codebuffet_access_token', data.access_token);
    }
    return data;
  },

  logout: async () => {
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors on logout
    } finally {
      sessionStorage.removeItem('codebuffet_access_token');
      sessionStorage.removeItem('codebuffet_user');
    }
  },

  getMe: () => request('/api/auth/me'),

  updateStudentProfile: async (profileData) => {
    return request('/api/student/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  // Institution Endpoints
  getInstitutionSummary: () => request('/api/institution/summary'),
  getCohortAnalytics: () => request('/api/institution/analytics/cohort'),
  getInstitutionDepartments: () => request('/api/institution/departments'),
  getInstitutionTrends: (range) => request(`/api/institution/trends?range_filter=${encodeURIComponent(range || 'Last 6 Months')}`),
  
  getInstitutionStudents: (options = {}) => {
    let paramsObj = {};
    if (typeof options === 'string') {
      paramsObj = { search: options };
    } else {
      paramsObj = options || {};
    }

    const params = new URLSearchParams();
    if (paramsObj.search) params.append('search', paramsObj.search);
    if (paramsObj.riskBand) params.append('risk_band', paramsObj.riskBand);
    if (paramsObj.academicRisk) params.append('academic_risk', paramsObj.academicRisk);
    if (paramsObj.placementRisk) params.append('placement_risk', paramsObj.placementRisk);
    if (paramsObj.department) params.append('department', paramsObj.department);
    if (paramsObj.mentor) params.append('mentor', paramsObj.mentor);
    if (paramsObj.recordType) params.append('record_type', paramsObj.recordType);
    if (paramsObj.semester) params.append('semester', paramsObj.semester);
    if (paramsObj.year) params.append('year', paramsObj.year);
    if (paramsObj.attendanceRange) params.append('attendance_range', paramsObj.attendanceRange);
    if (paramsObj.minCgpa !== undefined && paramsObj.minCgpa !== '') params.append('min_cgpa', paramsObj.minCgpa);
    if (paramsObj.maxCgpa !== undefined && paramsObj.maxCgpa !== '') params.append('max_cgpa', paramsObj.maxCgpa);
    if (paramsObj.sortBy) params.append('sort_by', paramsObj.sortBy);
    if (paramsObj.sortOrder) params.append('sort_order', paramsObj.sortOrder);
    if (paramsObj.page) params.append('page', paramsObj.page);
    if (paramsObj.pageSize || paramsObj.page_size) params.append('page_size', paramsObj.pageSize || paramsObj.page_size);
    if (paramsObj.limit) params.append('limit', paramsObj.limit);

    const qs = params.toString() ? `?${params.toString()}` : '';
    return request(`/api/institution/students${qs}`);
  },

  getDigitalTwinTelemetry: async (options = {}) => {
    let paramsObj = typeof options === 'string' ? { search: options } : (options || {});
    const params = new URLSearchParams();
    if (paramsObj.search) params.append('search', paramsObj.search);
    if (paramsObj.riskBand && paramsObj.riskBand !== 'ALL') params.append('risk_band', paramsObj.riskBand);
    if (paramsObj.academicRisk && paramsObj.academicRisk !== 'ALL') params.append('academic_risk', paramsObj.academicRisk);
    if (paramsObj.placementRisk && paramsObj.placementRisk !== 'ALL') params.append('placement_risk', paramsObj.placementRisk);
    if (paramsObj.department && paramsObj.department !== 'ALL') params.append('department', paramsObj.department);
    if (paramsObj.mentor && paramsObj.mentor !== 'ALL') params.append('mentor', paramsObj.mentor);
    if (paramsObj.recordType && paramsObj.recordType !== 'all') params.append('record_type', paramsObj.recordType);
    if (paramsObj.page) params.append('page', paramsObj.page);
    if (paramsObj.pageSize || paramsObj.page_size) params.append('page_size', paramsObj.pageSize || paramsObj.page_size);
    if (paramsObj.all !== undefined) params.append('all', paramsObj.all);
    else params.append('all', 'true');

    const qs = params.toString() ? `?${params.toString()}` : '';
    return request(`/api/institution/students/telemetry${qs}`);
  },

  getMentors: () => request('/api/institution/mentors'),
  getMentorSummary: (mentor) => {
    const qs = mentor ? `?mentor=${encodeURIComponent(mentor)}` : '';
    return request(`/api/institution/mentor/summary${qs}`);
  },

  simulateCohort: (simulationParams) =>
    request('/api/institution/simulate-cohort', {
      method: 'POST',
      body: JSON.stringify(simulationParams),
    }),

  getModelStatus: () => request('/api/institution/model-status'),

  getExportStudentsUrl: (options = {}) => {
    const params = new URLSearchParams();
    if (options.search) params.append('search', options.search);
    if (options.riskBand) params.append('risk_band', options.riskBand);
    if (options.academicRisk) params.append('academic_risk', options.academicRisk);
    if (options.placementRisk) params.append('placement_risk', options.placementRisk);
    if (options.department) params.append('department', options.department);
    if (options.mentor) params.append('mentor', options.mentor);
    if (options.recordType) params.append('record_type', options.recordType);
    const token = sessionStorage.getItem('codebuffet_access_token');
    if (token) params.append('token', token);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return `${API_BASE}/api/institution/students/export${qs}`;
  },

  downloadStudentsExportCSV: async (options = {}) => {
    const params = new URLSearchParams();
    if (options.search) params.append('search', options.search);
    if (options.riskBand) params.append('risk_band', options.riskBand);
    if (options.academicRisk) params.append('academic_risk', options.academicRisk);
    if (options.placementRisk) params.append('placement_risk', options.placementRisk);
    if (options.department) params.append('department', options.department);
    if (options.mentor) params.append('mentor', options.mentor);
    if (options.recordType) params.append('record_type', options.recordType);
    const token = sessionStorage.getItem('codebuffet_access_token');
    if (token) params.append('token', token);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const url = `${API_BASE}/api/institution/students/export${qs}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...getAuthHeader(),
      },
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(err.detail || `Export failed with status ${response.status}`);
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `codebuffet_cohort_export_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(downloadUrl);
  },

  getInterventions: (mentor = '', category = '') => {
    const params = new URLSearchParams();
    if (mentor) params.append('mentor', mentor);
    if (category) params.append('category', category);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request(`/api/institution/interventions${qs}`);
  },

  createIntervention: (data) =>
    request('/api/institution/interventions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  toggleInstitutionIntervention: (taskId) =>
    request(`/api/institution/interventions/${taskId}/toggle`, {
      method: 'POST',
    }),

  createStudent: (studentData) =>
    request('/api/institution/students', {
      method: 'POST',
      body: JSON.stringify(studentData),
    }),

  enrollMentor: (mentorData) =>
    request('/api/institution/mentors', {
      method: 'POST',
      body: JSON.stringify(mentorData),
    }),

  enrollPlacementOfficer: (officerData) =>
    request('/api/institution/placement-officers', {
      method: 'POST',
      body: JSON.stringify(officerData),
    }),

  getPlacementOfficers: () => request('/api/institution/placement-officers'),

  assignMentor: (rollNo, mentorName) =>
    request('/api/institution/students/assign-mentor', {
      method: 'POST',
      body: JSON.stringify({ roll_no: rollNo, mentor_name: mentorName }),
    }),

  getInstitutionStudentHistory: (rollNo) =>
    request(`/api/institution/students/${encodeURIComponent(rollNo)}/history`),

  askMentorCopilot: (rollNo, action = 'analyze') =>
    request('/api/institution/mentor/ai-copilot', {
      method: 'POST',
      body: JSON.stringify({ roll_no: rollNo, action }),
    }),

  // Institutional Account Approval Workflow (Admin-only)
  getPendingApprovals: (status = 'PENDING_APPROVAL', role = '') => {
    const params = new URLSearchParams();
    if (status) params.append('status_filter', status);
    if (role) params.append('role_filter', role);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request(`/api/institution/approvals/pending${qs}`);
  },

  processAccountApproval: (userId, action, notes = '') =>
    request(`/api/institution/approvals/${userId}/action`, {
      method: 'POST',
      body: JSON.stringify({ action, notes }),
    }),

  // Student Endpoints
  getStudentDashboard: (rollNo) => {
    const query = rollNo ? `?roll_no=${encodeURIComponent(rollNo)}` : '';
    return request(`/api/student/dashboard${query}`);
  },

  getStudentHistory: (rollNo) => {
    const query = rollNo ? `?roll_no=${encodeURIComponent(rollNo)}` : '';
    return request(`/api/student/history${query}`);
  },

  getStudentTasks: (rollNo) => {
    const query = rollNo ? `?roll_no=${encodeURIComponent(rollNo)}` : '';
    return request(`/api/student/tasks${query}`);
  },

  updateStudentTaskStatus: (taskId, status, notes = '') =>
    request(`/api/student/tasks/${taskId}/status`, {
      method: 'POST',
      body: JSON.stringify({ status, notes }),
    }),

  simulateStudentScore: (params) =>
    request('/api/student/simulate', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  toggleTaskStatus: (taskId) =>
    request(`/api/student/tasks/${taskId}/toggle`, {
      method: 'POST',
    }),

  askStudentAI: (question, whatIfContext = null) =>
    request('/api/student/ai-assistant', {
      method: 'POST',
      body: JSON.stringify({ question, what_if_context: whatIfContext }),
    }),

  // Placement Endpoints
  getPlacementJobs: () => request('/api/placement/jobs'),

  createPlacementJob: (jobData) =>
    request('/api/placement/jobs', {
      method: 'POST',
      body: JSON.stringify(jobData),
    }),

  getPlacementPipeline: (jobId = null, stage = null) => {
    const params = new URLSearchParams();
    if (jobId) params.append('job_id', jobId);
    if (stage) params.append('stage', stage);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request(`/api/placement/pipeline${qs}`);
  },

  updatePlacementStage: (applicationId, stage, notes = '') =>
    request('/api/placement/pipeline/stage', {
      method: 'POST',
      body: JSON.stringify({ application_id: applicationId, stage, notes }),
    }),

  matchCandidateToJob: (jobId, studentRollNo) =>
    request('/api/placement/match', {
      method: 'POST',
      body: JSON.stringify({ job_id: jobId, student_roll_no: studentRollNo }),
    }),

  getPlacementAnalytics: () => request('/api/placement/analytics'),
};

export default api;
