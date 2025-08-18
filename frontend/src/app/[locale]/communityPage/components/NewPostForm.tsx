"use client";

import { useState } from "react";
import { useForum } from "@/app/context/ForumContext";
import { useRouter, useParams } from "next/navigation";

export default function NewPostForm() {
  const { addPost } = useForum();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("");
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || "vi";

  const canSubmit = title.trim().length > 0 && content.trim().length > 0;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSubmit) return;
        const post = addPost({ title, content, author: author || undefined });
        router.push(`/${locale}/communityPage/${post.id}`);
      }}
      className="
        rounded-xl border border-slate-300 bg-white p-5 shadow-sm
        dark:border-slate-700 dark:bg-slate-900
      "
    >
      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
        Tạo bài viết mới
      </h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        Nhập tiêu đề và nội dung cho bài viết của bạn.
      </p>

      <div className="mt-4 grid gap-4">
        <input
          className="
            w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base
            text-slate-900 placeholder:text-slate-400
            focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30
            dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100
          "
          placeholder="Tiêu đề"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <input
          className="
            w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm
            text-slate-900 placeholder:text-slate-400
            focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30
            dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100
          "
          placeholder="Tên tác giả (tuỳ chọn)"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
        />

        <textarea
          className="
            min-h-[180px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base
            text-slate-900 placeholder:text-slate-400
            focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30
            dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100
          "
          placeholder="Nội dung bài viết…"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>

      <div className="mt-5 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="
            rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700
            hover:bg-slate-100
            dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800
          "
        >
          Huỷ
        </button>

        <button
          type="submit"
          disabled={!canSubmit}
          className="
            rounded-lg bg-tealCustom px-5 py-2 text-sm font-semibold text-white
            transition hover:bg-blue-900 
          "
        >
          Đăng bài
        </button>
      </div>
    </form>
  );
}
