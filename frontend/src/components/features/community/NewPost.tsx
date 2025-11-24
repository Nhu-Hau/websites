// frontend/src/components/features/community/NewPost.tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";
import NewPostForm from "./NewPostForm";
import { useTranslations } from "next-intl";

export default function NewPost() {
  const router = useRouter();
  const basePrefix = useBasePrefix();
  const t = useTranslations("community.newPost");

  const handleSuccess = () => {
    router.push(`${basePrefix}/community`);
  };

  return (
    <div className="space-y-4">
      {/* Header nhỏ phía trên (optional) */}
      <div>
        <h1 className="mb-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {t("title")}
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {t("description")}
        </p>
      </div>

      {/* Card form */}
      <div className="rounded-2xl border border-zinc-200/80 bg-white/95 shadow-sm ring-1 ring-black/[0.02] dark:border-zinc-800/80 dark:bg-zinc-900/95">
        {/* Form */}
        <div className="px-6 py-5">
          <NewPostForm onSuccess={handleSuccess} />
        </div>
      </div>
    </div>
  );
}