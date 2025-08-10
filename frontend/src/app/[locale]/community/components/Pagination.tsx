"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function Pagination({
  locale,
  currentPage,
  totalPages,
}: {
  locale: string;
  currentPage: number;
  totalPages: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updatePage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) params.delete("page");
    else params.set("page", String(page));
    router.push(`/${locale}/community?${params.toString()}`);
  };

  if (totalPages <= 1) return null;

  return (
    <nav className="flex items-center justify-center gap-2">
      <button
        onClick={() => updatePage(Math.max(1, currentPage - 1))}
        className="
          rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm
          text-slate-700 hover:bg-slate-100 disabled:opacity-50
          dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200
          dark:hover:bg-slate-800
        "
        disabled={currentPage === 1}
      >
        Trước
      </button>

      <span
        className="
          rounded-md bg-slate-200 px-3 py-1.5 text-sm text-slate-800
          dark:bg-slate-800 dark:text-slate-200
        "
      >
        Trang {currentPage} / {totalPages}
      </span>

      <button
        onClick={() => updatePage(Math.min(totalPages, currentPage + 1))}
        className="
          rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm
          text-slate-700 hover:bg-slate-100 disabled:opacity-50
          dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200
          dark:hover:bg-slate-800
        "
        disabled={currentPage === totalPages}
      >
        Sau
      </button>
    </nav>
  );
}
