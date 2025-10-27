// backend/src/controllers/practice.controller.ts
import { Request, Response } from "express";
import mongoose, { Types } from "mongoose";
import { PracticeAttempt } from "../models/PracticeAttempt";
import { User } from "../models/User";

const PARTS_COLL = process.env.PARTS_COLL || "parts";
const VALID_PARTS = new Set([
  "part.1",
  "part.2",
  "part.3",
  "part.4",
  "part.5",
  "part.6",
  "part.7",
]);

/** Làm tròn TOEIC theo bội số 5, khoá min/max */
function toToeicStep5(raw: number, min: number, max: number) {
  const rounded = Math.round(raw / 5) * 5;
  return Math.min(max, Math.max(min, rounded));
}

/** Tính level “thô” để fallback lần đầu (1..3) */
function levelFromAcc(acc: number): 1 | 2 | 3 {
  if (acc >= 0.75) return 3;
  if (acc >= 0.6) return 2;
  return 1;
}

/* ========= NEW: type lý do ========= */
/* ========= NEW: type lý do ========= */
type LevelReason = { rule: "promote" | "demote" | "keep"; detail: string };

/** Quyết định level mới theo rule:
 * - Demote: 3 TEST khác nhau gần nhất (sau mốc lastChangedAt nếu có) ở level hiện tại đều < 50%
 * - Promote: 3 lần làm (không tính retake) gần nhất ở level hiện tại trung bình ≥ 70%
 * - Keep: còn lại
 */
async function decideNewLevel(
  userId: Types.ObjectId,
  partKey: string,
  curLevel: 1 | 2 | 3
): Promise<{ decided: 1 | 2 | 3; reason: LevelReason }> {
  // Mốc thời gian từ khi level hiện tại bắt đầu có hiệu lực
  const userDoc = await User.findById(userId).select({ partLevelsMeta: 1 }).lean();
  const since: Date | undefined = (userDoc as any)?.partLevelsMeta?.[partKey]?.lastChangedAt;

  // PROMOTE base: 3 lần gần nhất (không retake), đúng level, sau mốc
  const promoteBase = await PracticeAttempt.find({
    userId,
    partKey,
    level: curLevel,
    isRetake: false,
    ...(since ? { createdAt: { $gt: since } } : {}),
  })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean()
    .exec();

  // DEMOTE base: nhóm theo TEST (không quan tâm retake), lấy bản mới nhất mỗi TEST, sau mốc
  const demoteBase = await PracticeAttempt.aggregate([
    {
      $match: {
        userId,
        partKey,
        level: curLevel,
        test: { $ne: null },
        ...(since ? { createdAt: { $gt: since } } : {}),
      },
    },
    { $sort: { createdAt: -1 } },
    { $group: { _id: "$test", doc: { $first: "$$ROOT" } } },
    { $replaceRoot: { newRoot: "$doc" } },
    { $sort: { createdAt: -1 } },
    { $limit: 3 },
  ]);

  // DEMOTE? — phải đủ 3 TEST khác nhau & cả 3 < 50%
  if (
    curLevel > 1 &&
    demoteBase.length === 3 &&
    demoteBase.every((a: any) => (a.acc ?? 0) < 0.5)
  ) {
    const msg = demoteBase
      .map((a: any) => `Test ${a.test}: ${Math.round((a.acc ?? 0) * 100)}%`)
      .join(", ");
    return {
      decided: (curLevel - 1) as 1 | 2 | 3,
      reason: {
        rule: "demote",
        detail: `Ba TEST khác nhau gần nhất ở Level ${curLevel} đều <50% (${msg}).`,
      },
    };
  }

  // PROMOTE? — 3 lần (không retake) trung bình ≥ 70%
  const lastThree = promoteBase.slice(0, 3);
  if (curLevel < 3 && lastThree.length === 3) {
    const avg = lastThree.reduce((s, x) => s + (x.acc ?? 0), 0) / 3;
    if (avg >= 0.7) {
      return {
        decided: (curLevel + 1) as 1 | 2 | 3,
        reason: {
          rule: "promote",
          detail: `Ba lần gần nhất (không tính retake) trung bình ≥70% (≈ ${Math.round(avg * 100)}%).`,
        },
      };
    }
  }

  // KEEP
  return {
    decided: curLevel,
    reason: {
      rule: "keep",
      detail: "Chưa đủ điều kiện tăng (≥70%) hoặc hạ (3 TEST <50%).",
    },
  };
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

    // Validate inputs
    if (!VALID_PARTS.has(String(partKey)))
      return res.status(400).json({ message: "partKey không hợp lệ" });
    if (![1, 2, 3].includes(Number(level)))
      return res.status(400).json({ message: "level không hợp lệ (1..3)" });
    if (!answers || typeof answers !== "object")
      return res.status(400).json({ message: "Thiếu answers" });

    const db = mongoose.connection;
    const itemsCol = db.collection(PARTS_COLL);

    // Load items đúng part+level(+test nếu có)
    const items = await itemsCol
      .find(
        {
          part: String(partKey),
          level: Number(level),
          ...(Number.isInteger(Number(test)) ? { test: Number(test) } : {}),
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

    // Đánh dấu retake — nếu đã từng làm TEST này ở cùng part/level
    let isRetake = false;
    if (Number.isInteger(Number(test))) {
      const prev = await PracticeAttempt.findOne({
        userId,
        partKey: String(partKey),
        level: Number(level),
        test: Number(test),
      })
        .sort({ createdAt: -1 })
        .select({ _id: 1 })
        .lean()
        .exec();
      if (prev) isRetake = true;
    }

    // Chấm bài
    const total = items.length;
    let correct = 0;
    const answersMap: Record<string, { correctAnswer: string }> = {};
    for (const it of items) {
      answersMap[it.id] = { correctAnswer: it.answer };
      const picked = answers[it.id] ?? null;
      if (picked && picked === it.answer) correct++;
    }
    const acc = total ? correct / total : 0;

    // Ước lượng TOEIC minh hoạ theo part đơn lẻ
    const rawL = acc * 495;
    const rawR = 0;
    const predicted = {
      listening: toToeicStep5(rawL, 5, 495),
      reading: toToeicStep5(rawR, 5, 495),
      overall: toToeicStep5(rawL + rawR, 10, 990),
    };

    // Lưu attempt
    const attempt = await PracticeAttempt.create({
      userId,
      partKey,
      level: Number(level) as 1 | 2 | 3,
      test: Number.isInteger(Number(test)) ? Number(test) : null,
      total,
      correct,
      acc,
      timeSec: timeSec || 0,
      answersMap,
      userAnswers: answers,
      isRetake,
    });

    // Lấy level hiện tại từ user — hỗ trợ cả 2 kiểu lưu (sai và đúng), rồi normalize
    const userDoc = (await User.findById(userId).lean()) as {
      partLevels?: Record<string, any>;
    } | null;
    const plRaw = (userDoc?.partLevels ?? {}) as any;

    const num = String(partKey).split(".")[1]; // "1".."7"
    const curFromNested = plRaw?.part?.[num];
    const curFromDot = plRaw?.[partKey];
    let curLevel = ([1, 2, 3].includes(curFromNested)
      ? curFromNested
      : [1, 2, 3].includes(curFromDot)
      ? curFromDot
      : levelFromAcc(acc)) as 1 | 2 | 3;

    // Quyết định level mới theo rule (dùng mốc lastChangedAt)
    const decision = await decideNewLevel(
      new Types.ObjectId(String(userId)),
      String(partKey),
      curLevel
    );
    let decided = curLevel;
    let reason: LevelReason = decision.reason;

    // Retake thì không đổi level
    if (!isRetake) decided = decision.decided;

    const levelChanged = decided !== curLevel;
    const now = new Date();

    // toeicPred giữ theo bài vừa làm
    const nextToeic = {
      overall: predicted.overall,
      listening: predicted.listening,
      reading: predicted.reading,
    };

    // === Normalize partLevels rồi ghi đè (xoá hẳn các key sai như "part.1")
    const normalized: Record<string, any> = { part: {} };
    for (const p of ["part.1", "part.2", "part.3", "part.4", "part.5", "part.6", "part.7"]) {
      const n = p.split(".")[1];
      const fromDot2 = plRaw?.[p];
      const fromNested2 = plRaw?.part?.[n];
      if ([1, 2, 3].includes(fromDot2)) normalized.part[n] = fromDot2;
      else if ([1, 2, 3].includes(fromNested2)) normalized.part[n] = fromNested2;
    }
    // cập nhật phần vừa quyết định
    normalized.part[num] = decided;

    // Ghi đè object chuẩn + meta mốc thời gian nếu có đổi level
    await User.updateOne(
      { _id: userId },
      {
        $set: {
          partLevels: normalized,
          toeicPred: nextToeic,
          updatedAt: now,
          ...(levelChanged ? { [`partLevelsMeta.${partKey}.lastChangedAt`]: now } : {}),
        },
      }
    );

    return res.json({
      total,
      correct,
      acc,
      timeSec: timeSec || 0,
      answersMap,
      isRetake,
      recommended: {
        newLevelForThisPart: decided,
        predicted: nextToeic,
        reason,
      },
      savedAttemptId: attempt._id,
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
