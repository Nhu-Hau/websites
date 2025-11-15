"use client";

import { useState } from "react";
import { SaveVocabularyModal } from "./SaveVocabularyModal";

interface SaveVocabularyButtonProps {
  word: string;
  meaning: string;
  englishMeaning?: string;
  partOfSpeech?: string;
  example?: string;
  translatedExample?: string;
  size?: "small" | "normal";
}

export function SaveVocabularyButton({
  word,
  meaning,
  englishMeaning,
  partOfSpeech,
  example,
  translatedExample,
  size = "normal",
}: SaveVocabularyButtonProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-lg hover:from-green-600 hover:to-emerald-700 transition-colors ${
          size === "small" ? "text-xs px-3 py-1.5" : "text-sm px-4 py-2"
        }`}
      >
        📚 Lưu vào bộ từ vựng
      </button>

      {showModal && (
        <SaveVocabularyModal
          word={word}
          meaning={meaning}
          englishMeaning={englishMeaning}
          partOfSpeech={partOfSpeech}
          example={example}
          translatedExample={translatedExample}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}


