// src/controllers/test.controller.ts
import { Request, Response } from "express";
import mongoose from "mongoose";

const ITEMS_COLL = process.env.ITEMS_COLL || "parts_placement";
const STIMULI_COLL = process.env.STIMULI_COLL || "stimuli_placement";

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

// POST /api/placement/grade
export async function gradePlacement(req: Request, res: Response) {
  const { testId, answers, timeSec } = req.body;
  if (!testId || !answers) {
    return res.status(400).json({ message: "Thiếu dữ liệu" });
  }

  const db = mongoose.connection;
  const itemsCol = db.collection(ITEMS_COLL);
  const ids = Object.keys(answers);

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
  for (const it of items) {
    const ok = answers[it.id] === it.answer;
    if (ok) correct++;
    if (["part.1", "part.2", "part.3", "part.4"].includes(it.part)) {
      L++;
      if (ok) Lc++;
    } else {
      R++;
      if (ok) Rc++;
    }
  }

  const acc = total ? correct / total : 0;
  let level = "beginner";
  if (acc >= 0.85) level = "advanced";
  else if (acc >= 0.7) level = "upper";
  else if (acc >= 0.55) level = "intermediate";
  else if (acc >= 0.4) level = "elementary";

  return res.json({
    total,
    correct,
    acc,
    listening: { total: L, correct: Lc, acc: L ? Lc / L : 0 },
    reading: { total: R, correct: Rc, acc: R ? Rc / R : 0 },
    timeSec: timeSec || 0,
    level,
    answersMap: items.reduce(
      (m, it) => ((m[it.id] = { correctAnswer: it.answer }), m),
      {} as Record<string, { correctAnswer: string }>
    ),
  });
}
