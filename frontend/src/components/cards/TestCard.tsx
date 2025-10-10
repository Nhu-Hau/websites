// frontend/src/components/cards/TestCard.tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Timer, ListChecks, CheckCircle2, RotateCcw, BarChart3 } from "lucide-react";

export type AttemptSummary = {
  lastAt: string; // ISO
  correct: number;
  total: number;
  acc: number; // 0..1
  count: number;
};

type Props = {
  locale: string;
  partKey: string;
  level: 1 | 2 | 3;
  test: number;
  totalQuestions?: number;
  durationMin?: number;
  /** Thông tin “đã làm” lấy từ /api/practice/progress */
  attemptSummary?: AttemptSummary;
};

export default function TestCard({
  locale,
  partKey,
  level,
  test,
  totalQuestions = 10,
  durationMin = 10,
  attemptSummary,
}: Props) {
  const router = useRouter();

  const href = `/${encodeURIComponent(locale)}/practice/${encodeURIComponent(partKey)}/${level}/${test}`;
  const historyHref = `/${encodeURIComponent(locale)}/practice/history?partKey=${encodeURIComponent(
    partKey
  )}&level=${level}&test=${test}`;

  const ribbonBg = "bg-[#272343] dark:bg-zinc-700";

  const levelStyles: Record<
    1 | 2 | 3,
    { ring: string; bg: string; text: string; label: string; bars: number }
  > = {
    1: {
      ring: "ring-emerald-200/70 dark:ring-emerald-800/70",
      bg: "bg-emerald-100/80 dark:bg-emerald-900/70",
      text: "text-emerald-900 dark:text-emerald-300",
      label: "Level 1",
      bars: 1,
    },
    2: {
      ring: "ring-blue-200/70 dark:ring-blue-800/70",
      bg: "bg-blue-100/80 dark:bg-blue-900/70",
      text: "text-blue-900 dark:text-blue-300",
      label: "Level 2",
      bars: 2,
    },
    3: {
      ring: "ring-violet-200/70 dark:ring-violet-800/70",
      bg: "bg-violet-100/80 dark:bg-violet-900/70",
      text: "text-violet-900 dark:text-violet-300",
      label: "Level 3",
      bars: 3,
    },
  };

  const d = levelStyles[level];
  const done = !!attemptSummary;

  function goDoTest() {
    router.push(href);
  }

  return (
    <div
      role="button"
      onClick={goDoTest}
      className="group relative block overflow-hidden rounded-2xl border border-zinc-300/50 bg-white/60 p-6 shadow-lg backdrop-blur-md transition-all duration-500 hover:shadow-2xl dark:border-zinc-700/50 dark:bg-zinc-800/50"
    >
      {/* shimmer */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-zinc-100/20 via-transparent to-zinc-300/10 opacity-60 transition-opacity duration-500 group-hover:opacity-80 dark:from-zinc-800/20 dark:to-zinc-950/10" />

      {/* Ribbon ĐÃ LÀM */}
      {done && (
        <div className="absolute -right-9 top-5 z-20 rotate-45">
          <div className="flex items-center gap-1 rounded-md bg-emerald-600 px-8 py-1 text-xs font-bold text-white shadow-md">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>ĐÃ LÀM</span>
          </div>
        </div>
      )}

      {/* Tiêu đề + level */}
      <div className="relative z-10 flex flex-col gap-3">
        <h3 className={`text-base sm:text-lg font-bold text-white px-3 py-1.5 rounded-md shadow-sm tracking-tight w-fit ${ribbonBg}`}>
          Test {test}
        </h3>

        <div
          className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 shadow-sm ring-1 w-fit border-white/40 backdrop-blur-sm ${d.bg} ${d.text} ${d.ring}`}
          title={d.label}
        >
          <div className="flex items-end gap-0.5" aria-hidden>
            {[1, 2, 3].map((i) => (
              <span
                key={i}
                className={`h-3 w-1 rounded-sm bg-current/30 ${i <= d.bars ? "bg-current" : ""}`}
              />
            ))}
          </div>
          <span className="text-[11px] font-semibold tracking-wide uppercase">{d.label}</span>
        </div>
      </div>

      {/* Info hàng dưới */}
      <div className="relative z-10 mt-4 flex items-center gap-4 text-sm font-medium tracking-wide text-zinc-700 dark:text-zinc-300">
        <div className="flex items-center gap-1.5">
          <ListChecks className="h-4 w-4" aria-hidden />
          <span>{totalQuestions} câu</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Timer className="h-4 w-4" aria-hidden />
          <span>{durationMin} phút</span>
        </div>
        {done && typeof attemptSummary?.acc === "number" && (
          <div className="ml-auto text-xs text-zinc-600 dark:text-zinc-400">
            Lần gần nhất: <b>{Math.round((attemptSummary.acc ?? 0) * 100)}%</b>
          </div>
        )}
      </div>

      {/* Footer: 2 nút cùng một hàng */}
      <div className="relative z-10 mt-5 flex items-center justify-between">
        {/* Nút làm bài / làm lại */}
        <Link
          href={href}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-2 rounded-xl text-zinc-700 dark:text-zinc-300"
        >
          {done ? (
            <>
              <RotateCcw className="h-4 w-4" />
              Làm lại
            </>
          ) : (
            <>Làm bài ngay</>
          )}
        </Link>

        {/* Nút xem lịch sử (chỉ khi đã làm) */}
        {done ? (
          <Link
            href={historyHref}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-700"
          >
            <BarChart3 className="h-4 w-4" />
            Xem lịch sử
          </Link>
        ) : (
          <span className="text-xs text-zinc-400">Chưa có lịch sử</span>
        )}
      </div>
    </div>
  );
}