"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

export default function LogoutButton() {
  const router = useRouter();
  const pathname = usePathname();
  const [busy, setBusy] = React.useState(false);


  if (pathname === "/login") {
    return (
      <Link
        href="/login"
        className="px-4 py-1.5 text-sm font-medium rounded-full bg-white text-black hover:bg-zinc-200 transition-colors"
      >
        Đăng nhập
      </Link>
    );
  }

  const handleLogout = async () => {
    setBusy(true);
    try {
      await fetch("/api/admin-auth/logout", { method: "POST", credentials: "include" });
      router.replace("/login");
    } catch (e) {
      console.error("Logout failed:", e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={busy}
      className="px-4 py-1.5 text-sm font-medium rounded-full border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-60"
    >
      {busy ? "Đang đăng xuất…" : "Đăng xuất"}
    </button>
  );
}

