"use client";

export default function TestHeader({
  title,
  totalQuestions,
  durationMin,
  rightSlot,
}: {
  title: string;
  totalQuestions: number;
  durationMin: number;
  rightSlot?: React.ReactNode;
}) {
  // Header hiện đại với gradient nhẹ + stat badges
  return (
    <header className="relative isolate overflow-hidden rounded-3xl border border-gray-200 dark:border-zinc-700 bg-gradient-to-br from-sky-50 via-white to-slate-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-950 p-6 mb-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            {title}
          </h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-zinc-300">
            Bộ đề Listening &amp; Reading
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-gray-300 dark:border-zinc-600 bg-white/70 dark:bg-zinc-800 px-3 py-1 text-xs font-semibold text-gray-800 dark:text-zinc-100">
              {totalQuestions} câu
            </span>
            <span className="inline-flex items-center rounded-full border border-gray-300 dark:border-zinc-600 bg-white/70 dark:bg-zinc-800 px-3 py-1 text-xs font-semibold text-gray-800 dark:text-zinc-100">
              {durationMin} phút
            </span>
          </div>
        </div>

        {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
      </div>
      {/* decor */}
      <div className="pointer-events-none absolute -top-10 right-0 h-40 w-40 rounded-full bg-sky-400/10 blur-3xl" />
    </header>
  );
}
