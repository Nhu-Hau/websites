import { Request, Response } from "express";
import mongoose from "mongoose";

const ITEMS_COLL = process.env.ITEMS_COLL || "parts";
const STIMULI_COLL = process.env.STIMULI_COLL || "stimuli";

/**
 * GET /api/items/by-part?part=part.1&limit=6&shuffle=1
 * Trả về danh sách item theo part, kèm stimulusMap (id -> stimulus)
 * *Không trả answer* để client không lộ đáp án.
 */
export async function getItemsByPart(req: Request, res: Response) {
  try {
    const part = String(req.query.part || "");
    if (!part) return res.status(400).json({ message: "Thiếu query ?part=" });

    const limit = Math.max(1, Math.min(Number(req.query.limit || 6), 200));
    const shuffle = String(req.query.shuffle || "0") === "1";

    const db = mongoose.connection;
    const itemsCol = db.collection(ITEMS_COLL);

    // lấy items theo part, loại trường answer
    // lấy items theo part, loại trường answer
    let items = await itemsCol
      .find({ part }, { projection: { _id: 0, answer: 0 } })
      .sort({ order: 1 })
      .limit(5000)
      .toArray();

    if (!items.length) return res.json({ items: [], stimulusMap: {} });

    if (shuffle) items = items.sort(() => Math.random() - 0.5);
    items = items.slice(0, limit);

    // lấy stimuli theo stimulusId
    const stimulusIds = [
      ...new Set(items.map((it: any) => it.stimulusId).filter(Boolean)),
    ];
    const stimuliCol = db.collection(STIMULI_COLL);
    const stimuli = await stimuliCol
      .find({ id: { $in: stimulusIds } }, { projection: { _id: 0 } })
      .toArray();

    // map id -> stimulus
    const stimulusMap: Record<string, any> = {};
    for (const s of stimuli) stimulusMap[s.id] = s;

    return res.json({ items, stimulusMap });
  } catch (e: any) {
    return res.status(500).json({ message: "Lỗi lấy items theo part" });
  }
}

export async function getItemsByIds(req: any, res: any) {
  try {
    const q = String(req.query.ids || '');
    const ids = q.split(',').map(s=>s.trim()).filter(Boolean);
    const reveal = String(req.query.reveal || '0') === '1';

    if (!ids.length) return res.status(400).json({ message: 'Thiếu ?ids=' });

    const db = mongoose.connection;
    const itemsCol = db.collection(ITEMS_COLL);

    const projection: any = { _id: 0 };
    if (!reveal) projection.answer = 0;

    const items = await itemsCol.find({ id: { $in: ids } }, { projection }).toArray();
    return res.json({ items });
  } catch (e:any) {
    return res.status(500).json({ message: 'Lỗi lấy items theo ids' });
  }
}

