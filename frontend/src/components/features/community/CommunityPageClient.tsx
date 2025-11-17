// frontend/src/components/features/community/CommunityPageClient.tsx
"use client";

import React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import PostCard from "@/components/features/community/PostCard";
import Pagination from "@/components/features/community/Pagination";
import type { CommunityPost } from "@/types/community.types";
import { toast } from "@/lib/toast";
import { getSocket } from "@/lib/socket";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
const PAGE_SIZE = 5;

interface CommunityPageClientProps {
  initialPosts: {
    page: number;
    limit: number;
    total: number;
    items: CommunityPost[];
  };
  initialPage: number;
  currentUserId?: string;
}

export default function CommunityPageClient({
  initialPosts,
  initialPage,
  currentUserId: initialCurrentUserId,
}: CommunityPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [posts, setPosts] = React.useState<CommunityPost[]>(initialPosts.items);
  const [page, setPage] = React.useState(initialPage);
  const [total, setTotal] = React.useState(initialPosts.total);
  const [loading, setLoading] = React.useState(false);
  const [currentUserId] = React.useState<string | undefined>(
    initialCurrentUserId
  );

  const load = React.useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const r = await fetch(
        `${API_BASE}/api/community/posts?page=${p}&limit=${PAGE_SIZE}`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );
      if (!r.ok) throw new Error("Failed to load posts");
      const j = await r.json();
      setTotal(j.total || 0);
      setPosts(j.items ?? []);
    } catch (e) {
      toast.error("Error loading posts");
      console.error("[load] ERROR", e);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (initialCurrentUserId) {
      const s = getSocket();
      s.emit("join", { room: `user:${initialCurrentUserId}` });
    }
  }, [initialCurrentUserId]);

  React.useEffect(() => {
    const p = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    if (p !== page) {
      setPage(p);
      load(p);
    }
  }, [searchParams, page, load]);

  React.useEffect(() => {
    const s = getSocket();

    const onLike = (p: {
      postId: string;
      likesCount?: number;
      liked?: boolean;
      userId?: string;
    }) => {
      if (p.userId && currentUserId && p.userId === currentUserId) return;
      setPosts((prev) =>
        prev.map((post) => {
          if (post._id !== p.postId) return post;
          const safeLikes =
            typeof p.likesCount === "number"
              ? p.likesCount
              : Number(post.likesCount) || 0;
          return { ...post, likesCount: safeLikes };
        })
      );
    };

    const onComment = (p: { postId: string }) => {
      setPosts((prev) =>
        prev.map((x) =>
          x._id === p.postId
            ? { ...x, commentsCount: (x.commentsCount || 0) + 1 }
            : x
        )
      );
    };

    const onCommentDeleted = (p: { postId: string; commentId: string }) => {
      setPosts((prev) =>
        prev.map((x) =>
          x._id === p.postId
            ? { ...x, commentsCount: Math.max(0, (x.commentsCount || 0) - 1) }
            : x
        )
      );
    };

    const onNewPost = () => load(page);
    const onPostDeleted = (p: { postId: string }) => {
      setPosts((prev) => prev.filter((x) => x._id !== p.postId));
      setTotal((t) => Math.max(0, t - 1));
    };

    s.on("community:like-updated", onLike);
    s.on("community:new-comment", onComment);
    s.on("community:comment-deleted", onCommentDeleted);
    s.on("community:new-post", onNewPost);
    s.on("community:post-deleted", onPostDeleted);

    return () => {
      s.off("community:like-updated", onLike);
      s.off("community:new-comment", onComment);
      s.off("community:comment-deleted", onCommentDeleted);
      s.off("community:new-post", onNewPost);
      s.off("community:post-deleted", onPostDeleted);
    };
  }, [currentUserId, page, load]);

  const onChangePage = React.useCallback(
    (p: number) => {
      const sp = new URLSearchParams(searchParams.toString());
      sp.set("page", String(p));
      router.replace(`${pathname}?${sp.toString()}`);
    },
    [searchParams, pathname, router]
  );

  const handlePostChanged = React.useCallback(() => {
    load(page);
  }, [load, page]);

  const postsList = React.useMemo(() => {
    return posts.map((p) => (
      <PostCard
        key={p._id}
        post={p}
        apiBase={API_BASE}
        onChanged={handlePostChanged}
        currentUserId={currentUserId}
      />
    ));
  }, [posts, handlePostChanged, currentUserId]);

  const showBottomPager = total >= PAGE_SIZE;

  return (
    <div className="space-y-8">
      {/* Posts List */}
      {postsList.length > 0 ? (
        <div className="space-y-4">{postsList}</div>
      ) : null}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Loading...
            </p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && total === 0 && (
        <div className="flex flex-col items-center justify-center px-4 text-center">
          <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-zinc-400 dark:text-zinc-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
            No posts yet
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-sm">
            Be the first to share with the community!
          </p>
        </div>
      )}

      {/* Pagination */}
      {showBottomPager && (
        <div className="flex justify-center pt-4">
          <Pagination
            page={page}
            total={total}
            pageSize={PAGE_SIZE}
            onChange={onChangePage}
          />
        </div>
      )}
    </div>
  );
}
