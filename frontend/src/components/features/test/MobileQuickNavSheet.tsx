"use client";

import React from "react";
import { Focus, Clock } from "lucide-react";
import { useTranslations } from "next-intl";

export type MobileQuickNavSheetProps = {
  open: boolean;
  onClose: () => void;
  total: number;
  currentIndex: number;
  leftSec: number;
  progress: number;
  items: Array<{ id: string }>;
  answers: Record<string, unknown>;
  onJump: (index: number) => void;
  fmtTime: (sec: number) => string;
};

export function MobileQuickNavSheet({
  open,
  onClose,
  total,
  currentIndex,
  leftSec,
  progress,
  items,
  answers,
  onJump,
  fmtTime,
}: MobileQuickNavSheetProps) {
  const t = useTranslations("practice.nav");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] lg:hidden">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      {/* sheet */}
      <div className="absolute inset-x-0 bottom-0 rounded-t-2xl border border-zinc-200 bg-white p-4 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-zinc-300 dark:bg-zinc-700" />
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
            <Focus className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            {t("title")}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            {t("close")}
          </button>
        </div>

        {/* tiến độ */}
        <div className="mb-3">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-500 to-sky-400"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
            <span>
              {t("question")}{" "}
              <span className="font-semibold text-zinc-700 dark:text-zinc-200">
                {currentIndex + 1}
              </span>{" "}
              / {total}
            </span>
            <span className="flex items-center gap-1 text-red-600">
              <Clock className="h-3.5 w-3.5" />
              {fmtTime(leftSec)}
            </span>
          </div>
        </div>

        {/* danh sách câu hỏi */}
        <div className="max-h-[42vh] overflow-y-auto pt-1">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(40px,1fr))] gap-2">
            {Array.from({ length: total }).map((_, i) => {
              const idx = i;
              const itemId = items[idx]?.id || "";
              const hasAnswer = Object.prototype.hasOwnProperty.call(
                answers,
                itemId
              );
              const isCurrent = currentIndex === idx;

              return (
                <button
                  key={i}
                  onClick={() => {
                    onClose();
                    onJump(idx);
                  }}
                  className={[
                    "flex aspect-square w-full items-center justify-center rounded-lg border text-sm font-semibold transition-colors",
                    isCurrent
                      ? "border-sky-600 bg-sky-600 text-white"
                      : hasAnswer
                      ? "border-emerald-200 bg-emerald-50 text-sky-700 dark:border-sky-800 dark:bg-emerald-950/40 dark:text-sky-200"
                      : "border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200",
                  ].join(" ")}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

