/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useCallback } from "react";
import { toast } from "@/lib/toast";

export interface SelectionTranslation {
  originalText: string;
  translation: string;
  keyWords: Array<{
    word: string;
    vietnameseMeaning: string;
    partOfSpeech: string;
  }>;
}

interface Position {
  x: number;
  y: number;
}

export function useSelectionTranslation(isPremium: boolean) {
  const [selectionData, setSelectionData] = useState<SelectionTranslation | null>(null);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [loading, setLoading] = useState(false);

  // Translate selection from text and position
  const translateSelection = useCallback(
    async (text: string, selectionPosition: Position) => {
      // Validate selection (should be a phrase, not just a single word)
      const wordCount = text.split(/\s+/).length;
      if (wordCount < 1) {
        return;
      }

      // Set position (fixed in viewport)
      setPosition(selectionPosition);

      if (!isPremium) {
        // Show premium guard
        setSelectionData({
          originalText: text,
          translation: "",
          keyWords: [],
        });
        return;
      }

      // Fetch translation
      try {
        setLoading(true);
        setSelectionData(null);

        const response = await fetch("/api/news/translate/paragraph", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ text }),
        });

        if (!response.ok) {
          const error = await response.json();
          if (error.isPremiumOnly) {
            toast.error("Cần tài khoản Premium để sử dụng tính năng này");
            return;
          }
          throw new Error(error.error || "Translation failed");
        }

        const data = await response.json();
        setSelectionData(data.data);
      } catch (error: any) {
        console.error("Error translating selection:", error);
        toast.error(error.message || "Không thể dịch đoạn văn");
      } finally {
        setLoading(false);
      }
    },
    [isPremium]
  );

  const handleSelection = useCallback(
    async (e: MouseEvent, text: string) => {
      // Get selection range for position
      const selection = window.getSelection();
      if (!selection || !selection.rangeCount) {
        return;
      }

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      // Use the bottom center of the selection as position (fixed in viewport)
      await translateSelection(text, {
        x: rect.left + rect.width / 2,
        y: rect.bottom,
      });
    },
    [translateSelection]
  );

  const clearSelectionData = useCallback(() => {
    setSelectionData(null);
    setLoading(false);
  }, []);

  return {
    selectionData,
    position,
    loading,
    handleSelection,
    translateSelection,
    clearSelectionData,
  };
}



