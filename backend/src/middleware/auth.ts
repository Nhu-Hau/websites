// src/middlewares/auth.ts
import { Request, Response, NextFunction } from 'express';

export interface AuthUser {
  id: string;
  name: string;
  role: 'admin' | 'teacher' | 'student';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * Demo auth (dev):
 * Lấy user từ header x-user-id / x-user-name / x-user-role
 * Prod: thay bằng verify JWT của bạn rồi gán req.user
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const id = req.header('x-user-id');
  const name = req.header('x-user-name') || 'Guest';
  const role = (req.header('x-user-role') as AuthUser['role']) || 'student';

  if (!id) return res.status(401).json({ message: 'Unauthorized' });

  req.user = { id, name, role };
  next();
}
