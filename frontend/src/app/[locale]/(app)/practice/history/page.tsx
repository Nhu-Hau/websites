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
    <div className="min-h-screen w-full bg-gradient-to-b dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900 transition-colors duration-300">
      <Suspense
        fallback={
          <div className="mx-auto max-w-[1350px] px-6 py-10 mt-16">
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
