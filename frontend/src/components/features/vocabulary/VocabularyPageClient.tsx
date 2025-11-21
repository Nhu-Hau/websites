// frontend/src/components/features/vocabulary/VocabularyPageClient.tsx
"use client";

import React from "react";
import {
  BookOpenCheck,
  Filter,
  Layers,
  Plus,
  Search,
  Sparkles,
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
import { StudyModal } from "./StudyModal";
import { QuizModal } from "./QuizModal";
import { EmptyState } from "./EmptyState";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";

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
    <header className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/90 px-4 py-5 shadow-xl shadow-slate-900/5 ring-1 ring-slate-900/5 backdrop-blur-xl xs:px-6 sm:px-8 sm:py-7 dark:border-zinc-800/60 dark:bg-zinc-900/90 dark:shadow-black/20">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#4063bb0f] via-sky-200/30 to-emerald-100/20 dark:from-[#4063bb22] dark:via-sky-500/5 dark:to-emerald-500/5" />
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#4063bb26] blur-[120px] dark:bg-[#4063bb33]" />

      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-5">
          <div className="inline-flex items-center gap-3 rounded-2xl border border-white/70 bg-white/80 px-3 py-2 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/80">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4063bb] to-sky-500 shadow-lg shadow-[#4063bb4d]">
              <BookOpenCheck className="h-5 w-5 text-white" />
            </div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-500 dark:text-zinc-400">
              Vocabulary lab
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
              Tạo lộ trình từ vựng chuẩn TOEIC
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-zinc-300">
              Quản lý bộ từ, luyện flashcard theo cấp độ và quiz nhanh để khóa
              kiến thức mỗi ngày. Thiết kế mới đồng bộ phong cách bài test nên
              bạn sẽ thấy quen thuộc ngay.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
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
            <MiniStat
              icon={<Sparkles className="h-3.5 w-3.5" />}
              label="Độ phủ trung bình"
              value={
                totalSets === 0
                  ? "—"
                  : `${Math.max(1, Math.round(totalTerms / totalSets))} từ/bộ`
              }
            />
          </div>
        </div>

        <div className="flex w-full flex-col gap-3 rounded-2xl border border-white/70 bg-white/80 p-4 shadow-md sm:max-w-xs dark:border-zinc-800/80 dark:bg-zinc-900/80">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-zinc-400">
            Hành động nhanh
          </span>
          <p className="text-sm text-slate-600 dark:text-zinc-300">
            Dành 3 phút tạo bộ từ mới, sau đó chuyển ngay sang flashcard hoặc
            quiz để ghi nhớ.
          </p>
          <button
            onClick={onCreate}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#4063bb] to-[#2d4c9b] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#2d4c9b33] transition hover:brightness-110"
          >
            <Plus className="h-4 w-4" />
            <span>Tạo bộ từ mới</span>
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
    <div className="inline-flex items-center gap-2 rounded-2xl border border-white/70 bg-white/80 px-3 py-2 text-[11px] font-medium text-slate-600 shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900/80 dark:text-zinc-200">
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
        "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[11px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4063bb]/40",
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
  const basePrefix = useBasePrefix();

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

  const handleQuickAdd = React.useCallback(
    async (setId: string, payload: AddTermDTO) => {
      await addTerm(setId, payload);
    },
    [addTerm]
  );

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

  const handleOpenSet = React.useCallback(
    (set: VocabularySet) => {
      router.push(`${basePrefix}/vocabulary/${set._id}`);
    },
    [router, basePrefix]
  );

  const handleOpenPractice = React.useCallback(
    async (set: VocabularySet, mode: "flashcard" | "quiz" = "flashcard") => {
      const open = mode === "flashcard" ? setStudySet : setQuizSet;
      open(set);
      try {
        const latest = await refreshSet(set._id);
        open(latest);
      } catch {
        // ignore refresh errors, keep optimistic data
      }
    },
    [refreshSet]
  );

  /* ------------------------------ RENDER UI ------------------------------ */

  const renderContent = () => {
    if (loading) {
      return (
        <div className="py-8 sm:py-10">
          <VocabularySetSkeleton />
        </div>
      );
    }

    if (!filteredSets.length) {
      return (
        <div className="py-8 sm:py-10">
          <EmptyState
            title="Chưa có bộ từ nào"
            description="Tạo bộ từ đầu tiên hoặc import danh sách từ để bắt đầu học giống Quizlet nhưng tối ưu cho TOEIC."
          />
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-4 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredSets.map((set, index) => (
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
    <section className="relative min-h-screen overflow-hidden bg-slate-50 pb-16 pt-16 dark:bg-zinc-950 sm:pt-20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(64,99,187,0.16),_rgba(15,23,42,0)_55%)] dark:bg-[radial-gradient(circle_at_top,_rgba(64,99,187,0.24),_rgba(3,7,18,0)_65%)]" />
      <div className="relative mx-auto max-w-6xl space-y-6 px-4 xs:px-6">
        {/* (Back button nếu cần sau này) */}
        {/* HEADER */}
        <VocabularyHeader
          totalSets={sets.length}
          totalTerms={totalTerms}
          onCreate={() => setComposer({ open: true, mode: "create" })}
        />
        {/* Error */}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </div>
        )}

        {/* Filter Bar */}
        <div className="rounded-3xl border border-white/80 bg-white/90 p-4 shadow-lg shadow-slate-900/5 backdrop-blur-xl xs:p-5 dark:border-zinc-800/60 dark:bg-zinc-900/90">
          <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
            {/* Search */}
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-zinc-400">
                Tìm kiếm nhanh
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
                <input
                  value={filters.query}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, query: e.target.value }))
                  }
                  placeholder="Nhập từ khóa, chủ đề hoặc ghi chú..."
                  className="w-full rounded-2xl border border-slate-200/80 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-[#4063bb] focus:ring-2 focus:ring-[#4063bb1f] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                />
              </div>
            </div>

            {/* Chips */}
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-zinc-400">
                Sắp xếp & lọc
              </label>
              <div className="flex flex-wrap gap-2">
                <FilterChip
                  icon={<Filter className="h-3.5 w-3.5" />}
                  label="Mới cập nhật"
                  active={filters.sort === "recent"}
                  onClick={() => setFilters((p) => ({ ...p, sort: "recent" }))}
                />
                <FilterChip
                  label="Theo A–Z"
                  active={filters.sort === "alphabetical"}
                  onClick={() =>
                    setFilters((p) => ({ ...p, sort: "alphabetical" }))
                  }
                />
                <FilterChip
                  label="Nhiều từ nhất"
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

      <StudyModal
        open={!!studySet}
        set={studySet}
        onClose={() => setStudySet(null)}
        onSwitchToQuiz={() => {
          if (studySet) setQuizSet(studySet);
          setStudySet(null);
        }}
        onAddTerm={(set) =>
          setTermModal({ open: true, mode: "create", setId: set._id })
        }
        onEditSet={(set) => setComposer({ open: true, mode: "edit", set })}
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
