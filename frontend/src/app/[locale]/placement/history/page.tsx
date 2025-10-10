/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FiClock, FiCheckCircle, FiBarChart2 } from "react-icons/fi";

type AttemptLite = {
  _id: string;
  testId: string;
  level: number;
  acc: number; // 0..1
  correct: number;
  total: number;
  listening: { total: number; correct: number; acc: number };
  reading: { total: number; correct: number; acc: number };
  submittedAt: string;
  timeSec: number;
  version?: string;
};

export default function PlacementHistoryPage() {
  const { locale } = useParams<{ locale: string }>();
  const [loading, setLoading] = React.useState(true);
  const [items, setItems] = React.useState<AttemptLite[]>([]);
  const [total, setTotal] = React.useState(0);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`/api/placement/attempts?limit=20&page=1`, {
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) {
          setItems([]);
          setTotal(0);
          return;
        }
        const data = await res.json();
        if (!mounted) return;
        setItems(data.items || []);
        setTotal(Number(data.total || 0));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading)
    return (
      <div className="mx-auto max-w-3xl p-6 mt-16 text-sm text-zinc-500">
        Đang tải lịch sử…
      </div>
    );

  return (
    <div className="mx-auto max-w-3xl p-6 mt-16 space-y-6">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold">Lịch sử Placement Test</h1>
        <p className="text-sm text-zinc-600">
          {total > 0 ? `Bạn có ${total} lần làm` : "Chưa có bài nào"}
        </p>
      </header>

      <div className="space-y-4">
        {items.map((it) => {
          const dt = new Date(it.submittedAt);
          const time =
            `${String(Math.floor((it.timeSec || 0) / 60)).padStart(2, "0")}:` +
            `${String((it.timeSec || 0) % 60).padStart(2, "0")}`;
          return (
            <div
              key={it._id}
              className="rounded-2xl border p-4 bg-white dark:bg-zinc-800"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-base font-semibold">
                    {it.testId || "Placement"} — Level {it.level}
                  </div>
                  <div className="text-xs text-zinc-500">
                    Nộp lúc {dt.toLocaleString()}
                  </div>
                </div>

                <Link
                  href={`/${locale}/placement/result/${it._id}`}
                  className="rounded-xl bg-zinc-900 text-white px-4 py-2 text-sm font-semibold hover:bg-zinc-800"
                >
                  Xem chi tiết
                </Link>
              </div>

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div className="rounded-xl border p-3 flex items-center gap-2">
                  <FiCheckCircle />
                  <span>
                    Đúng <b>{it.correct}</b> / {it.total}
                  </span>
                </div>
                <div className="rounded-xl border p-3 flex items-center gap-2">
                  <FiBarChart2 />
                  <span>
                    Chính xác <b>{(it.acc * 100).toFixed(1)}%</b>
                  </span>
                </div>
                <div className="rounded-xl border p-3 flex items-center gap-2">
                  <FiClock />
                  <span>Thời gian {time}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {total === 0 && (
        <div className="rounded-2xl border p-6 text-center">
          <div className="text-sm">Bạn chưa có bài Placement nào.</div>
          <Link
            href={`/${locale}/placement`}
            className="inline-flex mt-3 items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-white text-sm font-semibold hover:bg-sky-500"
          >
            Làm Placement Test
          </Link>
        </div>
      )}
    </div>
  );
}