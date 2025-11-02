// src/middlewares/auth.ts
import { Request, Response, NextFunction } from 'express';

export interface AuthUser {
  id: string;
  name: string;
  role: 'admin' | 'teacher' | 'student';
}

/**
 * Demo auth (dev):
 * Lấy user từ header x-user-id / x-user-name / x-user-role
 * Prod: thay bằng verify JWT của bạn rồi gán req.user
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const id = req.header('x-user-id');
  let name = req.header('x-user-name') || 'Guest';
  const role = (req.header('x-user-role') as AuthUser['role']) || 'student';

  // Decode base64 encoded name if present
  if (req.header('x-user-name-encoded') === 'base64' && name && name !== 'Guest') {
    try {
      name = Buffer.from(name, 'base64').toString('utf8');
    } catch (e) {
      console.warn('Failed to decode base64 name, using as-is:', e);
    }
  }

  if (!id) return res.status(401).json({ message: 'Unauthorized' });

  req.user = { id, name, role };
  next();
}
