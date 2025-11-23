import { Suspense } from "react";
import DashboardSideNav from "@/components/features/dashboard/DashboardSideNav";
import DashboardContent from "@/components/features/dashboard/DashboardContent";
import ProgressTabContent from "@/components/features/dashboard/ProgressTabContent";
import ResultsTabContent from "@/components/features/dashboard/ResultsTabContent";
import ActivityTabContent from "@/components/features/dashboard/ActivityTabContent";
import BadgesTabContent from "@/components/features/dashboard/BadgesTabContent";
import { generateMetadata as genMeta, generateCanonical } from "@/lib/seo";
import { PageMotion } from "@/components/layout/PageMotion";

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const path = locale === "vi" ? "/dashboard" : `/${locale}/dashboard`;
  
  return genMeta({
    title: "Dashboard - Theo dõi tiến độ học TOEIC",
    description: "Theo dõi tiến độ học tập, kết quả thi thử, và hoạt động của bạn trên TOEIC PREP. Xem thống kê chi tiết về điểm số, thời gian luyện tập, và thành tích.",
    keywords: ["dashboard TOEIC", "tiến độ học TOEIC", "thống kê TOEIC", "kết quả thi TOEIC"],
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
