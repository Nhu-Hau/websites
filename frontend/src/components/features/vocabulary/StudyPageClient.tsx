"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { VocabularySet } from "@/types/vocabulary.types";
import { vocabularyService } from "@/utils/vocabulary.service";
import { useStudyModal } from "@/hooks/vocabulary/useStudyModal";
import { useVocabularyProgress } from "@/hooks/vocabulary/useVocabularyProgress";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";
import { StudyPageContent } from "./StudyPageContent";
import { ArrowLeft, BookOpen } from "lucide-react";

interface StudyPageClientProps {
  setId: string;
}

export function StudyPageClient({ setId }: StudyPageClientProps) {
  const router = useRouter();
  const basePrefix = useBasePrefix();
  const { markRemembered, markDifficult } = useVocabularyProgress();
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
        err instanceof Error ? err.message : "Không thể tải bộ từ vựng này."
      );
    } finally {
      setLoading(false);
    }
  }, [setId]);

  React.useEffect(() => {
    fetchSet();
  }, [fetchSet]);

  const { flashcard, handleRemember, handleNotYet, handleReviewWeak } =
    useStudyModal({
      open: !!set,
      set,
      onTermRemembered: (term) => {
        if (set && term._id) {
          markRemembered(set._id, term._id);
        }
      },
      onTermForgotten: (term) => {
        if (set && term._id) {
          markDifficult(set._id, term._id);
        }
      },
      onReviewWeak: () => {
        // Optional: handle review weak callback
      },
    });

  const handleSwitchToQuiz = () => {
    if (set) {
      router.push(`${basePrefix}/vocabulary/${set._id}/quiz`);
    }
  };

  const handleBack = () => {
    router.push(`${basePrefix}/vocabulary/${setId}`);
  };

  const handleEditSet = () => {
    if (set) {
      router.push(`${basePrefix}/vocabulary/${set._id}`);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-zinc-950">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-[#4063bb] border-t-transparent" />
          <p className="text-sm text-slate-600 dark:text-zinc-400">
            Đang tải bộ từ vựng...
          </p>
        </div>
      </div>
    );
  }

  if (error || !set) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-zinc-950">
        <div className="text-center">
          <p className="mb-4 text-sm font-semibold text-red-600 dark:text-red-400">
            {error || "Không tìm thấy bộ từ vựng"}
          </p>
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 dark:bg-zinc-100 dark:text-zinc-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  return (
    <section className="relative min-h-screen overflow-hidden bg-slate-50 pb-16 pt-20 dark:bg-zinc-950">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(64,99,187,0.16),_rgba(15,23,42,0)_55%)] dark:bg-[radial-gradient(circle_at_top,_rgba(64,99,187,0.24),_rgba(3,7,18,0)_65%)]" />
      <div className="relative mx-auto max-w-6xl space-y-5 px-4 xs:px-5">
        {/* HEADER */}
        <header className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/90 px-4 py-4 shadow-xl shadow-slate-900/5 ring-1 ring-slate-900/5 backdrop-blur-xl xs:px-5 xs:py-5 sm:px-6 sm:py-6 dark:border-zinc-800/60 dark:bg-zinc-900/90 dark:shadow-black/20">
          {/* background soft gradient */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#4063bb0f] via-sky-200/30 to-emerald-100/20 dark:from-[#4063bb22] dark:via-sky-500/5 dark:to-emerald-500/5" />
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#4063bb26] blur-[120px] dark:bg-[#4063bb33]" />

          <div className="relative z-10">
            {/* Back button + Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={handleBack}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/70 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:text-[#4063bb] xs:px-4 xs:text-sm dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-200"
              >
                <ArrowLeft className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
                <span>Trở về</span>
              </button>
              <button
                onClick={handleSwitchToQuiz}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/70 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:text-[#4063bb] xs:px-4 xs:text-sm dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-100"
              >
                <BookOpen className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
                Chuyển sang Quiz
              </button>
            </div>
          </div>
        </header>

        {/* Main content chứa flashcard */}
        <StudyPageContent
          completed={flashcard.completed}
          currentTerm={flashcard.currentTerm}
          currentIndex={flashcard.currentIndex}
          totalTerms={flashcard.totalTerms}
          progress={flashcard.progress}
          remembered={flashcard.remembered.length}
          notYet={flashcard.notYet.length}
          isFlipped={flashcard.isFlipped}
          onFlip={flashcard.handleFlip}
          onPrevious={flashcard.handlePrevious}
          onNext={flashcard.handleNext}
          onRemember={handleRemember}
          onNotYet={handleNotYet}
          onRestart={flashcard.resetProgress}
          onReviewWeak={handleReviewWeak}
          onLearnMode={handleSwitchToQuiz}
        />
      </div>
    </section>
  );
}