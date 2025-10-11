import Link from "next/link";
import { apiBase } from "@/lib/api";
import { Lock, ShieldCheck, PlayCircle } from "lucide-react";

type CourseSummary = {
  slug: string;
  title: string;
  access: "premium" | "free";
  lessons: number;
  cover?: string | null; // tương lai: bạn có thể set link ảnh từ S3
};

async function getCourses(): Promise<CourseSummary[]> {
  const base = apiBase();
  const res = await fetch(`${base}/api/courses`, { cache: "no-store" });
  if (!res.ok) return [];
  const json = await res.json();
  return (json?.items as CourseSummary[]) ?? [];
}

// Fallback cover: gradient + chữ cái đầu
function CoverFallback({ title }: { title: string }) {
  const label = (title?.trim()?.[0] ?? "C").toUpperCase();
  return (
    <div className="flex h-36 items-center justify-center rounded-xl bg-gradient-to-br from-violet-200 to-sky-200 dark:from-zinc-700 dark:to-zinc-800 text-3xl font-bold text-white">
      {label}
    </div>
  );
}

export default async function CoursesPage({
  params,
}: {
  params: { locale: string };
}) {
  const { locale } = params;
  const courses = await getCourses();

  return (
    <div className="mx-auto max-w-6xl p-6 mt-16">
      <nav className="mb-4 text-sm text-zinc-500">
        <ol className="flex items-center gap-2">
          <li>
            <Link href={`/${locale}/homePage`} className="hover:underline">
              Trang chủ
            </Link>
          </li>
          <li>›</li>
          <li className="text-zinc-700 dark:text-zinc-300">Khoá học</li>
        </ol>
      </nav>

      <header className="mb-6">
        <h1 className="text-2xl font-bold">Khoá học</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Chọn một khoá học để bắt đầu. Một số khoá cần mua hoặc Premium để mở toàn bộ nội dung.
        </p>
      </header>

      {courses.length === 0 ? (
        <div className="rounded-2xl border p-6 text-sm text-zinc-500">
          Chưa có khoá học nào.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((c) => {
            const isPremium = c.access === "premium";
            return (
              <Link
                key={c.slug}
                href={`/${locale}/courses/${encodeURIComponent(c.slug)}`}
                className="group relative overflow-hidden rounded-2xl border bg-white/70 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 hover:shadow-lg transition"
              >
                {/* Cover */}
                <div className="p-4">
                  {c.cover ? (
                    <img
                      src={c.cover}
                      alt=""
                      className="h-36 w-full rounded-xl object-cover"
                    />
                  ) : (
                    <CoverFallback title={c.title} />
                  )}
                </div>

                {/* Body */}
                <div className="px-5 pb-5">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="line-clamp-2 font-semibold text-zinc-900 dark:text-zinc-100">
                      {c.title}
                    </h3>
                    <span
                      className={`ml-3 inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] font-semibold ${
                        isPremium
                          ? "border-amber-300 bg-amber-100 text-amber-900"
                          : "border-sky-300 bg-sky-100 text-sky-800"
                      }`}
                      title={isPremium ? "Premium" : "Free"}
                    >
                      {isPremium ? <Lock className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                      {isPremium ? "Premium" : "Free"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm text-zinc-600 dark:text-zinc-300">
                    <span>{c.lessons} bài</span>
                    <span className="inline-flex items-center gap-1 text-zinc-500 group-hover:text-zinc-800 dark:group-hover:text-zinc-200">
                      <PlayCircle className="h-4 w-4" />
                      Xem chi tiết
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}