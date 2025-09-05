"use client";

import { ShieldCheck, Lock, Timer, ListChecks } from "lucide-react";

type Props = {
  title: string;
  access: "free" | "pro";
  totalQuestions: number;
  durationMin: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  href: string;
  cta: string;
};

export default function TestCard({
  title,
  access,
  totalQuestions,
  durationMin,
  difficulty,
  href,
  cta,
}: Props) {
  const isPro = access === "pro";

  const accessBadgeClass =
    access === "free"
      ? "bg-gradient-to-r from-blue-100/80 to-sky-200/80 text-blue-900 border-blue-300/50 dark:from-sky-700/50 dark:to-sky-600/50 dark:text-sky-200 dark:border-sky-700/50"
      : "bg-gradient-to-r from-orange-200/80 to-red-200/80 text-red-900 border-red-300/50 dark:from-orange-900/50 dark:to-red-800/50 dark:text-red-300 dark:border-red-700/50";

  const diffStyles: Record<
    Props["difficulty"],
    { ring: string; bg: string; text: string; level: 1 | 2 | 3; label: string }
  > = {
    beginner: {
      ring: "ring-green-200/70 dark:ring-green-800/70",
      bg: "bg-green-100/80 dark:bg-green-900/70",
      text: "text-green-900 dark:text-green-300",
      level: 1,
      label: "Beginner",
    },
    intermediate: {
      ring: "ring-yellow-200/70 dark:ring-yellow-800/70",
      bg: "bg-yellow-100/80 dark:bg-yellow-900/70",
      text: "text-yellow-900 dark:text-yellow-300",
      level: 2,
      label: "Intermediate",
    },
    advanced: {
      ring: "ring-purple-200/70 dark:ring-purple-800/70",
      bg: "bg-purple-100/80 dark:bg-purple-900/70",
      text: "text-purple-900 dark:text-purple-300",
      level: 3,
      label: "Advanced",
    },
  };

  const d = diffStyles[difficulty];

  const ribbonBg = "bg-[#272343] dark:bg-zinc-700";

  return (
    <a
      href={isPro ? "#" : href}
      aria-disabled={isPro}
      onClick={(e) => {
        if (isPro) e.preventDefault();
      }}
      className={`group relative block overflow-hidden rounded-2xl border border-zinc-300/50 bg-white/60 p-6 shadow-lg backdrop-blur-md transition-all duration-500 hover:shadow-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/60 dark:border-zinc-700/50 dark:bg-zinc-800/50 dark:focus-visible:ring-zinc-500/60 ${
        isPro ? "cursor-not-allowed opacity-70 grayscale-[35%]" : ""
      }`}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-zinc-100/20 via-transparent to-zinc-300/10 opacity-60 transition-opacity duration-500 group-hover:opacity-80 dark:from-zinc-800/20 dark:to-zinc-950/10" />

      {isPro && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 mix-blend-multiply group-hover:opacity-100 dark:mix-blend-screen"
          style={{
            background:
              "repeating-linear-gradient(45deg, rgba(59,130,246,0.18) 0 10px, rgba(59,130,246,0.28) 10px 20px)",
          }}
        />
      )}

      <div
        className={`absolute right-4 top-4 z-20 flex items-center gap-2 rounded-xl border px-3 py-1.5 shadow-sm border-white/40 backdrop-blur-sm ${accessBadgeClass}`}
      >
        <span className="relative z-10 flex items-center gap-1 text-[11px] font-semibold">
          {access === "free" ? (
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <Lock className="h-3.5 w-3.5" aria-hidden />
          )}
          {access.toUpperCase()}
        </span>
      </div>

      <div className="relative z-10 flex flex-col gap-3">
        <h3
          className={`text-base sm:text-lg font-bold text-white px-3 py-1.5 rounded-md shadow-sm tracking-tight w-fit ${ribbonBg}`}
        >
          {title}
        </h3>

        <div
          className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 shadow-sm ring-1 w-fit border-white/40 backdrop-blur-sm ${d.bg} ${d.text} ${d.ring}`}
          aria-label={`Độ khó: ${d.label}`}
          title={`Độ khó: ${d.label}`}
        >
          <div className="flex items-end gap-0.5" aria-hidden>
            {[1, 2, 3].map((i) => (
              <span
                key={i}
                className={`h-3 w-1 rounded-sm bg-current/30 ${
                  i <= d.level ? "bg-current" : ""
                }`}
              />
            ))}
          </div>
          <span className="text-[11px] font-semibold tracking-wide uppercase">
            {d.label}
          </span>
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
        <span>{cta}</span>
        <span aria-hidden className="text-zinc-400 group-hover:text-zinc-600 dark:text-zinc-500 dark:group-hover:text-zinc-400">
          →
        </span>
      </div>
    </a>
  );
}