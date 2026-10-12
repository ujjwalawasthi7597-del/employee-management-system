export type UserRole = 'super_admin' | 'hr_manager' | 'dept_manager' | 'employee';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  title: string;
  departmentId: string;
  departmentName: string;
  avatarUrl: string;
  status: 'active' | 'inactive' | 'suspended';
  phone?: string;
  joinDate: string;
  location: string;
  reportsToId?: string;
  reportsToName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  headId?: string;
  headName?: string;
  description: string;
  employeeCount: number;
  budget: number;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  departmentId: string;
  date: string; // YYYY-MM-DD
  clockIn: string;
  clockOut?: string;
  totalHours?: number;
  status: 'present' | 'late' | 'half_day' | 'absent' | 'on_leave';
  ipAddress?: string;
  notes?: string;
  createdAt: string;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  userName: string;
  departmentId: string;
  departmentName: string;
  leaveType: 'annual' | 'sick' | 'casual' | 'maternity' | 'paternity' | 'unpaid';
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  reviewedById?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

export interface LeaveBalance {
  userId: string;
  annual: { total: number; used: number };
  sick: { total: number; used: number };
  casual: { total: number; used: number };
}

export interface PayrollRecord {
  id: string;
  userId: string;
  userName: string;
  departmentId: string;
  month: string;
  basicSalary: number;
  allowances: {
    hra: number;
    transport: number;
    medical: number;
    performanceBonus: number;
  };
  deductions: {
    tax: number;
    providentFund: number;
    healthInsurance: number;
  };
  grossSalary: number;
  netSalary: number;
  status: 'draft' | 'processed' | 'paid';
  paymentDate?: string;
  paymentMethod: 'bank_transfer' | 'cheque' | 'direct_deposit';
  payslipNumber: string;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  departmentId: string;
  departmentName: string;
  leadId: string;
  leadName: string;
  status: 'planning' | 'in_progress' | 'on_hold' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  startDate: string;
  dueDate: string;
  progress: number;
  members: string[];
  createdAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  description: string;
  assigneeId: string;
  assigneeName: string;
  assigneeAvatar: string;
  createdById: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in_progress' | 'in_review' | 'completed';
  dueDate: string;
  completedAt?: string;
  createdAt: string;
}

export interface PerformanceReview {
  id: string;
  employeeId: string;
  employeeName: string;
  departmentName: string;
  reviewerId: string;
  reviewerName: string;
  period: string;
  ratingOverall: number;
  ratings: {
    productivity: number;
    workQuality: number;
    teamwork: number;
    leadership: number;
    punctuality: number;
  };
  achievements: string;
  improvements: string;
  goalsForNextPeriod: string;
  status: 'draft' | 'completed';
  reviewedAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  priority: 'normal' | 'important' | 'urgent';
  targetAudience: 'all' | 'engineering' | 'hr' | 'sales' | 'leadership';
  isPinned: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorId: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  resource: string;
  details: string;
  ipAddress: string;
}

export interface CompanySettings {
  companyName: string;
  workDays: string[];
  workStartTime: string;
  workEndTime: string;
  annualLeaveQuota: number;
  sickLeaveQuota: number;
  casualLeaveQuota: number;
  currency: string;
  fiscalYearStart: string;
}

export interface DashboardStats {
  totalEmployees: number;
  todayAttendance: {
    present: number;
    late: number;
    halfDay: number;
    totalToday: number;
  };
  pendingLeaves: number;
  tasks: {
    todo: number;
    in_progress: number;
    in_review: number;
    completed: number;
  };
  departmentBreakdown: {
    name: string;
    code: string;
    headcount: number;
    budget: number;
  }[];
  payrollSummary?: {
    latestMonth: string;
    totalPayrollExpense: number;
    totalNetDisbursed: number;
    totalTaxes: number;
    processedCount: number;
  } | null;
  past7DaysAttendance: {
    date: string;
    present: number;
    late: number;
  }[];
}
