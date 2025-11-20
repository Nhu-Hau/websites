"use client";

import { useEffect, useMemo, useState } from "react";
import { BookMarked, Languages, PenSquare, X } from "lucide-react";
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
    partOfSpeech: "",
    example: "",
    translatedExample: "",
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
        partOfSpeech: initialTerm.partOfSpeech || "",
        example: initialTerm.example || "",
        translatedExample: initialTerm.translatedExample || "",
      });
    } else {
      setForm({
        word: "",
        meaning: "",
        englishMeaning: "",
        partOfSpeech: "",
        example: "",
        translatedExample: "",
      });
    }
    setError(null);
  }, [mode, initialTerm, open]);

  const header = useMemo(
    () =>
      mode === "edit"
        ? { title: "Cập nhật thuật ngữ", badge: "Chỉnh sửa" }
        : { title: "Thêm từ mới", badge: "Thuật ngữ" },
    [mode]
  );

  if (!open) return null;

  const handleChange = (
    field: keyof typeof form,
    value: string
  ) => {
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
        partOfSpeech: form.partOfSpeech.trim() || undefined,
        example: form.example.trim() || undefined,
        translatedExample: form.translatedExample.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không thể lưu từ vựng. Thử lại sau."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center px-3 py-6 md:px-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-4xl overflow-hidden rounded-[32px] border border-zinc-200/80 bg-white/95 shadow-2xl shadow-black/30 dark:border-zinc-800/80 dark:bg-zinc-900/95">
        <button
          onClick={onClose}
          aria-label="Đóng"
          className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/70 text-zinc-500 shadow-sm ring-1 ring-zinc-200 transition hover:text-zinc-900 dark:bg-zinc-900/70 dark:text-zinc-300 dark:ring-zinc-800"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="bg-gradient-to-br from-emerald-50 via-white to-sky-50 px-6 pb-6 pt-10 dark:from-zinc-900 dark:via-zinc-900 dark:to-sky-950/40">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/70 px-4 py-1 text-xs font-semibold text-emerald-600 dark:border-emerald-900/40 dark:bg-emerald-900/10 dark:text-emerald-300">
            <BookMarked className="h-4 w-4" />
            {header.badge}
          </div>
          <h2 className="mt-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {header.title}
          </h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Giữ nội dung gọn nhẹ để học nhanh trên mobile. Bạn có thể thêm ví dụ
            song ngữ để dễ nhớ hơn.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex max-h-[80vh] flex-col gap-4 overflow-y-auto px-6 pb-8 pt-6"
        >
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-900/10 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                Từ tiếng Anh *
              </span>
              <input
                value={form.word}
                onChange={(event) => handleChange("word", event.target.value)}
                placeholder="Ví dụ: accomplish"
                className="w-full rounded-2xl border border-zinc-200/80 bg-white px-4 py-3 text-sm font-medium text-zinc-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-sky-500 dark:focus:ring-sky-900/40"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                Nghĩa tiếng Việt *
              </span>
              <input
                value={form.meaning}
                onChange={(event) => handleChange("meaning", event.target.value)}
                placeholder="Ví dụ: hoàn thành, đạt được"
                className="w-full rounded-2xl border border-zinc-200/80 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-emerald-500 dark:focus:ring-emerald-900/40"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-[1.5fr_1fr]">
            <label className="space-y-2">
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                <Languages className="h-4 w-4 text-zinc-400" />
                Nghĩa tiếng Anh
              </span>
              <input
                value={form.englishMeaning}
                onChange={(event) =>
                  handleChange("englishMeaning", event.target.value)
                }
                placeholder="e.g. to achieve or complete successfully"
                className="w-full rounded-2xl border border-zinc-200/80 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-amber-500 dark:focus:ring-amber-900/40"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                Loại từ
              </span>
              <div className="flex flex-wrap gap-2">
                {PART_OF_SPEECH.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handleChange("partOfSpeech", item)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition",
                      form.partOfSpeech === item
                        ? "bg-sky-500/10 text-sky-600 ring-1 ring-sky-500/30 dark:text-sky-200"
                        : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
                    )}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                <PenSquare className="h-4 w-4 text-zinc-400" />
                Ví dụ tiếng Anh
              </span>
              <textarea
                rows={3}
                value={form.example}
                onChange={(event) => handleChange("example", event.target.value)}
                placeholder='Ví dụ: "She accomplished her goal of learning English."'
                className="w-full rounded-2xl border border-zinc-200/80 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-sky-500 dark:focus:ring-sky-900/40"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                Ví dụ tiếng Việt
              </span>
              <textarea
                rows={3}
                value={form.translatedExample}
                onChange={(event) =>
                  handleChange("translatedExample", event.target.value)
                }
                placeholder='Ví dụ: "Cô ấy đã hoàn thành mục tiêu học tiếng Anh."'
                className="w-full rounded-2xl border border-zinc-200/80 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-emerald-500 dark:focus:ring-emerald-900/40"
              />
            </label>
          </div>

          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-zinc-200/80 bg-white px-4 py-3 text-sm font-semibold text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
            >
              {loading ? "Đang lưu..." : mode === "create" ? "Thêm từ" : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


