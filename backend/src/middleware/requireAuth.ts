// src/middleware/requireAuth.ts
import { Request, Response, NextFunction } from "express";
import { accessCookieName } from "../config/cookies";
import { verifyAccessToken } from "../lib/jwt";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[accessCookieName];
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const payload = verifyAccessToken(token); // trả { id, role }
    (req as any).auth = { userId: payload.id, role: payload.role };
    next(); // cho đi tiếp
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
}
