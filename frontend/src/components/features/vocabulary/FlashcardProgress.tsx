"use client";

interface FlashcardProgressProps {
  current: number;
  total: number;
  progress: number;
  remembered: number;
  notYet: number;
}

export function FlashcardProgress({
  current,
  total,
  progress,
  remembered,
  notYet,
}: FlashcardProgressProps) {
  const percent = Math.max(0, Math.min(100, Math.round(progress)));

  return (
    <div className="mx-auto mb-3 w-full rounded-2xl border border-white/80 bg-white/90 p-3 shadow-sm xs:mb-4 xs:rounded-3xl xs:p-4 max-w-2xl md:max-w-3xl dark:border-zinc-800/60 dark:bg-zinc-900/90">
      {/* Header: Tiến độ + % */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-slate-400 xs:text-[10px]">
            Tiến độ
          </p>
          <p className="text-sm font-semibold text-slate-900 xs:text-base sm:text-lg md:text-xl dark:text-white">
            {current} / {total}
          </p>
        </div>
        <span className="rounded-2xl border border-white/70 bg-white/80 px-2.5 py-1 text-[10px] font-semibold text-slate-600 xs:px-3 xs:py-1.5 xs:text-[11px] sm:text-xs dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-200">
          {percent}%
        </span>
      </div>

      {/* Thanh progress */}
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/80 xs:mt-2.5 xs:h-2 dark:bg-zinc-800/80">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#4063bb] via-sky-500 to-emerald-500 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Thống kê đã nhớ / cần ôn */}
      <div className="mt-2 grid gap-1.5 text-[11px] text-slate-600 xs:mt-2.5 xs:gap-2 xs:text-xs dark:text-zinc-300 sm:grid-cols-2">
        <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/60 px-2.5 py-1.5 font-semibold text-emerald-600 xs:px-3 xs:py-2 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300">
          {remembered} đã nhớ
        </div>
        <div className="rounded-2xl border border-amber-200/70 bg-amber-50/60 px-2.5 py-1.5 font-semibold text-amber-600 xs:px-3 xs:py-2 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
          {notYet} cần ôn
        </div>
      </div>
    </div>
  );
}