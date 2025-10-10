import { Request, Response } from "express";
import mongoose from "mongoose";
import { ToeicTest, IToeicTest } from "../models/Test";
import { TestAttempt, PartKey } from "../models/TestAttempt";

const PARTS_COLL = process.env.ITEMS_COLL || "parts";      // bạn dùng "parts"
const STIMULI_COLL = process.env.STIMULI_COLL || "stimuli";// bạn dùng "stimuli"

const LISTENING_SET = new Set(["part.1","part.2","part.3","part.4"]);

function accToLevel4(acc: number): 1|2|3|4 {
  if (acc >= 0.85) return 4;
  if (acc >= 0.7)  return 3;
  if (acc >= 0.55) return 2;
  return 1;
}

/** GET /api/tests/:testId/items?parts=part.1,part.3,part.7
 * Trả: { items, stimulusMap }
 */
export async function getTestItems(req: Request, res: Response) {
  try {
    const { testId } = req.params;
    const raw = String(req.query.parts || "").trim();
    const reqParts = raw
      ? raw.split(",").map(s => s.trim()).filter(Boolean) as PartKey[]
      : [];

    // Lấy đề
    const test = await ToeicTest.findOne({ testId }).lean<IToeicTest | null>();
    if (!test) return res.status(404).json({ message: "Không tìm thấy test" });

    // Nếu không truyền parts -> lấy tất cả (7 part)
    const partKeys: PartKey[] = reqParts.length
      ? reqParts
      : (["part.1","part.2","part.3","part.4","part.5","part.6","part.7"] as PartKey[]);

    // Gom danh sách id item theo các partKey từ document test
    const allIds: string[] = [];
    const sections = Array.isArray(test.sections) ? test.sections : [];
    for (const sec of sections) {
      const parts = (sec as any)?.parts as Record<string, string[]> | undefined;
      if (!parts) continue;
      for (const pk of partKeys) {
        const ids = parts[pk];
        if (Array.isArray(ids)) allIds.push(...ids);
      }
    }

    if (allIds.length === 0) {
      return res.json({ items: [], stimulusMap: {} });
    }

    const db = mongoose.connection;
    const itemsCol = db.collection(PARTS_COLL);
    const stimCol = db.collection(STIMULI_COLL);

    // Lấy items
    const itemsArr = await itemsCol
      .find({ id: { $in: allIds } }, { projection: { _id: 0 } })
      .toArray();

    // Giữ đúng thứ tự theo allIds
    const byId: Record<string, any> = {};
    for (const it of itemsArr) byId[it.id] = it;
    const items = allIds.map((id) => byId[id]).filter(Boolean);

    // Lấy stimuli map
    const sids = Array.from(new Set(items.map((it) => it.stimulusId).filter(Boolean)));
    const stArr = await stimCol
      .find({ id: { $in: sids } }, { projection: { _id: 0 } })
      .toArray();

    const stimulusMap: Record<string, any> = {};
    for (const s of stArr) stimulusMap[s.id] = s;

    return res.json({ items, stimulusMap });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Lỗi server" });
  }
}

/** POST /api/tests/:testId/submit
 * body: { partKeys: string[], answers: Record<itemId, choiceId>, timeSec?: number, allIds?: string[], startedAt?: string }
 * Trả: { attemptId, total, correct, acc, listening, reading, level4, timeSec, answersMap }
 */
export async function submitTestAttempt(req: Request, res: Response) {
  try {
    const userId = (req as any).auth?.userId;
    if (!userId) return res.status(401).json({ message: "Bạn chưa đăng nhập" });

    const { testId } = req.params;
    const { partKeys, answers, timeSec, allIds, startedAt } = req.body as {
      partKeys?: PartKey[];
      answers?: Record<string, string>;
      timeSec?: number;
      allIds?: string[];
      startedAt?: string;
    };

    if (!testId || !answers) {
      return res.status(400).json({ message: "Thiếu dữ liệu" });
    }

    // Nếu FE gửi kèm allIds -> dùng để chấm cả câu bỏ trống
    let ids: string[] = Array.isArray(allIds) && allIds.length ? allIds : Object.keys(answers);

    // Load items
    const db = mongoose.connection;
    const itemsCol = db.collection(PARTS_COLL);
    const items = await itemsCol
      .find({ id: { $in: ids } }, { projection: { _id: 0, id: 1, part: 1, answer: 1 } })
      .toArray();

    let total = items.length,
      correct = 0,
      L = 0, Lc = 0,
      R = 0, Rc = 0;

    const itemResults = items.map((it) => {
      const picked = answers[it.id] ?? null;
      const ok = picked !== null && picked === it.answer;

      if (ok) correct++;
      if (LISTENING_SET.has(it.part)) {
        L++; if (ok) Lc++;
      } else {
        R++; if (ok) Rc++;
      }
      return {
        id: it.id,
        part: it.part as PartKey,
        picked,
        correctAnswer: it.answer,
        isCorrect: ok,
      };
    });

    const acc = total ? correct / total : 0;
    const listening = { total: L, correct: Lc, acc: L ? Lc / L : 0 };
    const reading   = { total: R, correct: Rc, acc: R ? Rc / R : 0 };
    const level4 = accToLevel4(acc);

    const uniqParts = Array.isArray(partKeys) && partKeys.length
      ? Array.from(new Set(partKeys))
      : Array.from(new Set(items.map((it) => it.part))) as PartKey[];

    const attempt = await TestAttempt.create({
      userId,
      testId,
      partKeys: uniqParts,
      total, correct, acc,
      listening, reading,
      items: itemResults,
      timeSec: timeSec || 0,
      startedAt: startedAt ? new Date(startedAt) : null,
      submittedAt: new Date(),
      version: "1.0.0",
      isFull: uniqParts.length === 7,
      firstLocked: false, // TODO: sau này implement khóa điểm lần 1
    });

    // Trả về để FE hiển thị kết quả
    return res.json({
      attemptId: attempt._id.toString(),
      total, correct, acc, listening, reading,
      timeSec: timeSec || 0,
      level: level4,
      answersMap: itemResults.reduce((m, r) => {
        m[r.id] = { correctAnswer: r.correctAnswer };
        return m;
      }, {} as Record<string, { correctAnswer: string }>),
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Lỗi server" });
  }
}

export async function listTests(req: Request, res: Response) {
  const db = mongoose.connection;
  const col = db.collection(process.env.TESTS_COLL || "tests");

  const { part, level } = req.query as { part?: string; level?: string };

  const q: any = {};
  if (part) q["parts"] = part; // nếu bạn lưu mảng parts trong doc, ví dụ: parts: ["part.1","part.2"]
  if (level) q["level"] = Number(level);

  // chỉ lấy các field FE cần
  const projection = {
    _id: 0,
    testId: 1,
    title: 1,
    access: 1,
    totalQuestions: 1,
    totalDurationMin: 1,
    level: 1,
    parts: 1,
  };

  const items = await col.find(q, { projection }).sort({ createdAt: -1 }).toArray();
  return res.json({ items });
}