// backend/src/controllers/practice.controller.ts
import { Request, Response } from "express";
import mongoose, { Types } from "mongoose";
import { PracticeAttempt } from "../../shared/models/PracticeAttempt";
import { User } from "../../shared/models/User";
import { chatService } from "../study-room/chat.service";
import { checkAndAwardBadges } from "../badge/badge.service";

const PARTS_COLL = process.env.PARTS_COLL || "practice_parts";
const VALID_PARTS = new Set([
  "part.1",
  "part.2",
  "part.3",
  "part.4",
  "part.5",
  "part.6",
  "part.7",
]);

const FREE_MONTHLY_PRACTICE_TEST_LIMIT = 20;


/** Tính level "thô" để fallback lần đầu (1..3) */
function levelFromAcc(acc: number): 1 | 2 | 3 {
  if (acc >= 0.75) return 3;
  if (acc >= 0.6) return 2;
  return 1;
}

/**
 * Đếm số practice test (test !== null) trong tháng hiện tại của user
 * @param userId - ID của user
 * @returns Số lượng practice test trong tháng hiện tại
 */
async function countMonthlyPracticeTests(userId: Types.ObjectId): Promise<number> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const count = await PracticeAttempt.countDocuments({
    userId,
    test: { $ne: null }, // Chỉ đếm practice test, không đếm practice thường
    createdAt: {
      $gte: startOfMonth,
      $lte: endOfMonth,
    },
  });

  return count;
}

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
  const userDoc = await User.findById(userId)
    .select({ partLevelsMeta: 1 })
    .lean();
  const since: Date | undefined = (userDoc as any)?.partLevelsMeta?.[partKey]
    ?.lastChangedAt;

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
          detail: `Ba lần gần nhất (không tính retake) trung bình ≥70% (≈ ${Math.round(
            avg * 100
          )}%).`,
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

    // Validate
    if (!VALID_PARTS.has(String(partKey)))
      return res.status(400).json({ message: "partKey không hợp lệ" });
    if (![1, 2, 3].includes(Number(level)))
      return res.status(400).json({ message: "level không hợp lệ (1..3)" });
    if (!answers || typeof answers !== "object")
      return res.status(400).json({ message: "Thiếu answers" });

    // Kiểm tra giới hạn practice test cho free user (chỉ khi test !== null)
    const isPracticeTest = Number.isInteger(Number(test));
    if (isPracticeTest) {
      const user = await User.findById(userId).select("access").lean<{ access?: string }>();
      if (user?.access === "free") {
        const monthlyCount = await countMonthlyPracticeTests(new Types.ObjectId(String(userId)));
        if (monthlyCount >= FREE_MONTHLY_PRACTICE_TEST_LIMIT) {
          const now = new Date();
          const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          return res.status(403).json({
            message: `Bạn đã đạt giới hạn ${FREE_MONTHLY_PRACTICE_TEST_LIMIT} practice test/tháng. Vui lòng nâng cấp lên Premium để làm không giới hạn.`,
            code: "MONTHLY_LIMIT_EXCEEDED",
            limit: FREE_MONTHLY_PRACTICE_TEST_LIMIT,
            currentCount: monthlyCount,
            resetAt: startOfNextMonth.toISOString(),
          });
        }
      }
    }

    const db = mongoose.connection;
    const itemsCol = db.collection(PARTS_COLL);

    // Load items đúng part + level (+ test nếu có)
    const items = await itemsCol
      .find(
        {
          part: String(partKey),
          level: Number(level),
          ...(Number.isInteger(Number(test)) ? { test: Number(test) } : {}),
        },
        { projection: { _id: 0, id: 1, part: 1, answer: 1, tags: 1, explain: 1, order: 1 } }
      )
      .sort({ order: 1, id: 1 })
      .toArray();

    if (!items.length) {
      return res
        .status(400)
        .json({ message: "Không tìm thấy câu hỏi cho part/level/test này" });
    }

    // Retake?
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
    const answersMap: Record<string, { correctAnswer: string; tags?: string[]; explain?: string }> = {};
    for (let idx = 0; idx < items.length; idx++) {
      const it = items[idx];
      const tags = Array.isArray(it.tags) ? it.tags : [];
      answersMap[it.id] = { 
        correctAnswer: it.answer,
        ...(tags.length > 0 ? { tags } : {}),
        ...(it.explain ? { explain: String(it.explain) } : {})
      };
      const picked = answers[it.id] ?? null;
      if (picked && picked === it.answer) correct++;
    }
    const acc = total ? correct / total : 0;

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

    // Lấy level hiện tại của user và chuẩn hoá cấu trúc partLevels
    const userDoc = (await User.findById(userId).lean()) as {
      partLevels?: Record<string, any>;
    } | null;

    const plRaw = (userDoc?.partLevels ?? {}) as any;
    const num = String(partKey).split(".")[1]; // "1".."7"
    const curFromNested = plRaw?.part?.[num];
    const curFromDot = plRaw?.[partKey];
    const curLevel = (
      [1, 2, 3].includes(curFromNested)
        ? curFromNested
        : [1, 2, 3].includes(curFromDot)
        ? curFromDot
        : levelFromAcc(acc)
    ) as 1 | 2 | 3;

    // Quyết định level mới (không đổi nếu là retake)
    const decision = await decideNewLevel(
      new Types.ObjectId(String(userId)),
      String(partKey),
      curLevel
    );
    const decided = !isRetake ? decision.decided : curLevel;
    const levelChanged = decided !== curLevel;

    // Chuẩn hoá partLevels về dạng { part: { "1": 1|2|3, ... } }
    const normalized: Record<string, any> = { part: {} };
    for (const p of [
      "part.1",
      "part.2",
      "part.3",
      "part.4",
      "part.5",
      "part.6",
      "part.7",
    ]) {
      const n = p.split(".")[1];
      const fromDot2 = plRaw?.[p];
      const fromNested2 = plRaw?.part?.[n];
      if ([1, 2, 3].includes(fromDot2)) normalized.part[n] = fromDot2;
      else if ([1, 2, 3].includes(fromNested2))
        normalized.part[n] = fromNested2;
    }
    normalized.part[num] = decided;

    const now = new Date();

    // ⬇️ CẬP NHẬT USER: CHỈ update level/meta, KHÔNG chạm toeicPred
    const setPayload: any = {
      partLevels: normalized,
      updatedAt: now,
    };
    if (levelChanged) {
      setPayload[`partLevelsMeta.${partKey}.lastChangedAt`] = now;
    }
    await User.updateOne({ _id: userId }, { $set: setPayload }).exec();

    // Đọc toeicPred hiện tại trong DB để trả về FE (giữ nguyên, không đổi)
    const u = await User.findById(userId)
      .select({ toeicPred: 1 })
      .lean<{
        toeicPred?: { overall?: number; listening?: number; reading?: number };
      } | null>()
      .exec();

    const predicted = {
      overall: Math.min(
        990,
        Math.max(
          10,
          Math.round(((u?.toeicPred?.overall ?? 10) as number) / 5) * 5
        )
      ),
      listening: Math.min(
        495,
        Math.max(
          5,
          Math.round(((u?.toeicPred?.listening ?? 5) as number) / 5) * 5
        )
      ),
      reading: Math.min(
        495,
        Math.max(
          5,
          Math.round(((u?.toeicPred?.reading ?? 5) as number) / 5) * 5
        )
      ),
    };

    // Kiểm tra và cấp badges (async, không block response)
    checkAndAwardBadges(new Types.ObjectId(String(userId))).catch((err) => {
      console.error("[submitPracticePart] Error checking badges:", err);
    });

    return res.json({
      _id: String(attempt._id),
      total,
      correct,
      acc,
      timeSec: timeSec || 0,
      answersMap,
      isRetake,
      recommended: {
        newLevelForThisPart: decided,
        predicted, // điểm hiện tại trong DB (không bị luyện part làm thay đổi)
        reason: decision.reason,
      },
      savedAttemptId: String(attempt._id), // Giữ lại để tương thích
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

function getInactivityWindowMs() {
  const daysRaw = Number(process.env.PRACTICE_INACTIVITY_DAYS);
  const days = Number.isFinite(daysRaw) && daysRaw > 0 ? daysRaw : 3;
  return days * 24 * 60 * 60 * 1000;
}

function getNudgeCooldownMs() {
  const hoursRaw = Number(process.env.PRACTICE_NUDGE_COOLDOWN_HOURS);
  const hours = Number.isFinite(hoursRaw) && hoursRaw > 0 ? hoursRaw : 24;
  return hours * 60 * 60 * 1000;
}

/** GET /api/practice/inactivity — không luyện tập quá N ngày thì nhắc practice */
export async function getPracticeInactivity(req: Request, res: Response) {
  try {
    const userId = (req as any).auth?.userId;
    if (!userId) return res.status(401).json({ message: "Bạn chưa đăng nhập" });

    const [lastPractice, me] = await Promise.all([
      PracticeAttempt.findOne({ userId })
        .sort({ createdAt: -1 })
        .select({ createdAt: 1, _id: 0 })
        .lean<{ createdAt?: Date }>(),
      User.findById(userId)
        .select({ "practiceMeta.lastInactivityNudgedAt": 1 })
        .lean<{ practiceMeta?: { lastInactivityNudgedAt?: Date } } | null>(),
    ]);

    const now = Date.now();
    const THRESH_MS = getInactivityWindowMs();
    const COOLDOWN_MS = getNudgeCooldownMs();

    const lastNudgeAt = me?.practiceMeta?.lastInactivityNudgedAt
      ? new Date(me.practiceMeta.lastInactivityNudgedAt)
      : null;
    const nudgedRecently =
      lastNudgeAt != null && now - lastNudgeAt.getTime() < COOLDOWN_MS;

    if (!lastPractice?.createdAt) {
      // Chưa từng làm ⇒ coi như inactive & có thể nudge nếu không vướng cooldown
      const shouldNudge = !nudgedRecently;
      return res.json({
        inactive: true,
        shouldNudge,
        reason: "no_practice_yet",
        lastPracticeAt: null,
        thresholdMs: THRESH_MS,
        cooldownMs: COOLDOWN_MS,
        lastNudgedAt: lastNudgeAt ? lastNudgeAt.toISOString() : null,
        nextNudgeAt: nudgedRecently
          ? new Date(lastNudgeAt!.getTime() + COOLDOWN_MS).toISOString()
          : new Date(now).toISOString(),
        remainingMs: null,
      });
    }

    const lastAt = new Date(lastPractice.createdAt);
    const inactive = now - lastAt.getTime() >= THRESH_MS;
    const shouldNudge = inactive && !nudgedRecently;

    return res.json({
      inactive,
      shouldNudge,
      reason: inactive ? "exceed_threshold" : "ok",
      lastPracticeAt: lastAt.toISOString(),
      thresholdMs: THRESH_MS,
      cooldownMs: COOLDOWN_MS,
      lastNudgedAt: lastNudgeAt ? lastNudgeAt.toISOString() : null,
      nextNudgeAt: shouldNudge
        ? new Date(now).toISOString()
        : new Date(
            Math.max(
              lastAt.getTime() + THRESH_MS, // khi đủ ngưỡng
              (lastNudgeAt?.getTime() || 0) + COOLDOWN_MS // sau cooldown
            )
          ).toISOString(),
      remainingMs: Math.max(0, lastAt.getTime() + THRESH_MS - now),
    });
  } catch (e) {
    console.error("[getPracticeInactivity] ERROR", e);
    return res.status(500).json({ message: "Server error" });
  }
}

/** POST /api/practice/inactivity/ack — ghi nhận đã hiển thị nhắc nhở practice */
export async function ackPracticeInactivity(req: Request, res: Response) {
  try {
    const userId = (req as any).auth?.userId;
    if (!userId) return res.status(401).json({ message: "Bạn chưa đăng nhập" });

    await User.updateOne(
      { _id: userId },
      {
        $set: {
          "practiceMeta.lastInactivityNudgedAt": new Date(),
          updatedAt: new Date(),
        },
      }
    ).exec();

    return res.json({ ok: true });
  } catch (e) {
    console.error("[ackPracticeInactivity] ERROR", e);
    return res.status(500).json({ message: "Server error" });
  }
}

/** GET /api/practice/monthly-limit — kiểm tra số practice test còn lại trong tháng */
export async function getMonthlyPracticeTestLimit(req: Request, res: Response) {
  try {
    const userId = (req as any).auth?.userId;
    if (!userId) return res.status(401).json({ message: "Bạn chưa đăng nhập" });

    const user = await User.findById(userId).select("access").lean<{ access?: string }>();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isPremium = user.access === "premium";
    const monthlyCount = await countMonthlyPracticeTests(new Types.ObjectId(String(userId)));

    const now = new Date();
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    if (isPremium) {
      return res.json({
        isPremium: true,
        limit: null,
        currentCount: monthlyCount,
        remaining: null,
        resetAt: startOfNextMonth.toISOString(),
      });
    }

    const remaining = Math.max(0, FREE_MONTHLY_PRACTICE_TEST_LIMIT - monthlyCount);
    const canSubmit = remaining > 0;

    return res.json({
      isPremium: false,
      limit: FREE_MONTHLY_PRACTICE_TEST_LIMIT,
      currentCount: monthlyCount,
      remaining,
      canSubmit,
      resetAt: startOfNextMonth.toISOString(),
    });
  } catch (e) {
    console.error("[getMonthlyPracticeTestLimit] ERROR", e);
    return res.status(500).json({ message: "Server error" });
  }
}
