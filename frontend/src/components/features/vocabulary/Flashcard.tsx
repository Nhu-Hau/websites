"use client";

import React from "react";
import { VocabularyTerm } from "@/types/vocabulary.types";
import { Volume2, BookOpen } from "lucide-react";
import { useSpeech } from "@/hooks/news/useSpeech";
import { useTranslations } from "next-intl";

interface FlashcardProps {
  term: VocabularyTerm;
  isFlipped: boolean;
  onFlip: () => void;
}

export function Flashcard({ term, isFlipped, onFlip }: FlashcardProps) {
  const t = useTranslations("vocabularyExtra.flashcard");
  const { speak, speaking } = useSpeech();

  const handleAudio = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (term.audio) {
      const audio = new Audio(term.audio);
      audio.play().catch(() => {
        /* ignore */
      });
    } else {
      // Use text-to-speech if no audio URL
      speak(term.word);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onFlip();
    }
  };

  return (
    <div className="mx-auto mb-4 w-full sm:mb-6 max-w-2xl md:max-w-3xl lg:max-w-4xl">
      <div
        className="relative w-full aspect-[4/3] xs:aspect-[4/3] sm:aspect-[5/3] cursor-pointer overflow-visible rounded-2xl transition-transform duration-200 hover:-translate-y-1 hover:shadow-xl sm:rounded-3xl"
        onClick={onFlip}
        role="button"
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        {/* LỚP BÊN TRONG ĐỂ XOAY 3D */}
        <div
          className={`relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d] ${
            isFlipped ? "[transform:rotateY(180deg)]" : ""
          }`}
        >
          {/* ============== FRONT: TỪ VỰNG ============== */}
          <FlashcardFace
            heading={t("term")}
            subheading={term.partOfSpeech}
            accent="from-sky-50 via-white to-emerald-50"
            className=""
            style={{ backfaceVisibility: "hidden" }}
          >
            <div className="flex h-full flex-col justify-between">
              <div className="flex flex-1 flex-col items-center justify-center px-3 text-center sm:px-6 md:px-8">
                <div className="w-full max-w-md sm:max-w-lg">
                  {/* BLOCK CHUẨN: sử dụng cho cả {term.word} & {term.meaning} */}
                  <h2 className="mb-2 break-words text-lg font-semibold tracking-tight text-zinc-900 dark:text-white xs:text-xl sm:text-2xl md:text-3xl">
                    {term.word}
                  </h2>

                  {term.phonetic && (
                    <p className="mb-3 text-xs font-medium text-zinc-600 xs:text-sm dark:text-zinc-400">
                      /{term.phonetic}/
                    </p>
                  )}

                  <button
                    onClick={handleAudio}
                    disabled={speaking}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/70 bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:text-[#2E5EB8] dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-100 disabled:opacity-50"
                  >
                    <Volume2 className={`h-3.5 w-3.5 ${speaking ? 'text-[#2E5EB8]' : ''}`} />
                    {term.audio ? t("listen") : t("read")}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between px-3 pb-2 pt-1 text-[10px] text-zinc-400 sm:px-6 sm:pb-3">
                <span className="uppercase tracking-[0.22em]">{t("tapToFlip")}</span>
                {/* Chip trạng thái: Thuật ngữ */}
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/85 px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.25em] text-slate-500 sm:px-3 sm:py-1 sm:text-[10px] dark:border-zinc-800/80 dark:bg-zinc-900/80 dark:text-zinc-300">
                  <BookOpen className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  {t("term")}
                </span>
              </div>
            </div>
          </FlashcardFace>

          {/* ============== BACK: NGHĨA ============== */}
          <FlashcardFace
            heading={t("meaning")}
            subheading={term.partOfSpeech}
            accent="from-emerald-50 via-white to-amber-50"
            className=""
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <div className="flex h-full flex-col justify-between">
              <div className="flex flex-1 flex-col items-center justify-center px-3 text-center sm:px-6 md:px-8">
                <div className="w-full max-w-[290px] xs:max-w-md sm:max-w-lg">
                  {/* BLOCK CHUẨN Y HỆT TRÊN, CHỈ ĐỔI DATA => {term.meaning} */}
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <h2 className="break-words text-lg font-semibold tracking-tight text-zinc-900 dark:text-white xs:text-xl sm:text-2xl md:text-3xl">
                      {term.meaning}
                    </h2>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (term.audio) {
                          const audio = new Audio(term.audio);
                          audio.play().catch(() => {
                            /* ignore */
                          });
                        } else {
                          speak(term.word);
                        }
                      }}
                      disabled={speaking}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-600 transition-all duration-200 hover:bg-gray-100 hover:text-[#2E5EB8] dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-sky-400 active:scale-95 disabled:opacity-50 flex-shrink-0"
                      title={t("read")}
                    >
                      <Volume2 className={`h-4 w-4 ${speaking ? 'text-[#2E5EB8] dark:text-sky-400' : ''}`} />
                    </button>
                  </div>

                  {term.englishMeaning && (
                    <p className="mb-2 text-xs text-zinc-600 xs:text-sm dark:text-zinc-300">
                      {term.englishMeaning}
                    </p>
                  )}

                  {(term.example || term.translatedExample) && (
                    <div
                      className="
                        mt-3 xs:mt-4 sm:mt-5
                        w-full rounded-xl border border-slate-100/70 bg-white
                        p-2.5 xs:p-3 sm:p-3.5
                        text-left text-[11px] xs:text-xs sm:text-[13px]
                        leading-relaxed
                        max-h-32 xs:max-h-40 sm:max-h-48
                        overflow-y-auto
                        scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent
                        dark:border-zinc-800/70 dark:bg-zinc-900/80
                        dark:scrollbar-thumb-zinc-700
                      "
                    >
                      <p className="text-[9px] xs:text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-400">
                        {t("example")}
                      </p>

                      {term.example && (
                        <p className="mt-1.5 xs:mt-2 sm:mt-2.5 italic text-slate-700 dark:text-zinc-200 break-words">
                          &quot;{term.example}&quot;
                        </p>
                      )}

                      {term.translatedExample && (
                        <p className="mt-1.5 xs:mt-2 sm:mt-2.5 text-slate-500 dark:text-zinc-400 break-words">
                          &quot;{term.translatedExample}&quot;
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between px-3 pb-2 pt-1 text-[10px] text-zinc-400 sm:px-6 sm:pb-3">
                <span className="uppercase tracking-[0.24em]">
                  {t("tapToFlipBack")}
                </span>
                {/* Chip trạng thái: Nghĩa */}
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/85 px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.25em] text-slate-500 sm:px-3 sm:py-1 sm:text-[10px] dark:border-zinc-800/80 dark:bg-zinc-900/80 dark:text-zinc-300">
                  <BookOpen className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  {t("meaning")}
                </span>
              </div>
            </div>
          </FlashcardFace>
        </div>
      </div>

      <p className="mt-2 text-center text-[10px] text-zinc-400 sm:hidden">
        {t("flipHint")}
      </p>
    </div>
  );
}

function FlashcardFace({
  heading,
  subheading,
  accent,
  className,
  children,
  style,
}: {
  heading: string;
  subheading?: string;
  accent: string;
  className?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`absolute inset-0 rounded-2xl border border-white/60 bg-gradient-to-br ${accent} p-3 shadow-lg shadow-slate-900/5 transition backdrop-blur-xl xs:p-3.5 sm:rounded-3xl sm:p-4 md:p-5 dark:border-zinc-800/60 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900 ${
        className ?? ""
      }`}
      style={style}
    >
      <div className="flex h-full flex-col">{children}</div>
    </div>
  );
}