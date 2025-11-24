"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import LogoutButton from "@/components/features/auth/LogoutButton";
import AdminNavMenu from "./AdminNavMenu";
import AdminMobileNav from "./AdminMobileNav";
import { adminNavItems } from "@/lib/navigation/adminNav";

export default function AdminHeader() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  return (
    <header className="sticky top-0 z-40 bg-black border-b border-white/10">
      <div className="w-full px-6 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 shrink-0">
          <button
            className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
            onClick={() => setOpen((prev) => !prev)}
            aria-label="Toggle navigation"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <Link href="/" className="font-semibold text-lg text-white tracking-tight">
            Admin Control
          </Link>
        </div>

        <div className="hidden lg:flex flex-1 justify-center">
          <AdminNavMenu items={adminNavItems} />
        </div>

        <div className="flex items-center gap-3 text-sm font-medium">
          <LogoutButton />
        </div>
      </div>

      <AdminMobileNav open={open} setOpen={setOpen} menuRef={menuRef} items={adminNavItems} />
    </header>
  );
}

