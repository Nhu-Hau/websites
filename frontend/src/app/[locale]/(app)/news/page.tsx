// frontend/src/app/[locale]/(app)/news/page.tsx
import { NewsListClient } from "@/components/features/news/NewsListClient";
import { generateMetadata as genMeta, generateCanonical } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const path = locale === "vi" ? "/news" : `/${locale}/news`;
  
  return genMeta({
    title: "Tin tức TOEIC - Cập nhật mới nhất về kỳ thi TOEIC",
    description: "Cập nhật tin tức mới nhất về kỳ thi TOEIC, mẹo làm bài, chiến lược học tập, và thông tin quan trọng từ ETS. Đọc các bài viết chuyên sâu về TOEIC.",
    keywords: ["tin tức TOEIC", "TOEIC news", "mẹo thi TOEIC", "chiến lược TOEIC", "TOEIC tips"],
    canonical: generateCanonical(path, locale),
    ogType: "website",
  }, locale);
}

export default function NewsPage() {
  return <NewsListClient />;
}



