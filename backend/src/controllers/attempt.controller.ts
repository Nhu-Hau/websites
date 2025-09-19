// src/controllers/attempt.controller.ts
import { Request, Response, NextFunction } from "express";
import Attempt from "../models/Attempt";
import {
  fetchItemsMap,
  gradeAnswers,
  breakdownByPart,
  breakdownByTag,
  attachLabelsToTags,
} from "../lib/gradeAndAggregate";

/**
 * POST /api/attempts
 * Body:
 * {
 *   userId: string,
 *   testId: string,
 *   startedAt?: string,
 *   answers: [{ itemId: string, choice: 'A'|'B'|'C'|'D', timeSec?: number }]
 * }
 */
export async function submitAttempt(
  req: Request,
  res: Response,
  _next: NextFunction
) {
  try {
    const { userId, testId, startedAt, answers } = req.body as {
      userId?: string;
      testId?: string;
      startedAt?: string;
      answers?: { itemId: string; choice: "A" | "B" | "C" | "D"; timeSec?: number }[];
    };

    if (!userId || !testId || !Array.isArray(answers) || answers.length === 0) {
      return res
        .status(400)
        .json({ message: "Thiếu userId/testId/answers" });
    }

    // 1) Lấy item & chấm điểm
    const itemIds = answers.map((a) => a.itemId);
    const itemsMap = await fetchItemsMap(itemIds);
    const graded = gradeAnswers(answers, itemsMap);

    // 2) Thống kê theo Part & Tag
    const byPart = breakdownByPart(graded.detailed);
    const byTag = attachLabelsToTags(breakdownByTag(graded.detailed));

    // 3) Lưu attempt
    const attemptId = `att_${Date.now()}`;
    await Attempt.create({
      attemptId,
      userId,
      testId,
      startedAt: startedAt ? new Date(startedAt) : new Date(),
      finishedAt: new Date(),
      answers: graded.detailed,
    });

    // 4) Trả kết quả
    return res.status(201).json({
      attemptId,
      score: {
        total: graded.total,
        correct: graded.correct,
        accuracy: graded.total ? graded.correct / graded.total : 0,
      },
      byPart,
      byTag,
      message: "Nộp bài và tính điểm thành công",
    });
  } catch (e) {
    return res.status(500).json({ message: "Lỗi khi nộp bài" });
  }
}

/**
 * GET /api/attempts/latest/:userId
 * Trả thống kê của lần làm bài gần nhất của user
 */
export async function latestAnalytics(
  req: Request,
  res: Response,
  _next: NextFunction
) {
  try {
    const { userId } = req.params as { userId?: string };
    if (!userId) {
      return res.status(400).json({ message: "Thiếu userId" });
    }

    const latest = await Attempt.findOne({ userId })
      .sort({ finishedAt: -1 })
      .lean();

    if (!latest) {
      return res.status(200).json({ message: "Chưa có bài làm nào" });
    }

    const byPart = breakdownByPart(latest.answers as any);
    const byTag = attachLabelsToTags(breakdownByTag(latest.answers as any));
    const total = latest.answers.length;
    const correct = (latest.answers as any[]).filter((a) => a.correct).length;

    return res.status(200).json({
      attemptId: latest.attemptId,
      score: { total, correct, accuracy: total ? correct / total : 0 },
      byPart,
      byTag,
    });
  } catch (e) {
    return res.status(500).json({ message: "Lỗi khi lấy thống kê" });
  }
}