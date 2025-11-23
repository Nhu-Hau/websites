"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, X } from "lucide-react";
import { SelectionTranslation } from "../../../hooks/news/useSelectionTranslation";
import { useSpeech } from "../../../hooks/news/useSpeech";
import { SaveVocabularyButton } from "./SaveVocabularyButton";

interface SelectionPopoverProps {
  data: SelectionTranslation;
  position: { x: number; y: number };
  loading: boolean;
  onClose: () => void;
}

export function SelectionPopover({
  data,
  position,
  loading,
  onClose,
}: SelectionPopoverProps) {
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
      // Center horizontally on the selection, place below it
      let x = position.x - rect.width / 2; // Center on selection
      let y = position.y + 10; // Offset below selection

      if (x + rect.width > viewportWidth - 20) {
        x = viewportWidth - rect.width - 20;
      }

      if (y + rect.height > viewportHeight - 20) {
        y = position.y - rect.height - 10;
      }

      if (x < 20) {
        x = 20;
      }

      if (y < 20) {
        y = 20;
      }

      setAdjustedPosition({ x, y });
    });
    // Only calculate once when position/data changes, not on scroll
  }, [position.x, position.y, data.originalText]);

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

  if (!data.translation && !loading) {
    return null;
  }

  return (
    <div
      ref={popoverRef}
      className="fixed z-[100] bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-4 max-w-lg"
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
            <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              Dịch
            </h4>
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition-all duration-200 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300 active:scale-95"
              title="Đóng"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Original Text with Speaker */}
          <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm text-gray-600 dark:text-gray-400 italic flex-1">
                &quot;{data.originalText}&quot;
              </p>
              <button
                onClick={() => speak(data.originalText)}
                disabled={speaking}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-600 transition-all duration-200 hover:bg-gray-100 hover:text-[#4063bb] dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-sky-400 active:scale-95 disabled:opacity-50 flex-shrink-0"
                title="Đọc to"
              >
                <Volume2 className={`h-4 w-4 ${speaking ? 'text-[#4063bb] dark:text-sky-400' : ''}`} />
              </button>
            </div>
          </div>

          {/* Translation */}
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-gray-800 dark:text-gray-200">
              {data.translation}
            </p>
          </div>

          {/* Key Words */}
          {data.keyWords && data.keyWords.length > 0 && (
            <div className="space-y-3">
              <h5 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                Key Vocabulary
              </h5>
              {data.keyWords.map((word, i) => (
                <div
                  key={i}
                  className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {word.word}
                      </span>
                      {word.partOfSpeech && (
                        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400 italic">
                          {word.partOfSpeech}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {word.vietnameseMeaning}
                  </p>
                  <SaveVocabularyButton
                    word={word.word}
                    meaning={word.vietnameseMeaning}
                    partOfSpeech={word.partOfSpeech}
                    size="small"
                  />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
