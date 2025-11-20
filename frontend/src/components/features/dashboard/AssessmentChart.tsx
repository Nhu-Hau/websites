/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Gauge, Loader2 } from "lucide-react";

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

      if (l == null && r == null)
        return {
          l: null as number | null,
          r: null as number | null,
          overall: null as number | null,
        };

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
    <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-zinc-800/80 dark:bg-zinc-900/95 sm:p-5">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-300">
            <Gauge className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              Điểm TOEIC theo thời gian
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Listening, Reading &amp; Overall (đã quy đổi thang điểm TOEIC)
            </p>
          </div>
        </div>

        <span className="inline-flex max-w-full items-center justify-center rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500 dark:bg-zinc-800 dark:text-zinc-400">
          Assessment trend
        </span>
      </div>

      {/* Chart */}
      <div className="relative h-60 sm:h-56 md:h-64 lg:h-72">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400 dark:text-slate-500" />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Đang tải dữ liệu...
            </p>
          </div>
        ) : assessmentLineData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={assessmentLineData}
              margin={{ top: 4, right: 12, left: 0, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="at"
                interval="preserveStartEnd"
                tick={{ fill: "#6b7280", fontSize: 10 }}
                axisLine={{ stroke: "#e5e7eb" }}
                tickLine={{ stroke: "#e5e7eb" }}
                minTickGap={18}
              />
              <YAxis
                domain={[0, 990]}
                ticks={[0, 200, 400, 600, 800, 990]}
                tick={{ fill: "#6b7280", fontSize: 10 }}
                axisLine={{ stroke: "#e5e7eb" }}
                tickLine={{ stroke: "#e5e7eb" }}
                width={36}
              />
              <ChartTooltip
                contentStyle={{
                  backgroundColor: "rgba(15,23,42,0.96)", // slate-900
                  border: "1px solid rgba(148,163,184,0.6)",
                  borderRadius: 8,
                  boxShadow: "0 10px 25px rgba(15,23,42,0.55)",
                  padding: "8px 10px",
                }}
                labelStyle={{
                  color: "#e5e7eb",
                  fontWeight: 600,
                  fontSize: 11,
                  marginBottom: 4,
                }}
                itemStyle={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: "#e5e7eb",
                }}
                cursor={{ stroke: "#94a3b8", strokeWidth: 1 }}
                formatter={(value: number, name: string, props: any) => {
                  const rounded5 = Math.round(value / 5) * 5;
                  const kind =
                    props?.payload?.kind === "progress"
                      ? "Progress Test"
                      : "Placement Test";
                  return [`${rounded5} điểm`, `${name} • ${kind}`];
                }}
              />

              {/* Listening - sky */}
              <Line
                type="monotone"
                dataKey="Listening"
                stroke="#0ea5e9"
                strokeWidth={2}
                dot={false}
                activeDot={{
                  r: 4,
                  stroke: "#0ea5e9",
                  strokeWidth: 2,
                  fill: "#e0f2fe",
                }}
                animationDuration={350}
                name="Listening"
              />

              {/* Reading - indigo */}
              <Line
                type="monotone"
                dataKey="Reading"
                stroke="#6366f1"
                strokeWidth={2}
                dot={false}
                activeDot={{
                  r: 4,
                  stroke: "#6366f1",
                  strokeWidth: 2,
                  fill: "#e0e7ff",
                }}
                animationDuration={350}
                name="Reading"
              />

              {/* Overall – emerald, nét dày hơn chút */}
              <Line
                type="monotone"
                dataKey="Overall"
                stroke="#22c55e"
                strokeWidth={2.4}
                dot={false}
                activeDot={{
                  r: 4.5,
                  stroke: "#22c55e",
                  strokeWidth: 2,
                  fill: "#dcfce7",
                }}
                animationDuration={350}
                name="Overall"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-zinc-800 dark:text-zinc-500">
              <Gauge className="h-6 w-6" />
            </div>
            <div>
              <p className="mb-1 text-sm font-medium text-slate-900 dark:text-slate-50">
                Chưa có dữ liệu Assessment
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Hãy làm Placement Test hoặc Progress Test để xem biểu đồ điểm
                TOEIC của bạn.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Legend custom – responsive đẹp trên mobile */}
      {assessmentLineData.length > 0 && (
        <div className="mt-4 flex flex-col gap-3 text-[11px] text-slate-600 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded-full bg-[#0ea5e9]" />
              <span>Listening</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded-full bg-[#6366f1]" />
              <span>Reading</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded-full bg-[#22c55e]" />
              <span>Overall</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-sky-500" />
              <span>Placement / Progress được xếp trên cùng trục 0–990</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}