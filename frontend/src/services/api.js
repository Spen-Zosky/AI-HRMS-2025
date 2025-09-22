import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

export const employeeAPI = {
  getAll: () => api.get('/employees'),
  getById: (id) => api.get(`/employees/${id}`),
  create: (employee) => api.post('/employees', employee),
  update: (id, employee) => api.put(`/employees/${id}`, employee),
  delete: (id) => api.delete(`/employees/${id}`),
};

export const leaveAPI = {
  getAll: () => api.get('/leave/requests'),
  getById: (id) => api.get(`/leave/requests/${id}`),
  create: (leave) => api.post('/leave/requests', leave),
  update: (id, leave) => api.put(`/leave/requests/${id}`, leave),
  approve: (id) => api.put(`/leave/requests/${id}/approve`),
  reject: (id, data) => api.put(`/leave/requests/${id}/reject`, data),
};

export const atsAPI = {
  getJobs: () => api.get('/ats/jobs'),
  getCandidates: () => api.get('/ats/candidates'),
  uploadCV: (formData) => api.post('/ats/upload-cv', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  parseCV: (cvId) => api.post(`/ats/parse-cv/${cvId}`),
  generateJobDescription: (data) => api.post('/ats/generate-job', data),
};

export const skillsAPI = {
  getSkills: () => api.get('/skills'),
  analyzeGaps: (data) => api.post('/skills/analyze-gaps', data),
  generateLearningPath: (data) => api.post('/skills/learning-path', data),
  importTaxonomy: () => api.post('/skills/import-taxonomy'),
};

export const copilotAPI = {
  chat: (message) => api.post('/copilot/chat', { message }),
  generateReport: (type) => api.post('/copilot/report', { type }),
  getInsights: () => api.get('/copilot/insights'),
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getRecentLeaves: (limit = 5) => api.get(`/dashboard/recent-leaves?limit=${limit}`),
  getSkillsGaps: (limit = 10) => api.get(`/dashboard/skills-gaps?limit=${limit}`),
  getDashboardData: () => api.get('/dashboard/data'),
};

export default api;