// backend/src/controllers/dashboard.controller.ts
import { Request, Response } from "express";
import { User } from "../models/User";
import { PracticeAttempt } from "../models/PracticeAttempt";
import { ProgressAttempt } from "../models/ProgressAttempt";
import { PlacementAttempt } from "../models/PlacementAttempt";

/**
 * GET /api/dashboard/activity
 * Lấy dữ liệu activity heatmap từ practice, progress, placement attempts
 */
export async function getActivityData(req: Request, res: Response) {
  try {
    const userId = (req as any).auth?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Bạn chưa đăng nhập" });
    }

    // Lấy tất cả attempts từ 3 collections
    const [practiceAttempts, progressAttempts, placementAttempts] =
      await Promise.all([
        PracticeAttempt.find({ userId })
          .select("submittedAt createdAt")
          .lean(),
        ProgressAttempt.find({ userId })
          .select("submittedAt createdAt")
          .lean(),
        PlacementAttempt.find({ userId })
          .select("submittedAt createdAt")
          .lean(),
      ]);

    // Gộp tất cả attempts và nhóm theo ngày
    const allAttempts: Array<{ date: Date }> = [
      ...practiceAttempts.map((a) => ({
        date: new Date(a.submittedAt || a.createdAt || Date.now()),
      })),
      ...progressAttempts.map((a) => ({
        date: new Date(a.submittedAt || a.createdAt || Date.now()),
      })),
      ...placementAttempts.map((a) => ({
        date: new Date(a.submittedAt || a.createdAt || Date.now()),
      })),
    ];

    // Nhóm theo ngày (YYYY-MM-DD)
    const activityMap = new Map<string, number>();
    for (const attempt of allAttempts) {
      const dateStr = attempt.date.toISOString().split("T")[0];
      activityMap.set(dateStr, (activityMap.get(dateStr) || 0) + 1);
    }

    // Chuyển thành array format cho heatmap
    const activityData = Array.from(activityMap.entries()).map(([date, count]) => ({
      date,
      count,
    }));

    // Tính streak (chuỗi ngày học liên tục)
    const sortedDates = Array.from(activityMap.keys()).sort();
    let currentStreak = 0;
    let maxStreak = 0;
    let tempStreak = 0;

    if (sortedDates.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split("T")[0];
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      // Tính current streak (từ hôm nay hoặc hôm qua)
      let checkDate = new Date(today);
      while (sortedDates.includes(checkDate.toISOString().split("T")[0])) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      }

      // Nếu hôm nay không có activity, kiểm tra từ hôm qua
      if (currentStreak === 0 && sortedDates.includes(yesterdayStr)) {
        checkDate = new Date(yesterday);
        while (sortedDates.includes(checkDate.toISOString().split("T")[0])) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        }
      }

      // Tính max streak
      for (let i = 0; i < sortedDates.length; i++) {
        if (i === 0) {
          tempStreak = 1;
        } else {
          const prevDate = new Date(sortedDates[i - 1]);
          const currDate = new Date(sortedDates[i]);
          const diffDays =
            (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
          if (diffDays === 1) {
            tempStreak++;
          } else {
            maxStreak = Math.max(maxStreak, tempStreak);
            tempStreak = 1;
          }
        }
      }
      maxStreak = Math.max(maxStreak, tempStreak);
    }

    const totalDays = activityMap.size;
    const totalAttempts = allAttempts.length;

    return res.json({
      activityData,
      stats: {
        totalDays,
        totalAttempts,
        currentStreak,
        maxStreak,
      },
    });
  } catch (e) {
    console.error("[getActivityData] ERROR", e);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
}

/**
 * GET /api/dashboard/goal
 * Lấy thông tin mục tiêu TOEIC và tính toán progress
 */
export async function getGoalData(req: Request, res: Response) {
  try {
    const userId = (req as any).auth?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Bạn chưa đăng nhập" });
    }

    const user = await User.findById(userId).select("toeicGoal toeicPred").lean() as any;
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    const goal = user.toeicGoal;
    const currentScore = user.toeicPred?.overall ?? null;

    if (!goal || goal.targetScore === null || goal.startScore === null) {
      return res.json({
        hasGoal: false,
        goal: null,
        currentScore,
        progress: null,
      });
    }

    // Tính progress: (điểm hiện tại - điểm khởi đầu) / (điểm mục tiêu - điểm khởi đầu) * 100
    let progress = 0;
    if (currentScore !== null) {
      const diff = goal.targetScore - goal.startScore;
      if (diff > 0) {
        progress = Math.min(
          100,
          Math.max(0, ((currentScore - goal.startScore) / diff) * 100)
        );
      }
    }

    return res.json({
      hasGoal: true,
      goal: {
        targetScore: goal.targetScore,
        startScore: goal.startScore,
        setAt: goal.setAt,
      },
      currentScore,
      progress: Math.round(progress * 10) / 10, // Làm tròn 1 chữ số thập phân
    });
  } catch (e) {
    console.error("[getGoalData] ERROR", e);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
}

/**
 * POST /api/dashboard/goal
 * Đặt mục tiêu TOEIC (chỉ cho phép sau khi có placement test)
 */
export async function setGoal(req: Request, res: Response) {
  try {
    const userId = (req as any).auth?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Bạn chưa đăng nhập" });
    }

    const { targetScore } = req.body;
    if (!targetScore || typeof targetScore !== "number" || targetScore < 10 || targetScore > 990) {
      return res.status(400).json({
        message: "Điểm mục tiêu phải là số từ 10 đến 990",
      });
    }

    const user = await User.findById(userId).select("toeicPred lastPlacementAttemptId").lean() as any;
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    // Kiểm tra đã có placement test chưa
    if (!user.lastPlacementAttemptId) {
      return res.status(400).json({
        message: "Bạn cần hoàn thành bài Placement Test trước khi đặt mục tiêu",
      });
    }

    // Lấy điểm hiện tại từ toeicPred hoặc từ placement test gần nhất
    let startScore = user.toeicPred?.overall ?? null;
    if (startScore === null) {
      // Nếu chưa có toeicPred, lấy từ placement attempt gần nhất
      const placementAttempt = await PlacementAttempt.findById(
        user.lastPlacementAttemptId
      )
        .select("predicted")
        .lean() as any;
      startScore = placementAttempt?.predicted?.overall ?? null;
    }

    if (startScore === null) {
      return res.status(400).json({
        message: "Không thể xác định điểm khởi đầu. Vui lòng làm lại placement test.",
      });
    }

    // Kiểm tra xem đã có goal chưa
    const existingUser = await User.findById(userId).select("toeicGoal").lean() as any;
    const existingGoal = existingUser?.toeicGoal;

    // Nếu đã có goal, giữ nguyên startScore và setAt ban đầu
    const finalStartScore = existingGoal?.startScore ?? startScore;
    const finalSetAt = existingGoal?.setAt ?? new Date();

    // Cập nhật goal
    await User.updateOne(
      { _id: userId },
      {
        $set: {
          toeicGoal: {
            targetScore,
            startScore: finalStartScore,
            setAt: finalSetAt,
          },
          updatedAt: new Date(),
        },
      }
    ).exec();

    return res.json({
      message: "Đã đặt mục tiêu thành công",
      goal: {
        targetScore,
        startScore,
        setAt: new Date(),
      },
    });
  } catch (e) {
    console.error("[setGoal] ERROR", e);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
}

