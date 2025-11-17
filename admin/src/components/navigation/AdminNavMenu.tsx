"use client";

import AdminNavItem from "./AdminNavItem";
import type { AdminNavItem as AdminNavItemType } from "@/lib/navigation/adminNav";

interface Props {
  items: AdminNavItemType[];
}

export default function AdminNavMenu({ items }: Props) {
  return (
    <nav className="w-full lg:w-auto h-full">
      <ul className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-6 text-sm font-semibold h-full">
        {items.map((item) => (
          <AdminNavItem key={item.label} item={item} />
        ))}
      </ul>
    </nav>
  );
}

