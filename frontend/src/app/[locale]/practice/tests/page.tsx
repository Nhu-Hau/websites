/* eslint-disable @typescript-eslint/no-explicit-any */
// frontend/src/app/[locale]/practice/tests/page.tsx
"use client";

import React from "react";
import TestCard from "@/components/cards/TestCard";
import { useAuth } from "@/context/AuthContext";

export default function TestsListPage() {
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const { user } = useAuth();

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/tests", { credentials: "include", cache: "no-store" });
        const data = await res.json();
        if (mounted) setItems(data.items || []);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="mx-auto max-w-6xl p-6 mt-16">
      <h1 className="text-2xl font-bold mb-4">Danh sách đề</h1>
      {loading ? (
        <div className="text-sm text-gray-500">Đang tải…</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((t) => (
            <TestCard
              key={t.testId}
              testId={t.testId}
              title={t.title}
              access={t.access}
              totalQuestions={t.totalQuestions}
              durationMin={t.totalDurationMin}
              level={t.level}
            />
          ))}
        </div>
      )}
    </div>
  );
}