/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { Hash, Users, TrendingUp } from "lucide-react";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";
import Link from "next/link";
import { useTranslations } from "next-intl";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export default function ExploreClient() {
  const basePrefix = useBasePrefix();
  const [trendingHashtags, setTrendingHashtags] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const t = useTranslations("community.explore");

  React.useEffect(() => {
    fetch(`${API_BASE}/api/community/hashtags/trending`)
      .then((res) => res.json())
      .then((data) => {
        if (data.items) {
          setTrendingHashtags(data.items);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="mb-2">
        <h1 className="mb-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {t("header.title")}
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {t("header.description")}
        </p>
      </div>

      {/* Trending Hashtags */}
      <section className="rounded-2xl border border-zinc-200/80 bg-white/95 p-5 shadow-sm ring-1 ring-black/[0.02] dark:border-zinc-800/80 dark:bg-zinc-900/95">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-300">
              <Hash className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {t("hashtags.title")}
              </h2>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                {t("hashtags.description")}
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
          </div>
        ) : trendingHashtags.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trendingHashtags.map((tag) => (
              <Link
                key={tag._id}
                href={`${basePrefix}/community/hashtag/${tag.name}`}
                className="group flex flex-col rounded-2xl border border-zinc-200/80 bg-zinc-50/80 p-4 shadow-sm ring-1 ring-black/[0.01] transition-all duration-150 hover:-translate-y-0.5 hover:border-sky-300 hover:bg-white hover:shadow-md dark:border-zinc-800/80 dark:bg-zinc-900/80 dark:hover:border-sky-700"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-sky-600 transition-colors group-hover:text-sky-700 dark:text-sky-400 dark:group-hover:text-sky-300">
                    <Hash className="h-4 w-4" />
                    {tag.name}
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    {t("hashtags.postCount", { count: tag.postsCount })}
                  </span>
                </div>
                {tag.samplePost && (
                  <p className="mt-1 line-clamp-2 text-xs text-zinc-600 dark:text-zinc-400">
                    {tag.samplePost}
                  </p>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-zinc-600 dark:text-zinc-400">
            {t("hashtags.empty")}
          </div>
        )}
      </section>

      {/* Quick Links */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href={`${basePrefix}/community/trending`}
          className="group flex flex-col justify-between rounded-2xl border border-zinc-200/80 bg-gradient-to-br from-blue-500 to-blue-600 p-5 text-white shadow-sm ring-1 ring-blue-500/40 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg dark:border-blue-800/60"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>
          <div>
            <h3 className="mb-1 text-base font-semibold">
              {t("quickLinks.trending.title")}
            </h3>
            <p className="text-xs text-sky-50/90">
              {t("quickLinks.trending.description")}
            </p>
          </div>
        </Link>

        <Link
          href={`${basePrefix}/community/groups`}
          className="
    group flex flex-col justify-between rounded-2xl border 
    border-zinc-200/80 bg-gradient-to-br from-sky-50 to-sky-100 
    p-5 text-zinc-900 shadow-sm ring-1 ring-sky-100/70 
    transition-all duration-150 hover:-translate-y-0.5 
    hover:border-sky-300 hover:bg-white hover:shadow-lg

    /* DARK */
    dark:border-zinc-800/70 
    dark:bg-gradient-to-br dark:from-[#0f172a] dark:via-[#0b1a33] dark:to-[#082032]
    dark:text-zinc-100
    dark:ring-[#4063bb33]
    dark:hover:border-[#4063bb66]
    dark:hover:bg-[#0f1d34]
  "
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <div
              className="
        flex h-10 w-10 items-center justify-center rounded-xl 
        bg-sky-100 text-sky-600 
        dark:bg-[#4063bb33] dark:text-sky-300
      "
            >
              <Users className="h-6 w-6" />
            </div>
          </div>

          <div>
            <h3 className="mb-1 text-base font-semibold text-zinc-900 dark:text-zinc-50">
              {t("quickLinks.groups.title")}
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              {t("quickLinks.groups.description")}
            </p>
          </div>
        </Link>
      </section>
    </div>
  );
}
