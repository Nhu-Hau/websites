import { Suspense } from "react";
import { LayoutDashboard } from "lucide-react";
import ActivityHeatmapServer from "@/components/features/dashboard/ActivityHeatmapServer";
import GoalProgressServer from "@/components/features/dashboard/GoalProgressServer";
import StudyScheduleServer from "@/components/features/dashboard/StudyScheduleServer";
import BadgesServer from "@/components/features/dashboard/BadgesServer";
import PracticeProgressChart from "@/components/features/dashboard/PracticeProgressChart";
import AssessmentChart from "@/components/features/dashboard/AssessmentChart";

// Loading skeletons - clean and minimal
function CardSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
        <div className="flex-1">
          <div className="h-5 w-32 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse mb-2" />
          <div className="h-4 w-48 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
        </div>
      </div>
      <div className="h-32 bg-zinc-50 dark:bg-zinc-950 rounded-lg animate-pulse" />
    </div>
  );
}

function PracticeProgressChartSkeleton() {
  return <CardSkeleton />;
}

function AssessmentChartSkeleton() {
  return <CardSkeleton />;
}

function GoalProgressSkeleton() {
  return <CardSkeleton />;
}

function ActivityHeatmapSkeleton() {
  return <CardSkeleton />;
}

function StudyScheduleSkeleton() {
  return <CardSkeleton />;
}

function BadgesSkeleton() {
  return <CardSkeleton />;
}

export default async function DashboardPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pt-16">
      {/* Header */}
      <div className="sticky top-16 z-30 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <LayoutDashboard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-zinc-900 dark:text-white">
                  Bảng điều khiển
                </h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Primary Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Suspense fallback={<PracticeProgressChartSkeleton />}>
              <PracticeProgressChart />
            </Suspense>
            <Suspense fallback={<AssessmentChartSkeleton />}>
              <AssessmentChart />
            </Suspense>
          </div>

          {/* Secondary Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Suspense fallback={<GoalProgressSkeleton />}>
              <GoalProgressServer />
            </Suspense>
            <Suspense fallback={<ActivityHeatmapSkeleton />}>
              <ActivityHeatmapServer />
            </Suspense>
          </div>

          {/* Bottom Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Suspense fallback={<StudyScheduleSkeleton />}>
                <StudyScheduleServer />
              </Suspense>
            </div>
            <div className="lg:col-span-1">
              <Suspense fallback={<BadgesSkeleton />}>
                <BadgesServer />
              </Suspense>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
