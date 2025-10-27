// frontend/src/components/parts/LevelSwitcher.tsx
"use client";

import React, { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type L = 1 | 2 | 3;

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

// Cấu hình: mỗi level có 1 màu solid riêng
const levelConfig: Record<
  L,
  { label: string; solidColor: string; bars: number }
> = {
  1: {
    label: "Level 1",
    solidColor: "bg-emerald-600", // Xanh lá
    bars: 1,
  },
  2: {
    label: "Level 2",
    solidColor: "bg-blue-600", // Xanh dương
    bars: 2,
  },
  3: {
    label: "Level 3",
    solidColor: "bg-violet-600", // Tím
    bars: 3,
  },
};

export default function LevelSwitcher({ level }: { level: L }) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = React.useState<React.CSSProperties>({});

  function setLevel(next: L) {
    const params = new URLSearchParams(search.toString());
    params.set("level", String(next));
    router.replace(`${pathname}?${params.toString()}`, { scroll:  false });
  }

  // Cập nhật vị trí + màu pill
  useEffect(() => {
    const activeBtn = containerRef.current?.querySelector(
      `[data-level="${level}"]`
    ) as HTMLElement;
    if (activeBtn) {
      setIndicatorStyle({
        left: `${activeBtn.offsetLeft}px`,
        width: `${activeBtn.offsetWidth}px`,
      });
    }
  }, [level]);

  const activeColor = levelConfig[level].solidColor;

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative inline-flex items-center gap-1 rounded-2xl p-1.5",
        "border border-zinc-200/70 dark:border-zinc-700/70",
        "bg-white/80 dark:bg-zinc-800/70 backdrop-blur-xl",
        "shadow-lg shadow-zinc-900/5 dark:shadow-zinc-950/50",
        "transition-all duration-300"
      )}
      role="tablist"
      aria-label="Chọn level luyện tập"
    >
      {/* Pill Indicator - Solid Color theo Level */}
      <div
        className={cn(
          "absolute inset-y-2 rounded-xl shadow-md transition-all duration-300 ease-out",
          activeColor // Màu phẳng, không gradient
        )}
        style={{
          ...indicatorStyle,
          transition: "left 0.32s cubic-bezier(0.4, 0, 0.2, 1), width 0.32s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      />

      {/* Các nút Level */}
      {[1, 2, 3].map((lv) => {
        const cfg = levelConfig[lv as L];
        const active = level === lv;

        return (
          <button
            key={lv}
            data-level={lv}
            role="tab"
            aria-selected={active}
            onClick={() => setLevel(lv as L)}
            className={cn(
              "relative z-10 flex items-center gap-2.5 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-300",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500",
              active
                ? "text-white drop-shadow-sm"
                : "text-zinc-600 dark:text-zinc-300 hover:text-zinc-800 dark:hover:text-zinc-100"
            )}
          >
            {/* Thanh độ cao */}
            <div className="flex items-end gap-0.5" aria-hidden="true">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "w-1.5 rounded-full transition-all duration-300",
                    i === 1 ? "h-2.5" : i === 2 ? "h-3.5" : "h-5",
                    active
                      ? i <= cfg.bars
                        ? "bg-white/90"
                        : "bg-white/30"
                      : i <= cfg.bars
                      ? "bg-zinc-500/70"
                      : "bg-zinc-300/50 dark:bg-zinc-600/50"
                  )}
                />
              ))}
            </div>

            <span className="tracking-tight">{cfg.label}</span>
          </button>
        );
      })}
    </div>
  );
}