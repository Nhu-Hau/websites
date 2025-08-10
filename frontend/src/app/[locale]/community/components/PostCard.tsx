"use client";

import Link from "next/link";
import type { Post } from "@/app/lib/forum/types";

export default function PostCard({ post, href }: { post: Post; href: string }) {
  return (
    <article
      className="
        group relative overflow-hidden rounded-2xl
        border border-slate-200 bg-white
        p-5 transition
        hover:shadow-md hover:-translate-y-0.5
        dark:border-slate-800 dark:bg-slate-700
        dark:hover:bg-slate-850/90
      "
    >
      {/* Title */}
      <h3 className="text-lg font-semibold text-slate-900 transition-colors group-hover:text-slate-700 dark:text-slate-100 dark:group-hover:text-slate-200">
        <Link href={href} className="focus:outline-none">
          <span className="absolute inset-0" aria-hidden />
          {post.title}
        </Link>
      </h3>

      {/* Excerpt */}
      <p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-300/90">
        {post.excerpt || post.content}
      </p>

      {/* Meta */}
      <div className="mt-4 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-800/70">
          {post.author}
        </span>
        <span>•</span>
        <time dateTime={post.createdAt}>
          {new Date(post.createdAt).toLocaleDateString()}
        </time>
      </div>
    </article>
  );
}
