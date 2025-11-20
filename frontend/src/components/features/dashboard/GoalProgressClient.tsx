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
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-sm ring-1 ring-black/[0.02] transition-shadow duration-200 hover:shadow-md dark:border-zinc-800/80 dark:bg-zinc-900/95 sm:p-5">
        {/* subtle top border accent */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-400 via-violet-500 to-indigo-500" />

        {/* Header */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-900/30">
              <Target className="h-5 w-5 text-violet-600 dark:text-violet-300" />
              <div className="pointer-events-none absolute inset-0 rounded-xl bg-violet-200/40 blur-md dark:bg-violet-500/20" />
            </div>
            <div>
              <div className="mb-1 inline-flex items-center gap-2">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  Tiến độ đạt mục tiêu
                </h3>
                <span className="rounded-full bg-zinc-100 px-2 py-[2px] text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                  Goal
                </span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Chưa có mục tiêu TOEIC nào được thiết lập.
              </p>
            </div>
          </div>
        </div>

        {/* Empty state */}
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/90 px-4 py-6 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm dark:bg-zinc-800">
            <Target className="h-6 w-6 text-zinc-400 dark:text-zinc-500" />
          </div>
          <p className="mb-1 text-sm font-medium text-zinc-900 dark:text-zinc-50">
            Bạn chưa đặt mục tiêu TOEIC
          </p>
          <p className="mb-4 text-xs text-zinc-500 dark:text-zinc-400">
            Đặt mục tiêu để hệ thống theo dõi tiến trình học và nhắc bạn luyện
            tập đều hơn.
          </p>
          <button
            onClick={() => setShowDialog(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-500 to-indigo-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:from-violet-400 hover:to-indigo-400 hover:shadow-md"
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
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-sm ring-1 ring-black/[0.02] transition-shadow duration-200 hover:shadow-md dark:border-zinc-800/80 dark:bg-zinc-900/95 sm:p-5">
      {/* top accent */}
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${
          isAchieved
            ? "from-emerald-400 via-emerald-500 to-teal-400"
            : "from-violet-400 via-violet-500 to-indigo-500"
        }`}
      />

      {/* Header */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`relative flex h-10 w-10 items-center justify-center rounded-xl ${
              isAchieved
                ? "bg-emerald-50 dark:bg-emerald-900/30"
                : "bg-violet-50 dark:bg-violet-900/30"
            }`}
          >
            {isAchieved ? (
              <Trophy className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
            ) : (
              <Target className="h-5 w-5 text-violet-600 dark:text-violet-300" />
            )}
            <div className="pointer-events-none absolute inset-0 rounded-xl bg-white/50 blur-md dark:bg-white/10" />
          </div>
          <div>
            <div className="mb-1 inline-flex items-center gap-2">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Tiến độ đạt mục tiêu
              </h3>
              <span className="rounded-full bg-zinc-100 px-2 py-[2px] text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                Goal • {goal.targetScore}
              </span>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
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
          className="self-start rounded-full border border-transparent bg-violet-50 px-3 py-1 text-[11px] font-medium text-violet-700 shadow-sm transition-colors hover:border-violet-200 hover:bg-violet-50/70 dark:bg-zinc-800 dark:text-violet-300 dark:hover:border-violet-500/60 dark:hover:bg-zinc-800/80"
        >
          Cập nhật
        </button>
      </div>

      {/* Stats grid */}
      <div className="mb-4 grid grid-cols-2 gap-3 text-center text-xs sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50/90 px-3 py-3 dark:border-zinc-700 dark:bg-zinc-900">
          <p className="mb-1 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
            Mục tiêu
          </p>
          <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {goal.targetScore}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50/90 px-3 py-3 dark:border-zinc-700 dark:bg-zinc-900">
          <p className="mb-1 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
            Hiện tại
          </p>
          <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {currentScore ?? "—"}
          </p>
        </div>
        <div className="col-span-2 rounded-xl border border-slate-200 bg-slate-50/90 px-3 py-3 text-center text-xs dark:border-zinc-700 dark:bg-zinc-900 sm:col-span-1">
          <p className="mb-1 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
            Hoàn thành
          </p>
          <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {progressPercent.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Progress bar + markers */}
      <div className="space-y-1.5">
        <div className="relative h-3.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
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
            <div className="h-3 w-[1px] bg-zinc-400/60" />
          </div>
          {/* target marker (always right) */}
          <div className="absolute inset-y-0 right-0 flex items-center">
            <div className="h-3 w-[1px] bg-zinc-400/60" />
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
          <span>Bắt đầu: {goal.startScore}</span>
          <span>Mục tiêu: {goal.targetScore}</span>
        </div>
      </div>

      {/* Summary line */}
      <div className="mt-2 flex items-center justify-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
        <TrendingUp
          className={`h-4 w-4 ${
            tone === "emerald"
              ? "text-emerald-500 dark:text-emerald-400"
              : "text-violet-500 dark:text-violet-400"
          }`}
        />
        <span className="text-center">
          Từ{" "}
          <span className="font-semibold text-zinc-900 dark:text-zinc-50">
            {goal.startScore}
          </span>{" "}
          →{" "}
          <span className="font-semibold text-zinc-900 dark:text-zinc-50">
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
        className="w-full max-w-md overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/95 shadow-xl ring-1 ring-black/[0.05] dark:border-zinc-800/80 dark:bg-zinc-900/95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* top accent */}
        <div className="h-1 w-full bg-gradient-to-r from-violet-400 via-violet-500 to-indigo-500" />

        <div className="px-5 pb-5 pt-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {isEdit ? "Cập nhật mục tiêu" : "Đặt mục tiêu TOEIC"}
              </h3>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
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
              className="rounded-full p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 disabled:opacity-60 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
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
              className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 shadow-sm outline-none placeholder:text-zinc-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-300/80 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-violet-500 dark:focus:ring-violet-500/40"
            />
            {currentTarget && isEdit && (
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-zinc-400">
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
              className="flex-1 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Hủy
            </button>
            <button
              onClick={handleSetGoal}
              disabled={isUpdating}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:from-violet-400 hover:to-indigo-400 hover:shadow-md disabled:opacity-60"
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