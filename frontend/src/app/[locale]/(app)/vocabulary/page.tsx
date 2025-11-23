// frontend/src/app/[locale]/(app)/vocabulary/page.tsx
import { VocabularyPageClient } from "@/components/features/vocabulary/VocabularyPageClient";
import { generateMetadata as genMeta, generateCanonical } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const path = locale === "vi" ? "/vocabulary" : `/${locale}/vocabulary`;
  
  return genMeta({
    title: "Từ vựng TOEIC - Học từ vựng với flashcards",
    description: "Học và luyện tập từ vựng TOEIC với hệ thống flashcards thông minh. Ôn tập từ vựng theo chủ đề, làm quiz, và theo dõi tiến độ học tập.",
    keywords: ["từ vựng TOEIC", "flashcards TOEIC", "học từ vựng", "vocabulary TOEIC", "TOEIC words"],
    canonical: generateCanonical(path, locale),
    ogType: "website",
  }, locale);
}

export default function VocabularyPage() {
  return <VocabularyPageClient />;
}



