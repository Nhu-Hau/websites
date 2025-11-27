import { cookies } from "next/headers";
import FollowingClient from "@/components/features/community/FollowingClient";
import { PageMotion } from "@/components/layout/PageMotion";
import { generateMetadata as genMeta, generateCanonical } from "@/lib/seo";
import { getTranslations } from "next-intl/server";
import { logger } from "@/lib/utils/logger";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const path = locale === "vi" ? "/community/following" : `/${locale}/community/following`;
  
  return genMeta({
    title: locale === "vi" ? "Bài viết đang theo dõi - TOEIC PREP" : "Following Posts - TOEIC PREP",
    description: locale === "vi"
      ? "Xem các bài viết từ những người bạn đang theo dõi trong cộng đồng TOEIC PREP."
      : "View posts from people you follow in TOEIC PREP community.",
    keywords: ["TOEIC", "following", "community", "feed", "TOEIC PREP"],
    canonical: generateCanonical(path, locale),
    ogType: "website",
    noindex: true, // User-specific pages should not be indexed
  }, locale);
}

export default async function FollowingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
  let initialPosts = null;

  try {
    const res = await fetch(`${API_BASE}/api/community/posts/following?page=1&limit=20`, {
      headers: token ? { Cookie: `token=${token}` } : {},
      cache: "no-store",
    });
    if (res.ok) {
      initialPosts = await res.json();
    }
  } catch (error) {
    logger.error("[FollowingPage] Error:", error);
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <PageMotion className="mx-auto max-w-4xl px-4 py-6 lg:py-8 pt-20 lg:pt-28 pb-20 lg:pb-8">
        <FollowingClient initialPosts={initialPosts} />
      </PageMotion>
    </div>
  );
}





