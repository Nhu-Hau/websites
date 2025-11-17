"use client";

import React from "react";
import PostCard from "./PostCard";
import type { CommunityPost } from "@/types/community.types";
import { useAuth } from "@/context/AuthContext";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

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
  const [posts, setPosts] = React.useState<CommunityPost[]>(initialPosts?.items || []);
  const [loading, setLoading] = React.useState(false);

  const handlePostChanged = React.useCallback(() => {
    // Reload trending posts
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
    <div className="max-w-2xl mx-auto px-4 py-8 pt-20">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
          Xu hướng
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Những bài viết đang được quan tâm nhất trong 24 giờ qua
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
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
        <div className="text-center py-12 text-zinc-600 dark:text-zinc-400">
          Chưa có bài viết nào trong xu hướng
        </div>
      ) : null}
    </div>
  );
}


