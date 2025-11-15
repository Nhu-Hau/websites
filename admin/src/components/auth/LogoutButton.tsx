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
      className="px-3 py-1.5 text-sm rounded border hover:bg-zinc-50 disabled:opacity-60"
    >
      {busy ? "Đang đăng xuất…" : "Đăng xuất"}
    </button>
  );
}

