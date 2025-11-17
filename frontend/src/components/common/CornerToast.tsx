//frontend/src/components/common/CornerToast.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Corner = { id: string; title: string; message: string; link?: string };

export default function CornerToast() {
  const [toasts, setToasts] = React.useState<Corner[]>([]);

  // track id để chống double trong ~10s
  const seenRef = React.useRef<Set<string>>(new Set());
  // đảm bảo không add listener 2 lần do StrictMode
  const mountedOnceRef = React.useRef(false);

  React.useEffect(() => {
    if (mountedOnceRef.current) return; // ✅ tránh đăng ký lặp
    mountedOnceRef.current = true;

    const seenSet = seenRef.current; // Copy ref value for cleanup

    const onToast = (e: Event) => {
      const detail = (e as CustomEvent).detail as Corner;
      if (!detail?.id) return;

      // ✅ de-dup theo id
      if (seenSet.has(detail.id)) return;
      seenSet.add(detail.id);

      setToasts((prev) => [detail, ...prev].slice(0, 3));

      // auto remove toast
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== detail.id));
      }, 4000);

      // xóa dấu vết để không giữ mãi
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

  return (
    <div className="fixed bottom-4 right-4 z-[1000] flex flex-col gap-3">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "relative w-72 rounded-2xl px-4 py-3",
            "bg-zinc-900/90 text-zinc-100 shadow-xl shadow-black/30",
            "border border-white/10 backdrop-blur-xl",
            "animate-in fade-in slide-in-from-bottom-4 duration-300"
          )}
        >
          {/* Accent bar bên trái (giống style Dropdown/NavItem) */}
          <span className="absolute left-0 top-3 bottom-3 w-1 rounded-full bg-gradient-to-b from-amber-500 to-amber-400" />

          {/* Nội dung */}
          <div className="pl-3">
            <div className="font-semibold tracking-wide text-[15px]">
              {t.title}
            </div>

            <div className="mt-1 text-sm text-zinc-300 leading-snug">
              {t.link ? (
                <Link
                  href={t.link}
                  className="text-amber-400 underline underline-offset-2 hover:text-amber-300 transition-colors"
                >
                  {t.message}
                </Link>
              ) : (
                t.message
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
