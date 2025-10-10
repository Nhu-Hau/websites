import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
// ⬇️ ĐỔI dòng này cho đúng tên model câu hỏi của bạn
// Ví dụ nếu bạn export là `export const Item = ...` thì: import { Item as Items } from "../models/Item";
import { Items } from "../models/Item";

import { PracticeAttempt } from "../models/PracticeAttempt";
import { recomputeUserRecommendations } from "../services/recommendation.service";

const r = Router();

/**
 * Nộp bài luyện Part
 * POST /api/practice/parts/:partKey/submit
 * body: { level: 1|2|3|4, answers: Record<itemId, ChoiceId>, timeSec?: number }
 */
r.post("/practice/parts/:partKey/submit", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).auth?.userId as string | undefined;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { partKey } = req.params as { partKey: string };
    const { level, answers, timeSec = 0 } = req.body as {
      level: 1 | 2 | 3 | 4;
      answers: Record<string, string>;
      timeSec?: number;
    };

    if (!partKey || !level || !answers || !Object.keys(answers).length) {
      return res.status(400).json({ error: "Thiếu dữ liệu" });
    }

    // lấy câu hỏi theo ids user đã trả lời (đảm bảo đúng part)
    const ids = Object.keys(answers);
    const items = await Items.find({ id: { $in: ids }, part: partKey }).lean();

    if (!items.length) {
      return res.status(400).json({ error: "Không khớp câu hỏi/part" });
    }

    let correct = 0;
    const attemptItems = items.map((it) => {
      const picked = (answers as any)[it.id] ?? null;
      const isCorrect = picked != null && picked === it.answer;
      if (isCorrect) correct++;
      return {
        id: it.id,
        part: it.part,
        picked,
        correctAnswer: it.answer,
        isCorrect,
      };
    });

    const total = items.length;
    const acc = total ? correct / total : 0;

    const attempt = await PracticeAttempt.create({
      userId,
      partKey,
      levelUsed: level,
      total,
      correct,
      acc,
      timeSec,
      items: attemptItems,
    });

    // cập nhật gợi ý + điểm ước lượng vào User
    const recommended = await recomputeUserRecommendations(userId);

    return res.json({
      attemptId: attempt._id,
      total,
      correct,
      acc,
      timeSec,
      recommended, // { partLevels, predicted }
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Submit failed" });
  }
});

/**
 * Gợi ý hiện tại (cache trong User)
 * GET /api/users/me/recommendations
 */
r.get("/users/me/recommendations", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user || null; // nếu bạn attach user ở middleware
    if (user?.partLevels || user?.toeicPred) {
      return res.json({
        partLevels: user.partLevels || {},
        predicted: user.toeicPred || { overall: 0, listening: 0, reading: 0 },
      });
    }

    // nếu middleware không attach user đầy đủ, có thể query DB:
    // const doc = await User.findById((req as any).auth.userId).lean();
    // return res.json({ partLevels: doc?.partLevels || {}, predicted: doc?.toeicPred || null });

    // fallback:
    return res.json({ partLevels: {}, predicted: null });
  } catch {
    return res.status(500).json({ error: "Failed to load recommendations" });
  }
});

export default r;