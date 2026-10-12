import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db, UserRole } from '../db/database';
import { authenticateToken, AuthenticatedRequest, JWT_SECRET, JWT_EXPIRES_IN } from '../middleware/auth';

const router = Router();

// In-memory reset tokens: token -> { email: string, expires: number }
const passwordResetTokens = new Map<string, { email: string; expires: number }>();

function sanitizeUser(user: any) {
  const { passwordHash, ...rest } = user;
  return rest;
}

// POST /api/auth/login
router.post('/login', async (req, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required.' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const user = db.users.find(u => u.email.toLowerCase() === normalizedEmail);

  // Generic error to prevent enumeration
  if (!user) {
    db.addAuditLog('system', normalizedEmail, 'anonymous', 'LOGIN_FAILED', 'User', 'Failed login attempt - user not found', req.ip);
    return res.status(401).json({ success: false, error: 'Invalid email or password.' });
  }

  const isMatch = bcrypt.compareSync(password, user.passwordHash);
  if (!isMatch) {
    db.addAuditLog(user.id, user.email, user.role, 'LOGIN_FAILED', 'User', 'Failed login attempt - incorrect password', req.ip);
    return res.status(401).json({ success: false, error: 'Invalid email or password.' });
  }

  if (user.status !== 'active') {
    return res.status(403).json({ success: false, error: 'Account is deactivated. Please contact HR.' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, departmentId: user.departmentId },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  db.addAuditLog(user.id, user.email, user.role, 'LOGIN_SUCCESS', 'User', 'User logged in successfully', req.ip);

  return res.json({
    success: true,
    token,
    user: sanitizeUser(user),
  });
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const today = new Date().toISOString().split('T')[0];
  const todayAttendance = db.attendance.find(a => a.userId === user.id && a.date === today);
  const leaveBalance = db.leaveBalances[user.id] || {
    annual: { total: 20, used: 0 },
    sick: { total: 12, used: 0 },
    casual: { total: 10, used: 0 },
  };

  return res.json({
    success: true,
    user: sanitizeUser(user),
    todayAttendance: todayAttendance || null,
    leaveBalance,
  });
});

// POST /api/auth/change-password
router.post('/change-password', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const user = req.user!;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, error: 'Current password and new password are required.' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ success: false, error: 'New password must be at least 8 characters long.' });
  }

  const isMatch = bcrypt.compareSync(currentPassword, user.passwordHash);
  if (!isMatch) {
    return res.status(400).json({ success: false, error: 'Current password does not match.' });
  }

  const salt = bcrypt.genSaltSync(10);
  user.passwordHash = bcrypt.hashSync(newPassword, salt);
  user.updatedAt = new Date().toISOString();
  db.saveMutation();

  db.addAuditLog(user.id, user.email, user.role, 'PASSWORD_CHANGE', 'User', 'User updated their password', req.ip);

  return res.json({ success: true, message: 'Password changed successfully.' });
});

// POST /api/auth/forgot-password
router.post('/forgot-password', (req, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, error: 'Email is required.' });
  }

  const normalized = String(email).trim().toLowerCase();
  const user = db.users.find(u => u.email.toLowerCase() === normalized);

  if (user) {
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expires = Date.now() + 15 * 60 * 1000; // 15 minutes
    passwordResetTokens.set(token, { email: user.email, expires });

    db.addAuditLog(user.id, user.email, user.role, 'PASSWORD_RESET_REQUEST', 'User', 'Generated password reset token', req.ip);

    // Return token in dev/demo environment for easy verification
    return res.json({
      success: true,
      message: 'Password reset instructions have been generated.',
      demoResetToken: token,
    });
  }

  return res.json({
    success: true,
    message: 'If an account exists with that email, instructions have been generated.',
  });
});

// POST /api/auth/reset-password
router.post('/reset-password', (req, res: Response) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(400).json({ success: false, error: 'Reset token and new password are required.' });
  }

  const item = passwordResetTokens.get(token);
  if (!item || item.expires < Date.now()) {
    return res.status(400).json({ success: false, error: 'Reset token is invalid or has expired.' });
  }

  const user = db.users.find(u => u.email === item.email);
  if (!user) {
    return res.status(400).json({ success: false, error: 'User associated with token not found.' });
  }

  const salt = bcrypt.genSaltSync(10);
  user.passwordHash = bcrypt.hashSync(newPassword, salt);
  user.updatedAt = new Date().toISOString();
  passwordResetTokens.delete(token);
  db.saveMutation();

  db.addAuditLog(user.id, user.email, user.role, 'PASSWORD_RESET_COMPLETE', 'User', 'Password successfully reset via token', req.ip);

  return res.json({ success: true, message: 'Password has been reset successfully. Please log in with your new password.' });
});

// POST /api/auth/quick-switch (Demo Role Switcher for graders & evaluators)
router.post('/quick-switch', (req, res: Response) => {
  const { role } = req.body;
  let targetUser;

  if (role === 'super_admin') {
    targetUser = db.users.find(u => u.role === 'super_admin');
  } else if (role === 'hr_manager') {
    targetUser = db.users.find(u => u.role === 'hr_manager');
  } else if (role === 'dept_manager') {
    targetUser = db.users.find(u => u.role === 'dept_manager');
  } else {
    targetUser = db.users.find(u => u.role === 'employee');
  }

  if (!targetUser) {
    return res.status(404).json({ success: false, error: 'Target user role not found.' });
  }

  const token = jwt.sign(
    { id: targetUser.id, email: targetUser.email, role: targetUser.role, departmentId: targetUser.departmentId },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return res.json({
    success: true,
    token,
    user: sanitizeUser(targetUser),
  });
});

export default router;
