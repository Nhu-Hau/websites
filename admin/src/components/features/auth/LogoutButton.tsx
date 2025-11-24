"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

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
      className="px-3 py-1.5 text-sm rounded-full border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-60"
    >
      {busy ? "Đang đăng xuất…" : "Đăng xuất"}
    </button>
  );
}

