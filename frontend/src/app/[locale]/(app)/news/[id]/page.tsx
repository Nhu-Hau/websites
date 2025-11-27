// frontend/src/app/[locale]/(app)/news/[id]/page.tsx
import { NewsDetailClient } from "@/components/features/news/NewsDetailClient";
import { generateMetadata as genMeta, generateCanonical } from "@/lib/seo";
import { generateArticleSchema, renderJsonLd } from "@/lib/seo/structured-data";
import { SITE_CONFIG } from "@/lib/seo";

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ id: string; locale?: string }> 
}) {
  const { id, locale = "vi" } = await params;
  const path = locale === "vi" ? `/news/${id}` : `/${locale}/news/${id}`;
  
  // Try to fetch news data for metadata
  let newsData = null;
  try {
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
    const res = await fetch(`${API_BASE}/api/news/${id}`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      newsData = data.data;
    }
  } catch {
    // Fallback if fetch fails
  }
  
  const title = newsData?.title 
    ? `${newsData.title} - TOEIC PREP`
    : locale === "vi" ? "Tin tức TOEIC - TOEIC PREP" : "TOEIC News - TOEIC PREP";
  const description = newsData?.paragraphs?.[0]?.substring(0, 160) || 
    (locale === "vi" 
      ? "Đọc tin tức và bài viết về TOEIC, luyện thi và học tiếng Anh."
      : "Read news and articles about TOEIC, test preparation and English learning.");
  
  return genMeta({
    title,
    description,
    keywords: ["TOEIC", "news", "article", newsData?.category || "", "TOEIC PREP"],
    canonical: generateCanonical(path, locale),
    ogType: "article",
    ogImage: newsData?.image 
      ? newsData.image.replace("s3://project.toeic/", `${process.env.NEXT_PUBLIC_S3_PUBLIC_URL || "https://project.toeic.s3.ap-southeast-2.amazonaws.com"}/`)
      : SITE_CONFIG.ogImage,
  }, locale);
}

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  // Fetch news data for structured data
  let newsData = null;
  try {
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
    const res = await fetch(`${API_BASE}/api/news/${id}`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      newsData = data.data;
    }
  } catch {
    // Fallback if fetch fails
  }
  
  const articleSchema = newsData ? generateArticleSchema(
    newsData.title,
    newsData.paragraphs?.[0] || "",
    {
      image: newsData.image?.replace("s3://project.toeic/", `${process.env.NEXT_PUBLIC_S3_PUBLIC_URL || "https://project.toeic.s3.ap-southeast-2.amazonaws.com"}/`),
      datePublished: newsData.publishedAt,
      author: { name: "TOEIC PREP", type: "Organization" },
      publisher: { name: "TOEIC PREP", logo: SITE_CONFIG.ogImage },
    }
  ) : null;
  
  return (
    <>
      {articleSchema && renderJsonLd(articleSchema)}
      <NewsDetailClient newsId={id} />
    </>
  );
}



