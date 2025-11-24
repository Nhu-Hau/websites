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
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20",
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                )}
              >
                <span className="relative z-10 truncate">{item.label}</span>
                {isActive && <span className="relative z-10 ml-2 h-1.5 w-1.5 rounded-full bg-white" />}
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
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20",
                isActive
                  ? "bg-white/10 text-white shadow-sm ring-1 ring-white/10"
                  : "text-zinc-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <span className="relative z-10 truncate">{item.label}</span>
              {isActive && (
                <span className="relative z-10 ml-2 inline-flex h-1.5 w-1.5 rounded-full bg-white group-hover:scale-110 transition-transform" />
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

