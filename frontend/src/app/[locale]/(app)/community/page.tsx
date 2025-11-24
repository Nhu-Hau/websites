import { Suspense } from "react";
import { getCommunityPosts, getMe } from "@/lib/server/api";
import CommunityPageClient from "@/components/features/community/CommunityPageClient";
import { generateMetadata as genMeta, generateCanonical } from "@/lib/seo";
import { PageMotion } from "@/components/layout/PageMotion";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const path = locale === "vi" ? "/community" : `/${locale}/community`;

  return genMeta(
    {
      title: "Cộng đồng TOEIC – Thảo luận, chia sẻ kinh nghiệm luyện thi",
      description:
        "Cập nhật bài viết mới nhất từ cộng đồng TOEIC, đặt câu hỏi, chia sẻ chiến lược và nhận góp ý từ hàng nghìn học viên đang luyện thi.",
      keywords: ["cộng đồng TOEIC", "thảo luận TOEIC", "kinh nghiệm luyện thi TOEIC"],
      canonical: generateCanonical(path, locale),
      ogType: "website",
    },
    locale
  );
}

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
      <PageMotion className="mx-auto max-w-4xl px-4 py-6 lg:py-8 pt-20 lg:pt-28 pb-20 lg:pb-8">
        <Suspense fallback={<CommunityPostsSkeleton />}>
          <CommunityPageClient
            initialPosts={initialPosts}
            initialPage={page}
            currentUserId={currentUserId}
          />
        </Suspense>
      </PageMotion>
    </div>
  );
}

