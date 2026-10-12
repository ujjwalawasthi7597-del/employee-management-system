import { Router, Response } from 'express';
import { db, PayrollRecord } from '../db/database';
import { authenticateToken, AuthenticatedRequest, requireRoles } from '../middleware/auth';

const router = Router();

// GET /api/payroll - Scoped payroll records
router.get('/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { month, userId } = req.query;

  // Department managers are strictly blocked from organizational payroll data!
  if (user.role === 'dept_manager') {
    // A dept manager can only see their OWN payroll slip, never team members' payroll!
    let mySlips = db.payroll.filter(p => p.userId === user.id);
    if (month) mySlips = mySlips.filter(p => p.month === month);
    return res.json({ success: true, records: mySlips });
  }

  // Regular employee can only see their OWN payslips
  if (user.role === 'employee') {
    let mySlips = db.payroll.filter(p => p.userId === user.id);
    if (month) mySlips = mySlips.filter(p => p.month === month);
    return res.json({ success: true, records: mySlips });
  }

  // Super Admin & HR Manager have full access
  let list = [...db.payroll];
  if (userId) {
    list = list.filter(p => p.userId === userId);
  }
  if (month) {
    list = list.filter(p => p.month === month);
  }

  list.sort((a, b) => b.month.localeCompare(a.month));

  return res.json({ success: true, records: list });
});

// GET /api/payroll/:id - Get specific payslip details
router.get('/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const recordId = req.params.id;

  const record = db.payroll.find(p => p.id === recordId);
  if (!record) {
    return res.status(404).json({ success: false, error: 'Payslip record not found.' });
  }

  // Confidentiality check:
  if ((user.role === 'employee' || user.role === 'dept_manager') && record.userId !== user.id) {
    return res.status(403).json({ success: false, error: 'Confidential: You cannot view other employees’ compensation slips.' });
  }

  const employee = db.users.find(u => u.id === record.userId);

  return res.json({
    success: true,
    record,
    employee: employee ? {
      name: `${employee.firstName} ${employee.lastName}`,
      email: employee.email,
      title: employee.title,
      departmentName: employee.departmentName,
      joinDate: employee.joinDate,
      location: employee.location,
    } : null,
  });
});

// POST /api/payroll - Create / process payroll (Super Admin & HR Manager)
router.post('/', authenticateToken, requireRoles('super_admin', 'hr_manager'), (req: AuthenticatedRequest, res: Response) => {
  const reqUser = req.user!;
  const {
    userId,
    month, // YYYY-MM
    basicSalary,
    hra = 0,
    transport = 0,
    medical = 0,
    performanceBonus = 0,
    tax = 0,
    providentFund = 0,
    healthInsurance = 0,
    paymentMethod = 'direct_deposit',
  } = req.body;

  if (!userId || !month || basicSalary === undefined) {
    return res.status(400).json({ success: false, error: 'Employee ID, Month, and Basic Salary are required.' });
  }

  const employee = db.users.find(u => u.id === userId);
  if (!employee) {
    return res.status(404).json({ success: false, error: 'Target employee not found.' });
  }

  const existing = db.payroll.find(p => p.userId === userId && p.month === month);
  if (existing) {
    return res.status(400).json({ success: false, error: `Payroll record for ${employee.firstName} ${employee.lastName} in ${month} already exists.` });
  }

  const bSal = Number(basicSalary);
  const allowances = {
    hra: Number(hra),
    transport: Number(transport),
    medical: Number(medical),
    performanceBonus: Number(performanceBonus),
  };
  const deductions = {
    tax: Number(tax),
    providentFund: Number(providentFund),
    healthInsurance: Number(healthInsurance),
  };

  const totalAllowances = allowances.hra + allowances.transport + allowances.medical + allowances.performanceBonus;
  const totalDeductions = deductions.tax + deductions.providentFund + deductions.healthInsurance;
  const grossSalary = bSal + totalAllowances;
  const netSalary = grossSalary - totalDeductions;

  const newRecord: PayrollRecord = {
    id: `pr-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    userId,
    userName: `${employee.firstName} ${employee.lastName}`,
    departmentId: employee.departmentId,
    month,
    basicSalary: bSal,
    allowances,
    deductions,
    grossSalary,
    netSalary,
    status: 'processed',
    paymentMethod,
    payslipNumber: `SLIP-${month.replace('-', '')}-${Math.floor(100 + Math.random() * 900)}`,
    createdAt: new Date().toISOString(),
  };

  db.payroll.unshift(newRecord);
  db.saveMutation();

  db.addAuditLog(reqUser.id, reqUser.email, reqUser.role, 'CREATE_PAYROLL', 'PayrollRecord', `Generated payslip ${newRecord.payslipNumber} for ${newRecord.userName} ($${netSalary} net)`, req.ip);

  return res.status(201).json({ success: true, record: newRecord });
});

// PUT /api/payroll/:id/pay - Mark payroll as paid
router.put('/:id/pay', authenticateToken, requireRoles('super_admin', 'hr_manager'), (req: AuthenticatedRequest, res: Response) => {
  const reqUser = req.user!;
  const recordId = req.params.id;
  const record = db.payroll.find(p => p.id === recordId);

  if (!record) {
    return res.status(404).json({ success: false, error: 'Payroll record not found.' });
  }

  record.status = 'paid';
  record.paymentDate = new Date().toISOString().split('T')[0];
  db.saveMutation();

  db.addAuditLog(reqUser.id, reqUser.email, reqUser.role, 'DISBURSE_PAYROLL', 'PayrollRecord', `Marked payslip ${record.payslipNumber} as paid for ${record.userName}`, req.ip);

  return res.json({ success: true, record });
});

export default router;
