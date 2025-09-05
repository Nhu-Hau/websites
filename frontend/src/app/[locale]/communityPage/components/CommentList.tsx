"use client";

import { useForum } from "@/context/ForumContext";

export default function CommentList({ postId }: { postId: string }) {
  const { comments } = useForum();
  const list = comments.filter((c) => c.postId === postId);

  if (list.length === 0) {
    return (
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Chưa có bình luận nào.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {list.map((c) => (
        <div
          key={c.id}
          className="
            rounded-xl border border-slate-200 bg-white p-4
            dark:border-slate-800 dark:bg-slate-900
          "
        >
          <div className="mb-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span
              className="
                rounded-md bg-slate-100 px-2 py-0.5
                dark:bg-slate-800/70
              "
            >
              {c.author?.trim() || "Ẩn danh"}
            </span>
            <span>•</span>
            <time dateTime={c.createdAt}>
              {new Date(c.createdAt).toLocaleString()}
            </time>
          </div>
          <p className="text-slate-800 dark:text-slate-200">{c.content}</p>
        </div>
      ))}
    </div>
  );
}
