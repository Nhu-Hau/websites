// frontend/src/components/parts/LevelSwitcher.tsx
"use client";

import React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type L = 1 | 2 | 3;

const HINTS: Record<L, string> = {
  1: "Cơ bản • làm nóng tay",
  2: "Trung bình • tăng tốc",
  3: "Nâng cao • chinh phục",
};

export default function LevelSwitcher({ level }: { level: L }) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  function setLevel(next: L) {
    const params = new URLSearchParams(search.toString());
    params.set("level", String(next));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div
      className="
        inline-flex items-center gap-1 rounded-2xl
        border border-zinc-200 dark:border-zinc-700
        bg-white/80 dark:bg-zinc-800/70
        px-2 py-1 shadow-sm backdrop-blur
      "
      role="tablist"
      aria-label="Chọn level luyện tập"
    >
      {[1, 2, 3].map((lv) => {
        const active = level === lv;
        return (
          <button
            key={lv}
            role="tab"
            aria-selected={active}
            title={HINTS[lv as L]}
            onClick={() => setLevel(lv as L)}
            className={[
              "group relative flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-medium transition-all",
              active
                ? "bg-black text-white shadow-sm ring-1 ring-black/80"
                : "text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100/70 dark:hover:bg-zinc-700/60",
            ].join(" ")}
          >
            <span
              className={[
                "inline-flex items-end gap-0.5 rounded-md px-1.5 py-1",
                active ? "bg-white/10" : "bg-zinc-200/60 dark:bg-zinc-700/60",
              ].join(" ")}
              aria-hidden
            >
              {[1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={[
                    "w-1 rounded-sm bg-current/30",
                    active ? "bg-white/80" : "bg-current/40",
                    i === 1 ? "h-2.5" : i === 2 ? "h-3.5" : "h-5",
                    i <= lv ? "opacity-100" : "opacity-30",
                  ].join(" ")}
                />
              ))}
            </span>

            <span>Level {lv}</span>
            {active && (
              <span className="absolute inset-x-2 -bottom-[6px] h-[3px] rounded-full bg-black/80 dark:bg-white/80" />
            )}
          </button>
        );
      })}
    </div>
  );
}