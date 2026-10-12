import { User, Department, AttendanceRecord, LeaveRequest, LeaveBalance, PayrollRecord, Project, Task, PerformanceReview, Announcement, AuditLog, CompanySettings, DashboardStats, UserRole } from '../types';

const TOKEN_KEY = 'talentgrid_auth_token';

export const getStoredToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setStoredToken = (token: string) => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const removeStoredToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok || data.success === false) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data;
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    apiRequest<{ success: boolean; token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  getMe: () =>
    apiRequest<{ success: boolean; user: User; todayAttendance: AttendanceRecord | null; leaveBalance: LeaveBalance }>('/api/auth/me'),

  changePassword: (currentPassword: string, newPassword: string) =>
    apiRequest<{ success: boolean; message: string }>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  forgotPassword: (email: string) =>
    apiRequest<{ success: boolean; message: string; demoResetToken?: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, newPassword: string) =>
    apiRequest<{ success: boolean; message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    }),

  quickSwitchRole: (role: UserRole) =>
    apiRequest<{ success: boolean; token: string; user: User }>('/api/auth/quick-switch', {
      method: 'POST',
      body: JSON.stringify({ role }),
    }),

  // Users
  getUsers: (params?: { departmentId?: string; search?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.departmentId) query.set('departmentId', params.departmentId);
    if (params?.search) query.set('search', params.search);
    if (params?.status) query.set('status', params.status);
    return apiRequest<{ success: boolean; users: User[] }>(`/api/users?${query.toString()}`);
  },

  getUser: (id: string) =>
    apiRequest<{
      success: boolean;
      user: User;
      leaveBalance: LeaveBalance;
      recentReviews: PerformanceReview[];
      assignedTasks: Task[];
    }>(`/api/users/${id}`),

  createUser: (userData: any) =>
    apiRequest<{ success: boolean; user: User }>('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  updateUser: (id: string, userData: any) =>
    apiRequest<{ success: boolean; user: User }>(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    }),

  deactivateUser: (id: string) =>
    apiRequest<{ success: boolean; message: string }>(`/api/users/${id}`, {
      method: 'DELETE',
    }),

  // Departments
  getDepartments: () =>
    apiRequest<{ success: boolean; departments: Department[] }>('/api/departments'),

  createDepartment: (deptData: any) =>
    apiRequest<{ success: boolean; department: Department }>('/api/departments', {
      method: 'POST',
      body: JSON.stringify(deptData),
    }),

  updateDepartment: (id: string, deptData: any) =>
    apiRequest<{ success: boolean; department: Department }>(`/api/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(deptData),
    }),

  // Attendance
  getAttendance: (params?: { date?: string; startDate?: string; endDate?: string; departmentId?: string; userId?: string }) => {
    const query = new URLSearchParams();
    if (params?.date) query.set('date', params.date);
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    if (params?.departmentId) query.set('departmentId', params.departmentId);
    if (params?.userId) query.set('userId', params.userId);
    return apiRequest<{ success: boolean; records: AttendanceRecord[] }>(`/api/attendance?${query.toString()}`);
  },

  getTodayAttendance: () =>
    apiRequest<{ success: boolean; today: string; record: AttendanceRecord | null }>('/api/attendance/today'),

  clockIn: () =>
    apiRequest<{ success: boolean; record: AttendanceRecord }>('/api/attendance/clock-in', {
      method: 'POST',
    }),

  clockOut: () =>
    apiRequest<{ success: boolean; record: AttendanceRecord }>('/api/attendance/clock-out', {
      method: 'POST',
    }),

  recordManualAttendance: (data: any) =>
    apiRequest<{ success: boolean; record: AttendanceRecord }>('/api/attendance/manual', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Leaves
  getLeaves: (params?: { status?: string; departmentId?: string; userId?: string }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.departmentId) query.set('departmentId', params.departmentId);
    if (params?.userId) query.set('userId', params.userId);
    return apiRequest<{ success: boolean; leaves: LeaveRequest[] }>(`/api/leaves?${query.toString()}`);
  },

  getLeaveBalance: (userId?: string) => {
    const query = userId ? `?userId=${userId}` : '';
    return apiRequest<{ success: boolean; balance: LeaveBalance }>(`/api/leaves/balances${query}`);
  },

  applyLeave: (data: any) =>
    apiRequest<{ success: boolean; leave: LeaveRequest }>('/api/leaves', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  reviewLeave: (id: string, status: 'approved' | 'rejected', rejectionReason?: string) =>
    apiRequest<{ success: boolean; leave: LeaveRequest }>(`/api/leaves/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, rejectionReason }),
    }),

  cancelLeave: (id: string) =>
    apiRequest<{ success: boolean; message: string }>(`/api/leaves/${id}`, {
      method: 'DELETE',
    }),

  // Payroll
  getPayroll: (params?: { month?: string; userId?: string }) => {
    const query = new URLSearchParams();
    if (params?.month) query.set('month', params.month);
    if (params?.userId) query.set('userId', params.userId);
    return apiRequest<{ success: boolean; records: PayrollRecord[] }>(`/api/payroll?${query.toString()}`);
  },

  getPayslip: (id: string) =>
    apiRequest<{ success: boolean; record: PayrollRecord; employee: any }>(`/api/payroll/${id}`),

  createPayroll: (data: any) =>
    apiRequest<{ success: boolean; record: PayrollRecord }>('/api/payroll', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  markPayrollPaid: (id: string) =>
    apiRequest<{ success: boolean; record: PayrollRecord }>(`/api/payroll/${id}/pay`, {
      method: 'PUT',
    }),

  // Projects & Tasks
  getProjects: () =>
    apiRequest<{ success: boolean; projects: Project[] }>('/api/projects'),

  createProject: (data: any) =>
    apiRequest<{ success: boolean; project: Project }>('/api/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getTasks: (params?: { projectId?: string; status?: string; priority?: string; assigneeId?: string }) => {
    const query = new URLSearchParams();
    if (params?.projectId) query.set('projectId', params.projectId);
    if (params?.status) query.set('status', params.status);
    if (params?.priority) query.set('priority', params.priority);
    if (params?.assigneeId) query.set('assigneeId', params.assigneeId);
    return apiRequest<{ success: boolean; tasks: Task[] }>(`/api/projects/tasks?${query.toString()}`);
  },

  createTask: (data: any) =>
    apiRequest<{ success: boolean; task: Task }>('/api/projects/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateTaskStatus: (id: string, status: string) =>
    apiRequest<{ success: boolean; task: Task }>(`/api/projects/tasks/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  // Performance
  getPerformanceReviews: (employeeId?: string) => {
    const query = employeeId ? `?employeeId=${employeeId}` : '';
    return apiRequest<{ success: boolean; reviews: PerformanceReview[] }>(`/api/performance${query}`);
  },

  createPerformanceReview: (data: any) =>
    apiRequest<{ success: boolean; review: PerformanceReview }>('/api/performance', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Announcements
  getAnnouncements: () =>
    apiRequest<{ success: boolean; announcements: Announcement[] }>('/api/announcements'),

  createAnnouncement: (data: any) =>
    apiRequest<{ success: boolean; announcement: Announcement }>('/api/announcements', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteAnnouncement: (id: string) =>
    apiRequest<{ success: boolean; message: string }>(`/api/announcements/${id}`, {
      method: 'DELETE',
    }),

  // Audit Logs & Settings
  getAuditLogs: (params?: { action?: string; actorId?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.action) query.set('action', params.action);
    if (params?.actorId) query.set('actorId', params.actorId);
    if (params?.search) query.set('search', params.search);
    return apiRequest<{ success: boolean; logs: AuditLog[] }>(`/api/audit-logs?${query.toString()}`);
  },

  getSettings: () =>
    apiRequest<{ success: boolean; settings: CompanySettings }>('/api/settings'),

  updateSettings: (data: Partial<CompanySettings>) =>
    apiRequest<{ success: boolean; settings: CompanySettings }>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Analytics Dashboard
  getDashboardAnalytics: () =>
    apiRequest<{ success: boolean; stats: DashboardStats }>('/api/analytics/dashboard'),
};
