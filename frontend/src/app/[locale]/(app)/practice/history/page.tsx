import { Suspense } from "react";
import PracticeHistoryClient from "@/components/features/practice/PracticeHistory";
import { getPracticeHistory } from "@/lib/server/api";

async function PracticeHistoryData({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(String(params.page ?? "1"), 10));
  const limit = Math.min(100, Math.max(1, parseInt(String(params.limit ?? "20"), 10)));
  const partKey = params.partKey ? String(params.partKey) : undefined;
  const level = params.level ? String(params.level) : undefined;
  const test = params.test ? String(params.test) : undefined;

  const queryParams: {
    page: number;
    limit: number;
    partKey?: string;
    level?: string;
    test?: string;
  } = { page, limit };
  if (partKey) queryParams.partKey = partKey;
  if (level) queryParams.level = level;
  if (test) queryParams.test = test;

  const data = await getPracticeHistory(queryParams);

  return (
    <PracticeHistoryClient
      items={data.items || []}
      total={data.total || 0}
      page={data.page || 1}
      limit={data.limit || 20}
    />
  );
}

export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-zinc-950 overflow-hidden">
      {/* subtle grid background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_#e5e7eb_0,_#fafafa_40%,_#f4f4f5_100%)] dark:bg-[radial-gradient(circle_at_top,_#18181b_0,_#09090b_40%,_#0a0a0a_100%)]" />
      
      <Suspense
        fallback={
          <div className="relative mx-auto max-w-6xl xl:max-w-7xl px-4 xs:px-6 py-10 pt-20">
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="h-12 w-12 rounded-full border-4 border-blue-600 dark:border-blue-400 border-t-transparent animate-spin" />
              <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
                Đang tải...
              </p>
            </div>
          </div>
        }
      >
        <PracticeHistoryData searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
