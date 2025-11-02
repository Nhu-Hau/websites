/* eslint-disable react-hooks/rules-of-hooks */
"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Sparkles, CheckCircle2 } from "lucide-react";

/* =========================
   Constants & Types
   ========================= */
const LEVELS = [1, 2, 3] as const;
type L = (typeof LEVELS)[number];

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const levelConfig: Record<
  L,
  {
    label: string;
    gradient: string; // gradient cho indicator
    bars: number; // số cột "độ cao"
    desc: string; // mô tả ngắn
    textColor: string; // dùng cho hint/badge
    badgeTint: string; // nền + border cho hint/badge
  }
> = {
  1: {
    label: "Level 1",
    gradient: "from-amber-500 to-amber-600",
    bars: 1,
    desc: "Beginner",
    textColor: "text-yellow-700 dark:text-amber-300",
    badgeTint:
      "bg-amber-50 dark:bg-amber-950/30 border-amber-200/70 dark:border-amber-800/40",
  },
  2: {
    label: "Level 2",
    gradient: "from-sky-500 to-sky-600",
    bars: 2,
    desc: "Intermediate",
    textColor: "text-sky-700 dark:text-sky-300",
    badgeTint:
      "bg-sky-50 dark:bg-sky-950/30 border-sky-200/70 dark:border-sky-800/40",
  },
  3: {
    label: "Level 3",
    gradient: "from-violet-500 to-violet-600",
    bars: 3,
    desc: "Advanced",
    textColor: "text-violet-700 dark:text-violet-300",
    badgeTint:
      "bg-violet-50 dark:bg-violet-950/30 border-violet-200/70 dark:border-violet-800/40",
  },
};

/* =========================
   Skeleton
   ========================= */
function LevelSwitcherSkeleton() {
  return (
    <div className="flex flex-col items-center sm:items-end gap-2">
      <div className="relative inline-flex items-center gap-2 rounded-2xl p-2 border border-zinc-200/70 dark:border-zinc-700/70 bg-white/80 dark:bg-zinc-800/70 backdrop-blur-md shadow-sm">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-11 w-32 rounded-xl overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-zinc-200 dark:bg-zinc-700" />
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.2s_infinite] bg-gradient-to-r from-transparent via-white/50 dark:via-white/10 to-transparent" />
          </div>
        ))}
      </div>
      <div className="h-5 w-52 rounded bg-zinc-200 dark:bg-zinc-700 overflow-hidden relative">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.2s_infinite] bg-gradient-to-r from-transparent via-white/50 dark:via-white/10 to-transparent" />
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

/* =========================
   Component
   ========================= */
export default function LevelSwitcher({
  level,
  suggestedLevel,
  partLoading = false, // chỉ true khi đổi part: hiển thị skeleton
}: {
  level: L;
  suggestedLevel?: L | null;
  partLoading?: boolean;
}) {
  if (partLoading) return <LevelSwitcherSkeleton />;

  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] =
    React.useState<React.CSSProperties>({});
  const [mounted, setMounted] = React.useState(false);

  // Lấy gợi ý từ query (fallback khi chưa pass prop)
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
      const params = new URLSearchParams(search.toString());
      params.set("level", String(next));
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, search]
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

  // mount + cập nhật lần đầu (tránh FOUC)
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    updateIndicator();
    const timer = setTimeout(updateIndicator, 50);
    return () => clearTimeout(timer);
  }, [updateIndicator, resolvedSuggested]);

  // lắng nghe resize để indicator không lệch
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(updateIndicator);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [updateIndicator]);

  // Keyboard support (ArrowLeft/Right)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        const idx = LEVELS.indexOf(level);
        let nextIdx = idx;
        nextIdx =
          e.key === "ArrowRight"
            ? Math.min(LEVELS.length - 1, idx + 1)
            : Math.max(0, idx - 1);
        if (nextIdx !== idx) setLevel(LEVELS[nextIdx]);
      }
    };
    el.addEventListener("keydown", handler);
    return () => el.removeEventListener("keydown", handler);
  }, [level, setLevel]);

  const cfg = levelConfig[level];

  return (
    <div className="flex flex-col gap-1.5">
      {/* Switcher container */}
      <div
        ref={containerRef}
        className={cn(
          "relative inline-flex items-center gap-1.5 rounded-xl p-1.5",
          "border border-zinc-200/70 dark:border-zinc-700/70",
          "bg-white/80 dark:bg-zinc-800/70 backdrop-blur-md",
          "shadow-sm ring-1 ring-black/5 dark:ring-white/10",
          "transition-colors duration-200"
        )}
        role="tablist"
        aria-label="Chọn level luyện tập"
        tabIndex={0}
      >
        {/* Gradient Indicator */}
        <div
          className={cn(
            "absolute inset-y-1 rounded-lg shadow-md",
            "bg-gradient-to-r",
            cfg.gradient,
            mounted ? "transition-all duration-300 ease-out" : "transition-none"
          )}
          style={{
            ...indicatorStyle,
            transition:
              "left var(--dur, .32s) cubic-bezier(0.4, 0, 0.2, 1), width var(--dur, .32s) cubic-bezier(0.4, 0, 0.2, 1)",
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
              className={cn(
                "group relative z-10 flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold outline-none", 
                "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-600",
                active
                  ? "text-white drop-shadow-sm"
                  : "text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100"
              )}
            >
              {/* Bars */}
              <span className="flex items-end gap-0.5" aria-hidden="true">
                {[1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={cn(
                      "w-1 rounded-full transition-all", // ⬅ mảnh hơn
                      i === 1 ? "h-2" : i === 2 ? "h-3" : "h-4",
                      active
                        ? i <= c.bars
                          ? "bg-white/95 shadow-sm"
                          : "bg-white/30"
                        : i <= c.bars
                        ? "bg-zinc-500/70"
                        : "bg-zinc-300/50 dark:bg-zinc-600/50"
                    )}
                  />
                ))}
              </span>

              <span className="tracking-tight">{c.label}</span>

              {/* Suggested icon */}
              {isSuggested && (
                <Sparkles
                  className={cn(
                    "h-3.5 w-3.5 transition-opacity", 
                    active ? "text-white/90" : "text-amber-500"
                  )}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Suggested hint */}
      {resolvedSuggested && (
        <div className="w-full flex items-end">
          <div
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border",
              levelConfig[resolvedSuggested].badgeTint,
              "shadow-sm"
            )}
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-zinc-800 dark:text-zinc-200">
              Gợi ý:{" "}
              <strong className={levelConfig[resolvedSuggested].textColor}>
                {levelConfig[resolvedSuggested].label}
              </strong>{" "}
              – {levelConfig[resolvedSuggested].desc}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
