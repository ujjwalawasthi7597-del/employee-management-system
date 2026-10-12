import { Router, Response } from 'express';
import { db, Department } from '../db/database';
import { authenticateToken, AuthenticatedRequest, requireRoles } from '../middleware/auth';

const router = Router();

// GET /api/departments
router.get('/', authenticateToken, (_req: AuthenticatedRequest, res: Response) => {
  // Re-compute employeeCount dynamically
  const list = db.departments.map(dept => {
    const count = db.users.filter(u => u.departmentId === dept.id && u.status === 'active').length;
    return { ...dept, employeeCount: count };
  });

  return res.json({ success: true, departments: list });
});

// POST /api/departments (Super Admin only)
router.post('/', authenticateToken, requireRoles('super_admin'), (req: AuthenticatedRequest, res: Response) => {
  const reqUser = req.user!;
  const { name, code, description, headId, budget = 100000 } = req.body;

  if (!name || !code) {
    return res.status(400).json({ success: false, error: 'Department name and code are required.' });
  }

  const existing = db.departments.find(d => d.code.toUpperCase() === code.toUpperCase());
  if (existing) {
    return res.status(400).json({ success: false, error: 'A department with this code already exists.' });
  }

  let headName = undefined;
  if (headId) {
    const headUser = db.users.find(u => u.id === headId);
    if (headUser) headName = `${headUser.firstName} ${headUser.lastName}`;
  }

  const newDept: Department = {
    id: `dept-${code.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
    name,
    code: code.toUpperCase(),
    headId,
    headName,
    description: description || '',
    employeeCount: 0,
    budget: Number(budget),
    createdAt: new Date().toISOString(),
  };

  db.departments.push(newDept);
  db.saveMutation();

  db.addAuditLog(reqUser.id, reqUser.email, reqUser.role, 'CREATE_DEPARTMENT', 'Department', `Created department ${newDept.name} (${newDept.code})`, req.ip);

  return res.status(201).json({ success: true, department: newDept });
});

// PUT /api/departments/:id (Super Admin only)
router.put('/:id', authenticateToken, requireRoles('super_admin'), (req: AuthenticatedRequest, res: Response) => {
  const reqUser = req.user!;
  const deptId = req.params.id;
  const dept = db.departments.find(d => d.id === deptId);

  if (!dept) {
    return res.status(404).json({ success: false, error: 'Department not found.' });
  }

  const { name, description, headId, budget } = req.body;
  if (name) dept.name = name;
  if (description !== undefined) dept.description = description;
  if (budget !== undefined) dept.budget = Number(budget);

  if (headId !== undefined) {
    dept.headId = headId;
    const headUser = db.users.find(u => u.id === headId);
    dept.headName = headUser ? `${headUser.firstName} ${headUser.lastName}` : undefined;
  }

  db.saveMutation();
  db.addAuditLog(reqUser.id, reqUser.email, reqUser.role, 'UPDATE_DEPARTMENT', 'Department', `Updated department ${dept.name}`, req.ip);

  return res.json({ success: true, department: dept });
});

export default router;
