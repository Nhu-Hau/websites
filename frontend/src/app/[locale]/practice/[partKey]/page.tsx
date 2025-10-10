/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import PartCard from "@/components/cards/PartCard";

const PART_META: Record<string, { title: string; defaultQuestions: number; defaultDuration: number }> = {
  "part.1": { title: "Part 1", defaultQuestions: 10, defaultDuration: 6 },
  "part.2": { title: "Part 2", defaultQuestions: 15, defaultDuration: 10 },
  "part.3": { title: "Part 3", defaultQuestions: 9, defaultDuration: 12 },
  "part.4": { title: "Part 4", defaultQuestions: 9, defaultDuration: 12 },
  "part.5": { title: "Part 5", defaultQuestions: 15, defaultDuration: 12 },
  "part.6": { title: "Part 6", defaultQuestions: 12, defaultDuration: 12 },
  "part.7": { title: "Part 7", defaultQuestions: 20, defaultDuration: 20 },
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

  // đọc ?level= từ URL để set filter ban đầu
  const levelFromUrl = React.useMemo(() => {
    const raw = search.get("level");
    const n = raw ? Number(raw) : NaN;
    return (n === 1 || n === 2 || n === 3 || n === 4) ? (n as 1|2|3|4) : null;
  }, [search]);

  const [filter, setFilter] = React.useState<null | 1 | 2 | 3 | 4>(levelFromUrl);

  // nếu URL đổi (back/forward), sync lại filter
  React.useEffect(() => {
    setFilter(levelFromUrl);
  }, [levelFromUrl]);

  // helper: cập nhật ?level= trên URL (không scroll)
  function updateQuery(next: null | 1 | 2 | 3 | 4) {
    const q = next ? `?level=${next}` : "";
    router.replace(`${pathname}${q}`, { scroll: false });
  }

  function handleClickAll() {
    setFilter(null);
    updateQuery(null);
  }
  function handleClickLevel(lv: 1 | 2 | 3 | 4) {
    setFilter(lv);
    updateQuery(lv);
  }

  const visibleLevels = LEVELS.filter((lv) => (filter ? lv === filter : true));

  return (
    <div className="mx-auto max-w-6xl p-6 mt-16">
      <header className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{meta.title}</h1>
          <p className="text-sm text-zinc-600">
            Chọn Level để luyện theo {partKey}. Nhấn vào một card để bắt đầu.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-xl border p-1.5 bg-white dark:bg-zinc-800">
          <button
            className={`px-3 py-1.5 rounded-lg text-sm ${filter === null ? "bg-black text-white" : "hover:bg-zinc-100"}`}
            onClick={handleClickAll}
          >
            Tất cả
          </button>
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