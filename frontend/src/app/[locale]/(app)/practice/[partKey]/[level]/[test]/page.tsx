import dynamic from "next/dynamic";
import { PageMotion } from "@/components/layout/PageMotion";

// Dynamic import client component nặng để tối ưu bundle size
const PracticePage = dynamic(() => import("@/components/features/practice"));

export default function Page() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900 transition-colors duration-300">
      <PageMotion>
        <PracticePage />
      </PageMotion>
    </div>
  );
}
