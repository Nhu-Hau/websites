"use client";

import React from "react";
import PostCard from "./PostCard";
import type { CommunityPost } from "@/types/community.types";
import { useAuth } from "@/context/AuthContext";

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
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-2">
        <h1 className="mb-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Xu hướng
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Những bài viết được tương tác nhiều nhất trong 24 giờ qua.
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
        </div>
      )}

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
      ) : !loading ? (
        <div className="rounded-2xl border border-dashed border-zinc-200/80 bg-white/95 py-12 text-center text-sm text-zinc-600 shadow-sm ring-1 ring-black/[0.02] dark:border-zinc-800/80 dark:bg-zinc-900/95 dark:text-zinc-400">
          Chưa có bài viết nào trong xu hướng.
        </div>
      ) : null}
    </div>
  );
}