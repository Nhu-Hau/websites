// src/controllers/practice.controller.ts
import { Request, Response } from "express";
import mongoose, { Types } from "mongoose";
import { PracticeAttempt } from "../models/PracticeAttempt";
import { User } from "../models/User";

const PARTS_COLL = process.env.PARTS_COLL || "parts";

function toToeicStep5(raw: number, min: number, max: number) {
  const rounded = Math.round(raw / 5) * 5;
  return Math.min(max, Math.max(min, rounded));
}

export async function submitPracticePart(req: Request, res: Response) {
  try {
    const userId = (req as any).auth?.userId;
    if (!userId) return res.status(401).json({ message: "Bạn chưa đăng nhập" });

    const { partKey } = req.params;
    const { level, test, answers, timeSec } = req.body as {
      level?: number;
      test?: number;
      answers?: Record<string, string>;
      timeSec?: number;
    };

    if (!partKey || ![1, 2, 3, 4].includes(Number(level)))
      return res
        .status(400)
        .json({ message: "Thiếu partKey hoặc level không hợp lệ" });
    if (!answers || typeof answers !== "object")
      return res.status(400).json({ message: "Thiếu answers" });

    const db = mongoose.connection;
    const itemsCol = db.collection(PARTS_COLL);

    const items = await itemsCol
      .find(
        {
          part: String(partKey),
          level: Number(level),
          ...(Number(test) ? { test: Number(test) } : {}),
        },
        { projection: { _id: 0, id: 1, part: 1, answer: 1 } }
      )
      .sort({ order: 1, id: 1 })
      .toArray();

    if (!items.length) {
      return res
        .status(400)
        .json({ message: "Không tìm thấy câu hỏi cho part/level/test này" });
    }

    let total = items.length;
    let correct = 0;

    const answersMap: Record<string, { correctAnswer: string }> = {};
    for (const it of items) {
      answersMap[it.id] = { correctAnswer: it.answer };
      const picked = answers[it.id] ?? null;
      if (picked && picked === it.answer) correct++;
    }

    const acc = total ? correct / total : 0;

    const rawL = acc * 495;
    const rawR = 0;
    const predicted = {
      listening: toToeicStep5(rawL, 5, 495),
      reading: toToeicStep5(rawR, 5, 495),
      overall: toToeicStep5(rawL + rawR, 10, 990),
    };

    const attempt = await PracticeAttempt.create({
      userId,
      partKey,
      level: Number(level) as 1 | 2 | 3,
      test: Number(test) || null,
      total,
      correct,
      acc,
      timeSec: timeSec || 0,
      answersMap,
      userAnswers: answers,
    });

    const newLv = acc >= 0.85 ? 4 : acc >= 0.7 ? 3 : acc >= 0.55 ? 2 : 1;
    await User.updateOne(
      { _id: userId },
      {
        $set: {
          [`partLevels.${partKey}`]: newLv,
          toeicPred: {
            overall: predicted.overall,
            listening: predicted.listening,
            reading: predicted.reading,
          },
          updatedAt: new Date(),
        },
      }
    );

    return res.json({
      total,
      correct,
      acc,
      timeSec: timeSec || 0,
      answersMap,
      recommended: { newLevelForThisPart: newLv, predicted },
    });
  } catch (e) {
    console.error("[submitPracticePart] ERROR", e);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
}

export async function getPracticeHistory(req: Request, res: Response) {
  try {
    const userId = (req as any).auth?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { partKey, level, test, page = "1", limit = "20" } = req.query;
    const q: any = { userId };
    if (partKey) q.partKey = String(partKey);
    if (level) q.level = Number(level);
    if (test) q.test = Number(test);

    const pg = Math.max(1, parseInt(String(page), 10));
    const lim = Math.min(100, Math.max(1, parseInt(String(limit), 10)));

    const [items, total] = await Promise.all([
      PracticeAttempt.find(q)
        .sort({ createdAt: -1 })
        .skip((pg - 1) * lim)
        .limit(lim)
        .lean()
        .exec(),
      PracticeAttempt.countDocuments(q),
    ]);

    return res.json({
      page: pg,
      limit: lim,
      total,
      items,
    });
  } catch (e) {
    console.error("[getPracticeHistory] ERROR", e);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function getPracticeProgress(req: Request, res: Response) {
  try {
    const userId = (req as any).auth?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const { partKey, level } = req.query;
    if (!partKey || !level)
      return res.status(400).json({ message: "Thiếu partKey hoặc level" });

    const attempts = await PracticeAttempt.find({
      userId,
      partKey: String(partKey),
      level: Number(level),
      test: { $ne: null },
    })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    const map: Record<
      string,
      {
        lastAt: string;
        correct: number;
        total: number;
        acc: number;
        count: number;
      }
    > = {};
    for (const a of attempts) {
      const t = String(a.test);
      if (!map[t]) {
        map[t] = {
          lastAt:
            (a as any).createdAt?.toISOString?.() || new Date().toISOString(),
          correct: a.correct,
          total: a.total,
          acc: a.acc,
          count: 1,
        };
      } else {
        map[t].count += 1;
      }
    }

    return res.json({ progressByTest: map });
  } catch (e) {
    console.error("[getPracticeProgress] ERROR", e);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function getPracticeAttemptById(req: Request, res: Response) {
  try {
    const userId = (req as any).auth?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { id } = req.params;
    if (!id || !Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid attempt id" });
    }

    const att = await PracticeAttempt.findOne({ _id: id, userId }).lean();
    if (!att) return res.status(404).json({ message: "Attempt not found" });

    return res.json(att);
  } catch (e) {
    console.error("[getPracticeAttemptById] ERROR", e);
    return res.status(500).json({ message: "Server error" });
  }
}
