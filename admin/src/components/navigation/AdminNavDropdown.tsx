"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AdminNavChild } from "@/lib/navigation/adminNav";

interface Props {
  items: AdminNavChild[];
  mobile?: boolean;
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function AdminNavDropdown({ items, mobile }: Props) {
  const pathname = usePathname();

  const normalizePath = (href: string) => href.split("?")[0].split("#")[0];

  if (mobile) {
    return (
      <ul className="flex flex-col space-y-1">
        {items.map((item) => {
          const isActive = pathname === normalizePath(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "group relative flex items-center justify-between rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                  isActive
                    ? "bg-amber-50 text-amber-700"
                    : "text-zinc-700 hover:text-amber-700 hover:bg-zinc-100/80"
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none absolute left-0 top-1.5 bottom-1.5 w-0 rounded-full bg-gradient-to-b from-amber-600 to-amber-400 transition-all",
                    isActive && "w-0.5",
                    !isActive && "group-hover:w-0.5"
                  )}
                />
                <span className="relative z-10 truncate">{item.label}</span>
                {isActive && <span className="relative z-10 ml-2 h-1.5 w-1.5 rounded-full bg-amber-500" />}
              </Link>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <ul className="flex flex-col space-y-1">
      {items.map((item) => {
        const isActive = pathname === normalizePath(item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              className={cn(
                "group relative flex items-center justify-between rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                isActive
                  ? "bg-zinc-100 text-amber-700 shadow-sm ring-1 ring-amber-100"
                  : "text-zinc-700 hover:bg-zinc-100/90 hover:text-amber-700"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none absolute left-0 top-1.5 bottom-1.5 w-0 rounded-full bg-gradient-to-b from-amber-600 to-amber-400 transition-all",
                  isActive && "w-0.5",
                  !isActive && "group-hover:w-0.5"
                )}
              />
              <span className="relative z-10 truncate">{item.label}</span>
              {isActive && (
                <span className="relative z-10 ml-2 inline-flex h-1.5 w-1.5 rounded-full bg-amber-500 group-hover:scale-110 transition-transform" />
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

