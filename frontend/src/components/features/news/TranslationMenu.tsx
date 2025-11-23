"use client";

import { useEffect, useRef, useState } from "react";
import { BookOpen, X } from "lucide-react";

interface TranslationMenuProps {
  position: { x: number; y: number };
  selectedText: string;
  onTranslate: () => void;
  onClose: () => void;
}

export function TranslationMenu({
  position,
  selectedText,
  onTranslate,
  onClose,
}: TranslationMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState(() => {
    // Initial position - will be adjusted in useEffect
    return {
      x: position.x,
      y: position.y + 5, // Sát bên dưới từ
    };
  });
  const [placement, setPlacement] = useState<"right" | "left" | "bottom">(
    "bottom"
  );

  // Adjust position to show below the word/selection
  useEffect(() => {
    if (!menuRef.current) return;

    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      if (!menuRef.current) return;

      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const menuWidth = rect.width;
      const menuHeight = rect.height;
      const spacing = 5; // Space between selection and menu (sát bên dưới)

      // Position is already at rect.left and rect.bottom from TranslationProvider
      // Menu should appear directly below, aligned with the left edge of the word
      let x = position.x; // Align left with the word
      let y = position.y + spacing; // Sát bên dưới từ

      // Adjust if overflow right
      if (x + menuWidth > viewportWidth - 16) {
        x = viewportWidth - menuWidth - 16;
      }

      // Adjust if overflow left
      if (x < 16) {
        x = 16;
      }

      // Adjust if overflow bottom
      if (y + menuHeight > viewportHeight - 16) {
        y = position.y - menuHeight - spacing; // Show above word if no space below
      }

      // Adjust if overflow top
      if (y < 16) {
        y = 16;
      }

      setPlacement("bottom");
      setAdjustedPosition({ x, y });
    });
  }, [position]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // Use mousedown to catch clicks before they propagate
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="fixed z-[100] bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden min-w-[140px] sm:min-w-[160px]"
      style={{
        left: `${adjustedPosition.x}px`,
        top: `${adjustedPosition.y}px`,
      }}
    >
      <div className="flex items-center gap-2 px-3 py-2.5 sm:px-4 sm:py-3">
        <button
          onClick={() => {
            onTranslate();
            onClose();
          }}
          className="flex-1 flex items-center gap-2 text-sm sm:text-base text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium min-w-0"
        >
          <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
          <span className="truncate">Tra từ</span>
        </button>
        <button
          onClick={onClose}
          className="flex-shrink-0 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded"
          aria-label="Đóng"
        >
          <X className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
      </div>
    </div>
  );
}
