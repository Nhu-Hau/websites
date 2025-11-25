"use client";

import React from "react";
import PostCard from "./PostCard";
import type { CommunityPost } from "@/types/community.types";
import { useAuth } from "@/context/AuthContext";
import { Flame } from "lucide-react"; // ⭐ icon cho xu hướng
import { useTranslations } from "next-intl";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

interface TrendingClientProps {
  initialPosts?: {
    page: number;
    limit: number;
    total: number;
    items: CommunityPost[];
  };
}

export default function TrendingClient({ initialPosts }: TrendingClientProps) {
  const { user } = useAuth();
  const [posts, setPosts] = React.useState<CommunityPost[]>(
    initialPosts?.items || []
  );
  const [loading, setLoading] = React.useState(false);
  const t = useTranslations("community.trending");

  const handlePostChanged = React.useCallback(() => {
    setLoading(true);
    fetch(`${API_BASE}/api/community/posts/trending?period=24h`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.items) {
          setPosts(data.items);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="mb-2">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {t("header.title")}
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {t("header.description")}
        </p>
      </div>

      {/* Loading state – đồng bộ với các màn community khác */}
      {loading && (
        <div className="flex items-center justify-center py-12 sm:py-16">
          <div className="flex flex-col items-center gap-3">
            <div className="h-7 w-7 sm:h-8 sm:w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent dark:border-sky-400" />
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {t("loading")}
            </p>
          </div>
        </div>
      )}

      {/* List */}
      {!loading && posts.length > 0 ? (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              apiBase={API_BASE}
              onChanged={handlePostChanged}
              currentUserId={user?.id}
            />
          ))}
        </div>
      ) : null}

      {/* Empty state – card giống “Chưa có nhóm phù hợp” */}
      {!loading && posts.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200/80 bg-white/95 px-4 sm:px-6 py-12 sm:py-16 text-center shadow-sm ring-1 ring-black/[0.02] dark:border-zinc-800/80 dark:bg-zinc-900/95">
          <div className="mb-4 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-sky-50 text-sky-500 dark:bg-sky-900/30 dark:text-sky-300">
            <Flame className="h-7 w-7 sm:h-8 sm:w-8" />
          </div>
          <h3 className="mb-1 text-base font-semibold text-zinc-900 dark:text-zinc-50">
            {t("empty.title")}
          </h3>
          <p className="max-w-sm text-sm text-zinc-600 dark:text-zinc-400">
            {t("empty.description")}
          </p>
        </div>
      )}
    </div>
  );
}