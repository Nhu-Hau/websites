import LevelSwitcher from "@/components/parts/LevelSwitcher";
import TestCard, { AttemptSummary } from "@/components/cards/TestCard";
import { apiBase } from "@/lib/api";
import { cookies } from "next/headers";
import Link from "next/link";
import { History, Headphones, BookOpen } from "lucide-react";

const PART_META: Record<string, { title: string; defaultQuestions: number; defaultDuration: number }> = {
  "part.1": { title: "Part 1", defaultQuestions: 6,  defaultDuration: 6  },
  "part.2": { title: "Part 2", defaultQuestions: 25, defaultDuration: 11 },
  "part.3": { title: "Part 3", defaultQuestions: 39, defaultDuration: 20 },
  "part.4": { title: "Part 4", defaultQuestions: 30, defaultDuration: 13 },
  "part.5": { title: "Part 5", defaultQuestions: 30, defaultDuration: 17 },
  "part.6": { title: "Part 6", defaultQuestions: 16, defaultDuration: 12 },
  "part.7": { title: "Part 7", defaultQuestions: 54, defaultDuration: 55 },
};

type Props = {
  params: { locale: string; partKey: string };
  searchParams: { level?: string };
};

export default async function PartPage({ params, searchParams }: Props) {
  const { locale, partKey } = params;

  const levelParam = Number(searchParams.level ?? 1);
  const level: 1 | 2 | 3 = [1, 2, 3].includes(levelParam) ? (levelParam as 1 | 2 | 3) : 1;

  const meta = PART_META[partKey] ?? {
    title: `Practice • ${partKey}`,
    defaultQuestions: 10,
    defaultDuration: 10,
  };

  const base = apiBase();

  // 1) Lấy danh sách test cho part + level
  const testsRes = await fetch(
    `${base}/api/parts/${encodeURIComponent(partKey)}/tests?level=${level}`,
    { cache: "no-store" }
  );
  const { tests = [] } = testsRes.ok ? await testsRes.json() : { tests: [] as number[] };

  // 2) Lấy tiến độ đã làm theo từng test (dựa theo cookie user)
  const cookieStore = await cookies(); // ✅ dùng await để có .getAll()
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  let attemptsByTest: Record<number, AttemptSummary> = {};
  try {
    const progRes = await fetch(
      `${base}/api/practice/progress?partKey=${encodeURIComponent(partKey)}&level=${level}`,
      { cache: "no-store", headers: cookieHeader ? { cookie: cookieHeader } : {} }
    );
    if (progRes.ok) {
      const pj = await progRes.json();
      // BE có thể trả {progress} hoặc {progressByTest}
      const raw = (pj?.progress ?? pj?.progressByTest ?? {}) as Record<string, AttemptSummary>;
      attemptsByTest = Object.fromEntries(
        Object.entries(raw).map(([k, v]) => [Number(k), v])
      );
    }
  } catch {
    // ignore
  }

  return (
    <div className="mx-auto max-w-6xl p-6 mt-16">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: Title + tag */}
        <div className="space-y-2">
          {/^part\.[1-4]$/.test(partKey) ? (
            <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-200">
              <Headphones className="h-5 w-5" />
              <span className="text-xs font-semibold uppercase tracking-wide">Luyện Nghe</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-200">
              <BookOpen className="h-5 w-5" />
              <span className="text-xs font-semibold uppercase tracking-wide">Luyện Đọc</span>
            </div>
          )}
          <h1 className="text-3xl sm:text-4xl font-bold">{meta.title}</h1>
          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
            Chọn cấp độ và đề (test) để bắt đầu luyện tập hiệu quả.
          </p>
        </div>

        {/* Right: Level switcher + Lịch sử */}
        <div className="flex items-center gap-2">
          <LevelSwitcher level={level} />
          <Link
            href={`/${locale}/practice/history?partKey=${encodeURIComponent(partKey)}&level=${level}`}
            className="inline-flex items-center gap-1 rounded-xl border px-3 py-3.5 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
          >
            <History className="h-4 w-4" />
            Lịch sử
          </Link>
        </div>
      </header>

      {tests.length === 0 ? (
        <div className="rounded-2xl border p-6 text-sm text-zinc-500">
          Chưa có bài (test) cho Level {level}.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {tests.map((testNum: number) => (
            <TestCard
              key={testNum}
              locale={locale}
              partKey={partKey}
              level={level}
              test={testNum}
              totalQuestions={meta.defaultQuestions}
              durationMin={meta.defaultDuration}
              attemptSummary={attemptsByTest[testNum]}
            />
          ))}
        </div>
      )}
    </div>
  );
}