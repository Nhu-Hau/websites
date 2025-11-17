"use client";

import React from "react";
import Link from "next/link";
import Swal from "sweetalert2";
import {
  adminListPromoCodes,
  adminCreatePromoCode,
  adminUpdatePromoCode,
  adminDeletePromoCode,
  AdminPromoCode,
} from "@/lib/apiClient";

export default function PromosPage() {
  const [me, setMe] = React.useState<{ id: string; role?: string } | null>(null);
  const [loadingMe, setLoadingMe] = React.useState(true);
  const [items, setItems] = React.useState<AdminPromoCode[]>([]);
  const [page, setPage] = React.useState(1);
  const [limit] = React.useState(20);
  const [total, setTotal] = React.useState(0);
  const [q, setQ] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [editModal, setEditModal] = React.useState<AdminPromoCode | null>(null);
  const [createModal, setCreateModal] = React.useState(false);

  const pages = Math.max(1, Math.ceil(total / limit));

  const load = React.useCallback(async () => {
    setBusy(true);
    try {
      const data = await adminListPromoCodes({ page, limit, q });
      setItems(data.items);
      setTotal(data.total);
    } catch (e: any) {
      Swal.fire({ icon: "error", title: "Lỗi", text: e?.message || "Không thể tải danh sách mã khuyến mãi" });
    } finally {
      setBusy(false);
    }
  }, [page, limit, q]);

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

  React.useEffect(() => {
    if (me?.role === "admin") void load();
  }, [me, load]);

  const onDelete = async (item: AdminPromoCode) => {
    const result = await Swal.fire({
      title: "Xóa mã khuyến mãi?",
      text: `Xóa mã ${item.code}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#ef4444",
    });
    if (!result.isConfirmed) return;
    try {
      await adminDeletePromoCode(item.code);
      await Swal.fire({ icon: "success", title: "Đã xóa", timer: 2000 });
      void load();
    } catch (e: any) {
      Swal.fire({ icon: "error", title: "Lỗi", text: e?.message || "Không thể xóa mã khuyến mãi" });
    }
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      return d.toLocaleString("vi-VN");
    } catch {
      return dateStr;
    }
  };

  const isExpired = (item: AdminPromoCode) => {
    if (!item.activeTo) return false;
    try {
      const to = new Date(item.activeTo).getTime();
      return Date.now() > to;
    } catch {
      return false;
    }
  };

  const isActive = (item: AdminPromoCode) => {
    const now = Date.now();
    try {
      if (item.activeFrom) {
        const from = new Date(item.activeFrom).getTime();
        if (now < from) return false;
      }
      if (item.activeTo) {
        const to = new Date(item.activeTo).getTime();
        if (now > to) return false;
      }
      if (item.maxUses && item.usedCount >= item.maxUses) return false;
      return true;
    } catch {
      return true;
    }
  };

  if (loadingMe) return <div className="p-6">Đang kiểm tra quyền…</div>;
  if (!me || me.role !== "admin")
    return <div className="p-6 text-red-600">Chỉ dành cho Admin</div>;

  return (
    <div className="p-6 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Quản lý mã khuyến mãi</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCreateModal(true)}
            className="px-4 py-1.5 rounded border bg-tealCustom text-black hover:opacity-90"
          >
            + Tạo mã mới
          </button>
          <Link className="px-3 py-1.5 rounded border" href="/">
            Trang chủ
          </Link>
        </div>
      </header>

      <div className="flex flex-wrap gap-2 items-end">
        <div className="flex flex-col">
          <label className="text-sm text-zinc-600">Tìm kiếm</label>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Mã khuyến mãi"
            className="border px-3 py-2 rounded"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setPage(1);
                void load();
              }
            }}
          />
        </div>
        <button
          onClick={() => {
            setPage(1);
            void load();
          }}
          disabled={busy}
          className="px-4 py-2 rounded bg-zinc-900 text-white disabled:opacity-60"
        >
          Tìm
        </button>
      </div>

      <div className="overflow-auto rounded border">
        <table className="min-w-[1000px] w-full text-sm">
          <thead className="bg-zinc-50">
            <tr className="text-left">
              <th className="p-3">Mã</th>
              <th className="p-3">Loại</th>
              <th className="p-3">Giá trị</th>
              <th className="p-3">Giá sau giảm</th>
              <th className="p-3">Từ ngày</th>
              <th className="p-3">Đến ngày</th>
              <th className="p-3">Đã dùng</th>
              <th className="p-3">Trạng thái</th>
              <th className="p-3 w-32">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item._id} className="border-t">
                <td className="p-3 font-mono font-semibold">{item.code}</td>
                <td className="p-3">
                  {item.type === "fixed" ? "Cố định" : item.type === "percent" ? "%" : "—"}
                </td>
                <td className="p-3">
                  {item.value !== null && item.value !== undefined
                    ? item.type === "percent"
                      ? `${item.value}%`
                      : `${item.value.toLocaleString("vi-VN")} đ`
                    : "—"}
                </td>
                <td className="p-3">
                  {item.amountAfter !== null && item.amountAfter !== undefined
                    ? `${item.amountAfter.toLocaleString("vi-VN")} đ`
                    : "—"}
                </td>
                <td className="p-3 text-xs">{formatDate(item.activeFrom)}</td>
                <td className="p-3 text-xs">{formatDate(item.activeTo)}</td>
                <td className="p-3">
                  {item.usedCount} {item.maxUses ? `/ ${item.maxUses}` : ""}
                </td>
                <td className="p-3">
                  {isExpired(item) ? (
                    <span className="px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs">Hết hạn</span>
                  ) : isActive(item) ? (
                    <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs">Đang hoạt động</span>
                  ) : (
                    <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs">Chưa hoạt động</span>
                  )}
                </td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditModal(item)}
                      className="px-2 py-1 text-xs rounded border hover:bg-zinc-50"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => onDelete(item)}
                      className="px-2 py-1 text-xs rounded border text-red-600 hover:bg-red-50"
                    >
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td className="p-6 text-center text-zinc-500" colSpan={9}>
                  Không có dữ liệu
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-zinc-600">Tổng: {total}</div>
        <div className="flex items-center gap-2">
          <button
            disabled={page <= 1 || busy}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1 rounded border disabled:opacity-60"
          >
            Trước
          </button>
          <span className="text-sm">
            {page} / {pages}
          </span>
          <button
            disabled={page >= pages || busy}
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            className="px-3 py-1 rounded border disabled:opacity-60"
          >
            Sau
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      {editModal && (
        <EditPromoModal
          item={editModal}
          onClose={() => setEditModal(null)}
          onSave={async (data) => {
            try {
              await adminUpdatePromoCode(editModal.code, data);
              await Swal.fire({ icon: "success", title: "Đã cập nhật", timer: 2000 });
              setEditModal(null);
              void load();
            } catch (e: any) {
              Swal.fire({ icon: "error", title: "Lỗi", text: e?.message || "Không thể cập nhật mã khuyến mãi" });
            }
          }}
        />
      )}

      {/* Create Modal */}
      {createModal && (
        <EditPromoModal
          onClose={() => setCreateModal(false)}
          onSave={async (data) => {
            try {
              await adminCreatePromoCode(data);
              await Swal.fire({ icon: "success", title: "Đã tạo", timer: 2000 });
              setCreateModal(false);
              void load();
            } catch (e: any) {
              Swal.fire({ icon: "error", title: "Lỗi", text: e?.message || "Không thể tạo mã khuyến mãi" });
            }
          }}
        />
      )}
    </div>
  );
}

function EditPromoModal({
  item,
  onClose,
  onSave,
}: {
  item?: AdminPromoCode;
  onClose: () => void;
  onSave: (data: Partial<AdminPromoCode>) => Promise<void>;
}) {
  const [busy, setBusy] = React.useState(false);
  const [form, setForm] = React.useState({
    code: item?.code || "",
    type: item?.type || "",
    value: item?.value?.toString() || "",
    amountAfter: item?.amountAfter?.toString() || "",
    baseAmount: item?.baseAmount?.toString() || "",
    activeFrom: item?.activeFrom ? new Date(item.activeFrom).toISOString().slice(0, 16) : "",
    activeTo: item?.activeTo ? new Date(item.activeTo).toISOString().slice(0, 16) : "",
    maxUses: item?.maxUses?.toString() || "",
    perUserLimit: item?.perUserLimit?.toString() || "",
    usedCount: item?.usedCount?.toString() || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const data: any = {};
      if (!item && form.code) data.code = form.code.trim().toUpperCase();
      if (form.type) data.type = form.type || null;
      if (form.value) data.value = parseFloat(form.value) || null;
      if (form.amountAfter) data.amountAfter = parseFloat(form.amountAfter) || null;
      if (form.baseAmount) data.baseAmount = parseFloat(form.baseAmount) || null;
      if (form.activeFrom) data.activeFrom = new Date(form.activeFrom).toISOString();
      else data.activeFrom = null;
      if (form.activeTo) data.activeTo = new Date(form.activeTo).toISOString();
      else data.activeTo = null;
      if (form.maxUses) data.maxUses = parseInt(form.maxUses) || null;
      if (form.perUserLimit) data.perUserLimit = parseInt(form.perUserLimit) || null;
      if (item && form.usedCount) data.usedCount = parseInt(form.usedCount) || 0;

      await onSave(data);
    } catch (e: any) {
      // error handled in parent
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">{item ? "Sửa mã khuyến mãi" : "Tạo mã khuyến mãi mới"}</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {!item && (
            <div>
              <label className="block text-sm font-medium mb-1">Mã *</label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                className="w-full border px-3 py-2 rounded"
                required
                placeholder="TOEIC99K"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Loại giảm giá</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full border px-3 py-2 rounded"
            >
              <option value="">Không</option>
              <option value="fixed">Cố định (đ)</option>
              <option value="percent">Phần trăm (%)</option>
            </select>
          </div>
          {form.type && (
            <div>
              <label className="block text-sm font-medium mb-1">Giá trị giảm</label>
              <input
                type="number"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                className="w-full border px-3 py-2 rounded"
                placeholder={form.type === "percent" ? "10" : "10000"}
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Giá sau giảm (đ)</label>
            <input
              type="number"
              value={form.amountAfter}
              onChange={(e) => setForm({ ...form, amountAfter: e.target.value })}
              className="w-full border px-3 py-2 rounded"
              placeholder="99000"
            />
            <p className="text-xs text-zinc-500 mt-1">Nếu set, sẽ dùng giá này làm giá cuối cùng</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Giá gốc (đ)</label>
            <input
              type="number"
              value={form.baseAmount}
              onChange={(e) => setForm({ ...form, baseAmount: e.target.value })}
              className="w-full border px-3 py-2 rounded"
              placeholder="199000"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Từ ngày</label>
              <input
                type="datetime-local"
                value={form.activeFrom}
                onChange={(e) => setForm({ ...form, activeFrom: e.target.value })}
                className="w-full border px-3 py-2 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Đến ngày</label>
              <input
                type="datetime-local"
                value={form.activeTo}
                onChange={(e) => setForm({ ...form, activeTo: e.target.value })}
                className="w-full border px-3 py-2 rounded"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Lượt dùng tối đa</label>
              <input
                type="number"
                value={form.maxUses}
                onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                className="w-full border px-3 py-2 rounded"
                placeholder="100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Lượt dùng mỗi user</label>
              <input
                type="number"
                value={form.perUserLimit}
                onChange={(e) => setForm({ ...form, perUserLimit: e.target.value })}
                className="w-full border px-3 py-2 rounded"
                placeholder="1"
              />
            </div>
          </div>
          {item && (
            <div>
              <label className="block text-sm font-medium mb-1">Đã dùng</label>
              <input
                type="number"
                value={form.usedCount}
                onChange={(e) => setForm({ ...form, usedCount: e.target.value })}
                className="w-full border px-3 py-2 rounded"
                min={0}
              />
            </div>
          )}
          <div className="flex gap-2 justify-end pt-4 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded border" disabled={busy}>
              Hủy
            </button>
            <button type="submit" className="px-4 py-2 rounded border" disabled={busy}>
              {busy ? "Đang lưu..." : "Lưu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

