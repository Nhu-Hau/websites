import dynamic from "next/dynamic";
import { generateMetadata as genMeta, generateCanonical } from "@/lib/seo";
import { getTranslations } from "next-intl/server";

// Dynamic import client component để tối ưu bundle size
const PracticePart = dynamic(() => import("@/components/features/test/PracticePart"));

// Allow dynamic params for parts not in generateStaticParams
export const dynamicParams = true;

export async function generateStaticParams() {
  const partKeys = ["part.1", "part.2", "part.3", "part.4", "part.5", "part.6", "part.7"];
  
  return partKeys.map((partKey) => ({
    partKey,
  }));
}

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ locale: string; partKey: string }> 
}) {
  const { locale, partKey } = await params;
  const t = await getTranslations({ locale, namespace: `pages.practice.parts.${partKey}` });
  
  const path = locale === "vi" 
    ? `/practice/${partKey}` 
    : `/${locale}/practice/${partKey}`;
  
  return genMeta({
    title: t("title"),
    description: t("description"),
    keywords: t("keywords").split(", "),
    canonical: generateCanonical(path, locale),
    ogType: "website",
  }, locale);
}

export default function Page() {
  return <PracticePart />;
}
