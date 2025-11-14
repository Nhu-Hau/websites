/* eslint-disable react-hooks/rules-of-hooks */
"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Star } from "lucide-react";

/* =========================
   Constants & Types
   ========================= */
const LEVELS = [1, 2, 3] as const;
type L = (typeof LEVELS)[number];

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/* ============ Refined EdTech Palette ============ */
const levelConfig: Record<
  L,
  {
    label: string;
    gradient: string;
    bars: number;
    desc: string;
    textColor: string;
    badgeTint: string;
    primary: string;
    glow: string;
  }
> = {
  1: {
    label: "Level 1",
    gradient: "from-[#347433] to-[#3d8a3d]",
    bars: 1,
    desc: "Beginner",
    textColor: "text-[#347433] dark:text-[#347433]/90",
    badgeTint: "bg-[#347433]/10 dark:bg-[#347433]/15",
    primary: "text-white",
    glow: "shadow-[0_0_20px_rgba(52,116,51,0.5)]",
  },
  2: {
    label: "Level 2",
    gradient: "from-[#27548A] to-[#2d62a0]",
    bars: 2,
    desc: "Intermediate",
    textColor: "text-[#27548A] dark:text-[#27548A]/90",
    badgeTint: "bg-[#27548A]/10 dark:bg-[#27548A]/15",
    primary: "text-white",
    glow: "shadow-[0_0_20px_rgba(39,84,138,0.5)]",
  },
  3: {
    label: "Level 3",
    gradient: "from-[#BB3E00] to-[#d14800]",
    bars: 3,
    desc: "Advanced",
    textColor: "text-[#BB3E00] dark:text-[#BB3E00]/90",
    badgeTint: "bg-[#BB3E00]/10 dark:bg-[#BB3E00]/15",
    primary: "text-white",
    glow: "shadow-[0_0_20px_rgba(187,62,0,0.5)]",
  },
};

/* =========================
   Skeleton
   ========================= */
function LevelSwitcherSkeleton() {
  return (
    <div className="flex flex-col items-center sm:items-end gap-2">
      <div className="relative inline-flex items-center gap-2 rounded-3xl p-2.5 border border-white/30 dark:border-zinc-700/50 bg-white/70 dark:bg-zinc-800/70 backdrop-blur-xl shadow-xl">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-12 w-32 rounded-2xl overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-600" />
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/50 dark:via-white/20 to-transparent" />
          </div>
        ))}
      </div>
      <div className="h-6 w-64 rounded-full bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-600 overflow-hidden relative">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/50 dark:via-white/20 to-transparent" />
      </div>
      <style jsx>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}

export default function LevelSwitcher({
  level,
  suggestedLevel,
  partLoading = false,
  disabled = false,
  tooltip,
}: {
  level: L;
  suggestedLevel?: L | null;
  partLoading?: boolean;
  disabled?: boolean;
  tooltip?: string;
}) {
  if (partLoading) return <LevelSwitcherSkeleton />;

  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] =
    React.useState<React.CSSProperties>({});
  const [mounted, setMounted] = React.useState(false);

  const suggestedFromQueryRaw =
    search.get("suggestedLevel") ?? search.get("suggested");
  const suggestedFromQuery = suggestedFromQueryRaw
    ? Number(suggestedFromQueryRaw)
    : NaN;
  const resolvedSuggested = React.useMemo<L | null>(() => {
    const q = LEVELS.find((v) => v === suggestedFromQuery);
    if (q) return q;
    return suggestedLevel ?? null;
  }, [suggestedFromQuery, suggestedLevel]);

  const setLevel = useCallback(
    (next: L) => {
      if (disabled) return;
      const params = new URLSearchParams(search.toString());
      params.set("level", String(next));
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, search, disabled]
  );

  const updateIndicator = useCallback(() => {
    const activeBtn = containerRef.current?.querySelector(
      `[data-level="${level}"]`
    ) as HTMLElement | null;
    if (activeBtn) {
      setIndicatorStyle({
        left: `${activeBtn.offsetLeft}px`,
        width: `${activeBtn.offsetWidth}px`,
      });
    }
  }, [level]);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    updateIndicator();
    const timer = setTimeout(updateIndicator, 50);
    return () => clearTimeout(timer);
  }, [updateIndicator, resolvedSuggested]);
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(updateIndicator);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [updateIndicator]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || disabled) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        const idx = LEVELS.indexOf(level);
        const nextIdx =
          e.key === "ArrowRight"
            ? Math.min(LEVELS.length - 1, idx + 1)
            : Math.max(0, idx - 1);
        if (nextIdx !== idx) setLevel(LEVELS[nextIdx]);
      }
    };
    el.addEventListener("keydown", handler);
    return () => el.removeEventListener("keydown", handler);
  }, [level, setLevel, disabled]);

  const cfg = levelConfig[level];

  return (
    <div className="flex flex-col gap-2" title={disabled ? tooltip : undefined}>
      {/* Switcher - Glass + 3D */}
      <div
        ref={containerRef}
        className={cn(
          "group/switcher relative inline-flex items-center gap-2.5 rounded-2xl px-4 py-2 min-h-[3.2rem]",
          "bg-white/80 dark:bg-zinc-800/80 backdrop-blur-xl",
          "border border-white/30 dark:border-zinc-700/50",
          "shadow-2xl ring-2 ring-white/20 dark:ring-white/10",
          "transition-all duration-500",
          disabled
            ? "opacity-60 cursor-not-allowed"
            : "hover:shadow-3xl hover:ring-white/40 dark:hover:ring-white/20"
        )}
      >
        {/* Glow Background */}
        <div
          className={cn(
            "absolute -inset-1 rounded-3xl opacity-0 group-hover/switcher:opacity-100 transition-opacity duration-700",
            cfg.glow
          )}
        />

        {/* Gradient Indicator 3D */}
        <div
          className={cn(
            "absolute inset-y-2.5 rounded-2xl shadow-2xl",
            "bg-gradient-to-r",
            cfg.gradient,
            mounted ? "transition-all duration-500 ease-out" : "transition-none"
          )}
          style={{
            ...indicatorStyle,
            transition:
              "left 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), width 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)",
          }}
        >
          <div className="absolute inset-0 rounded-2xl bg-white/20 blur-md" />
        </div>

        {/* Buttons */}
        {LEVELS.map((lv) => {
          const c = levelConfig[lv];
          const active = level === lv;
          const isSuggested = resolvedSuggested === lv;

          return (
            <button
              key={lv}
              data-level={lv}
              role="tab"
              aria-selected={active}
              aria-label={c.label}
              onClick={() => setLevel(lv)}
              disabled={disabled}
              className={cn(
                // 🔧 chỉnh padding cho nút level để tương đương nút "Lịch sử"
                "group/btn relative z-20 flex items-center gap-2.5 rounded-2xl px-4 py-2.5 text-sm font-black outline-none transition-all duration-300",
                "focus-visible:ring-4 focus-visible:ring-white/50",
                active
                  ? c.primary + " drop-shadow-lg"
                  : "text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100"
              )}
            >
              {/* Bars 3D */}
              <span className="flex items-end gap-1" aria-hidden="true">
                {[1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={cn(
                      "w-1.5 rounded-full transition-all duration-500",
                      i === 1 ? "h-2.5" : i === 2 ? "h-4" : "h-5.5",
                      active
                        ? i <= c.bars
                          ? "bg-white/95 shadow-lg"
                          : "bg-white/40"
                        : i <= c.bars
                        ? "bg-zinc-500/80 shadow-md"
                        : "bg-zinc-300/60 dark:bg-zinc-600/60"
                    )}
                  />
                ))}
              </span>

              <span className="tracking-tighter">{c.label}</span>

              {/* Suggested VIP */}
              {isSuggested && !active && (
                <Star className="h-4 w-4 text-amber-500 animate-pulse" />
              )}
              {isSuggested && active && (
                <Star className="h-4 w-4 text-white animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      {/* Hint Badge - Mini Glass */}
      {resolvedSuggested && (
        <div className="w-full flex justify-end">
          <div className="group/hint relative inline-flex items-center gap-1.5 rounded-full bg-white/80 dark:bg-zinc-800/80 backdrop-blur-xl px-2.5 py-1 border border-white/30 dark:border-zinc-700/50 shadow-md transition-all duration-300 hover:shadow-lg hover:scale-[1.03]">
            {/* Glow */}
            <div className="absolute -inset-[3px] rounded-full bg-gradient-to-br from-emerald-400/30 to-emerald-600/30 blur-lg opacity-0 group-hover/hint:opacity-100 transition-opacity duration-500" />

            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-md ring-2 ring-white/40">
              <CheckCircle2 className="h-3 w-3 text-white" />
            </div>

            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-800 dark:text-zinc-200">
              Gợi ý:{" "}
              <span
                className={cn(
                  "font-black",
                  levelConfig[resolvedSuggested].textColor
                )}
              >
                {levelConfig[resolvedSuggested].label}
              </span>{" "}
              – {levelConfig[resolvedSuggested].desc}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
