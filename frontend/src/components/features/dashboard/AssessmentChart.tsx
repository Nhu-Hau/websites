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
import { Gauge } from "lucide-react";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";

/* ===================== Types ===================== */
type PlacementAttemptLite = {
  _id: string;
  submittedAt: string;
  listening?: { acc?: number; total?: number; correct?: number };
  reading?: { acc?: number; total?: number; correct?: number };
  predicted?: { overall?: number; listening?: number; reading?: number };
  partStats?: Record<string, { total: number; correct: number; acc: number }>;
};

type PlacementHistoryResp = {
  page: number;
  limit: number;
  total: number;
  items: PlacementAttemptLite[];
};

type ProgressAttempt = {
  _id: string;
  submittedAt: string;
  listening?: { acc?: number; total?: number; correct?: number };
  reading?: { acc?: number; total?: number; correct?: number };
  predicted?: { overall?: number; listening?: number; reading?: number };
  partStats?: Record<string, { total: number; correct: number; acc: number }>;
};

type ProgressHistoryResp = {
  page: number;
  limit: number;
  total: number;
  items: ProgressAttempt[];
};

type AssessmentPoint = {
  at: string;
  Listening: number;
  Reading: number;
  Overall: number;
  kind: "placement" | "progress";
  ts: number;
  _id: string;
};

/* ===================== Helpers ===================== */
function round5_990(n: number) {
  return Math.min(990, Math.max(10, Math.round(n / 5) * 5));
}

function fmtTimeLabel(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1} ${String(d.getHours()).padStart(
    2,
    "0"
  )}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/* ===================== Component ===================== */
export default function AssessmentChart() {
  const basePrefix = useBasePrefix("vi");
  const [placementHist, setPlacementHist] = React.useState<
    PlacementAttemptLite[]
  >([]);
  const [progressHist, setProgressHist] = React.useState<ProgressAttempt[]>([]);
  const [loading, setLoading] = React.useState(true);

  /* ====== Fetchers ====== */
  const fetchPlacementHist = React.useCallback(async () => {
    const r = await fetch("/api/placement/attempts?limit=10&page=1", {
      credentials: "include",
      cache: "no-store",
    });
    if (!r.ok) {
      setPlacementHist([]);
      return;
    }
    const j: PlacementHistoryResp = await r.json();
    setPlacementHist(j.items || []);
  }, []);

  const fetchProgressHist = React.useCallback(async () => {
    const r = await fetch("/api/progress/attempts?limit=10&page=1", {
      credentials: "include",
      cache: "no-store",
    });
    if (!r.ok) {
      setProgressHist([]);
      return;
    }
    const j: ProgressHistoryResp = await r.json();
    setProgressHist(j.items || []);
  }, []);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        await Promise.all([fetchPlacementHist(), fetchProgressHist()]);
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    const onVis = () => {
      if (document.visibilityState === "visible") {
        fetchPlacementHist();
        fetchProgressHist();
      }
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      document.removeEventListener("visibilitychange", onVis);
      mounted = false;
    };
  }, [fetchPlacementHist, fetchProgressHist]);

  /* ---------- Assessment (Placement + Progress) ---------- */
  const assessmentLineData: AssessmentPoint[] = React.useMemo(() => {
    const round5_495 = (n: number) => {
      return Math.min(495, Math.max(5, Math.round(n / 5) * 5));
    };

    const toToeicScore = (l5?: number, r5?: number) => {
      const l = l5 != null ? round5_495(Math.max(5, Math.min(495, l5))) : null;
      const r = r5 != null ? round5_495(Math.max(5, Math.min(495, r5))) : null;

      if (l == null && r == null) return { l: null, r: null, overall: null };

      const overall = (l ?? 0) + (r ?? 0);
      return {
        l: l ?? 0,
        r: r ?? 0,
        overall: overall > 0 ? round5_990(overall) : 0,
      };
    };

    const accToToeic = (acc: number) => {
      const score = Math.round(acc * 495);
      return round5_495(Math.max(5, Math.min(495, score)));
    };

    const placement = [...placementHist].map((x) => {
      const ts = new Date(x.submittedAt).getTime();
      if (x.predicted?.listening != null || x.predicted?.reading != null) {
        const { l, r, overall } = toToeicScore(
          x.predicted?.listening,
          x.predicted?.reading
        );
        return {
          _id: x._id,
          at: fmtTimeLabel(x.submittedAt),
          Listening: l ?? 0,
          Reading: r ?? 0,
          Overall: overall ?? 0,
          kind: "placement" as const,
          ts,
        };
      }
      const l = accToToeic(x.listening?.acc ?? 0);
      const r = accToToeic(x.reading?.acc ?? 0);
      const overall = round5_990(l + r);
      return {
        _id: x._id,
        at: fmtTimeLabel(x.submittedAt),
        Listening: l,
        Reading: r,
        Overall: overall,
        kind: "placement" as const,
        ts,
      };
    });

    const progress = [...progressHist].map((x) => {
      const ts = new Date(x.submittedAt).getTime();
      if (x.predicted?.listening != null || x.predicted?.reading != null) {
        const { l, r, overall } = toToeicScore(
          x.predicted?.listening,
          x.predicted?.reading
        );
        return {
          _id: x._id,
          at: fmtTimeLabel(x.submittedAt),
          Listening: l ?? 0,
          Reading: r ?? 0,
          Overall: overall ?? 0,
          kind: "progress" as const,
          ts,
        };
      }
      const l = accToToeic(x.listening?.acc ?? 0);
      const r = accToToeic(x.reading?.acc ?? 0);
      const overall = round5_990(l + r);
      return {
        _id: x._id,
        at: fmtTimeLabel(x.submittedAt),
        Listening: l,
        Reading: r,
        Overall: overall,
        kind: "progress" as const,
        ts,
      };
    });

    return [...placement, ...progress].sort((a, b) => a.ts - b.ts);
  }, [placementHist, progressHist]);

  /* ===================== Render ===================== */
  return (
    <section className="max-h-96 flex flex-col rounded-2xl border border-zinc-200/80 dark:border-zinc-700/80 p-4 sm:p-5 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-xl shadow-lg ring-1 ring-black/5 dark:ring-white/10">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-gradient-to-br from-violet-100 to-fuchsia-100 dark:from-violet-900/30 dark:to-fuchsia-900/30">
            <Gauge className="w-4 h-4 text-violet-600 dark:text-violet-400" />
          </div>
          <h2 className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-white">
            Assessment
          </h2>
        </div>

        {/* Links */}
        <div className="flex items-center gap-2 text-[11px] sm:text-xs flex-wrap">
          <Link
            href={`${basePrefix}/placement/result/last`}
            className="underline text-violet-600 dark:text-violet-400 hover:opacity-80"
          >
            Kết quả Placement gần nhất
          </Link>
          <span className="text-zinc-300 dark:text-zinc-600">•</span>
          <Link
            href={`${basePrefix}/progress`}
            className="underline text-emerald-600 dark:text-emerald-400 hover:opacity-80"
          >
            Làm Progress Test
          </Link>
        </div>
      </div>

      {/* Chart */}
      <div className="relative flex-1 min-h-[210px]">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
            <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin mb-2" />
            <p className="text-[13px] font-medium text-zinc-600 dark:text-zinc-400">
              Đang tải dữ liệu...
            </p>
          </div>
        ) : assessmentLineData.length ? (
          <div className="absolute inset-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={assessmentLineData}
                margin={{ top: 6, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e5e7eb"
                  className="dark:stroke-zinc-700 opacity-40"
                />
                <XAxis
                  dataKey="at"
                  interval="preserveStartEnd"
                  tick={{ fill: "#6b7280", fontSize: 10 }}
                  axisLine={{ stroke: "#d1d5db" }}
                  tickLine={{ stroke: "#d1d5db" }}
                  minTickGap={18}
                />
                <YAxis
                  domain={[0, 990]}
                  ticks={[0, 200, 400, 600, 800, 990]}
                  tick={{ fill: "#6b7280", fontSize: 10 }}
                  axisLine={{ stroke: "#d1d5db" }}
                  tickLine={{ stroke: "#d1d5db" }}
                  width={30}
                />
                <ChartTooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "10px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    padding: "6px 10px",
                  }}
                  labelStyle={{
                    color: "#6b7280",
                    fontWeight: 600,
                    fontSize: 11,
                  }}
                  itemStyle={{ fontSize: 11 }}
                  cursor={{
                    stroke: "#d1d5db",
                    strokeWidth: 1,
                    strokeDasharray: "4 4",
                  }}
                  formatter={(value: number, name: string, props: any) => {
                    const rounded5 = Math.round(value / 5) * 5;
                    const kind =
                      props?.payload?.kind === "progress"
                        ? "Progress Test"
                        : "Placement Test";
                    return [`${rounded5} điểm`, `${name} • ${kind}`];
                  }}
                />

                <Line
                  type="monotone"
                  dataKey="Listening"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{
                    r: 3,
                    stroke: "#10b981",
                    strokeWidth: 1.5,
                    fill: "#fff",
                  }}
                  activeDot={{
                    r: 5,
                    stroke: "#10b981",
                    strokeWidth: 2,
                    fill: "#fff",
                  }}
                  animationDuration={700}
                />
                <Line
                  type="monotone"
                  dataKey="Reading"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{
                    r: 3,
                    stroke: "#f59e0b",
                    strokeWidth: 1.5,
                    fill: "#fff",
                  }}
                  activeDot={{
                    r: 5,
                    stroke: "#f59e0b",
                    strokeWidth: 2,
                    fill: "#fff",
                  }}
                  animationDuration={700}
                />
                <Line
                  type="monotone"
                  dataKey="Overall"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{
                    r: 3,
                    stroke: "#6366f1",
                    strokeWidth: 1.5,
                    fill: "#fff",
                  }}
                  activeDot={{
                    r: 5,
                    stroke: "#6366f1",
                    strokeWidth: 2,
                    fill: "#fff",
                  }}
                  animationDuration={700}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
            <div className="p-3 rounded-full bg-zinc-100 dark:bg-zinc-800 mb-2">
              <Gauge className="w-6 h-6 text-zinc-400 dark:text-zinc-600" />
            </div>
            <p className="text-[13px] font-medium text-zinc-600 dark:text-zinc-400">
              Chưa có dữ liệu Assessment
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-500 mt-1">
              Hãy làm Placement/Progress để xem biểu đồ này.
            </p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center justify-center gap-4 text-[11px] text-zinc-500 dark:text-zinc-400">
        <div className="flex items-center gap-1.5">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: "#10b981" }}
          />
          <span>Listening</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: "#f59e0b" }}
          />
          <span>Reading</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: "#6366f1" }}
          />
          <span>Overall</span>
        </div>
      </div>
    </section>
  );
}

