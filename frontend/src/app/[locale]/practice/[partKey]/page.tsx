/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import PartCard from "@/components/cards/PartCard";

const PART_META: Record<
  string,
  { title: string; defaultQuestions: number; defaultDuration: number }
> = {
  "part.1": { title: "Part 1", defaultQuestions: 6, defaultDuration: 5 },
  "part.2": { title: "Part 2", defaultQuestions: 25, defaultDuration: 10 },
  "part.3": { title: "Part 3", defaultQuestions: 39, defaultDuration: 18 },
  "part.4": { title: "Part 4", defaultQuestions: 30, defaultDuration: 12 },
  "part.5": { title: "Part 5", defaultQuestions: 30, defaultDuration: 15 },
  "part.6": { title: "Part 6", defaultQuestions: 16, defaultDuration: 10 },
  "part.7": { title: "Part 7", defaultQuestions: 54, defaultDuration: 50 },
};

const LEVELS: (1 | 2 | 3 | 4)[] = [1, 2, 3, 4];

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

  // Đọc level từ URL (nếu có)
  const levelFromUrl = React.useMemo<1 | 2 | 3 | 4 | null>(() => {
    const raw = search.get("level");
    const n = raw ? Number(raw) : NaN;
    return n === 1 || n === 2 || n === 3 || n === 4
      ? (n as 1 | 2 | 3 | 4)
      : null;
  }, [search]);

  // State filter: luôn là 1|2|3|4 (mặc định 1)
  const [filter, setFilter] = React.useState<1 | 2 | 3 | 4>(levelFromUrl ?? 1);

  // Nếu URL chưa có ?level= → set mặc định ?level=1 ngay khi mount
  React.useEffect(() => {
    if (levelFromUrl === null) {
      router.replace(`${pathname}?level=1`, { scroll: false });
      setFilter(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // chỉ chạy 1 lần khi mount

  // Sync khi level trên URL đổi (back/forward)
  React.useEffect(() => {
    if (levelFromUrl !== null && levelFromUrl !== filter) {
      setFilter(levelFromUrl);
    }
  }, [levelFromUrl, filter]);

  // helper: cập nhật ?level= trên URL (không scroll)
  function updateQuery(next: 1 | 2 | 3 | 4) {
    router.replace(`${pathname}?level=${next}`, { scroll: false });
  }

  function handleClickLevel(lv: 1 | 2 | 3 | 4) {
    setFilter(lv);
    updateQuery(lv);
  }

  const visibleLevels = [filter]; // chỉ hiển thị đúng 1 level đang chọn

  return (
    <div className="mx-auto max-w-6xl p-6 mt-16">
      <header className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-4xl font-bold">{meta.title}</h1>
          <p className="text-md text-zinc-600">
            Chọn cấp độ phù hợp để luyện tập từng phần của bài thi TOEIC
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-xl border p-1.5 bg-white dark:bg-zinc-800">
          {LEVELS.map((lv) => (
            <button
              key={lv}
              className={`px-3 py-1.5 rounded-lg text-sm ${
                filter === lv ? "bg-black text-white" : "hover:bg-zinc-100"
              }`}
              onClick={() => handleClickLevel(lv)}
            >
              Level {lv}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {visibleLevels.map((lv) => (
          <PartCard
            key={lv}
            locale={locale}
            partKey={partKey}
            level={lv}
            title={meta.title}
            totalQuestions={meta.defaultQuestions}
            durationMin={meta.defaultDuration}
          />
        ))}
      </div>
    </div>
  );
}
