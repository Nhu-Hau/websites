import { Request, Response, NextFunction } from "express";
import { User } from "../models/User";

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).auth?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const user = await User.findById(userId).select("role");
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  } catch {
    return res.status(500).json({ message: "Internal error" });
  }
}


