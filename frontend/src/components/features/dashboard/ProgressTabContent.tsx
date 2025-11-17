import { Suspense } from "react";
import AssessmentChart from "./AssessmentChart";

function AssessmentChartSkeleton() {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 animate-pulse">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
        <div className="flex-1">
          <div className="h-5 w-32 bg-zinc-100 dark:bg-zinc-800 rounded mb-2" />
          <div className="h-4 w-48 bg-zinc-100 dark:bg-zinc-800 rounded" />
        </div>
      </div>
      <div className="h-32 bg-zinc-50 dark:bg-zinc-950 rounded-lg" />
    </div>
  );
}

export default function ProgressTabContent() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<AssessmentChartSkeleton />}>
        <AssessmentChart />
      </Suspense>
    </div>
  );
}

