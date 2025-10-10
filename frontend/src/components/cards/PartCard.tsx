"use client";

import Link from "next/link";
import { ShieldCheck, Lock, Timer, ListChecks } from "lucide-react";

type Props = {
  locale: string;            
  partKey: string;           
  level: 1 | 2 | 3 | 4;
  title: string;
  totalQuestions: number;
  durationMin: number;
  access?: "free" | "pro";
};

export default function PartCard({
  locale,
  partKey,
  level,
  title,
  totalQuestions,
  durationMin,
  access = "free",
}: Props) {
  const isPro = access === "pro";

  const accessBadgeClass =
    access === "free"
      ? "bg-gradient-to-r from-blue-100/80 to-sky-200/80 text-blue-900 border-blue-300/50 dark:from-sky-700/50 dark:to-sky-600/50 dark:text-sky-200 dark:border-sky-700/50"
      : "bg-gradient-to-r from-orange-200/80 to-red-200/80 text-red-900 border-red-300/50 dark:from-orange-900/50 dark:to-red-800/50 dark:text-red-300 dark:border-red-700/50";

  const levelStyles: Record<1|2|3|4, { ring:string; bg:string; text:string; label:string; bars:number }> = {
    1: { ring:"ring-emerald-200/70 dark:ring-emerald-800/70", bg:"bg-emerald-100/80 dark:bg-emerald-900/70", text:"text-emerald-900 dark:text-emerald-300", label:"Level 1", bars:1 },
    2: { ring:"ring-blue-200/70 dark:ring-blue-800/70", bg:"bg-blue-100/80 dark:bg-blue-900/70", text:"text-blue-900 dark:text-blue-300", label:"Level 2", bars:2 },
    3: { ring:"ring-violet-200/70 dark:ring-violet-800/70", bg:"bg-violet-100/80 dark:bg-violet-900/70", text:"text-violet-900 dark:text-violet-300", label:"Level 3", bars:3 },
    4: { ring:"ring-amber-200/70 dark:ring-amber-800/70", bg:"bg-amber-100/80 dark:bg-amber-900/70", text:"text-amber-900 dark:text-amber-300", label:"Level 4", bars:4 },
  };
  const d = levelStyles[level];

  const href = `/${encodeURIComponent(locale)}/practice/${encodeURIComponent(partKey)}/${level}`;
  const ribbonBg = "bg-[#272343] dark:bg-zinc-700";

  const card =
    <div className={`group relative block overflow-hidden rounded-2xl border border-zinc-300/50 bg-white/60 p-6 shadow-lg backdrop-blur-md transition-all duration-500 hover:shadow-2xl dark:border-zinc-700/50 dark:bg-zinc-800/50 ${isPro ? "cursor-not-allowed opacity-70 grayscale-[35%]" : ""}`}>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-zinc-100/20 via-transparent to-zinc-300/10 opacity-60 transition-opacity duration-500 group-hover:opacity-80 dark:from-zinc-800/20 dark:to-zinc-950/10" />

      <div className={`absolute right-4 top-4 z-20 flex items-center gap-2 rounded-xl border px-3 py-1.5 shadow-sm border-white/40 backdrop-blur-sm ${accessBadgeClass}`}>
        <span className="relative z-10 flex items-center gap-1 text-[11px] font-semibold">
          {access === "free" ? <ShieldCheck className="h-3.5 w-3.5" aria-hidden /> : <Lock className="h-3.5 w-3.5" aria-hidden />}
          {access.toUpperCase()}
        </span>
      </div>

      <div className="relative z-10 flex flex-col gap-3">
        <h3 className={`text-base sm:text-lg font-bold text-white px-3 py-1.5 rounded-md shadow-sm tracking-tight w-fit ${ribbonBg}`}>
          {title}
        </h3>

        <div className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 shadow-sm ring-1 w-fit border-white/40 backdrop-blur-sm ${d.bg} ${d.text} ${d.ring}`} title={d.label}>
          <div className="flex items-end gap-0.5" aria-hidden>
            {[1,2,3,4].map((i) => (
              <span key={i} className={`h-3 w-1 rounded-sm bg-current/30 ${i <= d.bars ? "bg-current" : ""}`} />
            ))}
          </div>
          <span className="text-[11px] font-semibold tracking-wide uppercase">{d.label}</span>
        </div>
      </div>

      <div className="relative z-10 mt-4 flex items-center gap-4 text-sm font-medium tracking-wide text-zinc-700 dark:text-zinc-300">
        <div className="flex items-center gap-1.5">
          <ListChecks className="h-4 w-4" aria-hidden />
          <span>{totalQuestions} câu</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Timer className="h-4 w-4" aria-hidden />
          <span>{durationMin} phút</span>
        </div>
      </div>

      <div className="relative z-10 mt-5 flex items-center gap-2 text-sm font-semibold text-zinc-700 transition-colors duration-300 group-hover:text-zinc-900 dark:text-zinc-300 dark:group-hover:text-white">
        <span>Luyện ngay</span>
        <span aria-hidden className="text-zinc-400 group-hover:text-zinc-600 dark:text-zinc-500 dark:group-hover:text-zinc-400">→</span>
      </div>
    </div>;

  // Dùng Link khi là free; pro thì chỉ render div (disabled)
  return isPro ? card : (
    <Link href={href} className="block">
      {card}
    </Link>
  );
}