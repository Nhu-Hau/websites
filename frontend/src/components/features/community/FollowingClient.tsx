"use client";

import React from "react";
import PostCard from "./PostCard";
import { useAuth } from "@/context/AuthContext";
import { useInfiniteScroll } from "@/hooks/community/useInfiniteScroll";
import type { CommunityPost } from "@/types/community.types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

interface FollowingClientProps {
  initialPosts?: {
    page: number;
    limit: number;
    total: number;
    items: CommunityPost[];
  };
}

export default function FollowingClient({ initialPosts }: FollowingClientProps) {
  const { user } = useAuth();
  const [posts, setPosts] = React.useState<CommunityPost[]>(
    initialPosts?.items || []
  );
  const [page, setPage] = React.useState(initialPosts?.page || 1);
  const [loading, setLoading] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(
    initialPosts ? initialPosts.items.length < initialPosts.total : true
  );

  React.useEffect(() => {
    if (initialPosts) {
      setPosts(initialPosts.items || []);
      setPage(initialPosts.page || 1);
      setHasMore(
        (initialPosts.items?.length || 0) < (initialPosts.total || 0)
      );
    }
  }, [initialPosts]);

  React.useEffect(() => {
    if (!user) {
      setPosts([]);
      setHasMore(false);
      setLoading(false);
      return;
    }

    if (initialPosts && initialPosts.items && initialPosts.items.length > 0) {
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`${API_BASE}/api/community/posts/following?page=1&limit=20`, {
      credentials: "include",
      cache: "no-store",
    })
      .then((res) => {
        if (res.ok) return res.json();
        if (res.status === 401) {
          setPosts([]);
          setHasMore(false);
          return null;
        }
        return res
          .json()
          .then((err) => {
            console.error("[FollowingClient] Error response:", err);
            return null;
          })
          .catch(() => null);
      })
      .then((data) => {
        if (data && data.items) {
          setPosts(data.items);
          setPage(data.page || 1);
          setHasMore(data.items.length < data.total);
        } else {
          setPosts([]);
          setHasMore(false);
        }
      })
      .catch((err) => {
        console.error("[FollowingClient] Load error:", err);
        setPosts([]);
        setHasMore(false);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user, initialPosts]);

  const loadMore = React.useCallback(
    async () => {
      if (loading || !hasMore || !user) return;

      setLoading(true);
      try {
        const nextPage = page + 1;
        const res = await fetch(
          `${API_BASE}/api/community/posts/following?page=${nextPage}&limit=20`,
          { credentials: "include" }
        );
        if (res.ok) {
          const data = await res.json();
          setPosts((prev) => [...prev, ...data.items]);
          setPage(nextPage);
          setHasMore(
            data.items.length > 0 &&
              posts.length + data.items.length < data.total
          );
        } else if (res.status === 401) {
          setPosts([]);
          setHasMore(false);
        }
      } catch (error) {
        console.error("[loadMore] ERROR", error);
      } finally {
        setLoading(false);
      }
    },
    [page, loading, hasMore, posts.length, user]
  );

  const { elementRef } = useInfiniteScroll({
    hasMore,
    loading,
    onLoadMore: loadMore,
  });

  const handlePostChanged = React.useCallback(
    () => {
      if (!user) return;
      fetch(`${API_BASE}/api/community/posts/following?page=1&limit=20`, {
        credentials: "include",
      })
        .then((res) => {
          if (res.ok) return res.json();
          if (res.status === 401) {
            setPosts([]);
            setHasMore(false);
          }
          return null;
        })
        .then((data) => {
          if (data && data.items) {
            setPosts(data.items);
            setPage(1);
            setHasMore(data.items.length < data.total);
          }
        })
        .catch(console.error);
    },
    [user]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-2">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Đang theo dõi
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Bài viết mới nhất từ những tài khoản bạn quan tâm
        </p>
      </div>

      {/* List / states */}
      {loading && posts.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Đang tải bài viết...
            </p>
          </div>
        </div>
      ) : posts.length > 0 ? (
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
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-zinc-200/80 bg-white/95 py-12 text-center shadow-sm ring-1 ring-black/[0.02] dark:border-zinc-800/80 dark:bg-zinc-900/95">
          <p className="mb-2 text-sm font-medium text-zinc-800 dark:text-zinc-100">
            Chưa có bài viết nào từ những người bạn đang theo dõi
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Hãy theo dõi thêm một số người dùng để xem bài viết của họ tại đây.
          </p>
        </div>
      )}
    </div>
  );
}