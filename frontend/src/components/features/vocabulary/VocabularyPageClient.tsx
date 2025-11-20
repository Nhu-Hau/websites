// frontend/src/components/features/vocabulary/VocabularyPageClient.tsx
"use client";

import React from "react";
import {
  BookOpenCheck,
  Filter,
  Layers,
  Plus,
  Search,
  Tag,
} from "lucide-react";
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
import { VocabularySetDetailSheet } from "./VocabularySetDetailSheet";
import { StudyModal } from "./StudyModal";
import { QuizModal } from "./QuizModal";
import { EmptyState } from "./EmptyState";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

/* ------------------------------- HEADER UI ------------------------------- */

function VocabularyHeader({
  totalSets,
  totalTerms,
  onCreate,
}: {
  totalSets: number;
  totalTerms: number;
  onCreate: () => void;
}) {
  return (
    <header
      className="
        rounded-3xl border border-[#2E5EB8]/20
        bg-gradient-to-br from-[#2E5EB8]/12 via-white to-[#2E5EB8]/5
        px-4 sm:px-6 py-6 sm:py-7 shadow-sm
        dark:border-[#2E5EB8]/40 dark:from-[#0F1A33] dark:via-zinc-900 dark:to-zinc-900/70
      "
    >
      {/* Title + Description */}
      <div className="mb-5 flex items-start gap-3">
        <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2E5EB8]/15 text-[#2E5EB8] dark:bg-[#2E5EB8]/25 dark:text-[#86A7F5] shadow-inner">
          <BookOpenCheck className="h-7 w-7" />
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">
            Bộ từ vựng
          </h1>
          <p className="text-sm text-zinc-600/80 dark:text-zinc-400 max-w-xl leading-relaxed">
            Tự tạo bộ từ, luyện flashcard và quiz nhanh — tối ưu cho TOEIC và
            lộ trình riêng của bạn.
          </p>
        </div>
      </div>

      {/* Stats + CTA */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <MiniStat
            icon={<Layers className="h-3.5 w-3.5" />}
            label="Bộ từ"
            value={totalSets}
          />
          <MiniStat
            icon={<Tag className="h-3.5 w-3.5" />}
            label="Tổng từ"
            value={totalTerms}
          />
        </div>

        <button
          onClick={onCreate}
          className="
            inline-flex items-center justify-center gap-2
            rounded-xl bg-[#2E5EB8] px-5 py-2.5 text-sm font-semibold text-white
            shadow-sm transition
            hover:-translate-y-0.5 hover:bg-[#244A90]
            dark:bg-[#2E5EB8]/90 dark:hover:bg-[#2E5EB8]
          "
        >
          <Plus className="h-4 w-4" />
          Tạo bộ từ mới
        </button>
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
    <div className="inline-flex items-center gap-2 rounded-full border border-[#2E5EB8]/25 bg-white/95 px-3 py-1.5 text-xs text-[#102347] shadow-sm dark:border-[#2E5EB8]/50 dark:bg-zinc-900 dark:text-zinc-100">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2E5EB8]/12 text-[#2E5EB8] dark:bg-[#2E5EB8]/30">
        {icon}
      </span>
      <span className="font-medium">
        {label}:{" "}
        <span className="font-semibold text-[#102347] dark:text-white">
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
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition",
        active
          ? "border-[#2E5EB8] bg-[#2E5EB8]/10 text-[#2E5EB8] dark:border-[#2E5EB8]/70 dark:bg-[#2E5EB8]/25 dark:text-[#E3ECFF]"
          : "border-zinc-200 text-zinc-600 hover:border-[#2E5EB8]/40 hover:text-[#2E5EB8] dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-[#2E5EB8]/60 dark:hover:text-[#E3ECFF]"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

/* ---------------------------- MAIN PAGE CLIENT ---------------------------- */

export function VocabularyPageClient() {
  const router = useRouter();

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
  } = useVocabulary();

  const { getProgressForSet, markRemembered, markDifficult } =
    useVocabularyProgress();

  const [filters, setFilters] = React.useState({
    query: "",
    sort: "recent" as "recent" | "alphabetical" | "terms",
  });

  const [composer, setComposer] = React.useState<{
    open: boolean;
    mode: "create" | "edit";
    set?: VocabularySet | null;
  }>({ open: false, mode: "create" });

  const [detailSet, setDetailSet] = React.useState<VocabularySet | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [studySet, setStudySet] = React.useState<VocabularySet | null>(null);
  const [quizSet, setQuizSet] = React.useState<VocabularySet | null>(null);

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

  /* ---------------------------- FILTER + SORT ---------------------------- */

  const filteredSets = React.useMemo(() => {
    const query = filters.query.trim().toLowerCase();

    return [...sets]
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

  const totalTerms = React.useMemo(
    () => sets.reduce((sum, s) => sum + s.terms.length, 0),
    [sets]
  );

  /* --------------------------- ACTION HANDLERS --------------------------- */

  const openDetail = async (set: VocabularySet) => {
    setDetailLoading(true);
    try {
      const latest = await refreshSet(set._id);
      setDetailSet(latest);
    } catch {
      setDetailSet(set);
    } finally {
      setDetailLoading(false);
    }
  };

  /* ------------------------------ RENDER UI ------------------------------ */

  const renderContent = () => {
    if (loading) {
      return (
        <div className="py-10 sm:py-12">
          <VocabularySetSkeleton />
        </div>
      );
    }

    if (!filteredSets.length) {
      return (
        <EmptyState
          title="Chưa có bộ từ nào"
          description="Tạo bộ từ đầu tiên hoặc import danh sách từ để bắt đầu học giống Quizlet nhưng tối ưu cho TOEIC."
        />
      );
    }

    return (
      <div className="grid gap-4 grid-cols-1 xs:grid-cols-2 md:grid-cols-3">
        {filteredSets.map((set, index) => (
          <VocabularySetCard
            key={set._id}
            set={set}
            progress={getProgressForSet(set._id, set.terms.length)}
            highlight={index === 0}
            onOpen={() => openDetail(set)}
            onStudy={() => setStudySet(set)}
            onQuickQuiz={() => setQuizSet(set)}
            onEdit={() => setComposer({ open: true, mode: "edit", set })}
            onDuplicate={async () => {
              await createSet({
                title: `${set.title} (copy)`,
                description: set.description,
                topic: set.topic,
                terms: set.terms.map(({ _id, ...rest }) => rest),
              });
              toast.success("Đã nhân bản bộ từ");
            }}
            onDelete={() => setDeleteTarget(set)}
          />
        ))}
      </div>
    );
  };

  /* ---------------------------- MAIN RETURN ---------------------------- */

  return (
    <section className="min-h-screen bg-zinc-50 px-4 pb-16 pt-20 dark:bg-zinc-950">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* 🔙 Back row – nằm ngoài header, chuẩn mobile + desktop */}
        {/* <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="
              inline-flex items-center gap-2 rounded-xl
              border border-zinc-200 bg-white px-3 py-2 text-xs sm:text-sm font-medium text-zinc-700
              shadow-sm hover:bg-zinc-50 active:scale-95 transition
              dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800
            "
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden xs:inline">Quay lại</span>
          </button>

          <span className="hidden sm:inline text-[11px] text-zinc-500 dark:text-zinc-400">
            Học từ vựng là kỹ năng bổ trợ cho toàn bộ lộ trình TOEIC của bạn.
          </span>
        </div> */}

        {/* HEADER */}
        <VocabularyHeader
          totalSets={sets.length}
          totalTerms={totalTerms}
          onCreate={() => setComposer({ open: true, mode: "create" })}
        />

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Filter Bar */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white/95 p-4 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/90">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                value={filters.query}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, query: e.target.value }))
                }
                placeholder="Tìm theo tên bộ, chủ đề hoặc mô tả..."
                className="w-full rounded-xl border border-zinc-200/80 bg-white pl-10 pr-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-[#2E5EB8] focus:ring-2 focus:ring-[#2E5EB8]/15 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <FilterChip
                icon={<Filter className="h-3.5 w-3.5" />}
                label="Mới nhất"
                active={filters.sort === "recent"}
                onClick={() => setFilters((p) => ({ ...p, sort: "recent" }))}
              />
              <FilterChip
                label="A–Z"
                active={filters.sort === "alphabetical"}
                onClick={() =>
                  setFilters((p) => ({ ...p, sort: "alphabetical" }))
                }
              />
              <FilterChip
                label="Nhiều từ"
                active={filters.sort === "terms"}
                onClick={() => setFilters((p) => ({ ...p, sort: "terms" }))}
              />
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
          if (composer.mode === "edit" && composer.set) {
            await updateSet(
              composer.set._id,
              payload as UpdateVocabularySetDTO
            );
            toast.success("Đã cập nhật bộ từ");
          } else {
            await createSet(payload as CreateVocabularySetDTO);
            toast.success("Đã tạo bộ từ mới");
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
          if (termModal.mode === "edit" && termModal.term) {
            await updateTerm(
              termModal.setId,
              termModal.term._id!,
              data as UpdateTermDTO
            );
            toast.success("Đã cập nhật từ");
          } else {
            await addTerm(termModal.setId, data as AddTermDTO);
            toast.success("Đã thêm từ");
          }
        }}
      />

      <VocabularySetDetailSheet
        open={!!detailSet}
        loading={detailLoading}
        set={detailSet}
        onClose={() => setDetailSet(null)}
        onStudy={(s) => setStudySet(s)}
        onQuiz={(s) => setQuizSet(s)}
        onAddTerm={(set) =>
          setTermModal({ open: true, mode: "create", setId: set._id })
        }
        onEditSet={(set) => setComposer({ open: true, mode: "edit", set })}
        onEditTerm={(term, set) =>
          setTermModal({
            open: true,
            mode: "edit",
            setId: set._id,
            term,
          })
        }
        onDeleteSet={(s) => setDeleteTarget(s)}
        onDeleteTerm={(term, set) => setDeleteTermTarget({ term, set })}
      />

      <StudyModal
        open={!!studySet}
        set={studySet}
        onClose={() => setStudySet(null)}
        onSwitchToQuiz={() => {
          if (studySet) setQuizSet(studySet);
          setStudySet(null);
        }}
        onTermRemembered={(term) => {
          if (studySet && term._id) markRemembered(studySet._id, term._id);
        }}
        onTermForgotten={(term) => {
          if (studySet && term._id) markDifficult(studySet._id, term._id);
        }}
      />

      <QuizModal
        open={!!quizSet}
        set={quizSet}
        onClose={() => setQuizSet(null)}
        onSwitchToFlashcard={() => {
          if (quizSet) setStudySet(quizSet);
          setQuizSet(null);
        }}
      />

      {/* Delete confirm */}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          await deleteSet(deleteTarget._id);
          toast.success("Đã xóa bộ từ");
          setDeleteTarget(null);
        }}
        title="Xóa bộ từ vựng?"
        message="Thao tác này không thể hoàn tác."
        icon="warning"
        confirmText="Xóa"
        confirmColor="red"
      />

      <ConfirmModal
        open={!!deleteTermTarget}
        onClose={() => setDeleteTermTarget(null)}
        onConfirm={async () => {
          if (!deleteTermTarget) return;
          await deleteTerm(
            deleteTermTarget.set._id,
            deleteTermTarget.term._id!
          );
          toast.success("Đã xóa từ");
          setDeleteTermTarget(null);
        }}
        title="Xóa từ?"
        message="Bạn chắc chắn muốn xóa từ khỏi bộ?"
        icon="warning"
        confirmText="Xóa từ"
        confirmColor="red"
      />
    </section>
  );
}