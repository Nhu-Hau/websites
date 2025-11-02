// frontend/src/components/progress/ProgressNudge.tsx
"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";

type Elig = {
  eligible: boolean;
  practiceSinceCount?: number;
  since?: string;
  nextEligibleAt?: string;
};

export default function ProgressNudge() {
  const [state, setState] = useState<Elig | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await fetch("/api/progress/eligibility", {
          credentials: "include",
          cache: "no-store",
        });
        if (!r.ok) return;
        const j: Elig = await r.json();
        if (!mounted) return;
        setState(j);

        if (j.eligible) {
          toast.info(
            <div className="text-sm">
              <div className="font-semibold mb-1">Đến lúc kiểm tra tiến bộ!</div>
              <div className="mb-2">
                Bạn đã luyện tập đều đặn. Hãy làm <strong>Progress Test</strong> để cập nhật điểm dự đoán.
              </div>
              <Link
                href="/progress"
                className="inline-block mt-1 px-3 py-1 rounded-md bg-emerald-600 text-white text-xs"
              >
                Bắt đầu Progress Test
              </Link>
            </div>,
            { duration: 6000 }
          );
        }
      } catch {
        /* ignore */
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (!state?.eligible) return null;

  // Có thể hiện 1 banner cố định nếu muốn
  return (
    <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-emerald-900 text-sm flex items-center justify-between">
      <div>
        <div className="font-semibold">Đã đến thời điểm làm Progress Test</div>
        <div className="opacity-80">Làm bài để cập nhật TOEIC ước lượng và nhận nhận xét theo từng part.</div>
      </div>
      <Link
        href="/progress"
        className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-bold"
      >
        Làm ngay
      </Link>
    </div>
  );
}