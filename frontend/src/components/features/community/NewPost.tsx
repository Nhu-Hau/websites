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
    <div>
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-lg">
          {/* Header */}
          <div className="p-6 border-b border-zinc-100 dark:border-zinc-800">
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
              Tạo bài viết mới
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Chia sẻ suy nghĩ, mẹo học tập hoặc tài nguyên của bạn với cộng đồng học TOEIC
            </p>
          </div>

          {/* Form */}
          <div className="p-6">
            <NewPostForm onSuccess={handleSuccess} />
          </div>
        </div>
    </div>
  );
}
