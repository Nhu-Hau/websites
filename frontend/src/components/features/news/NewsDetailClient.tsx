"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { TranslationProvider } from "./TranslationProvider";
import { PremiumGuard } from "./PremiumGuard";

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

export function NewsDetailClient({ newsId }: NewsDetailClientProps) {
  const t = useTranslations();
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
    return t(`news.category.${category}`, { default: category });
  };

  const getImageUrl = (s3Url: string) => {
    return s3Url.replace(
      "s3://project.toeic/",
      `${process.env.NEXT_PUBLIC_S3_PUBLIC_URL || "https://project.toeic.s3.ap-southeast-2.amazonaws.com"}/`
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 animate-pulse">
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-4" />
            <div className="h-64 bg-gray-300 dark:bg-gray-700 rounded mb-8" />
            <div className="space-y-3">
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded" />
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded" />
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-5/6" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!news) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            {t("news.notFound", { default: "News not found" })}
          </p>
        </div>
      </div>
    );
  }

  const isPremium = user?.access === "premium";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          {/* Header */}
          <div className="relative">
            <img
              src={getImageUrl(news.image)}
              alt={news.title}
              className="w-full h-96 object-cover"
              onError={(e) => {
                e.currentTarget.src = "https://via.placeholder.com/800x400?text=News";
              }}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
              <span className="inline-block px-3 py-1 bg-blue-600 text-white text-sm font-semibold rounded-full mb-4">
                {getCategoryLabel(news.category)}
              </span>
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                {news.title}
              </h1>
              <div className="flex gap-4 text-sm text-gray-200 mt-2">
                <span>{new Date(news.publishedAt).toLocaleDateString()}</span>
                <span>{news.viewCount} views</span>
              </div>
            </div>
          </div>

          {/* Premium Banner */}
          {!isPremium && (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-l-4 border-yellow-500 p-4">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                💎 {t("news.premiumHint", { 
                  default: "Upgrade to Premium to access word translation and vocabulary features!" 
                })}
              </p>
            </div>
          )}

          {/* Content with Translation */}
          <div className="p-8">
            <TranslationProvider isPremium={isPremium}>
              <div className="prose prose-lg dark:prose-invert max-w-none space-y-6">
                {news.paragraphs.map((paragraph, index) => (
                  <p
                    key={index}
                    className="text-gray-700 dark:text-gray-300 leading-relaxed text-justify"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </TranslationProvider>
          </div>
        </div>
      </div>

      {/* Premium Guard Modal (shown when non-premium user tries to use features) */}
      <PremiumGuard />
    </div>
  );
}


