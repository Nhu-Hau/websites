// frontend/src/app/[locale]/(app)/news/page.tsx
import { NewsListClient } from "@/components/features/news/NewsListClient";
import { generateMetadata as genMeta, generateCanonical } from "@/lib/seo";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.news.meta" });
  const path = locale === "vi" ? "/news" : `/${locale}/news`;
  
  return genMeta({
    title: t("title"),
    description: t("description"),
    keywords: t("keywords").split(", "),
    canonical: generateCanonical(path, locale),
    ogType: "website",
  }, locale);
}

export default function NewsPage() {
  return <NewsListClient />;
}



