import { Suspense } from "react";
import dynamic from "next/dynamic";
import GroupDetailClient from "@/components/features/community/GroupDetailClient";

export default async function GroupDetailPage({
  params,
}: {
  params: { groupId: string };
}) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <main className="mx-auto max-w-4xl px-4 py-8 pt-20">
        <Suspense fallback={<div>Đang tải...</div>}>
          <GroupDetailClient groupId={params.groupId} />
        </Suspense>
      </main>
    </div>
  );
}

