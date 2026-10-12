import { Router, Response } from 'express';
import { db, PerformanceReview } from '../db/database';
import { authenticateToken, AuthenticatedRequest, requireRoles } from '../middleware/auth';

const router = Router();

// GET /api/performance
router.get('/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { employeeId } = req.query;

  let list = [...db.performanceReviews];

  if (user.role === 'employee') {
    list = list.filter(r => r.employeeId === user.id);
  } else if (user.role === 'dept_manager') {
    const deptEmployees = db.users.filter(u => u.departmentId === user.departmentId).map(u => u.id);
    list = list.filter(r => deptEmployees.includes(r.employeeId) || r.reviewerId === user.id);
  }

  if (employeeId) {
    if (user.role === 'employee' && employeeId !== user.id) {
      return res.status(403).json({ success: false, error: 'Cannot view other employee reviews.' });
    }
    list = list.filter(r => r.employeeId === employeeId);
  }

  return res.json({ success: true, reviews: list });
});

// POST /api/performance - Conduct review (Manager, HR, Super Admin)
router.post('/', authenticateToken, requireRoles('super_admin', 'hr_manager', 'dept_manager'), (req: AuthenticatedRequest, res: Response) => {
  const reqUser = req.user!;
  const {
    employeeId,
    period,
    productivity = 4,
    workQuality = 4,
    teamwork = 4,
    leadership = 4,
    punctuality = 4,
    achievements = '',
    improvements = '',
    goalsForNextPeriod = '',
  } = req.body;

  if (!employeeId || !period) {
    return res.status(400).json({ success: false, error: 'Employee and review period are required.' });
  }

  const employee = db.users.find(u => u.id === employeeId);
  if (!employee) {
    return res.status(404).json({ success: false, error: 'Employee not found.' });
  }

  // Dept manager scope check
  if (reqUser.role === 'dept_manager' && employee.departmentId !== reqUser.departmentId) {
    return res.status(403).json({ success: false, error: 'You can only review team members in your department.' });
  }

  const p = Number(productivity);
  const q = Number(workQuality);
  const t = Number(teamwork);
  const l = Number(leadership);
  const pu = Number(punctuality);

  const overall = Number(((p + q + t + l + pu) / 5).toFixed(1));

  const newReview: PerformanceReview = {
    id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    employeeId: employee.id,
    employeeName: `${employee.firstName} ${employee.lastName}`,
    departmentName: employee.departmentName,
    reviewerId: reqUser.id,
    reviewerName: `${reqUser.firstName} ${reqUser.lastName}`,
    period,
    ratingOverall: overall,
    ratings: {
      productivity: p,
      workQuality: q,
      teamwork: t,
      leadership: l,
      punctuality: pu,
    },
    achievements,
    improvements,
    goalsForNextPeriod,
    status: 'completed',
    reviewedAt: new Date().toISOString(),
  };

  db.performanceReviews.unshift(newReview);
  db.saveMutation();

  db.addAuditLog(reqUser.id, reqUser.email, reqUser.role, 'CREATE_PERFORMANCE_REVIEW', 'PerformanceReview', `Submitted ${period} appraisal for ${newReview.employeeName} (Rating: ${overall}/5.0)`, req.ip);

  return res.status(201).json({ success: true, review: newReview });
});

export default router;
