// frontend/src/components/dashboard/GoalProgress.tsx
"use client";

import React, { useEffect, useState } from "react";
import { Target, TrendingUp } from "lucide-react";
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

export default function GoalProgress() {
  const [data, setData] = useState<GoalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [targetInput, setTargetInput] = useState("");

  const fetchGoal = () => {
    fetch("/api/dashboard/goal", {
      credentials: "include",
      cache: "no-store",
    })
      .then((res) => res.json())
      .then((json: GoalData) => {
        setData(json);
      })
      .catch((e) => {
        console.error("Failed to fetch goal data", e);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchGoal();
  }, []);

  // Lắng nghe sự kiện khi submit placement và progress test để cập nhật progress bar ngay lập tức
  useEffect(() => {
    const handleTestSubmitted = (event: Event) => {
      const customEvent = event as CustomEvent;
      const testType = customEvent.detail?.type;
      // Refresh cho placement và progress test vì chúng cập nhật điểm TOEIC
      if (testType === "placement" || testType === "progress") {
        // Refresh sau 1 giây để đợi backend cập nhật điểm
        setTimeout(() => {
          fetchGoal();
        }, 1000);
      }
    };

    window.addEventListener("test-submitted", handleTestSubmitted);
    return () => {
      window.removeEventListener("test-submitted", handleTestSubmitted);
    };
  }, []);

  const handleSetGoal = async () => {
    const target = parseInt(targetInput);
    if (isNaN(target) || target < 10 || target > 990) {
      toast.error("Điểm mục tiêu phải là số từ 10 đến 990");
      return;
    }

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

      toast.success("Đã đặt mục tiêu thành công!");
      setShowDialog(false);
      setTargetInput("");
      fetchGoal();
    } catch (e) {
      console.error(e);
      toast.error("Đặt mục tiêu thất bại");
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-700/80 p-6 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-xl shadow-lg ring-1 ring-black/5 dark:ring-white/10">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/30 dark:to-purple-800/20">
            <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
            Tiến độ đạt mục tiêu
          </h2>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-sm text-zinc-500 dark:text-zinc-400">
            Đang tải dữ liệu...
          </div>
        </div>
      </div>
    );
  }

  if (!data || !data.hasGoal || !data.goal) {
    return (
      <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-700/80 p-6 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-xl shadow-lg ring-1 ring-black/5 dark:ring-white/10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/30 dark:to-purple-800/20">
              <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
              Tiến độ đạt mục tiêu
            </h2>
          </div>
        </div>

        <div className="text-center py-8">
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
            Bạn chưa đặt mục tiêu TOEIC
          </p>
          <button
            onClick={() => setShowDialog(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-purple-500 text-white text-sm font-medium hover:from-purple-700 hover:to-purple-600 transition-all shadow-sm hover:shadow-md"
          >
            <Target className="w-4 h-4" />
            Đặt mục tiêu
          </button>
        </div>

        {/* Dialog */}
        {showDialog && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setShowDialog(false)}
          >
            <div
              className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-800 shadow-xl border border-zinc-200 dark:border-zinc-700 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">
                Đặt mục tiêu TOEIC
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                Nhập điểm TOEIC mục tiêu của bạn (10-990 điểm)
              </p>
              <input
                type="number"
                min="10"
                max="990"
                value={targetInput}
                onChange={(e) => setTargetInput(e.target.value)}
                placeholder="Ví dụ: 700"
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-4 py-2 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDialog(false);
                    setTargetInput("");
                  }}
                  className="flex-1 px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSetGoal}
                  className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:from-purple-700 hover:to-purple-600 transition"
                >
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const { goal, currentScore } = data;
  const progressPercent =
    currentScore !== null && goal
      ? Math.max(
          0,
          Math.min(
            100,
            ((currentScore - goal.startScore) /
              (goal.targetScore - goal.startScore)) *
              100
          )
        )
      : 0;

  return (
    <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-700/80 p-6 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-xl shadow-lg ring-1 ring-black/5 dark:ring-white/10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/30 dark:to-purple-800/20">
            <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
            Tiến độ đạt mục tiêu
          </h2>
        </div>
        <button
          onClick={() => {
            setTargetInput(goal.targetScore.toString());
            setShowDialog(true);
          }}
          className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
        >
          Cập nhật
        </button>
      </div>

      {/* Info */}
      <div className="mb-6 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">Mục tiêu:</span>
          <span className="font-semibold text-zinc-900 dark:text-white">
            {goal.targetScore} điểm
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">Hiện tại:</span>
          <span className="font-semibold text-zinc-900 dark:text-white">
            {currentScore !== null ? `${currentScore} điểm` : "—"}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">Hoàn thành:</span>
          <span className="font-semibold text-purple-600 dark:text-purple-400">
            {progressPercent.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="w-full h-4 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-500 ease-out flex items-center justify-end pr-2"
            style={{ width: `${progressPercent}%` }}
          >
            {progressPercent > 10 && (
              <span className="text-xs font-medium text-white">
                {progressPercent.toFixed(1)}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Summary text */}
      <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
        <TrendingUp className="w-4 h-4 text-purple-500" />
        <span>
          Mục tiêu: {goal.targetScore} điểm · Hiện tại:{" "}
          {currentScore !== null ? `${currentScore} điểm` : "—"} · Hoàn thành{" "}
          {progressPercent.toFixed(1)}%
        </span>
      </div>

      {/* Dialog */}
      {showDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setShowDialog(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-800 shadow-xl border border-zinc-200 dark:border-zinc-700 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">
              {data.hasGoal ? "Cập nhật mục tiêu TOEIC" : "Đặt mục tiêu TOEIC"}
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
              Nhập điểm TOEIC mục tiêu của bạn (10-990 điểm)
            </p>
            <input
              type="number"
              min="10"
              max="990"
              value={targetInput}
              onChange={(e) => setTargetInput(e.target.value)}
              placeholder="Ví dụ: 700"
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-4 py-2 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDialog(false);
                  setTargetInput("");
                }}
                className="flex-1 px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition"
              >
                Hủy
              </button>
              <button
                onClick={handleSetGoal}
                className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:from-purple-700 hover:to-purple-600 transition"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
