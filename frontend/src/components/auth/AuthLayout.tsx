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
    <main className="min-h-[750px] grid place-items-center bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
      <div
        className={[
          "w-full max-w-xs xs:max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm",
          className || "",
        ].join(" ")}
      >
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          {title}
        </h1>
        {subtitle ? (
          <div className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {subtitle}
          </div>
        ) : null}

        {children}

        {below ? (
          <div className="mt-6">
            <div className="relative flex items-center">
              <hr className="w-full border-zinc-200 dark:border-zinc-800" />
              <span className="absolute left-1/2 -translate-x-1/2 bg-white dark:bg-zinc-900 px-2 text-xs text-zinc-500 dark:text-zinc-400"></span>
            </div>
            <div className="mt-0">{below}</div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
