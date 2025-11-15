"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";

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

export function NewsListClient() {
  const t = useTranslations();
  const basePrefix = useBasePrefix();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchNews();
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

      const response = await fetch(`/api/news?${params}`, {
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

  const getCategoryLabel = (category: string) => {
    return t(`news.category.${category}`, { default: category });
  };

  const getImageUrl = (s3Url: string) => {
    // Convert s3://project.toeic/news/...jpg to public URL
    return s3Url.replace(
      "s3://project.toeic/",
      `${process.env.NEXT_PUBLIC_S3_PUBLIC_URL || "https://project.toeic.s3.ap-southeast-2.amazonaws.com"}/`
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 pt-20">
      <div className="container mx-auto px-4 max-w-7xl">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
          {t("news.title", { default: "News & Articles" })}
        </h1>

        {/* Category Filter */}
        <div className="mb-8 flex flex-wrap gap-2">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => {
                setSelectedCategory(category);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedCategory === category
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              {getCategoryLabel(category)}
            </button>
          ))}
        </div>

        {/* News Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden animate-pulse"
              >
                <div className="w-full h-48 bg-gray-300 dark:bg-gray-700" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4" />
                  <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-full" />
                  <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-5/6" />
                </div>
              </div>
            ))}
          </div>
        ) : news.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              {t("news.noNews", { default: "No news available" })}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {news.map((item) => (
              <Link
                key={item._id}
                href={`${basePrefix}/news/${item._id}`}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="relative w-full h-48">
                  <img
                    src={getImageUrl(item.image)}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "https://via.placeholder.com/400x300?text=News";
                    }}
                  />
                  <span className="absolute top-2 left-2 px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
                    {getCategoryLabel(item.category)}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                    {item.title}
                  </h3>
                  <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                    <span>
                      {new Date(item.publishedAt).toLocaleDateString()}
                    </span>
                    <span>{item.viewCount} views</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {t("news.previous", { default: "Previous" })}
            </button>
            <span className="px-4 py-2 bg-blue-600 text-white rounded-lg">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {t("news.next", { default: "Next" })}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


