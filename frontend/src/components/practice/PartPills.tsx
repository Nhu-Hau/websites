"use client";

import Link from "next/link";

type Part = {
  id: number;
  title: string;
  name: string;
  questionCount: number;
};

export function PartPills({
  parts,
  makeHref,
}: {
  parts: Part[];
  makeHref: (partId: number) => string;
}) {
  // Hiển thị Part dạng "pill" hiện đại, dễ bấm
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {parts.map((p) => (
        <Link
          key={p.id}
          href={makeHref(p.id)}
          className="group flex items-center justify-between rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-4 hover:border-sky-500 hover:shadow-md transition"
        >
          <div className="min-w-0">
            <div className="text-sm font-semibold text-gray-900 dark:text-zinc-100 group-hover:text-sky-700 dark:group-hover:text-sky-400">
              {p.title}
            </div>
            <div className="text-xs text-gray-600 dark:text-zinc-300 truncate">
              {p.name}
            </div>
          </div>
          <div className="ml-3 text-[11px] font-bold tracking-wide text-sky-700 dark:text-sky-300">
            {p.questionCount} câu
          </div>
        </Link>
      ))}
    </div>
  );
}
