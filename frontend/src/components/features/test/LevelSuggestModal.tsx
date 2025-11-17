// components/parts/LevelSuggestModal.tsx
"use client";

import { AlertCircle, ArrowRight, X, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

type L = 1 | 2 | 3;

const LEVEL_CONFIG: Record<
  L,
  { label: string; desc: string; color: string; bgColor: string }
> = {
  1: {
    label: "Level 1",
    desc: "Cơ bản",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
  },
  2: {
    label: "Level 2",
    desc: "Trung bình",
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
  },
  3: {
    label: "Level 3",
    desc: "Nâng cao",
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-900/20",
  },
};

export default function LevelSuggestModal({
  open,
  currentLevel,
  suggestedLevel,
  onContinue,
  onCancel,
}: {
  open: boolean;
  currentLevel: L;
  suggestedLevel: L;
  onContinue: () => void;
  onCancel?: () => void;
}) {
  if (!open) return null;

  const currentConfig = LEVEL_CONFIG[currentLevel];
  const suggestedConfig = LEVEL_CONFIG[suggestedLevel];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 py-6">
      <div
        className={cn(
          "relative w-full max-w-md rounded-2xl",
          "border border-zinc-200 dark:border-zinc-700",
          "bg-white dark:bg-zinc-900",
          "shadow-xl"
        )}
      >
        {/* Close */}
        {onCancel && (
          <button
            onClick={onCancel}
            aria-label="Đóng"
            className={cn(
              "absolute right-3.5 top-3.5",
              "inline-flex h-8 w-8 items-center justify-center rounded-lg",
              "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200",
              "hover:bg-zinc-100 dark:hover:bg-zinc-800",
              "transition-colors"
            )}
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex justify-center mb-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>

          <h3 className="text-center text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Level bạn chọn khác với gợi ý
          </h3>
          <p className="mt-2 text-center text-sm text-zinc-600 dark:text-zinc-400">
            Hệ thống đề xuất Level phù hợp với năng lực hiện tại để bạn học
            hiệu quả hơn.
          </p>
        </div>

        {/* Body */}
        <div className="px-6 pb-4 space-y-3">
          {/* Current Level */}
          <div
            className={cn(
              "flex items-center gap-3 rounded-xl",
              "border border-zinc-200 dark:border-zinc-700",
              "bg-zinc-50 dark:bg-zinc-800/60",
              "px-3.5 py-2.5"
            )}
          >
            <div
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full",
                currentConfig.bgColor
              )}
            >
              <span className={cn("text-sm font-bold", currentConfig.color)}>
                {currentLevel}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {currentConfig.label}
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                {currentConfig.desc} – bạn đang chọn
              </div>
            </div>
          </div>

          {/* Suggested Level (nổi bật hơn) */}
          <div
            className={cn(
              "flex items-center gap-3 rounded-xl",
              "border-2 border-emerald-300 dark:border-emerald-700",
              "bg-emerald-50/70 dark:bg-emerald-900/25",
              "px-3.5 py-2.5"
            )}
          >
            <div
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full",
                suggestedConfig.bgColor
              )}
            >
              <CheckCircle2
                className={cn("h-5 w-5", suggestedConfig.color)}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {suggestedConfig.label}
                </span>
                <span className="inline-flex items-center rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                  GỢI Ý HỆ THỐNG
                </span>
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-300">
                {suggestedConfig.desc} – phù hợp với kết quả học hiện tại.
              </div>
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="px-6 pb-4">
          <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
            Bạn vẫn có thể tiếp tục với{" "}
            <span className="font-semibold">
              Level {currentLevel}
            </span>
            , nhưng chúng tôi khuyến khích thử{" "}
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {suggestedConfig.label}
            </span>{" "}
            để có lộ trình tốt hơn.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 pb-6 pt-2">
          {onCancel && (
            <button
              onClick={onCancel}
              className={cn(
                "flex-1 rounded-xl border border-zinc-300 dark:border-zinc-600",
                "bg-white dark:bg-zinc-900",
                "px-4 py-2.5 text-sm font-medium",
                "text-zinc-700 dark:text-zinc-200",
                "hover:bg-zinc-50 dark:hover:bg-zinc-800",
                "transition-colors"
              )}
            >
              Đổi Level khác
            </button>
          )}

          <button
            onClick={onContinue}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-xl",
              "bg-gradient-to-r from-indigo-600 to-indigo-500",
              "hover:from-indigo-500 hover:to-indigo-400",
              "px-4 py-2.5 text-sm font-semibold text-white",
              "shadow-sm hover:shadow-md",
              "transition-transform duration-150 active:scale-[0.97]"
            )}
          >
            <ArrowRight className="h-4 w-4" />
            Tiếp tục với Level {currentLevel}
          </button>
        </div>
      </div>
    </div>
  );
}