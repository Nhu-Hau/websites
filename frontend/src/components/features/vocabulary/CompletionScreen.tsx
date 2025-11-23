// frontend/src/components/features/vocabulary/CompletionScreen.tsx
"use client";

import { useEffect, useMemo } from "react";
import { Brain, BookOpen, RotateCcw, Trophy } from "lucide-react";
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
  const percentage =
    typeof score === "number"
      ? score
      : total > 0
      ? Math.round((remembered / total) * 100)
      : 0;

  useEffect(() => {
    if (percentage >= 75) {
      const duration = 1500;
      const animationEnd = Date.now() + duration;
      const colors = ["#0ea5e9", "#22c55e", "#f97316", "#facc15"];
      const frame = () => {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 70,
          origin: { x: 0 },
          colors,
        });
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 70,
          origin: { x: 1 },
          colors,
        });
        if (Date.now() < animationEnd) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [percentage]);

  const badge = useMemo(() => {
    if (percentage >= 90) return { label: "Legendary", tone: "text-emerald-600" };
    if (percentage >= 75) return { label: "Great job", tone: "text-sky-600" };
    if (percentage >= 60) return { label: "Keep going", tone: "text-amber-600" };
    return { label: "Practice more", tone: "text-zinc-500" };
  }, [percentage]);

  return (
    <div className="mx-auto w-full max-w-3xl rounded-[36px] border border-zinc-200/80 bg-white/95 p-8 shadow-xl dark:border-zinc-800/80 dark:bg-zinc-900/90">
      <div className="flex flex-col items-center text-center">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-zinc-200/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-zinc-400 dark:border-zinc-700">
          {mode === "learn" ? "Quiz" : "Flashcard"}
        </div>
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-emerald-50 text-amber-500 dark:from-amber-900/30 dark:to-emerald-900/30">
          <Trophy className="h-10 w-10" />
        </div>
        <h2 className="text-3xl font-semibold text-zinc-900 dark:text-white">
          {mode === "learn" ? "Bạn đã hoàn tất quiz!" : "Vòng flashcard hoàn thành!"}
        </h2>
        <p className={`mt-2 text-sm font-semibold ${badge.tone}`}>{badge.label}</p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="Tổng số" value={total} />
        <StatCard label={mode === "learn" ? "Câu đúng" : "Đã nhớ"} value={remembered} tone="emerald" />
        <StatCard label={mode === "learn" ? "Câu sai" : "Chưa nhớ"} value={notYet} tone="amber" />
      </div>

      <div className="mt-6 rounded-3xl border border-zinc-200/80 p-5 dark:border-zinc-800/70">
        <div className="flex items-center justify-between text-sm font-semibold text-zinc-600 dark:text-zinc-300">
          <span>Điểm</span>
          <span className="text-2xl text-zinc-900 dark:text-white">{percentage}%</span>
        </div>
        <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800/80">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-500 via-emerald-500 to-amber-400 transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {notYet > 0 && (
        <div className="mt-4 rounded-3xl border border-sky-100/80 bg-sky-50/60 px-4 py-3 text-sm text-sky-700 dark:border-sky-900/40 dark:bg-sky-950/20 dark:text-sky-200">
          🔁 Gợi ý: Có {notYet} từ/câu hỏi bạn chưa chắc chắn – ôn lại ngay để ghi nhớ sâu hơn.
        </div>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <button
          onClick={onRestart}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-zinc-800 dark:bg-white dark:text-zinc-900"
        >
          <RotateCcw className="h-4 w-4" />
          Luyện lại vòng này
        </button>
        {mode === "flashcard" ? (
          <>
            {notYet > 0 && (
              <button
                onClick={onReviewWeak}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-200/70 bg-white px-5 py-3 text-sm font-semibold text-amber-600 transition hover:-translate-y-0.5 hover:border-amber-300 dark:border-amber-900/40 dark:bg-amber-950/10 dark:text-amber-200"
              >
                <BookOpen className="h-4 w-4" />
                Ôn từ khó ({notYet})
              </button>
            )}
            <button
              onClick={onLearnMode}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-sky-200/70 bg-sky-50/80 px-5 py-3 text-sm font-semibold text-sky-600 transition hover:-translate-y-0.5 hover:border-sky-300 dark:border-sky-900/40 dark:bg-sky-950/20 dark:text-sky-200 sm:col-span-2"
            >
              <Brain className="h-4 w-4" />
              Chuyển sang quiz
            </button>
          </>
        ) : (
          <button
            onClick={onLearnMode}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-sky-200/70 bg-sky-50/80 px-5 py-3 text-sm font-semibold text-sky-600 transition hover:-translate-y-0.5 hover:border-sky-300 dark:border-sky-900/40 dark:bg-sky-950/20 dark:text-sky-200"
          >
            <Brain className="h-4 w-4" />
            Luyện lại flashcard
          </button>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "emerald" | "amber";
}) {
  const toneClasses =
    tone === "emerald"
      ? "border-emerald-200/80 bg-emerald-50/60 text-emerald-600 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300"
      : tone === "amber"
      ? "border-amber-200/80 bg-amber-50/60 text-amber-600 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300"
      : "border-zinc-200/80 bg-zinc-50/80 text-zinc-700 dark:border-zinc-800/70 dark:bg-zinc-900/70 dark:text-zinc-100";
  return (
    <div className={`rounded-3xl border px-4 py-4 text-center ${toneClasses}`}>
      <p className="text-3xl font-semibold">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-[0.4em]">{label}</p>
    </div>
  );
}
