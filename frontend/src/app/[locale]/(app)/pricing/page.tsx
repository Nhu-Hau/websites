import dynamic from "next/dynamic";
import { PageMotion } from "@/components/layout/PageMotion";
import { generateMetadata as genMeta, generateCanonical } from "@/lib/seo";

// Dynamic import để tối ưu bundle size
const Pricing = dynamic(() => import("@/components/features/marketing/Pricing"));

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ locale: string }> 
}) {
  const { locale } = await params;
  const path = locale === "vi" ? "/pricing" : `/${locale}/pricing`;
  
  return genMeta({
    title: "Gói học TOEIC Premium - Nâng cấp tài khoản",
    description: "Nâng cấp lên Premium để mở khóa toàn bộ tính năng: không giới hạn Practice Tests, AI Chat, Admin Chat, Livestream, Learning Insight và nhiều hơn nữa.",
    keywords: [
      "TOEIC Premium",
      "nâng cấp TOEIC",
      "gói học TOEIC",
      "TOEIC 79k",
      "TOEIC 159k",
      "luyện thi TOEIC",
    ],
    canonical: generateCanonical(path, locale),
    ogType: "website",
  }, locale);
}

export default function PricingPage() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-50 to-white dark:from-zinc-950 dark:to-zinc-900">
      <PageMotion>
        <div className="py-12 sm:py-16 lg:py-20">
          <Pricing />
        </div>
      </PageMotion>
    </div>
  );
}

