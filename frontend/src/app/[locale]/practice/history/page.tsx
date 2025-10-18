// frontend/src/app/[locale]/practice/history/page.tsx
import Link from "next/link";
import { cookies } from "next/headers";
import { apiBase } from "@/lib/api";
import { CalendarClock, ListChecks, Timer, Layers, Hash } from "lucide-react";

type Attempt = {
  _id: string;
  partKey: string;     // "part.1"..."part.7"
  level: 1|2|3;
  test?: number | null;
  total: number;
  correct: number;
  acc: number;         // 0..1
  timeSec: number;
  submittedAt?: string;
  createdAt?: string;
  answersMap?: Record<string, { correctAnswer: string }>;
};

type HistoryResp = {
  page: number;
  limit: number;
  total: number;
  items: Attempt[];
};

type Props = {
  params: { locale: string };
  searchParams: {
    partKey?: string;
    level?: string;
    test?: string;
    page?: string;
    limit?: string;
  };
};

function fmtTime(sec: number) {
  const m = Math.floor(Math.max(0, sec) / 60);
  const s = Math.max(0, sec) % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default async function HistoryPage({ params, searchParams }: Props) {
  const { locale } = params;

  const page = Math.max(1, parseInt(String(searchParams.page ?? "1"), 10));
  const limit = Math.min(100, Math.max(1, parseInt(String(searchParams.limit ?? "20"), 10)));

  const base = apiBase();
  const qs = new URLSearchParams();
  qs.set("page", String(page));
  qs.set("limit", String(limit));
  if (searchParams.partKey) qs.set("partKey", searchParams.partKey);
  if (searchParams.level) qs.set("level", searchParams.level);
  if (searchParams.test) qs.set("test", searchParams.test);

  const cookieHeader = (await cookies()).toString();
  const res = await fetch(`${base}/api/practice/history?${qs.toString()}`, {
    cache: "no-store",
    headers: { cookie: cookieHeader },
  });

  const { items = [], total = 0 } = (res.ok ? await res.json() : { items: [], total: 0 }) as HistoryResp;

  return (
    <div className="mx-auto max-w-6xl p-6 mt-16">
      <header className="mb-6 space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold">Lịch sử luyện tập</h1>
        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
          Xem lại các bài đã làm. Nhấn vào một dòng để mở phần xem chi tiết.
        </p>
      </header>

      {items.length === 0 ? (
        <div className="rounded-2xl border p-6 text-sm text-zinc-500">
          Chưa có lịch sử. Hãy làm một bài luyện trước nhé.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((a) => {
            const at = a.submittedAt || a.createdAt;
            const accPct = Math.round((a.acc ?? 0) * 100);

            return (
              <Link
                key={a._id}
                href={`/${encodeURIComponent(locale)}/practice/history/${encodeURIComponent(a._id)}`}
                className="block rounded-2xl border p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <div className="text-base sm:text-lg font-semibold">
                      {String(a.partKey).replace("part.", "Part ")} – Level {a.level}
                      {typeof a.test === "number" ? ` – Test ${a.test}` : ""}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                      <span className="inline-flex items-center gap-1 rounded-lg border px-2 py-0.5">
                        <ListChecks className="h-4 w-4" />
                        {a.correct}/{a.total} ({accPct}%)
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-lg border px-2 py-0.5">
                        <Timer className="h-4 w-4" />
                        {fmtTime(a.timeSec)}
                      </span>
                      {typeof a.level === "number" && (
                        <span className="inline-flex items-center gap-1 rounded-lg border px-2 py-0.5">
                          <Layers className="h-4 w-4" />
                          Level {a.level}
                        </span>
                      )}
                      {typeof a.test === "number" && (
                        <span className="inline-flex items-center gap-1 rounded-lg border px-2 py-0.5">
                          <Hash className="h-4 w-4" />
                          Test {a.test}
                        </span>
                      )}
                      {at && (
                        <span className="inline-flex items-center gap-1 rounded-lg border px-2 py-0.5">
                          <CalendarClock className="h-4 w-4" />
                          {new Date(at).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-sm text-zinc-500">
                    Nhấn để xem chi tiết →
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* (Tuỳ chọn) Phân trang đơn giản */}
      {total > items.length && (
        <div className="mt-6 text-sm text-zinc-600">
          Tổng: {total} bài. Bạn có thể thêm điều khiển phân trang sau.
        </div>
      )}
    </div>
  );
}