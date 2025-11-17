import { Suspense } from "react";
import dynamic from "next/dynamic";
import CreateGroupClient from "@/components/features/community/CreateGroupClient";

export default async function CreateGroupPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <main className="mx-auto max-w-4xl px-4 py-8 pt-20">
        <Suspense fallback={<div>Loading...</div>}>
          <CreateGroupClient />
        </Suspense>
      </main>
    </div>
  );
}

