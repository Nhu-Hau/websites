"use client";

import { useEffect, useMemo, useState } from "react";
import { Tag, PenSquare, X, ChevronDown } from "lucide-react";
import {
  AddTermDTO,
  UpdateTermDTO,
  VocabularyTerm,
} from "@/types/vocabulary.types";
import { cn } from "@/lib/utils";

const PART_OF_SPEECH = [
  "noun",
  "verb",
  "adjective",
  "adverb",
  "preposition",
  "conjunction",
  "pronoun",
  "interjection",
];

export interface TermComposerModalProps {
  open: boolean;
  mode: "create" | "edit";
  initialTerm?: VocabularyTerm | null;
  onClose: () => void;
  onSubmit: (payload: AddTermDTO | UpdateTermDTO) => Promise<void>;
}

export function TermComposerModal({
  open,
  mode,
  initialTerm,
  onClose,
  onSubmit,
}: TermComposerModalProps) {
  const [form, setForm] = useState({
    word: "",
    meaning: "",
    englishMeaning: "",
    phonetic: "",
    partOfSpeech: "",
    example: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && initialTerm) {
      setForm({
        word: initialTerm.word || "",
        meaning: initialTerm.meaning || "",
        englishMeaning: initialTerm.englishMeaning || "",
        phonetic: initialTerm.phonetic || "",
        partOfSpeech: initialTerm.partOfSpeech || "",
        example: initialTerm.example || "",
      });
    } else {
      setForm({
        word: "",
        meaning: "",
        englishMeaning: "",
        phonetic: "",
        partOfSpeech: "",
        example: "",
      });
    }
    setError(null);
  }, [mode, initialTerm, open]);

  // Handle ESC key
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, onClose, loading]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const header = useMemo(
    () =>
      mode === "edit"
        ? { title: "Cập nhật từ vựng", badge: "Chỉnh sửa" }
        : { title: "Thêm từ mới", badge: "Từ vựng" },
    [mode]
  );

  if (!open) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !loading) {
      onClose();
    }
  };

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.word.trim() || !form.meaning.trim()) {
      setError("Từ tiếng Anh và nghĩa tiếng Việt là bắt buộc.");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await onSubmit({
        word: form.word.trim(),
        meaning: form.meaning.trim(),
        englishMeaning: form.englishMeaning.trim() || undefined,
        phonetic: form.phonetic.trim() || undefined,
        partOfSpeech: form.partOfSpeech.trim() || undefined,
        example: form.example.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể lưu từ vựng. Thử lại sau."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center bg-black/40 px-3 py-6 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={cn(
          "relative w-full max-w-sm rounded-xl border border-white/60 bg-white/90 shadow-xl shadow-slate-900/5 ring-1 ring-slate-900/5 backdrop-blur-xl overflow-hidden",
          "xs:max-w-md xs:rounded-2xl sm:max-w-md md:max-w-lg md:rounded-2xl",
          "dark:border-zinc-800/60 dark:bg-zinc-900/90 dark:shadow-black/20"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background gradient */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#4063bb0f] via-sky-200/30 to-emerald-100/20 dark:from-[#4063bb22] dark:via-sky-500/5 dark:to-emerald-500/5" />
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#4063bb26] blur-[100px] dark:bg-[#4063bb33]" />

        {/* Close button */}
        <button
          onClick={onClose}
          disabled={loading}
          aria-label="Đóng"
          className="absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white/80 text-zinc-500 ring-1 ring-zinc-200/80 shadow-sm transition hover:bg-white hover:text-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed xs:right-4 xs:top-4 xs:h-9 xs:w-9 sm:h-10 sm:w-10 dark:bg-zinc-900/80 dark:text-zinc-300 dark:ring-zinc-700/80 dark:hover:bg-zinc-800"
        >
          <X className="h-4 w-4 xs:h-5 xs:w-5" />
        </button>

        {/* Header */}
        <div className="relative border-b border-white/70 px-4 pb-3 pt-4 xs:px-5 xs:pb-4 xs:pt-5 dark:border-zinc-800/70">
          <div className="inline-flex items-center gap-2 rounded-2xl border border-white/70 bg-white/80 px-3 py-2 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/80">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4063bb] to-sky-500 shadow-lg shadow-[#4063bb4d] xs:h-9 xs:w-9">
              <Tag className="h-4 w-4 text-white xs:h-5 xs:w-5" />
            </div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.26em] text-slate-500 dark:text-zinc-400 xs:text-[11px]">
              {header.badge}
            </div>
          </div>
          <h2
            id="modal-title"
            className="mt-3 text-lg font-bold tracking-tight text-slate-900 xs:mt-4 xs:text-xl sm:text-2xl dark:text-white"
          >
            {header.title}
          </h2>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="relative flex max-h-[70vh] flex-col gap-3 overflow-y-auto px-4 pb-4 pt-4 xs:gap-4 xs:px-5 xs:pb-5 xs:pt-5"
        >
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 shadow-sm xs:rounded-2xl xs:px-4 xs:py-2.5 xs:text-sm dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
              {error}
            </div>
          )}

          {/* Word + Meaning */}
          <div className="grid gap-3 xs:gap-4 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-zinc-400 xs:text-[11px]">
                Từ tiếng Anh <span className="text-red-500">*</span>
              </span>
              <input
                value={form.word}
                onChange={(event) => handleChange("word", event.target.value)}
                placeholder="Ví dụ: accomplish"
                className="w-full rounded-2xl border border-slate-200/80 bg-white py-2.5 pl-3 pr-3 text-sm font-medium text-slate-900 outline-none transition focus:border-[#4063bb] focus:ring-2 focus:ring-[#4063bb1f] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
              />
            </label>

            <label className="space-y-1.5">
              <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-zinc-400 xs:text-[11px]">
                Nghĩa tiếng Việt <span className="text-red-500">*</span>
              </span>
              <input
                value={form.meaning}
                onChange={(event) =>
                  handleChange("meaning", event.target.value)
                }
                placeholder="Ví dụ: hoàn thành, đạt được"
                className="w-full rounded-2xl border border-slate-200/80 bg-white py-2.5 pl-3 pr-3 text-sm text-slate-900 outline-none transition focus:border-[#4063bb] focus:ring-2 focus:ring-[#4063bb1f] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
              />
            </label>
          </div>

          {/* English Meaning */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-zinc-400 xs:text-[11px]">
              Nghĩa tiếng Anh
            </label>
            <input
              value={form.englishMeaning}
              onChange={(event) =>
                handleChange("englishMeaning", event.target.value)
              }
              placeholder="Ví dụ: to achieve or complete successfully"
              className="w-full rounded-2xl border border-slate-200/80 bg-white py-2.5 pl-3 pr-3 text-sm text-slate-900 outline-none transition focus:border-[#4063bb] focus:ring-2 focus:ring-[#4063bb1f] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            />
          </div>

          {/* Phonetic + Part of speech */}
          <div className="grid gap-3 xs:gap-4 sm:grid-cols-[1.2fr_1fr]">
            <label className="space-y-1.5">
              <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-zinc-400 xs:text-[11px]">
                Phiên âm
              </span>
              <input
                value={form.phonetic}
                onChange={(event) =>
                  handleChange("phonetic", event.target.value)
                }
                placeholder="Ví dụ: /əˈkʌmplɪʃ/"
                className="w-full rounded-2xl border border-slate-200/80 bg-white py-2.5 pl-3 pr-3 text-sm text-slate-900 outline-none transition focus:border-[#4063bb] focus:ring-2 focus:ring-[#4063bb1f] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
              />
            </label>

            <label className="space-y-1.5">
              <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-zinc-400 xs:text-[11px]">
                Từ loại
              </span>

              <div className="relative">
                <select
                  value={form.partOfSpeech}
                  onChange={(event) =>
                    handleChange("partOfSpeech", event.target.value)
                  }
                  className={cn(
                    "w-full rounded-2xl border border-slate-200/80 bg-white pl-3 pr-9 py-2.5",
                    "text-[10px] xs:text-[11px] font-medium leading-[20px]",
                    "outline-none transition",
                    "focus:border-[#4063bb] focus:ring-2 focus:ring-[#4063bb1f]",
                    "dark:border-zinc-700 dark:bg-zinc-900",
                    form.partOfSpeech
                      ? "text-slate-900 dark:text-zinc-50"
                      : "text-slate-400 dark:text-zinc-500"
                  )}
                >
                  <option value="">Chọn từ loại</option>
                  {PART_OF_SPEECH.map((item) => (
                    <option key={item} value={item} className="capitalize">
                      {item}
                    </option>
                  ))}
                </select>

                {/* Icon */}
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
              </div>
            </label>
          </div>

          {/* Example */}
          <div className="space-y-1.5">
            <label className="inline-flex items-center gap-1.5">
              <PenSquare className="h-3.5 w-3.5 text-slate-400" />
              <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-zinc-400 xs:text-[11px]">
                Ví dụ
              </span>
            </label>
            <textarea
              rows={3}
              value={form.example}
              onChange={(event) => handleChange("example", event.target.value)}
              placeholder='Ví dụ: "She accomplished her goal of learning English."'
              className="w-full rounded-2xl border border-slate-200/80 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#4063bb] focus:ring-2 focus:ring-[#4063bb1f] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 text-[10px] xs:text-[11px]"
            />
          </div>

          {/* Actions */}
          <div className="mt-1 flex flex-col gap-2 xs:flex-row xs:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-200/80 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed xs:w-auto dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-500 dark:hover:text-zinc-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#4063bb] to-[#2d4c9b] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#2d4c9b33] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70 xs:w-auto"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Đang lưu...</span>
                </>
              ) : mode === "create" ? (
                "Thêm từ"
              ) : (
                "Lưu thay đổi"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
