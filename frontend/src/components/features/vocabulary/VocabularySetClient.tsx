/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Tag, Layers, ArrowLeft, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  VocabularySet,
  VocabularyTerm,
  AddTermDTO,
  UpdateTermDTO,
  UpdateVocabularySetDTO,
} from "@/types/vocabulary.types";
import { vocabularyService } from "@/utils/vocabulary.service";
import { SetComposerModal } from "./CreateVocabularySetModal";
import { TermComposerModal } from "./AddTermModal";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { toast } from "@/lib/toast";
import { useVocabularyProgress } from "@/hooks/vocabulary/useVocabularyProgress";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";
import { useTranslations } from "next-intl";

interface VocabularySetClientProps {
  setId: string;
}

interface TermModalState {
  open: boolean;
  mode: "create" | "edit";
  setId?: string;
  term?: VocabularyTerm | null;
}

export function VocabularySetClient({ setId }: VocabularySetClientProps) {
  const tExtra = useTranslations("vocabularyExtra");
  const router = useRouter();
  const basePrefix = useBasePrefix();
  const { markRemembered, markDifficult } = useVocabularyProgress();
  const [setData, setSetData] = React.useState<VocabularySet | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [composerOpen, setComposerOpen] = React.useState(false);
  const [termModal, setTermModal] = React.useState<TermModalState>({
    open: false,
    mode: "create",
  });
  const [deleteSetTarget, setDeleteSetTarget] = React.useState(false);
  const [deleteTermTarget, setDeleteTermTarget] = React.useState<{
    set?: VocabularySet;
    term?: VocabularyTerm;
  } | null>(null);
  const [filters, setFilters] = React.useState({
    query: "",
    sort: "recent" as "recent" | "alphabetical" | "partOfSpeech",
  });
  const termModalRef = React.useRef(termModal);

  React.useEffect(() => {
    termModalRef.current = termModal;
  }, [termModal]);

  const fetchSet = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await vocabularyService.getVocabularySetById(setId);
      setSetData(data);
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

  // Auto-save pending word when entering vocabulary set page
  React.useEffect(() => {
    const handleAutoSave = async () => {
      const pendingWordData = localStorage.getItem("pendingVocabularyWord");
      if (!pendingWordData || !setId) return;

      try {
        const wordData = JSON.parse(pendingWordData);
        if (!wordData.word || !wordData.meaning) return;

        // Auto-save the word to this set
        const response = await fetch(`/api/vocabulary/${setId}/term`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            word: wordData.word,
            meaning: wordData.meaning,
            englishMeaning: wordData.englishMeaning,
            partOfSpeech: wordData.partOfSpeech,
            phonetic: wordData.phonetic,
            example: wordData.example,
            translatedExample: wordData.translatedExample,
          }),
        });

        if (response.ok) {
          // Clear localStorage
          localStorage.removeItem("pendingVocabularyWord");

          // Show success message
          toast.success(tExtra("toast.termSaved"));

          // Navigate back to news page if returnUrl exists
          if (wordData.returnUrl) {
            setTimeout(() => {
              router.push(wordData.returnUrl);
            }, 500); // Small delay to show the success message
          }
        } else {
          const error = await response.json();
          throw new Error(
            error.error || error.message || "Failed to save word"
          );
        }
      } catch (error: any) {
        console.error("Error auto-saving word:", error);
        // Don't show error toast, just clear localStorage to prevent retry loops
        localStorage.removeItem("pendingVocabularyWord");
      }
    };

    // Only auto-save if we have set data loaded
    if (setData && !loading) {
      handleAutoSave();
    }
  }, [setId, setData, loading, router]);

  const handleUpdateSet = async (payload: UpdateVocabularySetDTO) => {
    // Use setId from props instead of setData._id to ensure consistency
    const targetSetId = setId || setData?._id;
    if (!targetSetId) {
      toast.error(tExtra("toast.noSetIdUpdate"));
      throw new Error("Missing setId when updating vocabulary set");
    }

    try {
      console.log("Updating vocabulary set:", {
        setId: targetSetId,
        setDataId: setData?._id,
        propsSetId: setId,
        payload,
      });

      const updated = await vocabularyService.updateVocabularySet(
        targetSetId,
        payload
      );
      setSetData(updated);
      toast.success(tExtra("toast.setUpdated"));
    } catch (err: any) {
      console.error("Error updating vocabulary set:", {
        error: err,
        status: err?.status,
        message: err?.message,
        response: err?.response,
        targetSetId,
        setDataId: setData?._id,
        propsSetId: setId,
      });

      // If "not found" error, try to refresh data
      if (err?.status === 404 || err?.message?.includes("not found")) {
        console.log("Set not found, refreshing data...");
        await fetchSet();
      }

      const message =
        err instanceof Error ? err.message : tExtra("errors.setUpdateFailed");
      // Only show error if it's a real error
      if (err?.status && err.status >= 400) {
        toast.error(message);
      } else if (!err?.message?.includes("Network error")) {
        toast.error(message);
      }
      throw err; // Re-throw để modal có thể xử lý
    }
  };

  const handleTermSubmit = async (payload: AddTermDTO | UpdateTermDTO) => {
    const context = termModalRef.current;
    const targetSetId = context.setId ?? setData?._id;
    if (!targetSetId) {
      toast.error(tExtra("toast.noSetId"));
      throw new Error("Missing setId when saving vocabulary term");
    }
    try {
      console.log("Saving vocabulary term:", {
        mode: context.mode,
        setId: targetSetId,
        termId: context.term?._id,
        payload,
      });

      let updated: VocabularySet;
      if (context.mode === "edit" && context.term?._id) {
        updated = await vocabularyService.updateTerm(
          targetSetId,
          context.term._id,
          payload as UpdateTermDTO
        );
      } else {
        updated = await vocabularyService.addTerm(
          targetSetId,
          payload as AddTermDTO
        );
      }
      setSetData(updated);
      toast.success(
        context.mode === "edit"
          ? tExtra("toast.termUpdated")
          : tExtra("toast.termAdded")
      );
    } catch (err: any) {
      // Better error logging - extract all possible error information
      const errorInfo = {
        name: err?.name,
        message: err?.message,
        status: err?.status,
        code: err?.code,
        stack: err?.stack,
        response: err?.response,
        // Try to extract message from response if available
        responseMessage:
          err?.response?.message || err?.response?.raw || err?.response,
      };

      console.error("Error saving vocabulary term:", errorInfo);
      console.error("Full error object:", err);

      // If "not found" error, try to refresh data
      if (err?.status === 404 || err?.message?.includes("not found")) {
        console.log("Set or term not found, refreshing data...");
        await fetchSet();
      }

      // Extract error message from various possible sources
      let message = tExtra("errors.saveTermFailed");
      if (err instanceof Error) {
        message = err.message || message;
      } else if (err?.message) {
        message = err.message;
      } else if (err?.response?.message) {
        message = err.response.message;
      } else if (typeof err === "string") {
        message = err;
      }

      // Apply translation if available
      const errorTranslations: Record<string, string> = {
        "Failed to add term": tExtra("errorMap.failedToAddTerm"),
        "Failed to add term: Database operation returned no result. This may indicate a permission issue or database error.":
          tExtra("errorMap.permissionDenied"),
        "Vocabulary set not found": tExtra("errorMap.setNotFound"),
        "Unauthorized access to vocabulary set": tExtra(
          "errorMap.accessDenied"
        ),
        "Invalid vocabulary set ID": tExtra("errorMap.invalidSetId"),
      };

      if (errorTranslations[message]) {
        message = errorTranslations[message];
      }

      // Only show error if it's not a network error that might have succeeded
      if (err?.status && err.status >= 400) {
        toast.error(message);
      } else if (!err?.message?.includes("Network error")) {
        toast.error(message);
      }
      throw err; // Re-throw để modal có thể xử lý
    }
  };

  const handleDeleteTerm = async () => {
    if (!deleteTermTarget?.set || !deleteTermTarget.term?._id) return;
    try {
      console.log("Deleting vocabulary term:", {
        setId: deleteTermTarget.set._id,
        termId: deleteTermTarget.term._id,
      });

      const updated = await vocabularyService.deleteTerm(
        deleteTermTarget.set._id,
        deleteTermTarget.term._id
      );
      setSetData(updated);
      toast.success(tExtra("toast.termDeleted"));
    } catch (err: any) {
      console.error("Error deleting vocabulary term:", {
        error: err,
        status: err?.status,
        message: err?.message,
        response: err?.response,
        setId: deleteTermTarget?.set?._id,
        termId: deleteTermTarget?.term?._id,
      });

      // If "not found" error, try to refresh data
      if (err?.status === 404 || err?.message?.includes("not found")) {
        console.log("Set or term not found, refreshing data...");
        await fetchSet();
      }

      const message =
        err instanceof Error ? err.message : tExtra("errors.deleteFailed");
      // Only show error if it's a real error (not network timeout that might have succeeded)
      if (err?.status && err.status >= 400) {
        toast.error(message);
      } else if (!err?.message?.includes("Network error")) {
        toast.error(message);
      }
    } finally {
      setDeleteTermTarget(null);
    }
  };

  const handleDeleteSet = async () => {
    if (!setData) return;
    try {
      await vocabularyService.deleteVocabularySet(setData._id);
      toast.success(tExtra("toast.setDeleted"));
      router.push(`${basePrefix}/vocabulary`);
    } catch (err: any) {
      console.error("Error deleting vocabulary set:", err);
      const message =
        err instanceof Error ? err.message : tExtra("errors.setDeleteFailed");
      // Only show error if it's a real error
      if (err?.status && err.status >= 400) {
        toast.error(message);
      } else if (!err?.message?.includes("Network error")) {
        toast.error(message);
      }
    } finally {
      setDeleteSetTarget(false);
    }
  };

  const handleRemembered = (term: VocabularyTerm) => {
    if (!setData || !term._id) return;
    markRemembered(setData._id, term._id);
  };

  const handleForgotten = (term: VocabularyTerm) => {
    if (!setData || !term._id) return;
    markDifficult(setData._id, term._id);
  };

  const filteredTerms = React.useMemo(() => {
    if (!setData) return [];
    const keyword = filters.query.trim().toLowerCase();

    let filtered = setData.terms;

    // Filter by search query
    if (keyword) {
      filtered = filtered.filter((term) => {
        const text = [
          term.word,
          term.meaning,
          term.phonetic,
          term.englishMeaning,
          term.example,
          term.translatedExample,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return text.includes(keyword);
      });
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      if (filters.sort === "alphabetical") {
        return a.word.localeCompare(b.word);
      }
      if (filters.sort === "partOfSpeech") {
        const aPos = a.partOfSpeech || "";
        const bPos = b.partOfSpeech || "";
        if (aPos !== bPos) {
          return aPos.localeCompare(bPos);
        }
        return a.word.localeCompare(b.word);
      }
      // recent - keep original order (newest first based on addedAt or index)
      return 0;
    });

    return sorted;
  }, [filters, setData]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !setData) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 px-4 text-center dark:bg-zinc-900">
        <p className="text-sm text-red-600 dark:text-red-400">
          {error || tExtra("errors.notFound")}
        </p>
        <button
          onClick={() => router.push(`${basePrefix}/vocabulary`)}
          className="rounded-2xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:-translate-y-0.5 dark:bg-white dark:text-zinc-900"
        >
          {tExtra("actions.backToList")}
        </button>
      </div>
    );
  }

  const handleStartPractice = (mode: "flashcard" | "quiz") => {
    if (!setData) return;
    if (mode === "flashcard") {
      router.push(`${basePrefix}/vocabulary/${setData._id}/study`);
    } else {
      router.push(`${basePrefix}/vocabulary/${setData._id}/quiz`);
    }
  };

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
            <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
              {/* Back button */}
              <button
                onClick={() => router.push(`${basePrefix}/vocabulary`)}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl border border-white/70 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:text-[#4063bb] xs:px-4 xs:text-sm dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-200"
              >
                <ArrowLeft className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
                {/* Mobile: chỉ icon, từ xs trở lên mới hiện text */}
                <span className="hidden xs:inline">
                  {tExtra("actions.backToList")}
                </span>
              </button>

              {/* Action buttons bên phải */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setComposerOpen(true)}
                  className="rounded-2xl border border-white/70 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:text-[#4063bb] xs:px-4 xs:text-sm dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-100"
                >
                  {tExtra("actions.editSet")}
                </button>
                <button
                  onClick={() => setDeleteSetTarget(true)}
                  className="rounded-2xl border border-red-200/70 bg-white/90 px-3 py-2 text-xs font-semibold text-red-600 shadow-sm transition hover:border-red-300 xs:px-4 xs:text-sm dark:border-red-900/40 dark:bg-zinc-900/80 dark:text-red-300"
                >
                  {tExtra("actions.deleteSet")}
                </button>
              </div>
            </div>

            {/* Title + desc */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 xs:text-3xl sm:text-[32px] sm:leading-tight dark:text-white">
                {setData.title}
              </h1>
              <p className="max-w-2xl text-[13px] leading-relaxed text-slate-600 xs:text-sm dark:text-zinc-300">
                {setData.description || tExtra("setDetail.noDescription")}
              </p>
            </div>

            {/* Stats + Actions – mobile first */}
            <div className="flex flex-col gap-3 xs:flex-row xs:items-center xs:justify-between">
              {/* Stats row */}
              <div className="flex flex-col gap-2 xs:flex-row xs:flex-wrap xs:justify-start">
                <div className="inline-flex min-w-[140px] flex-1 items-center gap-2 rounded-2xl border border-white/70 bg-white/80 px-3 py-2 text-[11px] font-medium text-slate-600 shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900/80 dark:text-zinc-200">
                  <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#4063bb]/10 text-[#4063bb] dark:bg-[#4063bb]/20 dark:text-sky-200">
                    <Tag className="h-3.5 w-3.5" />
                  </span>
                  <span className="flex items-center gap-1">
                    {tExtra("labels.totalTerms")}
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {setData.terms.length}
                    </span>
                  </span>
                </div>
                {setData.topic && (
                  <div className="inline-flex min-w-[140px] flex-1 items-center gap-2 rounded-2xl border border-white/70 bg-white/80 px-3 py-2 text-[11px] font-medium text-slate-600 shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900/80 dark:text-zinc-200">
                    <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#4063bb]/10 text-[#4063bb] dark:bg-[#4063bb]/20 dark:text-sky-200">
                      <Layers className="h-3.5 w-3.5" />
                    </span>
                    <span className="flex items-center gap-1">
                      {tExtra("labels.topic")}
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {setData.topic}
                      </span>
                    </span>
                  </div>
                )}
              </div>

              {/* Action buttons dưới */}
              <div className="flex flex-col gap-2 xs:flex-row xs:flex-wrap xs:justify-end">
                <button
                  onClick={() =>
                    setTermModal({
                      open: true,
                      mode: "create",
                      setId: setData._id,
                    })
                  }
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/70 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:text-[#4063bb] xs:w-auto xs:px-4 xs:text-sm dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-100"
                >
                  <Plus className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
                  <span>{tExtra("actions.addTerm")}</span>
                </button>
                <button
                  onClick={() => handleStartPractice("flashcard")}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#4063bb] to-[#2d4c9b] px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-[#2d4c9b33] transition hover:brightness-110 xs:w-auto xs:px-4 xs:text-sm"
                >
                  {tExtra("actions.practiceFlashcard")}
                </button>
                <button
                  onClick={() => handleStartPractice("quiz")}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/70 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:text-[#4063bb] xs:w-auto xs:px-4 xs:text-sm dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-100"
                >
                  {tExtra("actions.quickQuiz")}
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Filter Bar – mobile friendly */}
        <div className="rounded-3xl border border-white/80 bg-white/90 p-4 shadow-lg shadow-slate-900/5 backdrop-blur-xl xs:p-5 dark:border-zinc-800/60 dark:bg-zinc-900/90">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            {/* Search */}
            <div className="w-full md:max-w-md">
              <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-zinc-400 xs:text-[11px]">
                {tExtra("labels.quickSearch")}
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
                <input
                  value={filters.query}
                  onChange={(event) =>
                    setFilters((prev) => ({
                      ...prev,
                      query: event.target.value,
                    }))
                  }
                  placeholder={tExtra("setDetail.searchPlaceholder")}
                  className="
    w-full rounded-2xl border border-slate-200/80 bg-white
    py-2 pl-9 pr-3 
    text-[13px] placeholder:text-[12px]
    xs:py-2.5 xs:pl-10 xs:text-sm xs:placeholder:text-sm
    text-slate-900 outline-none transition

    focus:border-[#4063bb] focus:ring-2 focus:ring-[#4063bb1f]

    dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 
    dark:placeholder:text-zinc-500
  "
                />
              </div>
            </div>

            {/* Chips */}
            <div className="w-full md:w-auto">
              <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-zinc-400 xs:text-[11px]">
                {tExtra("labels.sortFilter")}
              </label>
              <div className="flex gap-2 overflow-x-auto pb-1">
                <FilterChip
                  icon={<Filter className="h-3.5 w-3.5" />}
                  label={tExtra("setDetail.filterNew")}
                  active={filters.sort === "recent"}
                  onClick={() => setFilters((p) => ({ ...p, sort: "recent" }))}
                />
                <FilterChip
                  label={tExtra("sort.alphabetical")}
                  active={filters.sort === "alphabetical"}
                  onClick={() =>
                    setFilters((p) => ({ ...p, sort: "alphabetical" }))
                  }
                />
                <FilterChip
                  label={tExtra("sort.partOfSpeech")}
                  active={filters.sort === "partOfSpeech"}
                  onClick={() =>
                    setFilters((p) => ({ ...p, sort: "partOfSpeech" }))
                  }
                />
              </div>
            </div>
          </div>
        </div>

        {/* Terms List - đơn giản, dễ scan hơn */}
        <div className="rounded-3xl border border-white/80 bg-white/90 p-4 shadow-sm shadow-slate-900/5 backdrop-blur-xl xs:p-5 dark:border-zinc-800/60 dark:bg-zinc-900/90">
          <div className="mb-3 xs:mb-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-zinc-400 xs:text-[11px]">
              {tExtra("labels.studyDeck")}
            </p>
            <h2 className="text-xl font-semibold text-slate-900 xs:text-2xl dark:text-zinc-50">
              {tExtra("labels.termList")}
            </h2>
            <p className="mt-1 text-xs text-slate-500 xs:text-sm dark:text-zinc-400">
              {tExtra("labels.termListHint")}
            </p>
          </div>

          {filteredTerms.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 px-4 py-8 text-center text-sm text-slate-500 dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-400">
              {filters.query.trim()
                ? tExtra("setDetail.noResults")
                : tExtra("setDetail.noTerms")}
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-zinc-800">
              {filteredTerms.map((term, index) => (
                <article
                  key={term._id || `${term.word}-${index}`}
                  className="py-3 xs:py-3.5 md:py-4"
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    {/* Info bên trái */}
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-medium text-slate-400 dark:text-zinc-500">
                          #{index + 1}
                        </span>
                        {term.partOfSpeech && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-600 xs:text-[11px] dark:bg-zinc-800 dark:text-zinc-300">
                            {term.partOfSpeech}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                        <h3 className="text-base font-semibold text-slate-900 xs:text-lg dark:text-zinc-50">
                          {term.word}
                        </h3>
                        {term.phonetic && (
                          <span className="text-xs text-slate-500 xs:text-sm dark:text-zinc-400">
                            {term.phonetic}
                          </span>
                        )}
                      </div>

                      {/* Nghĩa chính */}
                      <p className="text-sm font-medium text-slate-800 dark:text-zinc-200">
                        {term.meaning}
                      </p>

                      {/* Nghĩa tiếng Anh */}
                      {term.englishMeaning && (
                        <p className="text-xs text-slate-500 xs:text-[13px] dark:text-zinc-400">
                          {term.englishMeaning}
                        </p>
                      )}

                      {/* Ví dụ – gom lại thành 1 block nhỏ, đơn giản */}
                      {(term.example || term.translatedExample) && (
                        <div className="mt-1.5 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600 xs:text-[13px] dark:bg-zinc-900/70 dark:text-zinc-300">
                          {term.example && (
                            <p className="italic">
                              <span className="mr-1 font-semibold text-slate-400 dark:text-zinc-500">
                                EN:
                              </span>
                              &quot;{term.example}&quot;
                            </p>
                          )}
                          {term.translatedExample && (
                            <p className="mt-1 italic">
                              <span className="mr-1 font-semibold text-slate-400 dark:text-zinc-500">
                                VI:
                              </span>
                              &quot;{term.translatedExample}&quot;
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions bên phải */}
                    <div className="mt-2 flex flex-wrap gap-2 md:mt-0 md:min-w-[140px] md:justify-end">
                      <button
                        onClick={() =>
                          setTermModal({
                            open: true,
                            mode: "edit",
                            setId: setData._id,
                            term,
                          })
                        }
                        className="inline-flex items-center justify-center rounded-lg border border-slate-200/80 px-3 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:border-[#4063bb66] hover:text-[#4063bb] xs:text-xs dark:border-zinc-700 dark:text-zinc-100"
                      >
                        {tExtra("actions.edit")}
                      </button>
                      <button
                        onClick={() =>
                          setDeleteTermTarget({
                            set: setData,
                            term,
                          })
                        }
                        className="inline-flex items-center justify-center rounded-lg border border-red-200/70 px-3 py-1.5 text-[11px] font-semibold text-red-600 transition hover:border-red-300 xs:text-xs dark:border-red-900/40 dark:text-red-300"
                      >
                        {tExtra("actions.delete")}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
      <SetComposerModal
        open={composerOpen}
        mode="edit"
        initialSet={setData ?? undefined}
        onClose={() => setComposerOpen(false)}
        onSubmit={handleUpdateSet}
      />

      <TermComposerModal
        open={termModal.open}
        mode={termModal.mode}
        initialTerm={termModal.term}
        onClose={() => setTermModal({ open: false, mode: "create" })}
        onSubmit={handleTermSubmit}
      />

      <ConfirmModal
        open={deleteSetTarget}
        onClose={() => setDeleteSetTarget(false)}
        onConfirm={handleDeleteSet}
        title="Xóa bộ từ này?"
        message={tExtra("setDetail.deleteConfirm")}
        icon="warning"
        confirmText="Xóa"
        confirmColor="red"
      />

      <ConfirmModal
        open={!!deleteTermTarget}
        onClose={() => setDeleteTermTarget(null)}
        onConfirm={handleDeleteTerm}
        title={tExtra("modals.deleteTerm.title")}
        message={tExtra("modals.deleteTerm.message")}
        icon="warning"
        confirmText={tExtra("modals.deleteTerm.confirm")}
        confirmColor="red"
      />
    </section>
  );
}

/* ------------------------------- FILTER CHIP ------------------------------- */

function FilterChip({
  icon,
  label,
  active,
  onClick,
}: {
  icon?: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-2xl border px-3 py-1.5 text-[11px] font-semibold transition xs:text-xs",
        active
          ? "border-[#4063bb] bg-[#4063bb]/10 text-[#4063bb] dark:border-sky-400 dark:bg-sky-500/10 dark:text-sky-300"
          : "border-slate-200/80 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
