/* eslint-disable @typescript-eslint/no-explicit-any */
// frontend/src/components/features/vocabulary/VocabularyPageClient.tsx
"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { BookOpenCheck, Filter, Layers, Plus, Search, Tag } from "lucide-react";
import { useVocabulary } from "@/hooks/vocabulary/useVocabulary";
import { useVocabularyProgress } from "@/hooks/vocabulary/useVocabularyProgress";
import {
  VocabularySet,
  VocabularyTerm,
  CreateVocabularySetDTO,
  UpdateVocabularySetDTO,
  AddTermDTO,
  UpdateTermDTO,
} from "@/types/vocabulary.types";
import { VocabularySetSkeleton } from "./VocabularySetSkeleton";
import { VocabularySetCard } from "./VocabularySetCard";
import { SetComposerModal } from "./CreateVocabularySetModal";
import { TermComposerModal } from "./AddTermModal";
import { EmptyState } from "./EmptyState";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useRouter, usePathname } from "next/navigation";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";

/* ------------------------------- HEADER UI ------------------------------- */

type HeaderLabels = {
  badge: string;
  title: string;
  description: string;
  statsSets: string;
  statsTerms: string;
  cta: string;
};

function VocabularyHeader({
  totalSets,
  totalTerms,
  onCreate,
  labels,
}: {
  totalSets: number;
  totalTerms: number;
  onCreate: () => void;
  labels: HeaderLabels;
}) {
  return (
    <header className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/90 px-4 py-4 shadow-xl shadow-slate-900/5 ring-1 ring-slate-900/5 backdrop-blur-xl xs:px-5 xs:py-5 sm:px-6 sm:py-6 dark:border-zinc-800/60 dark:bg-zinc-900/90 dark:shadow-black/20">
      {/* background soft gradient */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#4063bb0f] via-sky-200/30 to-emerald-100/20 dark:from-[#4063bb22] dark:via-sky-500/5 dark:to-emerald-500/5" />
      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#4063bb26] blur-[120px] dark:bg-[#4063bb33]" />

      <div className="relative z-10 space-y-5">
        {/* Pill + icon */}
        <div className="inline-flex items-center gap-3 rounded-2xl border border-white/70 bg-white/80 px-3 py-2 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/80">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4063bb] to-sky-500 shadow-lg shadow-[#4063bb4d] xs:h-10 xs:w-10">
            <BookOpenCheck className="h-4 w-4 text-white xs:h-5 xs:w-5" />
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.26em] text-slate-500 dark:text-zinc-400 xs:text-[11px]">
            {labels.badge}
          </div>
        </div>

        {/* Title + desc */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 xs:text-3xl sm:text-[32px] sm:leading-tight dark:text-white">
            {labels.title}
          </h1>
          <p className="max-w-2xl text-[13px] leading-relaxed text-slate-600 xs:text-sm dark:text-zinc-300">
            {labels.description}
          </p>
        </div>

        {/* Stats + CTA – mobile first */}
        <div className="flex flex-col gap-3 xs:flex-row xs:items-center xs:justify-between">
          {/* Stats row – scroll ngang nếu chật */}
          <div className="flex w-full gap-2 overflow-x-auto pb-1 xs:w-auto">
            <MiniStat
              icon={<Layers className="h-3.5 w-3.5" />}
              label={labels.statsSets}
              value={totalSets}
            />
            <MiniStat
              icon={<Tag className="h-3.5 w-3.5" />}
              label={labels.statsTerms}
              value={totalTerms}
            />
          </div>

          {/* CTA */}
          <button
            onClick={onCreate}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#4063bb] to-[#2d4c9b] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#2d4c9b33] transition hover:brightness-110 xs:w-auto"
          >
            <Plus className="h-4 w-4" />
            <span className="whitespace-nowrap">{labels.cta}</span>
          </button>
        </div>
      </div>
    </header>
  );
}

/* ----------------------------- MINI STAT BADGE ---------------------------- */

function MiniStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="inline-flex min-w-[140px] flex-1 items-center gap-2 rounded-2xl border border-white/70 bg-white/80 px-3 py-2 text-[11px] font-medium text-slate-600 shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900/80 dark:text-zinc-200">
      <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#4063bb]/10 text-[#4063bb] dark:bg-[#4063bb]/20 dark:text-sky-200">
        {icon}
      </span>
      <span className="flex items-center gap-1">
        {label}
        <span className="font-semibold text-slate-900 dark:text-white">
          {value}
        </span>
      </span>
    </div>
  );
}

/* ------------------------------ FILTER CHIP ------------------------------- */

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
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4063bb]/40",
        active
          ? "border-transparent bg-gradient-to-r from-[#4063bb] to-[#2d4c9b] text-white shadow-md shadow-[#2d4c9b33]"
          : "border-slate-200 bg-white/90 text-slate-600 hover:border-[#4063bb66] hover:text-[#4063bb] dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-200"
      )}
    >
      {icon}
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
}

/* ---------------------------- MAIN PAGE CLIENT ---------------------------- */

export function VocabularyPageClient() {
  const router = useRouter();
  const pathname = usePathname();
  const basePrefix = useBasePrefix();
  const t = useTranslations("vocabulary.page");
  const tToast = useTranslations("vocabulary.toast");
  const tError = useTranslations("vocabulary.errors");
  const tConfirm = useTranslations("vocabulary.confirm");

  const {
    sets,
    loading,
    error,
    createSet,
    updateSet,
    deleteSet,
    addTerm,
    updateTerm,
    deleteTerm,
    refreshSet,
    fetchSets,
  } = useVocabulary();

  const { getProgressForSet, markRemembered, markDifficult } =
    useVocabularyProgress();

  // Track previous pathname to detect navigation back from detail page
  const prevPathnameRef = React.useRef<string | null>(null);

  // Refetch when navigating back to this page from detail page
  React.useEffect(() => {
    const currentPath = pathname || "";
    const isVocabularyPage =
      currentPath.includes("/vocabulary") &&
      !currentPath.match(/\/vocabulary\/[^/]+$/);
    const wasDetailPage =
      prevPathnameRef.current?.match(/\/vocabulary\/[^/]+$/);

    // If we were on a detail page and now we're back on the main vocabulary page, refetch
    if (wasDetailPage && isVocabularyPage) {
      // Small delay to ensure navigation is complete
      const timeoutId = setTimeout(() => {
        fetchSets();
      }, 200);

      return () => {
        clearTimeout(timeoutId);
      };
    }

    // Update previous pathname
    prevPathnameRef.current = currentPath;
  }, [pathname, fetchSets]);

  const [filters, setFilters] = React.useState({
    query: "",
    sort: "recent" as "recent" | "alphabetical" | "terms",
  });

  const [composer, setComposer] = React.useState<{
    open: boolean;
    mode: "create" | "edit";
    set?: VocabularySet | null;
  }>({ open: false, mode: "create" });

  const [termModal, setTermModal] = React.useState<{
    open: boolean;
    mode: "create" | "edit";
    setId?: string;
    term?: VocabularyTerm | null;
  }>({ open: false, mode: "create" });

  const [deleteTarget, setDeleteTarget] = React.useState<VocabularySet | null>(
    null
  );

  const [deleteTermTarget, setDeleteTermTarget] = React.useState<{
    set: VocabularySet;
    term: VocabularyTerm;
  } | null>(null);

  const handleQuickAdd = React.useCallback(
    async (setId: string, payload: AddTermDTO) => {
      await addTerm(setId, payload);
    },
    [addTerm]
  );

  /* ---------------------------- FILTER + SORT ---------------------------- */

  const filteredSets = React.useMemo(() => {
    // Ensure sets is always an array
    const safeSets = Array.isArray(sets) ? sets : [];
    const query = filters.query.trim().toLowerCase();

    return [...safeSets]
      .filter((set) => {
        if (!query) return true;
        return [set.title, set.description, set.topic]
          .filter(Boolean)
          .some((v) => v?.toLowerCase().includes(query));
      })
      .sort((a, b) => {
        if (filters.sort === "alphabetical") {
          return a.title.localeCompare(b.title);
        }
        if (filters.sort === "terms") {
          return b.terms.length - a.terms.length;
        }

        return (
          new Date(b.updatedAt ?? b.createdAt).getTime() -
          new Date(a.updatedAt ?? a.createdAt).getTime()
        );
      });
  }, [sets, filters]);

  const totalTerms = React.useMemo(() => {
    const safeSets = Array.isArray(sets) ? sets : [];
    return safeSets.reduce((sum, s) => sum + (s.terms?.length || 0), 0);
  }, [sets]);

  /* --------------------------- ACTION HANDLERS --------------------------- */

  const handleOpenSet = React.useCallback(
    (set: VocabularySet) => {
      router.push(`${basePrefix}/vocabulary/${set._id}`);
    },
    [router, basePrefix]
  );

  const handleOpenPractice = React.useCallback(
    async (set: VocabularySet, mode: "flashcard" | "quiz" = "flashcard") => {
      if (mode === "flashcard") {
        // Navigate to study page
        router.push(`${basePrefix}/vocabulary/${set._id}/study`);
      } else {
        // Navigate to quiz page
        router.push(`${basePrefix}/vocabulary/${set._id}/quiz`);
      }
    },
    [router, basePrefix]
  );

  /* ------------------------------ RENDER UI ------------------------------ */

  const renderContent = () => {
    if (loading) {
      return (
        <div className="py-6 xs:py-8 sm:py-10">
          <VocabularySetSkeleton />
        </div>
      );
    }

    if (!filteredSets.length) {
      return (
        <div className="py-6 xs:py-8 sm:py-10">
            <EmptyState
              title={t("empty.title")}
              description={t("empty.description")}
            />
        </div>
      );
    }

    return (
      <div
        className="
        grid grid-cols-2
        md:grid-cols-3
        lg:grid-cols-4
        gap-3 xs:gap-4
        items-stretch
        auto-rows-[minmax(240px,1fr)]
      "
      >
        {filteredSets.map((set) => (
          <VocabularySetCard
            key={set._id}
            set={set}
            progress={getProgressForSet(set._id, set.terms.length)}
            onOpen={() => handleOpenSet(set)}
            onStudy={() => handleOpenPractice(set, "flashcard")}
            onQuickQuiz={() => handleOpenPractice(set, "quiz")}
            onEdit={() => setComposer({ open: true, mode: "edit", set })}
            onDuplicate={async () => {
              await createSet({
                title: `${set.title} ${t("duplicateSuffix")}`,
                description: set.description,
                topic: set.topic,
                terms: set.terms.map(({ _id, ...rest }) => rest),
              });
              toast.success(tToast("duplicateSuccess"));
            }}
            onDelete={() => setDeleteTarget(set)}
          />
        ))}
      </div>
    );
  };
  /* ---------------------------- MAIN RETURN ---------------------------- */

  return (
    <section className="relative min-h-screen overflow-hidden bg-slate-50 pb-16 dark:bg-zinc-950 pt-20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(64,99,187,0.16),_rgba(15,23,42,0)_55%)] dark:bg-[radial-gradient(circle_at_top,_rgba(64,99,187,0.24),_rgba(3,7,18,0)_65%)]" />
      <div className="relative mx-auto max-w-6xl space-y-5 px-4 xs:px-5">
        {/* HEADER */}
        <VocabularyHeader
          totalSets={Array.isArray(sets) ? sets.length : 0}
          totalTerms={totalTerms}
          onCreate={() => setComposer({ open: true, mode: "create" })}
          labels={{
            badge: t("header.badge"),
            title: t("header.title"),
            description: t("header.description"),
            statsSets: t("header.stats.sets"),
            statsTerms: t("header.stats.terms"),
            cta: t("header.cta"),
          }}
        />

        {/* Error */}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 shadow-sm sm:text-sm dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </div>
        )}

        {/* Filter Bar – mobile friendly */}
        <div className="rounded-3xl border border-white/80 bg-white/90 p-4 shadow-lg shadow-slate-900/5 backdrop-blur-xl xs:p-5 dark:border-zinc-800/60 dark:bg-zinc-900/90">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            {/* Search */}
            <div className="w-full md:max-w-md">
              <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-zinc-400 xs:text-[11px]">
                {t("filters.searchLabel")}
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
                <input
                  value={filters.query}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, query: e.target.value }))
                  }
                  placeholder={t("filters.searchPlaceholder")}
                  className="w-full rounded-2xl border border-slate-200/80 bg-white 
             py-2 pl-9 pr-3 text-[13px] placeholder:text-[12px]
             xs:py-2.5 xs:pl-10 xs:text-sm xs:placeholder:text-sm
             text-slate-900 outline-none transition
             focus:border-[#4063bb] focus:ring-2 focus:ring-[#4063bb1f]
             dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 
             dark:placeholder:text-zinc-500"
                />
              </div>
            </div>

            {/* Chips */}
            <div className="w-full md:w-auto">
              <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-zinc-400 xs:text-[11px]">
                {t("filters.sortLabel")}
              </label>
              <div className="flex gap-2 overflow-x-auto pb-1">
                <FilterChip
                  icon={<Filter className="h-3.5 w-3.5" />}
                  label={t("filters.sortOptions.recent")}
                  active={filters.sort === "recent"}
                  onClick={() => setFilters((p) => ({ ...p, sort: "recent" }))}
                />
                <FilterChip
                  label={t("filters.sortOptions.alphabetical")}
                  active={filters.sort === "alphabetical"}
                  onClick={() =>
                    setFilters((p) => ({ ...p, sort: "alphabetical" }))
                  }
                />
                <FilterChip
                  label={t("filters.sortOptions.terms")}
                  active={filters.sort === "terms"}
                  onClick={() => setFilters((p) => ({ ...p, sort: "terms" }))}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        {renderContent()}
      </div>

      {/* Modals */}
      <SetComposerModal
        open={composer.open}
        mode={composer.mode}
        initialSet={composer.set ?? undefined}
        onClose={() => setComposer({ open: false, mode: "create" })}
        onSubmit={async (payload) => {
          try {
            if (composer.mode === "edit" && composer.set) {
              await updateSet(
                composer.set._id,
                payload as UpdateVocabularySetDTO
              );
              toast.success(tToast("setUpdateSuccess"));
            } else {
              await createSet(payload as CreateVocabularySetDTO);
              toast.success(tToast("setCreateSuccess"));
            }
          } catch (err: any) {
            console.error("Error saving vocabulary set:", err);
            const message =
              err instanceof Error ? err.message : tError("saveSet");
            // Only show error if it's a real error
            if (err?.status && err.status >= 400) {
              toast.error(message);
            } else if (!err?.message?.includes("Network error")) {
              toast.error(message);
            }
            throw err; // Re-throw để modal có thể xử lý
          }
        }}
      />

      <TermComposerModal
        open={termModal.open}
        mode={termModal.mode}
        initialTerm={termModal.term}
        onClose={() => setTermModal({ open: false, mode: "create" })}
        onSubmit={async (data) => {
          if (!termModal.setId) return;
          try {
            if (termModal.mode === "edit" && termModal.term) {
              await updateTerm(
                termModal.setId,
                termModal.term._id!,
                data as UpdateTermDTO
              );
              toast.success(tToast("termUpdateSuccess"));
            } else {
              await addTerm(termModal.setId, data as AddTermDTO);
              toast.success(tToast("termCreateSuccess"));
            }
          } catch (err: any) {
            console.error("Error saving vocabulary term:", err);
            const message =
              err instanceof Error ? err.message : tError("saveTerm");
            // Only show error if it's a real error
            if (err?.status && err.status >= 400) {
              toast.error(message);
            } else if (!err?.message?.includes("Network error")) {
              toast.error(message);
            }
            throw err; // Re-throw để modal có thể xử lý
          }
        }}
      />

      {/* Delete confirm */}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            await deleteSet(deleteTarget._id);
            toast.success(tToast("setDeleteSuccess"));
            setDeleteTarget(null);
          } catch (err: any) {
            console.error("Error deleting vocabulary set:", err);
            const message =
              err instanceof Error ? err.message : tError("deleteSet");
            // Only show error if it's a real error
            if (err?.status && err.status >= 400) {
              toast.error(message);
            } else if (!err?.message?.includes("Network error")) {
              toast.error(message);
            }
          }
        }}
        title={tConfirm("deleteSet.title")}
        message={tConfirm("deleteSet.message")}
        icon="warning"
        confirmText={tConfirm("deleteSet.confirm")}
        confirmColor="red"
      />

      <ConfirmModal
        open={!!deleteTermTarget}
        onClose={() => setDeleteTermTarget(null)}
        onConfirm={async () => {
          if (!deleteTermTarget) return;
          try {
            await deleteTerm(
              deleteTermTarget.set._id,
              deleteTermTarget.term._id!
            );
            toast.success(tToast("termDeleteSuccess"));
            setDeleteTermTarget(null);
          } catch (err: any) {
            console.error("Error deleting vocabulary term:", err);
            const message =
              err instanceof Error ? err.message : tError("deleteTerm");
            // Only show error if it's a real error
            if (err?.status && err.status >= 400) {
              toast.error(message);
            } else if (!err?.message?.includes("Network error")) {
              toast.error(message);
            }
          }
        }}
        title={tConfirm("deleteTerm.title")}
        message={tConfirm("deleteTerm.message")}
        icon="warning"
        confirmText={tConfirm("deleteTerm.confirm")}
        confirmColor="red"
      />
    </section>
  );
}
