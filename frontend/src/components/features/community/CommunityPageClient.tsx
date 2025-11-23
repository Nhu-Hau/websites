// frontend/src/components/features/community/CommunityPageClient.tsx
"use client";

import React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import PostCard from "@/components/features/community/PostCard";
import Pagination from "@/components/features/community/Pagination";
import type { CommunityPost } from "@/types/community.types";
import { toast } from "@/lib/toast";
import { getSocket } from "@/lib/socket";
import { MessagesSquare } from "lucide-react"; // 🔧 NEW: icon cho empty state

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
      // Debug: Log posts to check attachments
      const postsWithAttachments = (j.items ?? []).map((p: any) => {
        // Ensure attachments is always an array
        if (!p.attachments || !Array.isArray(p.attachments)) {
          p.attachments = [];
        }
        return p;
      });
      console.log("[CommunityPageClient] Loaded posts:", postsWithAttachments.map((p: any) => ({
        _id: p._id,
        hasAttachments: !!p.attachments && p.attachments.length > 0,
        attachmentsCount: p.attachments?.length || 0,
        attachments: p.attachments
      })));
      setPosts(postsWithAttachments);
    } catch (e) {
      toast.error("Lỗi khi tải bài viết");
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

    const onNewPost = () => {
      // Always reload page 1 when new post is created to show the latest post
      if (page === 1) {
        load(1);
      } else {
        // If not on page 1, navigate to page 1 to show new post
        onChangePage(1);
      }
    };
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
      {/* Header */}
      <div className="mb-2">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Bảng tin
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Bạn có thể đăng câu hỏi, kinh nghiệm luyện TOEIC, hoặc chia sẻ tài
          liệu hữu ích cho các bạn khác.
        </p>
      </div>
      {/* Posts List */}
      {postsList.length > 0 && <div className="space-y-4">{postsList}</div>}

      {/* 🔧 Loading State – đồng bộ style Groups, mobile-first */}
      {loading && (
        <div className="flex items-center justify-center py-12 sm:py-16">
          <div className="flex flex-col items-center gap-3">
            <div className="h-7 w-7 sm:h-8 sm:w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent dark:border-sky-400" />
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Đang tải bài viết...
            </p>
          </div>
        </div>
      )}

      {/* 🔧 Empty State – đồng bộ với card “Chưa có nhóm phù hợp” */}
      {!loading && total === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200/80 bg-white/95 px-4 sm:px-6 py-12 sm:py-16 text-center shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/95">
          <div className="mb-4 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-sky-50 text-sky-500 dark:bg-sky-900/30 dark:text-sky-300">
            <MessagesSquare className="h-7 w-7 sm:h-8 sm:w-8" />
          </div>
          <h3 className="mb-1 text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Chưa có bài viết nào
          </h3>
          <p className="mb-1 max-w-sm text-sm text-zinc-600 dark:text-zinc-400">
            Bảng tin cộng đồng đang trống. Hãy chia sẻ bài viết đầu tiên với mọi
            người.
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
