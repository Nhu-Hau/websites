"use client";

import { useState, useCallback } from "react";
import { toast } from "@/lib/toast";

export interface WordTranslation {
  word: string;
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
  const [wordData, setWordData] = useState<WordTranslation | null>(null);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [loading, setLoading] = useState(false);
  const [showMeaning, setShowMeaning] = useState<"vietnamese" | "english">("vietnamese");

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
        // Not a valid word
        return;
      }

      // Clear selection after getting the word
      selection?.removeAllRanges();

      // Set position near cursor
      setPosition({
        x: e.clientX,
        y: e.clientY,
      });

      if (!isPremium) {
        // Show premium guard
        setWordData({
          word,
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
            toast.error("Premium subscription required");
            return;
          }
          throw new Error(error.error || "Translation failed");
        }

        const data = await response.json();
        setWordData(data.data);
      } catch (error: any) {
        console.error("Error translating word:", error);
        toast.error(error.message || "Failed to translate word");
      } finally {
        setLoading(false);
      }
    },
    [isPremium]
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
    clearWordData,
  };
}



