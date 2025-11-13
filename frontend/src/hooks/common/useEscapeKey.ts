"use client";

import { useEffect } from "react";

export default function useEscapeKey(onEscape?: () => void) {
  useEffect(() => {
    if (typeof window === "undefined" || !onEscape) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onEscape();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
    };
  }, [onEscape]);
}
