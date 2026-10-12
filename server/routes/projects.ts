import { Router, Response } from 'express';
import { db, Project, Task } from '../db/database';
import { authenticateToken, AuthenticatedRequest, requireRoles } from '../middleware/auth';

const router = Router();

// GET /api/projects
router.get('/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  let list = [...db.projects];

  if (user.role === 'dept_manager') {
    list = list.filter(p => p.departmentId === user.departmentId || p.leadId === user.id);
  } else if (user.role === 'employee') {
    list = list.filter(p => p.members.includes(user.id) || p.departmentId === user.departmentId);
  }

  return res.json({ success: true, projects: list });
});

// POST /api/projects
router.post('/', authenticateToken, requireRoles('super_admin', 'hr_manager', 'dept_manager'), (req: AuthenticatedRequest, res: Response) => {
  const reqUser = req.user!;
  const { name, description, departmentId, leadId, priority = 'medium', startDate, dueDate, members = [] } = req.body;

  if (!name || !description || !startDate || !dueDate) {
    return res.status(400).json({ success: false, error: 'Name, description, start date, and due date are required.' });
  }

  const dept = db.departments.find(d => d.id === (departmentId || reqUser.departmentId));
  const leadUser = db.users.find(u => u.id === (leadId || reqUser.id));

  const newProject: Project = {
    id: `proj-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    name,
    description,
    departmentId: dept ? dept.id : reqUser.departmentId,
    departmentName: dept ? dept.name : reqUser.departmentName,
    leadId: leadUser ? leadUser.id : reqUser.id,
    leadName: leadUser ? `${leadUser.firstName} ${leadUser.lastName}` : `${reqUser.firstName} ${reqUser.lastName}`,
    status: 'planning',
    priority,
    startDate,
    dueDate,
    progress: 0,
    members: members.length > 0 ? members : [reqUser.id],
    createdAt: new Date().toISOString(),
  };

  db.projects.unshift(newProject);
  db.saveMutation();

  db.addAuditLog(reqUser.id, reqUser.email, reqUser.role, 'CREATE_PROJECT', 'Project', `Created project: ${newProject.name}`, req.ip);

  return res.status(201).json({ success: true, project: newProject });
});

// GET /api/projects/tasks - List tasks
router.get('/tasks', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { projectId, status, priority, assigneeId } = req.query;

  let list = [...db.tasks];

  if (user.role === 'employee') {
    // Show tasks assigned to them, or from their projects
    list = list.filter(t => t.assigneeId === user.id || db.projects.find(p => p.id === t.projectId && p.members.includes(user.id)));
  }

  if (projectId) {
    list = list.filter(t => t.projectId === projectId);
  }

  if (status) {
    list = list.filter(t => t.status === status);
  }

  if (priority) {
    list = list.filter(t => t.priority === priority);
  }

  if (assigneeId) {
    list = list.filter(t => t.assigneeId === assigneeId);
  }

  return res.json({ success: true, tasks: list });
});

// POST /api/projects/tasks - Create task
router.post('/tasks', authenticateToken, requireRoles('super_admin', 'hr_manager', 'dept_manager'), (req: AuthenticatedRequest, res: Response) => {
  const reqUser = req.user!;
  const { projectId, title, description, assigneeId, priority = 'medium', dueDate } = req.body;

  if (!projectId || !title || !assigneeId || !dueDate) {
    return res.status(400).json({ success: false, error: 'Project, title, assignee, and due date are required.' });
  }

  const project = db.projects.find(p => p.id === projectId);
  if (!project) {
    return res.status(404).json({ success: false, error: 'Project not found.' });
  }

  const assignee = db.users.find(u => u.id === assigneeId);
  if (!assignee) {
    return res.status(404).json({ success: false, error: 'Assignee user not found.' });
  }

  const newTask: Task = {
    id: `tsk-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    projectId,
    projectName: project.name,
    title,
    description: description || '',
    assigneeId: assignee.id,
    assigneeName: `${assignee.firstName} ${assignee.lastName}`,
    assigneeAvatar: assignee.avatarUrl,
    createdById: reqUser.id,
    priority,
    status: 'todo',
    dueDate,
    createdAt: new Date().toISOString(),
  };

  db.tasks.unshift(newTask);

  // Add member to project if not already present
  if (!project.members.includes(assignee.id)) {
    project.members.push(assignee.id);
  }

  db.saveMutation();

  db.addAuditLog(reqUser.id, reqUser.email, reqUser.role, 'CREATE_TASK', 'Task', `Assigned task "${newTask.title}" to ${assignee.firstName} ${assignee.lastName}`, req.ip);

  return res.status(201).json({ success: true, task: newTask });
});

// PUT /api/projects/tasks/:id/status - Update task status
router.put('/tasks/:id/status', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const taskId = req.params.id;
  const { status } = req.body;

  if (!status || !['todo', 'in_progress', 'in_review', 'completed'].includes(status)) {
    return res.status(400).json({ success: false, error: 'Invalid task status.' });
  }

  const task = db.tasks.find(t => t.id === taskId);
  if (!task) {
    return res.status(404).json({ success: false, error: 'Task not found.' });
  }

  // Employee can update status of their own assigned tasks
  const isAssignee = task.assigneeId === user.id;
  const isManagerOrAdmin = ['super_admin', 'hr_manager', 'dept_manager'].includes(user.role);

  if (!isAssignee && !isManagerOrAdmin) {
    return res.status(403).json({ success: false, error: 'You are not authorized to update this task.' });
  }

  task.status = status;
  if (status === 'completed') {
    task.completedAt = new Date().toISOString();
  } else {
    task.completedAt = undefined;
  }

  // Recalculate project progress %
  const projectTasks = db.tasks.filter(t => t.projectId === task.projectId);
  if (projectTasks.length > 0) {
    const completedCount = projectTasks.filter(t => t.status === 'completed').length;
    const project = db.projects.find(p => p.id === task.projectId);
    if (project) {
      project.progress = Math.round((completedCount / projectTasks.length) * 100);
      if (project.progress === 100) project.status = 'completed';
      else if (project.status === 'planning') project.status = 'in_progress';
    }
  }

  db.saveMutation();

  return res.json({ success: true, task });
});

export default router;
