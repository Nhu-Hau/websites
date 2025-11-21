"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { BookOpenCheck, Search } from "lucide-react";
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
  const [query, setQuery] = React.useState("");
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

  const handleTermSubmit = async (payload: AddTermDTO | UpdateTermDTO) => {
    const context = termModalRef.current;
    const targetSetId = context.setId ?? setData?._id;
    if (!targetSetId) {
      toast.error("Không xác định được bộ từ để lưu");
      throw new Error("Missing setId when saving vocabulary term");
    }
    try {
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
        context.mode === "edit" ? "Đã cập nhật từ vựng" : "Đã thêm từ mới"
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Không thể lưu từ vựng";
      toast.error(message);
      throw (err instanceof Error ? err : new Error(message));
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

  const filteredTerms = React.useMemo(() => {
    if (!setData) return [];
    const keyword = query.trim().toLowerCase();
    if (!keyword) return setData.terms;
    return setData.terms.filter((term) => {
      const text = [term.word, term.meaning, term.englishMeaning]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return text.includes(keyword);
    });
  }, [query, setData]);

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

  const handleStartPractice = (mode: "flashcard" | "quiz") => {
    if (!setData) return;
    if (mode === "flashcard") {
      setStudySet(setData);
    } else {
      setQuizSet(setData);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 pb-16 pt-16 dark:bg-zinc-950">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(64,99,187,0.18),_rgba(15,23,42,0)_60%)] dark:bg-[radial-gradient(circle_at_top,_rgba(64,99,187,0.3),_rgba(3,7,18,0)_65%)]" />
      <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => router.push(`${basePrefix}/vocabulary`)}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/70 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm shadow-slate-900/5 transition hover:text-[#4063bb] dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-200"
          >
            <span className="text-lg">←</span>
            Trở về danh sách
          </button>
          <div className="inline-flex flex-wrap gap-2">
            <button
              onClick={() => setComposerOpen(true)}
              className="rounded-2xl border border-white/70 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:text-[#4063bb] dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-100"
            >
              Chỉnh sửa bộ
            </button>
            <button
              onClick={() => setDeleteSetTarget(true)}
              className="rounded-2xl border border-red-200/70 bg-white/90 px-4 py-2 text-sm font-semibold text-red-600 shadow-sm transition hover:border-red-300 dark:border-red-900/40 dark:bg-zinc-900/80 dark:text-red-300"
            >
              Xóa bộ
            </button>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-white/70 bg-gradient-to-br from-[#1f2a42] via-[#2c3e73] to-[#0f172a] p-6 text-white shadow-2xl shadow-[#0f172a66] sm:p-8 dark:border-zinc-800/70">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.18),_transparent_55%)]" />
          <div className="relative z-10 space-y-5">
            <div className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80">
              <BookOpenCheck className="h-4 w-4" />
              Vocabulary set
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">{setData.title}</h1>
              <p className="text-sm text-white/80">
                {setData.description || "Chưa có mô tả cho bộ từ này."}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-[13px] font-medium text-white/80">
              <span className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-1">
                {setData.terms.length} từ
              </span>
              {setData.topic && (
                <span className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-1">
                  #{setData.topic}
                </span>
              )}
              <span className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-1">
                Tạo ngày{" "}
                {new Intl.DateTimeFormat("vi-VN", {
                  dateStyle: "medium",
                }).format(new Date(setData.createdAt))}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() =>
                  setTermModal({
                    open: true,
                    mode: "create",
                    setId: setData._id,
                  })
                }
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/40 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20 sm:flex-none"
              >
                Thêm từ mới
              </button>
              <button
                onClick={() => handleStartPractice("flashcard")}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-[#1f2a42] shadow-sm transition hover:opacity-95 sm:flex-none"
              >
                Luyện flashcard
              </button>
              <button
                onClick={() => handleStartPractice("quiz")}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/30 bg-transparent px-4 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/10 sm:flex-none"
              >
                Quiz nhanh
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/80 bg-white/95 p-5 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-zinc-800/70 dark:bg-zinc-900/90">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-zinc-400">
                Study deck
              </p>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-zinc-50">
                Danh sách từ
              </h2>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm theo từ, nghĩa hoặc ví dụ..."
                className="w-full rounded-2xl border border-slate-200/80 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-[#4063bb] focus:ring-2 focus:ring-[#4063bb1f] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
              />
            </div>
          </div>

          <div className="mt-6 space-y-3.5">
            {filteredTerms.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 px-4 py-10 text-center text-sm text-slate-500 dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-400">
                Không có từ nào khớp với tìm kiếm.
              </div>
            )}

            {filteredTerms.map((term, index) => (
              <article
                key={term._id || `${term.word}-${index}`}
                className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/95 p-4 shadow-sm shadow-slate-900/5 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-900/10 dark:border-zinc-800/70 dark:bg-zinc-900/85"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500 dark:bg-zinc-800 dark:text-zinc-400">
                      #{index + 1}
                    </span>
                    {term.partOfSpeech && (
                      <span className="rounded-full bg-[#4063bb]/10 px-3 py-1 text-xs font-semibold uppercase text-[#4063bb] dark:bg-[#4063bb]/20 dark:text-sky-200">
                        {term.partOfSpeech}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-baseline gap-3">
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-zinc-50">
                      {term.word}
                    </h3>
                  </div>
                  <p className="text-sm font-medium text-slate-800 dark:text-zinc-200">
                    {term.meaning}
                  </p>
                  {term.englishMeaning && (
                    <p className="text-sm text-slate-500 dark:text-zinc-400">
                      {term.englishMeaning}
                    </p>
                  )}
                  {(term.example || term.translatedExample) && (
                    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3 text-sm text-slate-600 dark:border-zinc-800/70 dark:bg-zinc-900/60 dark:text-zinc-300">
                      {term.example && (
                        <p className="flex gap-2">
                          <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400">
                            EN
                          </span>
                          <span className="italic">“{term.example}”</span>
                        </p>
                      )}
                      {term.translatedExample && (
                        <p className="mt-2 flex gap-2">
                          <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400">
                            VI
                          </span>
                          <span className="italic">“{term.translatedExample}”</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() =>
                      setTermModal({
                        open: true,
                        mode: "edit",
                        setId: setData._id,
                        term,
                      })
                    }
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-200/80 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#4063bb66] hover:text-[#4063bb] dark:border-zinc-700 dark:text-zinc-100"
                  >
                    Chỉnh sửa
                  </button>
                  <button
                    onClick={() =>
                      setDeleteTermTarget({
                        set: setData,
                        term,
                      })
                    }
                    className="inline-flex items-center justify-center rounded-2xl border border-red-200/70 px-4 py-2 text-sm font-semibold text-red-600 transition hover:border-red-300 dark:border-red-900/40 dark:text-red-300"
                  >
                    Xóa
                  </button>
                </div>
              </article>
            ))}
          </div>
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
        onEditSet={(set) => {
          setSetData(set);
          setComposerOpen(true);
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
