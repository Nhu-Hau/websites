"use client";

import { useEffect, useRef, useState } from "react";
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

  // Adjust position to prevent overflow
  useEffect(() => {
    if (!popoverRef.current) return;

    const rect = popoverRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let x = position.x;
    let y = position.y + 20;

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
  }, [position, data]);

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
      className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-4 max-w-lg"
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
            <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase">
              Translation
            </h4>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ✕
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
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors flex-shrink-0"
                title="Read aloud"
              >
                {speaking ? (
                  <span className="text-blue-600">🔊</span>
                ) : (
                  <span className="text-gray-600 dark:text-gray-400">🔊</span>
                )}
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
