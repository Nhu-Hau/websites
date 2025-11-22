/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { Hash } from "lucide-react";
import PostCard from "./PostCard";
import { useAuth } from "@/context/AuthContext";
import { useInfiniteScroll } from "@/hooks/community/useInfiniteScroll";
import type { CommunityPost } from "@/types/community.types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

interface HashtagClientProps {
  tag: string;
  initialData?: {
    page: number;
    limit: number;
    total: number;
    items: CommunityPost[];
    hashtag?: any;
  };
}

export default function HashtagClient({ tag, initialData }: HashtagClientProps) {
  const { user } = useAuth();
  const [posts, setPosts] = React.useState<CommunityPost[]>(initialData?.items || []);
  const [page, setPage] = React.useState(initialData?.page || 1);
  const [total, setTotal] = React.useState(initialData?.total || 0);
  const [loading, setLoading] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(
    initialData ? initialData.items.length < initialData.total : true
  );

  const loadMore = React.useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const nextPage = page + 1;
      const res = await fetch(
        `${API_BASE}/api/community/hashtags/${tag}?page=${nextPage}&limit=20`,
        { credentials: "include" }
      );
      if (res.ok) {
        const data = await res.json();
        setPosts((prev) => [...prev, ...data.items]);
        setPage(nextPage);
        setHasMore(data.items.length > 0 && posts.length + data.items.length < data.total);
      }
    } catch (error) {
      console.error("[loadMore] ERROR", error);
    } finally {
      setLoading(false);
    }
  }, [tag, page, loading, hasMore, posts.length]);

  const { elementRef } = useInfiniteScroll({
    hasMore,
    loading,
    onLoadMore: loadMore,
  });

  const handlePostChanged = React.useCallback(() => {
    // Reload first page
    fetch(`${API_BASE}/api/community/hashtags/${tag}?page=1&limit=20`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.items) {
          setPosts(data.items);
          setPage(1);
          setTotal(data.total);
          setHasMore(data.items.length < data.total);
        }
      })
      .catch(console.error);
  }, [tag]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="mb-2">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
            <Hash className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              #{tag}
            </h1>
            {initialData?.hashtag && (
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {initialData.hashtag.postsCount || 0} bài viết
              </p>
            )}
          </div>
        </div>
      </div>

      {posts.length > 0 ? (
        <>
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

          {hasMore && (
            <div ref={elementRef} className="py-8">
              {loading && (
                <div className="flex items-center justify-center">
                  <div className="h-7 w-7 sm:h-8 sm:w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent dark:border-sky-400" />
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200/80 bg-white/95 px-4 sm:px-6 py-12 sm:py-16 text-center shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/95">
          <div className="mb-4 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-sky-50 text-sky-500 dark:bg-sky-900/30 dark:text-sky-300">
            <Hash className="h-7 w-7 sm:h-8 sm:w-8" />
          </div>
          <h3 className="mb-1 text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Chưa có bài viết nào
          </h3>
          <p className="max-w-sm text-sm text-zinc-600 dark:text-zinc-400">
            Chưa có bài viết nào với hashtag này.
          </p>
        </div>
      )}
    </div>
  );
}




