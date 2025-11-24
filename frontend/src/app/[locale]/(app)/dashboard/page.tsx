import { Suspense } from "react";
import DashboardSideNav from "@/components/features/dashboard/DashboardSideNav";
import DashboardContent from "@/components/features/dashboard/DashboardContent";
import ProgressTabContent from "@/components/features/dashboard/ProgressTabContent";
import ResultsTabContent from "@/components/features/dashboard/ResultsTabContent";
import ActivityTabContent from "@/components/features/dashboard/ActivityTabContent";
import BadgesTabContent from "@/components/features/dashboard/BadgesTabContent";
import { generateMetadata as genMeta, generateCanonical } from "@/lib/seo";
import { PageMotion } from "@/components/layout/PageMotion";
import { getTranslations } from "next-intl/server";

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.dashboard.meta" });
  const path = locale === "vi" ? "/dashboard" : `/${locale}/dashboard`;
  
  return genMeta({
    title: t("title"),
    description: t("description"),
    keywords: t("keywords").split(", "),
    canonical: generateCanonical(path, locale),
    ogType: "website",
  }, locale);
}

export default async function DashboardPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pt-16">
      <div className="flex">
        {/* Side Navigation - Desktop only */}
        <div className="hidden lg:block">
          <Suspense fallback={null}>
            <DashboardSideNav />
          </Suspense>
        </div>

        {/* Main Content Area */}
        <PageMotion className="flex-1 min-w-0">
          <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 pt-8 pb-20 lg:pb-8 max-w-7xl mx-auto">
            <DashboardContent
              progressTab={<ProgressTabContent />}
              resultsTab={<ResultsTabContent />}
              activityTab={<ActivityTabContent />}
              badgesTab={<BadgesTabContent />}
            />
          </div>
        </PageMotion>
      </div>
    </div>
  );
}
