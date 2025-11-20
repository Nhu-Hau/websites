"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Newspaper, ChevronLeft, ChevronRight } from "lucide-react";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";
import { cn } from "@/lib/utils";

interface NewsItem {
  _id: string;
  title: string;
  category: string;
  image: string;
  publishedAt: string;
  viewCount: number;
}

const CATEGORIES = [
  "all",
  "education",
  "politics",
  "travel",
  "technology",
  "sports",
  "entertainment",
  "business",
  "society",
  "health",
  "culture",
];

const PAGE_SIZE = 9;

const CATEGORY_LABELS: Record<string, string> = {
  all: "Tất cả",
  education: "Giáo dục",
  politics: "Chính trị",
  travel: "Du lịch",
  technology: "Công nghệ",
  sports: "Thể thao",
  entertainment: "Giải trí",
  business: "Kinh doanh",
  society: "Xã hội",
  health: "Sức khỏe",
  culture: "Văn hóa",
};

const NEWS_COPY = {
  badge: "Cộng đồng luyện thi",
  title: "Tin tức & bài viết",
  subtitle:
    "Cập nhật liên tục xu hướng, kinh nghiệm và tài liệu luyện thi TOEIC từ cộng đồng.",
  errorLoading: "Không thể tải bài viết. Vui lòng thử lại.",
  noNewsTitle: "Chưa có bài viết",
  noNewsDescription:
    "Chúng tôi sẽ cập nhật thêm các tin tức mới nhất về TOEIC trong thời gian tới.",
  viewsLabel: "lượt xem",
  previous: "Trước",
  next: "Tiếp",
  previousAria: "Trang trước",
  nextAria: "Trang tiếp theo",
};

export function NewsListClient() {
  const basePrefix = useBasePrefix();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchNews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: PAGE_SIZE.toString(),
      });

      if (selectedCategory !== "all") {
        params.append("category", selectedCategory);
      }

      const response = await fetch(`/api/news?${params.toString()}`, {
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to fetch news");

      const data = await response.json();
      setNews(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err) {
      console.error("Error fetching news:", err);
      setError(NEWS_COPY.errorLoading);
    } finally {
      setLoading(false);
    }
  }, [page, selectedCategory]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  const getCategoryLabel = useCallback(
    (category: string) =>
      CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] ?? category,
    []
  );

  const getImageUrl = (s3Url: string) => {
    // Convert s3://project.toeic/news/...jpg to public URL
    return s3Url.replace(
      "s3://project.toeic/",
      `${process.env.NEXT_PUBLIC_S3_PUBLIC_URL || "https://project.toeic.s3.ap-southeast-2.amazonaws.com"}/`
    );
  };

  const categoryChips = useMemo(
    () =>
      CATEGORIES.map((category) => {
        const active = selectedCategory === category;
        return (
          <button
            key={category}
            type="button"
            onClick={() => {
              setSelectedCategory(category);
              setPage(1);
            }}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition",
              active
                ? "border-[#2E5EB8] bg-[#2E5EB8]/10 text-[#2E5EB8] dark:border-[#2E5EB8]/70 dark:bg-[#2E5EB8]/25 dark:text-[#E3ECFF]"
                : "border-zinc-200 text-zinc-600 hover:border-[#2E5EB8]/40 hover:text-[#2E5EB8] dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-[#2E5EB8]/60 dark:hover:text-[#E3ECFF]"
            )}
          >
            {getCategoryLabel(category)}
          </button>
        );
      }),
    [selectedCategory, getCategoryLabel]
  );

  const renderCards = () => {
    if (loading) {
      return (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-zinc-200/80 bg-white/95 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/90 p-4 animate-pulse space-y-4"
            >
              <div className="h-40 rounded-xl bg-zinc-200/60 dark:bg-zinc-800" />
              <div className="space-y-2">
                <div className="h-4 rounded bg-zinc-200/60 dark:bg-zinc-800" />
                <div className="h-3 rounded bg-zinc-200/60 dark:bg-zinc-800" />
                <div className="h-3 w-3/4 rounded bg-zinc-200/60 dark:bg-zinc-800" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (!news.length) {
      return (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200/80 bg-white/95 px-6 py-16 text-center shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/95">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sky-50 text-sky-500 dark:bg-sky-900/30 dark:text-sky-300">
            <Newspaper className="h-7 w-7" />
          </div>
          <h3 className="mb-1 text-base font-semibold text-zinc-900 dark:text-zinc-50">
            {NEWS_COPY.noNewsTitle}
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-sm">
            {NEWS_COPY.noNewsDescription}
          </p>
        </div>
      );
    }

    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {news.map((item) => (
          <Link
            key={item._id}
            href={`${basePrefix}/news/${item._id}`}
            className={cn(
              "group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/95 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-zinc-800/80 dark:bg-zinc-900/85"
            )}
          >
            <div className="relative h-48 w-full overflow-hidden sm:h-56">
              <img
                src={getImageUrl(item.image)}
                alt={item.title}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                onError={(e) => {
                  e.currentTarget.src =
                    "https://via.placeholder.com/400x300?text=News";
                }}
                loading="lazy"
              />
              <span className="absolute left-4 top-4 rounded-full bg-sky-600/90 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                {getCategoryLabel(item.category)}
              </span>
            </div>

            <div className="flex flex-1 flex-col p-4 sm:p-5">
              <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {new Date(item.publishedAt).toLocaleDateString()}
              </p>
              <h3 className="mt-2 text-lg font-semibold text-zinc-900 transition group-hover:text-sky-700 dark:text-white dark:group-hover:text-sky-300 line-clamp-2">
                {item.title}
              </h3>
              <div className="mt-auto pt-4 text-sm text-zinc-500 dark:text-zinc-400">
                {new Intl.NumberFormat().format(item.viewCount)}{" "}
                {NEWS_COPY.viewsLabel}
              </div>
            </div>
          </Link>
        ))}
      </div>
    );
  };

  return (
    <section className="min-h-screen bg-zinc-50 px-4 pb-16 pt-20 dark:bg-zinc-950">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-600 dark:text-sky-400">
            {NEWS_COPY.badge}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {NEWS_COPY.title}
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-2xl">
            {NEWS_COPY.subtitle}
          </p>
        </header>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="rounded-2xl border border-zinc-200/80 bg-white/95 p-4 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/90">
          <div className="flex flex-wrap gap-2">{categoryChips}</div>
        </div>

        {renderCards()}

        {totalPages > 1 && (
          <div className="flex justify-center pt-2">
            <div className="inline-flex items-center gap-3 rounded-2xl border border-zinc-200/80 bg-white/95 px-3 py-2 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/90">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200/80 text-zinc-600 transition hover:border-sky-500 hover:text-sky-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-sky-400 dark:hover:text-sky-300"
                aria-label={NEWS_COPY.previousAria}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                {page} / {totalPages}
              </div>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200/80 text-zinc-600 transition hover:border-sky-500 hover:text-sky-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-sky-400 dark:hover:text-sky-300"
                aria-label={NEWS_COPY.nextAria}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}



