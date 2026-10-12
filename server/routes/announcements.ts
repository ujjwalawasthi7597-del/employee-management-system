import { Router, Response } from 'express';
import { db, Announcement } from '../db/database';
import { authenticateToken, AuthenticatedRequest, requireRoles } from '../middleware/auth';

const router = Router();

// GET /api/announcements
router.get('/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  let list = db.announcements.filter(a => {
    if (a.targetAudience === 'all') return true;
    if (user.role === 'super_admin' || user.role === 'hr_manager') return true;
    if (a.targetAudience === 'engineering' && user.departmentName.toLowerCase().includes('engineer')) return true;
    if (a.targetAudience === 'leadership' && ['super_admin', 'hr_manager', 'dept_manager'].includes(user.role)) return true;
    return false;
  });

  // Sort pinned first, then newest
  list.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return res.json({ success: true, announcements: list });
});

// POST /api/announcements
router.post('/', authenticateToken, requireRoles('super_admin', 'hr_manager', 'dept_manager'), (req: AuthenticatedRequest, res: Response) => {
  const reqUser = req.user!;
  const { title, content, priority = 'normal', targetAudience = 'all', isPinned = false } = req.body;

  if (!title || !content) {
    return res.status(400).json({ success: false, error: 'Title and content are required.' });
  }

  const newAnnouncement: Announcement = {
    id: `anc-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    title,
    content,
    authorId: reqUser.id,
    authorName: `${reqUser.firstName} ${reqUser.lastName}`,
    authorRole: reqUser.title,
    priority,
    targetAudience,
    isPinned: Boolean(isPinned),
    createdAt: new Date().toISOString(),
  };

  db.announcements.unshift(newAnnouncement);
  db.saveMutation();

  db.addAuditLog(reqUser.id, reqUser.email, reqUser.role, 'PUBLISH_ANNOUNCEMENT', 'Announcement', `Published notice: ${newAnnouncement.title}`, req.ip);

  return res.status(201).json({ success: true, announcement: newAnnouncement });
});

// DELETE /api/announcements/:id
router.delete('/:id', authenticateToken, requireRoles('super_admin', 'hr_manager'), (req: AuthenticatedRequest, res: Response) => {
  const reqUser = req.user!;
  const id = req.params.id;

  const idx = db.announcements.findIndex(a => a.id === id);
  if (idx === -1) {
    return res.status(404).json({ success: false, error: 'Announcement not found.' });
  }

  const [removed] = db.announcements.splice(idx, 1);
  db.saveMutation();

  db.addAuditLog(reqUser.id, reqUser.email, reqUser.role, 'DELETE_ANNOUNCEMENT', 'Announcement', `Deleted announcement: ${removed.title}`, req.ip);

  return res.json({ success: true, message: 'Announcement deleted.' });
});

export default router;
