import { Suspense } from "react";
import dynamic from "next/dynamic";
import GroupDetailClient from "@/components/features/community/GroupDetailClient";

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ groupId: string; locale: string }>;
}) {
  const { groupId } = await params;
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <main className="mx-auto max-w-4xl px-4 py-6 lg:py-8 pt-20 lg:pt-28 pb-20 lg:pb-8">
        <Suspense fallback={<div>Đang tải...</div>}>
          <GroupDetailClient groupId={groupId} />
        </Suspense>
      </main>
    </div>
  );
}

