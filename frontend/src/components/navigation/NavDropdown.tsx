"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SubItemType } from "@/types/nav.types";

interface DropdownProps {
  items: SubItemType[];
  mobile?: boolean;
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function Dropdown({ items, mobile }: DropdownProps) {
  const pathname = usePathname();

  if (mobile) {
    // 🔹 Mobile dropdown: style giống NavItem nhưng block lớn, dễ bấm
    return (
      <ul className="flex flex-col space-y-1">
        {items.map((it) => {
          const isActive = pathname === it.href;
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                className={cn(
                  "group relative flex items-center justify-between rounded-lg px-4 py-2.5 text-sm font-medium",
                  "transition-colors duration-200 ease-out",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950",
                  isActive
                    ? "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-200"
                    : "text-zinc-700 dark:text-zinc-300 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80"
                )}
              >
                {/* Thanh accent dọc bên trái giống underline của NavItem nhưng theo chiều dọc */}
                <span
                  className={cn(
                    "pointer-events-none absolute left-0 top-1.5 bottom-1.5 w-0 rounded-full",
                    "bg-gradient-to-b from-amber-600 to-amber-400",
                    "transition-all duration-300 ease-out",
                    "group-hover:w-0.5",
                    isActive && "w-0.5"
                  )}
                />
                <span className="relative z-10 truncate">{it.label}</span>
                {isActive && (
                  <span className="relative z-10 ml-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    );
  }

  // 🔹 Desktop dropdown: tinh tế, ăn khớp với NavItem trên thanh nav
  return (
    <ul className="flex flex-col space-y-1">
      {items.map((it) => {
        const isActive = pathname === it.href;
        return (
          <li key={it.href}>
            <Link
              href={it.href}
              className={cn(
                "group relative flex items-center justify-between rounded-xl px-4 py-2.5 text-sm font-medium",
                "transition-colors duration-200 ease-out",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950",
                isActive
                  ? "bg-zinc-100 text-amber-700 shadow-sm ring-1 ring-amber-100 dark:bg-zinc-900/40 dark:text-amber-200 dark:ring-amber-500/30"
                  : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100/90 dark:hover:bg-zinc-800/80 hover:text-amber-700 dark:hover:text-amber-300"
              )}
            >
              {/* Thanh dọc bên trái – phiên bản “underline” của NavItem cho menu con */}
              <span
                className={cn(
                  "pointer-events-none absolute left-0 top-1.5 bottom-1.5 w-0 rounded-full",
                  "bg-gradient-to-b from-amber-600 to-amber-400",
                  "transition-all duration-300 ease-out",
                  "group-hover:w-0.5",
                  isActive && "w-0.5"
                )}
              />
              <span className="relative z-10 truncate">{it.label}</span>
              {isActive && (
                <span className="relative z-10 ml-2 inline-flex h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500 group-hover:scale-110 transition-transform duration-150" />
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}