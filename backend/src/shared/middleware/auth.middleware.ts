// backend/src/shared/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from "express";
import { accessCookieName } from "../../config/cookies";
import { verifyAccessToken } from "../../shared/services/jwt.service";
import { User } from "../../shared/models/User";
import jwt from "jsonwebtoken";

/**
 * Require authentication - returns 401 if no valid token
 */
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

/**
 * Optional authentication - attaches auth if token is valid, otherwise continues as guest
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

/**
 * Attach auth if present - same as optionalAuth but with different naming
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

/**
 * Require admin role - checks if user is admin
 */
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

/**
 * Require admin authentication via admin token cookie
 */
export function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  try {
    // Check for admin token in cookies
    const adminToken = req.cookies.adminToken;
    
    if (!adminToken) {
      return res.status(401).json({ message: "Admin authentication required" });
    }

    // Verify admin token
    const decoded = jwt.verify(adminToken, process.env.ACCESS_TOKEN_SECRET || "access_secret_dev") as any;
    
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

/**
 * Require premium access
 */
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

/**
 * Require teacher or admin role
 */
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
