import { Request, Response } from "express";
import mongoose, { Types } from "mongoose";
import { PlacementAttempt } from "../models/PlacementAttempt";
import { User } from "../models/User";
import { chatService } from "../services/chat.service";
import { checkAndAwardBadges } from "../services/badge.service";

const ITEMS_COLL = process.env.PLACEMENT_PARTS_COLL || "placement_parts";
const STIMULI_COLL = process.env.PLACEMENT_STIMULI_COLL || "placement_stimuli";

const LISTENING = new Set(["part.1", "part.2", "part.3", "part.4"]);
const READING = new Set(["part.5", "part.6", "part.7"]);

function accToLevel(acc: number): 1 | 2 | 3 {
  if (acc >= 0.7) return 3;
  if (acc >= 0.55) return 2;
  return 1;
}
function round5_495(n: number): number {
  return Math.min(495, Math.max(0, Math.round(n / 5) * 5));
}

function round5_990(n: number): number {
  return Math.min(990, Math.max(0, Math.round(n / 5) * 5));
}

function predictToeic(listeningAcc: number, readingAcc: number) {
  const listeningRaw = Math.max(
    0,
    Math.min(495, Math.round((listeningAcc || 0) * 495))
  );
  const readingRaw = Math.max(
    0,
    Math.min(495, Math.round((readingAcc || 0) * 495))
  );
  const listening = round5_495(listeningRaw);
  const reading = round5_495(readingRaw);
  const overall = round5_990(listening + reading);
  return { overall, listening, reading };
}

/** NEW: GET /api/placement/paper
 * Optional query limit mỗi part: ?p1=4&p2=8&p3=9&p4=9&p5=10&p6=8&p7=7
 * Không truyền thì lấy toàn bộ mỗi part.
 */
export async function getPlacementPaper(req: Request, res: Response) {
  try {
    const db = mongoose.connection;
    const itemsCol = db.collection(ITEMS_COLL);
    const stimCol = db.collection(STIMULI_COLL);

    const limits = {
      "part.1": Number(req.query.p1 ?? 0),
      "part.2": Number(req.query.p2 ?? 0),
      "part.3": Number(req.query.p3 ?? 0),
      "part.4": Number(req.query.p4 ?? 0),
      "part.5": Number(req.query.p5 ?? 0),
      "part.6": Number(req.query.p6 ?? 0),
      "part.7": Number(req.query.p7 ?? 0),
    };

    const parts = Object.keys(limits);
    let items: any[] = [];
    for (const pk of parts as (keyof typeof limits)[]) {
      const lim =
        Number.isFinite(limits[pk]) && limits[pk] > 0 ? limits[pk] : 0;
      const cur = itemsCol
        .find({ part: pk }, { projection: { _id: 0 } })
        .sort({ order: 1, id: 1 });
      items = items.concat(
        lim > 0 ? await cur.limit(lim).toArray() : await cur.toArray()
      );
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

    return res.json({ items, stimulusMap });
  } catch (e) {
    console.error("[getPlacementPaper] ERROR", e);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
}

/** SỬA: POST /api/placement/grade — KHÔNG yêu cầu testId */
export async function gradePlacement(req: Request, res: Response) {
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
    console.error("[gradePlacement] ERROR", e);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
}

/** SỬA: POST /api/placement/submit — KHÔNG yêu cầu testId */
export async function submitPlacement(req: Request, res: Response) {
  try {
    const userId = (req as any).auth?.userId;
    if (!userId) return res.status(401).json({ message: "Bạn chưa đăng nhập" });

    const existed = await PlacementAttempt.findOne({ userId }).lean();
    if (existed) {
      return res
        .status(403)
        .json({ message: "Bạn đã làm placement test, không thể làm lại." });
    }

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

    const attempt = await PlacementAttempt.create({
      userId,
      testId: "paper_v1", // giữ field cho tiện filter/history, không phụ thuộc collection 'placements'
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

    const partLevels: Record<string, 1 | 2 | 3> = {};
    Object.entries(partStats).forEach(([k, s]) => {
      partLevels[k] = accToLevel(s.acc);
    });
    const toeicPred = predicted;

    await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          level,
          levelUpdatedAt: new Date(),
          levelSource: "placement",
          lastPlacementAttemptId: attempt._id,
          partLevels,
          toeicPred,
        },
      },
      { new: false }
    );

    // Tự động gửi Learning Insight vào chat (chạy async, không block response)
    chatService.generateLearningInsight(
      String(userId),
      "placement",
      String(attempt._id),
      "default"
    ).catch((err) => {
      console.error("[submitPlacement] Error generating Learning Insight:", err);
    });

    // Kiểm tra và cấp badges (async, không block response)
    checkAndAwardBadges(new Types.ObjectId(String(userId))).catch((err) => {
      console.error("[submitPlacement] Error checking badges:", err);
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
    console.error("[submitPlacement] ERROR", e);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
}

// GET /api/placement/attempts?limit=10&page=1
export async function getMyPlacementAttempts(req: Request, res: Response) {
  try {
    const userId =
      (req as any).auth?.userId || (req.query.userId as string | undefined);
    if (!userId) return res.status(401).json({ message: "Bạn chưa đăng nhập" });

    const limit = Math.min(parseInt(String(req.query.limit || 10)), 50);
    const page = Math.max(parseInt(String(req.query.page || 1)), 1);

    const [items, total] = await Promise.all([
      PlacementAttempt.find({ userId })
        .sort({ submittedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select(
          "_id testId level acc correct total listening reading submittedAt timeSec version"
        )
        .lean(),
      PlacementAttempt.countDocuments({ userId }),
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

// GET /api/placement/attempts/:id
export async function getPlacementAttemptById(req: Request, res: Response) {
  try {
    const userId =
      (req as any).auth?.userId || (req.query.userId as string | undefined);
    if (!userId) return res.status(401).json({ message: "Bạn chưa đăng nhập" });

    const { id } = req.params;

    // ⚠️ Dùng findById + exec(), KHÔNG dùng find()
    const attempt = await PlacementAttempt.findById(id).exec();
    if (!attempt) return res.status(404).json({ message: "Không tìm thấy" });

    // userId trong doc là ObjectId => so sánh string
    if (String(attempt.userId) !== String(userId)) {
      return res.status(403).json({ message: "Không có quyền truy cập" });
    }

    return res.json(attempt.toObject());
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
}

// controllers/placement.controller.ts
export async function getPlacementAttemptItemsOrdered(
  req: Request,
  res: Response
) {
  try {
    const userId = (req as any).auth?.userId;
    if (!userId) return res.status(401).json({ message: "Bạn chưa đăng nhập" });

    const { id } = req.params;
    const db = mongoose.connection;

    // ⚠️ Dùng findById + select + exec(), KHÔNG lean để khỏi rớt kiểu
    const attempt = await PlacementAttempt.findById(id)
      .select("_id userId allIds")
      .exec();

    if (!attempt) return res.status(404).json({ message: "Không tìm thấy" });
    if (String(attempt.userId) !== String(userId)) {
      return res.status(403).json({ message: "Không có quyền truy cập" });
    }

    const ids = Array.isArray(attempt.allIds) ? attempt.allIds : [];
    if (!ids.length) return res.json({ items: [], stimulusMap: {} });

    const itemsCol = db.collection(process.env.ITEMS_COLL || "parts_placement");
    const stimCol = db.collection(
      process.env.STIMULI_COLL || "stimuli_placement"
    );

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
