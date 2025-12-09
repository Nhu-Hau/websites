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
import { useTranslations } from "next-intl";
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
  | "insufficient_practice_tests"
  | string;
  nextEligibleAt?: string | null;
  remainingMs?: number | null;
  windowMinutes?: number | null;
  since?: string | null;
  suggestedAt?: string | null;
  practiceTestCount?: number;
  requiredPracticeTests?: number;
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
  placementScore: number | null,
  t: any
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
      message: t("comparison.matchMsg"),
      subtitle: t("comparison.matchSub", { reported: reportedScore, placement: placementScore, diff: absDiff }),
    };
  }

  if (level === "medium_diff") {
    return {
      level,
      diff,
      absDiff,
      message: t("comparison.mediumMsg"),
      subtitle: t("comparison.mediumSub", { reported: reportedScore, placement: placementScore, diff: absDiff }),
    };
  }

  return {
    level,
    diff,
    absDiff,
    message: t("comparison.largeMsg"),
    subtitle: t("comparison.largeSub", { reported: reportedScore, placement: placementScore, diff: absDiff }),
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

function formatRemainingMs(ms: number | null | undefined, t: any) {
  if (ms == null || ms <= 0) return t("time.fewMinutes");
  const totalSeconds = Math.ceil(ms / 1000);
  const days = Math.floor(totalSeconds / (60 * 60 * 24));
  const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60));
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days} ${t("time.days")} ${hours} ${t("time.hours")}`;
  }
  if (hours > 0) {
    return `${hours} ${t("time.hours")} ${minutes} ${t("time.minutes")}`;
  }
  if (minutes > 0) {
    return `${minutes} ${t("time.minutes")} ${seconds} ${t("time.seconds")}`;
  }
  return `${seconds} ${t("time.seconds")}`;
}

function describeEligibilityReason(info: ProgressEligibilityInfo | null, t: any) {
  if (!info) return "";
  switch (info.reason) {
    case "no_practice_yet":
      return t("eligibility.descNoPractice");
    case "insufficient_practice_tests":
      const current = info.practiceTestCount ?? 0;
      const required = info.requiredPracticeTests ?? 3;
      const remaining = required - current;
      return t("eligibility.descInsufficient", { remaining, current, required });
    case "no_practice_after_progress":
      return t("eligibility.descNoPracticeAfter");
    case "waiting_window":
      return t("eligibility.descWaiting");
    default:
      return t("eligibility.descDefault");
  }
}

const CARD_BASE =
  "relative overflow-hidden rounded-2xl border border-gray-200/70 bg-white/95 p-4 shadow-sm ring-1 ring-black/5 backdrop-blur-xl transition-all hover:shadow-md sm:p-5 dark:border-zinc-800/80 dark:bg-zinc-900/95";

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
  const t = useTranslations("dashboard.assessment");
  const basePrefix = useBasePrefix();
  const progressHref = `${basePrefix}/progress`;
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
      assessmentData.placementScore,
      t
    );
  }, [assessmentData, t]);

  const progressWindowDays = React.useMemo(() => {
    if (!progressEligibility?.windowMinutes) return null;
    return Math.round(progressEligibility.windowMinutes / (60 * 24));
  }, [progressEligibility]);

  const nextEligibleText = React.useMemo(() => {
    if (!progressEligibility?.nextEligibleAt) return null;
    const eta = formatDateTime(progressEligibility.nextEligibleAt);
    if (!eta) return null;
    return eta;
  }, [progressEligibility]);

  // Real-time countdown cho thời gian còn lại
  const [remainingTime, setRemainingTime] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (!progressEligibility?.remainingMs || progressEligibility.remainingMs <= 0) {
      setRemainingTime(null);
      return;
    }

    const updateRemaining = () => {
      const now = Date.now();
      const nextEligibleAt = progressEligibility.nextEligibleAt
        ? new Date(progressEligibility.nextEligibleAt).getTime()
        : null;
      if (!nextEligibleAt) {
        setRemainingTime(null);
        return;
      }
      const remaining = Math.max(0, nextEligibleAt - now);
      setRemainingTime(formatRemainingMs(remaining, t));
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 1000); // Update mỗi giây

    return () => clearInterval(interval);
  }, [progressEligibility?.remainingMs, progressEligibility?.nextEligibleAt, t]);

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
              {t("overviewTitle")}
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
                  {showComparisonCard ? t("comparison.hide") : t("comparison.show")}
                </span>
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {t("selfReported")}
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-50">
                {assessmentData.selfReportedScore != null
                  ? `${assessmentData.selfReportedScore} ${t("chart.tooltip", { score: "" }).replace("0", "").trim()}`
                  : t("chart.tooltip", { score: "" }).replace("0", "").trim() === "điểm" ? "Chưa xác định" : "Undefined"}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {t("placementTest")}
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-50">
                {assessmentData.placementScore != null
                  ? `${assessmentData.placementScore} ${t("chart.tooltip", { score: "" }).replace("0", "").trim()}`
                  : t("chart.tooltip", { score: "" }).replace("0", "").trim() === "điểm" ? "Chưa có" : "None"}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {t("latestProgress")}
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-50">
                {assessmentData.latestProgressScore != null
                  ? `${assessmentData.latestProgressScore} ${t("chart.tooltip", { score: "" }).replace("0", "").trim()}`
                  : t("chart.tooltip", { score: "" }).replace("0", "").trim() === "điểm" ? "Chưa có" : "None"}
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
              {/* Icon gradient kiểu planner */}
              <div className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl sm:h-10 sm:w-10">
                <div
                  className="absolute inset-0 rounded-2xl bg-gradient-to-r from-amber-200/60 via-amber-200/40 to-orange-300/40 blur-xl"
                />
                <div
                  className="relative flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-md shadow-[#00000022] sm:h-10 sm:w-10"
                >
                  <Clock3 className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="space-y-1">
                <p className={SECTION_LABEL_CLASS}>{t("eligibility.cycle", { days: 5 })} Progress Test</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  {progressEligibility.eligible
                    ? t("eligibility.eligible")
                    : progressEligibility.reason === "insufficient_practice_tests"
                      ? t("eligibility.insufficient")
                      : nextEligibleText
                        ? t("eligibility.reopen", { time: nextEligibleText })
                        : t("eligibility.waiting")}
                </p>
                {remainingTime && !progressEligibility.eligible && (
                  <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                    ⏱️ {t("eligibility.remaining", { time: remainingTime })}
                  </p>
                )}
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  {progressEligibility.eligible
                    ? t("eligibility.descEligible")
                    : describeEligibilityReason(progressEligibility, t)}
                </p>

                {!progressEligibility.eligible && anchorPracticeText && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-500">
                    {t("eligibility.anchor", { time: anchorPracticeText })}
                    {progressWindowDays
                      ? ` • ${t("eligibility.cycle", { days: progressWindowDays })}`
                      : ""}
                  </p>
                )}
              </div>
            </div>
            <Link
              href={progressHref}
              aria-disabled={!progressEligibility.eligible}
              tabIndex={progressEligibility.eligible ? 0 : -1}
              className={cn(
                "inline-flex min-w-[170px] items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition",
                progressEligibility.eligible
                  ? "bg-gradient-to-r from-[#2E5EB8] to-[#1D3C7A] text-white shadow-md shadow-[#1D3C7A]/40 hover:brightness-[1.05]"
                  : "cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-zinc-800 dark:text-zinc-500"
              )}
            >
              {progressEligibility.eligible ? t("eligibility.actionStart") : t("eligibility.actionLocked")}
            </Link>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className={CARD_BASE}>
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-500" />
        {/* Header */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {/* Icon gradient kiểu planner */}
            <div className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl sm:h-10 sm:w-10">
              <div
                className="absolute inset-0 rounded-2xl bg-gradient-to-r from-sky-200/60 via-indigo-200/40 to-sky-300/40 blur-xl"
              />
              <div
                className="relative flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 shadow-md shadow-[#00000022] sm:h-10 sm:w-10"
              >
                <Gauge className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="min-w-0">
              <h3 className="text-lg xs:text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                {t("chart.title")}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t("chart.subtitle")}
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200/80 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700/80">
            <span className="text-[10px] uppercase tracking-[0.16em] text-slate-400 dark:text-zinc-500">
              Assessment
            </span>
            <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-zinc-500" />
            <span className="truncate">trend</span>
          </div>
        </div>

        {/* Chart – height tối ưu cho mobile */}
        <div className="relative h-52 sm:h-60 md:h-64 lg:h-72">
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400 dark:text-slate-500" />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t("chart.loading")}
              </p>
            </div>
          ) : assessmentLineData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={assessmentLineData}
                margin={{ top: 8, right: 10, left: 0, bottom: 8 }}
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
                        ? t("chart.kindBaseline")
                        : props?.payload?.kind === "progress"
                          ? t("chart.kindProgress")
                          : t("chart.kindPlacement");

                    return [
                      rounded5 != null ? t("chart.tooltip", { score: rounded5 }) : "Chưa có dữ liệu",
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
                  dot={false}
                  activeDot={{
                    r: 4,
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
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400 dark:text-slate-500" />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t("chart.loading")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
