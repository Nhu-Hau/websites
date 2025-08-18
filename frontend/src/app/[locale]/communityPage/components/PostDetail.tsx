"use client";

import type { Post } from "@/app/types/forumTypes";

export default function PostDetail({ post }: { post: Post }) {
  return (
    <article
      className="
        rounded-xl border border-slate-300 bg-white p-6 shadow-sm
        dark:border-slate-800 dark:bg-slate-900
      "
    >
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
        {post.title}
      </h1>

      <div className="mt-2 flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
        <span
          className="
            inline-flex items-center rounded-full bg-slate-100 px-2 py-1
            dark:bg-slate-800/70
          "
        >
          {post.author?.trim() || "Ẩn danh"}
        </span>
        <span>•</span>
        <time dateTime={post.createdAt}>
          {new Date(post.createdAt).toLocaleString()}
        </time>
      </div>

      <div className="prose prose-slate mt-5 max-w-none dark:prose-invert">
        {post.content.split("\n\n").map((para, idx) => (
          <p key={idx}>{para}</p>
        ))}
      </div>
    </article>
  );
}
