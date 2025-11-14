import { Suspense } from "react";
import { getCommunityPosts, getMe } from "@/lib/server/api";
import CommunityPageClient from "@/components/features/community/CommunityPageClient";
import dynamic from "next/dynamic";

const CommunityHeader = dynamic(() => import("@/components/features/community/CommunityHeader"));

// Loading skeleton
function CommunityPostsSkeleton() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pt-32">
      <main className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-6 bg-white dark:bg-zinc-800 animate-pulse"
            >
              <div className="h-6 w-3/4 bg-zinc-200 dark:bg-zinc-700 rounded mb-4" />
              <div className="h-4 w-full bg-zinc-200 dark:bg-zinc-700 rounded mb-2" />
              <div className="h-4 w-2/3 bg-zinc-200 dark:bg-zinc-700 rounded" />
            </div>
          ))}
        </div>
      </main>
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
    <div className="min-h-screen bg-[#DFD0B8] dark:bg-zinc-950 pt-32">
      <CommunityHeader locale={locale} active="community" />
      <main className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
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
