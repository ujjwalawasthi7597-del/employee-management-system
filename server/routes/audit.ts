import { Router, Response } from 'express';
import { db } from '../db/database';
import { authenticateToken, AuthenticatedRequest, requireRoles } from '../middleware/auth';

const router = Router();

// GET /api/audit-logs - Super Admin only
router.get('/audit-logs', authenticateToken, requireRoles('super_admin'), (req: AuthenticatedRequest, res: Response) => {
  const { action, actorId, search } = req.query;
  let logs = [...db.auditLogs];

  if (action) {
    logs = logs.filter(l => l.action === action);
  }

  if (actorId) {
    logs = logs.filter(l => l.actorId === actorId);
  }

  if (search) {
    const q = String(search).toLowerCase();
    logs = logs.filter(l =>
      l.details.toLowerCase().includes(q) ||
      l.actorEmail.toLowerCase().includes(q) ||
      l.action.toLowerCase().includes(q)
    );
  }

  return res.json({ success: true, logs });
});

// GET /api/settings
router.get('/settings', authenticateToken, (_req: AuthenticatedRequest, res: Response) => {
  return res.json({ success: true, settings: db.settings });
});

// PUT /api/settings - Super Admin only
router.put('/settings', authenticateToken, requireRoles('super_admin'), (req: AuthenticatedRequest, res: Response) => {
  const reqUser = req.user!;
  const {
    companyName,
    workDays,
    workStartTime,
    workEndTime,
    annualLeaveQuota,
    sickLeaveQuota,
    casualLeaveQuota,
    currency,
  } = req.body;

  if (companyName) db.settings.companyName = companyName;
  if (workDays && Array.isArray(workDays)) db.settings.workDays = workDays;
  if (workStartTime) db.settings.workStartTime = workStartTime;
  if (workEndTime) db.settings.workEndTime = workEndTime;
  if (annualLeaveQuota !== undefined) db.settings.annualLeaveQuota = Number(annualLeaveQuota);
  if (sickLeaveQuota !== undefined) db.settings.sickLeaveQuota = Number(sickLeaveQuota);
  if (casualLeaveQuota !== undefined) db.settings.casualLeaveQuota = Number(casualLeaveQuota);
  if (currency) db.settings.currency = currency;

  db.saveMutation();
  db.addAuditLog(reqUser.id, reqUser.email, reqUser.role, 'UPDATE_SETTINGS', 'CompanySettings', 'Updated company parameters & policies', req.ip);

  return res.json({ success: true, settings: db.settings });
});

export default router;
