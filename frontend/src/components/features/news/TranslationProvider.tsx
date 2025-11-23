"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useWordTranslation } from "../../../hooks/news/useWordTranslation";
import { useSelectionTranslation } from "../../../hooks/news/useSelectionTranslation";
import { TranslationPopover } from "./TranslationPopover";
import { SelectionPopover } from "./SelectionPopover";
import { TranslationMenu } from "./TranslationMenu";

interface TranslationProviderProps {
  children: ReactNode;
  isPremium: boolean;
}

export function TranslationProvider({
  children,
  isPremium,
}: TranslationProviderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [menuState, setMenuState] = useState<{
    show: boolean;
    position: { x: number; y: number };
    selectedText: string;
    type: "word" | "selection";
  } | null>(null);

  const {
    wordData,
    position: wordPosition,
    loading: wordLoading,
    showMeaning,
    setShowMeaning,
    translateWord,
    clearWordData,
  } = useWordTranslation(isPremium);

  const {
    selectionData,
    position: selectionPosition,
    loading: selectionLoading,
    translateSelection,
    clearSelectionData,
  } = useSelectionTranslation(isPremium);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    let doubleClickHandled = false;
    let doubleClickTimeout: NodeJS.Timeout | null = null;

    // Handle double-click on words
    const onDoubleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Check if double-clicked inside a paragraph
      if (target.closest("p")) {
        doubleClickHandled = true;
        
        // Get the clicked word
        const selection = window.getSelection();
        const range = document.caretRangeFromPoint(e.clientX, e.clientY);
        
        if (!range) {
          doubleClickHandled = false;
          return;
        }

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
        
        if (word && word.length >= 2 && !/[^a-zA-Z'-]/.test(word)) {
          // Get the bounding rect of the selected word
          const rect = range.getBoundingClientRect();
          
          // Clear selection
          selection?.removeAllRanges();
          
          // Show menu below the word (sát bên dưới)
          setMenuState({
            show: true,
            position: {
              x: rect.left, // Left edge of the word (to align menu with word)
              y: rect.bottom, // Bottom edge of the word (sát bên dưới)
            },
            selectedText: word,
            type: "word",
          });
        } else {
          selection?.removeAllRanges();
        }
        
        // Reset flag after a short delay
        if (doubleClickTimeout) {
          clearTimeout(doubleClickTimeout);
        }
        doubleClickTimeout = setTimeout(() => {
          doubleClickHandled = false;
        }, 300);
      }
    };

    // Handle text selection (mouseup)
    const onMouseUp = (e: MouseEvent) => {
      // Skip if double-click was just handled
      if (doubleClickHandled) {
        return;
      }

      setTimeout(() => {
        // Check again in case double-click was handled during timeout
        if (doubleClickHandled) {
          return;
        }

        const selection = window.getSelection();
        const selectedText = selection?.toString().trim();

        if (selectedText && selectedText.length > 0) {
          // Get selection range for position
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            
            // Show menu below the selection (sát bên dưới)
            setMenuState({
              show: true,
              position: {
                x: rect.left, // Left edge of the selection (to align menu with selection)
                y: rect.bottom, // Bottom edge of the selection (sát bên dưới)
              },
              selectedText: selectedText,
              type: selectedText.split(/\s+/).length === 1 ? "word" : "selection",
            });
          }
        }
      }, 10);
    };

    container.addEventListener("dblclick", onDoubleClick);
    container.addEventListener("mouseup", onMouseUp);

    return () => {
      container.removeEventListener("dblclick", onDoubleClick);
      container.removeEventListener("mouseup", onMouseUp);
      if (doubleClickTimeout) {
        clearTimeout(doubleClickTimeout);
      }
    };
  }, []);

  const handleTranslate = () => {
    if (!menuState) return;

    // Use the position already saved in menuState (from getBoundingClientRect)
    // This position is in viewport coordinates and will be fixed when popup shows
    if (menuState.type === "word") {
      translateWord(menuState.selectedText, menuState.position);
    } else {
      translateSelection(menuState.selectedText, menuState.position);
    }

    // Clear any selection
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
    }
  };

  return (
    <>
      <div ref={containerRef} className="relative">
        {children}
      </div>

      {/* Translation Menu - Render outside container using Portal */}
      {menuState?.show &&
        createPortal(
          <TranslationMenu
            position={menuState.position}
            selectedText={menuState.selectedText}
            onTranslate={handleTranslate}
            onClose={() => setMenuState(null)}
          />,
          document.body
        )}

      {/* Word Translation Popover - Render outside container using Portal */}
      {wordData &&
        createPortal(
          <TranslationPopover
            data={wordData}
            position={wordPosition}
            loading={wordLoading}
            showMeaning={showMeaning}
            onToggleMeaning={() =>
              setShowMeaning(
                showMeaning === "vietnamese" ? "english" : "vietnamese"
              )
            }
            onClose={clearWordData}
          />,
          document.body
        )}

      {/* Selection Translation Popover - Render outside container using Portal */}
      {selectionData &&
        createPortal(
          <SelectionPopover
            data={selectionData}
            position={selectionPosition}
            loading={selectionLoading}
            onClose={clearSelectionData}
          />,
          document.body
        )}
    </>
  );
}
