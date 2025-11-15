// frontend/src/components/features/vocabulary/CompletionScreen.tsx
"use client";

import { useEffect, useState } from "react";
import { Trophy, RotateCcw, BookOpen, Brain } from "lucide-react";
import confetti from "canvas-confetti";

interface CompletionScreenProps {
  remembered: number;
  notYet: number;
  total: number;
  onRestart: () => void;
  onReviewWeak: () => void;
  onLearnMode: () => void;
  mode?: "flashcard" | "learn";
  score?: number;
}

export function CompletionScreen({
  remembered,
  notYet,
  total,
  onRestart,
  onReviewWeak,
  onLearnMode,
  mode = "flashcard",
  score,
}: CompletionScreenProps) {
  const [showCelebration, setShowCelebration] = useState(false);
  const percentage = total > 0 ? Math.round((remembered / total) * 100) : 0;

  useEffect(() => {
    // Trigger confetti animation
    if (percentage >= 80) {
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ["#18181b", "#71717a", "#a1a1aa"],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ["#18181b", "#71717a", "#a1a1aa"],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };

      frame();
      setShowCelebration(true);
    }
  }, [percentage]);

  const getMessage = () => {
    if (percentage >= 90) return "Xuất sắc! 🎉";
    if (percentage >= 80) return "Tuyệt vời! 🌟";
    if (percentage >= 70) return "Tốt lắm! 👏";
    if (percentage >= 60) return "Cố gắng tốt! 💪";
    return "Tiếp tục luyện tập! 📚";
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-8 shadow-lg">
        {/* Trophy icon */}
        <div className="flex justify-center mb-6">
          <div
            className={`w-20 h-20 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center ${
              showCelebration ? "animate-bounce" : ""
            }`}
          >
            <Trophy className="w-10 h-10 text-yellow-600 dark:text-yellow-400" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-center text-zinc-900 dark:text-white mb-2">
          {mode === "learn" ? "Hoàn thành bài kiểm tra!" : "Hoàn thành vòng học!"}
        </h2>
        <p className="text-lg text-center text-zinc-600 dark:text-zinc-400 mb-8">
          {getMessage()}
        </p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="text-center p-4 rounded-lg bg-zinc-50 dark:bg-zinc-700/50">
            <p className="text-3xl font-bold text-zinc-900 dark:text-white">
              {total}
            </p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
              Tổng cộng
            </p>
          </div>
          <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              {remembered}
            </p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
              {mode === "learn" ? "Đúng" : "Đã nhớ"}
            </p>
          </div>
          <div className="text-center p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20">
            <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
              {notYet}
            </p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
              {mode === "learn" ? "Sai" : "Chưa nhớ"}
            </p>
          </div>
        </div>

        {/* Score percentage */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              Điểm
            </span>
            <span className="text-2xl font-bold text-zinc-900 dark:text-white">
              {percentage}%
            </span>
          </div>
          <div className="w-full h-3 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${
                percentage >= 80
                  ? "bg-green-500"
                  : percentage >= 60
                  ? "bg-blue-500"
                  : "bg-orange-500"
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Suggestions */}
        {notYet > 0 && (
          <div className="mb-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              💡 <strong>Mẹo:</strong> Ôn tập {notYet} từ bạn đánh dấu "Chưa nhớ" để củng cố trí nhớ!
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="space-y-3">
          <button
            onClick={onRestart}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold hover:shadow-md transition-all"
          >
            <RotateCcw className="w-5 h-5" />
            <span>Luyện tập lại</span>
          </button>

          {notYet > 0 && mode === "flashcard" && (
            <button
              onClick={onReviewWeak}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold transition-colors"
            >
              <BookOpen className="w-5 h-5" />
              <span>Ôn tập từ yếu ({notYet})</span>
            </button>
          )}

          {mode === "flashcard" && (
            <button
              onClick={onLearnMode}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold transition-colors"
            >
              <Brain className="w-5 h-5" />
              <span>Thử chế độ học</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
