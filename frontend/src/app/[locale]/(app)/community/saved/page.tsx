import { Suspense } from "react";
import SavedPostsClient from "@/components/features/community/SavedPostsClient";
import { PageMotion } from "@/components/layout/PageMotion";


export default async function SavedPostsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(String(sp.page || "1"), 10));

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <PageMotion className="mx-auto max-w-4xl px-4 py-6 lg:py-8 pt-20 lg:pt-28 pb-20 lg:pb-8">
        <Suspense fallback={
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Đang tải...
              </p>
            </div>
          </div>
        }>
          <SavedPostsClient initialPage={page} />
        </Suspense>
      </PageMotion>
    </div>
  );
}


