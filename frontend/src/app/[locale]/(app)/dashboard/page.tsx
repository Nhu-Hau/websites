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
    <div className="rounded-3xl border-2 border-white/30 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl p-6 shadow-2xl ring-2 ring-white/20 dark:ring-zinc-800/50">
      <div className="flex items-center gap-3 mb-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-xl ring-2 ring-white/50">
          <div className="w-7 h-7 bg-white/30 rounded animate-pulse" />
        </div>
        <div>
          <div className="h-6 w-48 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse mb-2" />
          <div className="h-5 w-56 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
        </div>
      </div>
      <div className="flex items-center justify-center py-12">
        <div className="text-sm font-bold text-zinc-500 dark:text-zinc-400">
          Đang tải dữ liệu...
        </div>
      </div>
    </div>
  );
}

function GoalProgressSkeleton() {
  return (
    <div className="rounded-3xl border-2 border-white/30 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl p-6 shadow-2xl ring-2 ring-white/20 dark:ring-zinc-800/50">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-600 shadow-xl ring-2 ring-white/50">
          <div className="w-7 h-7 bg-white/30 rounded animate-pulse" />
        </div>
        <div className="h-6 w-40 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
      </div>
      <div className="flex items-center justify-center py-12">
        <div className="text-sm font-bold text-zinc-500 dark:text-zinc-400">
          Đang tải dữ liệu...
        </div>
      </div>
    </div>
  );
}

function StudyScheduleSkeleton() {
  return (
    <div className="rounded-3xl border-2 border-white/30 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl p-6 shadow-2xl ring-2 ring-white/20 dark:ring-zinc-800/50">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-xl ring-2 ring-white/50">
          <div className="w-7 h-7 bg-white/30 rounded animate-pulse" />
        </div>
        <div className="h-6 w-36 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
      </div>
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );
}

function BadgesSkeleton() {
  return (
    <div className="rounded-2xl border-2 border-white/30 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl p-4 shadow-xl ring-2 ring-white/20 dark:ring-zinc-800/50">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-500 to-amber-500 shadow-lg ring-2 ring-white/50">
          <div className="w-5 h-5 bg-white/30 rounded animate-pulse" />
        </div>
        <div className="h-5 w-32 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
      </div>
      <div className="flex gap-2.5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-700 animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}

function PracticeProgressChartSkeleton() {
  return (
    <div className="h-full flex flex-col rounded-3xl border-2 border-white/30 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl p-6 shadow-2xl ring-2 ring-white/20 dark:ring-zinc-800/50">
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-xl ring-2 ring-white/50">
            <div className="w-7 h-7 bg-white/30 rounded animate-pulse" />
          </div>
          <div>
            <div className="h-6 w-32 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse mb-2" />
            <div className="h-5 w-40 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
          </div>
        </div>
      </div>
      <div className="mb-4">
        <div className="flex items-center gap-1.5 flex-wrap">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div
              key={i}
              className="h-6 w-12 rounded-full bg-zinc-100 dark:bg-zinc-700 animate-pulse"
            />
          ))}
        </div>
      </div>
      <div className="relative flex-1 min-h-[140px]">
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <div className="text-sm font-bold text-zinc-500 dark:text-zinc-400">
            Đang tải dữ liệu...
          </div>
        </div>
      </div>
    </div>
  );
}

function AssessmentChartSkeleton() {
  return (
    <div className="h-full flex flex-col rounded-3xl border-2 border-white/30 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl p-6 shadow-2xl ring-2 ring-white/20 dark:ring-zinc-800/50">
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 shadow-xl ring-2 ring-white/50">
            <div className="w-7 h-7 bg-white/30 rounded animate-pulse" />
          </div>
          <div>
            <div className="h-6 w-28 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse mb-2" />
            <div className="h-5 w-44 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
          </div>
        </div>
      </div>
      <div className="relative flex-1 min-h-[140px]">
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
          <div className="text-sm font-bold text-zinc-500 dark:text-zinc-400">
            Đang tải dữ liệu...
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  return (
    <div className="min-h-screen bg-[#DFD0B8] dark:bg-gradient-to-br dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900 pt-20">
      <div className="mx-auto max-w-[1380px] px-4 sm:px-6 lg:px-8">
        {/* Header Dashboard – Có nền card, nhỏ gọn, góc trái, icon 3D + hover mượt */}
        <div className="group mb-8">
          <div className="relative inline-flex items-center gap-4 rounded-3xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl px-6 py-4 shadow-xl ring-2 ring-white/30 dark:ring-zinc-700/50 transition-all duration-500 hover:shadow-2xl hover:scale-[1.005] hover:ring-amber-300/50 dark:hover:ring-amber-600/50 overflow-hidden">
            {/* Gradient Overlay khi hover */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-amber-500/5 via-orange-500/5 to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Icon 3D với hiệu ứng hover */}
            <div className="relative transform-gpu transition-all duration-400 group-hover:scale-110 group-hover:-rotate-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg ring-3 ring-white/50 dark:ring-zinc-800/50">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/30 backdrop-blur-md">
                  <svg
                    className="h-5 w-5 text-white drop-shadow-md"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </div>
              </div>
              {/* Subtle glow khi hover */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-400/40 to-orange-400/40 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>

            {/* Text Content */}
            <div className="relative">
              {/* Title với gradient + 3D shadow */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-900 dark:from-white dark:via-zinc-100 dark:to-white drop-shadow-md transition-all duration-300 group-hover:drop-shadow-lg">
                Bảng điều khiển
              </h1>
              {/* 3D Shadow Layer */}
              <h1 className="absolute -left-0.5 top-0.5 text-2xl sm:text-3xl font-black bg-clip-text bg-gradient-to-r from-amber-500 via-orange-600 to-amber-600 opacity-0 group-hover:opacity-30 blur-sm transition-all duration-400">
                Bảng điều khiển
              </h1>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 sm:gap-5 lg:gap-6 pb-10">
          {/* Practice Progress Chart */}
          <div className="col-span-1 lg:col-span-3">
            <Suspense fallback={<PracticeProgressChartSkeleton />}>
              <PracticeProgressChart />
            </Suspense>
          </div>

          {/* Assessment Chart */}
          <div className="col-span-1 lg:col-span-3">
            <Suspense fallback={<AssessmentChartSkeleton />}>
              <AssessmentChart />
            </Suspense>
          </div>

          {/* Goal Progress */}
          <div className="col-span-1 lg:col-span-3">
            <Suspense fallback={<GoalProgressSkeleton />}>
              <GoalProgressServer />
            </Suspense>
          </div>

          {/* Activity Heatmap - Full width */}
          <div className="col-span-1 lg:col-span-3">
            <Suspense fallback={<ActivityHeatmapSkeleton />}>
              <ActivityHeatmapServer />
            </Suspense>
          </div>

          {/* Study Schedule */}
          <div className="lg:col-span-4">
            <Suspense fallback={<StudyScheduleSkeleton />}>
              <StudyScheduleServer />
            </Suspense>
          </div>

          {/* Badges - Full width */}
          <div className="col-span-1 lg:col-span-2">
            <Suspense fallback={<BadgesSkeleton />}>
              <BadgesServer />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
