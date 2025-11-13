import dynamic from "next/dynamic";

// Dynamic import client component để tối ưu bundle size
const HistoryAttemptDetail = dynamic(() => import("@/components/parts/HistoryAttempt"));

export default function Page() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900 transition-colors duration-300">
      <HistoryAttemptDetail />
    </div>
  );
}
