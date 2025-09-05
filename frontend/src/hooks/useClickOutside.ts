"use client";

import { useEffect, RefObject, MutableRefObject } from "react";

type Options = {
  enabled?: boolean;
  // SỬA Ở ĐÂY: Cho phép ref trong mảng ignore có thể là null
  ignore?: RefObject<HTMLElement | null>[];
  events?: Array<keyof DocumentEventMap>;
};

type AnyRef<T extends HTMLElement> = RefObject<T> | MutableRefObject<T | null>;

export default function useClickOutside<T extends HTMLElement>(
  ref: AnyRef<T>,
  onOutside: (ev: Event) => void,
  { enabled = true, ignore = [], events = ["pointerdown"] }: Options = {}
) {
  useEffect(() => {
    if (!enabled) return;

    const handler = (ev: Event) => {
      const el = ref.current;
      if (!el) return;

      const target = ev.target;
      if (!(target instanceof Node)) return;

      // Click trong element chính -> bỏ qua
      if (el.contains(target)) return;

      // Click trong các element ignore -> bỏ qua (đã an toàn với optional chaining)
      if (ignore.some((r) => r.current?.contains(target))) return;

      onOutside(ev);
    };

    events.forEach((e) =>
      document.addEventListener(e, handler, { capture: true })
    );
    return () => {
      events.forEach((e) =>
        document.removeEventListener(e, handler, { capture: true })
      );
    };
  }, [enabled, ref, onOutside, ignore, events]);
}
