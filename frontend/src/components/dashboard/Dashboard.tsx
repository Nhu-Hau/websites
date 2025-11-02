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
import {
  Gauge,
  BarChart3,
  Layers,
  Target,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Zap,
  CheckCircle2,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { useBasePrefix } from "@/hooks/useBasePrefix";

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
  acc: number;
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
  "part.1": "Part 1",
  "part.2": "Part 2",
  "part.3": "Part 3",
  "part.4": "Part 4",
  "part.5": "Part 5",
  "part.6": "Part 6",
  "part.7": "Part 7",
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
    if (v == null && raw.part && typeof raw.part === "object")
      v = raw.part[num];
    if (v == null && raw[num] != null) v = raw[num];
    const n = Number(v);
    if (n === 1 || n === 2 || n === 3) out[p] = n as Lvl;
  }
  return out;
}
function fmtTimeLabel(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1} ${String(d.getHours()).padStart(
    2,
    "0"
  )}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function pickUserFromMe(json: any): UserMe | null {
  if (!json) return null;
  if (json.user && typeof json.user === "object") return json.user;
  if (json.data && typeof json.data === "object") return json.data;
  if (json._id || json.id || json.email || json.partLevels || json.toeicPred)
    return json;
  return null;
}

export default function Dashboard() {
  const basePrefix = useBasePrefix("vi");

  const [, setLoading] = React.useState(true);
  const [levels, setLevels] = React.useState<Partial<Record<PartKey, Lvl>>>({});
  const [toeicOverall, setToeicOverall] = React.useState<number | null>(null);
  const [practiceHist, setPracticeHist] = React.useState<PracticeAttemptDoc[]>(
    []
  );
  const [selectedPart, setSelectedPart] = React.useState<PartKey>("part.1");

  const fetchMe = React.useCallback(async () => {
    const rMe = await fetch("/api/auth/me", {
      credentials: "include",
      cache: "no-store",
    });
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
    const map: Record<
      PartKey,
      { at: string; acc: number; level: Lvl; test?: number | null }[]
    > = {
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
      return ta - tb;
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
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900 pt-16">
      <div className="max-w-[1350px] mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
                Bảng điều khiển
              </h1>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                Theo dõi tiến trình học và gợi ý luyện tập cá nhân hoá.
              </p>
            </div>

            {/* Stat Cards */}
            <div className="flex flex-wrap gap-3">
              <div className="group rounded-2xl border border-zinc-200 dark:border-zinc-700 p-4 bg-gradient-to-br from-white to-zinc-50 dark:from-zinc-800 dark:to-zinc-900 shadow-sm hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-900/30 dark:to-emerald-800/20">
                    <Gauge className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      TOEIC ước lượng
                    </p>
                    <p className="text-xl font-bold text-zinc-900 dark:text-white">
                      {toeicOverall ?? "—"}{" "}
                      <span className="text-sm font-normal text-zinc-500 dark:text-zinc-400">
                        / 990
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="group rounded-2xl border border-zinc-200 dark:border-zinc-700 p-4 bg-gradient-to-br from-white to-zinc-50 dark:from-zinc-800 dark:to-zinc-900 shadow-sm hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-sky-100 to-sky-50 dark:from-sky-900/30 dark:to-sky-800/20">
                    <Layers className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      Cấp độ hiện tại
                    </p>
                    <p className="text-sm font-mono font-semibold text-zinc-900 dark:text-white">
                      {PARTS.map((p) => levels[p] ?? "—").join(" · ")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Charts - Tiến bộ luyện tập */}
        <section className="rounded-2xl border border-zinc-200/80 dark:border-zinc-700/80 p-6 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-xl shadow-lg ring-1 ring-black/5 dark:ring-white/10 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/30">
                <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                Tiến bộ luyện tập
              </h2>
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
              Đơn vị: %
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-5">
            {PARTS.map((p) => {
              const isSel = selectedPart === p;
              return (
                <button
                  key={p}
                  onClick={() => setSelectedPart(p)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border
                     ${
                       isSel
                         ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white border-indigo-600 shadow-sm"
                         : "bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50"
                     }`}
                >
                  {PART_LABEL[p]}
                </button>
              );
            })}
          </div>

          <div className="relative">
            {lineByPart[selectedPart]?.length > 0 ? (
              <div style={{ width: "100%", height: 260 }} className="mt-2">
                <ResponsiveContainer>
                  <LineChart
                    data={lineByPart[selectedPart]}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="4 4"
                      stroke="#e5e7eb"
                      className="dark:stroke-zinc-700 opacity-40"
                    />
                    <XAxis
                      dataKey="at"
                      interval="preserveStartEnd"
                      stroke="#d1d5db"
                      className="dark:stroke-zinc-600"
                      tick={{
                        fill: "#6b7280",
                        fontSize: 11,
                        className: "dark:fill-zinc-400",
                      }}
                      axisLine={{
                        stroke: "#d1d5db",
                        className: "dark:stroke-zinc-600",
                      }}
                      tickLine={{
                        stroke: "#d1d5db",
                        className: "dark:stroke-zinc-600",
                      }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      stroke="#d1d5db"
                      className="dark:stroke-zinc-600"
                      tick={{
                        fill: "#6b7280",
                        fontSize: 11,
                        className: "dark:fill-zinc-400",
                      }}
                      axisLine={{
                        stroke: "#d1d5db",
                        className: "dark:stroke-zinc-600",
                      }}
                      tickLine={{
                        stroke: "#d1d5db",
                        className: "dark:stroke-zinc-600",
                      }}
                      ticks={[0, 25, 50, 75, 100]}
                    />
                    <ChartTooltip
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "12px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        padding: "8px 12px",
                      }}
                      labelStyle={{
                        color: "#6b7280",
                        fontWeight: 600,
                        fontSize: 12,
                      }}
                      itemStyle={{ color: "#6366f1", fontWeight: 500 }}
                      cursor={{
                        stroke: "#d1d5db",
                        strokeWidth: 1,
                        strokeDasharray: "5 5",
                      }}
                      formatter={(value: number) => `${Math.round(value)}%`}
                    />
                    <Line
                      type="monotone"
                      dataKey="acc"
                      stroke="#6366f1"
                      strokeWidth={2.5}
                      dot={{
                        r: 4,
                        stroke: "#6366f1",
                        strokeWidth: 2,
                        fill: "#fff",
                        className: "drop-shadow-sm",
                      }}
                      activeDot={{
                        r: 6,
                        stroke: "#6366f1",
                        strokeWidth: 2,
                        fill: "#fff",
                      }}
                      animationDuration={800}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6">
                <div className="p-4 rounded-full bg-zinc-100 dark:bg-zinc-800 mb-3">
                  <BarChart3 className="w-8 h-8 text-zinc-400 dark:text-zinc-600" />
                </div>
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  Chưa có dữ liệu
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                  Luyện tập để theo dõi tiến bộ!
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center justify-center gap-6 text-xs text-zinc-500 dark:text-zinc-400">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-indigo-500" />
              <span>Accuracy (%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-zinc-300 dark:bg-zinc-700" />
              <span>Đường xu hướng</span>
            </div>
          </div>
        </section>

        {/* 7 Parts Summary */}
        <section className="rounded-2xl border border-zinc-200/80 dark:border-zinc-700/80 p-6 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-xl shadow-lg ring-1 ring-black/5 dark:ring-white/10">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-emerald-800/20">
              <Target className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
              Gợi ý luyện tập theo phần
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PARTS.map((p) => {
              const curLv = levels[p] ?? null;
              const lastLv = lastLevelByPart[p] ?? null;
              const lastAcc = lastAccByPart[p] ?? null;
              const isFinite = lastAcc != null;

              const movedUp = lastLv != null && curLv != null && curLv > lastLv;
              const movedDown =
                lastLv != null && curLv != null && curLv < lastLv;

              const href = curLv
                ? `${basePrefix}/practice/${encodeURIComponent(
                    p
                  )}?level=${curLv}`
                : `${basePrefix}/practice/${encodeURIComponent(p)}`;

              const levelConfig = curLv
                ? {
                    1: {
                      bg: "bg-amber-100 dark:bg-amber-900/30",
                      border: "border-amber-300 dark:border-amber-700",
                      text: "text-amber-800 dark:text-amber-300",
                      icon: "text-amber-600 dark:text-amber-400",
                    },
                    2: {
                      bg: "bg-sky-100 dark:bg-sky-900/30",
                      border: "border-sky-300 dark:border-sky-700",
                      text: "text-sky-800 dark:text-sky-300",
                      icon: "text-sky-600 dark:text-sky-400",
                    },
                    3: {
                      bg: "bg-violet-100 dark:bg-violet-900/30",
                      border: "border-violet-300 dark:border-violet-700",
                      text: "text-violet-800 dark:text-violet-300",
                      icon: "text-violet-600 dark:text-violet-400",
                    },
                  }[curLv]
                : null;

              return (
                <div
                  key={p}
                  className="group rounded-xl border border-zinc-200/70 dark:border-zinc-700/70 p-4 bg-gradient-to-br from-zinc-50 to-white dark:from-zinc-900/90 dark:to-zinc-900/50 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02] cursor-default"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                      {PART_LABEL[p]}
                    </h4>
                    {levelConfig ? (
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold border ${levelConfig.bg} ${levelConfig.border} ${levelConfig.text}`}
                      >
                        <Zap className={`w-3 h-3 ${levelConfig.icon}`} />
                        Level {curLv}
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-400">—</span>
                    )}
                  </div>

                  {/* Trạng thái level: luôn giữ 1 dòng cố định */}
                  <div className="mb-2 h-5 flex items-center">
                    {movedUp ? (
                      <div className="text-xs font-medium text-emerald-700 dark:text-emerald-300 flex items-center gap-1 justify-between w-full">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5" />
                          Nâng từ Level {lastLv} → {curLv}
                        </div>
                        <div className="flex items-center gap-1">
                          <Info className="w-3.5 h-3.5 text-emerald-500 opacity-80" />
                          Lý do: Hiệu suất gần đây cao
                        </div>
                      </div>
                    ) : movedDown ? (
                      <div className="text-xs font-medium text-rose-700 dark:text-rose-300 flex items-center justify-between w-full">
                        <div className="flex items-center gap-1">
                          <TrendingDown className="w-3.5 h-3.5" />
                          Hạ từ Level {lastLv} → {curLv}
                        </div>
                        <div className="flex items-center gap-1">
                          <Info className="w-3.5 h-3.5 text-rose-500 opacity-80" />
                          Lý do: Hiệu suất gần đây thấp
                        </div>
                      </div>
                    ) : curLv ? (
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 flex items-center gap-1 whitespace-nowrap overflow-hidden text-ellipsis">
                        <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
                        Ổn định ở Level {curLv}
                      </p>
                    ) : (
                      <p className="text-xs text-zinc-400 dark:text-zinc-500 whitespace-nowrap overflow-hidden text-ellipsis">
                        Chưa có dữ liệu level
                      </p>
                    )}
                  </div>

                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-2 leading-relaxed">
                    {curLv
                      ? `Luyện Level ${curLv} để củng cố kỹ năng.`
                      : `Chưa xác định level. Hãy làm placement test.`}
                  </p>

                  <div className="space-y-1 mb-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-600 dark:text-zinc-400">
                        Lần gần nhất
                      </span>
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        {isFinite ? `${lastAcc}%` : "—"}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isFinite
                            ? lastAcc >= 80
                              ? "bg-emerald-500"
                              : lastAcc >= 60
                              ? "bg-sky-500"
                              : lastAcc >= 40
                              ? "bg-amber-500"
                              : "bg-red-500"
                            : "bg-zinc-400"
                        }`}
                        style={{
                          width: isFinite ? `${Math.min(lastAcc, 100)}%` : "0%",
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={href}
                      className="group/btn flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg 
                         bg-gradient-to-r from-zinc-900 to-zinc-800 
                         dark:from-zinc-700
                         dark:to-zinc-600
                         hover:from-zinc-700 hover:to-zinc-600 
                         text-white text-xs font-medium shadow-sm hover:shadow-md 
                         transition-all duration-200 active:scale-95"
                    >
                      {curLv ? `Luyện Level ${curLv}` : "Làm Placement"}
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5" />
                    </Link>
                    <Link
                      href={`${basePrefix}/practice/history`}
                      className="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 
                         bg-white dark:bg-zinc-800/50 text-xs font-medium text-zinc-700 dark:text-zinc-300 
                         hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-all"
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
    </div>
  );
}
