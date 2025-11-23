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
  const handleAudio = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (term.audio) {
      const audio = new Audio(term.audio);
      audio.play().catch(() => {
        /* ignore */
      });
    }
  };

  return (
    <div className="mx-auto mb-8 w-full max-w-3xl">
      <div
        className="relative aspect-[4/3] cursor-pointer perspective-1000"
        onClick={onFlip}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onFlip();
          }
        }}
      >
        <div
          className={`relative h-full w-full preserve-3d transition-transform duration-500 ${
            isFlipped ? "rotate-y-180" : ""
          }`}
        >
          <FlashcardFace
            heading="Thuật ngữ"
            subheading={term.partOfSpeech}
            accent="from-sky-50 via-white to-emerald-50"
            className={`backface-hidden ${
              isFlipped ? "pointer-events-none opacity-0" : "opacity-100"
            }`}
          >
            <h2 className="mb-6 break-words text-center text-4xl font-semibold tracking-tight text-zinc-900 dark:text-white md:text-5xl">
              {term.word}
            </h2>
            {term.audio && (
              <button
                onClick={handleAudio}
                className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200/80 bg-white/90 px-5 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-100"
              >
                <Volume2 className="h-4 w-4" />
                Phát âm
              </button>
            )}
            <p className="absolute bottom-6 text-xs uppercase tracking-[0.4em] text-zinc-400">
              Nhấn Space để lật
            </p>
          </FlashcardFace>

          <FlashcardFace
            heading="Nghĩa"
            accent="from-emerald-50 via-white to-amber-50"
            className={`rotate-y-180 backface-hidden ${
              !isFlipped ? "pointer-events-none opacity-0" : "opacity-100"
            }`}
          >
            <div className="flex flex-1 flex-col gap-6">
              <section>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">
                  Tiếng Việt
                </p>
                <p className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-white">
                  {term.meaning}
                </p>
              </section>

              {term.englishMeaning && (
                <section>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">
                    English
                  </p>
                  <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-300">
                    {term.englishMeaning}
                  </p>
                </section>
              )}

              {(term.example || term.translatedExample) && (
                <section className="rounded-2xl border border-zinc-200/70 bg-white/90 p-4 text-sm dark:border-zinc-800/70 dark:bg-zinc-900/70">
                  <p className="text-xs font-semibold uppercase tracking-[0.4em] text-zinc-400">
                    Ví dụ
                  </p>
                  {term.example && (
                    <p className="mt-2 italic text-zinc-700 dark:text-zinc-200">
                      “{term.example}”
                    </p>
                  )}
                  {term.translatedExample && (
                    <p className="mt-2 italic text-zinc-500 dark:text-zinc-400">
                      “{term.translatedExample}”
                    </p>
                  )}
                </section>
              )}
            </div>
            <p className="absolute bottom-6 text-xs uppercase tracking-[0.4em] text-zinc-400">
              Nhấn Space để lật lại
            </p>
          </FlashcardFace>
        </div>
      </div>

      <style jsx>{`
        .perspective-1000 {
          perspective: 1600px;
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

function FlashcardFace({
  heading,
  subheading,
  accent,
  className,
  children,
}: {
  heading: string;
  subheading?: string;
  accent: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`absolute inset-0 rounded-[40px] border border-zinc-200/80 bg-gradient-to-br ${accent} p-8 shadow-xl transition dark:border-zinc-800/70 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900 ${className}`}
    >
      <div className="flex h-full flex-col items-center justify-center text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-zinc-200/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-zinc-500 dark:border-zinc-800/70 dark:text-zinc-300">
          <BookOpen className="h-4 w-4" />
          {heading}
        </div>
        {subheading && (
          <span className="mb-4 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-600 dark:bg-white/10 dark:text-sky-200">
            {subheading}
          </span>
        )}
        {children}
      </div>
    </div>
  );
}

