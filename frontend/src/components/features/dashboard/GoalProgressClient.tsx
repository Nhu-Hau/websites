"use client";

import React, { useEffect, useState } from "react";
import { Target, TrendingUp, Trophy, Loader2, X } from "lucide-react";
import { toast } from "@/lib/toast";

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
  "relative overflow-hidden rounded-2xl border border-gray-200/70 bg-white/95 p-4 shadow-sm ring-1 ring-black/5 backdrop-blur-xl dark:border-gray-800/80 dark:bg-gray-950/90 dark:ring-white/5 sm:p-5";

const SECTION_LABEL_CLASS =
  "text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400";

export default function GoalProgressClient({
  initialData,
}: GoalProgressClientProps) {
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
      toast.error("Điểm mục tiêu phải từ 10 đến 990");
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
        toast.error(err.message || "Đặt mục tiêu thất bại");
        return;
      }

      toast.success("Đặt mục tiêu thành công!");
      setShowDialog(false);
      setTargetInput("");
      await fetchGoal();
    } catch (e) {
      console.error(e);
      toast.error("Đặt mục tiêu thất bại");
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
            <div>
              <p className={SECTION_LABEL_CLASS}>Goal planning</p>
              <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-50">
                Tiến độ đạt mục tiêu
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Chưa có mục tiêu TOEIC nào được thiết lập.
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
            Bạn chưa đặt mục tiêu TOEIC
          </p>
          <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
            Đặt mục tiêu để hệ thống theo dõi tiến trình học và nhắc bạn luyện
            tập đều hơn.
          </p>
          <button
            onClick={() => setShowDialog(true)}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-500 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-violet-500/30 transition hover:brightness-110"
          >
            <Target className="h-4 w-4" />
            Đặt mục tiêu ngay
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
        className={`pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${
          isAchieved
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
              className={`absolute inset-0 rounded-2xl bg-gradient-to-r blur-xl ${
                isAchieved
                  ? "from-emerald-200/60 via-emerald-200/40 to-teal-300/40"
                  : "from-violet-200/60 via-violet-200/40 to-indigo-300/40"
              }`}
            />
            <div
              className={`relative flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br shadow-md shadow-[#00000022] sm:h-10 sm:w-10 ${
                isAchieved
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
          <div>
            <p className={SECTION_LABEL_CLASS}>Goal tracking</p>
            <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-50">
              Tiến độ đạt mục tiêu
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {isAchieved
                ? "Chúc mừng! Bạn đã chạm mục tiêu TOEIC đã đặt."
                : "Giữ nhịp luyện tập để tiến gần hơn tới mục tiêu."}
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
          Cập nhật
        </button>
      </div>

      {/* Stats grid */}
      <div className="mb-4 grid grid-cols-2 gap-3 text-center text-xs sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white/70 px-3 py-3 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/70">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Mục tiêu
          </p>
          <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            {goal.targetScore}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white/70 px-3 py-3 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/70">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Hiện tại
          </p>
          <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            {currentScore ?? "—"}
          </p>
        </div>
        <div className="col-span-2 rounded-2xl border border-slate-200/80 bg-white/70 px-3 py-3 text-center text-xs shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/70 sm:col-span-1">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Hoàn thành
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
            className={`absolute inset-y-0 left-0 flex items-center justify-end rounded-full bg-gradient-to-r ${
              isAchieved
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
          <span>Bắt đầu: {goal.startScore}</span>
          <span>Mục tiêu: {goal.targetScore}</span>
        </div>
      </div>

      {/* Summary line */}
      <div className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-600 dark:text-slate-400">
        <TrendingUp
          className={`h-4 w-4 ${
            tone === "emerald"
              ? "text-emerald-500 dark:text-emerald-400"
              : "text-violet-500 dark:text-violet-400"
          }`}
        />
        <span className="text-center">
          Từ{" "}
          <span className="font-semibold text-slate-900 dark:text-slate-50">
            {goal.startScore}
          </span>{" "}
          →{" "}
          <span className="font-semibold text-slate-900 dark:text-slate-50">
            {goal.targetScore}
          </span>{" "}
          điểm
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
  if (!showDialog) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-sm"
      onClick={() => {
        if (!isUpdating) {
          setShowDialog(false);
          setTargetInput("");
        }
      }}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl border border-gray-200/80 bg-white/95 shadow-2xl ring-1 ring-black/5 dark:border-gray-800/80 dark:bg-gray-950/95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* top accent */}
        <div className="h-1 w-full bg-gradient-to-r from-violet-400 via-violet-500 to-indigo-600" />

        <div className="px-6 pb-6 pt-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                {isEdit ? "Cập nhật mục tiêu" : "Đặt mục tiêu TOEIC"}
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Nhập điểm TOEIC mong muốn trong khoảng 10 – 990.
              </p>
            </div>
            <button
              onClick={() => {
                if (!isUpdating) {
                  setShowDialog(false);
                  setTargetInput("");
                }
              }}
              disabled={isUpdating}
              className="rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-60 dark:hover:bg-zinc-800 dark:hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="relative mb-5">
            <input
              type="number"
              min={10}
              max={990}
              value={targetInput}
              onChange={(e) => setTargetInput(e.target.value)}
              placeholder="Ví dụ: 750"
              className="w-full rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-2.5 text-sm font-medium text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-300/80 dark:border-zinc-800 dark:bg-zinc-900 dark:text-slate-50 dark:placeholder:text-slate-500 dark:focus:border-violet-500 dark:focus:ring-violet-500/40"
            />
            {currentTarget && isEdit && (
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 dark:text-slate-500">
                Hiện tại: {currentTarget}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                if (!isUpdating) {
                  setShowDialog(false);
                  setTargetInput("");
                }
              }}
              disabled={isUpdating}
              className="flex-1 rounded-2xl border border-slate-200/80 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-900 dark:text-slate-200 dark:hover:bg-zinc-800"
            >
              Hủy
            </button>
            <button
              onClick={handleSetGoal}
              disabled={isUpdating}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-violet-500/30 transition-all hover:brightness-110 disabled:opacity-60"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                "Xác nhận"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
