"use client";

import React from "react";
import { ChevronLeft, ChevronRight, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface FlashcardControlsProps {
  onPrevious: () => void;
  onNext: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
  onRemember?: () => void;
  onNotYet?: () => void;
  isFlipped?: boolean;
}

export function FlashcardControls({
  onPrevious,
  onNext,
  canGoPrevious,
  canGoNext,
}: FlashcardControlsProps) {
  const t = useTranslations("vocabularyExtra.controls");

  return (
    <>
      {/* Nút TRƯỚC - icon bên trái, luôn nằm trong card */}
      <button
        type="button"
        onClick={onPrevious}
        disabled={!canGoPrevious}
        aria-label={t("previous")}
        className={cn(
          "absolute left-1 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/95 text-slate-700 shadow-md transition hover:scale-105 hover:text-[#4063bb] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 xs:left-2 xs:h-9 xs:w-9 sm:left-3 sm:h-10 sm:w-10 dark:border-zinc-800 dark:bg-zinc-900/95 dark:text-zinc-200"
        )}
      >
        <ChevronLeft className="h-4 w-4 xs:h-5 xs:w-5" />
      </button>

      {/* Nút TIẾP THEO - icon bên phải, luôn nằm trong card */}
      <button
        type="button"
        onClick={onNext}
        disabled={!canGoNext}
        className="absolute right-1 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/95 text-slate-700 shadow-md transition hover:scale-105 hover:text-[#4063bb] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 xs:right-2 xs:h-9 xs:w-9 sm:right-3 sm:h-10 sm:w-10 dark:border-zinc-800 dark:bg-zinc-900/95 dark:text-zinc-200"
        aria-label={t("next")}
      >
        <ChevronRight className="h-4 w-4 xs:h-5 xs:w-5" />
      </button>
    </>
  );
}

// Nút "Chưa nhớ" / "Đã nhớ"
export function FlashcardActionButtons({
  onRemember,
  onNotYet,
  isFlipped,
}: {
  onRemember: () => void;
  onNotYet: () => void;
  isFlipped: boolean;
}) {
  const t = useTranslations("vocabularyExtra.controls");
  const handleNotYet = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (isFlipped) onNotYet();
  };

  const handleRemember = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (isFlipped) onRemember();
  };

  return (
    <div className="absolute top-3 left-1/2 z-20 flex max-w-full -translate-x-1/2 flex-wrap items-center justify-center gap-1.5 px-2 xs:top-4 xs:gap-2">
      <button
        type="button"
        onClick={handleNotYet}
        disabled={!isFlipped}
        className="inline-flex items-center gap-1 rounded-2xl border border-amber-200/70 bg-white/95 px-2 py-1 text-[10px] font-semibold text-amber-700 shadow-md backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 xs:px-3 xs:py-1.5 xs:text-xs dark:border-amber-900/40 dark:bg-zinc-900/95 dark:text-amber-300"
      >
        <X className="h-3 w-3 xs:h-3.5 xs:w-3.5" />
        <span>{t("notRemembered")}</span>
      </button>
      <button
        type="button"
        onClick={handleRemember}
        disabled={!isFlipped}
        className="inline-flex items-center gap-1 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-2 py-1 text-[10px] font-semibold text-white shadow-md shadow-emerald-500/30 backdrop-blur-sm transition hover:-translate-y-0.5 hover:brightness-110 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 xs:px-3 xs:py-1.5 xs:text-xs"
      >
        <Check className="h-3 w-3 xs:h-3.5 xs:w-3.5" />
        <span>{t("remembered")}</span>
      </button>
    </div>
  );
}