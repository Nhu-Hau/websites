import { Suspense } from "react";
import ActivityHeatmapServer from "@/components/features/dashboard/ActivityHeatmapServer";
import GoalProgressServer from "@/components/features/dashboard/GoalProgressServer";
import StudyScheduleServer from "@/components/features/dashboard/StudyScheduleServer";
import BadgesServer from "@/components/features/dashboard/BadgesServer";
import PracticeProgressChart from "@/components/features/dashboard/PracticeProgressChart";
import AssessmentChart from "@/components/features/dashboard/AssessmentChart";

// Loading skeletons
function ActivityHeatmapSkeleton() {
  return (
    <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-700/80 p-6 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-xl shadow-lg ring-1 ring-black/5 dark:ring-white/10">
      <div className="flex items-center gap-2.5 mb-6">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/20">
          <div className="w-5 h-5 bg-blue-200 dark:bg-blue-700 rounded animate-pulse" />
        </div>
        <div className="h-6 w-48 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
      </div>
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-zinc-500 dark:text-zinc-400">Đang tải dữ liệu...</div>
      </div>
    </div>
  );
}

function GoalProgressSkeleton() {
  return (
    <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-700/80 p-6 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-xl shadow-lg ring-1 ring-black/5 dark:ring-white/10">
      <div className="flex items-center gap-2.5 mb-6">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/30 dark:to-purple-800/20">
          <div className="w-5 h-5 bg-purple-200 dark:bg-purple-700 rounded animate-pulse" />
        </div>
        <div className="h-6 w-48 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
      </div>
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-zinc-500 dark:text-zinc-400">Đang tải dữ liệu...</div>
      </div>
    </div>
  );
}

function StudyScheduleSkeleton() {
  return (
    <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-700/80 p-6 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-xl shadow-lg ring-1 ring-black/5 dark:ring-white/10">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/30">
          <div className="w-5 h-5 bg-indigo-200 dark:bg-indigo-700 rounded animate-pulse" />
        </div>
        <div className="h-6 w-32 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
      </div>
      <div className="flex items-center justify-center py-4">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );
}

function BadgesSkeleton() {
  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 p-6 bg-white dark:bg-zinc-800">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-gradient-to-br from-yellow-100 to-orange-50 dark:from-yellow-900/30 dark:to-orange-800/20">
          <div className="w-5 h-5 bg-yellow-200 dark:bg-yellow-700 rounded animate-pulse" />
        </div>
        <div className="h-6 w-24 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
      </div>
      <div className="flex gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="w-14 h-14 rounded-xl bg-zinc-100 dark:bg-zinc-700 animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900 pt-32 pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white mb-2">
            Bảng điều khiển
          </h1>
          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
            Theo dõi tiến trình học tập và mục tiêu của bạn
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Activity Heatmap - Stream this first as it's heavy */}
          <div className="lg:col-span-2">
            <Suspense fallback={<ActivityHeatmapSkeleton />}>
              <ActivityHeatmapServer />
            </Suspense>
          </div>

          {/* Goal Progress */}
          <Suspense fallback={<GoalProgressSkeleton />}>
            <GoalProgressServer />
          </Suspense>

          {/* Study Schedule */}
          <Suspense fallback={<StudyScheduleSkeleton />}>
            <StudyScheduleServer />
          </Suspense>

          {/* Practice Progress Chart */}
          <PracticeProgressChart />

          {/* Assessment Chart */}
          <AssessmentChart />

          {/* Badges */}
          <div className="lg:col-span-2">
            <Suspense fallback={<BadgesSkeleton />}>
              <BadgesServer />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
