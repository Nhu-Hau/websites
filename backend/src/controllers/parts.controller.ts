//backend/src/controllers/parts.controller.ts
import { Request, Response } from "express";
import mongoose from "mongoose";

const PARTS_COLL = process.env.PARTS_COLL || "practice_parts";
const STIMULI_COLL = process.env.STIMULI_COLL || "practice_stimuli";

/** GET /api/parts/:partKey/tests?level=1
 *  -> trả về danh sách test khả dụng cho part + level (ví dụ: [1,2,3])
 */
export async function listTestsByLevel(req: Request, res: Response) {
  try {
    const { partKey } = req.params;
    const level = Number(req.query.level);
    if (!["part.1","part.2","part.3","part.4","part.5","part.6","part.7"].includes(String(partKey))) {
      return res.status(400).json({ message: "partKey không hợp lệ" });
    }
    if (![1,2,3].includes(level)) {
      return res.status(400).json({ message: "level phải là 1, 2 hoặc 3" });
    }

    const db = mongoose.connection;
    const itemsCol = db.collection(PARTS_COLL);

    const tests = await itemsCol
      .distinct("test", { part: String(partKey), level });

    // sắp xếp tăng dần và lọc số nguyên
    const list = (tests as number[])
      .filter((t) => Number.isInteger(t))
      .sort((a,b) => a - b);

    return res.json({ tests: list });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
}

/** GET /api/parts/:partKey/items?level=1&test=2&limit=50
 *  -> trả items đúng theo part + level + test
 */
export async function getPartItemsByLevelAndTest(req: Request, res: Response) {
  try {
    const { partKey } = req.params;
    const level = Number(req.query.level);
    const test = Number(req.query.test);
    const limitRaw = req.query.limit;

    if (!["part.1","part.2","part.3","part.4","part.5","part.6","part.7"].includes(String(partKey))) {
      return res.status(400).json({ message: "partKey không hợp lệ" });
    }
    if (![1,2,3].includes(level)) {
      return res.status(400).json({ message: "level phải là 1, 2 hoặc 3" });
    }
    if (!Number.isInteger(test)) {
      return res.status(400).json({ message: "test phải là số nguyên (ví dụ 1,2,3…)" });
    }

    const limit = Math.min(Math.max(parseInt(String(limitRaw || 200), 10), 1), 500);

    const db = mongoose.connection;
    const itemsCol = db.collection(PARTS_COLL);
    const stimCol  = db.collection(STIMULI_COLL);

    // LỌC CHUẨN: bắt buộc part + level + test
    const match = { part: String(partKey), level, test };

    const items = await itemsCol
      .find(match, { projection: { _id: 0 } })
      .sort({ order: 1, id: 1 })
      .limit(limit)
      .toArray();

    // build stimulusMap
    const sids = Array.from(new Set(items.map((it: any) => it.stimulusId).filter(Boolean)));
    const stArr = sids.length
      ? await stimCol.find({ id: { $in: sids } }, { projection: { _id: 0 } }).toArray()
      : [];
    const stimulusMap: Record<string, any> = {};
    for (const s of stArr) stimulusMap[s.id] = s;

    return res.json({ items, stimulusMap });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
}