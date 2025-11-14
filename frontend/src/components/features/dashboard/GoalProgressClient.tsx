"use client";

import React, { useEffect, useState } from "react";
import { Target, TrendingUp, Trophy, Loader2, Sparkles } from "lucide-react";
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
      <div className="group relative rounded-3xl bg-white/90 dark:bg-zinc-800/90 backdrop-blur-xl p-6 shadow-2xl ring-2 ring-white/30 dark:ring-zinc-700/50 transition-all duration-500 hover:shadow-3xl hover:scale-[1.005] hover:ring-amber-300/50 dark:hover:ring-amber-600/50 overflow-hidden">
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Header */}
        <div className="relative flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="relative transform-gpu transition-all duration-400 group-hover:scale-110 group-hover:-rotate-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-xl ring-3 ring-white/50 dark:ring-zinc-800/50">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/30 backdrop-blur-md">
                  <Target className="h-7 w-7 text-white drop-shadow-md" />
                </div>
              </div>
              <div className=" Simmons absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-400/40 to-orange-400/40 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-zinc-900 dark:text-white">Tiến độ đạt mục tiêu</h2>
              <p className="text-sm font-bold text-zinc-600 dark:text-zinc-400">Chưa có mục tiêu nào được thiết lập</p>
            </div>
          </div>
          <Sparkles className="h-5 w-5 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>

        {/* Empty State */}
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-slate-100 to-slate-50 dark:from-zinc-800 dark:to-zinc-700 shadow-inner flex items-center justify-center mb-6">
            <Target className="h-12 w-12 text-slate-400 dark:text-zinc-500" />
          </div>
          <p className="text-lg font-black text-zinc-700 dark:text-zinc-300 mb-2">Bạn chưa đặt mục tiêu TOEIC</p>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-8">Đặt mục tiêu để theo dõi tiến trình học tập</p>
          <button
            onClick={() => setShowDialog(true)}
            className="group inline-flex items-center gap-3 px-7 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-black text-base shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] hover:from-amber-500 hover:to-amber-500"
          >
            <Target className="h-6 w-6 transition-transform group-hover:scale-110" />
            Đặt mục tiêu ngay
          </button>
        </div>

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
    <div className="group relative rounded-3xl bg-white/90 dark:bg-zinc-800/90 backdrop-blur-xl p-6 shadow-2xl ring-2 ring-white/30 dark:ring-zinc-700/50 transition-all duration-500 hover:shadow-3xl hover:scale-[1.005] hover:ring-emerald-300/50 dark:hover:ring-emerald-600/50 overflow-hidden h-full">
      {/* Gradient Overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${isAchieved ? "from-emerald-500/5 to-teal-500/5" : "from-amber-500/5 to-orange-500/5"} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      
      {/* Header */}
      <div className="relative flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="relative transform-gpu transition-all duration-400 group-hover:scale-110 group-hover:-rotate-3">
            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${isAchieved ? "bg-gradient-to-br from-emerald-500 to-teal-500" : "bg-gradient-to-br from-amber-500 to-amber-600"} shadow-xl ring-3 ring-white/50 dark:ring-zinc-800/50`}>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/30 backdrop-blur-md">
                {isAchieved ? <Trophy className="h-7 w-7 text-white drop-shadow-md" /> : <Target className="h-7 w-7 text-white drop-shadow-md" />}
              </div>
            </div>
            <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${isAchieved ? "from-emerald-400/40 to-teal-400/40" : "from-amber-400/40 to-orange-400/40"} blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white">Tiến độ đạt mục tiêu</h2>
            <p className="text-sm font-bold text-zinc-600 dark:text-zinc-400">
              {isAchieved ? "Chúc mừng! Bạn đã đạt mục tiêu!" : "Tiếp tục cố gắng nhé!"}
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setTargetInput(goal.targetScore.toString());
            setShowDialog(true);
          }}
          className="group text-sm font-black text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-300 transition-all duration-300 hover:scale-105"
        >
          Cập nhật
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 mb-8 text-center">
        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 shadow-inner border border-amber-200/50 dark:border-amber-800/40">
          <p className="text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-300">Mục tiêu</p>
          <p className="text-3xl font-black text-amber-900 dark:text-white mt-2">{goal.targetScore}</p>
        </div>
        <div className="p-5 rounded-2xl bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-900/30 dark:to-blue-900/30 shadow-inner border border-sky-200/50 dark:border-sky-800/40">
          <p className="text-xs font-black uppercase tracking-wider text-sky-700 dark:text-sky-300">Hiện tại</p>
          <p className="text-3xl font-black text-sky-900 dark:text-white mt-2">{currentScore ?? "—"}</p>
        </div>
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 shadow-inner border border-emerald-200/50 dark:border-emerald-800/40">
          <p className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Hoàn thành</p>
          <p className="text-3xl font-black text-emerald-900 dark:text-white mt-2">{progressPercent.toFixed(1)}%</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-16 bg-white/80 dark:bg-zinc-800/80 rounded-3xl shadow-inner overflow-hidden border-2 border-white/40 mb-6">
        <div
          className={`absolute inset-0 h-full bg-gradient-to-r ${isAchieved ? "from-emerald-500 to-teal-500" : "from-amber-500 to-amber-600"} transition-all duration-1500 ease-out flex items-center justify-end pr-5`}
          style={{ width: `${Math.min(progressPercent, 100)}%` }}
        >
          {progressPercent > 15 && (
            <span className="text-lg font-black text-white drop-shadow-lg">
              {progressPercent.toFixed(1)}%
            </span>
          )}
        </div>
        {isAchieved && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Trophy className="h-10 w-10 text-white animate-pulse drop-shadow-2xl" />
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="flex items-center justify-center gap-2 text-base font-black text-zinc-600 dark:text-zinc-400">
        <TrendingUp className={`h-6 w-6 ${isAchieved ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-500"}`} />
        <span>
          Từ <strong className="text-amber-700 dark:text-amber-300">{goal.startScore}</strong> →{" "}
          <strong className="text-emerald-700 dark:text-emerald-300">{goal.targetScore}</strong> điểm
        </span>
      </div>

      {showDialog && <GoalDialog {...{ showDialog, setShowDialog, targetInput, setTargetInput, handleSetGoal, isUpdating, isEdit: true, currentTarget: goal.targetScore }} />}
    </div>
  );
}

// Dialog Component – Sang trọng hơn
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
        className="group relative w-full max-w-md rounded-3xl bg-white/90 dark:bg-zinc-800/90 backdrop-blur-xl p-7 shadow-3xl border-2 border-white/30 ring-2 ring-white/20 dark:ring-zinc-700/50 transition-all duration-500 hover:shadow-4xl hover:scale-[1.005]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient Overlay */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-amber-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative flex items-center gap-4 mb-7">
          <div className="relative transform-gpu transition-all duration-400 group-hover:scale-110 group-hover:-rotate-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-xl ring-3 ring-white/50 dark:ring-zinc-800/50">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/30 backdrop-blur-md">
                <Target className="h-7 w-7 text-white drop-shadow-md" />
              </div>
            </div>
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-400/40 to-orange-400/40 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>
          <h3 className="text-2xl font-black text-zinc-900 dark:text-white">
            {isEdit ? "Cập nhật mục tiêu" : "Đặt mục tiêu TOEIC"}
          </h3>
        </div>

        <p className="text-sm font-bold text-zinc-600 dark:text-zinc-400 mb-6">
          Nhập điểm TOEIC mục tiêu (10 - 990 điểm)
        </p>

        <div className="relative mb-7">
          <input
            type="number"
            min="10"
            max="990"
            value={targetInput}
            onChange={(e) => setTargetInput(e.target.value)}
            placeholder="Ví dụ: 750"
            className="w-full rounded-2xl border-2 border-white/40 bg-white/80 dark:bg-zinc-900/80 px-6 py-5 text-xl font-black text-zinc-900 dark:text-white placeholder-zinc-400 focus:ring-4 focus:ring-amber-500/30 focus:border-amber-500 outline-none transition-all"
          />
          {currentTarget && isEdit && (
            <div className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-black text-zinc-500">
              Hiện tại: {currentTarget}
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => {
              setShowDialog(false);
              setTargetInput("");
            }}
            disabled={isUpdating}
            className="flex-1 px-6 py-4 rounded-2xl border-2 border-white/40 bg-white/80 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 font-black transition-all hover:bg-white dark:hover:bg-zinc-700 hover:scale-[1.02] disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={handleSetGoal}
            disabled={isUpdating}
            className="group flex-1 px-6 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-black transition-all duration-300 hover:from-amber-500 hover:to-amber-500 hover:shadow-2xl hover:scale-[1.02] disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {isUpdating ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                Xác nhận
                <Target className="h-6 w-6 transition-transform group-hover:scale-110" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}