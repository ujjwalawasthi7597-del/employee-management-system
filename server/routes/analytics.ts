import { Router, Response } from 'express';
import { db } from '../db/database';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /api/analytics/dashboard
router.get('/dashboard', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const today = new Date().toISOString().split('T')[0];

  // Headcount
  const totalEmployees = db.users.filter(u => u.status === 'active').length;
  const deptEmployees = db.users.filter(u => u.departmentId === user.departmentId && u.status === 'active').length;

  // Department distribution
  const departmentBreakdown = db.departments.map(d => ({
    name: d.name,
    code: d.code,
    headcount: db.users.filter(u => u.departmentId === d.id && u.status === 'active').length,
    budget: d.budget,
  }));

  // Today attendance
  const todayRecords = db.attendance.filter(a => a.date === today);
  const presentCount = todayRecords.filter(r => r.status === 'present').length;
  const lateCount = todayRecords.filter(r => r.status === 'late').length;
  const halfDayCount = todayRecords.filter(r => r.status === 'half_day').length;

  // Leaves
  const pendingLeaves = db.leaves.filter(l => {
    if (l.status !== 'pending') return false;
    if (user.role === 'dept_manager') return l.departmentId === user.departmentId;
    return true;
  }).length;

  // Projects & Tasks
  let relevantTasks = db.tasks;
  if (user.role === 'dept_manager') {
    const deptProjectIds = db.projects.filter(p => p.departmentId === user.departmentId).map(p => p.id);
    relevantTasks = db.tasks.filter(t => deptProjectIds.includes(t.projectId));
  } else if (user.role === 'employee') {
    relevantTasks = db.tasks.filter(t => t.assigneeId === user.id);
  }

  const tasksByStatus = {
    todo: relevantTasks.filter(t => t.status === 'todo').length,
    in_progress: relevantTasks.filter(t => t.status === 'in_progress').length,
    in_review: relevantTasks.filter(t => t.status === 'in_review').length,
    completed: relevantTasks.filter(t => t.status === 'completed').length,
  };

  // Payroll aggregate (Admin & HR only)
  let payrollSummary = null;
  if (user.role === 'super_admin' || user.role === 'hr_manager') {
    const latestMonth = '2026-09';
    const monthPayroll = db.payroll.filter(p => p.month === latestMonth);
    const totalPayrollExpense = monthPayroll.reduce((acc, curr) => acc + curr.grossSalary, 0);
    const totalNetDisbursed = monthPayroll.reduce((acc, curr) => acc + curr.netSalary, 0);
    const totalTaxes = monthPayroll.reduce((acc, curr) => acc + curr.deductions.tax, 0);

    payrollSummary = {
      latestMonth,
      totalPayrollExpense,
      totalNetDisbursed,
      totalTaxes,
      processedCount: monthPayroll.length,
    };
  }

  // Attendance history past 7 days
  const past7Days: { date: string; present: number; late: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const recs = db.attendance.filter(r => r.date === dateStr);
    past7Days.push({
      date: dateStr.substring(5), // MM-DD
      present: recs.filter(r => r.status === 'present').length,
      late: recs.filter(r => r.status === 'late').length,
    });
  }

  return res.json({
    success: true,
    stats: {
      totalEmployees: user.role === 'dept_manager' ? deptEmployees : totalEmployees,
      todayAttendance: {
        present: presentCount,
        late: lateCount,
        halfDay: halfDayCount,
        totalToday: todayRecords.length,
      },
      pendingLeaves,
      tasks: tasksByStatus,
      departmentBreakdown,
      payrollSummary,
      past7DaysAttendance: past7Days,
    },
  });
});

export default router;
