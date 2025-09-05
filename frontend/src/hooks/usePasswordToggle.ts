"use client";

import { useState } from "react";

export function usePasswordToggle(initial = false) {
  const [show, setShow] = useState(initial);
  return { show, toggle: () => setShow((s) => !s) };
}
