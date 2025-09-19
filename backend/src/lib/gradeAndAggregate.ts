import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

const ITEMS_COLL = process.env.ITEMS_COLL || 'parts';

// Dùng schema lỏng cho Item để dễ tương thích dữ liệu bạn đã import
const ItemModel = mongoose.connection.collection(ITEMS_COLL);

type ChoiceId = 'A'|'B'|'C'|'D';
type Part = 'part.1'|'part.2'|'part.3'|'part.4'|'part.5'|'part.6'|'part.7';

export type AnswerInput = { itemId: string; choice: ChoiceId; timeSec?: number };

export async function fetchItemsMap(itemIds: string[]) {
  const docs = await ItemModel
    .find({ id: { $in: itemIds } }, { projection: { id:1, part:1, tags:1, answer:1 } })
    .toArray();
  const map = new Map<string, any>();
  docs.forEach(d => map.set(d.id, d));
  return map;
}

export function gradeAnswers(
  answers: AnswerInput[],
  itemsMap: Map<string, any>
) {
  let correct = 0;
  const detailed = answers.map(a => {
    const it = itemsMap.get(a.itemId);
    const isCorrect = !!it && a.choice === it.answer;
    if (isCorrect) correct++;
    return {
      itemId: a.itemId,
      choice: a.choice,
      correct: isCorrect,
      timeSec: a.timeSec,
      at: new Date(),
      part: it?.part as Part | undefined,
      tags: Array.isArray(it?.tags) ? (it.tags as string[]) : []
    };
  });
  return { total: answers.length, correct, detailed };
}

// Thống kê theo Part
export function breakdownByPart(detailed: Array<{part?: Part; correct: boolean}>) {
  const agg = new Map<Part, { attempts:number; correct:number }>();
  for (const r of detailed) {
    if (!r.part) continue;
    const cur = agg.get(r.part) || { attempts:0, correct:0 };
    cur.attempts++; if (r.correct) cur.correct++;
    agg.set(r.part, cur);
  }
  return [...agg.entries()].map(([part, v]) => ({
    part,
    attempts: v.attempts,
    correct: v.correct,
    accuracy: v.attempts ? v.correct / v.attempts : 0
  })).sort((a,b) => a.part.localeCompare(b.part));
}

// Thống kê theo Tag (vì bạn gom tất cả vào `tags`)
export function breakdownByTag(detailed: Array<{tags: string[]; correct: boolean}>) {
  const agg = new Map<string, { attempts:number; correct:number }>();
  for (const r of detailed) {
    const tags = r.tags || [];
    for (const t of tags) {
      const cur = agg.get(t) || { attempts:0, correct:0 };
      cur.attempts++; if (r.correct) cur.correct++;
      agg.set(t, cur);
    }
  }
  const rows = [...agg.entries()].map(([tag, v]) => ({
    tag,
    attempts: v.attempts,
    correct: v.correct,
    accuracy: v.attempts ? v.correct / v.attempts : 0
  }));
  // Ưu tiên những tag người dùng làm nhiều (attempts desc), sau đó accuracy asc
  rows.sort((a,b) => (b.attempts - a.attempts) || (a.accuracy - b.accuracy));
  return rows;
}

// Optional: map slug -> label từ data/tags.json (để trả UI thân thiện)
const tagsJsonPath = path.join(process.cwd(), 'data/tags.json');
let TAGS_DICT: Record<string, string> | null = null;

function loadTagsDict() {
  if (TAGS_DICT) return TAGS_DICT;
  if (!fs.existsSync(tagsJsonPath)) return TAGS_DICT = {};
  const raw = JSON.parse(fs.readFileSync(tagsJsonPath, 'utf-8'));
  const dict: Record<string,string> = {};
  // part mảng
  if (Array.isArray(raw.part)) raw.part.forEach((p: string) => (dict[p] = p));
  // các nhóm object
  ['format','qtype','topic','grammar','structure'].forEach((g) => {
    Object.entries(raw[g] || {}).forEach(([slug, label]: any) => {
      dict[slug] = String(label);
    });
  });
  TAGS_DICT = dict;
  return dict;
}

export function attachLabelsToTags(rows: Array<{tag:string}>) {
  const dict = loadTagsDict();
  return rows.map(r => ({ ...r, label: dict[r.tag] || r.tag }));
}