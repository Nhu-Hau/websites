"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useForum } from "@/app/context/ForumContext";
import PostCard from "./PostCard";
import Pagination from "./Pagination";

export default function PostList({
  locale,
  currentPage,
  perPage = 6,
}: {
  locale: string;
  currentPage: number;
  perPage?: number;
}) {
  const { posts } = useForum();

  const { totalPages, slice } = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    const end = start + perPage;
    const totalPages = Math.max(1, Math.ceil(posts.length / perPage));
    return { totalPages, slice: posts.slice(start, end) };
  }, [posts, currentPage, perPage]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          Bài viết mới nhất
        </h2>

        <Link
          href={`/${locale}/communityPage/new`}
          className="
            rounded-md bg-tealCustom px-4 py-2 text-sm font-medium text-white
            transition hover:bg-blue-900
          "
        >
          + Đăng bài
        </Link>
      </div>

      {/* Grid list */}
      {slice.length === 0 ? (
        <div
          className="
            flex items-center justify-between rounded-md border border-slate-200 bg-white p-4
            dark:border-slate-800 dark:bg-slate-900
          "
        >
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Chưa có bài viết ở trang này.
          </p>
          <Link
            href={`/${locale}/community/new`}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Tạo bài đầu tiên
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {slice.map((p) => (
            <PostCard
              key={p.id}
              post={p}
              href={`/${locale}/communityPage/${p.id}`}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      <Pagination
        locale={locale}
        currentPage={currentPage}
        totalPages={totalPages}
      />
    </div>
  );
}
