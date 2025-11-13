/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/AuthLayout.tsx
"use client";
import React from "react";

type Props = {
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  below?: React.ReactNode;
  className?: string;
};

export default function AuthLayout({
  title,
  subtitle,
  children,
  below,
  className,
}: Props) {
  return (
    <main
      className="relative min-h-screen grid place-items-center bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 px-4 py-12 overflow-hidden">
      {/* Nền gradient + noise nhẹ (tạo chiều sâu) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-10 dark:opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.03' dark:fill='%23ffffff'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Vignette tinh tế */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-20 dark:opacity-30"
        style={{
          background: "radial-gradient(ellipse at top, rgba(0,0,0,0.15) 0%, transparent 70%)",
        }}
      />

      <div
        className={[
          // Card container
          "relative w-full max-w-md pt-10",
          "animate-in fade-in zoom-in-95 duration-300",
          className || "",
        ].join(" ")}
      >
        <div
          className="rounded-2xl border border-zinc-200/70 bg-white/80 dark:border-zinc-800/70 dark:bg-zinc-900/80 p-8 shadow-xl ring-1 ring-black/5 dark:ring-white/10 backdrop-blur-xl transition-all"
        >
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>

          {/* Main Content */}
          <div className="mt-8">{children}</div>

          {/* Below Section (Google, OR) */}
          {below && (
            <div className="mt-8 space-y-4">
              {/* OR Separator */}
              <div className="relative flex items-center">
                <div className="flex-1 border-t border-zinc-200 dark:border-zinc-800"></div>
                <span className="px-3 text-xs font-medium text-zinc-500 dark:text-zinc-400 
                                 bg-white/80 dark:bg-zinc-900/80">
                  {typeof below === "object" && below !== null && "or" in (below as any) ? (below as any).or : "HOẶC"}
                </span>
                <div className="flex-1 border-t border-zinc-200 dark:border-zinc-800"></div>
              </div>

              {/* Below Content */}
              <div className="mt-4">{below}</div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}