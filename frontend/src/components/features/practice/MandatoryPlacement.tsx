// components/parts/MandatoryPlacement.tsx
"use client";

import { AlertTriangle, ArrowRight, X } from "lucide-react";

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in-0">
      <div className="relative w-[90%] max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 animate-in zoom-in-95">
        {/* Close (tuỳ chọn ẩn nếu muốn thật sự bắt buộc) */}
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="absolute right-3 top-3 text-zinc-400 transition hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {/* Header */}
        <div className="mb-3 flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
            <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
        </div>

        <h3 className="mb-2 text-center text-lg font-bold text-zinc-900 dark:text-zinc-100">
          Hãy làm <span className="text-emerald-600 dark:text-emerald-400">Placement Test</span> trước
        </h3>

        <p className="mb-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
          Để phân chia Level theo năng lực và gợi ý lộ trình phù hợp, hệ thống yêu cầu bạn hoàn thành
          <span className="font-semibold"> bài kiểm tra xếp trình độ</span> trước khi luyện Practice.
        </p>

        {/* Actions: chỉ cho phép đi tới Placement */}
        <div className="flex justify-center">
          <button
            onClick={onGoPlacement}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-emerald-500"
          >
            <ArrowRight className="h-4 w-4" />
            Bắt đầu Placement
          </button>
        </div>
      </div>
    </div>
  );
}