"use client";

import Link from "next/link";
import type { SubItemType } from "@/types/navTypes";
import { usePathname } from "next/navigation";

interface DropdownProps {
  items: SubItemType[];
  mobile?: boolean;
}

export default function Dropdown({ items, mobile }: DropdownProps) {
  const pathname = usePathname();

  if (mobile) {
    return (
      <ul className="flex flex-col space-y-1">
        {items.map((it) => {
          const isActive = pathname === it.href;
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                className={`block px-4 py-2.5 text-sm rounded-lg transition-all duration-200 ${
                  isActive
                    ? "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-medium"
                    : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700/50"
                }`}
              >
                {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    );
  }

  // Desktop
  return (
    <ul className="flex flex-col space-y-1">
      {items.map((it) => {
        const isActive = pathname === it.href;
        return (
          <li key={it.href}>
            <Link
              href={it.href}
              className={`block px-4 py-2.5 text-sm rounded-xl transition-all duration-200 group ${
                isActive
                  ? "bg-gradient-to-r from-zinc-100 to-zinc-100 dark:from-zinc-900/30 dark:to-zinc-800/20 text-amber-700 dark:text-amber-300 font-bold shadow-sm"
                  : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700/50 hover:text-amber-600 dark:hover:text-amber-400"
              }`}
            >
              <span className="flex items-center justify-between">
                {it.label}
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                )}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}