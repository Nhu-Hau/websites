import { Request, Response, NextFunction } from "express";
import { accessCookieName } from "../config/cookies";
import { verifyAccessToken } from "../lib/jwt";

/**
 * Nếu có cookie hợp lệ thì gắn req.auth.userId,
 * nếu không thì next() (không lỗi 401)
 */
export function attachAuthIfPresent(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  try {
    const token = req.cookies?.[accessCookieName];
    if (token) {
      const payload = verifyAccessToken(token);
      (req as any).auth = { userId: payload.id, role: payload.role };
    }
  } catch {
    /* ignore */
  }
  next();
}
