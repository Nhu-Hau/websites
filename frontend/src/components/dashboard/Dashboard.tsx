/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Gauge, BarChart3, Layers, Target } from "lucide-react";
import { toast } from "sonner";

/* ====================== Types ====================== */
type Lvl = 1 | 2 | 3;
type PartKey =
  | "part.1"
  | "part.2"
  | "part.3"
  | "part.4"
  | "part.5"
  | "part.6"
  | "part.7";

type PracticeAttemptDoc = {
  _id: string;
  partKey: string;
  level: 1 | 2 | 3;
  test?: number | null;
  total: number;
  correct: number;
  acc: number; // 0..1
  timeSec: number;
  createdAt?: string;
  submittedAt?: string;
  isRetake?: boolean;
};

type PracticeHistoryResp = {
  page: number;
  limit: number;
  total: number;
  items: PracticeAttemptDoc[];
};

type UserMe = {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  access?: "free" | "premium";
  role?: "user" | "admin";
  picture?: string;
  level?: Lvl;
  partLevels?: any;
  toeicPred?: {
    overall?: number | null;
    listening?: number | null;
    reading?: number | null;
  } | null;
};

/* ====================== Consts / Utils ====================== */
const PARTS: PartKey[] = [
  "part.1",
  "part.2",
  "part.3",
  "part.4",
  "part.5",
  "part.6",
  "part.7",
];
const PART_LABEL: Record<PartKey, string> = {
  "part.1": "Phần 1",
  "part.2": "Phần 2",
  "part.3": "Phần 3",
  "part.4": "Phần 4",
  "part.5": "Phần 5",
  "part.6": "Phần 6",
  "part.7": "Phần 7",
};

function round5_990(n: number) {
  return Math.min(990, Math.max(10, Math.round(n / 5) * 5));
}

function normalizePartLevels(raw: any): Partial<Record<PartKey, Lvl>> {
  const out: Partial<Record<PartKey, Lvl>> = {};
  if (!raw || typeof raw !== "object") return out;
  for (const p of PARTS) {
    const num = p.split(".")[1];
    let v: any = raw[p];
    if (v == null && raw.part && typeof raw.part === "object") v = raw.part[num];
    if (v == null && raw[num] != null) v = raw[num]; // legacy
    const n = Number(v);
    if (n === 1 || n === 2 || n === 3) out[p] = n as Lvl;
  }
  return out;
}

function fmtTimeLabel(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1} ${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
}

// Cho phép /api/auth/me trả về { user: {...} } hoặc user ở root
function pickUserFromMe(json: any): UserMe | null {
  if (!json) return null;
  if (json.user && typeof json.user === "object") return json.user;
  if (json.data && typeof json.data === "object") return json.data;
  if (json._id || json.id || json.email || json.partLevels || json.toeicPred) return json;
  return null;
}

/* ====================== Component ====================== */
export default function DashboardClient({ locale }: { locale: string }) {
  const [loading, setLoading] = React.useState(true);

  const [levels, setLevels] = React.useState<Partial<Record<PartKey, Lvl>>>({});
  const [toeicOverall, setToeicOverall] = React.useState<number | null>(null);

  const [practiceHist, setPracticeHist] = React.useState<PracticeAttemptDoc[]>([]);
  const [selectedPart, setSelectedPart] = React.useState<PartKey>("part.1");

  const fetchMe = React.useCallback(async () => {
    const rMe = await fetch("/api/auth/me", { credentials: "include", cache: "no-store" });
    if (!rMe.ok) throw new Error("me-failed");
    const jMe = await rMe.json();
    const user: UserMe | null = pickUserFromMe(jMe);

    const partLvFromUser = normalizePartLevels(user?.partLevels);
    setLevels(partLvFromUser);

    const toeicFromUser =
      typeof user?.toeicPred?.overall === "number"
        ? round5_990(user!.toeicPred!.overall as number)
        : null;
    setToeicOverall(toeicFromUser);
  }, []);

  const fetchPracticeHist = React.useCallback(async () => {
    const rPh = await fetch("/api/practice/history?limit=200", {
      credentials: "include",
      cache: "no-store",
    });
    const jPh: PracticeHistoryResp = rPh.ok
      ? await rPh.json()
      : { page: 1, limit: 200, total: 0, items: [] };
    setPracticeHist(jPh.items || []);
  }, []);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        await Promise.all([fetchMe(), fetchPracticeHist()]);
      } catch (e) {
        console.error(e);
        toast.error("Không tải được dữ liệu dashboard");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    // Refetch khi tab quay lại & khi nộp bài practice (nếu trang practice bắn event)
    const onVis = () => {
      if (document.visibilityState === "visible") {
        fetchMe();
        fetchPracticeHist();
      }
    };
    document.addEventListener("visibilitychange", onVis);

    const onPracticeUpdated = () => {
      fetchMe();
      fetchPracticeHist();
    };
    window.addEventListener("practice:updated", onPracticeUpdated as any);

    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("practice:updated", onPracticeUpdated as any);
      mounted = false;
    };
  }, [fetchMe, fetchPracticeHist]);

  /* ---------- Accuracy theo từng part ---------- */
  const lineByPart = React.useMemo(() => {
    const map: Record<PartKey, { at: string; acc: number; level: Lvl; test?: number | null }[]> = {
      "part.1": [],
      "part.2": [],
      "part.3": [],
      "part.4": [],
      "part.5": [],
      "part.6": [],
      "part.7": [],
    };
    const arr = [...practiceHist].sort((a, b) => {
      const ta = new Date(a.submittedAt || a.createdAt || 0).getTime();
      const tb = new Date(b.submittedAt || b.createdAt || 0).getTime();
      return ta - tb; // cũ → mới
    });
    for (const a of arr) {
      const p = a.partKey as PartKey;
      if (!map[p]) continue;
      const at = fmtTimeLabel(a.submittedAt || a.createdAt || "");
      map[p].push({
        at,
        acc: Math.round((a.acc ?? 0) * 1000) / 10,
        level: a.level as Lvl,
        test: a.test,
      });
    }
    return map;
  }, [practiceHist]);

  /* ---------- Last accuracy per part ---------- */
  const lastAccByPart: Partial<Record<PartKey, number>> = React.useMemo(() => {
    const map: Partial<Record<PartKey, number>> = {};
    for (const p of PARTS) {
      const last = [...practiceHist]
        .filter((a) => a.partKey === p)
        .sort((a, b) => {
          const ta = new Date(a.submittedAt || a.createdAt || 0).getTime();
          const tb = new Date(b.submittedAt || b.createdAt || 0).getTime();
          return tb - ta;
        })[0];
      if (last) map[p] = Math.round((last.acc ?? 0) * 100);
    }
    return map;
  }, [practiceHist]);

  /* ---------- Last level per part (từ lần luyện tập gần nhất) ---------- */
  const lastLevelByPart: Partial<Record<PartKey, Lvl>> = React.useMemo(() => {
    const map: Partial<Record<PartKey, Lvl>> = {};
    for (const p of PARTS) {
      const last = [...practiceHist]
        .filter((a) => a.partKey === p)
        .sort((a, b) => {
          const ta = new Date(a.submittedAt || a.createdAt || 0).getTime();
          const tb = new Date(b.submittedAt || b.createdAt || 0).getTime();
          return tb - ta;
        })[0];
      if (last) map[p] = last.level as Lvl;
    }
    return map;
  }, [practiceHist]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 mt-16">
      {/* Header */}
      <header className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Bảng điều khiển</h1>
            <p className="text-sm text-zinc-600">Theo dõi tiến trình học và gợi ý luyện tập cá nhân hoá.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl border px-3 py-2 text-sm flex items-center gap-2 bg-white">
              <Gauge className="w-4 h-4" />
              TOEIC ước lượng:
              <span className="font-bold">{toeicOverall ?? "—"}</span>
              <span className="text-xs text-zinc-500">/ 990</span>
            </div>
            <div className="rounded-xl border px-3 py-2 text-sm flex items-center gap-2 bg-white">
              <Layers className="w-4 h-4" />
              Cấp độ (theo phần):{" "}
              <span className="font-semibold">
                {PARTS.map((p) => levels[p] ?? "—").join(" / ")}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Practice accuracy — theo từng part */}
        <section className="rounded-2xl border p-4 bg-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <h2 className="text-sm font-semibold">Tiến bộ luyện tập (Accuracy % theo từng phần)</h2>
            </div>
            <div className="text-xs text-zinc-500">Đơn vị: %</div>
          </div>

          {/* Selector Part */}
          <div className="flex flex-wrap gap-2 mb-3">
            {PARTS.map((p) => (
              <button
                key={p}
                onClick={() => setSelectedPart(p)}
                className={`px-2.5 py-1 rounded-lg text-xs border ${
                  selectedPart === p ? "bg-black text-white" : "bg-white"
                }`}
              >
                {PART_LABEL[p]}
              </button>
            ))}
          </div>

          {/* Chart lớn cho Part đang chọn */}
          <div style={{ width: "100%", height: 240 }}>
            <ResponsiveContainer>
              <LineChart data={lineByPart[selectedPart]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="at" interval="preserveStartEnd" />
                <YAxis domain={[0, 100]} />
                <ChartTooltip />
                <Line type="monotone" dataKey="acc" dot />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* 7 Parts summary */}
      <section className="mt-6 rounded-2xl border p-4 bg-white">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-4 h-4" />
          <h2 className="text-sm font-semibold">Gợi ý luyện tập theo phần</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PARTS.map((p) => {
            const curLv = levels[p] ?? null;               // Level hiện tại từ DB
            const lastLv = lastLevelByPart[p] ?? null;     // Level ở lần luyện gần nhất
            const targetLv = curLv;
            const lastAcc = lastAccByPart[p] ?? null;

            const movedUp   = lastLv != null && curLv != null && curLv > lastLv;
            const movedDown = lastLv != null && curLv != null && curLv < lastLv;

            const btnText = targetLv ? `Luyện ngay → Level ${targetLv}` : "Luyện ngay";
            const href = targetLv
              ? `/${locale}/practice/${encodeURIComponent(p)}/${targetLv}/1`
              : `/${locale}/practice/${encodeURIComponent(p)}`;

            return (
              <div key={p} className="rounded-xl border p-4 bg-zinc-50">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-sm font-semibold">{PART_LABEL[p]}</div>
                  {targetLv ? (
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${
                        targetLv === 1
                          ? "border-emerald-300 bg-emerald-100 text-emerald-800"
                          : targetLv === 2
                          ? "border-sky-300 bg-sky-100 text-sky-800"
                          : "border-violet-300 bg-violet-100 text-violet-800"
                      }`}
                    >
                      Level {targetLv}
                    </span>
                  ) : (
                    <span className="text-xs text-zinc-400">—</span>
                  )}
                </div>

                {/* Hint nâng/hạ bậc theo chênh lệch level giữa lần luyện gần nhất và level hiện tại DB */}
                {movedUp && (
                  <div className="mt-1 text-xs font-medium text-amber-600">
                    Bạn vừa được nâng từ Level {lastLv} → {curLv}. Lý do: 
                    3 lần gần nhất (không retake) ở level cũ trung bình ≥ 70%.
                  </div>
                )}
                {movedDown && (
                  <div className="mt-1 text-xs font-medium text-red-600">
                    Bạn vừa bị hạ từ Level {lastLv} → {curLv}. Lý do: 
                    3 TEST khác nhau gần nhất ở level cũ đều &lt; 50%.
                  </div>
                )}

                <div className="text-xs text-zinc-600 mt-1">
                  {targetLv
                    ? `Bạn nên luyện Level ${targetLv} ở ${PART_LABEL[p].toLowerCase()}.`
                    : `Hãy làm placement hoặc luyện tập để hệ thống xác định level cho ${PART_LABEL[p].toLowerCase()}.`}
                </div>

                <div className="mt-2 text-xs text-zinc-600">
                  Lần gần nhất: <b>{lastAcc != null ? `${lastAcc}%` : "—"}</b>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <Link href={href} className="px-3 py-1.5 rounded-lg bg-black text-white text-xs">
                    {btnText}
                  </Link>
                  <Link
                    href={`/${locale}/practice/history`}
                    className="px-3 py-1.5 rounded-lg border text-xs"
                  >
                    Lịch sử
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}