// frontend/src/components/common/CornerToast.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";
import { resolveLocaleHref } from "@/lib/navigation/resolveLocaleHref";
import { X, Info, CheckCircle2 } from "lucide-react";

type Corner = { id: string; title: string; message: string; link?: string };

export default function CornerToast() {
  const [toasts, setToasts] = React.useState<Corner[]>([]);
  const basePrefix = useBasePrefix();

  // track id để chống double trong ~10s
  const seenRef = React.useRef<Set<string>>(new Set());
  // đảm bảo không add listener 2 lần do StrictMode
  const mountedOnceRef = React.useRef(false);

  React.useEffect(() => {
    if (mountedOnceRef.current) return;
    mountedOnceRef.current = true;

    const seenSet = seenRef.current;

    const onToast = (e: Event) => {
      const detail = (e as CustomEvent).detail as Corner;
      if (!detail?.id) return;

      if (seenSet.has(detail.id)) return;
      seenSet.add(detail.id);

      setToasts((prev) => [detail, ...prev].slice(0, 3));

      // auto remove toast
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== detail.id));
      }, 4000);

      // clear dấu vết
      setTimeout(() => {
        seenSet.delete(detail.id);
      }, 10000);
    };

    window.addEventListener("corner-toast", onToast as any);

    return () => {
      window.removeEventListener("corner-toast", onToast as any);
      seenSet.clear();
      mountedOnceRef.current = false;
    };
  }, []);

  const handleClose = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-4 z-[1000]",
        "flex flex-col items-center gap-3 px-4",
        "sm:inset-x-auto sm:right-4 sm:items-end sm:px-0"
      )}
    >
      {toasts.map((t, idx) => {
        const isFirst = idx === 0;

        return (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto w-full max-w-sm overflow-hidden rounded-2xl border",
              "border-slate-800/70 bg-gradient-to-br from-slate-950/95 via-slate-900/95 to-sky-950/90",
              "text-slate-50 shadow-[0_18px_45px_rgba(15,23,42,0.9)] backdrop-blur-2xl",
              "relative px-4 py-3.5",
              "animate-in fade-in slide-in-from-bottom-5 zoom-in-95 duration-300",
              !isFirst && "opacity-90 scale-[0.98]"
            )}
          >
            {/* Accent blur & border glow */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-sky-500/25 blur-3xl" />
              <div className="absolute -left-10 bottom-0 h-20 w-20 rounded-full bg-indigo-500/15 blur-2xl" />
            </div>

            {/* Thin gradient bar */}
            <span className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-sky-400 via-sky-300 to-emerald-300" />

            {/* Nội dung */}
            <div className="relative flex gap-3">
              {/* Icon */}
              <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-sky-500/15 ring-1 ring-sky-400/40">
                {t.title.toLowerCase().includes("thành công") ||
                t.title.toLowerCase().includes("success") ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                ) : (
                  <Info className="h-5 w-5 text-sky-300" />
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-semibold tracking-wide text-slate-50">
                      {t.title}
                    </p>
                  </div>

                  {/* Close */}
                  <button
                    type="button"
                    onClick={() => handleClose(t.id)}
                    className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900/70 text-slate-400 transition hover:bg-slate-800/90 hover:text-slate-100"
                    aria-label="Close notification"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="mt-1.5 text-[12px] leading-snug text-slate-200/90">
                  {t.link ? (
                    <Link
                      href={resolveLocaleHref(t.link, basePrefix) || "#"}
                      className="font-medium text-sky-300 underline underline-offset-2 transition-colors hover:text-sky-200"
                    >
                      {t.message}
                    </Link>
                  ) : (
                    t.message
                  )}
                </div>

                {/* Progress line */}
                <div className="mt-2 h-0.5 overflow-hidden rounded-full bg-slate-800/80">
                  <div className="h-full w-full origin-left animate-[shrink_4s_linear_forwards] bg-gradient-to-r from-sky-400 via-sky-300 to-emerald-300" />
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* keyframes cho progress bar (tailwind arbitrary) */}
      <style jsx>{`
        @keyframes shrink {
          from {
            transform: scaleX(1);
          }
          to {
            transform: scaleX(0);
          }
        }
      `}</style>
    </div>
  );
}