import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export function useDropdown() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Đóng khi đổi route
  useEffect(() => setOpen(false), [pathname]);

  // Đóng khi bấm ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Blur ra ngoài thì đóng
  const handleBlur = (e: React.FocusEvent) => {
    if (!rootRef.current?.contains(e.relatedTarget as Node)) setOpen(false);
  };

  return { open, setOpen, rootRef, handleBlur };
}