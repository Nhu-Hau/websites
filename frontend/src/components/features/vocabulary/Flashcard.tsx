// frontend/src/components/features/vocabulary/Flashcard.tsx
"use client";

import { VocabularyTerm } from "@/types/vocabulary.types";
import { Volume2, BookOpen } from "lucide-react";

interface FlashcardProps {
  term: VocabularyTerm;
  isFlipped: boolean;
  onFlip: () => void;
}

export function Flashcard({ term, isFlipped, onFlip }: FlashcardProps) {
  return (
    <div className="w-full max-w-2xl mx-auto mb-8">
      <div
        className="relative w-full aspect-[4/3] cursor-pointer perspective-1000"
        onClick={onFlip}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onFlip();
          }
        }}
      >
        <div
          className={`relative w-full h-full preserve-3d transition-transform duration-500 ${
            isFlipped ? "rotate-y-180" : ""
          }`}
        >
          {/* Front side - Word */}
          <div
            className={`absolute inset-0 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-lg hover:shadow-xl backface-hidden ${
              isFlipped ? "opacity-0 pointer-events-none" : "opacity-100"
            }`}
          >
            <div className="p-8 h-full flex flex-col items-center justify-center text-center">
              <div className="mb-4">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-700">
                  <BookOpen className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                  <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">
                    Từ
                  </span>
                </div>
              </div>

              {term.partOfSpeech && (
                <div className="mb-3">
                  <span className="text-xs font-medium px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                    {term.partOfSpeech}
                  </span>
                </div>
              )}

              <h2 className="text-4xl md:text-5xl font-bold text-zinc-900 dark:text-white mb-6 break-words">
                {term.word}
              </h2>

              {term.audio && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Play audio logic here
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-300 transition-colors"
                >
                  <Volume2 className="w-4 h-4" />
                  <span className="text-sm font-semibold">Nghe</span>
                </button>
              )}

              <p className="absolute bottom-6 text-sm text-zinc-500 dark:text-zinc-400">
                Nhấp hoặc nhấn Space để lật
              </p>
            </div>
          </div>

          {/* Back side - Meaning */}
          <div
            className={`absolute inset-0 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-lg hover:shadow-xl backface-hidden rotate-y-180 ${
              !isFlipped ? "opacity-0 pointer-events-none" : "opacity-100"
            }`}
          >
            <div className="p-8 h-full flex flex-col">
              <div className="mb-4">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-700">
                  <BookOpen className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                  <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">
                    Nghĩa
                  </span>
                </div>
              </div>

              <div className="flex-1 space-y-6">
                {/* Vietnamese Meaning */}
                <div>
                  <div className="mb-2">
                    <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                      Tiếng Việt
                    </span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-semibold text-zinc-900 dark:text-white">
                    {term.meaning}
                  </h2>
                </div>

                {/* English Meaning */}
                {term.englishMeaning && (
                  <div>
                    <div className="mb-2">
                      <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                        English
                      </span>
                    </div>
                    <p className="text-lg text-zinc-700 dark:text-zinc-300">
                      {term.englishMeaning}
                    </p>
                  </div>
                )}

                {/* Examples */}
                {(term.example || term.translatedExample) && (
                  <div className="space-y-3 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                    <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                      Ví dụ
                    </div>

                    {term.example && (
                      <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-700/50">
                        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                          English:
                        </p>
                        <p className="text-zinc-900 dark:text-white italic">
                          "{term.example}"
                        </p>
                      </div>
                    )}

                    {term.translatedExample && (
                      <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-700/50">
                        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                          Tiếng Việt:
                        </p>
                        <p className="text-zinc-900 dark:text-white italic">
                          "{term.translatedExample}"
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Image */}
                {term.image && (
                  <div className="pt-4">
                    <img
                      src={term.image}
                      alt={term.word}
                      className="max-h-32 mx-auto rounded-lg"
                    />
                  </div>
                )}
              </div>

              <p className="absolute bottom-6 text-sm text-zinc-500 dark:text-zinc-400">
                Nhấp hoặc nhấn Space để lật lại
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
}
