import { Suspense } from "react";
import DashboardSideNav from "@/components/features/dashboard/DashboardSideNav";
import DashboardContent from "@/components/features/dashboard/DashboardContent";
import ProgressTabContent from "@/components/features/dashboard/ProgressTabContent";
import ResultsTabContent from "@/components/features/dashboard/ResultsTabContent";
import ActivityTabContent from "@/components/features/dashboard/ActivityTabContent";

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
        <main className="flex-1 min-w-0">
          <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 pt-8 pb-20 lg:pb-8 max-w-7xl mx-auto">
            <DashboardContent
              progressTab={<ProgressTabContent />}
              resultsTab={<ResultsTabContent />}
              activityTab={<ActivityTabContent />}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
