// src/controllers/practice.controller.ts
import { Request, Response } from "express";
import mongoose from "mongoose";
import { PracticeAttempt } from "../models/PracticeAttempt";
import { User } from "../models/User";

const PARTS_COLL = process.env.PARTS_COLL || "parts";
const STIMULI_COLL = process.env.STIMULI_COLL || "stimuli";

function toToeicStep5(raw: number, min: number, max: number) {
  const rounded = Math.round(raw / 5) * 5;
  return Math.min(max, Math.max(min, rounded));
}

export async function submitPracticePart(req: Request, res: Response) {
  try {
    const userId = (req as any).auth?.userId;
    if (!userId) return res.status(401).json({ message: "Bạn chưa đăng nhập" });

    const { partKey } = req.params;
    const { level, answers, timeSec } = req.body as {
      level?: number;
      answers?: Record<string, string>;
      timeSec?: number;
    };

    if (!partKey || ![1, 2, 3, 4].includes(Number(level)))
      return res.status(400).json({ message: "Thiếu partKey hoặc level không hợp lệ" });
    if (!answers || typeof answers !== "object")
      return res.status(400).json({ message: "Thiếu answers" });

    console.log("[submitPracticePart] user=", userId, "partKey=", partKey, "level=", level);

    const db = mongoose.connection;
    const itemsCol = db.collection(PARTS_COLL);

    // Lấy items đúng part+level
    const items = await itemsCol
      .find({ part: String(partKey), level: Number(level) }, { projection: { _id: 0, id: 1, part: 1, answer: 1 } })
      .sort({ order: 1, id: 1 })
      .toArray();

    if (!items.length) {
      console.warn("[submitPracticePart] NO ITEMS for", partKey, level);
      return res.status(400).json({ message: "Không tìm thấy câu hỏi cho part/level này" });
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

    // Tính TOEIC ước lượng nhẹ theo acc tổng bài (tham khảo)
    const rawL = acc * 495;
    const rawR = 0; // bài luyện theo Part đơn lẻ => không tính reading nếu là part 1..4
    const predicted = {
      listening: toToeicStep5(rawL, 5, 495),
      reading: toToeicStep5(rawR, 5, 495),
      overall: toToeicStep5(rawL + rawR, 10, 990),
    };

    // Lưu attempt
    const attempt = await PracticeAttempt.create({
      userId,
      partKey,
      level: Number(level) as 1 | 2 | 3 | 4,
      total,
      correct,
      acc,
      timeSec: timeSec || 0,
      answersMap,
    });

    console.log("[submitPracticePart] saved attempt _id=", attempt._id);

    // Cập nhật user: partLevels[partKey] gợi ý mới theo acc
    const newLv = acc >= 0.85 ? 4 : acc >= 0.7 ? 3 : acc >= 0.55 ? 2 : 1;
    const user = await User.findById(userId).select("_id partLevels toeicPred").lean();
    if (user) {
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
    }

    return res.json({
      total,
      correct,
      acc,
      timeSec: timeSec || 0,
      answersMap,
      recommended: {
        newLevelForThisPart: newLv,
        predicted,
      },
    });
  } catch (e) {
    console.error("[submitPracticePart] ERROR", e);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
}