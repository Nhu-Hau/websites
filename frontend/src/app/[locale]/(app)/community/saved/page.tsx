import { Suspense } from "react";
import SavedPostsClient from "@/components/features/community/SavedPostsClient";
import { PageMotion } from "@/components/layout/PageMotion";
import { generateMetadata as genMeta, generateCanonical } from "@/lib/seo";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const path = locale === "vi" ? "/community/saved" : `/${locale}/community/saved`;
  
  return genMeta({
    title: locale === "vi" ? "Bài viết đã lưu - TOEIC PREP" : "Saved Posts - TOEIC PREP",
    description: locale === "vi"
      ? "Xem lại các bài viết bạn đã lưu trong cộng đồng TOEIC PREP."
      : "View your saved posts in TOEIC PREP community.",
    keywords: ["TOEIC", "saved posts", "bookmarks", "TOEIC PREP"],
    canonical: generateCanonical(path, locale),
    ogType: "website",
    noindex: true, // User-specific pages should not be indexed
  }, locale);
}

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


