import { Request, Response, NextFunction } from "express";
import { accessCookieName } from "../config/cookies";
import { verifyAccessToken } from "../lib/jwt";

/**
 * Nếu có cookie access token hợp lệ -> gắn req.auth
 * Nếu không có/không hợp lệ -> cho qua như khách
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[accessCookieName];
  if (!token) return next();

  try {
    const payload = verifyAccessToken(token);
    (req as any).auth = { userId: payload.id, role: payload.role };
  } catch {
    // token hỏng => bỏ qua
  }
  next();
}