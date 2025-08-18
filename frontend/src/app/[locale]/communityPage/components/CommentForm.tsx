"use client";

import { useState } from "react";
import { useForum } from "@/app/context/ForumContext";

export default function CommentForm({ postId }: { postId: string }) {
  const { addComment } = useForum();
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!content.trim()) return;
        addComment({ postId, content, author: author || undefined });
        setContent("");
      }}
      className="
        rounded-xl border border-slate-300 bg-white p-4 shadow-sm
        dark:border-slate-700 dark:bg-slate-900
      "
    >
      <h4 className="mb-3 text-sm font-medium text-slate-800 dark:text-slate-200">
        Thêm bình luận
      </h4>
      <div className="grid gap-3 sm:grid-cols-4">
        <input
          className="
            sm:col-span-1 w-full rounded-lg border border-slate-300
            bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400
            focus:border-indigo-500 focus:outline-none
            dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200
          "
          placeholder="Tên (tuỳ chọn)"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
        />
        <textarea
          className="
            sm:col-span-3 min-h-[80px] w-full rounded-lg border border-slate-300
            bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400
            focus:border-indigo-500 focus:outline-none
            dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200
          "
          placeholder="Nội dung bình luận…"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>
      <div className="mt-3 flex justify-end">
        <button
          type="submit"
          className="
            rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white
            transition hover:bg-indigo-500
          "
        >
          Gửi bình luận
        </button>
      </div>
    </form>
  );
}
