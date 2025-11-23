"use client";

import { useState } from "react";
import { SaveVocabularyModal } from "./SaveVocabularyModal";

interface SaveVocabularyButtonProps {
  word: string;
  meaning: string;
  englishMeaning?: string;
  partOfSpeech?: string;
  phonetic?: string;
  example?: string;
  translatedExample?: string;
  size?: "small" | "normal";
}

export function SaveVocabularyButton({
  word,
  meaning,
  englishMeaning,
  partOfSpeech,
  phonetic,
  example,
  translatedExample,
  size = "normal",
}: SaveVocabularyButtonProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`w-full bg-gradient-to-br from-[#4063bb] to-sky-500 text-white font-semibold rounded-xl shadow-lg shadow-[#4063bb]/30 transition-all duration-200 hover:shadow-xl hover:shadow-[#4063bb]/40 hover:scale-105 active:scale-95 ${
          size === "small" ? "text-xs px-3 py-2" : "text-sm px-4 py-2.5"
        }`}
      >
        Lưu vào bộ từ vựng
      </button>

      {showModal && (
        <SaveVocabularyModal
          word={word}
          meaning={meaning}
          englishMeaning={englishMeaning}
          partOfSpeech={partOfSpeech}
          phonetic={phonetic}
          example={example}
          translatedExample={translatedExample}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}


