// frontend/src/app/[locale]/placement/page.tsx
import dynamic from "next/dynamic";

// Dynamic import client component nặng để tối ưu bundle size
const PlacementPage = dynamic(() => import("@/components/features/placement/index"));

export default function PlacementWrapper() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900 transition-colors duration-300">
      <PlacementPage />
    </div>
  );
}
