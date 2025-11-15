// frontend/src/components/features/vocabulary/VocabularySetClient.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { vocabularyService } from "@/features/vocabulary/services/vocabulary.service";
import { VocabularySet } from "@/features/vocabulary/types/vocabulary.types";
import { useFlashcardMode } from "@/features/vocabulary/hooks/useFlashcardMode";
import { useLearnMode } from "@/features/vocabulary/hooks/useLearnMode";
import { Flashcard } from "./Flashcard";
import { FlashcardProgress } from "./FlashcardProgress";
import { FlashcardControls } from "./FlashcardControls";
import { CompletionScreen } from "./CompletionScreen";
import { LearnModeQuestionComponent } from "./LearnModeQuestion";
import { ArrowLeft, Loader2, BookOpen, Brain, Plus, Play, Edit2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { AddTermModal } from "./AddTermModal";

interface VocabularySetClientProps {
  setId: string;
}

type Mode = "overview" | "flashcard" | "learn";

export function VocabularySetClient({ setId }: VocabularySetClientProps) {
  const router = useRouter();
  const [vocabularySet, setVocabularySet] = useState<VocabularySet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("overview");
  const [showAddTermModal, setShowAddTermModal] = useState(false);

  // Flashcard mode
  const flashcard = useFlashcardMode({
    terms: vocabularySet?.terms || [],
    onComplete: () => {
      // Completion is handled by the completed state
    },
  });

  // Learn mode
  const learn = useLearnMode({
    terms: vocabularySet?.terms || [],
    onComplete: () => {
      // Completion is handled by the completed state
    },
  });

  // Fetch vocabulary set
  useEffect(() => {
    const fetchSet = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await vocabularyService.getVocabularySetById(setId);
        setVocabularySet(data);
      } catch (err: any) {
        setError(err.message || "Không thể tải bộ từ vựng");
      } finally {
        setLoading(false);
      }
    };

    fetchSet();
  }, [setId]);

  // Keyboard shortcuts
  useEffect(() => {
    if (mode !== "flashcard") return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === " ") {
        e.preventDefault();
        flashcard.handleFlip();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        flashcard.handlePrevious();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        flashcard.handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [mode, flashcard]);

  const handleAddTerm = async (termData: any) => {
    try {
      const updated = await vocabularyService.addTerm(setId, termData);
      setVocabularySet(updated);
      setShowAddTermModal(false);
    } catch (err: any) {
      console.error("Failed to add term:", err);
      throw err;
    }
  };

  const handleDeleteTerm = async (termId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa từ này?")) return;
    try {
      const updated = await vocabularyService.deleteTerm(setId, termId);
      setVocabularySet(updated);
    } catch (err: any) {
      console.error("Failed to delete term:", err);
    }
  };

  const handleStartFlashcard = () => {
    flashcard.resetProgress();
    setMode("flashcard");
  };

  const handleStartLearnMode = () => {
    learn.resetProgress();
    setMode("learn");
  };

  const handleBackToOverview = () => {
    setMode("overview");
    flashcard.resetProgress();
    learn.resetProgress();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-600 dark:text-zinc-400" />
      </div>
    );
  }

  if (error || !vocabularySet) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">
            {error || "Không tìm thấy bộ từ vựng"}
          </p>
          <button
            onClick={() => router.push("/vocabulary")}
            className="px-6 py-3 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold hover:shadow-md transition-all"
          >
            Quay lại danh sách bộ từ vựng
          </button>
        </div>
      </div>
    );
  }

  // Overview mode
  if (mode === "overview") {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Back button */}
          <button
            onClick={() => router.push("/vocabulary")}
            className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Quay lại danh sách bộ từ vựng</span>
          </button>

          {/* Header */}
          <div className="rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-6 mb-6 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                  {vocabularySet.title}
                </h1>
                {vocabularySet.description && (
                  <p className="text-zinc-600 dark:text-zinc-400">
                    {vocabularySet.description}
                  </p>
                )}
              </div>
              {vocabularySet.topic && (
                <span className="px-3 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-semibold">
                  {vocabularySet.topic}
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
              <span className="font-semibold">
                {vocabularySet.terms.length} {vocabularySet.terms.length === 1 ? "từ" : "từ"}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          {vocabularySet.terms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <button
                onClick={handleStartFlashcard}
                className="flex items-center gap-4 p-6 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 hover:shadow-md transition-all"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-zinc-600 dark:text-zinc-400" />
                </div>
                <div className="text-left flex-1">
                  <div className="font-semibold text-lg text-zinc-900 dark:text-white mb-1">
                    Flashcards
                  </div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">
                    Học bằng thẻ lật
                  </div>
                </div>
                <Play className="w-5 h-5 text-zinc-400" />
              </button>

              <button
                onClick={handleStartLearnMode}
                className="flex items-center gap-4 p-6 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 hover:shadow-md transition-all"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center">
                  <Brain className="w-6 h-6 text-zinc-600 dark:text-zinc-400" />
                </div>
                <div className="text-left flex-1">
                  <div className="font-semibold text-lg text-zinc-900 dark:text-white mb-1">
                    Chế độ học
                  </div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">
                    Tự kiểm tra kiến thức
                  </div>
                </div>
                <Play className="w-5 h-5 text-zinc-400" />
              </button>
            </div>
          ) : (
            <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-6 mb-6">
              <p className="text-blue-800 dark:text-blue-300 text-center">
                Bộ từ vựng này chưa có từ nào. Thêm một số từ để bắt đầu học!
              </p>
            </div>
          )}

          {/* Terms list */}
          <div className="rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Danh sách từ</h2>
              <button
                onClick={() => setShowAddTermModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-semibold hover:shadow-md transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm từ</span>
              </button>
            </div>

            {vocabularySet.terms.length > 0 ? (
              <div className="space-y-3">
                {vocabularySet.terms.map((term, index) => (
                  <div
                    key={term._id || index}
                    className="group p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                            {term.word}
                          </h3>
                          {term.partOfSpeech && (
                            <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold">
                              {term.partOfSpeech}
                            </span>
                          )}
                          <span className="text-xs text-zinc-400 dark:text-zinc-500">
                            #{index + 1}
                          </span>
                        </div>

                        {/* Vietnamese Meaning */}
                        <p className="text-zinc-700 dark:text-zinc-300 mb-1 font-medium">
                          <span className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mr-2">
                            Tiếng Việt:
                          </span>
                          {term.meaning}
                        </p>

                        {/* English Meaning */}
                        {term.englishMeaning && (
                          <p className="text-zinc-600 dark:text-zinc-400 mb-2">
                            <span className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mr-2">
                              English:
                            </span>
                            {term.englishMeaning}
                          </p>
                        )}

                        {/* Examples */}
                        {(term.example || term.translatedExample) && (
                          <div className="mt-3 space-y-1">
                            {term.example && (
                              <p className="text-sm text-zinc-600 dark:text-zinc-400 italic">
                                <span className="text-xs text-zinc-500 dark:text-zinc-400 not-italic mr-1">
                                  EN:
                                </span>
                                "{term.example}"
                              </p>
                            )}
                            {term.translatedExample && (
                              <p className="text-sm text-zinc-600 dark:text-zinc-400 italic">
                                <span className="text-xs text-zinc-500 dark:text-zinc-400 not-italic mr-1">
                                  VI:
                                </span>
                                "{term.translatedExample}"
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleDeleteTerm(term._id!)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                        aria-label="Delete term"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-zinc-500 dark:text-zinc-400 py-8">
                Chưa có từ nào
              </p>
            )}
          </div>
        </div>

        {/* Add Term Modal */}
        {showAddTermModal && (
          <AddTermModal
            onClose={() => setShowAddTermModal(false)}
            onAdd={handleAddTerm}
          />
        )}
      </div>
    );
  }

  // Flashcard mode
  if (mode === "flashcard") {
    if (flashcard.completed) {
      return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 py-8 px-4 flex items-center justify-center">
          <CompletionScreen
            remembered={flashcard.remembered.length}
            notYet={flashcard.notYet.length}
            total={flashcard.totalTerms}
            mode="flashcard"
            onRestart={handleStartFlashcard}
            onReviewWeak={() => {
              flashcard.startReviewMode();
            }}
            onLearnMode={handleStartLearnMode}
          />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Back button */}
          <button
            onClick={handleBackToOverview}
            className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Quay lại tổng quan</span>
          </button>

          {/* Title */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
              {flashcard.reviewMode ? "Chế độ ôn tập" : vocabularySet.title}
            </h1>
            {flashcard.reviewMode && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Đang ôn tập các từ được đánh dấu "Chưa nhớ"
              </p>
            )}
          </div>

          {/* Progress */}
          <FlashcardProgress
            current={flashcard.currentIndex + 1}
            total={flashcard.totalTerms}
            progress={flashcard.progress}
            remembered={flashcard.remembered.length}
            notYet={flashcard.notYet.length}
          />

          {/* Flashcard */}
          {flashcard.currentTerm && (
            <>
              <Flashcard
                term={flashcard.currentTerm}
                isFlipped={flashcard.isFlipped}
                onFlip={flashcard.handleFlip}
              />

              {/* Controls */}
              <FlashcardControls
                onPrevious={flashcard.handlePrevious}
                onNext={flashcard.handleNext}
                onRemember={flashcard.handleRemember}
                onNotYet={flashcard.handleNotYet}
                canGoPrevious={flashcard.currentIndex > 0}
                canGoNext={flashcard.currentIndex < flashcard.totalTerms - 1}
                isFlipped={flashcard.isFlipped}
              />
            </>
          )}
        </div>
      </div>
    );
  }

  // Learn mode
  if (mode === "learn") {
    if (learn.completed) {
      return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 py-8 px-4 flex items-center justify-center">
          <CompletionScreen
            remembered={learn.correctAnswers}
            notYet={learn.incorrectAnswers}
            total={learn.totalQuestions}
            mode="learn"
            score={learn.totalQuestions > 0 ? Math.round((learn.correctAnswers / learn.totalQuestions) * 100) : 0}
            onRestart={handleStartLearnMode}
            onReviewWeak={handleStartFlashcard}
            onLearnMode={handleStartLearnMode}
          />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Back button */}
          <button
            onClick={handleBackToOverview}
            className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Quay lại tổng quan</span>
          </button>

          {/* Title */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
              Chế độ học - {vocabularySet.title}
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Kiểm tra kiến thức của bạn bằng các câu hỏi
            </p>
          </div>

          {/* Progress */}
          <div className="w-full max-w-2xl mx-auto mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Câu hỏi {learn.currentQuestionIndex + 1} / {learn.totalQuestions}
              </span>
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Điểm: {learn.correctAnswers} / {learn.currentQuestionIndex + (learn.showResult ? 1 : 0)}
              </span>
            </div>
            <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-zinc-900 dark:bg-zinc-100 transition-all duration-300"
                style={{ width: `${learn.progress}%` }}
              />
            </div>
          </div>

          {/* Question */}
          {learn.currentQuestion && (
            <LearnModeQuestionComponent
              question={learn.currentQuestion}
              selectedAnswer={learn.selectedAnswer}
              showResult={learn.showResult}
              isCorrect={learn.isCorrect}
              onSelectAnswer={learn.handleSelectAnswer}
              onSubmit={learn.handleSubmitAnswer}
              onNext={learn.handleNextQuestion}
            />
          )}
        </div>
      </div>
    );
  }

  return null;
}
