import { Suspense } from "react";
import PracticeProgressChart from "./PracticeProgressChart";



function PracticeProgressChartSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {[0, 1].map((idx) => (
        <div
          key={idx}
          className="rounded-2xl border border-zinc-200/80 bg-white/95 p-5 shadow-sm animate-pulse dark:border-zinc-800/80 dark:bg-zinc-900/95"
        >
          <div className="mb-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 rounded bg-zinc-100 dark:bg-zinc-800" />
              <div className="h-3 w-40 rounded bg-zinc-100 dark:bg-zinc-800" />
            </div>
          </div>
          <div className="mb-4 flex gap-2">
            <div className="h-8 flex-1 rounded-full bg-zinc-100 dark:bg-zinc-800" />
            <div className="h-8 flex-1 rounded-full bg-zinc-100 dark:bg-zinc-800" />
            <div className="h-8 flex-1 rounded-full bg-zinc-100 dark:bg-zinc-800" />
          </div>
          <div className="h-44 rounded-2xl bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900" />
        </div>
      ))}
    </div>
  );
}
      

export default function ProgressTabContent() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<PracticeProgressChartSkeleton />}>
        <PracticeProgressChart />
      </Suspense>
    </div>
  );
}
