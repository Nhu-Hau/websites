"use client";

import React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import PostCard from "@/components/features/community/PostCard";
import Pagination from "@/components/features/community/Pagination";
import type { CommunityPost } from "@/types/community.types";
import { toast } from "@/lib/toast";

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
      if (!r.ok) throw new Error("Failed to load saved posts");
      const j = await r.json();
      setTotal(j.total || 0);
      setPosts(j.items ?? []);
    } catch (e) {
      toast.error("Error loading saved posts");
      console.error("[load] ERROR", e);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load(initialPage);
  }, [initialPage, load]);

  React.useEffect(() => {
    const p = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    if (p !== page) {
      setPage(p);
      load(p);
    }
  }, [searchParams, page, load]);

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
      />
    ));
  }, [posts, handlePostChanged]);

  const showBottomPager = total >= PAGE_SIZE;

  return (
    <div className="space-y-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
          Saved Posts
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Posts you&apos;ve bookmarked for later
        </p>
      </div>

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
        <div className="flex flex-col items-center justify-center px-4 text-center py-16">
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
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
            No saved posts yet
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-sm">
            Start saving posts you want to revisit later!
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

