"use client";
import { ReactNode } from "react";

export default function AllTestPageLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen text-zinc-900 bg-slate-100 dark:bg-zinc-900">
      {/* Spacer = đúng chiều cao header */}
      <div className="h-16 md:h-20 shrink-0" aria-hidden />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16 ">
        {children}
      </main>
    </div>
  );
}
