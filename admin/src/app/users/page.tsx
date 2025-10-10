"use client";

import React from "react";
import { adminListUsers, adminUpdateUser, adminDeleteUser, AdminUser } from "@/lib/apiClient";

export default function UsersPage() {
  const [me, setMe] = React.useState<{ id: string; role?: string } | null>(null);
  const [loadingMe, setLoadingMe] = React.useState(true);
  const [items, setItems] = React.useState<AdminUser[]>([]);
  const [page, setPage] = React.useState(1);
  const [limit] = React.useState(20);
  const [total, setTotal] = React.useState(0);
  const [q, setQ] = React.useState("");
  const [role, setRole] = React.useState("");
  const [access, setAccess] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const pages = Math.max(1, Math.ceil(total / limit));

  const load = React.useCallback(async () => {
    setBusy(true);
    try {
      const data = await adminListUsers({ page, limit, q, role, access });
      setItems(data.items);
      setTotal(data.total);
    } finally {
      setBusy(false);
    }
  }, [page, limit, q, role, access]);

  React.useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/admin-auth/me", { credentials: "include", cache: "no-store" });
        if (r.ok) {
          const j = await r.json();
          setMe({ id: j?.id, role: j?.role });
        } else {
          setMe(null);
        }
      } finally {
        setLoadingMe(false);
      }
    })();
  }, []);

  React.useEffect(() => { if (me?.role === 'admin') void load(); }, [me, load]);

  const onToggleRole = async (u: AdminUser) => {
    const newRole = u.role === "admin" ? "user" : "admin";
    await adminUpdateUser(u._id, { role: newRole });
    void load();
  };

  const onToggleAccess = async (u: AdminUser) => {
    const newAccess = u.access === "premium" ? "free" : "premium";
    await adminUpdateUser(u._id, { access: newAccess });
    void load();
  };

  const onDelete = async (u: AdminUser) => {
    if (!confirm(`Xóa người dùng ${u.email}?`)) return;
    await adminDeleteUser(u._id);
    void load();
  };

  if (loadingMe) return <div className="p-6">Đang kiểm tra quyền…</div>;
  if (!me || me.role !== 'admin') return <div className="p-6 text-red-600">Chỉ dành cho Admin</div>;

  return (
    <div className="p-6 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Quản lý người dùng</h1>
        <nav className="flex items-center gap-2 text-sm">
          <a className="px-3 py-1.5 rounded border" href="/users">Users</a>
          <a className="px-3 py-1.5 rounded border" href="/">Trang chủ</a>
        </nav>
      </header>

      <div className="flex flex-wrap gap-2 items-end">
        <div className="flex flex-col">
          <label className="text-sm text-zinc-600">Tìm kiếm</label>
          <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Tên hoặc email" className="border px-3 py-2 rounded" />
        </div>
        <div className="flex flex-col">
          <label className="text-sm text-zinc-600">Role</label>
          <select value={role} onChange={(e)=>setRole(e.target.value)} className="border px-3 py-2 rounded">
            <option value="">Tất cả</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-sm text-zinc-600">Gói</label>
          <select value={access} onChange={(e)=>setAccess(e.target.value)} className="border px-3 py-2 rounded">
            <option value="">Tất cả</option>
            <option value="free">Free</option>
            <option value="premium">Premium</option>
          </select>
        </div>
        <button onClick={()=>{ setPage(1); void load(); }} disabled={busy} className="px-4 py-2 rounded bg-zinc-900 text-white disabled:opacity-60">Lọc</button>
      </div>

      <div className="overflow-auto rounded border">
        <table className="min-w-[800px] w-full text-sm">
          <thead className="bg-zinc-50">
            <tr className="text-left">
              <th className="p-3">Email</th>
              <th className="p-3">Tên</th>
              <th className="p-3">Role</th>
              <th className="p-3">Gói</th>
              <th className="p-3">Level</th>
              <th className="p-3 w-40">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {items.map((u) => (
              <tr key={u._id} className="border-t">
                <td className="p-3 font-mono">{u.email}</td>
                <td className="p-3">{u.name}</td>
                <td className="p-3"><span className="px-2 py-1 rounded-full border text-xs">{u.role}</span></td>
                <td className="p-3"><span className="px-2 py-1 rounded-full border text-xs">{u.access}</span></td>
                <td className="p-3">{u.level}</td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button onClick={()=>onToggleRole(u)} className="px-2 py-1 text-xs rounded border">Chuyển quyền</button>
                    <button onClick={()=>onToggleAccess(u)} className="px-2 py-1 text-xs rounded border">Chuyển gói</button>
                    <button onClick={()=>onDelete(u)} className="px-2 py-1 text-xs rounded border text-red-600">Xóa</button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td className="p-6 text-center text-zinc-500" colSpan={6}>Không có dữ liệu</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-zinc-600">Tổng: {total}</div>
        <div className="flex items-center gap-2">
          <button disabled={page<=1 || busy} onClick={()=>setPage(p=>Math.max(1,p-1))} className="px-3 py-1 rounded border disabled:opacity-60">Trước</button>
          <span className="text-sm">{page} / {pages}</span>
          <button disabled={page>=pages || busy} onClick={()=>setPage(p=>Math.min(pages,p+1))} className="px-3 py-1 rounded border disabled:opacity-60">Sau</button>
        </div>
      </div>
    </div>
  );
}


