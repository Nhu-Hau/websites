import { Suspense } from "react";
import { getCommunityPosts, getMe } from "@/lib/server/api";
import CommunityPageClient from "@/components/features/community/CommunityPageClient";
import dynamic from "next/dynamic";

const CommunityHeader = dynamic(() => import("@/components/features/community/CommunityHeader"));

// Loading skeleton
function CommunityPostsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 bg-white dark:bg-zinc-900 animate-pulse"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-zinc-200 dark:bg-zinc-700" />
            <div className="flex-1">
              <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-700 rounded mb-2" />
              <div className="h-3 w-24 bg-zinc-200 dark:bg-zinc-700 rounded" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-4 w-full bg-zinc-200 dark:bg-zinc-700 rounded" />
            <div className="h-4 w-5/6 bg-zinc-200 dark:bg-zinc-700 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function CommunityPage({
  searchParams,
  params,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const page = Math.max(1, parseInt(String(sp.page || "1"), 10));
  
  // Fetch initial data on server
  const [initialPosts, currentUser] = await Promise.all([
    getCommunityPosts({ page, limit: 5 }),
    getMe(),
  ]);

  const currentUserId = currentUser?._id ? String(currentUser._id) : undefined;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <CommunityHeader locale={locale} active="community" />
      <main className="mx-auto max-w-4xl px-4 py-8 pt-20">
        <Suspense fallback={<CommunityPostsSkeleton />}>
          <CommunityPageClient
            initialPosts={initialPosts}
            initialPage={page}
            currentUserId={currentUserId}
          />
        </Suspense>
      </main>
    </div>
  );
}
