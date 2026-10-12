import { Router, Response } from 'express';
import { db, LeaveRequest } from '../db/database';
import { authenticateToken, AuthenticatedRequest, requireRoles } from '../middleware/auth';

const router = Router();

// GET /api/leaves - List leaves with role scoping
router.get('/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { status, departmentId, userId } = req.query;

  let list = [...db.leaves];

  // Scoping:
  if (user.role === 'employee') {
    list = list.filter(l => l.userId === user.id);
  } else if (user.role === 'dept_manager') {
    // Dept managers see team members in their department, or their own
    list = list.filter(l => l.departmentId === user.departmentId);
  }

  if (userId) {
    if (user.role === 'employee' && userId !== user.id) {
      return res.status(403).json({ success: false, error: 'Unauthorized to view other employee leave requests.' });
    }
    list = list.filter(l => l.userId === userId);
  }

  if (departmentId && (user.role === 'super_admin' || user.role === 'hr_manager')) {
    list = list.filter(l => l.departmentId === departmentId);
  }

  if (status) {
    list = list.filter(l => l.status === status);
  }

  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return res.json({ success: true, leaves: list });
});

// GET /api/leaves/balances - Get leave balance (for user or specific user if manager/HR)
router.get('/balances', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { userId } = req.query;

  const targetId = (userId as string) || user.id;

  if (targetId !== user.id && user.role === 'employee') {
    return res.status(403).json({ success: false, error: 'Cannot view other employee leave balance.' });
  }

  const balance = db.leaveBalances[targetId] || {
    userId: targetId,
    annual: { total: 20, used: 0 },
    sick: { total: 12, used: 0 },
    casual: { total: 10, used: 0 },
  };

  return res.json({ success: true, balance });
});

// POST /api/leaves - Apply for leave
router.post('/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { leaveType, startDate, endDate, totalDays, reason } = req.body;

  if (!leaveType || !startDate || !endDate || !reason) {
    return res.status(400).json({ success: false, error: 'Leave type, start date, end date, and reason are required.' });
  }

  const days = Number(totalDays) || 1;
  if (days <= 0) {
    return res.status(400).json({ success: false, error: 'Total days must be at least 1.' });
  }

  // Validate balance
  const balance = db.leaveBalances[user.id];
  if (balance && (leaveType === 'annual' || leaveType === 'sick' || leaveType === 'casual')) {
    const quota = balance[leaveType as 'annual' | 'sick' | 'casual'];
    if (quota && (quota.used + days > quota.total)) {
      return res.status(400).json({
        success: false,
        error: `Insufficient leave balance for ${leaveType}. Available: ${quota.total - quota.used} days, Requested: ${days} days.`,
      });
    }
  }

  const newLeave: LeaveRequest = {
    id: `lv-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    userId: user.id,
    userName: `${user.firstName} ${user.lastName}`,
    departmentId: user.departmentId,
    departmentName: user.departmentName,
    leaveType,
    startDate,
    endDate,
    totalDays: days,
    reason,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  db.leaves.unshift(newLeave);
  db.saveMutation();

  db.addAuditLog(user.id, user.email, user.role, 'APPLY_LEAVE', 'LeaveRequest', `Submitted ${days}-day ${leaveType} leave request`, req.ip);

  return res.status(201).json({ success: true, leave: newLeave });
});

// PUT /api/leaves/:id/status - Approve or reject leave
router.put('/:id/status', authenticateToken, requireRoles('super_admin', 'hr_manager', 'dept_manager'), (req: AuthenticatedRequest, res: Response) => {
  const reqUser = req.user!;
  const leaveId = req.params.id;
  const { status, rejectionReason } = req.body;

  if (!status || !['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ success: false, error: 'Status must be either "approved" or "rejected".' });
  }

  const leave = db.leaves.find(l => l.id === leaveId);
  if (!leave) {
    return res.status(404).json({ success: false, error: 'Leave request not found.' });
  }

  if (leave.status !== 'pending') {
    return res.status(400).json({ success: false, error: `Leave request has already been ${leave.status}.` });
  }

  // Prevent self-approval
  if (leave.userId === reqUser.id) {
    return res.status(403).json({ success: false, error: 'Managers cannot approve their own leave requests. Requires HR or Executive review.' });
  }

  // Dept manager scope check
  if (reqUser.role === 'dept_manager' && leave.departmentId !== reqUser.departmentId) {
    return res.status(403).json({ success: false, error: 'You can only review leave requests within your department.' });
  }

  leave.status = status;
  leave.reviewedById = reqUser.id;
  leave.reviewedByName = `${reqUser.firstName} ${reqUser.lastName}`;
  leave.reviewedAt = new Date().toISOString();

  if (status === 'rejected') {
    leave.rejectionReason = rejectionReason || 'Operational workload constraints.';
  } else if (status === 'approved') {
    // Deduct from leave balance
    const balance = db.leaveBalances[leave.userId];
    if (balance && (leave.leaveType === 'annual' || leave.leaveType === 'sick' || leave.leaveType === 'casual')) {
      balance[leave.leaveType].used += leave.totalDays;
    }
  }

  db.saveMutation();
  db.addAuditLog(reqUser.id, reqUser.email, reqUser.role, 'REVIEW_LEAVE', 'LeaveRequest', `${status.toUpperCase()} leave request ${leave.id} for ${leave.userName}`, req.ip);

  return res.json({ success: true, leave });
});

// DELETE /api/leaves/:id - Cancel pending leave request
router.delete('/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const leaveId = req.params.id;

  const leave = db.leaves.find(l => l.id === leaveId);
  if (!leave) {
    return res.status(404).json({ success: false, error: 'Leave request not found.' });
  }

  if (leave.userId !== user.id && user.role !== 'super_admin' && user.role !== 'hr_manager') {
    return res.status(403).json({ success: false, error: 'Unauthorized to cancel this request.' });
  }

  if (leave.status !== 'pending') {
    return res.status(400).json({ success: false, error: `Only pending leave requests can be cancelled. Current status is ${leave.status}.` });
  }

  leave.status = 'cancelled';
  db.saveMutation();

  db.addAuditLog(user.id, user.email, user.role, 'CANCEL_LEAVE', 'LeaveRequest', `Cancelled leave request ${leave.id}`, req.ip);

  return res.json({ success: true, message: 'Leave request cancelled successfully.' });
});

export default router;
