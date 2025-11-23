"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, X } from "lucide-react";
import { WordTranslation } from "../../../hooks/news/useWordTranslation";
import { useSpeech } from "../../../hooks/news/useSpeech";
import { SaveVocabularyButton } from "./SaveVocabularyButton";

interface TranslationPopoverProps {
  data: WordTranslation;
  position: { x: number; y: number };
  loading: boolean;
  showMeaning: "vietnamese" | "english";
  onToggleMeaning: () => void;
  onClose: () => void;
}

export function TranslationPopover({
  data,
  position,
  loading,
  showMeaning,
  onToggleMeaning,
  onClose,
}: TranslationPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState(position);
  const { speak, speaking } = useSpeech();

  // Adjust position to prevent overflow (only once, fixed position)
  useEffect(() => {
    if (!popoverRef.current) return;

    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      if (!popoverRef.current) return;

      const rect = popoverRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Position is already in viewport coordinates (from getBoundingClientRect)
      // Place sát bên dưới từ, căn trái với từ
      let x = position.x; // Align left with the word
      let y = position.y + 3; // Sát bên dưới từ (khoảng cách nhỏ nhất)

      // Prevent overflow right
      if (x + rect.width > viewportWidth - 20) {
        x = viewportWidth - rect.width - 20;
      }

      // Prevent overflow bottom
      if (y + rect.height > viewportHeight - 20) {
        y = position.y - rect.height - 10; // Show above word
      }

      // Prevent overflow left
      if (x < 20) {
        x = 20;
      }

      // Prevent overflow top
      if (y < 20) {
        y = 20;
      }

      setAdjustedPosition({ x, y });
    });
    // Only calculate once when position/data changes, not on scroll
  }, [position.x, position.y, data.word]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  if (!data.vietnameseMeaning && !loading) {
    // Premium guard was triggered
    return null;
  }

  return (
    <div
      ref={popoverRef}
      className="fixed z-[100] bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-4 max-w-md"
      style={{
        left: `${adjustedPosition.x}px`,
        top: `${adjustedPosition.y}px`,
      }}
    >
      {loading ? (
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Translating...</span>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                  {data.word}
                </h4>
                <button
                  onClick={() => speak(data.word)}
                  disabled={speaking}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-600 transition-all duration-200 hover:bg-gray-100 hover:text-[#4063bb] dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-sky-400 active:scale-95 disabled:opacity-50"
                  title="Phát âm"
                >
                  <Volume2 className={`h-4 w-4 ${speaking ? 'text-[#4063bb] dark:text-sky-400' : ''}`} />
                </button>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {data.phonetic && (
                  <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                    {data.phonetic}
                  </span>
                )}
                {data.partOfSpeech && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 italic">
                    {data.partOfSpeech}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition-all duration-200 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300 active:scale-95"
              title="Đóng"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Meaning Toggle */}
          <div className="mb-3 flex items-center gap-2">
            <button
              onClick={onToggleMeaning}
              className="text-xs px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-all duration-200 hover:bg-gray-200 dark:hover:bg-gray-600 hover:scale-105 active:scale-95"
            >
              {showMeaning === "vietnamese" ? "Tiếng Việt" : "English"}
            </button>
          </div>

          {/* Meaning */}
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-gray-800 dark:text-gray-200">
              {showMeaning === "vietnamese"
                ? data.vietnameseMeaning
                : data.englishMeaning}
            </p>
          </div>

          {/* Examples */}
          {data.examples && data.examples.length > 0 && (
            <div className="mb-4 space-y-2">
              <h5 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                Examples
              </h5>
              {data.examples.map((example, i) => (
                <div key={i} className="text-xs space-y-1">
                  <p className="text-gray-700 dark:text-gray-300 italic">
                    &quot;{example.english}&quot;
                  </p>
                  <p className="text-gray-500 dark:text-gray-400">
                    &quot;{example.vietnamese}&quot;
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Save Button */}
          <SaveVocabularyButton
            word={data.word}
            meaning={data.vietnameseMeaning}
            englishMeaning={data.englishMeaning}
            partOfSpeech={data.partOfSpeech}
            phonetic={data.phonetic}
            example={data.examples[0]?.english}
            translatedExample={data.examples[0]?.vietnamese}
          />
        </>
      )}
    </div>
  );
}
