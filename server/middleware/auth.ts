import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db, User, UserRole } from '../db/database';

export const JWT_SECRET = process.env.JWT_SECRET || 'talentgrid-enterprise-super-secret-key-2026';
export const JWT_EXPIRES_IN = '24h';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Authentication token required.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: UserRole };
    const user = db.users.find(u => u.id === decoded.id);

    if (!user) {
      return res.status(401).json({ success: false, error: 'User account not found.' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ success: false, error: 'Account is deactivated or suspended. Please contact HR.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, error: 'Invalid or expired session token. Please log in again.' });
  }
}

export function requireRoles(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Permission denied. Access requires one of: ${allowedRoles.join(', ')}. Your role is: ${req.user.role}.`,
      });
    }

    next();
  };
}

export function canAccessEmployeeData(reqUser: User, targetEmployeeId: string): boolean {
  if (reqUser.role === 'super_admin' || reqUser.role === 'hr_manager') {
    return true;
  }
  if (reqUser.id === targetEmployeeId) {
    return true;
  }
  if (reqUser.role === 'dept_manager') {
    const target = db.users.find(u => u.id === targetEmployeeId);
    return target ? target.departmentId === reqUser.departmentId : false;
  }
  return false;
}
