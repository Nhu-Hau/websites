// backend/src/controllers/badge.controller.ts
import { Request, Response } from "express";
import { Types } from "mongoose";
import { checkAndAwardBadges, getUserBadges } from "../services/badge.service";

/**
 * GET /api/badges
 * Lấy danh sách badges của user hiện tại
 */
export async function getMyBadges(req: Request, res: Response) {
  try {
    const userId = (req as any).auth?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Bạn chưa đăng nhập" });
    }

    const badges = await getUserBadges(new Types.ObjectId(userId));

    return res.json({
      badges,
      total: badges.length,
    });
  } catch (error) {
    console.error("[getMyBadges] ERROR", error);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
}

/**
 * POST /api/badges/check
 * Kiểm tra và cấp badges mới (thường được gọi sau khi submit test)
 * @returns Danh sách badges mới được cấp
 */
export async function checkBadges(req: Request, res: Response) {
  try {
    const userId = (req as any).auth?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Bạn chưa đăng nhập" });
    }

    const newBadges = await checkAndAwardBadges(new Types.ObjectId(userId));

    return res.json({
      newBadges,
      count: newBadges.length,
    });
  } catch (error) {
    console.error("[checkBadges] ERROR", error);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
}


