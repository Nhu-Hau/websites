import { Suspense } from "react";
import DashboardContent from "@/components/features/dashboard/DashboardContent";
import ProgressTabContent from "@/components/features/dashboard/ProgressTabContent";
import ResultsTabContent from "@/components/features/dashboard/ResultsTabContent";
import ActivityTabContent from "@/components/features/dashboard/ActivityTabContent";

export default async function MobileDashboardPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pt-14 pb-20">
      <div className="px-4 py-6 max-w-4xl mx-auto">
        <Suspense fallback={<DashboardContentSkeleton />}>
          <DashboardContent
            progressTab={<ProgressTabContent />}
            resultsTab={<ResultsTabContent />}
            activityTab={<ActivityTabContent />}
          />
        </Suspense>
      </div>
    </div>
  );
}

// Loading skeleton for dashboard content
function DashboardContentSkeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 animate-pulse">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
          <div className="flex-1">
            <div className="h-5 w-32 bg-zinc-100 dark:bg-zinc-800 rounded mb-2" />
            <div className="h-4 w-48 bg-zinc-100 dark:bg-zinc-800 rounded" />
          </div>
        </div>
        <div className="h-32 bg-zinc-50 dark:bg-zinc-950 rounded-lg" />
      </div>
    </div>
  );
}

