/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import PostCard from "@/components/features/community/PostCard";
import Pagination from "@/components/features/community/Pagination";
import type { CommunityPost } from "@/types/community.types";
import { toast } from "@/lib/toast";
import { useAuth } from "@/context/AuthContext";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
const PAGE_SIZE = 10;

interface SavedPostsClientProps {
  initialPage: number;
}

export default function SavedPostsClient({ initialPage }: SavedPostsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { user } = useAuth();

  const [posts, setPosts] = React.useState<CommunityPost[]>([]);
  const [page, setPage] = React.useState(initialPage);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const r = await fetch(
        `${API_BASE}/api/community/posts/saved?page=${p}&limit=${PAGE_SIZE}`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );
      if (!r.ok) {
        if (r.status === 401) {
          setTotal(0);
          setPosts([]);
          setLoading(false);
          toast.error("Vui lòng đăng nhập để xem bài viết đã lưu");
          return;
        }
        let errorData: any = {};
        try {
          errorData = await r.json();
        } catch {
          errorData = { message: r.statusText || "Failed to load saved posts" };
        }

        // Trường hợp repostedFrom không hợp lệ
        if (
          r.status === 400 &&
          errorData.message?.includes("postId không hợp lệ")
        ) {
          console.warn(
            "[SavedPostsClient] Backend returned error about invalid postId, likely due to invalid repostedFrom in saved posts"
          );
          setTotal(0);
          setPosts([]);
          setLoading(false);
          return;
        }

        throw new Error(errorData.message || "Failed to load saved posts");
      }

      const j = await r.json();
      let items = j.items || [];

      // Loại bỏ những post có repostedFrom không phải ObjectId hợp lệ
      items = items.filter((p: any) => {
        if (p.repostedFrom && typeof p.repostedFrom === "string") {
          const isValid = /^[0-9a-fA-F]{24}$/.test(p.repostedFrom.trim());
          if (!isValid) {
            console.warn(
              "[SavedPostsClient] Filtering out post with invalid repostedFrom:",
              p._id
            );
            return false;
          }
        }
        return true;
      });

      const total = j.total || 0;
      setTotal(total);
      setPosts(items);
    } catch (e: any) {
      console.error("[SavedPostsClient] Load error:", e);
      if (e.message && !e.message.includes("401")) {
        toast.error(e.message || "Có lỗi xảy ra khi tải bài viết đã lưu");
      }
      setTotal(0);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load lần đầu
  React.useEffect(() => {
    load(initialPage);
  }, [initialPage, load]);

  // Đồng bộ với query ?page=
  React.useEffect(() => {
    const p = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    if (p !== page) {
      setPage(p);
      load(p);
    }
  }, [searchParams, page, load]);

  // Lắng nghe event global khi saved posts thay đổi
  React.useEffect(() => {
    const handleSavedPostsChanged = () => {
      load(page);
    };
    window.addEventListener("savedPostsChanged", handleSavedPostsChanged);
    return () => {
      window.removeEventListener("savedPostsChanged", handleSavedPostsChanged);
    };
  }, [page, load]);

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

  const postsList = React.useMemo(
    () =>
      posts.map((p) => (
        <PostCard
          key={p._id}
          post={p}
          apiBase={API_BASE}
          onChanged={handlePostChanged}
          currentUserId={user?.id}
        />
      )),
    [posts, handlePostChanged, user?.id]
  );

  const showBottomPager = total >= PAGE_SIZE;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-2">
        <h1 className="mb-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Bài viết đã lưu
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Những bài viết bạn đã lưu để xem lại sau.
        </p>
      </div>

      {/* Danh sách bài viết */}
      {postsList.length > 0 && (
        <div className="space-y-4">{postsList}</div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Đang tải bài viết đã lưu...
            </p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && total === 0 && (
        <div className="flex justify-center py-12">
          <div className="w-full max-w-md rounded-2xl border border-dashed border-zinc-200/80 bg-white/95 px-6 py-10 text-center shadow-sm ring-1 ring-black/[0.02] dark:border-zinc-800/80 dark:bg-zinc-900/95">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-sky-50 text-sky-500 dark:bg-sky-900/30 dark:text-sky-300">
              <svg
                className="h-7 w-7"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
            </div>
            <h3 className="mb-1 text-base font-semibold text-zinc-900 dark:text-zinc-50">
              Chưa có bài viết nào
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Bạn chưa lưu bài viết nào. Hãy lưu những bài viết hữu ích để xem
              lại dễ dàng hơn.
            </p>
          </div>
        </div>
      )}

      {/* Pagination */}
      {showBottomPager && (
        <div className="flex justify-center pt-2">
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