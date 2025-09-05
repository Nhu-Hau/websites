// src/middleware/requireAuth.ts
import { Request, Response, NextFunction } from "express";
import { accessCookieName } from "../config/cookies";
import { verifyAccessToken } from "../lib/jwt";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[accessCookieName];
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const payload = verifyAccessToken(token); // giải mã JWT
    (req as any).auth = { userId: payload.id, role: payload.role }; // gắn user info vào req
    next(); // cho đi tiếp
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
}
