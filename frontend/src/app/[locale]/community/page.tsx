"use client";

import React from "react";
import { useParams } from "next/navigation";
import Composer from "@/components/community/Composer";
import PostCard from "@/components/community/PostCard";
import type { CommunityPost } from "@/types/community";
import { Loader2 } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

export default function CommunityPage() {
  const { locale } = useParams<{ locale: string }>();
  const [posts, setPosts] = React.useState<CommunityPost[]>([]);
  const [page, setPage] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(false);

  async function load(p = 1, append = false) {
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/api/community/posts?page=${p}&limit=10`, {
        credentials: "include",
        cache: "no-store",
      });
      if (!r.ok) throw new Error("fetch failed");
      const j = await r.json();
      setTotal(j.total || 0);
      setPage(j.page || 1);
      setPosts((prev) => (append ? [...prev, ...(j.items ?? [])] : (j.items ?? [])));
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    void load(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto mt-16 max-w-3xl p-4">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Cộng đồng TOEIC</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Chia sẻ tips, tài liệu, thắc mắc — cùng nhau học tốt hơn.
        </p>
      </div>

      {/* Composer */}
      <Composer onPosted={() => void load(1, false)} apiBase={API_BASE} />

      {/* Feed */}
      <div className="mt-4 space-y-4">
        {posts.map((p) => (
          <PostCard key={p._id} post={p} apiBase={API_BASE} onChanged={() => void load(1, false)} />
        ))}

        {!loading && posts.length < total && (
          <div className="flex justify-center">
            <button
              onClick={() => void load(page + 1, true)}
              className="rounded-xl border px-4 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              Tải thêm
            </button>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center gap-2 text-sm text-zinc-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Đang tải…
          </div>
        )}

        {!loading && total === 0 && (
          <div className="rounded-xl border p-4 text-sm text-zinc-500 dark:border-zinc-800">
            Chưa có bài viết. Hãy là người đầu tiên chia sẻ!
          </div>
        )}
      </div>
    </div>
  );
}