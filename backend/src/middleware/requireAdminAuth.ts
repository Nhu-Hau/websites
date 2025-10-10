import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  try {
    // Check for admin token in cookies
    const adminToken = req.cookies.adminToken;
    
    if (!adminToken) {
      return res.status(401).json({ message: "Admin authentication required" });
    }

    // Verify admin token
    const decoded = jwt.verify(adminToken, process.env.JWT_SECRET || "fallback-secret") as any;
    
    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    // Add admin info to request
    req.auth = {
      userId: decoded.userId,
      role: decoded.role,
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid admin token" });
  }
}
