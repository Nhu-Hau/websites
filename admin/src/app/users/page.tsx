"use client";

import React from "react";
import Link from "next/link";
import { adminListUsers, adminUpdateUser, adminDeleteUser, AdminUser } from "@/lib/apiClient";
import { Users, Search, Filter, Trash2, Shield, Crown, Home, AlertTriangle, Eye, Calendar } from "lucide-react";
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
  const [sortBy, setSortBy] = React.useState<"email" | "createdAt">("email");
  const [busy, setBusy] = React.useState(false);
  const [confirmDialog, setConfirmDialog] = React.useState<ConfirmDialogState | null>(null);
  const [confirmLoading, setConfirmLoading] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<AdminUser | null>(null);
  const [editedUser, setEditedUser] = React.useState<Partial<AdminUser> & { premiumType?: 'free' | 'lifetime' | 'monthly' }>({});
  const [saveLoading, setSaveLoading] = React.useState(false);
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
      const order = sortBy === "email" ? "asc" : "desc";
      const data = await adminListUsers({ page, limit, q, role, access, sortBy, order });
      setItems(data.items);
      setTotal(data.total);
    } finally {
      setBusy(false);
    }
  }, [page, limit, q, role, access, sortBy]);

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

  const openUserDetails = (u: AdminUser) => {
    setSelectedUser(u);
    const isPremium = u.access === 'premium';
    const isLifetime = isPremium && !u.premiumExpiryDate;

    setEditedUser({
      name: u.name,
      email: u.email,
      role: u.role,
      access: u.access,
      premiumExpiryDate: u.premiumExpiryDate,
      premiumType: !isPremium ? 'free' : isLifetime ? 'lifetime' : 'monthly',
    });
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;
    setSaveLoading(true);
    try {
      await adminUpdateUser(selectedUser._id, editedUser);
      toast.success("Cập nhật thành công");
      setSelectedUser(null);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Lỗi khi cập nhật");
    } finally {
      setSaveLoading(false);
    }
  };

  if (loadingMe) return <div className="p-6">Đang kiểm tra quyền…</div>;
  if (!me || me.role !== 'admin') return <div className="p-6 text-red-600">Chỉ dành cho Admin</div>;

  return (
    <div className="bg-gradient-to-br from-zinc-50 to-zinc-100 p-4 space-y-4">
      <header className="bg-white rounded-lg shadow-md p-4 border border-zinc-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-teal-500 to-blue-600 rounded-lg p-2 shadow-md">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-zinc-900">Quản lý người dùng</h1>
              <p className="text-xs text-zinc-600 mt-0.5">Quản lý tất cả người dùng trong hệ thống</p>
            </div>
          </div>
          <nav className="flex items-center gap-2">
            <Link
              className="px-3 py-1.5 rounded-lg border border-zinc-300 hover:bg-zinc-50 transition-colors flex items-center gap-1.5 text-xs font-medium"
              href="/users"
            >
              <Users className="h-3.5 w-3.5" /> Users
            </Link>
            <Link
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-teal-500 to-blue-600 text-white hover:from-teal-600 hover:to-blue-700 transition-all shadow-md flex items-center gap-1.5 text-xs font-medium"
              href="/"
            >
              <Home className="h-3.5 w-3.5" /> Trang chủ
            </Link>
          </nav>
        </div>
      </header>

      <div className="bg-white rounded-lg shadow-md p-4 border border-zinc-200">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col flex-1 min-w-[180px]">
            <label className="text-xs font-medium text-zinc-700 mb-1.5 flex items-center gap-1.5">
              <Search className="h-3.5 w-3.5" /> Tìm kiếm
            </label>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tên hoặc email"
              className="border border-zinc-300 px-3 py-1.5 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
            />
          </div>
          <div className="flex flex-col min-w-[120px]">
            <label className="text-xs font-medium text-zinc-700 mb-1.5 flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" /> Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="border border-zinc-300 px-3 py-1.5 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
            >
              <option value="">Tất cả</option>
              <option value="user">User</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex flex-col min-w-[120px]">
            <label className="text-xs font-medium text-zinc-700 mb-1.5 flex items-center gap-1.5">
              <Crown className="h-3.5 w-3.5" /> Gói
            </label>
            <select
              value={access}
              onChange={(e) => setAccess(e.target.value)}
              className="border border-zinc-300 px-3 py-1.5 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
            >
              <option value="">Tất cả</option>
              <option value="free">Free</option>
              <option value="premium">Premium</option>
            </select>
          </div>
          <div className="flex flex-col min-w-[150px]">
            <label className="text-xs font-medium text-zinc-700 mb-1.5 flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5" /> Sắp xếp
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="border border-zinc-300 px-3 py-1.5 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
            >
              <option value="email">Email (A-Z)</option>
              <option value="createdAt">Ngày tạo (Mới nhất)</option>
            </select>
          </div>
          <button
            onClick={() => { setPage(1); void load(); }}
            disabled={busy}
            className="px-4 py-1.5 text-sm rounded-lg bg-gradient-to-r from-teal-500 to-blue-600 text-white hover:from-teal-600 hover:to-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-md flex items-center gap-1.5 font-medium"
          >
            <Filter className="h-3.5 w-3.5" /> Lọc
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md border border-zinc-200 overflow-hidden">
        <div className="overflow-auto">
          <table className="min-w-[800px] w-full">
            <thead className="bg-gradient-to-r from-zinc-100 to-zinc-50 border-b border-zinc-200">
              <tr className="text-left">
                <th className="px-3 py-2 text-xs font-semibold text-zinc-700">Email</th>
                <th className="px-3 py-2 text-xs font-semibold text-zinc-700">Tên</th>
                <th className="px-3 py-2 text-xs font-semibold text-zinc-700">Role</th>
                <th className="px-3 py-2 text-xs font-semibold text-zinc-700">Gói</th>
                <th className="px-3 py-2 text-xs font-semibold text-zinc-700">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {items.map((u) => (
                <tr key={u._id} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
                  <td className="px-3 py-2 font-mono text-xs text-zinc-700">{u.email}</td>
                  <td className="px-3 py-2 text-sm font-medium text-zinc-900">{u.name}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleClassByRole[u.role]}`}>
                      {roleLabelByRole[u.role]}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.access === 'premium'
                      ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                      : 'bg-gray-100 text-gray-700 border border-gray-200'
                      }`}>
                      {u.access}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1.5 flex-wrap">
                      <button
                        onClick={() => openUserDetails(u)}
                        className="px-2 py-1 text-xs rounded border border-teal-300 text-teal-600 hover:bg-teal-50 transition-colors font-medium flex items-center gap-1"
                      >
                        <Eye className="h-3 w-3" /> Chi tiết
                      </button>
                      <button
                        onClick={() => onDelete(u)}
                        className="px-2 py-1 text-xs rounded border border-red-300 text-red-600 hover:bg-red-50 transition-colors font-medium flex items-center gap-1"
                      >
                        <Trash2 className="h-3 w-3" /> Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td className="p-8 text-center text-zinc-500" colSpan={5}>
                    <div className="flex flex-col items-center gap-2">
                      <Users className="h-10 w-10 text-zinc-300" />
                      <p className="text-sm font-medium">Không có dữ liệu</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-3 border border-zinc-200 flex items-center justify-between">
        <div className="text-xs font-medium text-zinc-700">
          Tổng: <span className="font-bold text-teal-600">{total}</span> người dùng
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled={page <= 1 || busy}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="px-3 py-1.5 text-xs rounded-lg border border-zinc-300 hover:bg-zinc-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Trước
          </button>
          <span className="text-xs font-medium text-zinc-700 px-3 py-1.5 bg-zinc-100 rounded-lg">
            {page} / {pages}
          </span>
          <button
            disabled={page >= pages || busy}
            onClick={() => setPage(p => Math.min(pages, p + 1))}
            className="px-3 py-1.5 text-xs rounded-lg border border-zinc-300 hover:bg-zinc-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Sau
          </button>
        </div>
      </div>
      {selectedUser && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
          style={{ animation: "fadeIn 0.2s ease-out" }}
          onClick={() => {
            if (!saveLoading) {
              setSelectedUser(null);
            }
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            style={{ animation: "slideUp 0.3s ease-out" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-gradient-to-r from-teal-500 to-blue-600 p-6 text-white rounded-t-2xl">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <Eye className="h-6 w-6" />
                Chi tiết người dùng
              </h2>
            </div>

            <div className="p-6 space-y-6">
              {/* User ID */}
              <div className="bg-zinc-50 rounded-lg p-4 border border-zinc-200">
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1">
                  User ID
                </label>
                <p className="text-sm font-mono text-zinc-700 break-all">{selectedUser._id}</p>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={editedUser.email || ""}
                  onChange={(e) => setEditedUser({ ...editedUser, email: e.target.value })}
                  className="w-full border border-zinc-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  placeholder="email@example.com"
                />
              </div>

              {/* Tên */}
              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-2">
                  Tên người dùng <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editedUser.name || ""}
                  onChange={(e) => setEditedUser({ ...editedUser, name: e.target.value })}
                  className="w-full border border-zinc-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  placeholder="Nhập tên"
                />
              </div>

              {/* Quyền */}
              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-2">
                  Quyền <span className="text-red-500">*</span>
                </label>
                <select
                  value={editedUser.role || "user"}
                  onChange={(e) => setEditedUser({ ...editedUser, role: e.target.value as AdminUser["role"] })}
                  className="w-full border border-zinc-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                >
                  <option value="user">User</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {/* Gói đăng ký */}
              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-2">
                  Gói đăng ký <span className="text-red-500">*</span>
                </label>
                <select
                  value={editedUser.premiumType || "free"}
                  onChange={(e) => {
                    const type = e.target.value as 'free' | 'lifetime' | 'monthly';
                    let newAccess: "free" | "premium" = "free";
                    let newExpiry: string | null = null;

                    if (type === 'free') {
                      newAccess = "free";
                      newExpiry = null;
                    } else if (type === 'lifetime') {
                      newAccess = "premium";
                      newExpiry = null;
                    } else if (type === 'monthly') {
                      newAccess = "premium";
                      // Default to 1 month from now if not set
                      const d = new Date();
                      d.setMonth(d.getMonth() + 1);
                      newExpiry = d.toISOString();
                    }

                    setEditedUser({
                      ...editedUser,
                      premiumType: type,
                      access: newAccess,
                      premiumExpiryDate: newExpiry
                    });
                  }}
                  className="w-full border border-zinc-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                >
                  <option value="free">Free</option>
                  <option value="lifetime">Premium Vĩnh Viễn</option>
                  <option value="monthly">Premium theo tháng</option>
                </select>
              </div>

              {/* Ngày hết hạn (chỉ hiện khi chọn Premium theo tháng) */}
              {editedUser.premiumType === 'monthly' && (
                <div style={{ animation: "fadeIn 0.2s ease-out" }}>
                  <label className="block text-sm font-semibold text-zinc-700 mb-2">
                    Ngày hết hạn <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                    <input
                      type="datetime-local"
                      value={editedUser.premiumExpiryDate ? new Date(editedUser.premiumExpiryDate).toISOString().slice(0, 16) : ""}
                      onChange={(e) => setEditedUser({ ...editedUser, premiumExpiryDate: e.target.value ? new Date(e.target.value).toISOString() : null })}
                      className="w-full border border-zinc-300 pl-10 pr-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Phần ảnh đại diện */}
              <div className="border-t border-zinc-200 pt-4">
                <h3 className="text-sm font-semibold text-zinc-700 mb-3">Ảnh đại diện</h3>
                <div className="flex items-center gap-4">
                  {selectedUser.picture ? (
                    <img
                      src={selectedUser.picture}
                      alt={selectedUser.name}
                      className="w-20 h-20 rounded-full object-cover border-2 border-zinc-200"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                      {selectedUser.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm text-zinc-700 font-medium">
                      {selectedUser.name}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {selectedUser.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Phần thông tin bổ sung */}
              <div className="border-t border-zinc-200 pt-4">
                <h3 className="text-sm font-semibold text-zinc-700 mb-3">Thông tin bổ sung</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-50 rounded-lg p-3 border border-zinc-200">
                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1">Ngày tạo</p>
                    <p className="text-sm text-zinc-700">
                      {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleString('vi-VN') : 'N/A'}
                    </p>
                  </div>

                  <div className="bg-zinc-50 rounded-lg p-3 border border-zinc-200">
                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1">Đăng nhập cuối</p>
                    <p className="text-sm text-zinc-700">
                      {selectedUser.last_login ? new Date(selectedUser.last_login).toLocaleString('vi-VN') : 'Chưa có'}
                    </p>
                  </div>
                  <div className="bg-zinc-50 rounded-lg p-3 border border-zinc-200">
                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1">Điểm TOEIC</p>
                    <p className="text-sm font-bold text-teal-600">
                      {selectedUser.toeicScore !== undefined ? selectedUser.toeicScore : 'Chưa có'}
                    </p>
                  </div>
                  {selectedUser.access === 'premium' && (
                    <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                      <p className="text-xs font-semibold text-yellow-700 uppercase tracking-wide mb-1">Hết hạn Premium</p>
                      <p className="text-sm font-medium text-yellow-900">
                        {selectedUser.premiumExpiryDate ? new Date(selectedUser.premiumExpiryDate).toLocaleString('vi-VN') : 'Vĩnh viễn'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Các nút hành động */}
              <div className="flex gap-3 pt-4 border-t border-zinc-200">
                <button
                  onClick={() => {
                    if (!saveLoading) {
                      setSelectedUser(null);
                    }
                  }}
                  disabled={saveLoading}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-zinc-300 hover:bg-zinc-50 transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Đóng
                </button>
                <button
                  onClick={handleSaveUser}
                  disabled={saveLoading}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-teal-500 to-blue-600 text-white hover:from-teal-600 hover:to-blue-700 transition-all shadow-md font-medium flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {saveLoading ? (
                    <>
                      <span className="h-4 w-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    "Lưu thay đổi"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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


