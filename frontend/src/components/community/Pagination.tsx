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

  return (
    <nav className="flex items-center justify-center gap-1 select-none">
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page <= 1}
        className="rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-1 text-sm disabled:opacity-40 hover:bg-zinc-50 dark:hover:bg-zinc-800"
      >
        ← Trước
      </button>

      {pages.map((p, i) => {
        const prev = pages[i - 1];
        const dots = i > 0 && p - (prev ?? 0) > 1;
        return (
          <React.Fragment key={p}>
            {dots && <span className="px-2 text-sm text-zinc-500">…</span>}
            <button
              onClick={() => onChange(p)}
              aria-current={p === page ? "page" : undefined}
              className={`rounded-lg px-3 py-1 text-sm border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 ${
                p === page
                  ? "bg-black text-white border-black dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100"
                  : ""
              }`}
            >
              {p}
            </button>
          </React.Fragment>
        );
      })}

      <button
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
        className="rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-1 text-sm disabled:opacity-40 hover:bg-zinc-50 dark:hover:bg-zinc-800"
      >
        Sau →
      </button>
    </nav>
  );
}
