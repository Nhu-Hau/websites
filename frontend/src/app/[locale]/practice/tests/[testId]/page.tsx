/* eslint-disable @typescript-eslint/no-explicit-any */
// frontend/src/app/[locale]/practice/tests/[testId]/page.tsx
"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";

type GroupKey = "Listening" | "Reading";
type Part = { id: string; title: string; questionCount: number; group: GroupKey };

export default function TestOverviewPage() {
  // 👇 Lấy cả locale để build URL đúng (tránh rớt /vi)
  const { locale, testId } = useParams<{ locale: string; testId: string }>();
  const router = useRouter();

  const [loading, setLoading] = React.useState(true);
  const [test, setTest] = React.useState<any>(null);
  const [parts, setParts] = React.useState<Part[]>([]);
  const [mode, setMode] = React.useState<"info" | "answers">("info");

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`/api/tests/${encodeURIComponent(String(testId))}`, {
          credentials: "include",
          cache: "no-store",
        });
        if (res.status === 403) {
          setTest(null);
          setParts([]);
        } else {
          const data = await res.json();
          if (mounted) {
            setTest(data.test);
            setParts(data.parts || []);
          }
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [testId]);

  // checkbox state
  const [checked, setChecked] = React.useState<Record<string, boolean>>({});
  React.useEffect(() => {
    const init: Record<string, boolean> = {};
    parts.forEach((p) => (init[p.id] = false));
    setChecked(init);
  }, [parts]);

  const selectedIds = parts.filter(p => checked[p.id]).map(p => p.id);
  const selectedCount = selectedIds.length;

  const toggleOne = (id: string) =>
    setChecked(prev => ({ ...prev, [id]: !prev[id] }));

  const toggleAll = (value: boolean) =>
    setChecked(prev => {
      const next = { ...prev };
      parts.forEach(p => (next[p.id] = value));
      return next;
    });

  const grouped: Record<GroupKey, Part[]> = React.useMemo(() => {
    const g: Record<GroupKey, Part[]> = { Listening: [], Reading: [] } as any;
    parts.forEach(p => g[p.group].push(p));
    return g;
  }, [parts]);

  function handleStart() {
    if (mode !== "info" || selectedCount === 0) return;

    // ✅ CHỈNH Ở ĐÂY: điều hướng sang /do?parts=..., luôn giữ /{locale}
    const base = `/${locale}/practice/tests/${encodeURIComponent(String(testId))}/do`;
    const url =
      selectedCount === 1
        ? `${base}?parts=${encodeURIComponent(selectedIds[0])}`
        : `${base}?parts=${encodeURIComponent(selectedIds.join(","))}`;
    router.push(url);
  }

  if (loading) return <div className="mx-auto max-w-3xl p-6 mt-16 text-sm text-gray-500">Đang tải…</div>;
  if (!test) return <div className="mx-auto max-w-3xl p-6 mt-16 text-sm text-red-600">Bài test không khả dụng hoặc chưa mở khóa level.</div>;

  return (
    <div className="mx-auto w-full max-w-3xl p-6 mt-16">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">{test.title}</h1>
        <p className="mt-2 text-md text-zinc-600">
          {test.totalQuestions} câu • {test.totalDurationMin} phút
        </p>
      </header>

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="inline-flex rounded-xl border border-zinc-200 bg-white p-1.5 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
          <div className="flex gap-2 items-center">
            <button
              type="button"
              onClick={() => setMode("info")}
              className={`px-4 py-2 text-sm font-medium rounded-lg ${mode === "info" ? "bg-[#272343] text-white" : "text-zinc-700 hover:bg-zinc-100"}`}
            >
              Thông tin đề
            </button>
            <button
              type="button"
              onClick={() => setMode("answers")}
              className={`px-4 py-2 text-sm font-medium rounded-lg ${mode === "answers" ? "bg-[#272343] text-white" : "text-zinc-700 hover:bg-zinc-100"}`}
            >
              Đáp án
            </button>
          </div>
        </div>

        {mode === "info" && (
          <div className="flex items-center gap-4 text-sm">
            <button
              type="button"
              onClick={handleStart}
              disabled={selectedCount === 0}
              className={`inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-medium ${selectedCount === 0 ? "bg-zinc-300 text-zinc-600 cursor-not-allowed" : "bg-[#272343] text-white hover:bg-zinc-800"}`}
              title={selectedCount === 0 ? "Hãy chọn ít nhất 1 part" : "Bắt đầu"}
            >
              Bắt đầu
            </button>
          </div>
        )}
      </div>

      {(["Listening", "Reading"] as GroupKey[]).map((group) => {
        const items = grouped[group];
        if (!items?.length) return null;
        return (
          <section key={group} className="mb-8">
            <header className="flex items-center justify-between px-4 py-3">
              <h2 className="text-xl font-semibold uppercase">{group}</h2>
              {group === "Listening" && mode === "info" && (
                <div className="flex gap-3 text-sm">
                  <span className="text-zinc-600 cursor-default">
                    Đã chọn <b>{selectedCount}</b>/{parts.length} part
                  </span>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-[#272343] rounded cursor-pointer"
                      checked={selectedCount === parts.length && parts.length > 0}
                      onChange={(e) => toggleAll(e.target.checked)}
                      aria-label="Chọn tất cả part"
                    />
                    <span className="text-zinc-700">Chọn tất cả</span>
                  </label>
                </div>
              )}
            </header>

            <div className="border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
              <ul role="list" className="divide-y divide-zinc-200 dark:divide-zinc-700">
                {items.map((p) => {
                  const badge = p.id.match(/\d+/)?.[0] || "";
                  return (
                    <li key={p.id} className="grid grid-cols-1 sm:grid-cols-[1fr_auto] items-center gap-4 px-4 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-700/20">
                      <div className="min-w-0 flex items-center gap-3">
                        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-zinc-200 text-sm font-semibold text-zinc-700 dark:border-zinc-600 dark:text-zinc-200">
                          {badge}
                        </span>
                        <div>
                          <h3 className="text-lg font-semibold">{p.title}</h3>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-4 sm:justify-end">
                        {mode === "info" ? (
                          <>
                            <p className="text-md text-zinc-600">{p.questionCount} câu</p>
                            <label className="inline-flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                className="h-4 w-4 accent-[#272343] rounded cursor-pointer"
                                checked={!!checked[p.id]}
                                onChange={() => toggleOne(p.id)}
                              />
                            </label>
                          </>
                        ) : (
                          // (Tuỳ bạn) nếu đã có trang answers riêng, giữ link cũ có locale
                          <a
                            href={`/${locale}/practice/tests/${encodeURIComponent(String(testId))}/${encodeURIComponent(p.id)}/answers`}
                            className="text-sm font-medium underline underline-offset-4"
                          >
                            Xem đáp án
                          </a>
                          // Hoặc nếu muốn xem đáp án ngay trong trang do:
                          // <a
                          //   href={`/${locale}/practice/tests/${encodeURIComponent(String(testId))}/do?parts=${encodeURIComponent(p.id)}&mode=answers`}
                          //   className="text-sm font-medium underline underline-offset-4"
                          // >
                          //   Xem đáp án
                          // </a>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        );
      })}
    </div>
  );
}