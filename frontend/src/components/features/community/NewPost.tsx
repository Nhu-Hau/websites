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
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pt-16">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-lg">
          {/* Header */}
          <div className="p-6 border-b border-zinc-100 dark:border-zinc-800">
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
              Create New Post
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Share your thoughts, tips, or resources with the TOEIC learning community
            </p>
          </div>

          {/* Form */}
          <div className="p-6">
            <NewPostForm onSuccess={handleSuccess} />
          </div>
        </div>
      </div>
    </main>
  );
}
