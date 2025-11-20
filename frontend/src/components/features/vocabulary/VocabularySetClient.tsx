"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  VocabularySet,
  VocabularyTerm,
  AddTermDTO,
  UpdateVocabularySetDTO,
} from "@/types/vocabulary.types";
import { vocabularyService } from "@/utils/vocabulary.service";
import { SetComposerModal } from "./CreateVocabularySetModal";
import { TermComposerModal } from "./AddTermModal";
import { VocabularySetDetailSheet } from "./VocabularySetDetailSheet";
import { StudyModal } from "./StudyModal";
import { QuizModal } from "./QuizModal";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { toast } from "@/lib/toast";
import { useVocabularyProgress } from "@/hooks/vocabulary/useVocabularyProgress";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";

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
  const [studySet, setStudySet] = React.useState<VocabularySet | null>(null);
  const [quizSet, setQuizSet] = React.useState<VocabularySet | null>(null);
  const [deleteSetTarget, setDeleteSetTarget] = React.useState(false);
  const [deleteTermTarget, setDeleteTermTarget] = React.useState<{
    set?: VocabularySet;
    term?: VocabularyTerm;
  } | null>(null);

  const fetchSet = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await vocabularyService.getVocabularySetById(setId);
      setSetData(data);
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

  const handleUpdateSet = async (payload: UpdateVocabularySetDTO) => {
    if (!setData) return;
    try {
      const updated = await vocabularyService.updateVocabularySet(
        setData._id,
        payload
      );
      setSetData(updated);
      toast.success("Đã cập nhật bộ từ");
    } catch (err) {
      toast.error("Không thể cập nhật bộ từ");
      throw (err instanceof Error ? err : new Error("Không thể cập nhật bộ từ"));
    }
  };

  const handleTermSubmit = async (payload: AddTermDTO) => {
    if (!termModal.setId) return;
    try {
      let updated: VocabularySet;
      if (termModal.mode === "edit" && termModal.term?._id) {
        updated = await vocabularyService.updateTerm(
          termModal.setId,
          termModal.term._id,
          payload
        );
      } else {
        updated = await vocabularyService.addTerm(termModal.setId, payload);
      }
      setSetData(updated);
      toast.success(
        termModal.mode === "edit" ? "Đã cập nhật từ vựng" : "Đã thêm từ mới"
      );
    } catch (err) {
      toast.error("Không thể lưu từ vựng");
      throw (err instanceof Error ? err : new Error("Không thể lưu từ vựng"));
    }
  };

  const handleDeleteTerm = async () => {
    if (!deleteTermTarget?.set || !deleteTermTarget.term?._id) return;
    try {
      const updated = await vocabularyService.deleteTerm(
        deleteTermTarget.set._id,
        deleteTermTarget.term._id
      );
      setSetData(updated);
      toast.success("Đã xóa từ");
    } catch {
      toast.error("Không thể xóa từ");
    } finally {
      setDeleteTermTarget(null);
    }
  };

  const handleDeleteSet = async () => {
    if (!setData) return;
    try {
      await vocabularyService.deleteVocabularySet(setData._id);
      toast.success("Đã xóa bộ từ");
      router.push(`${basePrefix}/vocabulary`);
    } catch {
      toast.error("Không thể xóa bộ từ");
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
          {error || "Không tìm thấy bộ từ vựng"}
        </p>
        <button
          onClick={() => router.push(`${basePrefix}/vocabulary`)}
          className="rounded-2xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:-translate-y-0.5 dark:bg-white dark:text-zinc-900"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-10 dark:bg-zinc-900">
      <VocabularySetDetailSheet
        open
        standalone
        set={setData}
        onClose={() => router.push(`${basePrefix}/vocabulary`)}
        onStudy={(set) => setStudySet(set)}
        onQuiz={(set) => setQuizSet(set)}
        onEditSet={() => setComposerOpen(true)}
        onDeleteSet={() => setDeleteSetTarget(true)}
        onAddTerm={(set) =>
          setTermModal({ open: true, mode: "create", setId: set._id })
        }
        onEditTerm={(term, set) =>
          setTermModal({ open: true, mode: "edit", setId: set._id, term })
        }
        onDeleteTerm={(term, set) => setDeleteTermTarget({ term, set })}
      />

      <SetComposerModal
        open={composerOpen}
        mode="edit"
        initialSet={setData}
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

      <StudyModal
        open={!!studySet}
        set={studySet}
        onClose={() => setStudySet(null)}
        onSwitchToQuiz={() => {
          if (studySet) setQuizSet(studySet);
          setStudySet(null);
        }}
        onTermRemembered={handleRemembered}
        onTermForgotten={handleForgotten}
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

      <ConfirmModal
        open={deleteSetTarget}
        onClose={() => setDeleteSetTarget(false)}
        onConfirm={handleDeleteSet}
        title="Xóa bộ từ này?"
        message="Thao tác không thể hoàn tác. Bạn có chắc chắn muốn xóa?"
        icon="warning"
        confirmText="Xóa"
        confirmColor="red"
      />

      <ConfirmModal
        open={!!deleteTermTarget}
        onClose={() => setDeleteTermTarget(null)}
        onConfirm={handleDeleteTerm}
        title="Xóa từ khỏi bộ?"
        message="Từ vựng sẽ bị xóa khỏi bộ này."
        icon="warning"
        confirmText="Xóa từ"
        confirmColor="red"
          />
        </div>
      );
    }

