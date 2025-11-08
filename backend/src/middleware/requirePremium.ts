import { Request, Response, NextFunction } from "express";
import { User } from "../models/User";

export async function requirePremium(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).auth?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    
    const user = await User.findById(userId).select("access");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    if (user.access !== "premium") {
      return res.status(403).json({ 
        message: "Premium access required",
        code: "PREMIUM_REQUIRED"
      });
    }
    
    next();
  } catch {
    return res.status(500).json({ message: "Internal error" });
  }
}

