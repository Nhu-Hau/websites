// frontend/src/app/[locale]/practice/[partKey]/page.tsx
import LevelSwitcher from "@/components/parts/LevelSwitcher";
import { apiBase } from "@/lib/api";
import TestCard, { AttemptSummary } from "@/components/cards/TestCard";
import { cookies } from "next/headers";
import Link from "next/link";
import { History, Headphones, BookOpen, ChevronRight } from "lucide-react";

const PART_META: Record<
  string,
  { title: string; defaultQuestions: number; defaultDuration: number }
> = {
  "part.1": { title: "Part 1", defaultQuestions: 6, defaultDuration: 6 },
  "part.2": { title: "Part 2", defaultQuestions: 25, defaultDuration: 11 },
  "part.3": { title: "Part 3", defaultQuestions: 39, defaultDuration: 20 },
  "part.4": { title: "Part 4", defaultQuestions: 30, defaultDuration: 13 },
  "part.5": { title: "Part 5", defaultQuestions: 30, defaultDuration: 17 },
  "part.6": { title: "Part 6", defaultQuestions: 16, defaultDuration: 12 },
  "part.7": { title: "Part 7", defaultQuestions: 54, defaultDuration: 55 },
};

type Props = {
  params: Promise<{ locale: string; partKey: string }>;
  searchParams: Promise<{ level?: string }>;
};

export default async function PartPage({ params, searchParams }: Props) {
  const { locale, partKey } = await params;
  const sp = await searchParams;

  const levelParam = Number(sp.level ?? 1);
  const level: 1 | 2 | 3 = [1, 2, 3].includes(levelParam) ? (levelParam as 1 | 2 | 3) : 1;

  const meta = PART_META[partKey] ?? {
    title: `Practice • ${partKey}`,
    defaultQuestions: 10,
    defaultDuration: 10,
  };

  const base = apiBase();

  // Lấy danh sách test
  const testsRes = await fetch(`${base}/api/parts/${encodeURIComponent(partKey)}/tests?level=${level}`, {
    cache: "no-store",
  });
  const { tests = [] } = testsRes.ok ? await testsRes.json() : { tests: [] as number[] };

  // Lấy tiến độ
  const cookieHeader = (await cookies()).toString();
  let progressByTest: Record<number, AttemptSummary> = {};
  try {
    const progRes = await fetch(
      `${base}/api/practice/progress?partKey=${encodeURIComponent(partKey)}&level=${level}`,
      { cache: "no-store", headers: { cookie: cookieHeader } }
    );
    if (progRes.ok) {
      const pj = await progRes.json();
      const map = pj?.progress ?? pj?.progressByTest ?? {};
      progressByTest = Object.fromEntries(
        Object.entries(map).map(([k, v]) => [Number(k), v as AttemptSummary])
      );
    }
  } catch {
    // ignore
  }

  const isListening = /^part\.[1-4]$/.test(partKey);

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 mt-16">
      {/* Header */}
      <header className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1 space-y-3">
          {/* Tag: Nghe / Đọc */}
          <div className="flex items-center gap-2.5 text-sm font-semibold uppercase tracking-wider">
            {isListening ? (
              <>
                <Headphones className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span className="text-blue-700 dark:text-blue-300">Luyện Nghe</span>
              </>
            ) : (
              <>
                <BookOpen className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-700 dark:text-emerald-300">Luyện Đọc</span>
              </>
            )}
          </div>

          {/* Tiêu đề */}
          <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white tracking-tight">
            {meta.title}
          </h1>

          {/* Mô tả */}
          <p className="text-base text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
            Chọn cấp độ và đề thi để luyện tập hiệu quả. Hệ thống sẽ lưu tiến độ và gợi ý cải thiện.
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <LevelSwitcher level={level} />
          <Link
            href={`/${locale}/practice/history?partKey=${encodeURIComponent(partKey)}&level=${level}`}
            className={`
              group inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-medium
              bg-white/80 dark:bg-zinc-800/70 border-zinc-200 dark:border-zinc-700
              hover:bg-zinc-50 dark:hover:bg-zinc-700/80
              transition-all duration-300 shadow-sm hover:shadow-md
            `}
          >
            <History className="h-4 w-4 transition-transform group-hover:scale-110" />
            <span>Lịch sử</span>
            <ChevronRight className="h-3.5 w-3.5 opacity-60 transition-opacity group-hover:opacity-100" />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <section className="space-y-8">
        {tests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 rounded-full bg-zinc-100 dark:bg-zinc-800 p-6">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-zinc-300 to-zinc-400 dark:from-zinc-700 dark:to-zinc-600" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-zinc-700 dark:text-zinc-300">
              Chưa có đề thi
            </h3>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Level {level} hiện chưa có bài tập. Vui lòng thử cấp độ khác.
            </p>
          </div>
        ) : (
          <>
            {/* Test Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {tests.map((testNum: number) => {
                const p = progressByTest[testNum];
                return (
                  <TestCard
                    key={testNum}
                    locale={locale}
                    partKey={partKey}
                    level={level}
                    test={testNum}
                    totalQuestions={meta.defaultQuestions}
                    durationMin={meta.defaultDuration}
                    attemptSummary={p}
                  />
                );
              })}
            </div>
          </>
        )}
      </section>
    </div>
  );
}