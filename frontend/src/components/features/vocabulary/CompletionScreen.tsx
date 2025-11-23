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
    <div className="mx-auto w-full max-w-2xl rounded-3xl border border-white/80 bg-white/90 p-4 shadow-lg shadow-slate-900/5 backdrop-blur-xl xs:p-5 dark:border-zinc-800/60 dark:bg-zinc-900/90">
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#4063bb]/10 to-sky-500/10 text-[#4063bb] dark:from-[#4063bb]/20 dark:to-sky-500/20 dark:text-sky-200 xs:mb-5 xs:h-16 xs:w-16">
          <Trophy className="h-7 w-7 xs:h-8 xs:w-8" />
        </div>
        <h2 className="text-xl font-semibold text-zinc-900 xs:text-2xl dark:text-white">
          {mode === "learn" ? "Bạn đã hoàn tất quiz!" : "Vòng flashcard hoàn thành!"}
        </h2>
        <p className={`mt-1.5 text-xs font-semibold xs:text-sm ${badge.tone}`}>{badge.label}</p>
      </div>

      <div className="mt-5 grid gap-2.5 xs:gap-3 sm:grid-cols-3">
        <StatCard label="Tổng số" value={total} />
        <StatCard label={mode === "learn" ? "Câu đúng" : "Đã nhớ"} value={remembered} tone="emerald" />
        <StatCard label={mode === "learn" ? "Câu sai" : "Chưa nhớ"} value={notYet} tone="amber" />
      </div>

      <div className="mt-4 rounded-2xl border border-white/80 bg-white/80 p-3 dark:border-zinc-800/70 dark:bg-zinc-900/70 xs:mt-5 xs:rounded-3xl xs:p-4">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-zinc-300 xs:text-sm">
          <span>Điểm</span>
          <span className="text-xl text-slate-900 dark:text-white xs:text-2xl">{percentage}%</span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-zinc-800/80 xs:mt-3 xs:h-2">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#4063bb] via-sky-500 to-emerald-500 transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {notYet > 0 && (
        <div className="mt-3 rounded-xl border border-sky-100/80 bg-sky-50/60 px-3 py-2 text-xs text-sky-700 dark:border-sky-900/40 dark:bg-sky-950/20 dark:text-sky-200 xs:mt-4 xs:rounded-2xl xs:px-4 xs:py-2.5 xs:text-sm">
          Gợi ý: Có {notYet} từ/câu hỏi bạn chưa chắc chắn – ôn lại ngay để ghi nhớ sâu hơn.
        </div>
      )}

      <div className="mt-4 grid gap-2 xs:gap-2.5 sm:grid-cols-2">
        <button
          onClick={onRestart}
          className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-[#4063bb] to-[#2d4c9b] px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-[#2d4c9b33] transition hover:brightness-110 xs:px-4 xs:py-2.5 xs:text-sm"
        >
          <RotateCcw className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
          Luyện lại vòng này
        </button>
        {mode === "flashcard" ? (
          <>
            {notYet > 0 && (
              <button
                onClick={onReviewWeak}
                className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-amber-200/70 bg-white/80 px-3 py-2 text-xs font-semibold text-amber-600 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 dark:border-amber-900/40 dark:bg-zinc-900/80 dark:text-amber-200 xs:px-4 xs:py-2.5 xs:text-sm"
              >
                <BookOpen className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
                Ôn từ khó ({notYet})
              </button>
            )}
            <button
              onClick={onLearnMode}
              className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-white/70 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:text-[#4063bb] dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-100 xs:px-4 xs:py-2.5 xs:text-sm sm:col-span-2"
            >
              <Brain className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
              Chuyển sang quiz
            </button>
          </>
        ) : (
          <button
            onClick={onLearnMode}
            className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-white/70 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:text-[#4063bb] dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-100 xs:px-4 xs:py-2.5 xs:text-sm"
          >
            <Brain className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
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
      : "border-slate-200/80 bg-white/80 text-slate-700 dark:border-zinc-800/70 dark:bg-zinc-900/70 dark:text-zinc-100";
  return (
    <div className={`rounded-2xl border px-2.5 py-2.5 text-center xs:rounded-3xl xs:px-3 xs:py-3 ${toneClasses}`}>
      <p className="text-xl font-semibold xs:text-2xl">{value}</p>
      <p className="mt-0.5 text-[9px] uppercase tracking-[0.3em] xs:mt-1 xs:text-[10px]">{label}</p>
    </div>
  );
}
