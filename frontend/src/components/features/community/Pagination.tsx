//frontend/src/components/community/Pagination.tsx
"use client";
import React from "react";
import { Button } from "@/components/ui";

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
    <nav className="flex items-center justify-center gap-1 select-none">
      <Button
        onClick={handlePrev}
        disabled={page <= 1}
        variant="outline"
        size="sm"
      >
        ← Trước
      </Button>

      {pages.map((p, i) => {
        const prev = pages[i - 1];
        const dots = i > 0 && p - (prev ?? 0) > 1;
        return (
          <React.Fragment key={p}>
            {dots && <span className="px-2 text-sm text-zinc-500">…</span>}
            <Button
              onClick={() => handlePage(p)}
              aria-current={p === page ? "page" : undefined}
              variant={p === page ? "primary" : "outline"}
              size="sm"
              className={p === page ? "bg-black text-white border-black dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100" : ""}
            >
              {p}
            </Button>
          </React.Fragment>
        );
      })}

      <Button
        onClick={handleNext}
        disabled={page >= totalPages}
        variant="outline"
        size="sm"
      >
        Sau →
      </Button>
    </nav>
  );
}
