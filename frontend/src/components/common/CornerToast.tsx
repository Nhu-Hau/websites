//frontend/src/components/common/CornerToast.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React from "react";
import Link from "next/link";

type Corner = { id: string; title: string; message: string; link?: string };

export default function CornerToast() {
  const [toasts, setToasts] = React.useState<Corner[]>([]);

  // track id để chống double trong ~10s
  const seenRef = React.useRef<Set<string>>(new Set());
  // đảm bảo không add listener 2 lần do StrictMode
  const mountedOnceRef = React.useRef(false);

  React.useEffect(() => {
    if (mountedOnceRef.current) return;     // ✅ tránh đăng ký lặp
    mountedOnceRef.current = true;

    const onToast = (e: Event) => {
      const detail = (e as CustomEvent).detail as Corner;
      if (!detail?.id) return;

      // ✅ de-dup theo id
      if (seenRef.current.has(detail.id)) return;
      seenRef.current.add(detail.id);

      setToasts((prev) => [detail, ...prev].slice(0, 3));

      // auto remove toast
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== detail.id));
      }, 4000);

      // xóa dấu vết để không giữ mãi
      setTimeout(() => {
        seenRef.current.delete(detail.id);
      }, 10000);
    };

    window.addEventListener("corner-toast", onToast as any);

    return () => {
      window.removeEventListener("corner-toast", onToast as any);
      seenRef.current.clear();
      mountedOnceRef.current = false;
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-[1000] space-y-2">
      {toasts.map((t) => (
        <div key={t.id} className="rounded-2xl shadow-lg bg-black/80 text-white px-4 py-3 backdrop-blur">
          <div className="font-semibold">{t.title}</div>
          <div className="text-sm opacity-90">
            {t.link ? <Link href={t.link} className="underline">{t.message}</Link> : t.message}
          </div>
        </div>
      ))}
    </div>
  );
}