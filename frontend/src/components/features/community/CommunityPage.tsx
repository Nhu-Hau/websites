/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import PostCard from "@/components/features/community/PostCard";
import Pagination from "@/components/features/community/Pagination";
import type { CommunityPost } from "@/types/community.types";
import { toast } from "react-toastify";
import { getSocket } from "@/lib/socket";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
const PAGE_SIZE = 5;

// MÀU CHỦ ĐẠO
const PRIMARY = "#1C6EA4";
const SECONDARY = "#3D8FC7";
const ACCENT = "#6BA9D9";

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
        {
          credentials: "include",
          cache: "no-store",
        }
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
    <div className="relative min-h-screen bg-gradient-to-br from-[#DFD0B8] to-[#F5E6D3] dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900 transition-all duration-700 overflow-hidden pt-32">
      <main className="relative mx-auto max-w-5xl px-4 xs:px-6 py-6 sm:py-8 lg:py-10">
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

          {/* Loading */}
          {loading && (
            <div className="group relative rounded-3xl bg-white/90 dark:bg-zinc-800/90 backdrop-blur-xl p-8 shadow-2xl ring-2 ring-white/30 dark:ring-zinc-700/50">
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#1C6EA4] border-t-transparent" />
                <p className="text-sm font-black text-zinc-600 dark:text-zinc-400">
                  Đang tải…
                </p>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && total === 0 && (
            <div className="group relative rounded-3xl bg-white/90 dark:bg-zinc-800/90 backdrop-blur-xl p-12 shadow-2xl ring-2 ring-white/30 dark:ring-zinc-700/50 text-center overflow-hidden">
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#1C6EA4]/5 via-[#3D8FC7]/5 to-[#6BA9D9]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />

              <div className="relative">
                {/* Icon 3D */}
                <div className="relative mx-auto w-24 h-24 mb-6 transform-gpu transition-all duration-400 group-hover:scale-110 group-hover:-rotate-3">
                  <div
                    className={`flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[${PRIMARY}] to-[${SECONDARY}] shadow-xl ring-3 ring-white/50 dark:ring-zinc-800/50`}
                  >
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/30 backdrop-blur-md">
                      <svg
                        className="h-10 w-10 text-white drop-shadow-md"
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
                  </div>
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#3D8FC7]/40 to-[#6BA9D9]/40 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>

                <p className="text-lg font-black text-zinc-700 dark:text-zinc-300 mb-2">
                  Chưa có bài viết
                </p>
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  Hãy là người đầu tiên chia sẻ với cộng đồng!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Pagination */}
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
