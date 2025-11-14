// components/parts/LevelSuggestModal.tsx
"use client";

import { AlertCircle, ArrowRight, X, CheckCircle2 } from "lucide-react";

type L = 1 | 2 | 3;

const LEVEL_CONFIG: Record<
  L,
  { label: string; desc: string; color: string; bgColor: string }
> = {
  1: {
    label: "Level 1",
    desc: "Cơ bản",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
  },
  2: {
    label: "Level 2",
    desc: "Trung bình",
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
  },
  3: {
    label: "Level 3",
    desc: "Nâng cao",
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in-0">
      <div className="relative w-[90%] max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 animate-in zoom-in-95">
        {/* Close */}
        {onCancel && (
          <button
            onClick={onCancel}
            aria-label="Đóng"
            className="absolute right-3 top-3 text-zinc-400 transition hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {/* Header */}
        <div className="mb-4 flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
            <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
        </div>

        <h3 className="mb-3 text-center text-lg font-bold text-zinc-900 dark:text-zinc-100">
          Bạn đang chọn Level không phù hợp
        </h3>

        <div className="mb-4 space-y-3">
          {/* Current Level */}
          <div className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/50">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full ${currentConfig.bgColor}`}
            >
              <span className={`text-sm font-bold ${currentConfig.color}`}>
                {currentLevel}
              </span>
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {currentConfig.label}
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                {currentConfig.desc}
              </div>
            </div>
          </div>

          {/* Suggested Level */}
          <div className="flex items-center gap-3 rounded-lg border-2 border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-800 dark:bg-emerald-900/20">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full ${suggestedConfig.bgColor}`}
            >
              <CheckCircle2 className={`h-5 w-5 ${suggestedConfig.color}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {suggestedConfig.label}
                </span>
                <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                  Gợi ý
                </span>
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                {suggestedConfig.desc} - Phù hợp với năng lực hiện tại
              </div>
            </div>
          </div>
        </div>

        <p className="mb-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
          Hệ thống gợi ý bạn nên luyện tập ở{" "}
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
            {suggestedConfig.label}
          </span>{" "}
          để đạt hiệu quả tốt nhất. Bạn có muốn tiếp tục với Level hiện tại không?
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          {onCancel && (
            <button
              onClick={onCancel}
              className="flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition-all hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            >
              Hủy
            </button>
          )}
          <button
            onClick={onContinue}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-indigo-500"
          >
            <ArrowRight className="h-4 w-4" />
            Tiếp tục với Level {currentLevel}
          </button>
        </div>
      </div>
    </div>
  );
}















