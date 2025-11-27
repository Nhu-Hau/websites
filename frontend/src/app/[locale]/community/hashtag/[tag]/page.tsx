import { cookies } from "next/headers";
import HashtagClient from "@/components/features/community/HashtagClient";
import { PageMotion } from "@/components/layout/PageMotion";
import { generateMetadata as genMeta, generateCanonical } from "@/lib/seo";
import { getTranslations } from "next-intl/server";
import { logger } from "@/lib/utils/logger";

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ tag: string; locale: string }> 
}) {
  const { tag, locale } = await params;
  const decodedTag = decodeURIComponent(tag);
  const path = locale === "vi" ? `/community/hashtag/${tag}` : `/${locale}/community/hashtag/${tag}`;
  
  return genMeta({
    title: locale === "vi" 
      ? `#${decodedTag} - TOEIC PREP` 
      : `#${decodedTag} - TOEIC PREP`,
    description: locale === "vi"
      ? `Xem các bài viết về #${decodedTag} trong cộng đồng TOEIC PREP.`
      : `View posts about #${decodedTag} in TOEIC PREP community.`,
    keywords: ["TOEIC", "hashtag", decodedTag, "community", "TOEIC PREP"],
    canonical: generateCanonical(path, locale),
    ogType: "website",
  }, locale);
}

export default async function HashtagPage({
  params,
}: {
  params: Promise<{ tag: string; locale: string }>;
}) {
  const { tag } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
  let initialData = null;

  try {
    const res = await fetch(`${API_BASE}/api/community/hashtags/${tag}?page=1&limit=20`, {
      headers: token ? { Cookie: `token=${token}` } : {},
      cache: "no-store",
    });
    if (res.ok) {
      initialData = await res.json();
    }
  } catch (error) {
    logger.error("[HashtagPage] Error:", error);
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <PageMotion className="mx-auto max-w-4xl px-4 py-6 lg:py-8 pt-20 lg:pt-28 pb-20 lg:pb-8">
        <HashtagClient tag={tag} initialData={initialData} />
      </PageMotion>
    </div>
  );
}





