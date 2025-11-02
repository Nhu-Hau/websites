// frontend/src/app/[locale]/placement/page.tsx
import PlacementPage from "@/components/parts/index";

export default function PlacementWrapper() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900 transition-colors duration-300">
      <PlacementPage />
    </div>
  );
}