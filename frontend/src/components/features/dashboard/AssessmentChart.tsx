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
import { Gauge, Loader2, AlertCircle, Clock3 } from "lucide-react";
import { cn } from "@/lib/utils";

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
  Listening: number | null;
  Reading: number | null;
  Overall: number;
  kind: "baseline" | "placement" | "progress";
  ts: number;
  _id: string;
};

type AssessmentData = {
  selfReportedScore: number | null;
  placementScore: number | null;
  latestProgressScore: number | null;
  hasBaseline: boolean;
  currentToeicSource: string;
  currentToeicExamDate: string | null;
};

type ProgressEligibilityInfo = {
  eligible: boolean;
  reason?:
    | "ok"
    | "waiting_window"
    | "no_practice_yet"
    | "no_practice_after_progress"
    | string;
  nextEligibleAt?: string | null;
  remainingMs?: number | null;
  windowMinutes?: number | null;
  since?: string | null;
  suggestedAt?: string | null;
};

/* ===================== Helper: so sánh điểm ===================== */
type ScoreComparisonLevel = "match" | "medium_diff" | "large_diff";

interface ScoreComparisonResult {
  level: ScoreComparisonLevel;
  diff: number;
  absDiff: number;
  message: string;
  subtitle: string;
}

function comparePlacementWithSelfReported(
  reportedScore: number | null,
  placementScore: number | null
): ScoreComparisonResult | null {
  if (
    reportedScore == null ||
    placementScore == null ||
    Number.isNaN(reportedScore) ||
    Number.isNaN(placementScore)
  ) {
    return null;
  }

  const diff = placementScore - reportedScore;
  const absDiff = Math.abs(diff);

  let level: ScoreComparisonLevel = "match";
  if (absDiff > 150) level = "large_diff";
  else if (absDiff > 75) level = "medium_diff";

  if (level === "match") {
    return {
      level,
      diff,
      absDiff,
      message: "Điểm placement test khá gần với điểm TOEIC bạn khai báo.",
      subtitle: `Bạn khai báo: ${reportedScore} điểm • Placement test ước tính: ${placementScore} điểm (chênh lệch khoảng ${absDiff} điểm). Hệ thống sẽ dùng kết quả placement để đề xuất lộ trình chi tiết cho từng Part.`,
    };
  }

  if (level === "medium_diff") {
    return {
      level,
      diff,
      absDiff,
      message: "Điểm placement test hơi lệch so với điểm TOEIC bạn khai báo.",
      subtitle: `Bạn khai báo: ${reportedScore} điểm • Placement test ước tính: ${placementScore} điểm (chênh lệch khoảng ${absDiff} điểm). Nguyên nhân có thể do thời gian làm bài khác với đề thi thật, điểm TOEIC bạn thi đã cách đây một thời gian, hoặc bài placement chỉ gồm 55 câu nên có sai số nhất định. Hệ thống vẫn ưu tiên dùng placement test để gợi ý lộ trình.`,
    };
  }

  return {
    level,
    diff,
    absDiff,
    message:
      "Điểm placement test lệch khá nhiều so với điểm TOEIC bạn khai báo.",
    subtitle: `Bạn khai báo: ${reportedScore} điểm • Placement test ước tính: ${placementScore} điểm (chênh lệch khoảng ${absDiff} điểm). Có thể do bạn làm bài khi chưa tập trung, điểm TOEIC bạn nhập là từ kỳ thi đã khá lâu, hoặc đây chỉ là điểm ước lượng trên 55 câu. Hệ thống sẽ ưu tiên dùng kết quả placement để phân level hiện tại. Nếu bạn cảm thấy kết quả chưa phản ánh đúng trình độ, hãy luyện thêm một thời gian rồi làm lại progress test để hệ thống đánh giá ổn định hơn.`,
  };
}

/* ===================== Helpers khác ===================== */
function roundSectionScore(n: number) {
  if (n <= 0) return 0;
  return Math.min(495, Math.max(5, Math.round(n / 5) * 5));
}

function roundOverallScore(n: number) {
  if (n <= 0) return 0;
  return Math.min(990, Math.max(10, Math.round(n / 5) * 5));
}

function calcSectionScoreFromAttempt(section?: {
  acc?: number;
  correct?: number;
  total?: number;
}): number | null {
  if (!section || (section.total ?? 0) <= 0) return null;
  if ((section.correct ?? 0) <= 0) return 0;
  const raw = Math.round((section.acc ?? 0) * 495);
  return roundSectionScore(raw);
}

function fmtTimeLabel(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1} ${String(d.getHours()).padStart(
    2,
    "0"
  )}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatDateTime(iso?: string | null) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1)
    .toString()
    .padStart(2, "0")} lúc ${date.getHours().toString().padStart(2, "0")}:${date
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
}

function formatRemainingMs(ms?: number | null) {
  if (ms == null || ms <= 0) return "ít phút nữa";
  const minutes = Math.ceil(ms / 60000);
  if (minutes >= 60 * 24) {
    const days = Math.ceil(minutes / (60 * 24));
    return `${days} ngày`;
  }
  if (minutes >= 60) {
    const hours = Math.ceil(minutes / 60);
    return `${hours} giờ`;
  }
  return `${Math.max(1, minutes)} phút`;
}

function describeEligibilityReason(info: ProgressEligibilityInfo | null) {
  if (!info) return "";
  switch (info.reason) {
    case "no_practice_yet":
      return "Hãy làm ít nhất 1 bài Practice để mở Progress Test.";
    case "no_practice_after_progress":
      return "Bạn cần hoàn thành một bài Practice sau lần Progress Test gần nhất.";
    case "waiting_window":
      return "Bạn vừa luyện xong Practice, hệ thống sẽ mở Progress Test sau đủ thời gian theo chu kỳ.";
    default:
      return "Hệ thống tự mở Progress Test theo chu kỳ luyện tập 5 ngày.";
  }
}

const CARD_BASE =
  "relative overflow-hidden rounded-2xl border border-gray-200/70 bg-white/95 p-4 shadow-sm ring-1 ring-black/5 backdrop-blur-xl dark:border-gray-800/80 dark:bg-gray-950/90 dark:ring-white/5 sm:p-5";

const SECTION_LABEL_CLASS =
  "text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400";

const comparisonToneStyles = {
  match: {
    card: "border-emerald-200/70 bg-emerald-50/60 dark:border-emerald-900/50 dark:bg-emerald-950/30",
    accent: "bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600",
    icon: "text-emerald-600 dark:text-emerald-300",
  },
  medium_diff: {
    card: "border-amber-200/70 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-950/30",
    accent: "bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500",
    icon: "text-amber-600 dark:text-amber-300",
  },
  large_diff: {
    card: "border-red-200/70 bg-red-50/60 dark:border-red-900/40 dark:bg-red-950/30",
    accent: "bg-gradient-to-r from-red-400 via-rose-500 to-orange-500",
    icon: "text-red-600 dark:text-red-300",
  },
} as const;

/* ===================== Component ===================== */
export default function AssessmentChart() {
  const [placementHist, setPlacementHist] = React.useState<
    PlacementAttemptLite[]
  >([]);
  const [progressHist, setProgressHist] = React.useState<ProgressAttempt[]>([]);
  const [assessmentData, setAssessmentData] =
    React.useState<AssessmentData | null>(null);
  const [progressEligibility, setProgressEligibility] =
    React.useState<ProgressEligibilityInfo | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [showComparisonCard, setShowComparisonCard] = React.useState(false);

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

  const fetchAssessmentData = React.useCallback(async () => {
    const r = await fetch("/api/dashboard/assessment", {
      credentials: "include",
      cache: "no-store",
    });
    if (!r.ok) {
      setAssessmentData(null);
      return;
    }
    const j: AssessmentData = await r.json();
    setAssessmentData(j);
  }, []);

  const fetchProgressEligibility = React.useCallback(async () => {
    const r = await fetch("/api/progress/eligibility", {
      credentials: "include",
      cache: "no-store",
    });
    if (!r.ok) {
      setProgressEligibility(null);
      return;
    }
    const j: ProgressEligibilityInfo = await r.json();
    setProgressEligibility(j);
  }, []);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        await Promise.all([
          fetchPlacementHist(),
          fetchProgressHist(),
          fetchAssessmentData(),
          fetchProgressEligibility(),
        ]);
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
        fetchAssessmentData();
        fetchProgressEligibility();
      }
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      document.removeEventListener("visibilitychange", onVis);
      mounted = false;
    };
  }, [
    fetchPlacementHist,
    fetchProgressHist,
    fetchAssessmentData,
    fetchProgressEligibility,
  ]);

  /* ---------- Assessment (Placement + Progress) ---------- */
  const assessmentLineData: AssessmentPoint[] = React.useMemo(() => {
    const mapAttempt = (
      attempt: PlacementAttemptLite | ProgressAttempt,
      kind: "placement" | "progress"
    ): AssessmentPoint => {
      const ts = new Date(attempt.submittedAt).getTime();
      let listeningScore: number | null =
        attempt.predicted?.listening != null
          ? roundSectionScore(attempt.predicted.listening)
          : null;
      let readingScore: number | null =
        attempt.predicted?.reading != null
          ? roundSectionScore(attempt.predicted.reading)
          : null;

      if (listeningScore == null) {
        listeningScore = calcSectionScoreFromAttempt(attempt.listening);
      }
      if (readingScore == null) {
        readingScore = calcSectionScoreFromAttempt(attempt.reading);
      }

      let overallScore: number | null = null;
      if (listeningScore != null || readingScore != null) {
        overallScore = roundOverallScore(
          (listeningScore ?? 0) + (readingScore ?? 0)
        );
      } else if (attempt.predicted?.overall != null) {
        overallScore = roundOverallScore(attempt.predicted.overall);
      } else {
        overallScore = 0;
      }

      return {
        _id: attempt._id,
        at: fmtTimeLabel(attempt.submittedAt),
        Listening: listeningScore,
        Reading: readingScore,
        Overall: overallScore ?? 0,
        kind,
        ts,
      };
    };

    const placement = placementHist.map((attempt) =>
      mapAttempt(attempt, "placement")
    );
    const progress = progressHist.map((attempt) =>
      mapAttempt(attempt, "progress")
    );
    const all = [...placement, ...progress];

    // Thêm baseline nếu có (đặt ở đầu để hiển thị trước)
    if (assessmentData?.selfReportedScore != null) {
      const baselineScore = assessmentData.selfReportedScore;
      all.unshift({
        _id: "baseline",
        at: "Baseline",
        Listening: null,
        Reading: null,
        Overall: baselineScore,
        kind: "baseline" as const,
        ts: -1,
      });
    }

    return all.sort((a, b) => a.ts - b.ts);
  }, [placementHist, progressHist, assessmentData]);

  // So sánh điểm
  const comparison = React.useMemo(() => {
    if (!assessmentData) return null;
    return comparePlacementWithSelfReported(
      assessmentData.selfReportedScore,
      assessmentData.placementScore
    );
  }, [assessmentData]);

  const progressWindowDays = React.useMemo(() => {
    if (!progressEligibility?.windowMinutes) return null;
    return Math.round(progressEligibility.windowMinutes / (60 * 24));
  }, [progressEligibility]);

  const nextEligibleText = React.useMemo(() => {
    if (!progressEligibility?.nextEligibleAt) return null;
    const eta = formatDateTime(progressEligibility.nextEligibleAt);
    if (!eta) return null;
    const remaining = formatRemainingMs(progressEligibility.remainingMs);
    return `${eta} (${remaining})`;
  }, [progressEligibility]);

  const anchorPracticeText = React.useMemo(() => {
    return formatDateTime(progressEligibility?.since ?? null);
  }, [progressEligibility]);

  /* ===================== Render ===================== */
  return (
    <div className="space-y-6">
      {/* Card so sánh — đưa lên đầu và điều khiển bằng icon */}
      {comparison && showComparisonCard && (
        <div
          className={cn(
            CARD_BASE,
            "p-4 sm:p-5",
            comparisonToneStyles[comparison.level].card
          )}
        >
          <div
            className={cn(
              "absolute inset-x-0 top-0 h-1",
              comparisonToneStyles[comparison.level]
            )}
          />
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-50">
                {comparison.message}
              </p>
              <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400">
                {comparison.subtitle}
              </p>
            </div>
          </div>
        </div>
      )}
      {/* Card tổng quan đánh giá */}
      {assessmentData && (
        <div className={CARD_BASE}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-900 dark:text-slate-50">
              Tổng quan đánh giá
            </h4>
            {comparison && (
              <button
                type="button"
                aria-pressed={showComparisonCard}
                onClick={() => setShowComparisonCard((prev) => !prev)}
                className={cn(
                  "inline-flex h-7 w-7 items-center justify-center rounded-full border text-slate-500 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60 focus-visible:ring-offset-2 dark:text-slate-300",
                  showComparisonCard
                    ? "border-transparent bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                    : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900/60"
                )}
              >
                <AlertCircle className="h-3.5 w-3.5" />
                <span className="sr-only">
                  {showComparisonCard ? "Ẩn so sánh điểm" : "Hiện so sánh điểm"}
                </span>
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Điểm khai báo
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-50">
                {assessmentData.selfReportedScore != null
                  ? `${assessmentData.selfReportedScore} điểm`
                  : "Chưa xác định"}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Placement Test
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-50">
                {assessmentData.placementScore != null
                  ? `${assessmentData.placementScore} điểm`
                  : "Chưa có"}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Progress Test mới nhất
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-50">
                {assessmentData.latestProgressScore != null
                  ? `${assessmentData.latestProgressScore} điểm`
                  : "Chưa có"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Progress eligibility */}
      {progressEligibility && (
        <div className={CARD_BASE}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 items-center gap-3">
              <div className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl sm:h-10 sm:w-10">
                {/* Glow phía sau */}
                <div className="absolute inset-0 rounded-2xl" />

                {/* Khối icon chính */}
                <div className="relative flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-md shadow-[#00000022] sm:h-10 sm:w-10">
                  <Clock3 className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="space-y-1">
                <p className={SECTION_LABEL_CLASS}>Chu kỳ Progress Test</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  {progressEligibility.eligible
                    ? "Đã đủ điều kiện làm Progress Test"
                    : nextEligibleText
                    ? `Sẽ mở lại vào ${nextEligibleText}`
                    : "Đang chờ mở Progress Test"}
                </p>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  {progressEligibility.eligible
                    ? "Bạn có thể làm bài để cập nhật điểm dự đoán mới nhất."
                    : describeEligibilityReason(progressEligibility)}
                </p>
                {!progressEligibility.eligible && anchorPracticeText && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-500">
                    Mốc tính từ {anchorPracticeText}
                    {progressWindowDays
                      ? ` • chu kỳ ${progressWindowDays} ngày`
                      : ""}
                  </p>
                )}
              </div>
            </div>
            <Link
              href="/progress"
              aria-disabled={!progressEligibility.eligible}
              tabIndex={progressEligibility.eligible ? 0 : -1}
              className={cn(
                "inline-flex min-w-[170px] items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition",
                progressEligibility.eligible
                  ? "bg-gradient-to-r from-[#2E5EB8] to-[#1D3C7A] text-white shadow-md shadow-[#1D3C7A]/40 hover:brightness-[1.05]"
                  : "cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-zinc-800 dark:text-zinc-500"
              )}
            >
              {progressEligibility.eligible ? "Làm Progress Test" : "Đang khóa"}
            </Link>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className={cn(CARD_BASE, "pt-6 sm:p-6")}>
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-500" />
      {/* Header */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
            <div className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl sm:h-10 sm:w-10">
              {/* Glow phía sau */}
              <div className="absolute inset-0 rounded-2xl" />

              {/* Khối icon chính */}
              <div className="relative flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 shadow-md shadow-[#00000022] sm:h-10 sm:w-10">
                <Gauge className="h-5 w-5 text-white" />
              </div>
          </div>
          <div>
              <h3 className="text-lg xs:text-xl font-semibold text-slate-900 dark:text-slate-50">
              Điểm TOEIC theo thời gian
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Listening, Reading &amp; Overall (đã quy đổi thang điểm TOEIC)
            </p>
          </div>
        </div>

          <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100/80 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-600 dark:bg-zinc-800 dark:text-zinc-300">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
          Assessment trend
          </div>
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
                    backgroundColor: "rgba(15,23,42,0.96)",
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
                  formatter={(
                    value: string | number,
                    name: string,
                    props: any
                  ) => {
                    // Chuyển value -> number hoặc null
                    const numeric =
                      typeof value === "number" && !Number.isNaN(value)
                        ? value
                        : null;

                    const rounded5 =
                      numeric != null ? Math.round(numeric / 5) * 5 : null;

                  const kind =
                      props?.payload?.kind === "baseline"
                        ? "Baseline"
                        : props?.payload?.kind === "progress"
                      ? "Progress Test"
                      : "Placement Test";

                    return [
                      rounded5 != null ? `${rounded5} điểm` : "Chưa có dữ liệu",
                      `${name} • ${kind}`,
                    ];
                  }}
                />

                {/* Listening */}
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

                {/* Reading */}
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

                {/* Overall */}
              <Line
                type="monotone"
                dataKey="Overall"
                stroke="#22c55e"
                strokeWidth={2.4}
                  dot={(props: any) => {
                    if (props.payload?.kind === "baseline") {
                      return (
                        <circle
                          cx={props.cx}
                          cy={props.cy}
                          r={6}
                          fill="#f59e0b"
                          stroke="#f59e0b"
                          strokeWidth={2}
                        />
                      );
                    }
                    return <></>;
                  }}
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
      </div>

      {assessmentData?.selfReportedScore != null && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Điểm khai báo chỉ có tổng Overall nên không tách được
          Listening/Reading — đường Overall sẽ thể hiện giá trị bạn nhập.
        </p>
      )}

      {/* Legend */}
      {assessmentLineData.length > 0 && (
        <div className="mt-4 flex flex-col gap-3 text-[11px] text-slate-600 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { label: "Listening", color: "from-sky-400 to-sky-500" },
              { label: "Reading", color: "from-indigo-400 to-indigo-500" },
              { label: "Overall", color: "from-emerald-400 to-emerald-500" },
            ].map((item) => (
              <span
                key={item.label}
                className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600 shadow-sm dark:bg-zinc-800/80 dark:text-zinc-200"
              >
                <span
                  className={cn(
                    "h-1.5 w-6 rounded-full bg-gradient-to-r",
                    item.color
                  )}
                />
                {item.label}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {assessmentData?.selfReportedScore != null && (
              <div className="flex items-center gap-1.5">
                <span className="h-0.5 w-4 rounded-full bg-amber-500" />
                <span>Baseline ({assessmentData.selfReportedScore} điểm)</span>
              </div>
            )}
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
