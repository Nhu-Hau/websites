"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen } from "lucide-react";
import { vocabularyService } from "@/utils/vocabulary.service";
import { VocabularySet } from "@/types/vocabulary.types";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";
import { QuizPageContent } from "./QuizPageContent";
import { useTranslations } from "next-intl";

interface QuizPageClientProps {
  setId: string;
}

export function QuizPageClient({ setId }: QuizPageClientProps) {
  const tExtra = useTranslations("vocabularyExtra");
  const router = useRouter();
  const basePrefix = useBasePrefix();
  const [set, setSet] = React.useState<VocabularySet | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchSet = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await vocabularyService.getVocabularySetById(setId);
      setSet(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : tExtra("errors.loadFailed")
      );
    } finally {
      setLoading(false);
    }
  }, [setId]);

  React.useEffect(() => {
    fetchSet();
  }, [fetchSet]);

  const handleBack = () => {
    router.push(`${basePrefix}/vocabulary/${setId}`);
  };

  const handleSwitchToFlashcard = () => {
    router.push(`${basePrefix}/vocabulary/${setId}/study`);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-zinc-950">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-[#4063bb] border-t-transparent" />
          <p className="text-sm text-slate-600 dark:text-zinc-400">
            {tExtra("loadingSet")}
          </p>
        </div>
      </div>
    );
  }

  if (error || !set) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4 text-center dark:bg-zinc-950">
        <div className="mt-8 text-center">
          <p className="text-zinc-600 dark:text-zinc-300">
            {error || tExtra("errors.notFound")}
          </p>
        </div>
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 dark:bg-zinc-100 dark:text-zinc-900"
        >
          <ArrowLeft className="h-4 w-4" />
          {tExtra("actions.backToList")}
        </button>
      </div>
    );
  }

  return (
    <section className="relative min-h-screen overflow-hidden bg-slate-50 pb-16 dark:bg-zinc-950 pt-20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(64,99,187,0.16),_rgba(15,23,42,0)_55%)] dark:bg-[radial-gradient(circle_at_top,_rgba(64,99,187,0.24),_rgba(3,7,18,0)_65%)]" />
      <div className="relative mx-auto max-w-6xl space-y-5 px-4 xs:px-5">
        {/* HEADER */}
        <header className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/90 px-4 py-4 shadow-xl shadow-slate-900/5 ring-1 ring-slate-900/5 backdrop-blur-xl xs:px-5 xs:py-5 sm:px-6 sm:py-6 dark:border-zinc-800/60 dark:bg-zinc-900/90 dark:shadow-black/20">
          {/* background soft gradient */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#4063bb0f] via-sky-200/30 to-emerald-100/20 dark:from-[#4063bb22] dark:via-sky-500/5 dark:to-emerald-500/5" />
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#4063bb26] blur-[120px] dark:bg-[#4063bb33]" />

          <div className="relative z-10 space-y-5">
            {/* Back button + Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={handleBack}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/70 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:text-[#4063bb] xs:px-4 xs:text-sm dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-200"
              >
                <ArrowLeft className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
                <span>{tExtra("actions.back")}</span>
              </button>
              <button
                onClick={handleSwitchToFlashcard}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/70 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:text-[#4063bb] xs:px-4 xs:text-sm dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-200"
              >
                {tExtra("actions.practiceFlashcard")}
              </button>
            </div>

            {/* Title + desc */}
            {/* <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-2xl border border-white/70 bg-white/80 px-3 py-2 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/80">
                <div className="relative flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4063bb] to-sky-500 shadow-lg shadow-[#4063bb4d] xs:h-10 xs:w-10">
                  <BookOpen className="h-4 w-4 text-white xs:h-5 xs:w-5" />
                </div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.26em] text-slate-500 dark:text-zinc-400 xs:text-[11px]">
                  Quick quiz
                </div>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 xs:text-3xl sm:text-[32px] sm:leading-tight dark:text-white">
                {set.title}
              </h1>
              <p className="max-w-2xl text-[13px] leading-relaxed text-slate-600 xs:text-sm dark:text-zinc-300">
                Luyện tập với các câu hỏi trắc nghiệm và điền từ để khóa kiến thức.
              </p>
            </div> */}
          </div>
        </header>

        <QuizPageContent set={set} />
      </div>
    </section>
  );
}

