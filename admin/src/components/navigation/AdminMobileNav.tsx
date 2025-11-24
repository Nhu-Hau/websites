"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import type { AdminNavItem } from "@/lib/navigation/adminNav";
import AdminNavMenu from "./AdminNavMenu";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

interface Props {
  open: boolean;
  setOpen: (value: boolean) => void;
  menuRef: React.RefObject<HTMLDivElement | null>;
  items: AdminNavItem[];
}

export default function AdminMobileNav({ open, setOpen, menuRef, items }: Props) {
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;
    const handle = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!menuRef.current || menuRef.current.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("click", handle);
    return () => document.removeEventListener("click", handle);
  }, [open, setOpen, menuRef]);

  useEffect(() => {
    if (open) {
      setOpen(false);
    }
    // Bỏ qua warning exhaustive-deps
  }, [pathname]);

  return (
    <div
      ref={menuRef}
      aria-label={open ? "Đóng menu" : "Mở menu"}
      className={cn(
        "lg:hidden overflow-hidden transition-all duration-300 ease-out border-t border-zinc-200 bg-white",
        open ? "max-h-[32rem] opacity-100" : "max-h-0 opacity-0 pointer-events-none"
      )}
    >
      <div className="px-4 py-4">
        <AdminNavMenu items={items} />
      </div>
    </div>
  );
}

