import { Router, Response } from 'express';
import { db, AttendanceRecord } from '../db/database';
import { authenticateToken, AuthenticatedRequest, requireRoles } from '../middleware/auth';

const router = Router();

// GET /api/attendance
router.get('/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { date, startDate, endDate, departmentId, userId } = req.query;

  let records = [...db.attendance];

  // Role scoping:
  if (user.role === 'employee') {
    records = records.filter(r => r.userId === user.id);
  } else if (user.role === 'dept_manager') {
    records = records.filter(r => r.departmentId === user.departmentId);
  }

  if (userId) {
    // Only HR or Admin or Dept Manager of same dept can query another user
    if (user.role === 'employee' && userId !== user.id) {
      return res.status(403).json({ success: false, error: 'Unauthorized to view other employee attendance records.' });
    }
    records = records.filter(r => r.userId === userId);
  }

  if (departmentId && (user.role === 'super_admin' || user.role === 'hr_manager')) {
    records = records.filter(r => r.departmentId === departmentId);
  }

  if (date) {
    records = records.filter(r => r.date === date);
  }

  if (startDate && endDate) {
    records = records.filter(r => r.date >= String(startDate) && r.date <= String(endDate));
  }

  // Sort descending by date & clockIn
  records.sort((a, b) => new Date(b.clockIn).getTime() - new Date(a.clockIn).getTime());

  return res.json({ success: true, records });
});

// GET /api/attendance/today
router.get('/today', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const today = new Date().toISOString().split('T')[0];
  const record = db.attendance.find(r => r.userId === user.id && r.date === today);

  return res.json({
    success: true,
    today,
    record: record || null,
  });
});

// POST /api/attendance/clock-in
router.post('/clock-in', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const today = new Date().toISOString().split('T')[0];
  const now = new Date();

  const existing = db.attendance.find(r => r.userId === user.id && r.date === today);
  if (existing) {
    return res.status(400).json({ success: false, error: 'You have already clocked in today.' });
  }

  // Check if late (default schedule: work starts at 09:00 with 15-min grace period)
  const isLate = now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 15);

  const record: AttendanceRecord = {
    id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    userId: user.id,
    userName: `${user.firstName} ${user.lastName}`,
    departmentId: user.departmentId,
    date: today,
    clockIn: now.toISOString(),
    status: isLate ? 'late' : 'present',
    ipAddress: req.ip || '127.0.0.1',
    createdAt: now.toISOString(),
  };

  db.attendance.unshift(record);
  db.saveMutation();

  db.addAuditLog(user.id, user.email, user.role, 'ATTENDANCE_CLOCK_IN', 'Attendance', `Clocked in at ${now.toLocaleTimeString()} (${record.status})`, req.ip);

  return res.status(201).json({ success: true, record });
});

// POST /api/attendance/clock-out
router.post('/clock-out', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const today = new Date().toISOString().split('T')[0];
  const now = new Date();

  const record = db.attendance.find(r => r.userId === user.id && r.date === today);
  if (!record) {
    return res.status(400).json({ success: false, error: 'No active clock-in found for today. Please clock in first.' });
  }

  if (record.clockOut) {
    return res.status(400).json({ success: false, error: 'You have already clocked out today.' });
  }

  record.clockOut = now.toISOString();

  // Calculate total hours
  const start = new Date(record.clockIn).getTime();
  const end = now.getTime();
  const diffHours = Number(((end - start) / (1000 * 60 * 60)).toFixed(2));
  record.totalHours = diffHours;

  if (diffHours < 4 && record.status !== 'late') {
    record.status = 'half_day';
  }

  db.saveMutation();
  db.addAuditLog(user.id, user.email, user.role, 'ATTENDANCE_CLOCK_OUT', 'Attendance', `Clocked out at ${now.toLocaleTimeString()}. Total shift: ${diffHours} hrs`, req.ip);

  return res.json({ success: true, record });
});

// POST /api/attendance/manual - Admin / HR manual entry or correction
router.post('/manual', authenticateToken, requireRoles('super_admin', 'hr_manager'), (req: AuthenticatedRequest, res: Response) => {
  const reqUser = req.user!;
  const { userId, date, clockIn, clockOut, status, notes } = req.body;

  if (!userId || !date || !clockIn) {
    return res.status(400).json({ success: false, error: 'Employee ID, Date, and Clock-in time are required.' });
  }

  const target = db.users.find(u => u.id === userId);
  if (!target) {
    return res.status(404).json({ success: false, error: 'Employee not found.' });
  }

  let totalHours = undefined;
  if (clockOut) {
    const s = new Date(clockIn).getTime();
    const e = new Date(clockOut).getTime();
    totalHours = Number(((e - s) / (1000 * 60 * 60)).toFixed(2));
  }

  const record: AttendanceRecord = {
    id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    userId: target.id,
    userName: `${target.firstName} ${target.lastName}`,
    departmentId: target.departmentId,
    date,
    clockIn,
    clockOut,
    totalHours,
    status: status || 'present',
    notes: notes || 'Manual entry by HR/Admin',
    createdAt: new Date().toISOString(),
  };

  db.attendance.unshift(record);
  db.saveMutation();

  db.addAuditLog(reqUser.id, reqUser.email, reqUser.role, 'ATTENDANCE_MANUAL_ENTRY', 'Attendance', `Manual attendance recorded for ${target.firstName} ${target.lastName} on ${date}`, req.ip);

  return res.status(201).json({ success: true, record });
});

export default router;
