"use client";

import React, { useEffect, useState } from "react";
import { Target, TrendingUp, Trophy, Loader2, X } from "lucide-react";
import { toast } from "@/lib/toast";

import { useTranslations } from "next-intl";

interface GoalData {
  hasGoal: boolean;
  goal: {
    targetScore: number;
    startScore: number;
    setAt: string | null;
  } | null;
  currentScore: number | null;
  progress: number | null;
}

interface GoalProgressClientProps {
  initialData: GoalData | null;
}

const CARD_BASE =
  "relative overflow-hidden rounded-2xl border border-gray-200/70 bg-white/95 p-4 shadow-sm ring-1 ring-black/5 backdrop-blur-xl transition-all hover:shadow-md sm:p-5 dark:border-zinc-800/80 dark:bg-zinc-900/95";

const SECTION_LABEL_CLASS =
  "text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400";

export default function GoalProgressClient({
  initialData,
}: GoalProgressClientProps) {
  const t = useTranslations("dashboard.goal");
  const [data, setData] = useState<GoalData | null>(initialData);
  const [showDialog, setShowDialog] = useState(false);
  const [targetInput, setTargetInput] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const handleTestSubmitted = (event: Event) => {
      const customEvent = event as CustomEvent;
      const testType = customEvent.detail?.type;
      if (testType === "placement" || testType === "progress") {
        setTimeout(() => fetchGoal(), 1200);
      }
    };
    window.addEventListener("test-submitted", handleTestSubmitted);
    return () =>
      window.removeEventListener("test-submitted", handleTestSubmitted);
  }, []);

  const fetchGoal = async () => {
    try {
      const res = await fetch("/api/dashboard/goal", {
        credentials: "include",
        cache: "no-store",
      });
      if (res.ok) {
        const json: GoalData = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error("Failed to fetch goal data", e);
    }
  };

  const handleSetGoal = async () => {
    const target = parseInt(targetInput);
    if (isNaN(target) || target < 10 || target > 990) {
      toast.error(t("toast.rangeError"));
      return;
    }

    setIsUpdating(true);
    try {
      const res = await fetch("/api/dashboard/goal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ targetScore: target }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || t("toast.fail"));
        return;
      }

      toast.success(t("toast.success"));
      setShowDialog(false);
      setTargetInput("");
      await fetchGoal();
    } catch (e) {
      console.error(e);
      toast.error(t("toast.fail"));
    } finally {
      setIsUpdating(false);
    }
  };

  /* ===================== EMPTY / NO GOAL ===================== */
  if (!data || !data.hasGoal || !data.goal) {
    return (
      <div className={CARD_BASE}>
        {/* subtle top border accent */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-400 via-violet-500 to-indigo-600" />

        {/* Header */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {/* Icon gradient kiểu planner */}
            <div className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl sm:h-10 sm:w-10">
              <div
                className="absolute inset-0 rounded-2xl bg-gradient-to-r from-violet-200/60 via-violet-200/40 to-indigo-300/40 blur-xl"
              />
              <div
                className="relative flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-md shadow-[#00000022] sm:h-10 sm:w-10"
              >
                <Target className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="min-w-0">
              <p className={SECTION_LABEL_CLASS}>{t("empty.label")}</p>
              <h3 className="text-lg sm:text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                {t("empty.title")}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {t("empty.description")}
              </p>
            </div>
          </div>
        </div>

        {/* Empty state */}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200/80 bg-slate-50/80 px-4 py-6 text-center dark:border-zinc-800/70 dark:bg-zinc-900/60">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm dark:bg-zinc-900">
            <Target className="h-6 w-6 text-slate-400 dark:text-slate-500" />
          </div>
          <p className="mb-1 text-sm font-semibold text-slate-900 dark:text-slate-50">
            {t("empty.cardTitle")}
          </p>
          <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
            {t("empty.cardDesc")}
          </p>
          <button
            onClick={() => setShowDialog(true)}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-500 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-violet-500/30 transition hover:brightness-110"
          >
            <Target className="h-4 w-4" />
            {t("empty.button")}
          </button>
        </div>

        {showDialog && (
          <GoalDialog
            showDialog={showDialog}
            setShowDialog={setShowDialog}
            targetInput={targetInput}
            setTargetInput={setTargetInput}
            handleSetGoal={handleSetGoal}
            isUpdating={isUpdating}
            isEdit={false}
          />
        )}
      </div>
    );
  }

  /* ===================== WITH GOAL ===================== */
  const { goal, currentScore } = data;

  const denom = goal.targetScore - goal.startScore || 1; // tránh chia 0
  const progressPercent =
    currentScore !== null
      ? Math.max(
        0,
        Math.min(100, ((currentScore - goal.startScore) / denom) * 100)
      )
      : 0;

  const isAchieved = progressPercent >= 100;
  const tone = isAchieved ? "emerald" : "violet";

  return (
    <div className={CARD_BASE}>
      {/* top accent */}
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${isAchieved
          ? "from-emerald-400 via-emerald-500 to-teal-400"
          : "from-violet-400 via-violet-500 to-indigo-500"
          }`}
      />

      {/* Header */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          {/* Icon gradient kiểu planner */}
          <div className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl sm:h-10 sm:w-10">
            <div
              className={`absolute inset-0 rounded-2xl bg-gradient-to-r blur-xl ${isAchieved
                ? "from-emerald-200/60 via-emerald-200/40 to-teal-300/40"
                : "from-violet-200/60 via-violet-200/40 to-indigo-300/40"
                }`}
            />
            <div
              className={`relative flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br shadow-md shadow-[#00000022] sm:h-10 sm:w-10 ${isAchieved
                ? "from-emerald-500 to-teal-500"
                : "from-violet-500 to-indigo-600"
                }`}
            >
              {isAchieved ? (
                <Trophy className="h-5 w-5 text-white" />
              ) : (
                <Target className="h-5 w-5 text-white" />
              )}
            </div>
          </div>
          <div className="min-w-0">
            <p className={SECTION_LABEL_CLASS}>{t("tracking.label")}</p>
            <h3 className="text-lg sm:text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
              {t("tracking.title")}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {isAchieved ? t("tracking.achieved") : t("tracking.ongoing")}
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setTargetInput(goal.targetScore.toString());
            setShowDialog(true);
          }}
          className="self-start rounded-full bg-gradient-to-r from-violet-500 to-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow-md shadow-violet-500/30 transition hover:brightness-110"
        >
          {t("tracking.update")}
        </button>
      </div>

      {/* Stats grid */}
      <div className="mb-4 grid grid-cols-2 gap-3 text-center text-xs sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white/70 px-3 py-3 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/70">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {t("tracking.stats.target")}
          </p>
          <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            {goal.targetScore}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white/70 px-3 py-3 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/70">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {t("tracking.stats.current")}
          </p>
          <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            {currentScore ?? "—"}
          </p>
        </div>
        <div className="col-span-2 rounded-2xl border border-slate-200/80 bg-white/70 px-3 py-3 text-center text-xs shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/70 sm:col-span-1">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {t("tracking.stats.completed")}
          </p>
          <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            {progressPercent.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Progress bar + markers */}
      <div className="space-y-1.5">
        <div className="relative h-3.5 overflow-hidden rounded-full bg-slate-100/80 dark:bg-zinc-800">
          {/* filled bar */}
          <div
            className={`absolute inset-y-0 left-0 flex items-center justify-end rounded-full bg-gradient-to-r ${isAchieved
              ? "from-emerald-500 via-emerald-500 to-teal-400"
              : "from-violet-500 via-violet-500 to-indigo-400"
              } transition-all duration-700 ease-out`}
            style={{ width: `${Math.min(progressPercent, 100)}%` }}
          >
            {progressPercent > 12 && (
              <span className="mr-2 text-[10px] font-semibold text-white">
                {progressPercent.toFixed(0)}%
              </span>
            )}
          </div>

          {/* start marker */}
          <div className="absolute inset-y-0 left-0 flex items-center">
            <div className="h-3 w-[1px] bg-slate-400/60" />
          </div>
          {/* target marker (always right) */}
          <div className="absolute inset-y-0 right-0 flex items-center">
            <div className="h-3 w-[1px] bg-slate-400/60" />
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span>{t("tracking.start", { score: goal.startScore })}</span>
          <span>{t("tracking.target", { score: goal.targetScore })}</span>
        </div>
      </div>

      {/* Summary line */}
      <div className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-600 dark:text-slate-400">
        <TrendingUp
          className={`h-4 w-4 ${tone === "emerald"
            ? "text-emerald-500 dark:text-emerald-400"
            : "text-violet-500 dark:text-violet-400"
            }`}
        />
        <span className="text-center">
          {t("tracking.summary", {
            start: goal.startScore,
            target: goal.targetScore,
          })}
        </span>
      </div>

      {showDialog && (
        <GoalDialog
          showDialog={showDialog}
          setShowDialog={setShowDialog}
          targetInput={targetInput}
          setTargetInput={setTargetInput}
          handleSetGoal={handleSetGoal}
          isUpdating={isUpdating}
          isEdit={true}
          currentTarget={goal.targetScore}
        />
      )}
    </div>
  );
}

/* ===================== Dialog ===================== */

function GoalDialog({
  showDialog,
  setShowDialog,
  targetInput,
  setTargetInput,
  handleSetGoal,
  isUpdating,
  isEdit,
  currentTarget,
}: {
  showDialog: boolean;
  setShowDialog: (v: boolean) => void;
  targetInput: string;
  setTargetInput: (v: string) => void;
  handleSetGoal: () => void;
  isUpdating: boolean;
  isEdit: boolean;
  currentTarget?: number;
}) {
  const t = useTranslations("dashboard.goal");
  if (!showDialog) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={() => {
        if (!isUpdating) {
          setShowDialog(false);
          setTargetInput("");
        }
      }}
    >
      <div
        className="
          w-full max-w-sm rounded-2xl 
          bg-white dark:bg-zinc-900 
          border border-zinc-200 dark:border-zinc-700
          shadow-2xl
          animate-in zoom-in-95 slide-in-from-bottom-4 duration-300
        "
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <Target className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                {isEdit ? t("dialog.updateTitle") : t("dialog.setTitle")}
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                {t("dialog.desc")}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (!isUpdating) {
                setShowDialog(false);
                setTargetInput("");
              }
            }}
            disabled={isUpdating}
            className="h-8 w-8 -mt-1 -mr-1 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 transition-colors disabled:opacity-60"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* BODY */}
        <div className="px-5 pb-4">
          <div className="rounded-xl bg-violet-50 dark:bg-violet-500/10 p-4 border border-violet-100 dark:border-violet-500/20">
            <label className="text-sm font-semibold text-violet-700 dark:text-violet-300">
              {t("dialog.inputLabel")}
            </label>

            <input
              type="number"
              min={10}
              max={990}
              value={targetInput}
              onChange={(e) => setTargetInput(e.target.value)}
              placeholder={t("dialog.placeholder")}
              autoFocus
              className="
                mt-2.5 w-full rounded-xl border-2 border-violet-200 bg-white px-4 py-3
                text-lg font-semibold text-zinc-900 
                placeholder:text-zinc-400 placeholder:font-normal outline-none
                focus:border-violet-500 focus:ring-4 focus:ring-violet-200/50
                dark:bg-zinc-800 dark:text-zinc-50 dark:border-violet-500/50
                dark:focus:ring-violet-500/20
                transition-all
              "
            />
            {currentTarget && isEdit && (
              <p className="mt-2 text-sm text-violet-600 dark:text-violet-400">
                {t("dialog.current", { score: currentTarget })}
              </p>
            )}
          </div>
        </div>

        {/* FOOTER BUTTONS */}
        <div className="px-5 pb-5 pt-2 flex gap-3">
          <button
            onClick={() => {
              if (!isUpdating) {
                setShowDialog(false);
                setTargetInput("");
              }
            }}
            disabled={isUpdating}
            className="
              flex-1 py-3 rounded-xl bg-zinc-100 border border-zinc-200
              text-sm font-semibold text-zinc-700
              hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200
              dark:border-zinc-700 dark:hover:bg-zinc-700
              disabled:opacity-60 disabled:cursor-not-allowed
              transition-colors
            "
          >
            {t("dialog.cancel")}
          </button>

          <button
            onClick={handleSetGoal}
            disabled={isUpdating}
            className="
              flex-[1.2] py-3 rounded-xl
              bg-gradient-to-r from-violet-500 to-indigo-600
              text-sm font-semibold text-white shadow-lg shadow-violet-500/30
              hover:shadow-violet-500/40 hover:brightness-110
              disabled:opacity-60 disabled:cursor-not-allowed
              flex items-center justify-center gap-2
              transition-all
            "
          >
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("dialog.saving")}
              </>
            ) : (
              t("dialog.confirm")
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
