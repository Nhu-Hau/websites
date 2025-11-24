"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";
import {
  Newspaper,
  Eye,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
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

/* ------------------------------- HEADER UI ------------------------------- */

function NewsHeader({
  totalNews,
  selectedCategory,
}: {
  totalNews: number;
  selectedCategory: string;
}) {
  return (
    <header className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/90 px-4 py-4 shadow-xl shadow-slate-900/5 ring-1 ring-slate-900/5 backdrop-blur-xl xs:px-5 xs:py-5 sm:px-6 sm:py-6 dark:border-zinc-800/60 dark:bg-zinc-900/90 dark:shadow-black/20">
      {/* background soft gradient */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#4063bb0f] via-sky-200/30 to-emerald-100/20 dark:from-[#4063bb22] dark:via-sky-500/5 dark:to-emerald-500/5" />
      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#4063bb26] blur-[120px] dark:bg-[#4063bb33]" />

      <div className="relative z-10 space-y-5">
        {/* Pill + icon */}
        <div className="inline-flex items-center gap-3 rounded-2xl border border-white/70 bg-white/80 px-3 py-2 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/80">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4063bb] to-sky-500 shadow-lg shadow-[#4063bb4d] xs:h-10 xs:w-10">
            <Newspaper className="h-4 w-4 text-white xs:h-5 xs:w-5" />
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.26em] text-slate-500 dark:text-zinc-400 xs:text-[11px]">
            Reading lab
          </div>
        </div>

        {/* Title + desc */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 xs:text-3xl sm:text-[32px] sm:leading-tight dark:text-white">
            Đọc báo luyện tiếng Anh
          </h1>
          <p className="max-w-2xl text-[13px] leading-relaxed text-slate-600 xs:text-sm dark:text-zinc-300">
            Chọn một bài báo tiếng Anh, đọc trong ngữ cảnh và nhấn vào từ để xem
            nghĩa, lưu từ mới. Thiết kế tối ưu cho việc học từ vựng trong ngữ cảnh
            thực tế.
          </p>
        </div>

        {/* Stats row */}
        <div className="flex w-fit gap-2 overflow-x-auto pb-1">
          <MiniStat
            icon={<Newspaper className="h-3.5 w-3.5" />}
            label="Tổng bài: "
            value={totalNews}
          />
          {selectedCategory !== "all" && (
            <MiniStat
              icon={<Filter className="h-3.5 w-3.5" />}
              label="Danh mục: "
              value={selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}
            />
          )}
        </div>
      </div>
    </header>
  );
}

/* ----------------------------- MINI STAT BADGE ---------------------------- */

function MiniStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="inline-flex w-fit flex-1 items-center gap-2 rounded-2xl border border-white/70 bg-white/80 px-3 py-2 text-[11px] font-medium text-slate-600 shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900/80 dark:text-zinc-200 whitespace-nowrap">
      <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#4063bb]/10 text-[#4063bb] dark:bg-[#4063bb]/20 dark:text-sky-200">
        {icon}
      </span>
      <span className="flex items-center gap-1">
        {label}
        <span className="font-semibold text-slate-900 dark:text-white">
          {value}
        </span>
      </span>
    </div>
  );
}

/* ------------------------------ FILTER CHIP ------------------------------- */

function FilterChip({
  icon,
  label,
  active,
  onClick,
}: {
  icon?: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4063bb]/40 shadow-sm xs:px-4 xs:py-2.5",
        active
          ? "border-transparent bg-gradient-to-br from-[#4063bb] to-sky-500 text-white shadow-lg shadow-[#4063bb]/30 hover:shadow-xl hover:shadow-[#4063bb]/40 hover:scale-105 active:scale-95"
          : "border-[#4063bb]/20 bg-white/95 text-[#4063bb] hover:border-[#4063bb]/40 hover:bg-gradient-to-br hover:from-[#4063bb]/10 hover:to-sky-500/10 hover:shadow-md hover:scale-105 active:scale-95 dark:border-[#4063bb]/30 dark:bg-zinc-900/95 dark:text-sky-300 dark:hover:bg-[#4063bb]/10"
      )}
    >
      {icon}
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
}

/* ---------------------------- NEWS CARD ---------------------------- */

function NewsCard({ item, basePrefix }: { item: NewsItem; basePrefix: string }) {
  const getImageUrl = (s3Url: string) => {
    return s3Url.replace(
      "s3://project.toeic/",
      `${
        process.env.NEXT_PUBLIC_S3_PUBLIC_URL ||
        "https://project.toeic.s3.ap-southeast-2.amazonaws.com"
      }/`
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };
  const placeholder = "https://via.placeholder.com/400x300?text=News";
  const [imgSrc, setImgSrc] = useState(() => getImageUrl(item.image));

  return (
    <Link
      href={`${basePrefix}/news/${item._id}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-white/80 bg-white/95 text-slate-900 shadow-md shadow-slate-900/5 transition backdrop-blur-xl hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#1f2a420f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4063bb] dark:border-zinc-800/80 dark:bg-zinc-900/90 dark:text-zinc-50 dark:hover:shadow-black/40"
    >
      {/* accent line */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#4063bb] via-sky-400 to-emerald-300 opacity-80" />
      <div className="pointer-events-none absolute -right-10 top-4 h-20 w-20 rounded-full bg-[#4063bb1a] blur-3xl dark:bg-[#4063bb33]" />

      {/* Image */}
      <div className="relative h-48 w-full overflow-hidden xs:h-56">
        <Image
          src={imgSrc}
          alt={item.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-110"
          sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
          onError={() => setImgSrc(placeholder)}
          unoptimized
          priority={false}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <span className="absolute top-3 left-3 px-3 py-1 bg-gradient-to-r from-[#4063bb] to-[#2d4c9b] text-white text-xs font-semibold rounded-full shadow-lg backdrop-blur-sm">
          {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-3 xs:p-4">
        <h3 className="text-sm xs:text-base font-semibold text-slate-900 mb-2 xs:mb-3 line-clamp-2 group-hover:text-[#4063bb] transition-colors dark:text-zinc-50 dark:group-hover:text-sky-300">
          {item.title}
        </h3>
        <div className="flex items-center justify-between gap-3 text-[10px] xs:text-xs text-slate-500 dark:text-zinc-400 mt-auto">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3 w-3 xs:h-3.5 xs:w-3.5" />
            <span>{formatDate(item.publishedAt)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Eye className="h-3 w-3 xs:h-3.5 xs:w-3.5" />
            <span>{item.viewCount.toLocaleString("vi-VN")}</span>
          </div>
        </div>
        <p className="mt-2 text-[10px] xs:text-xs text-slate-500 dark:text-zinc-400 line-clamp-1">
          Nhấn để đọc bài và học từ mới trực tiếp trên văn bản.
        </p>
      </div>
    </Link>
  );
}

/* ---------------------------- MAIN COMPONENT ---------------------------- */

export function NewsListClient() {
  const basePrefix = useBasePrefix();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchNews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, page]);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
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
    } catch (error) {
      console.error("Error fetching news:", error);
    } finally {
      setLoading(false);
    }
  };


  return (
    <section className="relative min-h-screen overflow-hidden bg-slate-50 pb-16 dark:bg-zinc-950 pt-20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(64,99,187,0.16),_rgba(15,23,42,0)_55%)] dark:bg-[radial-gradient(circle_at_top,_rgba(64,99,187,0.24),_rgba(3,7,18,0)_65%)]" />
      <div className="relative mx-auto max-w-6xl space-y-5 px-4 xs:px-5">
        {/* HEADER */}
        <NewsHeader
          totalNews={news.length}
          selectedCategory={selectedCategory}
        />

        {/* Category Buttons */}
        <div className="flex flex-wrap gap-2.5 xs:gap-3">
          {CATEGORIES.map((category) => (
            <FilterChip
              key={category}
              icon={category === "all" ? <Filter className="h-3.5 w-3.5" /> : undefined}
              label={category.charAt(0).toUpperCase() + category.slice(1)}
              active={selectedCategory === category}
              onClick={() => {
                setSelectedCategory(category);
                setPage(1);
              }}
            />
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 xs:gap-6 py-6 xs:py-8 sm:py-10">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm rounded-xl shadow-md overflow-hidden animate-pulse border border-zinc-200/70 dark:border-zinc-700/70"
              >
                <div className="w-full h-48 bg-zinc-200 dark:bg-zinc-700" />
                <div className="p-4 xs:p-5 space-y-3">
                  <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4" />
                  <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-full" />
                  <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-5/6" />
                </div>
              </div>
            ))}
          </div>
        ) : news.length === 0 ? (
          <div className="py-6 xs:py-8 sm:py-10">
            <div className="rounded-3xl border border-white/80 bg-white/90 p-8 xs:p-10 sm:p-12 text-center shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-zinc-800/60 dark:bg-zinc-900/90">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 mb-4">
              <Newspaper className="h-8 w-8 text-zinc-400 dark:text-zinc-500" />
            </div>
              <p className="text-base xs:text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
                Chưa có bài đọc nào
            </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Thử chuyển sang danh mục khác để tiếp tục luyện đọc và học từ vựng.
            </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 xs:gap-6">
            {news.map((item) => (
              <NewsCard key={item._id} item={item} basePrefix={basePrefix} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 xs:mt-10 flex items-center justify-center gap-2 xs:gap-3">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="inline-flex h-10 w-10 xs:h-11 xs:w-11 items-center justify-center rounded-xl border border-[#4063bb]/20 bg-white/90 text-[#4063bb] transition-all duration-200 hover:border-[#4063bb]/40 hover:bg-gradient-to-br hover:from-[#4063bb]/10 hover:to-sky-500/10 hover:shadow-md hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none dark:border-[#4063bb]/30 dark:bg-zinc-900/80 dark:text-sky-300"
              aria-label="Trang trước"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-1.5 xs:gap-2 px-3 xs:px-4">
              <span className="text-xs xs:text-sm font-semibold text-slate-700 dark:text-zinc-300">
                Trang
              </span>
              <span className="inline-flex h-10 xs:h-11 min-w-[2.5rem] xs:min-w-[3rem] items-center justify-center rounded-xl bg-gradient-to-br from-[#4063bb] to-sky-500 text-white text-sm font-bold shadow-lg shadow-[#4063bb]/30">
                {page}
              </span>
              <span className="text-xs xs:text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                / {totalPages}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="inline-flex h-10 w-10 xs:h-11 xs:w-11 items-center justify-center rounded-xl border border-[#4063bb]/20 bg-white/90 text-[#4063bb] transition-all duration-200 hover:border-[#4063bb]/40 hover:bg-gradient-to-br hover:from-[#4063bb]/10 hover:to-sky-500/10 hover:shadow-md hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none dark:border-[#4063bb]/30 dark:bg-zinc-900/80 dark:text-sky-300"
              aria-label="Trang sau"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
