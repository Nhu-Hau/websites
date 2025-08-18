"use client";

import { useEffect, RefObject, MutableRefObject } from "react";

type Options = {
  enabled?: boolean;
  ignore?: RefObject<HTMLElement>[];               // có thể giữ nguyên
  events?: Array<keyof DocumentEventMap>;          // mặc định: ["pointerdown"]
};

// Cho phép truyền cả RefObject<T> lẫn MutableRefObject<T|null>
type AnyRef<T extends HTMLElement> =
  | RefObject<T>
  | MutableRefObject<T | null>;

export default function useClickOutside<T extends HTMLElement>(
  ref: AnyRef<T>,
  onOutside: (ev: Event) => void,
  { enabled = true, ignore = [], events = ["pointerdown"] }: Options = {}
) {
  useEffect(() => {
    if (!enabled) return;

    const handler = (ev: Event) => {
      const el = ref.current as T | null;
      if (!el) return;

      const target = ev.target as Node | null;
      if (!target) return;

      if (el.contains(target)) return; // click trong el
      if (ignore.some(r => r.current?.contains(target))) return; // click trong ignore

      onOutside(ev);
    };

    events.forEach(e =>
      document.addEventListener(e, handler, { capture: true })
    );
    return () => {
      events.forEach(e =>
        document.removeEventListener(e, handler, { capture: true })
      );
    };
  }, [enabled, ref, onOutside, ignore, events]);
}
