"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import {
  CreateVocabularySetDTO,
  UpdateVocabularySetDTO,
  VocabularySet,
} from "@/types/vocabulary.types";

export interface SetComposerModalProps {
  open: boolean;
  mode: "create" | "edit";
  initialSet?: VocabularySet | null;
  onClose: () => void;
  onSubmit: (
    payload: CreateVocabularySetDTO | UpdateVocabularySetDTO
  ) => Promise<void>;
}

export function SetComposerModal({
  open,
  mode,
  initialSet,
  onClose,
  onSubmit,
}: SetComposerModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    if (mode === "edit" && initialSet) {
      setTitle(initialSet.title || "");
      setDescription(initialSet.description || "");
      setTopic(initialSet.topic || "");
    } else {
      setTitle("");
      setDescription("");
      setTopic("");
    }
    setError(null);
  }, [mode, initialSet, open]);

  const subtitle = useMemo(
    () =>
      mode === "create"
        ? "Tạo bộ từ theo một chủ đề hoặc bối cảnh cụ thể."
        : "Chỉnh sửa thông tin để bộ từ rõ ràng và dễ quản lý.",
    [mode]
  );

  if (!open) return null;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!title.trim()) {
      setError("Tên bộ từ vựng là bắt buộc.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        topic: topic.trim() || undefined,
      };

      await onSubmit(payload);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể lưu bộ từ vựng. Hãy thử lại."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center px-3 py-6 sm:px-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        className="
          relative z-10 w-full max-w-xl
          overflow-hidden rounded-2xl border border-[#2E5EB8]/25
          bg-white shadow-2xl shadow-black/25
          dark:border-[#2E5EB8]/45 dark:bg-zinc-950
        "
      >
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng"
          className="
            absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center
            rounded-xl bg-white/80 text-zinc-500 ring-1 ring-zinc-200
            shadow-sm transition
            hover:bg-white hover:text-zinc-900
            dark:bg-zinc-900/80 dark:text-zinc-300 dark:ring-zinc-700 dark:hover:bg-zinc-800
          "
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div
          className="
            border-b border-zinc-100/70 px-4 pb-3 pt-4 sm:px-5 sm:pt-5 sm:pb-4
            bg-gradient-to-r from-[#2E5EB8]/10 via-white to-[#2E5EB8]/5
            dark:border-zinc-800/70 dark:from-[#0F1A33] dark:via-zinc-950 dark:to-[#2E5EB8]/15
          "
        >
          <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-[#102347] dark:text-white">
            {mode === "create" ? "Thiết lập bộ từ" : "Cập nhật bộ từ"}
          </h2>
          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
            {subtitle}
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto px-4 pb-4 pt-4 sm:px-5 sm:pb-5"
        >
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
              {error}
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-100">
              Tên bộ từ <span className="text-red-500">*</span>
            </label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="VD: TOEIC – Office Communication"
              maxLength={80}
              className="
                w-full rounded-xl border border-zinc-200/80 bg-white px-3 py-2.5
                text-sm font-medium text-zinc-900 outline-none
                transition focus:border-[#2E5EB8] focus:ring-2 focus:ring-[#2E5EB8]/15
                dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-[#2E5EB8] dark:focus:ring-[#2E5EB8]/30
              "
            />
          </div>

          {/* Topic */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-100">
              Chủ đề / tag
            </label>
            <input
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              placeholder="VD: Office, Meetings, Customer service"
              className="
                w-full rounded-xl border border-zinc-200/80 bg-white px-3 py-2.5
                text-sm text-zinc-900 outline-none
                transition focus:border-[#2E5EB8] focus:ring-2 focus:ring-[#2E5EB8]/15
                dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-[#2E5EB8] dark:focus:ring-[#2E5EB8]/30
              "
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-100">
              Mô tả (tùy chọn)
            </label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              placeholder="VD: Từ vựng thường gặp trong hội thoại văn phòng."
              className="
                w-full rounded-xl border border-zinc-200/80 bg-white px-3 py-2.5
                text-sm text-zinc-900 outline-none
                transition focus:border-[#2E5EB8] focus:ring-2 focus:ring-[#2E5EB8]/15
                dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-[#2E5EB8] dark:focus:ring-[#2E5EB8]/30
              "
            />
          </div>

          {/* Actions */}
          <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="
                inline-flex w-full sm:w-auto items-center justify-center
                rounded-xl border border-zinc-200/80 bg-white px-4 py-2.5
                text-sm font-semibold text-zinc-600
                transition hover:border-zinc-300 hover:text-zinc-900
                dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-500 dark:hover:text-zinc-50
              "
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="
                inline-flex w-full sm:w-auto items-center justify-center
                rounded-xl bg-[#2E5EB8] px-4 py-2.5 text-sm font-semibold text-white
                shadow-sm transition hover:bg-[#244A90]
                disabled:cursor-not-allowed disabled:opacity-70
                dark:bg-[#2E5EB8]/90 dark:hover:bg-[#2E5EB8]
              "
            >
              {loading
                ? "Đang lưu..."
                : mode === "create"
                ? "Tạo bộ từ"
                : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}