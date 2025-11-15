"use client";

import React, { useEffect, useState } from "react";
import { Target, TrendingUp, Trophy, Loader2, X } from "lucide-react";
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
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-900/20">
              <Target className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
                Tiến độ đạt mục tiêu
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Chưa có mục tiêu nào được thiết lập
              </p>
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
            <Target className="h-8 w-8 text-zinc-400 dark:text-zinc-500" />
          </div>
          <p className="text-sm font-medium text-zinc-900 dark:text-white mb-1">
            Bạn chưa đặt mục tiêu TOEIC
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">
            Đặt mục tiêu để theo dõi tiến trình học tập
          </p>
          <button
            onClick={() => setShowDialog(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 transition-colors shadow-sm"
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

  const { goal, currentScore } = data;
  const progressPercent =
    currentScore !== null && goal
      ? Math.max(0, Math.min(100, ((currentScore - goal.startScore) / (goal.targetScore - goal.startScore)) * 100))
      : 0;
  const isAchieved = progressPercent >= 100;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
            isAchieved 
              ? "bg-emerald-50 dark:bg-emerald-900/20" 
              : "bg-amber-50 dark:bg-amber-900/20"
          }`}>
            {isAchieved ? (
              <Trophy className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Target className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            )}
          </div>
          <div>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
              Tiến độ đạt mục tiêu
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {isAchieved ? "Chúc mừng! Bạn đã đạt mục tiêu!" : "Tiếp tục cố gắng nhé!"}
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setTargetInput(goal.targetScore.toString());
            setShowDialog(true);
          }}
          className="text-xs font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
        >
          Cập nhật
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-center">
          <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
            Mục tiêu
          </p>
          <p className="text-2xl font-semibold text-zinc-900 dark:text-white">
            {goal.targetScore}
          </p>
        </div>
        <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-center">
          <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
            Hiện tại
          </p>
          <p className="text-2xl font-semibold text-zinc-900 dark:text-white">
            {currentScore ?? "—"}
          </p>
        </div>
        <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-center">
          <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
            Hoàn thành
          </p>
          <p className="text-2xl font-semibold text-zinc-900 dark:text-white">
            {progressPercent.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-10 bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-hidden mb-4">
        <div
          className={`absolute inset-0 h-full transition-all duration-700 ease-out flex items-center ${
            isAchieved ? "bg-emerald-600" : "bg-amber-600"
          }`}
          style={{ width: `${Math.min(progressPercent, 100)}%` }}
        >
          {progressPercent > 15 && (
            <span className="text-xs font-medium text-white ml-3">
              {progressPercent.toFixed(1)}%
            </span>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="flex items-center justify-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
        <TrendingUp className={`h-4 w-4 ${
          isAchieved 
            ? "text-emerald-600 dark:text-emerald-400" 
            : "text-amber-600 dark:text-amber-400"
        }`} />
        <span>
          Từ <span className="font-medium">{goal.startScore}</span> →{" "}
          <span className="font-medium">{goal.targetScore}</span> điểm
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
  if (!showDialog) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={() => setShowDialog(false)}
    >
      <div
        className="w-full max-w-md rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
            {isEdit ? "Cập nhật mục tiêu" : "Đặt mục tiêu TOEIC"}
          </h3>
          <button
            onClick={() => {
              setShowDialog(false);
              setTargetInput("");
            }}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
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
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors"
          />
          {currentTarget && isEdit && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">
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
            className="flex-1 px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={handleSetGoal}
            disabled={isUpdating}
            className="flex-1 px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
  );
}