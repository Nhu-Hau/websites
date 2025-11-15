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
  Legend,
} from "recharts";
import { Gauge, Loader2 } from "lucide-react";
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
  return `${d.getDate()}/${d.getMonth() + 1} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/* ===================== Component ===================== */
export default function AssessmentChart() {
  const basePrefix = useBasePrefix("vi");
  const [placementHist, setPlacementHist] = React.useState<PlacementAttemptLite[]>([]);
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
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-900/20">
            <Gauge className="h-5 w-5 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
              Điểm TOEIC
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Theo dõi điểm Listening, Reading & Overall
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="relative h-[280px]">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-400 dark:text-zinc-500" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Đang tải dữ liệu...
            </p>
          </div>
        ) : assessmentLineData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={assessmentLineData}
              margin={{ top: 8, right: 8, left: 0, bottom: 8 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e5e7eb"
                className="dark:stroke-zinc-800"
              />
              <XAxis
                dataKey="at"
                interval="preserveStartEnd"
                tick={{ fill: "#71717a", fontSize: 11 }}
                axisLine={{ stroke: "#d4d4d8" }}
                tickLine={{ stroke: "#d4d4d8" }}
                minTickGap={20}
              />
              <YAxis
                domain={[0, 990]}
                ticks={[0, 200, 400, 600, 800, 990]}
                tick={{ fill: "#71717a", fontSize: 11 }}
                axisLine={{ stroke: "#d4d4d8" }}
                tickLine={{ stroke: "#d4d4d8" }}
                width={40}
              />
              <ChartTooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.98)",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  padding: "8px 12px",
                }}
                labelStyle={{
                  color: "#18181b",
                  fontWeight: 600,
                  fontSize: 11,
                }}
                itemStyle={{ fontSize: 11, fontWeight: 500 }}
                cursor={{ stroke: "#ef4444", strokeWidth: 1 }}
                formatter={(value: number, name: string, props: any) => {
                  const rounded5 = Math.round(value / 5) * 5;
                  const kind = props?.payload?.kind === "progress" ? "Progress Test" : "Placement Test";
                  return [`${rounded5} điểm`, `${name} • ${kind}`];
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                iconType="line"
              />
              <Line
                type="monotone"
                dataKey="Listening"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, stroke: "#10b981", strokeWidth: 2 }}
                animationDuration={400}
                name="Listening"
              />
              <Line
                type="monotone"
                dataKey="Reading"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, stroke: "#f59e0b", strokeWidth: 2 }}
                animationDuration={400}
                name="Reading"
              />
              <Line
                type="monotone"
                dataKey="Overall"
                stroke="#ef4444"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, stroke: "#ef4444", strokeWidth: 2 }}
                animationDuration={400}
                name="Overall"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center p-6">
            <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <Gauge className="h-6 w-6 text-zinc-400 dark:text-zinc-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-white mb-1">
                Chưa có dữ liệu Assessment
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Hãy làm Placement hoặc Progress Test để xem biểu đồ này
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}