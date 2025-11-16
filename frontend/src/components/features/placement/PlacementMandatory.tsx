// components/parts/MandatoryPlacement.tsx
"use client";

import { AlertTriangle, ArrowRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MandatoryPlacementModal({
  open,
  onGoPlacement,
  onClose,
}: {
  open: boolean;
  onGoPlacement: () => void;
  onClose?: () => void; // optional (vì bắt buộc, có thể không render nút close)
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-sm rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6 shadow-xl">
        {/* Close (tuỳ chọn ẩn nếu muốn thật sự bắt buộc) */}
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Đóng"
            className={cn(
              "absolute right-4 top-4",
              "p-1.5 rounded-lg",
              "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300",
              "hover:bg-zinc-100 dark:hover:bg-zinc-800",
              "transition-colors duration-200"
            )}
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {/* Header */}
        <div className="mb-4 flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
            <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
        </div>

        <h3 className="mb-3 text-center text-lg font-bold text-zinc-900 dark:text-zinc-100">
          Hãy làm <span className="text-emerald-600 dark:text-emerald-400">Placement Test</span> trước
        </h3>

        <p className="mb-6 text-center text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          Để phân chia Level theo năng lực và gợi ý lộ trình phù hợp, hệ thống yêu cầu bạn hoàn thành
          <span className="font-semibold"> bài kiểm tra xếp trình độ</span> trước khi luyện Practice.
        </p>

        {/* Actions: chỉ cho phép đi tới Placement */}
        <div className="flex justify-center">
          <button
            onClick={onGoPlacement}
            className={cn(
              "inline-flex items-center gap-2",
              "rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500",
              "hover:from-emerald-500 hover:to-emerald-400",
              "px-4 py-2.5 text-sm font-semibold text-white",
              "shadow-sm hover:shadow-md",
              "transition-all duration-200 active:scale-[0.98]"
            )}
          >
            <ArrowRight className="h-4 w-4" />
            Bắt đầu Placement
          </button>
        </div>
      </div>
    </div>
  );
}