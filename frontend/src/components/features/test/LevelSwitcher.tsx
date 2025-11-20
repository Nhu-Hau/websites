/* eslint-disable react-hooks/rules-of-hooks */
"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Star } from "lucide-react";
import { motion } from "framer-motion";

/* =========================
   Constants & Types
   ========================= */
const LEVELS = [1, 2, 3] as const;
type L = (typeof LEVELS)[number];

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/* ============ Refined EdTech Palette (giữ nguyên màu) ============ */
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
  },
  2: {
    label: "Level 2",
    gradient: "from-[#27548A] to-[#2d62a0]",
    bars: 2,
    desc: "Intermediate",
    textColor: "text-[#27548A] dark:text-[#27548A]/90",
    badgeTint: "bg-[#27548A]/10 dark:bg-[#27548A]/15",
    primary: "text-white",
  },
  3: {
    label: "Level 3",
    gradient: "from-[#BB3E00] to-[#d14800]",
    bars: 3,
    desc: "Advanced",
    textColor: "text-[#BB3E00] dark:text-[#BB3E00]/90",
    badgeTint: "bg-[#BB3E00]/10 dark:bg-[#BB3E00]/15",
    primary: "text-white",
  },
};

/* =========================
   Skeleton (đơn giản hơn)
   ========================= */
function LevelSwitcherSkeleton() {
  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-end">
      <div className="inline-flex w-full sm:w-auto items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 shadow-sm animate-pulse">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-8 w-full sm:w-24 rounded-lg bg-zinc-100 dark:bg-zinc-800"
          />
        ))}
      </div>
      <div className="h-4 w-52 sm:w-64 rounded-full bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
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
    const timer = setTimeout(updateIndicator, 40);
    return () => clearTimeout(timer);
  }, [updateIndicator, resolvedSuggested]);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(updateIndicator);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [updateIndicator]);

  // arrow left / right
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
    <motion.div
      className="flex flex-col gap-2"
      title={disabled ? tooltip : undefined}
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        type: "spring",
        stiffness: 130,
        damping: 17,
        mass: 0.7,
      }}
    >
      {/* Switcher – thu nhỏ, ít hiệu ứng */}
      <motion.div
        ref={containerRef}
        tabIndex={disabled ? -1 : 0}
        className={cn(
          "relative inline-flex w-full sm:w-auto items-stretch gap-1.5",
          "rounded-xl px-2 py-1.5",
          "bg-white/90 dark:bg-zinc-900/90",
          "border border-zinc-200 dark:border-zinc-700",
          "shadow-sm",
          disabled
            ? "opacity-60 cursor-not-allowed"
            : "cursor-pointer hover:shadow-md"
        )}
        whileHover={disabled ? undefined : { scale: 1.01 }}
        transition={{ 
          type: "spring",
          stiffness: 200,
          damping: 15,
        }}
      >
        {/* Gradient Indicator (giữ nhưng nhẹ) */}
        <motion.div
          className={cn(
            "pointer-events-none absolute inset-y-1 rounded-lg bg-gradient-to-r",
            cfg.gradient
          )}
          style={indicatorStyle}
          transition={{ 
            type: "spring",
            stiffness: 180,
            damping: 20,
            mass: 0.8,
          }}
        />

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
                "relative z-10 flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5",
                "text-[11px] sm:text-xs font-semibold",
                "transition-colors",
                active
                  ? c.primary
                  : "text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100",
                isSuggested &&
                  !active &&
                  "border border-amber-300/80 dark:border-amber-500/80"
              )}
            >
              {/* Bars – thu nhỏ */}
              <span
                className="hidden xs:flex items-end gap-[3px]"
                aria-hidden="true"
              >
                {[1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={cn(
                      "w-1 rounded-full transition-all duration-300",
                      i === 1 ? "h-2" : i === 2 ? "h-3" : "h-4",
                      active
                        ? i <= c.bars
                          ? "bg-white/95"
                          : "bg-white/40"
                        : i <= c.bars
                        ? "bg-zinc-500/80"
                        : "bg-zinc-300/60 dark:bg-zinc-600/60"
                    )}
                  />
                ))}
              </span>

              <span className="truncate">{c.label}</span>

              {/* Icon suggested trên tab */}
              {isSuggested && (
                <Star
                  className={cn(
                    "h-3 w-3",
                    active ? "text-white" : "text-amber-500"
                  )}
                />
              )}
            </button>
          );
        })}
      </motion.div>
    </motion.div>
  );
}