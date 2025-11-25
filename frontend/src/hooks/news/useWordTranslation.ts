"use client";

import { useState, useCallback } from "react";
import { toast } from "@/lib/toast";
import { useTranslations } from "next-intl";

export interface WordTranslation {
  word: string;
  phonetic?: string; // IPA phonetic transcription
  vietnameseMeaning: string;
  englishMeaning: string;
  partOfSpeech: string;
  examples: Array<{
    english: string;
    vietnamese: string;
  }>;
}

interface Position {
  x: number;
  y: number;
}

export function useWordTranslation(isPremium: boolean) {
  const t = useTranslations("newsHooks.translation");
  const [wordData, setWordData] = useState<WordTranslation | null>(null);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [loading, setLoading] = useState(false);
  const [showMeaning, setShowMeaning] = useState<"vietnamese" | "english">("vietnamese");

  // Translate word from text and position
  const translateWord = useCallback(
    async (word: string, wordPosition: Position) => {
      if (!word || word.length < 2 || /[^a-zA-Z'-]/.test(word)) {
        return;
      }

      // Set position (fixed in viewport)
      setPosition(wordPosition);

      if (!isPremium) {
        // Show premium guard
        setWordData({
          word,
          phonetic: undefined,
          vietnameseMeaning: "",
          englishMeaning: "",
          partOfSpeech: "",
          examples: [],
        });
        return;
      }

      // Fetch translation
      try {
        setLoading(true);
        setWordData(null);

        const response = await fetch("/api/news/translate/word", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ word }),
        });

        if (!response.ok) {
          const error = await response.json();
          if (error.isPremiumOnly) {
            toast.error(t("premiumRequired"));
            return;
          }
          throw new Error(error.error || t("wordError"));
        }

        const data = await response.json();
        setWordData(data.data);
      } catch (error: any) {
        console.error("Error translating word:", error);
        toast.error(error?.message || t("wordError"));
      } finally {
        setLoading(false);
      }
    },
    [isPremium, t]
  );

  const handleWordClick = useCallback(
    async (e: MouseEvent) => {
      // Get the clicked word
      const selection = window.getSelection();
      const range = document.caretRangeFromPoint(e.clientX, e.clientY);
      
      if (!range) return;

      // Expand to word boundaries manually
      try {
        const textNode = range.startContainer;
        if (textNode.nodeType === Node.TEXT_NODE) {
          const text = textNode.textContent || "";
          const offset = range.startOffset;
          
          // Find word start
          let start = offset;
          while (start > 0 && /[\w'-]/.test(text[start - 1])) {
            start--;
          }
          
          // Find word end
          let end = offset;
          while (end < text.length && /[\w'-]/.test(text[end])) {
            end++;
          }
          
          if (start < end) {
            range.setStart(textNode, start);
            range.setEnd(textNode, end);
          }
        }
      } catch {
        // If manual expansion fails, try to use the range as-is
      }
      
      selection?.removeAllRanges();
      selection?.addRange(range);

      const word = selection?.toString().trim();
      
      if (!word || word.length < 2 || /[^a-zA-Z'-]/.test(word)) {
        return;
      }

      // Get the bounding rect of the selected word for fixed position
      const rect = range.getBoundingClientRect();
      
      // Clear selection after getting the word
      selection?.removeAllRanges();

      // Use the bottom center of the word as position (fixed in viewport)
      await translateWord(word, {
        x: rect.left + rect.width / 2,
        y: rect.bottom,
      });
    },
    [translateWord]
  );

  const clearWordData = useCallback(() => {
    setWordData(null);
    setLoading(false);
  }, []);

  return {
    wordData,
    position,
    loading,
    showMeaning,
    setShowMeaning,
    handleWordClick,
    translateWord,
    clearWordData,
  };
}



