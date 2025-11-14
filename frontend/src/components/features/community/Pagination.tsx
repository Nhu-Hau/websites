//frontend/src/components/community/Pagination.tsx
"use client";
import React from "react";

type Props = {
  page: number;
  total: number;
  pageSize: number;
  onChange: (p: number) => void;
};

export default function Pagination({ page, total, pageSize, onChange }: Props) {
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

  const handlePage = React.useCallback((p: number) => {
    onChange(p);
  }, [onChange]);

  return (
    <nav className="flex items-center justify-center gap-2 select-none flex-wrap">
      <button
        onClick={handlePrev}
        disabled={page <= 1}
        className="group relative px-4 py-2.5 rounded-2xl text-sm font-black bg-white/80 dark:bg-zinc-800/80 border-2 border-white/40 dark:border-zinc-700/50 text-zinc-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700 hover:shadow-md hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
      >
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-400/10 to-violet-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <span className="relative z-10">← Trước</span>
      </button>

      {pages.map((p, i) => {
        const prev = pages[i - 1];
        const dots = i > 0 && p - (prev ?? 0) > 1;
        const isActive = p === page;
        return (
          <React.Fragment key={p}>
            {dots && (
              <span className="px-2 text-sm font-bold text-zinc-500 dark:text-zinc-400">
                …
              </span>
            )}
            <button
              onClick={() => handlePage(p)}
              aria-current={isActive ? "page" : undefined}
              className={`group relative px-4 py-2.5 rounded-2xl text-sm font-black transition-all duration-300 hover:scale-[1.05] ${
                isActive
                  ? "bg-gradient-to-r from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-700 text-white shadow-lg ring-2 ring-white/30 dark:ring-indigo-800/50"
                  : "bg-white/80 dark:bg-zinc-800/80 border-2 border-white/40 dark:border-zinc-700/50 text-zinc-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700 hover:shadow-md"
              }`}
            >
              <div
                className={`absolute inset-0 rounded-2xl ${
                  isActive
                    ? "bg-gradient-to-r from-indigo-400/40 to-violet-400/40 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    : "bg-gradient-to-br from-indigo-400/10 to-violet-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                }`}
              />
              <span className="relative z-10">{p}</span>
            </button>
          </React.Fragment>
        );
      })}

      <button
        onClick={handleNext}
        disabled={page >= totalPages}
        className="group relative px-4 py-2.5 rounded-2xl text-sm font-black bg-white/80 dark:bg-zinc-800/80 border-2 border-white/40 dark:border-zinc-700/50 text-zinc-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700 hover:shadow-md hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
      >
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-400/10 to-violet-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <span className="relative z-10">Sau →</span>
      </button>
    </nav>
  );
}
