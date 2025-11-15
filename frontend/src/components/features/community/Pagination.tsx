// frontend/src/components/features/community/Pagination.tsx
"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  page: number;
  total: number;
  pageSize: number;
  onChange: (p: number) => void;
};

export default function Pagination({
  page,
  total,
  pageSize,
  onChange,
}: Props) {
  const totalPages = Math.max(1, Math.ceil((total || 0) / pageSize));
  if (totalPages <= 1) return null;

  const pages: number[] = [];
  const add = (n: number) => {
    if (n >= 1 && n <= totalPages && !pages.includes(n)) pages.push(n);
  };
  add(1);
  add(2);
  for (let i = page - 2; i <= page + 2; i++) add(i);
  add(totalPages - 1);
  add(totalPages);
  pages.sort((a, b) => a - b);

  const handlePrev = React.useCallback(() => {
    onChange(Math.max(1, page - 1));
  }, [onChange, page]);

  const handleNext = React.useCallback(() => {
    onChange(Math.min(totalPages, page + 1));
  }, [onChange, page, totalPages]);

  const handlePage = React.useCallback(
    (p: number) => {
      onChange(p);
    },
    [onChange]
  );

  return (
    <nav
      className="flex items-center justify-center gap-1"
      aria-label="Pagination"
    >
      <button
        onClick={handlePrev}
        disabled={page <= 1}
        className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Previous page"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      {pages.map((p, i) => {
        const prev = pages[i - 1];
        const dots = i > 0 && p - (prev ?? 0) > 1;
        const isActive = p === page;
        return (
          <React.Fragment key={p}>
            {dots && (
              <span className="inline-flex items-center justify-center w-10 h-10 text-sm text-zinc-500 dark:text-zinc-400">
                …
              </span>
            )}
            <button
              onClick={() => handlePage(p)}
              aria-current={isActive ? "page" : undefined}
              className={`inline-flex items-center justify-center w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-600 dark:bg-blue-500 text-white"
                  : "border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              {p}
            </button>
          </React.Fragment>
        );
      })}

      <button
        onClick={handleNext}
        disabled={page >= totalPages}
        className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Next page"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </nav>
  );
}
