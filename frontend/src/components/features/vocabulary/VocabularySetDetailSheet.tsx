"use client";

import React from "react";
import {
  ArrowLeft,
  BookOpenCheck,
  Edit3,
  Filter,
  MoreHorizontal,
  Play,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { VocabularySet, VocabularyTerm } from "@/types/vocabulary.types";
import { cn } from "@/lib/utils";

interface VocabularySetDetailSheetProps {
  open: boolean;
  set: VocabularySet | null;
  loading?: boolean;
  standalone?: boolean;
  onClose: () => void;
  onStudy: (set: VocabularySet) => void;
  onQuiz: (set: VocabularySet) => void;
  onEditSet: (set: VocabularySet) => void;
  onDeleteSet?: (set: VocabularySet) => void;
  onAddTerm: (set: VocabularySet) => void;
  onEditTerm: (term: VocabularyTerm, set: VocabularySet) => void;
  onDeleteTerm: (term: VocabularyTerm, set: VocabularySet) => void;
}

export function VocabularySetDetailSheet({
  open,
  set,
  loading,
  standalone = false,
  onClose,
  onStudy,
  onQuiz,
  onEditSet,
  onDeleteSet,
  onAddTerm,
  onEditTerm,
  onDeleteTerm,
}: VocabularySetDetailSheetProps) {
  const [query, setQuery] = React.useState("");
  const [view, setView] = React.useState<"all" | "withExamples">("all");

  React.useEffect(() => {
    if (!open) {
      setQuery("");
      setView("all");
    }
  }, [open]);

  if (!open || !set) return null;

  const containerClass = standalone
    ? "relative mx-auto flex w-full max-w-6xl items-start justify-center"
    : "fixed inset-0 z-[110] flex items-start justify-center px-3 py-6 md:px-6";

  const filteredTerms = set.terms.filter((term) => {
    const text = [term.word, term.meaning, term.englishMeaning]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const matchesQuery = text.includes(query.toLowerCase().trim());
    const matchesView =
      view === "all"
        ? true
        : Boolean(term.example || term.translatedExample);
    return matchesQuery && matchesView;
  });

  return (
    <div className={containerClass}>
      {!standalone && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      )}

      <div
        className={cn(
          "relative w-full max-w-5xl overflow-hidden rounded-[32px] border border-zinc-200/80 bg-white/95 shadow-2xl shadow-black/30 dark:border-zinc-800/80 dark:bg-zinc-900/95",
          standalone && "max-w-none rounded-[40px]"
        )}
      >
        <div className="flex items-center justify-between border-b border-zinc-200/80 px-6 py-4 dark:border-zinc-800/80">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-200/80 text-zinc-500 transition hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:text-white"
              aria-label="Quay lại"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                Vocabulary Set
              </p>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {set.title}
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onDeleteSet && (
              <button
                onClick={() => onDeleteSet(set)}
                className="inline-flex items-center gap-2 rounded-2xl border border-red-200/70 px-4 py-2 text-sm font-semibold text-red-600 transition hover:border-red-300 dark:border-red-900/40 dark:text-red-300"
              >
                <Trash2 className="h-4 w-4" />
                Xóa
              </button>
            )}
            <button
              onClick={() => onEditSet(set)}
              className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200/80 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:border-sky-200 hover:text-sky-600 dark:border-zinc-700 dark:text-zinc-200"
            >
              <Edit3 className="h-4 w-4" />
              Chỉnh sửa
            </button>
            <button
              onClick={() => onStudy(set)}
              className="inline-flex items-center gap-2 rounded-2xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
            >
              <Play className="h-4 w-4" />
              Luyện flashcard
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-6 px-6 py-6">
          <header className="grid gap-4 md:grid-cols-[2fr_1fr]">
            <div className="rounded-3xl border border-zinc-200/80 bg-zinc-50/80 p-5 dark:border-zinc-800/80 dark:bg-zinc-900/60">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {set.description || "Chưa có mô tả."}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-zinc-600 dark:text-zinc-400">
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 font-semibold text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
                  <BookOpenCheck className="h-4 w-4" />
                  {set.terms.length} từ
                </span>
                {set.topic && (
                  <span className="rounded-full bg-sky-500/10 px-3 py-1 font-semibold text-sky-600 dark:bg-sky-900/30 dark:text-sky-200">
                    #{set.topic}
                  </span>
                )}
                <span>
                  Tạo ngày{" "}
                  {new Intl.DateTimeFormat("vi-VN", {
                    dateStyle: "medium",
                  }).format(new Date(set.createdAt))}
                </span>
              </div>
            </div>

            <div className="rounded-3xl border border-sky-100/70 bg-gradient-to-br from-sky-50 via-white to-emerald-50 p-5 shadow-inner dark:border-sky-900/40 dark:from-sky-950/30 dark:via-zinc-900 dark:to-emerald-950/20">
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                Luyện tập nhanh
              </p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Flashcard giúp ghi nhớ, quiz giúp kiểm tra phản xạ.
              </p>
              <div className="mt-4 grid gap-2">
                <button
                  onClick={() => onStudy(set)}
                  className="inline-flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-zinc-900 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-zinc-900 dark:text-zinc-50"
                >
                  Flashcard
                  <MoreHorizontal className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onQuiz(set)}
                  className="inline-flex items-center justify-between rounded-2xl border border-zinc-200/70 bg-white/80 px-4 py-3 text-sm font-semibold text-zinc-700 transition hover:border-amber-200 hover:text-amber-600 dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-200"
                >
                  Quiz nhanh
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>
            </div>
          </header>

          <section className="rounded-3xl border border-zinc-200/80 p-5 shadow-sm dark:border-zinc-800/80">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:max-w-sm">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Tìm theo từ hoặc nghĩa..."
                  className="w-full rounded-2xl border border-zinc-200/80 bg-white pl-11 pr-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setView("all")}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-2xl border px-3.5 py-2 text-sm font-semibold transition",
                    view === "all"
                      ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
                      : "border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-300"
                  )}
                >
                  <Filter className="h-4 w-4" />
                  Tất cả
                </button>
                <button
                  onClick={() => setView("withExamples")}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-2xl border px-3.5 py-2 text-sm font-semibold transition",
                    view === "withExamples"
                      ? "border-sky-500 bg-sky-500/10 text-sky-600 dark:border-sky-400/60 dark:bg-sky-900/20 dark:text-sky-200"
                      : "border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-300"
                  )}
                >
                  <Filter className="h-4 w-4" />
                  Có ví dụ
                </button>
                <button
                  onClick={() => onAddTerm(set)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-900"
                >
                  <Plus className="h-4 w-4" />
                  Thêm từ
                </button>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {loading && (
                <div className="flex justify-center py-10">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
                </div>
              )}

              {!loading && filteredTerms.length === 0 && (
                <div className="rounded-2xl border border-dashed border-zinc-200/80 bg-white/80 px-4 py-12 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-400">
                  Không tìm thấy từ phù hợp.
                </div>
              )}

              {filteredTerms.map((term, idx) => (
                <article
                  key={term._id || `${term.word}-${idx}`}
                  className="group rounded-2xl border border-zinc-200/80 bg-white/90 p-4 shadow-sm transition hover:border-sky-200 dark:border-zinc-800/70 dark:bg-zinc-900/80"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                          {term.word}
                        </h3>
                        {term.partOfSpeech && (
                          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold uppercase text-zinc-500 dark:bg-zinc-800 dark:text-zinc-300">
                            {term.partOfSpeech}
                          </span>
                        )}
                        <span className="text-xs text-zinc-400 dark:text-zinc-500">
                          #{idx + 1}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                        {term.meaning}
                      </p>
                      {term.englishMeaning && (
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                          {term.englishMeaning}
                        </p>
                      )}
                      {(term.example || term.translatedExample) && (
                        <div className="rounded-2xl border border-zinc-200/70 bg-white/80 p-3 text-sm italic text-zinc-600 dark:border-zinc-800/70 dark:bg-zinc-900/60 dark:text-zinc-300">
                          {term.example && (
                            <p>
                              <span className="mr-2 text-xs uppercase tracking-wide text-zinc-400">
                                EN
                              </span>
                              “{term.example}”
                            </p>
                          )}
                          {term.translatedExample && (
                            <p className="mt-1">
                              <span className="mr-2 text-xs uppercase tracking-wide text-zinc-400">
                                VI
                              </span>
                              “{term.translatedExample}”
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => onEditTerm(term, set)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-zinc-200/80 text-zinc-500 transition hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-300"
                        aria-label="Chỉnh sửa từ"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDeleteTerm(term, set)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-red-100/70 text-red-500 transition hover:bg-red-50 dark:border-red-900/40 dark:text-red-300"
                        aria-label="Xóa từ"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

