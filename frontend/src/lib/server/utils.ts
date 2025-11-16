/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Server-side utility functions
 */

export type Lvl = 1 | 2 | 3;
export type PartKey =
  | "part.1"
  | "part.2"
  | "part.3"
  | "part.4"
  | "part.5"
  | "part.6"
  | "part.7";

export const PARTS: PartKey[] = [
  "part.1",
  "part.2",
  "part.3",
  "part.4",
  "part.5",
  "part.6",
  "part.7",
];

export const PART_LABEL: Record<PartKey, string> = {
  "part.1": "Part 1",
  "part.2": "Part 2",
  "part.3": "Part 3",
  "part.4": "Part 4",
  "part.5": "Part 5",
  "part.6": "Part 6",
  "part.7": "Part 7",
};

/**
 * Normalize part levels from user data
 */
export function normalizePartLevels(
  raw: any
): Partial<Record<PartKey, Lvl>> {
  const out: Partial<Record<PartKey, Lvl>> = {};
  if (!raw || typeof raw !== "object") return out;
  for (const p of PARTS) {
    const num = p.split(".")[1];
    let v: any = raw[p];
    if (v == null && raw.part && typeof raw.part === "object")
      v = raw.part[num];
    if (v == null && (raw as any)[num] != null) v = (raw as any)[num];
    const n = Number(v);
    if (n === 1 || n === 2 || n === 3) out[p] = n as Lvl;
  }
  return out;
}

/**
 * Round TOEIC score to nearest 5 (10-990)
 */
export function round5_990(n: number) {
  return Math.min(990, Math.max(10, Math.round(n / 5) * 5));
}

/**
 * Round TOEIC score to nearest 5 (5-495)
 */
export function round5_495(n: number) {
  return Math.min(495, Math.max(5, Math.round(n / 5) * 5));
}

/**
 * Format time label
 */
export function fmtTimeLabel(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1} ${String(d.getHours()).padStart(
    2,
    "0"
  )}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/**
 * Pick user from API response
 */
export function pickUserFromMe(json: any): any | null {
  if (!json) return null;
  if (json.user && typeof json.user === "object") return json.user;
  if (json.data && typeof json.data === "object") return json.data;
  if (json._id || json.id || json.email || json.partLevels || json.toeicPred)
    return json;
  return null;
}












