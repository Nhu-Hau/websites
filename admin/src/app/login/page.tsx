"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string|undefined>(undefined);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(undefined);
    try {
      const res = await fetch("/api/admin-auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const j = await res.json().catch(()=>({}));
      if (!res.ok) {
        setError(j?.message || "Đăng nhập thất bại");
        return;
      }
      router.replace("/users");
    } catch (e: any) {
      setError("Lỗi kết nối máy chủ");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center p-6">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 border rounded p-6 bg-white">
        <h1 className="text-xl font-semibold">Admin Login</h1>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <div className="space-y-1">
          <label className="text-sm text-zinc-600">Email</label>
          <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required className="w-full border rounded px-3 py-2" />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-zinc-600">Mật khẩu</label>
          <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required className="w-full border rounded px-3 py-2" />
        </div>
        <button type="submit" disabled={busy} className="w-full px-4 py-2 rounded bg-zinc-900 text-white disabled:opacity-60">{busy?"Đang đăng nhập…":"Đăng nhập"}</button>
      </form>
    </div>
  );
}


