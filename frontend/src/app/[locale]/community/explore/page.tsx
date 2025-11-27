import ExploreClient from "@/components/features/community/ExploreClient";
import { PageMotion } from "@/components/layout/PageMotion";
import { generateMetadata as genMeta, generateCanonical } from "@/lib/seo";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const path = locale === "vi" ? "/community/explore" : `/${locale}/community/explore`;
  
  return genMeta({
    title: locale === "vi" ? "Khám phá cộng đồng - TOEIC PREP" : "Explore Community - TOEIC PREP",
    description: locale === "vi"
      ? "Khám phá các chủ đề, hashtag và bài viết nổi bật trong cộng đồng TOEIC PREP."
      : "Explore topics, hashtags and trending posts in TOEIC PREP community.",
    keywords: ["TOEIC", "community", "explore", "hashtags", "topics", "TOEIC PREP"],
    canonical: generateCanonical(path, locale),
    ogType: "website",
  }, locale);
}

export default function ExplorePage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <PageMotion className="mx-auto max-w-4xl px-4 py-6 lg:py-8 pt-20 lg:pt-28 pb-20 lg:pb-8">
        <ExploreClient />
      </PageMotion>
    </div>
  );
}




