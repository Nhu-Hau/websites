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

  const handleSelection = useCallback(
    async (e: MouseEvent, text: string) => {
      // Validate selection (should be a phrase, not just a single word)
      const wordCount = text.split(/\s+/).length;
      if (wordCount < 3) {
        // Too short, might be a single word - ignore
        return;
      }

      // Set position
      setPosition({
        x: e.clientX,
        y: e.clientY,
      });

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
            toast.error("Premium subscription required");
            return;
          }
          throw new Error(error.error || "Translation failed");
        }

        const data = await response.json();
        setSelectionData(data.data);
      } catch (error: any) {
        console.error("Error translating selection:", error);
        toast.error(error.message || "Failed to translate selection");
      } finally {
        setLoading(false);
      }
    },
    [isPremium]
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
    clearSelectionData,
  };
}



