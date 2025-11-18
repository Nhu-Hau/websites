// frontend/src/components/features/community/NewPost.tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";
import NewPostForm from "./NewPostForm";

export default function NewPost() {
  const router = useRouter();
  const basePrefix = useBasePrefix();

  const handleSuccess = () => {
    router.push(`${basePrefix}/community`);
  };

  return (
    <div className="space-y-4">
      {/* Header nhỏ phía trên (optional) */}
      <div>
        <h1 className="mb-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Tạo bài viết mới
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Chia sẻ suy nghĩ, mẹo học tập hoặc tài nguyên của bạn với cộng đồng TOEIC.
        </p>
      </div>

      {/* Card form */}
      <div className="rounded-2xl border border-zinc-200/80 bg-white/95 shadow-sm ring-1 ring-black/[0.02] dark:border-zinc-800/80 dark:bg-zinc-900/95">
        {/* Header trong card */}
        <div className="border-b border-zinc-100/80 px-6 py-4 dark:border-zinc-800/80">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                Chia sẻ cùng cộng đồng
              </h2>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Bạn có thể đăng câu hỏi, kinh nghiệm luyện thi hoặc tài liệu hữu ích.
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="px-6 py-5">
          <NewPostForm onSuccess={handleSuccess} />
        </div>
      </div>
    </div>
  );
}