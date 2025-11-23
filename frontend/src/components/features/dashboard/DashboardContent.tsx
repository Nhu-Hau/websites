"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, ReactNode } from "react";
import BaselineModalWrapper from "./BaselineModalWrapper";

type TabId = "progress" | "results" | "activity" | "badges";

interface DashboardContentProps {
  progressTab: ReactNode;
  resultsTab: ReactNode;
  activityTab: ReactNode;
  badgesTab: ReactNode;
}

function DashboardContentInner({
  progressTab,
  resultsTab,
  activityTab,
  badgesTab,
}: DashboardContentProps) {
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get("tab") as TabId) || "progress";

  return (
    <div className="w-full">
      {activeTab === "progress" && progressTab}
      {activeTab === "results" && resultsTab}
      {activeTab === "activity" && activityTab}
      {activeTab === "badges" && badgesTab}
    </div>
  );
}

export default function DashboardContent({
  progressTab,
  resultsTab,
  activityTab,
  badgesTab,
}: DashboardContentProps) {
  return (
    <>
      <BaselineModalWrapper />
      <Suspense fallback={<DashboardContentSkeleton />}>
        <DashboardContentInner
          resultsTab={resultsTab}
          progressTab={progressTab}
          activityTab={activityTab}
          badgesTab={badgesTab}
        />
      </Suspense>
    </>
  );
}

// Loading skeleton for dashboard content
function DashboardContentSkeleton() {
  return (
    <div className="space-y-6">
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
    </div>
  );
}
