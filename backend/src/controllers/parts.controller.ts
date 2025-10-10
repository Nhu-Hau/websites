// src/controllers/parts.controller.ts
import { Request, Response } from "express";
import mongoose from "mongoose";

const PARTS_COLL = process.env.PARTS_COLL || "parts";           // <-- collection items luyện part
const STIMULI_COLL = process.env.STIMULI_COLL || "stimuli";     // <-- collection stimuli luyện part

/**
 * GET /api/parts/:partKey/items?level=1&limit=50
 * Yêu cầu: level bắt buộc (1..4). Trả items theo part+level và stimulus kèm theo.
 */
export async function getPartItemsByLevel(req: Request, res: Response) {
  try {
    const { partKey } = req.params;
    const levelRaw = req.query.level;
    const limitRaw = req.query.limit;

    // ✅ ép kiểu rõ ràng, tránh so sánh sai kiểu
    const level = Number(levelRaw);
    if (![1, 2, 3, 4].includes(level)) {
      return res.status(400).json({ message: "level phải là 1, 2, 3 hoặc 4" });
    }

    const limit = Math.min(Math.max(parseInt(String(limitRaw || 50), 10), 1), 200);

    const db = mongoose.connection;
    const itemsCol = db.collection(PARTS_COLL);
    const stimCol = db.collection(STIMULI_COLL);

    // ✅ LỌC CHUẨN THEO part + level
    const match = { part: String(partKey), level };

    // Nếu muốn thứ tự ổn định, có thể sort theo một field cố định (order) hoặc id
    const items = await itemsCol
      .find(match, { projection: { _id: 0 } })
      .sort({ order: 1, id: 1 })
      .limit(limit)
      .toArray();

    // Lấy tập stimulusId và fetch map
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