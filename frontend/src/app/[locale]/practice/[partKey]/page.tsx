/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import TestCard from "@/components/cards/TestCard";

const PART_META: Record<string, { title: string; defaultQuestions: number; defaultDuration: number }> = {
  "part.1": { title: "Part 1", defaultQuestions: 6,  defaultDuration: 5 },
  "part.2": { title: "Part 2", defaultQuestions: 25, defaultDuration: 10 },
  "part.3": { title: "Part 3", defaultQuestions: 39, defaultDuration: 18 },
  "part.4": { title: "Part 4", defaultQuestions: 30, defaultDuration: 12 },
  "part.5": { title: "Part 5", defaultQuestions: 30, defaultDuration: 15 },
  "part.6": { title: "Part 6", defaultQuestions: 16, defaultDuration: 10 },
  "part.7": { title: "Part 7", defaultQuestions: 54, defaultDuration: 50 },
};

// ✔ Chỉ 3 level đúng theo DB hiện tại
const LEVELS: (1 | 2 | 3)[] = [1, 2, 3];

type TestsResp = { tests: number[] };

export default function PartPage() {
  const { locale, partKey } = useParams<{ locale: string; partKey: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const search = useSearchParams();

  const meta = PART_META[partKey] ?? {
    title: `Practice • ${partKey}`,
    defaultQuestions: 10,
    defaultDuration: 10,
  };

  // đọc ?level= từ URL → mặc định 1
  const levelFromUrl = React.useMemo<1|2|3>(() => {
    const raw = search.get("level");
    const n = raw ? Number(raw) : 1;
    return (n === 1 || n === 2 || n === 3) ? (n as 1|2|3) : 1;
  }, [search]);

  const [filter, setFilter] = React.useState<1|2|3>(levelFromUrl);
  const [tests, setTests] = React.useState<number[]>([]);
  const [loading, setLoading] = React.useState(false);

  // Sync URL ↔ state
  React.useEffect(() => {
    if (levelFromUrl !== filter) setFilter(levelFromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelFromUrl]);

  // Nếu URL chưa có ?level= → gán ngay
  React.useEffect(() => {
    const raw = search.get("level");
    if (!raw) {
      router.replace(`${pathname}?level=1`, { scroll: false });
    }
  }, [pathname, router, search]);

  // nạp danh sách test cho part + level
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setTests([]);
        const qs = new URLSearchParams({ level: String(filter) });
        const res = await fetch(`/api/parts/${encodeURIComponent(partKey)}/tests?${qs}`, {
          cache: "no-store",
          credentials: "include",
        });
        if (!res.ok) throw new Error("failed");
        const j = (await res.json()) as TestsResp;
        if (!mounted) return;
        setTests(Array.isArray(j.tests) ? j.tests : []);
      } catch (e) {
        console.error(e);
        if (mounted) setTests([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [partKey, filter]);

  function handleClickLevel(lv: 1|2|3) {
    setFilter(lv);
    router.replace(`${pathname}?level=${lv}`, { scroll: false });
  }

  return (
    <div className="mx-auto max-w-6xl p-6 mt-16">
      <header className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-4xl font-bold">{meta.title}</h1>
          <p className="text-md text-zinc-600">
            Chọn cấp độ phù hợp để luyện tập từng phần của bài thi TOEIC
          </p>
        </div>

        {/* ✔ Giữ đúng thanh chọn level cũ */}
        <div className="inline-flex items-center gap-2 rounded-xl border p-1.5 bg-white dark:bg-zinc-800">
          {LEVELS.map((lv) => (
            <button
              key={lv}
              className={`px-3 py-1.5 rounded-lg text-sm ${filter === lv ? "bg-black text-white" : "hover:bg-zinc-100"}`}
              onClick={() => handleClickLevel(lv)}
            >
              Level {lv}
            </button>
          ))}
        </div>
      </header>

      {/* Card = TEST (Test 1, Test 2, …) */}
      {loading ? (
        <div className="text-sm text-zinc-500">Đang tải danh sách bài…</div>
      ) : tests.length === 0 ? (
        <div className="rounded-2xl border p-6 text-sm text-zinc-500">
          Chưa có bài (test) cho Level {filter}.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {tests.map((test) => (
            <TestCard
              key={test}
              locale={locale}
              partKey={partKey}
              level={filter}
              // 👇 title hiển thị Test N
              test={test}
              // số câu/phút chỉ hiển thị ở card, không ảnh hưởng đề
              totalQuestions={meta.defaultQuestions}
              durationMin={meta.defaultDuration}
              access="free"
              // ⭕️ sửa link đích sang /practice/[part]/[level]/[test]
              // (Bạn sửa PartCard ở dưới)
            />
          ))}
        </div>
      )}
    </div>
  );
}