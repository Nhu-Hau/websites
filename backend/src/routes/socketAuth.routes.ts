import express from "express";
import { requireAuth } from "../middleware/requireAuth";
import { requireAdminAuth } from "../middleware/requireAdminAuth";
import jwt from "jsonwebtoken";

const router = express.Router();

// GET /api/socket-auth/token - Lấy token cho Socket.IO (user)
router.get("/token", requireAuth, async (req, res, next) => {
  try {
    const userId = req.auth?.userId;
    const role = req.auth?.role;
    
    if (!userId || !role) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Tạo token cho Socket.IO
    const token = jwt.sign(
      { userId, role },
      process.env.ACCESS_TOKEN_SECRET || "access_secret_dev",
      { expiresIn: "1h" } // Token ngắn hạn cho Socket.IO
    );

    res.json({ token });
  } catch (err) {
    next(err);
  }
});

// GET /api/socket-auth/admin-token - Lấy token cho Socket.IO (admin)
router.get("/admin-token", requireAdminAuth, async (req, res, next) => {
  try {
    const userId = req.auth?.userId;
    const role = req.auth?.role;
    
    if (!userId || !role) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Tạo token cho Socket.IO
    const token = jwt.sign(
      { userId, role },
      process.env.ACCESS_TOKEN_SECRET || "access_secret_dev",
      { expiresIn: "1h" } // Token ngắn hạn cho Socket.IO
    );

    res.json({ token });
  } catch (err) {
    next(err);
  }
});

export default router;
