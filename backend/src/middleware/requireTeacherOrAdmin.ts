import { Request, Response, NextFunction } from "express";
import { User } from "../models/User";

export async function requireTeacherOrAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).auth?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    
    const user = await User.findById(userId).select("role");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    if (user.role !== "teacher" && user.role !== "admin") {
      return res.status(403).json({ 
        message: "Only teachers and admins can create study rooms",
        code: "TEACHER_OR_ADMIN_REQUIRED"
      });
    }
    
    next();
  } catch {
    return res.status(500).json({ message: "Internal error" });
  }
}

