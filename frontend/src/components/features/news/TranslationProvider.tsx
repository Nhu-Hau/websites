"use client";

import { ReactNode, useEffect, useRef } from "react";
import { useWordTranslation } from "./hooks/useWordTranslation";
import { useSelectionTranslation } from "./hooks/useSelectionTranslation";
import { TranslationPopover } from "./TranslationPopover";
import { SelectionPopover } from "./SelectionPopover";

interface TranslationProviderProps {
  children: ReactNode;
  isPremium: boolean;
}

export function TranslationProvider({ children, isPremium }: TranslationProviderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const {
    wordData,
    position: wordPosition,
    loading: wordLoading,
    showMeaning,
    setShowMeaning,
    handleWordClick,
    clearWordData,
  } = useWordTranslation(isPremium);

  const {
    selectionData,
    position: selectionPosition,
    loading: selectionLoading,
    handleSelection,
    clearSelectionData,
  } = useSelectionTranslation(isPremium);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    // Handle click on words
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Check if clicked inside a paragraph
      if (target.closest("p")) {
        handleWordClick(e);
      }
    };

    // Handle text selection
    const onMouseUp = (e: MouseEvent) => {
      setTimeout(() => {
        const selection = window.getSelection();
        const selectedText = selection?.toString().trim();
        
        if (selectedText && selectedText.length > 1) {
          handleSelection(e, selectedText);
        }
      }, 10);
    };

    container.addEventListener("click", onClick);
    container.addEventListener("mouseup", onMouseUp);

    return () => {
      container.removeEventListener("click", onClick);
      container.removeEventListener("mouseup", onMouseUp);
    };
  }, [handleWordClick, handleSelection]);

  return (
    <div ref={containerRef} className="relative">
      {children}

      {/* Word Translation Popover */}
      {wordData && (
        <TranslationPopover
          data={wordData}
          position={wordPosition}
          loading={wordLoading}
          showMeaning={showMeaning}
          onToggleMeaning={() => setShowMeaning(showMeaning === "vietnamese" ? "english" : "vietnamese")}
          onClose={clearWordData}
        />
      )}

      {/* Selection Translation Popover */}
      {selectionData && (
        <SelectionPopover
          data={selectionData}
          position={selectionPosition}
          loading={selectionLoading}
          onClose={clearSelectionData}
        />
      )}
    </div>
  );
}



