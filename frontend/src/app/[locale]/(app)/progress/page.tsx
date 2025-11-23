// frontend/src/app/[locale]/progress/page.tsx
import dynamic from "next/dynamic";
import { PageMotion } from "@/components/layout/PageMotion";

// Dynamic import client component nặng để tối ưu bundle size
const ProgressPage = dynamic(() => import("@/components/features/progress"));

export default function ProgressWrapper() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900 transition-colors duration-300">
      <PageMotion>
        <ProgressPage />
      </PageMotion>
    </div>
  );
}