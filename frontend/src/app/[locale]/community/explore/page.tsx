import ExploreClient from "@/components/features/community/ExploreClient";
import { PageMotion } from "@/components/layout/PageMotion";

export default function ExplorePage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <PageMotion className="mx-auto max-w-4xl px-4 py-6 lg:py-8 pt-20 lg:pt-28 pb-20 lg:pb-8">
        <ExploreClient />
      </PageMotion>
    </div>
  );
}




