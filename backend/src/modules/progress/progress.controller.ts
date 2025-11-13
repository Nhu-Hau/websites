// backend/src/controllers/progress.controller.ts
import { Request, Response } from "express";
import mongoose, { Types } from "mongoose";
import { ProgressAttempt } from "../../shared/models/ProgressAttempt";
import { PracticeAttempt } from "../../shared/models/PracticeAttempt";
import { User } from "../../shared/models/User";
import { accessCookieName } from "../../config/cookies";
import { verifyAccessToken } from "../../shared/services/jwt.service";
import { chatService } from "../study-room/chat.service";
import { checkAndAwardBadges } from "../badge/badge.service";

const ITEMS_COLL =
  process.env.PROGRESS_PARTS_COLL ||
  process.env.PROGRESS_ITEMS_COLL ||
  "progress_parts";
const STIMULI_COLL = process.env.PROGRESS_STIMULI_COLL || "progress_stimuli";

const LISTENING = new Set(["part.1", "part.2", "part.3", "part.4"]);
const READING = new Set(["part.5", "part.6", "part.7"]);

function accToLevel(acc: number): 1 | 2 | 3 {
  if (acc >= 0.7) return 3;
  if (acc >= 0.55) return 2;
  return 1;
}
// Hàm làm tròn chia hết cho 5 (cho listening/reading: 5-495)
function round5_495(n: number): number {
  return Math.min(495, Math.max(5, Math.round(n / 5) * 5));
}

// Hàm làm tròn chia hết cho 5 (cho overall: 10-990)
function round5_990(n: number): number {
  return Math.min(990, Math.max(10, Math.round(n / 5) * 5));
}

function predictToeic(listeningAcc: number, readingAcc: number) {
  const listeningRaw = (listeningAcc || 0) * 495;
  const readingRaw = (readingAcc || 0) * 495;
  const listening = round5_495(listeningRaw);
  const reading = round5_495(readingRaw);
  const overall = round5_990(listening + reading);
  return { overall, listening, reading };
}

/** GET /api/progress/paper
 * Optional per-part limits: ?p1=4&p2=8&p3=9&p4=9&p5=10&p6=8&p7=7
 * Không truyền => lấy tất cả mỗi part (theo order tăng).
 */
function resolveItemTest(it: any): number | null {
  const candidates = [it?.test, it?.version, it?.paper, it?.paperId];
  for (const raw of candidates) {
    const num = Number(raw);
    if (Number.isInteger(num)) return num;
  }
  return null;
}

function normalizeCompletedTests(raw: unknown): number[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((v) => Number(v))
    .filter((v) => Number.isInteger(v))
    .map((v) => v);
}

function pickNextProgressTest(completed: number[]): number {
  if (!completed.includes(1)) return 1;
  if (!completed.includes(2)) return 2;
  return 2;
}

export async function getProgressPaper(req: Request, res: Response) {
  try {
    const db = mongoose.connection;
    const itemsCol = db.collection(ITEMS_COLL);
    const stimCol = db.collection(STIMULI_COLL);

    let requestedTest: number | null = null;
    const queryTest = Number(req.query.test);
    if (Number.isInteger(queryTest)) requestedTest = queryTest;

    let userId: string | null = null;
    if (!requestedTest) {
      const token = req.cookies?.[accessCookieName];
      if (token) {
        try {
          const payload = verifyAccessToken(token);
          if (payload?.id) userId = String(payload.id);
        } catch {
          userId = null;
        }
      }
    }

    let targetTest = requestedTest;
    if (!targetTest && userId) {
      const me = await User.findById(userId)
        .select("progressMeta")
        .lean<{ progressMeta?: any }>();
      const completed = normalizeCompletedTests(
        me?.progressMeta?.completedTests
      );
      targetTest = pickNextProgressTest(completed);
    }
    if (!targetTest) targetTest = 1;

    const limits: Record<
      | "part.1"
      | "part.2"
      | "part.3"
      | "part.4"
      | "part.5"
      | "part.6"
      | "part.7",
      number
    > = {
      "part.1": Number(req.query.p1 ?? 0),
      "part.2": Number(req.query.p2 ?? 0),
      "part.3": Number(req.query.p3 ?? 0),
      "part.4": Number(req.query.p4 ?? 0),
      "part.5": Number(req.query.p5 ?? 0),
      "part.6": Number(req.query.p6 ?? 0),
      "part.7": Number(req.query.p7 ?? 0),
    };

    const parts = Object.keys(limits) as (keyof typeof limits)[];
    let items: any[] = [];
    for (const pk of parts) {
      const lim =
        Number.isFinite(limits[pk]) && limits[pk] > 0 ? limits[pk] : 0;
      const cur = itemsCol
        .find({ part: pk }, { projection: { _id: 0 } })
        .sort({ order: 1, id: 1 });
      const arr = await cur.toArray();
      const filtered =
        targetTest != null
          ? arr.filter((it) => {
              const t = resolveItemTest(it);
              if (t == null) return targetTest === 1; // fallback: coi như test 1
              return t === targetTest;
            })
          : arr;
      const final = lim > 0 ? filtered.slice(0, lim) : filtered;
      items = items.concat(final);
    }

    items.sort((a, b) => {
      const ao = a?.order ?? null,
        bo = b?.order ?? null;
      if (ao != null && bo != null) return ao - bo;
      return String(a.id || "").localeCompare(String(b.id || ""));
    });

    const sids = Array.from(
      new Set(items.map((it: any) => it.stimulusId).filter(Boolean))
    );
    const stArr = sids.length
      ? await stimCol
          .find({ id: { $in: sids } }, { projection: { _id: 0 } })
          .toArray()
      : [];

    const stimulusMap: Record<string, any> = {};
    for (const s of stArr) stimulusMap[s.id] = s;

    return res.json({ items, stimulusMap, meta: { test: targetTest } });
  } catch (e) {
    console.error("[getProgressPaper] ERROR", e);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
}

/** POST /api/progress/grade  (tính điểm tạm, không lưu DB) */
export async function gradeProgress(req: Request, res: Response) {
  try {
    const { answers, timeSec, allIds } = req.body as {
      answers?: Record<string, string>;
      timeSec?: number;
      allIds?: string[];
    };
    if (!answers || !allIds?.length) {
      return res.status(400).json({ message: "Thiếu dữ liệu" });
    }

    const db = mongoose.connection;
    const itemsCol = db.collection(ITEMS_COLL);

    const items = await itemsCol
      .find(
        { id: { $in: allIds } },
        { projection: { _id: 0, id: 1, part: 1, answer: 1 } }
      )
      .toArray();

    let total = items.length,
      correct = 0,
      L = 0,
      Lc = 0,
      R = 0,
      Rc = 0;
    type PartStat = { total: number; correct: number; acc: number };
    const partStats: Record<string, PartStat> = {};

    for (const it of items) {
      const picked = answers[it.id] ?? null;
      const ok = picked !== null && picked === it.answer;
      if (ok) correct++;

      const isL = LISTENING.has(it.part);
      if (isL) {
        L++;
        if (ok) Lc++;
      } else {
        R++;
        if (ok) Rc++;
      }

      if (!partStats[it.part])
        partStats[it.part] = { total: 0, correct: 0, acc: 0 };
      partStats[it.part].total += 1;
      if (ok) partStats[it.part].correct += 1;
    }
    Object.keys(partStats).forEach((k) => {
      const s = partStats[k];
      s.acc = s.total ? s.correct / s.total : 0;
    });

    const acc = total ? correct / total : 0;
    const level = accToLevel(acc);
    const listening = { total: L, correct: Lc, acc: L ? Lc / L : 0 };
    const reading = { total: R, correct: Rc, acc: R ? Rc / R : 0 };
    const predicted = predictToeic(listening.acc, reading.acc);

    const WEAK_THRESH = 0.6;
    const weakParts = Object.entries(partStats)
      .filter(([, s]) => s.acc < WEAK_THRESH)
      .sort((a, b) => a[1].acc - b[1].acc)
      .map(([k]) => k);

    return res.json({
      total,
      correct,
      acc,
      listening,
      reading,
      timeSec: timeSec || 0,
      level,
      predicted,
      partStats,
      weakParts,
      answersMap: items.reduce(
        (m, it) => ((m[it.id] = { correctAnswer: it.answer }), m),
        {} as Record<string, { correctAnswer: string }>
      ),
    });
  } catch (e) {
    console.error("[gradeProgress] ERROR", e);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
}

/** POST /api/progress/submit  (lưu kết quả) */
export async function submitProgress(req: Request, res: Response) {
  try {
    const userId = (req as any).auth?.userId;
    if (!userId) return res.status(401).json({ message: "Bạn chưa đăng nhập" });

    const { answers, allIds, timeSec, startedAt, version } = req.body as {
      answers?: Record<string, string>;
      allIds?: string[];
      timeSec?: number;
      startedAt?: string;
      version?: string;
    };
    if (!answers || !allIds?.length) {
      return res.status(400).json({ message: "Thiếu dữ liệu" });
    }

    const db = mongoose.connection;
    const itemsCol = db.collection(ITEMS_COLL);

    const items = await itemsCol
      .find(
        { id: { $in: allIds } },
        { projection: { _id: 0, id: 1, part: 1, answer: 1 } }
      )
      .toArray();

    let total = items.length,
      correct = 0,
      L = 0,
      Lc = 0,
      R = 0,
      Rc = 0;
    type PartStat = { total: number; correct: number; acc: number };
    const partStats: Record<string, PartStat> = {};

    const itemResults = items.map((it) => {
      const picked = answers[it.id] ?? null;
      const ok = picked !== null && picked === it.answer;
      if (ok) correct++;

      const isL = LISTENING.has(it.part);
      if (isL) {
        L++;
        if (ok) Lc++;
      } else {
        R++;
        if (ok) Rc++;
      }

      if (!partStats[it.part])
        partStats[it.part] = { total: 0, correct: 0, acc: 0 };
      partStats[it.part].total += 1;
      if (ok) partStats[it.part].correct += 1;

      return {
        id: it.id,
        part: it.part,
        picked,
        correctAnswer: it.answer,
        isCorrect: ok,
      };
    });

    Object.keys(partStats).forEach((k) => {
      const s = partStats[k];
      s.acc = s.total ? s.correct / s.total : 0;
    });

    const acc = total ? correct / total : 0;
    const level = accToLevel(acc);
    const listening = { total: L, correct: Lc, acc: L ? Lc / L : 0 };
    const reading = { total: R, correct: Rc, acc: R ? Rc / R : 0 };
    const predicted = predictToeic(listening.acc, reading.acc);

    const WEAK_THRESH = 0.6;
    const weakParts = Object.entries(partStats)
      .filter(([, s]) => s.acc < WEAK_THRESH)
      .sort((a, b) => a[1].acc - b[1].acc)
      .map(([k]) => k);

    const attempt = await ProgressAttempt.create({
      userId,
      total,
      correct,
      acc,
      listening,
      reading,
      level,
      predicted,
      partStats,
      weakParts,
      items: itemResults,
      allIds,
      timeSec: timeSec || 0,
      startedAt: startedAt ? new Date(startedAt) : undefined,
      submittedAt: new Date(),
      version: version || "1.0.0",
    });

    // Update profile: cập nhật toeicPred theo bài progress mới nhất
    const versionNum = Number(version);
    const normalizedVersion = Number.isInteger(versionNum)
      ? versionNum
      : Number.parseInt(String(version ?? ""), 10);
    const finalVersion = Number.isInteger(normalizedVersion)
      ? normalizedVersion
      : 1;

    await User.updateOne(
      { _id: userId },
      {
        $set: {
          toeicPred: predicted,
          "progressMeta.lastAttemptAt": attempt.submittedAt,
          "progressMeta.lastSuggestedAt": null, // reset gợi ý
          "progressMeta.lastTestVersion": finalVersion,
          updatedAt: new Date(),
        },
        $addToSet: {
          "progressMeta.completedTests": finalVersion,
        },
      }
    ).exec();

    // Tự động gửi Learning Insight vào chat (chạy async, không block response)
    chatService.generateLearningInsight(
      String(userId),
      "progress",
      String(attempt._id),
      "default"
    ).catch((err) => {
      console.error("[submitProgress] Error generating Learning Insight:", err);
    });

    // Kiểm tra và cấp badges (async, không block response)
    checkAndAwardBadges(new Types.ObjectId(String(userId))).catch((err) => {
      console.error("[submitProgress] Error checking badges:", err);
    });

    return res.json({
      attemptId: String(attempt._id),
      total,
      correct,
      acc,
      listening,
      reading,
      timeSec: timeSec || 0,
      level,
      predicted,
      partStats,
      weakParts,
      answersMap: itemResults.reduce(
        (m, r) => ((m[r.id] = { correctAnswer: r.correctAnswer }), m),
        {} as Record<string, { correctAnswer: string }>
      ),
    });
  } catch (e) {
    console.error("[submitProgress] ERROR", e);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
}

/** GET /api/progress/attempts?limit=10&page=1 */
export async function getMyProgressAttempts(req: Request, res: Response) {
  try {
    const userId =
      (req as any).auth?.userId || (req.query.userId as string | undefined);
    if (!userId) return res.status(401).json({ message: "Bạn chưa đăng nhập" });

    const limit = Math.min(parseInt(String(req.query.limit || 10)), 50);
    const page = Math.max(parseInt(String(req.query.page || 1)), 1);

    const [items, total] = await Promise.all([
      ProgressAttempt.find({ userId })
        .sort({ submittedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select(
          "_id level acc correct total listening reading submittedAt timeSec version"
        )
        .lean(),
      ProgressAttempt.countDocuments({ userId }),
    ]);

    return res.json({
      items,
      total,
      page,
      limit,
      hasMore: page * limit < total,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
}

/** GET /api/progress/attempts/:id */
export async function getProgressAttemptById(req: Request, res: Response) {
  try {
    const userId =
      (req as any).auth?.userId || (req.query.userId as string | undefined);
    if (!userId) return res.status(401).json({ message: "Bạn chưa đăng nhập" });

    const { id } = req.params;
    const attempt = await ProgressAttempt.findById(id).exec();
    if (!attempt) return res.status(404).json({ message: "Không tìm thấy" });

    if (String(attempt.userId) !== String(userId)) {
      return res.status(403).json({ message: "Không có quyền truy cập" });
    }

    return res.json(attempt.toObject());
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
}

/** GET /api/progress/attempts/:id/items  (khôi phục đề theo đúng thứ tự đã làm) */
export async function getProgressAttemptItemsOrdered(
  req: Request,
  res: Response
) {
  try {
    const userId = (req as any).auth?.userId;
    if (!userId) return res.status(401).json({ message: "Bạn chưa đăng nhập" });

    const { id } = req.params;
    const db = mongoose.connection;

    const attempt = await ProgressAttempt.findById(id)
      .select("_id userId allIds")
      .exec();

    if (!attempt) return res.status(404).json({ message: "Không tìm thấy" });
    if (String(attempt.userId) !== String(userId)) {
      return res.status(403).json({ message: "Không có quyền truy cập" });
    }

    const ids = Array.isArray(attempt.allIds) ? attempt.allIds : [];
    if (!ids.length) return res.json({ items: [], stimulusMap: {} });

    const itemsCol = db.collection(ITEMS_COLL);
    const stimCol = db.collection(STIMULI_COLL);

    const items = await itemsCol
      .aggregate([
        { $match: { id: { $in: ids } } },
        { $addFields: { _order: { $indexOfArray: [ids, "$id"] } } },
        { $sort: { _order: 1 } },
        { $project: { _id: 0, _order: 0 } },
      ])
      .toArray();

    const sids = Array.from(
      new Set(items.map((it: any) => it.stimulusId).filter(Boolean))
    );
    const stArr = sids.length
      ? await stimCol
          .find({ id: { $in: sids } }, { projection: { _id: 0 } })
          .toArray()
      : [];

    const stimulusMap: Record<string, any> = {};
    for (const s of stArr) stimulusMap[s.id] = s;

    return res.json({ items, stimulusMap });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
}

function getEligibilityWindowMs() {
  const raw = Number(process.env.PROGRESS_ELIGIBILITY_MINUTES);
  const minutes = Number.isFinite(raw) && raw > 0 ? raw : 5 * 24 * 60;
  return minutes * 60_000;
}

export async function getProgressEligibility(req: Request, res: Response) {
  try {
    const userId = (req as any).auth?.userId;
    if (!userId) return res.status(401).json({ message: "Bạn chưa đăng nhập" });

    const me = await User.findById(userId)
      .select("progressMeta")
      .lean<{ progressMeta?: any }>();

    // Lấy progress gần nhất & practice gần nhất
    const [lastProgress, lastPracticeOverall] = await Promise.all([
      ProgressAttempt.findOne({ userId })
        .sort({ submittedAt: -1 })
        .select({ submittedAt: 1, _id: 0 })
        .lean<{ submittedAt?: Date }>(),
      PracticeAttempt.findOne({ userId })
        .sort({ createdAt: -1 })
        .select({ createdAt: 1, _id: 0 })
        .lean<{ createdAt?: Date }>(),
    ]);

    // Không có practice => không nhắc progress
    if (!lastPracticeOverall?.createdAt) {
      return res.json({
        eligible: false,
        reason: "no_practice_yet",
        nextEligibleAt: null,
        remainingMs: null,
        windowMinutes: getEligibilityWindowMs() / 60_000,
        suggestedAt: me?.progressMeta?.lastSuggestedAt ?? null,
      });
    }

    const lastProgressAt = lastProgress?.submittedAt
      ? new Date(lastProgress.submittedAt)
      : null;

    let anchorPractice: Date | null = null;

    if (!lastProgressAt) {
      // Chưa từng progress → mốc = lần practice gần nhất
      anchorPractice = new Date(lastPracticeOverall.createdAt);
    } else {
      // Đã có progress → phải có practice sau progress, mốc = practice gần nhất SAU progress
      const lastPracticeAfterProgress = await PracticeAttempt.findOne({
        userId,
        createdAt: { $gt: lastProgressAt },
      })
        .sort({ createdAt: -1 })
        .select({ createdAt: 1, _id: 0 })
        .lean<{ createdAt?: Date }>();

      if (!lastPracticeAfterProgress?.createdAt) {
        // Chưa có practice sau progress → chưa được nhắc
        return res.json({
          eligible: false,
          reason: "no_practice_after_progress",
          nextEligibleAt: null,
          remainingMs: null,
          windowMinutes: getEligibilityWindowMs() / 60_000,
          suggestedAt: me?.progressMeta?.lastSuggestedAt ?? null,
        });
      }

      anchorPractice = new Date(lastPracticeAfterProgress.createdAt);
    }

    const WINDOW_MS = getEligibilityWindowMs();
    const nextEligibleAt = new Date(anchorPractice.getTime() + WINDOW_MS);
    const now = Date.now();
    const eligible = now >= nextEligibleAt.getTime();

    return res.json({
      eligible,
      reason: eligible ? "ok" : "waiting_window",
      since: anchorPractice.toISOString(),
      windowMinutes: WINDOW_MS / 60_000,
      nextEligibleAt: nextEligibleAt.toISOString(),
      remainingMs: Math.max(0, nextEligibleAt.getTime() - now),
      suggestedAt: me?.progressMeta?.lastSuggestedAt ?? null,
    });
  } catch (e) {
    console.error("[getProgressEligibility] ERROR", e);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
}

/** POST /api/progress/eligibility/ack  — ghi nhận đã hiển thị gợi ý ở phía client */
export async function ackProgressEligibility(req: Request, res: Response) {
  try {
    const userId = (req as any).auth?.userId;
    if (!userId) return res.status(401).json({ message: "Bạn chưa đăng nhập" });

    await User.updateOne(
      { _id: userId },
      {
        $set: {
          "progressMeta.lastSuggestedAt": new Date(),
          updatedAt: new Date(),
        },
      }
    ).exec();

    return res.json({ ok: true });
  } catch (e) {
    console.error("[ackProgressEligibility] ERROR", e);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
}
