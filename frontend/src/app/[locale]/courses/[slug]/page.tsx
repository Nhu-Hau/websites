"use client";

import React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { apiBase } from "@/lib/api";
import { Lock, PlayCircle, Crown, ArrowLeft, ChevronDown } from "lucide-react";

type Lesson = {
  key: string;
  title: string;
  locked: boolean;
  url?: string;
};

type CourseDetail = {
  title: string;
  lessons: Lesson[];
  access: "premium" | "free";
  hasAccess: boolean;
  cover?: string | null;
};

async function fetchCourse(slug: string, cookieHeader?: string) {
  const base = apiBase();
  const r = await fetch(`${base}/api/courses/${encodeURIComponent(slug)}`, {
    cache: "no-store",
    credentials: "include",
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
  });
  if (!r.ok) return null;
  return (await r.json()) as CourseDetail;
}

function HeroCover({ title, cover }: { title: string; cover?: string | null }) {
  if (cover) {
    return <img src={cover} alt="" className="h-44 w-full rounded-2xl object-cover" />;
  }
  const label = (title?.trim()?.[0] ?? "C").toUpperCase();
  return (
    <div className="flex h-44 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-200 to-sky-200 dark:from-zinc-700 dark:to-zinc-800 text-5xl font-bold text-white">
      {label}
    </div>
  );
}

export default function CourseDetailPage() {
  const { slug, locale } = useParams<{ slug: string; locale: string }>();
  const router = useRouter();

  const [loading, setLoading] = React.useState(true);
  const [detail, setDetail] = React.useState<CourseDetail | null>(null);

  // các bài đang mở rộng để xem video
  const [openSet, setOpenSet] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const base = apiBase();
        const r = await fetch(`${base}/api/courses/${encodeURIComponent(String(slug))}`, {
          cache: "no-store",
          credentials: "include",
        });
        if (!alive) return;
        if (r.status === 401) {
          router.push(`/${locale}/auth/login`);
          return;
        }
        const j = await r.json();
        setDetail(j);
      } catch (e) {
        console.error(e);
        setDetail(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [slug, locale, router]);

  function toggle(id: string) {
    setOpenSet((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (loading) return <div className="mx-auto max-w-5xl p-6 mt-16">Đang tải…</div>;
  if (!detail) return <div className="mx-auto max-w-5xl p-6 mt-16 text-red-600">Không tải được khoá học.</div>;

  const isPremiumCourse = detail.access === "premium";

  return (
    <div className="mx-auto max-w-5xl p-6 mt-16 space-y-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-zinc-500">
        <ol className="flex items-center gap-2">
          <li>
            <Link href={`/${locale}/homePage`} className="hover:underline">
              Trang chủ
            </Link>
          </li>
          <li>›</li>
          <li>
            <Link href={`/${locale}/courses`} className="hover:underline">
              Khoá học
            </Link>
          </li>
          <li>›</li>
          <li className="text-zinc-700 dark:text-zinc-300">{detail.title}</li>
        </ol>
      </nav>

      {/* Hero */}
      <section className="rounded-2xl border p-5 bg-white/70 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700">
        <HeroCover title={detail.title} cover={detail.cover} />
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{detail.title}</h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {detail.lessons.length} bài • {isPremiumCourse ? "Premium" : "Free"}
            </p>
          </div>

          {!detail.hasAccess && isPremiumCourse && (
            <div className="flex gap-2">
              {/* Nâng cấp premium (toàn bộ khóa học đều mở) */}
              <Link
                href={`/${locale}/pricing`}
                className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-white hover:opacity-90"
              >
                <Crown className="h-4 w-4" />
                <p>Nâng cấp Premium</p>
              </Link>
              {/* Mua riêng khóa này → tới trang thanh toán VietQR */}
              <Link
                href={`/${locale}/checkout?course=${encodeURIComponent(String(slug))}`}
                className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-700"
              >
                Mua khoá học
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Lessons (accordion, chỉ render video khi mở) */}
      <section className="rounded-2xl border p-5 bg-white/70 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700">
        <h2 className="mb-3 text-lg font-semibold">Nội dung khoá học</h2>

        {detail.lessons.length === 0 ? (
          <div className="text-sm text-zinc-500">Chưa có bài học.</div>
        ) : (
          <ul className="space-y-3">
            {detail.lessons.map((ls, i) => {
              const id = ls.key || String(i);
              const locked = ls.locked || !detail.hasAccess;
              const opened = openSet.has(id);

              return (
                <li key={id} className="rounded-xl border">
                  <button
                    className="w-full flex items-center justify-between px-4 py-3"
                    onClick={() => !locked && toggle(id)}
                    disabled={locked}
                  >
                    <div className="min-w-0 text-left">
                      <div className="truncate font-medium">
                        {i + 1}. {ls.title}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {locked ? "Đã khoá" : opened ? "Đang mở" : "Nhấn để xem"}
                      </div>
                    </div>
                    <div className="ml-3 flex items-center gap-2">
                      {locked ? (
                        <span className="inline-flex items-center gap-1 text-xs rounded-lg border bg-amber-50 px-2 py-1 text-amber-900">
                          <Lock className="h-3.5 w-3.5" />
                          Cần mua/Premium
                        </span>
                      ) : (
                        <ChevronDown className={`h-4 w-4 transition ${opened ? "rotate-180" : ""}`} />
                      )}
                    </div>
                  </button>

                  {/* Panel chỉ render khi mở */}
                  {!locked && opened && (
                    <div className="border-t px-4 py-3">
                      {ls.url ? (
                        <div className="flex items-center gap-2">
                          <PlayCircle className="h-5 w-5 text-zinc-600" />
                          <video className="w-full rounded-lg" controls preload="metadata" src={ls.url} />
                        </div>
                      ) : (
                        <div className="text-sm text-zinc-500">
                          Chưa có liên kết video. Tải lại trang sau một lúc.
                        </div>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div>
        <Link
          href={`/${locale}/courses`}
          className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại danh sách
        </Link>
      </div>
    </div>
  );
}