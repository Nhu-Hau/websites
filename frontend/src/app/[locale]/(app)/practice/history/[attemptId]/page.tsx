import dynamic from "next/dynamic";

// Dynamic import client component để tối ưu bundle size
const PracticeAttempt = dynamic(() => import("@/components/features/practice/PracticeResult"));

export default function Page() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900 transition-colors duration-300">
      <PracticeAttempt />
    </div>
  );
}
