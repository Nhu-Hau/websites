"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { TranslationProvider } from "./TranslationProvider";
import { PremiumGuard } from "./PremiumGuard";
import { ArrowLeft, Calendar, Eye, Sparkles, Newspaper } from "lucide-react";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";
import { cn } from "@/lib/utils";

interface NewsItem {
  _id: string;
  title: string;
  category: string;
  image: string;
  paragraphs: string[];
  publishedAt: string;
  viewCount: number;
}

interface NewsDetailClientProps {
  newsId: string;
}

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

export function NewsDetailClient({ newsId }: NewsDetailClientProps) {
  const router = useRouter();
  const basePrefix = useBasePrefix();
  const { user } = useAuth();
  const [news, setNews] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNews();
  }, [newsId]);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/news/${newsId}`, {
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to fetch news");

      const data = await response.json();
      setNews(data.data);
    } catch (error) {
      console.error("Error fetching news:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryLabel = (category: string) => {
    return CATEGORY_LABELS[category] || category;
  };

  const getImageUrl = (s3Url: string) => {
    return s3Url.replace(
      "s3://project.toeic/",
      `${process.env.NEXT_PUBLIC_S3_PUBLIC_URL || "https://project.toeic.s3.ap-southeast-2.amazonaws.com"}/`
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const handleBack = () => {
    router.push(`${basePrefix}/news`);
  };

  if (loading) {
    return (
      <section className="relative min-h-screen overflow-hidden bg-slate-50 pb-16 dark:bg-zinc-950 pt-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(64,99,187,0.16),_rgba(15,23,42,0)_55%)] dark:bg-[radial-gradient(circle_at_top,_rgba(64,99,187,0.24),_rgba(3,7,18,0)_65%)]" />
        <div className="relative mx-auto max-w-4xl px-4 xs:px-5 py-6 xs:py-8">
          <div className="rounded-3xl border border-white/80 bg-white/90 p-6 xs:p-8 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-zinc-800/60 dark:bg-zinc-900/90 animate-pulse">
            <div className="h-8 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4 mb-4" />
            <div className="h-64 xs:h-80 bg-zinc-200 dark:bg-zinc-700 rounded-xl mb-8" />
            <div className="space-y-3">
              <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded" />
              <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded" />
              <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-5/6" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!news) {
    return (
      <section className="relative min-h-screen overflow-hidden bg-slate-50 pb-16 dark:bg-zinc-950 pt-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(64,99,187,0.16),_rgba(15,23,42,0)_55%)] dark:bg-[radial-gradient(circle_at_top,_rgba(64,99,187,0.24),_rgba(3,7,18,0)_65%)]" />
        <div className="relative mx-auto max-w-4xl px-4 xs:px-5 py-6 xs:py-8">
          <div className="rounded-3xl border border-white/80 bg-white/90 p-8 xs:p-10 sm:p-12 text-center shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-zinc-800/60 dark:bg-zinc-900/90">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 mb-4">
              <Eye className="h-8 w-8 text-zinc-400 dark:text-zinc-500" />
            </div>
            <p className="text-lg xs:text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
              Không tìm thấy bài viết
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
              Bài viết này có thể đã bị xóa hoặc không tồn tại
            </p>
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-2 rounded-xl border border-[#4063bb]/20 bg-gradient-to-br from-[#4063bb] to-sky-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#4063bb]/30 transition-all duration-200 hover:shadow-xl hover:shadow-[#4063bb]/40 hover:scale-105 active:scale-95 dark:border-[#4063bb]/30"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại danh sách
            </button>
          </div>
        </div>
      </section>
    );
  }

  const isPremium = user?.access === "premium";

  return (
    <section className="relative min-h-screen overflow-hidden bg-slate-50 pb-16 dark:bg-zinc-950 pt-16 md:pt-20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(64,99,187,0.16),_rgba(15,23,42,0)_55%)] dark:bg-[radial-gradient(circle_at_top,_rgba(64,99,187,0.24),_rgba(3,7,18,0)_65%)]" />
      <div className="relative mx-auto max-w-6xl space-y-5 px-4 xs:px-5">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl border border-white/70 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:text-[#4063bb] xs:px-4 xs:text-sm dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </button>

        {/* Main Article Card */}
        <div className="rounded-3xl border border-white/80 bg-white/90 shadow-xl shadow-slate-900/5 ring-1 ring-slate-900/5 backdrop-blur-xl overflow-hidden dark:border-zinc-800/60 dark:bg-zinc-900/90 dark:shadow-black/20">
          {/* Header Image */}
          <div className="relative w-full h-64 xs:h-80 md:h-96 overflow-hidden">
            <img
              src={getImageUrl(news.image)}
              alt={news.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = "https://via.placeholder.com/800x400?text=News";
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 xs:p-8">
              <span className="inline-block px-4 py-1.5 bg-gradient-to-r from-[#4063bb] to-[#2d4c9b] text-white text-xs xs:text-sm font-semibold rounded-full mb-4 shadow-lg backdrop-blur-sm">
                {getCategoryLabel(news.category)}
              </span>
              <h1 className="text-2xl xs:text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
                {news.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-200">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(news.publishedAt)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Eye className="h-4 w-4" />
                  <span>{news.viewCount.toLocaleString("vi-VN")} lượt xem</span>
                </div>
              </div>
            </div>
          </div>

          {/* Premium Banner */}
          {!isPremium && (
            <div className="relative overflow-hidden border-b border-amber-200/50 dark:border-amber-900/30 bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-950/30 dark:via-yellow-950/30 dark:to-orange-950/30 p-4 xs:p-5">
              <div className="pointer-events-none absolute -right-10 top-4 h-20 w-20 rounded-full bg-amber-400/20 blur-3xl dark:bg-amber-500/10" />
              <div className="relative flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm xs:text-base font-semibold text-zinc-900 dark:text-zinc-50 mb-1">
                    Nâng cấp lên Premium
                  </p>
                  <p className="text-xs xs:text-sm text-zinc-700 dark:text-zinc-300">
                    Truy cập tính năng dịch từ và lưu từ vựng khi đọc bài viết!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Content with Translation */}
          <div className="p-6 xs:p-8 md:p-10">
            <TranslationProvider isPremium={isPremium}>
              <div className="prose prose-lg dark:prose-invert max-w-none space-y-5 xs:space-y-6">
                {news.paragraphs.map((paragraph, index) => (
                  <p
                    key={index}
                    className="text-base xs:text-lg text-zinc-700 dark:text-zinc-300 leading-relaxed text-justify"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </TranslationProvider>
          </div>
        </div>
      </div>

      {/* Premium Guard Modal */}
      <PremiumGuard />
    </section>
  );
}
