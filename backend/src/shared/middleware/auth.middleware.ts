// backend/src/shared/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from "express";
import { accessCookieName } from "../../config/cookies";
import { verifyAccessToken } from "../../shared/services/jwt.service";
import { User } from "../../shared/models/User";
import jwt from "jsonwebtoken";

/**
 * Extract token from request - supports both cookie and Bearer token
 */
function extractToken(req: Request): string | null {
  // 1. Try Bearer token from Authorization header (for mobile apps)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  
  // 2. Fallback to cookie (for web)
  const token = req.cookies?.[accessCookieName];
  return token || null;
}

/**
 * Require authentication - returns 401 if no valid token
 * Supports both cookie-based (web) and Bearer token (mobile) authentication
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = extractToken(req);
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
 * Supports both cookie-based (web) and Bearer token (mobile) authentication
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = extractToken(req);
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
 * Supports both cookie-based (web) and Bearer token (mobile) authentication
 */
export function attachAuthIfPresent(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  try {
    const token = extractToken(req);
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
 * Require admin authentication via admin token cookie or Bearer token
 * Supports both cookie-based (web) and Bearer token (mobile) authentication
 */
export function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  try {
    // Try Bearer token first (for mobile)
    const authHeader = req.headers.authorization;
    let adminToken: string | undefined;
    
    if (authHeader && authHeader.startsWith("Bearer ")) {
      adminToken = authHeader.substring(7);
    } else {
      // Fallback to cookie (for web)
      adminToken = req.cookies.adminToken;
    }
    
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
      userId: decoded.userId || decoded.id,
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
