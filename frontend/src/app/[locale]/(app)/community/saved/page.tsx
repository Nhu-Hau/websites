import { Suspense } from "react";
import { getMe } from "@/lib/server/api";
import { getTranslations } from "next-intl/server";
import dynamic from "next/dynamic";
import SavedPostsClient from "@/components/features/community/SavedPostsClient";


export default async function SavedPostsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const page = Math.max(1, parseInt(String(sp.page || "1"), 10));
  const t = await getTranslations("community.savedPosts");

  const currentUser = await getMe();
  const currentUserId = currentUser?._id ? String(currentUser._id) : undefined;

  if (!currentUserId) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <main className="mx-auto max-w-4xl px-4 py-8 pt-20">
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-8 text-center">
            <p className="text-zinc-600 dark:text-zinc-400">
              {t("loginRequired")}
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <main className="mx-auto max-w-4xl px-4 py-8 pt-20">
        <Suspense fallback={
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                {t("loading")}
              </p>
            </div>
          </div>
        }>
          <SavedPostsClient initialPage={page} />
        </Suspense>
      </main>
    </div>
  );
}

