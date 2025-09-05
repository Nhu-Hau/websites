"use client";

import Link from "next/link";
import type { SubItemType } from "@/app/types/navTypes";

interface DropdownProps {
  items: SubItemType[];
  mobile?: boolean;
}

export default function Dropdown({ items, mobile }: DropdownProps) {
  if (mobile) {
    return (
      <ul className="flex flex-col mt-2">
        {items.map((it) => (
          <li key={it.href}>
            <Link
              href={it.href}
              className="block px-4 py-2 text-sm text-neutral-800 dark:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-800"
            >
              {it.label}
            </Link>
          </li>
        ))}
      </ul>
    );
  }

  // Desktop (hover)
  return (
    <div
      className="invisible opacity-0 translate-y-2 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 transition duration-150 absolute left-0 -mt-3 min-w-36 max-w-72 rounded-2xl bg-white dark:bg-neutral-900 shadow-lg ring-1 ring-black/5 p-2"
      role="menu"
    >
      <ul className="flex flex-col">
        {items.map((it) => (
          <li key={it.href}>
            <Link
              href={it.href}
              role="menuitem"
              className="block rounded-xl px-4 py-2.5 text-md text-neutral-800 dark:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-800 whitespace-nowrap"
            >
              {it.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}