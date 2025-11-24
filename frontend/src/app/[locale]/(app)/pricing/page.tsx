import dynamic from "next/dynamic";
import { PageMotion } from "@/components/layout/PageMotion";
import { generateMetadata as genMeta, generateCanonical } from "@/lib/seo";
import { getTranslations } from "next-intl/server";

// Dynamic import để tối ưu bundle size
const Pricing = dynamic(() => import("@/components/features/marketing/Pricing"));

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ locale: string }> 
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.pricing.meta" });
  const path = locale === "vi" ? "/pricing" : `/${locale}/pricing`;
  
  return genMeta({
    title: t("title"),
    description: t("description"),
    keywords: t("keywords").split(", "),
    canonical: generateCanonical(path, locale),
    ogType: "website",
  }, locale);
}

export default function PricingPage() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-50 to-white dark:from-zinc-950 dark:to-zinc-900">
      <PageMotion>
        <div className="py-12 sm:py-16">
          <Pricing />
        </div>
      </PageMotion>
    </div>
  );
}

