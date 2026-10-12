import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db, User, UserRole } from '../db/database';
import { authenticateToken, AuthenticatedRequest, requireRoles } from '../middleware/auth';

const router = Router();

function sanitizeUser(user: any) {
  const { passwordHash, ...rest } = user;
  return rest;
}

// GET /api/users - List users with scoping
router.get('/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { departmentId, search, status } = req.query;

  let list = db.users;

  // Role scoping: Department manager sees their department; Employee sees directory (active only)
  if (user.role === 'dept_manager') {
    list = list.filter(u => u.departmentId === user.departmentId);
  }

  if (departmentId) {
    list = list.filter(u => u.departmentId === departmentId);
  }

  if (status) {
    list = list.filter(u => u.status === status);
  }

  if (search) {
    const q = String(search).toLowerCase();
    list = list.filter(u =>
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.title.toLowerCase().includes(q)
    );
  }

  return res.json({
    success: true,
    users: list.map(sanitizeUser),
  });
});

// GET /api/users/:id - Get specific user profile
router.get('/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const targetId = req.params.id;

  const target = db.users.find(u => u.id === targetId);
  if (!target) {
    return res.status(404).json({ success: false, error: 'Employee not found.' });
  }

  // Dept managers cannot inspect employees outside their department
  if (user.role === 'dept_manager' && target.departmentId !== user.departmentId) {
    return res.status(403).json({ success: false, error: 'Access restricted to your authorized department hierarchy.' });
  }

  const leaveBalance = db.leaveBalances[target.id] || {
    annual: { total: 20, used: 0 },
    sick: { total: 12, used: 0 },
    casual: { total: 10, used: 0 },
  };

  const recentReviews = db.performanceReviews.filter(r => r.employeeId === target.id);
  const assignedTasks = db.tasks.filter(t => t.assigneeId === target.id);

  return res.json({
    success: true,
    user: sanitizeUser(target),
    leaveBalance,
    recentReviews,
    assignedTasks,
  });
});

// POST /api/users - Create new employee profile (Super Admin & HR Manager)
router.post('/', authenticateToken, requireRoles('super_admin', 'hr_manager'), (req: AuthenticatedRequest, res: Response) => {
  const reqUser = req.user!;
  const {
    email,
    password = 'Password@123',
    role = 'employee',
    firstName,
    lastName,
    title,
    departmentId,
    phone,
    joinDate = new Date().toISOString().split('T')[0],
    location = 'HQ',
    reportsToId,
    avatarUrl,
  } = req.body;

  if (!email || !firstName || !lastName || !title || !departmentId) {
    return res.status(400).json({ success: false, error: 'Email, First Name, Last Name, Title, and Department are required.' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  if (db.users.some(u => u.email.toLowerCase() === normalizedEmail)) {
    return res.status(400).json({ success: false, error: 'An employee with this email already exists.' });
  }

  // Only super_admin can create super_admin or hr_manager roles
  if ((role === 'super_admin' || role === 'hr_manager') && reqUser.role !== 'super_admin') {
    return res.status(403).json({ success: false, error: 'Only Super Admin can provision administrative or HR roles.' });
  }

  const dept = db.departments.find(d => d.id === departmentId);
  const departmentName = dept ? dept.name : 'General';

  let reportsToName = undefined;
  if (reportsToId) {
    const mgr = db.users.find(u => u.id === reportsToId);
    if (mgr) reportsToName = `${mgr.firstName} ${mgr.lastName}`;
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);

  const newUser: User = {
    id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    email: normalizedEmail,
    passwordHash,
    role: role as UserRole,
    firstName,
    lastName,
    title,
    departmentId,
    departmentName,
    avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(firstName + ' ' + lastName)}`,
    status: 'active',
    phone,
    joinDate,
    location,
    reportsToId,
    reportsToName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.users.push(newUser);

  // Initialize leave balance
  db.leaveBalances[newUser.id] = {
    userId: newUser.id,
    annual: { total: 20, used: 0 },
    sick: { total: 12, used: 0 },
    casual: { total: 10, used: 0 },
  };

  if (dept) {
    dept.employeeCount += 1;
  }

  db.saveMutation();
  db.addAuditLog(reqUser.id, reqUser.email, reqUser.role, 'CREATE_USER', 'User', `Created employee ${newUser.firstName} ${newUser.lastName} (${newUser.email}) with role ${newUser.role}`, req.ip);

  return res.status(201).json({
    success: true,
    user: sanitizeUser(newUser),
  });
});

// PUT /api/users/:id - Update employee profile
router.put('/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const reqUser = req.user!;
  const targetId = req.params.id;
  const target = db.users.find(u => u.id === targetId);

  if (!target) {
    return res.status(404).json({ success: false, error: 'Employee not found.' });
  }

  // Employee can only update own phone, location, avatar
  const isSelf = reqUser.id === targetId;
  const isPrivileged = reqUser.role === 'super_admin' || reqUser.role === 'hr_manager';

  if (!isSelf && !isPrivileged) {
    return res.status(403).json({ success: false, error: 'You do not have permission to modify this employee profile.' });
  }

  const {
    firstName,
    lastName,
    title,
    departmentId,
    role,
    status,
    phone,
    location,
    avatarUrl,
    reportsToId,
  } = req.body;

  if (isSelf && !isPrivileged) {
    // Limited fields for self
    if (phone !== undefined) target.phone = phone;
    if (location !== undefined) target.location = location;
    if (avatarUrl !== undefined) target.avatarUrl = avatarUrl;
  } else {
    // Admin / HR full fields
    if (firstName) target.firstName = firstName;
    if (lastName) target.lastName = lastName;
    if (title) target.title = title;
    if (phone !== undefined) target.phone = phone;
    if (location !== undefined) target.location = location;
    if (avatarUrl !== undefined) target.avatarUrl = avatarUrl;

    if (departmentId && departmentId !== target.departmentId) {
      const oldDept = db.departments.find(d => d.id === target.departmentId);
      const newDept = db.departments.find(d => d.id === departmentId);
      if (oldDept) oldDept.employeeCount = Math.max(0, oldDept.employeeCount - 1);
      if (newDept) {
        newDept.employeeCount += 1;
        target.departmentName = newDept.name;
      }
      target.departmentId = departmentId;
    }

    if (role && role !== target.role) {
      if (reqUser.role !== 'super_admin') {
        return res.status(403).json({ success: false, error: 'Only Super Admin can modify system roles.' });
      }
      target.role = role as UserRole;
    }

    if (status && status !== target.status) {
      target.status = status;
    }

    if (reportsToId !== undefined) {
      target.reportsToId = reportsToId;
      const mgr = db.users.find(u => u.id === reportsToId);
      target.reportsToName = mgr ? `${mgr.firstName} ${mgr.lastName}` : undefined;
    }
  }

  target.updatedAt = new Date().toISOString();
  db.saveMutation();

  db.addAuditLog(reqUser.id, reqUser.email, reqUser.role, 'UPDATE_USER', 'User', `Updated profile of ${target.firstName} ${target.lastName}`, req.ip);

  return res.json({
    success: true,
    user: sanitizeUser(target),
  });
});

// DELETE /api/users/:id - Deactivate employee (Super Admin only)
router.delete('/:id', authenticateToken, requireRoles('super_admin'), (req: AuthenticatedRequest, res: Response) => {
  const reqUser = req.user!;
  const targetId = req.params.id;

  if (targetId === reqUser.id) {
    return res.status(400).json({ success: false, error: 'Super Admin cannot deactivate their own account.' });
  }

  const target = db.users.find(u => u.id === targetId);
  if (!target) {
    return res.status(404).json({ success: false, error: 'Employee not found.' });
  }

  target.status = 'inactive';
  target.updatedAt = new Date().toISOString();
  db.saveMutation();

  db.addAuditLog(reqUser.id, reqUser.email, reqUser.role, 'DEACTIVATE_USER', 'User', `Deactivated employee ${target.firstName} ${target.lastName}`, req.ip);

  return res.json({ success: true, message: `Employee ${target.firstName} ${target.lastName} has been deactivated.` });
});

export default router;
