"use client";

import React from "react";
import Link from "next/link";
import { adminListUsers, adminUpdateUser, adminDeleteUser, AdminUser } from "@/lib/apiClient";
import { Users, Search, Filter, Trash2, Shield, Crown, Home, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/common/ToastProvider";

type ConfirmDialogState = {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => Promise<void>;
  successMessage?: string;
  errorMessage?: string;
};

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
  const [confirmDialog, setConfirmDialog] = React.useState<ConfirmDialogState | null>(null);
  const [confirmLoading, setConfirmLoading] = React.useState(false);
  const toast = useToast();

  const pages = Math.max(1, Math.ceil(total / limit));

  const roleClassByRole: Record<AdminUser["role"], string> = {
    user: "bg-blue-100 text-blue-700 border border-blue-200",
    teacher: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    admin: "bg-purple-100 text-purple-700 border border-purple-200",
  };

  const roleLabelByRole: Record<AdminUser["role"], string> = {
    user: "User",
    teacher: "Teacher",
    admin: "Admin",
  };

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
    const roleOrder: Array<AdminUser["role"]> = ["user", "teacher", "admin"];
    const currentIndex = roleOrder.indexOf(u.role);
    const nextRole = roleOrder[currentIndex >= 0 ? (currentIndex + 1) % roleOrder.length : 0];
    await adminUpdateUser(u._id, { role: nextRole });
    void load();
  };

  const onToggleAccess = async (u: AdminUser) => {
    const newAccess = u.access === "premium" ? "free" : "premium";
    await adminUpdateUser(u._id, { access: newAccess });
    void load();
  };

  const handleConfirmAction = async () => {
    if (!confirmDialog) return;
    setConfirmLoading(true);
    try {
      await confirmDialog.onConfirm();
      if (confirmDialog.successMessage) {
        toast.success(confirmDialog.successMessage);
      }
      setConfirmDialog(null);
    } catch (error) {
      const fallbackMessage =
        confirmDialog.errorMessage ||
        (error instanceof Error && error.message) ||
        "Đã xảy ra lỗi";
      toast.error(fallbackMessage);
    } finally {
      setConfirmLoading(false);
    }
  };

  const onDelete = (u: AdminUser) => {
    setConfirmDialog({
      title: "Xóa người dùng",
      description: `Bạn có chắc muốn xóa ${u.email}? Hành động này không thể hoàn tác.`,
      confirmText: "Xóa người dùng",
      cancelText: "Hủy",
      successMessage: "Đã xóa người dùng thành công",
      errorMessage: "Lỗi khi xóa người dùng",
      onConfirm: async () => {
        await adminDeleteUser(u._id);
        await load();
      },
    });
  };

  if (loadingMe) return <div className="p-6">Đang kiểm tra quyền…</div>;
  if (!me || me.role !== 'admin') return <div className="p-6 text-red-600">Chỉ dành cho Admin</div>;

  return (
    <div className="bg-gradient-to-br from-zinc-50 to-zinc-100 p-6 space-y-6">
      <header className="bg-white rounded-xl shadow-lg p-6 border border-zinc-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-teal-500 to-blue-600 rounded-xl p-3 shadow-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-zinc-900">Quản lý người dùng</h1>
              <p className="text-sm text-zinc-600 mt-1">Quản lý tất cả người dùng trong hệ thống</p>
            </div>
          </div>
          <nav className="flex items-center gap-2">
            <Link 
              className="px-4 py-2 rounded-lg border border-zinc-300 hover:bg-zinc-50 transition-colors flex items-center gap-2 text-sm font-medium" 
              href="/users"
            >
              <Users className="h-4 w-4" /> Users
            </Link>
            <Link 
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-teal-500 to-blue-600 text-white hover:from-teal-600 hover:to-blue-700 transition-all shadow-md flex items-center gap-2 text-sm font-medium" 
              href="/"
            >
              <Home className="h-4 w-4" /> Trang chủ
            </Link>
          </nav>
        </div>
      </header>

      <div className="bg-white rounded-xl shadow-lg p-6 border border-zinc-200">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex flex-col flex-1 min-w-[200px]">
            <label className="text-sm font-medium text-zinc-700 mb-2 flex items-center gap-2">
              <Search className="h-4 w-4" /> Tìm kiếm
            </label>
            <input 
              value={q} 
              onChange={(e)=>setQ(e.target.value)} 
              placeholder="Tên hoặc email" 
              className="border border-zinc-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all" 
            />
          </div>
          <div className="flex flex-col min-w-[150px]">
            <label className="text-sm font-medium text-zinc-700 mb-2 flex items-center gap-2">
              <Shield className="h-4 w-4" /> Role
            </label>
            <select 
              value={role} 
              onChange={(e)=>setRole(e.target.value)} 
              className="border border-zinc-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
            >
              <option value="">Tất cả</option>
              <option value="user">User</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex flex-col min-w-[150px]">
            <label className="text-sm font-medium text-zinc-700 mb-2 flex items-center gap-2">
              <Crown className="h-4 w-4" /> Gói
            </label>
            <select 
              value={access} 
              onChange={(e)=>setAccess(e.target.value)} 
              className="border border-zinc-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
            >
              <option value="">Tất cả</option>
              <option value="free">Free</option>
              <option value="premium">Premium</option>
            </select>
          </div>
          <button 
            onClick={()=>{ setPage(1); void load(); }} 
            disabled={busy} 
            className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-teal-500 to-blue-600 text-white hover:from-teal-600 hover:to-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-md flex items-center gap-2 font-medium"
          >
            <Filter className="h-4 w-4" /> Lọc
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-zinc-200 overflow-hidden">
        <div className="overflow-auto">
          <table className="min-w-[800px] w-full">
            <thead className="bg-gradient-to-r from-zinc-100 to-zinc-50 border-b border-zinc-200">
              <tr className="text-left">
                <th className="p-4 font-semibold text-zinc-700">Email</th>
                <th className="p-4 font-semibold text-zinc-700">Tên</th>
                <th className="p-4 font-semibold text-zinc-700">Role</th>
                <th className="p-4 font-semibold text-zinc-700">Gói</th>
                <th className="p-4 font-semibold text-zinc-700 w-48">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {items.map((u) => (
                <tr key={u._id} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
                  <td className="p-4 font-mono text-sm text-zinc-700">{u.email}</td>
                  <td className="p-4 font-medium text-zinc-900">{u.name}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${roleClassByRole[u.role]}`}>
                      {roleLabelByRole[u.role]}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                      u.access === 'premium' 
                        ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' 
                        : 'bg-gray-100 text-gray-700 border border-gray-200'
                    }`}>
                      {u.access}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button 
                        onClick={()=>onToggleRole(u)} 
                        className="px-3 py-1.5 text-xs rounded-lg border border-zinc-300 hover:bg-zinc-100 transition-colors font-medium flex items-center gap-1"
                      >
                        <Shield className="h-3 w-3" /> Quyền
                      </button>
                      <button 
                        onClick={()=>onToggleAccess(u)} 
                        className="px-3 py-1.5 text-xs rounded-lg border border-zinc-300 hover:bg-zinc-100 transition-colors font-medium flex items-center gap-1"
                      >
                        <Crown className="h-3 w-3" /> Gói
                      </button>
                      <button 
                        onClick={()=>onDelete(u)} 
                        className="px-3 py-1.5 text-xs rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition-colors font-medium flex items-center gap-1"
                      >
                        <Trash2 className="h-3 w-3" /> Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td className="p-12 text-center text-zinc-500" colSpan={5}>
                    <div className="flex flex-col items-center gap-2">
                      <Users className="h-12 w-12 text-zinc-300" />
                      <p className="text-lg font-medium">Không có dữ liệu</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 border border-zinc-200 flex items-center justify-between">
        <div className="text-sm font-medium text-zinc-700">
          Tổng: <span className="font-bold text-teal-600">{total}</span> người dùng
        </div>
        <div className="flex items-center gap-3">
          <button 
            disabled={page<=1 || busy} 
            onClick={()=>setPage(p=>Math.max(1,p-1))} 
            className="px-4 py-2 rounded-lg border border-zinc-300 hover:bg-zinc-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Trước
          </button>
          <span className="text-sm font-medium text-zinc-700 px-4 py-2 bg-zinc-100 rounded-lg">
            {page} / {pages}
          </span>
          <button 
            disabled={page>=pages || busy} 
            onClick={()=>setPage(p=>Math.min(pages,p+1))} 
            className="px-4 py-2 rounded-lg border border-zinc-300 hover:bg-zinc-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Sau
          </button>
        </div>
      </div>
      {confirmDialog && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
          style={{ animation: "fadeIn 0.2s ease-out" }}
          onClick={() => {
            if (!confirmLoading) {
              setConfirmDialog(null);
            }
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-6"
            style={{ animation: "slideUp 0.3s ease-out" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-red-100 text-red-600">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-zinc-900">{confirmDialog.title}</h3>
                <p className="text-sm text-zinc-600 mt-1 leading-relaxed">{confirmDialog.description}</p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  if (!confirmLoading) {
                    setConfirmDialog(null);
                  }
                }}
                disabled={confirmLoading}
                className="flex-1 px-4 py-2.5 rounded-lg border border-zinc-300 hover:bg-zinc-50 transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {confirmDialog.cancelText ?? "Hủy"}
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={confirmLoading}
                className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 transition-all shadow-md font-medium flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {confirmLoading ? (
                  <>
                    <span className="h-4 w-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    {confirmDialog.confirmText ?? "Xác nhận"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


