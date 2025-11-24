// frontend/src/app/[locale]/(app)/vocabulary/page.tsx
import { VocabularyPageClient } from "@/components/features/vocabulary/VocabularyPageClient";
import { generateMetadata as genMeta, generateCanonical } from "@/lib/seo";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.vocabulary.meta" });
  const path = locale === "vi" ? "/vocabulary" : `/${locale}/vocabulary`;
  
  return genMeta({
    title: t("title"),
    description: t("description"),
    keywords: t("keywords").split(", "),
    canonical: generateCanonical(path, locale),
    ogType: "website",
  }, locale);
}

export default function VocabularyPage() {
  return <VocabularyPageClient />;
}



