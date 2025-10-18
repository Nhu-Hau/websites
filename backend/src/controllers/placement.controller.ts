import { Request, Response } from "express";
import mongoose from "mongoose";
import PlacementAttempt from "../models/PlacementAttempt";
import { User } from "../models/User";

const ITEMS_COLL = process.env.ITEMS_COLL || "parts_placement";
const STIMULI_COLL = process.env.STIMULI_COLL || "stimuli_placement";

function accToLevel(acc: number): 1 | 2 | 3 {
  if (acc >= 0.7) return 3;
  if (acc >= 0.55) return 2;
  return 1;
}
function predictToeic(listeningAcc: number, readingAcc: number) {
  const listening = Math.max(
    0,
    Math.min(495, Math.round((listeningAcc || 0) * 495))
  );
  const reading = Math.max(
    0,
    Math.min(495, Math.round((readingAcc || 0) * 495))
  );
  const overall = listening + reading;
  return { overall, listening, reading };
}

// GET /api/placement/test
export async function getPlacementTest(req: Request, res: Response) {
  const db = mongoose.connection;
  const def = await db.collection("placements").findOne({});
  if (!def) return res.status(404).json({ message: "Chưa có placement test" });
  return res.json(def);
}

// POST /api/placement/items
export async function getPlacementItems(req: Request, res: Response) {
  const { ids } = req.body as { ids?: string[] };
  if (!ids?.length) return res.status(400).json({ message: "Thiếu ids" });

  const db = mongoose.connection;
  const itemsCol = db.collection(ITEMS_COLL);
  const stimCol = db.collection(STIMULI_COLL);

  const itemsArr = await itemsCol
    .find({ id: { $in: ids } }, { projection: { _id: 0 } })
    .toArray();

  const byId: Record<string, any> = {};
  for (const it of itemsArr) byId[it.id] = it;
  const items = ids.map((id) => byId[id]).filter(Boolean);

  const sids = Array.from(
    new Set(items.map((it) => it.stimulusId).filter(Boolean))
  );
  const stArr = await stimCol
    .find({ id: { $in: sids } }, { projection: { _id: 0 } })
    .toArray();

  const stimulusMap: Record<string, any> = {};
  for (const s of stArr) stimulusMap[s.id] = s;

  return res.json({ items, stimulusMap });
}

// POST /api/placement/grade  (chấm tạm – không lưu DB)
export async function gradePlacement(req: Request, res: Response) {
  const { testId, answers, timeSec, allIds } = req.body as {
    testId?: string;
    answers?: Record<string, string>;
    timeSec?: number;
    allIds?: string[];
  };
  if (!testId || !answers) {
    return res.status(400).json({ message: "Thiếu dữ liệu" });
  }

  const db = mongoose.connection;
  const itemsCol = db.collection(ITEMS_COLL);
  const ids =
    Array.isArray(allIds) && allIds.length ? allIds : Object.keys(answers);

  const items = await itemsCol
    .find(
      { id: { $in: ids } },
      { projection: { _id: 0, id: 1, part: 1, answer: 1 } }
    )
    .toArray();

  let total = items.length,
    correct = 0,
    L = 0,
    Lc = 0,
    R = 0,
    Rc = 0;

  // thống kê theo Part
  type PartStat = { total: number; correct: number; acc: number };
  const partStats: Record<string, PartStat> = {};

  for (const it of items) {
    const picked = answers[it.id] ?? null;
    const ok = picked !== null && picked === it.answer;
    if (ok) correct++;

    const isListening = ["part.1", "part.2", "part.3", "part.4"].includes(
      it.part
    );
    if (isListening) {
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

  for (const k of Object.keys(partStats)) {
    const s = partStats[k];
    s.acc = s.total ? s.correct / s.total : 0;
  }

  const acc = total ? correct / total : 0;
  const level = accToLevel(acc);

  const listening = { total: L, correct: Lc, acc: L ? Lc / L : 0 };
  const reading = { total: R, correct: Rc, acc: R ? Rc / R : 0 };

  // điểm ước lượng
  const predicted = predictToeic(listening.acc, reading.acc);

  // part yếu (mặc định < 60%)
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
    predicted, // NEW
    partStats, // NEW
    weakParts, // NEW
    answersMap: items.reduce(
      (m, it) => ((m[it.id] = { correctAnswer: it.answer }), m),
      {} as Record<string, { correctAnswer: string }>
    ),
  });
}

export async function submitPlacement(req: Request, res: Response) {
  try {
    const userId = (req as any).auth?.userId;
    if (!userId) return res.status(401).json({ message: "Bạn chưa đăng nhập" });

    // không cho làm lại
    const existed = await PlacementAttempt.findOne({ userId });
    if (existed) {
      return res
        .status(403)
        .json({ message: "Bạn đã làm placement test, không thể làm lại." });
    }

    const { testId, answers, allIds, timeSec, startedAt, version } =
      req.body as {
        testId?: string;
        answers?: Record<string, string>;
        allIds?: string[];
        timeSec?: number;
        startedAt?: string;
        version?: string;
      };

    if (!testId || !answers || !allIds?.length) {
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
      const isL = ["part.1", "part.2", "part.3", "part.4"].includes(it.part);
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

    // tính acc từng part
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

    // Lưu Attempt
    const attempt = await PlacementAttempt.create({
      userId,
      testId,
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

    // === NEW: tính partLevels & toeicPred để lưu vào User ===
    const partLevels: Record<string, 1 | 2 | 3> = {};
    Object.entries(partStats).forEach(([k, s]) => {
      partLevels[k] = accToLevel(s.acc);
    });
    const toeicPred = predicted; // {overall,listening,reading}

    await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          level,
          levelUpdatedAt: new Date(),
          levelSource: "placement",
          lastPlacementAttemptId: attempt._id,
          partLevels, // NEW
          toeicPred, // NEW
        },
      },
      { new: false }
    );

    return res.json({
      attemptId: attempt._id.toString(),
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
      answersMap: itemResults.reduce((m, r) => {
        m[r.id] = { correctAnswer: r.correctAnswer };
        return m;
      }, {} as Record<string, { correctAnswer: string }>),
    });
  } catch (e) {
    console.error(e);
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
    const attempt = await PlacementAttempt.findById(id).lean();
    if (!attempt) return res.status(404).json({ message: "Không tìm thấy" });

    if (String(attempt.userId) !== String(userId)) {
      return res.status(403).json({ message: "Không có quyền truy cập" });
    }

    return res.json(attempt);
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

    const attempt = await PlacementAttempt.findById(id)
      .select("_id userId allIds")
      .lean();

    if (!attempt) return res.status(404).json({ message: "Không tìm thấy" });
    if (String(attempt.userId) !== String(userId))
      return res.status(403).json({ message: "Không có quyền truy cập" });

    const ids: string[] = Array.isArray(attempt.allIds) ? attempt.allIds : [];
    if (!ids.length) return res.json({ items: [], stimulusMap: {} });

    // Lấy items và sort theo vị trí trong ids (server-side)
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

    // Map stimulus ids
    const sids = Array.from(
      new Set(items.map((it: any) => it.stimulusId).filter(Boolean))
    );
    const stArr = sids.length
      ? await stimCol
          .find({ id: { $in: sids } }, { projection: { _id: 0 } })
          .toArray()
      : [];

    const stimulusMap: Record<string, any> = {};
    stArr.forEach((s: any) => (stimulusMap[s.id] = s));

    return res.json({ items, stimulusMap });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
}
