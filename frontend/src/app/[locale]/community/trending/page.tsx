import { cookies } from "next/headers";
import TrendingClient from "@/components/features/community/TrendingClient";
import { PageMotion } from "@/components/layout/PageMotion";
import { generateMetadata as genMeta, generateCanonical } from "@/lib/seo";
import { getTranslations } from "next-intl/server";
import { logger } from "@/lib/utils/logger";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const path = locale === "vi" ? "/community/trending" : `/${locale}/community/trending`;
  
  return genMeta({
    title: locale === "vi" ? "Bài viết nổi bật - TOEIC PREP" : "Trending Posts - TOEIC PREP",
    description: locale === "vi"
      ? "Xem các bài viết đang nổi bật và được thảo luận nhiều nhất trong cộng đồng TOEIC PREP."
      : "View trending and most discussed posts in TOEIC PREP community.",
    keywords: ["TOEIC", "trending", "popular", "community", "TOEIC PREP"],
    canonical: generateCanonical(path, locale),
    ogType: "website",
  }, locale);
}

export default async function TrendingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
  let initialPosts = null;

  try {
    const res = await fetch(`${API_BASE}/api/community/posts/trending?period=24h`, {
      headers: token ? { Cookie: `token=${token}` } : {},
      cache: "no-store",
    });
    if (res.ok) {
      initialPosts = await res.json();
    }
  } catch (error) {
    logger.error("[TrendingPage] Error:", error);
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <PageMotion className="mx-auto max-w-4xl px-4 py-6 lg:py-8 pt-20 lg:pt-28 pb-20 lg:pb-8">
        <TrendingClient initialPosts={initialPosts} />
      </PageMotion>
    </div>
  );
}





