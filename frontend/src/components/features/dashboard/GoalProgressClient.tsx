"use client";

import React, { useEffect, useState } from "react";
import { Target, TrendingUp, Trophy, Loader2 } from "lucide-react";
import { toast } from "sonner";

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

export default function GoalProgressClient({ initialData }: GoalProgressClientProps) {
  const [data, setData] = useState<GoalData | null>(initialData);
  const [showDialog, setShowDialog] = useState(false);
  const [targetInput, setTargetInput] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Lắng nghe sự kiện test submit
  useEffect(() => {
    const handleTestSubmitted = (event: Event) => {
      const customEvent = event as CustomEvent;
      const testType = customEvent.detail?.type;
      if (testType === "placement" || testType === "progress") {
        setTimeout(() => fetchGoal(), 1200);
      }
    };

    window.addEventListener("test-submitted", handleTestSubmitted);
    return () => window.removeEventListener("test-submitted", handleTestSubmitted);
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

  if (!data || !data.hasGoal || !data.goal) {
    return (
      <div className="rounded-3xl border-2 border-white/30 bg-white/95 dark:bg-zinc-800/95 backdrop-blur-xl p-7 shadow-2xl ring-2 ring-white/20 dark:ring-zinc-800/50">
        {/* Header */}
        <div className="flex items-center justify-between mb-7">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 shadow-xl ring-2 ring-white/50">
              <Target className="h-7 w-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-zinc-900 dark:text-white">
                Tiến độ đạt mục tiêu
              </h2>
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Chưa có mục tiêu nào được thiết lập
              </p>
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div className="text-center py-10">
          <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-slate-100 to-slate-50 dark:from-zinc-800 dark:to-zinc-700 shadow-inner flex items-center justify-center mb-5">
            <Target className="h-10 w-10 text-slate-400 dark:text-zinc-500" />
          </div>
          <p className="text-base font-bold text-zinc-700 dark:text-zinc-300 mb-2">
            Bạn chưa đặt mục tiêu TOEIC
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
            Đặt mục tiêu để theo dõi tiến trình học tập
          </p>
          <button
            onClick={() => setShowDialog(true)}
            className="group inline-flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-black text-base shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] hover:from-violet-500 hover:to-purple-500"
          >
            <Target className="h-5 w-5 transition-transform group-hover:scale-110" />
            Đặt mục tiêu ngay
          </button>
        </div>

        {/* Dialog */}
        {showDialog && <GoalDialog {...{ showDialog, setShowDialog, targetInput, setTargetInput, handleSetGoal, isUpdating, isEdit: false }} />}
      </div>
    );
  }

  const { goal, currentScore } = data;
  const progressPercent =
    currentScore !== null && goal
      ? Math.max(0, Math.min(100, ((currentScore - goal.startScore) / (goal.targetScore - goal.startScore)) * 100))
      : 0;

  const isAchieved = progressPercent >= 100;

  return (
    <div className="rounded-3xl border-2 border-white/30 bg-white/95 dark:bg-zinc-800/95 backdrop-blur-xl p-7 shadow-2xl ring-2 ring-white/20 dark:ring-zinc-800/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-7">
        <div className="flex items-center gap-3">
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${isAchieved ? "bg-gradient-to-br from-emerald-500 to-teal-500" : "bg-gradient-to-br from-violet-600 to-purple-600"} shadow-xl ring-2 ring-white/50`}>
            {isAchieved ? <Trophy className="h-7 w-7 text-white" /> : <Target className="h-7 w-7 text-white" />}
          </div>
          <div>
            <h2 className="text-xl font-black text-zinc-900 dark:text-white">
              Tiến độ đạt mục tiêu
            </h2>
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              {isAchieved ? "Chúc mừng! Bạn đã đạt mục tiêu!" : "Tiếp tục cố gắng nhé!"}
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setTargetInput(goal.targetScore.toString());
            setShowDialog(true);
          }}
          className="group text-sm font-bold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-all hover:scale-105"
        >
          Cập nhật
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-7 text-center">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/30 dark:to-purple-900/30 shadow-inner">
          <p className="text-xs font-bold uppercase tracking-wider text-violet-700 dark:text-violet-300">Mục tiêu</p>
          <p className="text-2xl font-black text-violet-900 dark:text-white mt-1">{goal.targetScore}</p>
        </div>
        <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-900/30 dark:to-blue-900/30 shadow-inner">
          <p className="text-xs font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300">Hiện tại</p>
          <p className="text-2xl font-black text-sky-900 dark:text-white mt-1">{currentScore ?? "—"}</p>
        </div>
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 shadow-inner">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Hoàn thành</p>
          <p className="text-2xl font-black text-emerald-900 dark:text-white mt-1">{progressPercent.toFixed(1)}%</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="relative h-12 bg-white/80 dark:bg-zinc-800/80 rounded-2xl shadow-inner overflow-hidden border-2 border-white/40">
          <div
            className={`absolute inset-0 h-full bg-gradient-to-r ${isAchieved ? "from-emerald-500 to-teal-500" : "from-violet-600 to-purple-600"} transition-all duration-1000 ease-out flex items-center justify-end pr-4`}
            style={{ width: `${Math.min(progressPercent, 100)}%` }}
          >
            {progressPercent > 15 && (
              <span className="text-sm font-black text-white drop-shadow-md">
                {progressPercent.toFixed(1)}%
              </span>
            )}
          </div>
          {isAchieved && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Trophy className="h-8 w-8 text-white animate-pulse" />
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="flex items-center justify-center gap-2 text-sm font-bold text-zinc-600 dark:text-zinc-400">
        <TrendingUp className={`h-5 w-5 ${isAchieved ? "text-emerald-600 dark:text-emerald-400" : "text-violet-600 dark:text-violet-400"}`} />
        <span>
          Từ <strong className="text-violet-700 dark:text-violet-300">{goal.startScore}</strong> →{" "}
          <strong className="text-emerald-700 dark:text-emerald-300">{goal.targetScore}</strong> điểm
        </span>
      </div>

      {/* Dialog */}
      {showDialog && <GoalDialog {...{ showDialog, setShowDialog, targetInput, setTargetInput, handleSetGoal, isUpdating, isEdit: true, currentTarget: goal.targetScore }} />}
    </div>
  );
}

// Dialog Component
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
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
      onClick={() => setShowDialog(false)}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-white/95 dark:bg-zinc-800/95 backdrop-blur-xl p-7 shadow-2xl border-2 border-white/30 ring-2 ring-white/20 dark:ring-zinc-800/50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 shadow-lg ring-2 ring-white/50">
            <Target className="h-7 w-7 text-white" />
          </div>
          <h3 className="text-xl font-black text-zinc-900 dark:text-white">
            {isEdit ? "Cập nhật mục tiêu" : "Đặt mục tiêu TOEIC"}
          </h3>
        </div>

        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-5">
          Nhập điểm TOEIC mục tiêu (10 - 990 điểm)
        </p>

        <div className="relative mb-6">
          <input
            type="number"
            min="10"
            max="990"
            value={targetInput}
            onChange={(e) => setTargetInput(e.target.value)}
            placeholder="Ví dụ: 750"
            className="w-full rounded-2xl border-2 border-white/40 bg-white/80 dark:bg-zinc-900/80 px-5 py-4 text-lg font-black text-zinc-900 dark:text-white placeholder-zinc-400 focus:ring-4 focus:ring-violet-500/30 focus:border-violet-500 outline-none transition-all"
          />
          {currentTarget && isEdit && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-500">
              Hiện tại: {currentTarget}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              setShowDialog(false);
              setTargetInput("");
            }}
            disabled={isUpdating}
            className="flex-1 px-5 py-3.5 rounded-2xl border-2 border-white/40 bg-white/80 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 font-bold transition-all hover:bg-white dark:hover:bg-zinc-700 hover:scale-[1.02] disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={handleSetGoal}
            disabled={isUpdating}
            className="group flex-1 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-black transition-all hover:from-violet-500 hover:to-purple-500 hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isUpdating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                Xác nhận
                <Target className="h-5 w-5 transition-transform group-hover:scale-110" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}