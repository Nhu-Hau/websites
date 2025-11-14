/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import PostCard from "@/components/features/community/PostCard";
import Pagination from "@/components/features/community/Pagination";
import type { CommunityPost } from "@/types/community.types";
import { toast } from "react-toastify";
import { getSocket } from "@/lib/socket";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
const PAGE_SIZE = 5;

export default function CommunityPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const initialPage = Math.max(
    1,
    parseInt(searchParams.get("page") || "1", 10)
  );
  const [posts, setPosts] = React.useState<CommunityPost[]>([]);
  const [page, setPage] = React.useState(initialPage);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [currentUserId, setCurrentUserId] = React.useState<string | undefined>(
    undefined
  );

  async function load(p = 1) {
    setLoading(true);
    try {
      const r = await fetch(
        `${API_BASE}/api/community/posts?page=${p}&limit=${PAGE_SIZE}`,
        { credentials: "include", cache: "no-store" }
      );
      if (!r.ok) throw new Error("Không thể tải bài viết");
      const j = await r.json();
      setTotal(j.total || 0);
      setPosts(j.items ?? []);
    } catch (e) {
      toast.error("Lỗi khi tải bài viết");
      console.error("[load] ERROR", e);
    } finally {
      setLoading(false);
    }
  }

  async function loadMe() {
    try {
      const r = await fetch(`${API_BASE}/api/auth/me`, {
        credentials: "include",
        cache: "no-store",
      });
      if (!r.ok) return;
      const j = await r.json();
      if (j?.user?._id) {
        const uid = String(j.user._id);
        setCurrentUserId(uid);
        const s = getSocket();
        s.emit("join", { room: `user:${uid}` });
      }
    } catch {}
  }

  React.useEffect(() => {
    const p = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    setPage(p);
    load(p);
  }, [searchParams]);

  React.useEffect(() => {
    loadMe();
  }, []);

  React.useEffect(() => {
    const s = getSocket();

    const onLike = (p: {
      postId: string;
      likesCount?: number;
      liked?: boolean;
      userId?: string;
    }) => {
      // nếu socket báo từ chính user hiện tại, bỏ qua vì PostCard đã cập nhật optimistically
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
  }, [currentUserId, page]);

  const onChangePage = (p: number) => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set("page", String(p));
    router.replace(`${pathname}?${sp.toString()}`);
  };

  const showBottomPager = total >= 4;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pt-32">
      <main className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
        <div className="space-y-6">
          {posts.map((p: any) => (
            <PostCard
              key={p._id}
              post={p}
              apiBase={API_BASE}
              onChanged={() => load(page)}
              currentUserId={currentUserId}
            />
          ))}

          {loading && (
            <div className="flex justify-center text-sm xs:text-base text-zinc-500 dark:text-zinc-400 animate-pulse py-8">
              Đang tải…
            </div>
          )}

          {!loading && total === 0 && (
            <div className="text-center text-sm xs:text-base text-zinc-500 dark:text-zinc-400 py-12">
              Chưa có bài viết.
            </div>
          )}
        </div>

        {showBottomPager && (
          <div className="mt-10">
            <Pagination
              page={page}
              total={total}
              pageSize={PAGE_SIZE}
              onChange={onChangePage}
            />
          </div>
        )}
      </main>
    </div>
  );
}
