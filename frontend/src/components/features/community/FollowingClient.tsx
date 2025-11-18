"use client";

import React from "react";
import PostCard from "./PostCard";
import { useAuth } from "@/context/AuthContext";
import { useInfiniteScroll } from "@/hooks/community/useInfiniteScroll";
import type { CommunityPost } from "@/types/community.types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

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
  const [posts, setPosts] = React.useState<CommunityPost[]>(initialPosts?.items || []);
  const [page, setPage] = React.useState(initialPosts?.page || 1);
  const [loading, setLoading] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(
    initialPosts ? initialPosts.items.length < initialPosts.total : true
  );

  // Set initial posts on mount
  React.useEffect(() => {
    if (initialPosts) {
      setPosts(initialPosts.items || []);
      setPage(initialPosts.page || 1);
      setHasMore((initialPosts.items?.length || 0) < (initialPosts.total || 0));
    }
  }, [initialPosts]);

  // Load posts on mount if we don't have initialPosts or if initialPosts is empty
  React.useEffect(() => {
    if (!user) {
      setPosts([]);
      setHasMore(false);
      setLoading(false);
      return;
    }
    
    // If we have initialPosts with items, use them
    if (initialPosts && initialPosts.items && initialPosts.items.length > 0) {
      setLoading(false);
      return;
    }
    
    // Otherwise, fetch posts
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
        // Try to parse error message
        return res.json().then((err) => {
          console.error("[FollowingClient] Error response:", err);
          return null;
        }).catch(() => null);
      })
      .then((data) => {
        if (data && data.items) {
          setPosts(data.items);
          setPage(data.page || 1);
          setHasMore(data.items.length < data.total);
        } else {
          // If no data or empty items, set empty state
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
  }, [user, initialPosts]); // Include initialPosts to re-fetch if it changes

  const loadMore = React.useCallback(async () => {
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
        setHasMore(data.items.length > 0 && posts.length + data.items.length < data.total);
      } else if (res.status === 401) {
        setPosts([]);
        setHasMore(false);
      }
    } catch (error) {
      console.error("[loadMore] ERROR", error);
    } finally {
      setLoading(false);
    }
  }, [page, loading, hasMore, posts.length, user]);

  const { elementRef } = useInfiniteScroll({
    hasMore,
    loading,
    onLoadMore: loadMore,
  });

  const handlePostChanged = React.useCallback(() => {
    if (!user) return;
    // Reload first page
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
  }, [user]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
          Đang theo dõi
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Bài viết từ những người bạn đang theo dõi
        </p>
      </div>

      {loading && posts.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
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
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent" />
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">
            Chưa có bài viết nào từ những người bạn đang theo dõi
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-500">
            Hãy theo dõi một số người dùng để xem bài viết của họ ở đây
          </p>
        </div>
      )}
    </div>
  );
}


