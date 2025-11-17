"use client";

import React from "react";

export type TestStartScreenProps = {
  title?: string;
  description?: React.ReactNode;
  buttonText?: string;
  onStart: () => void;
};

export function TestStartScreen({
  title = "Sẵn sàng bắt đầu chưa?",
  description,
  buttonText = "Bắt đầu làm bài",
  onStart,
}: TestStartScreenProps) {
  return (
    <div className="py-12 sm:py-16">
      <div className="mx-auto max-w-md rounded-2xl border border-dashed border-zinc-300 bg-white/70 p-6 text-center shadow-sm dark:border-zinc-700 dark:bg-zinc-900/80">
        <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          {title}
        </h2>
        {description && (
          <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
            {description}
          </p>
        )}
        <button
          onClick={onStart}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-sky-500 hover:to-sky-400 hover:shadow-md"
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
}

