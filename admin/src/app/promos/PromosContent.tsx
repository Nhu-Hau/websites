import React from "react";
import {
    adminListPromoCodes,
    adminCreatePromoCode,
    adminUpdatePromoCode,
    adminDeletePromoCode,
    AdminPromoCode,
} from "@/lib/apiClient";
import { Ticket, Search, Filter, Trash2, AlertTriangle, Plus, Edit, Calendar, Tag, Percent, DollarSign } from "lucide-react";
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

export default function PromosContent() {
    const [items, setItems] = React.useState<AdminPromoCode[]>([]);
    const [page, setPage] = React.useState(1);
    const [limit] = React.useState(20);
    const [total, setTotal] = React.useState(0);
    const [q, setQ] = React.useState("");
    const [busy, setBusy] = React.useState(false);
    const [editModal, setEditModal] = React.useState<AdminPromoCode | null>(null);
    const [createModal, setCreateModal] = React.useState(false);
    const [confirmDialog, setConfirmDialog] = React.useState<ConfirmDialogState | null>(null);
    const [confirmLoading, setConfirmLoading] = React.useState(false);
    const toast = useToast();

    const pages = Math.max(1, Math.ceil(total / limit));

    const load = React.useCallback(async () => {
        setBusy(true);
        try {
            const data = await adminListPromoCodes({ page, limit, q });
            setItems(data.items);
            setTotal(data.total);
        } catch (e) {
            toast.error("Không thể tải danh sách mã khuyến mãi");
        } finally {
            setBusy(false);
        }
    }, [page, limit, q, toast]);

    React.useEffect(() => {
        void load();
    }, [load]);

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

    const onDelete = (item: AdminPromoCode) => {
        setConfirmDialog({
            title: "Xóa mã khuyến mãi",
            description: `Bạn có chắc muốn xóa mã ${item.code}? Hành động này không thể hoàn tác.`,
            confirmText: "Xóa mã",
            cancelText: "Hủy",
            successMessage: "Đã xóa mã khuyến mãi thành công",
            errorMessage: "Lỗi khi xóa mã khuyến mãi",
            onConfirm: async () => {
                await adminDeletePromoCode(item.code);
                await load();
            },
        });
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

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <button
                    onClick={() => setCreateModal(true)}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-teal-500 to-blue-600 text-white hover:from-teal-600 hover:to-blue-700 transition-all shadow-md flex items-center gap-2 text-sm font-medium"
                >
                    <Plus className="h-4 w-4" /> Tạo mã mới
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-zinc-200">
                <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex flex-col flex-1 min-w-[200px]">
                        <label className="text-sm font-medium text-zinc-700 mb-2 flex items-center gap-2">
                            <Search className="h-4 w-4" /> Tìm kiếm
                        </label>
                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Nhập mã khuyến mãi..."
                            className="border border-zinc-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
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
                        className="px-6 py-2.5 rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-md flex items-center gap-2 font-medium"
                    >
                        <Filter className="h-4 w-4" /> Lọc
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-zinc-200 overflow-hidden">
                <div className="overflow-auto">
                    <table className="min-w-[1000px] w-full">
                        <thead className="bg-gradient-to-r from-zinc-100 to-zinc-50 border-b border-zinc-200">
                            <tr className="text-left">
                                <th className="p-4 font-semibold text-zinc-700">Mã</th>
                                <th className="p-4 font-semibold text-zinc-700">Loại</th>
                                <th className="p-4 font-semibold text-zinc-700">Giá trị</th>
                                <th className="p-4 font-semibold text-zinc-700">Giá sau giảm</th>
                                <th className="p-4 font-semibold text-zinc-700">Thời gian</th>
                                <th className="p-4 font-semibold text-zinc-700">Đã dùng</th>
                                <th className="p-4 font-semibold text-zinc-700">Trạng thái</th>
                                <th className="p-4 font-semibold text-zinc-700 w-32">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr key={item._id} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
                                    <td className="p-4">
                                        <span className="font-mono font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded border border-teal-100">
                                            {item.code}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm text-zinc-700">
                                        {item.type === "fixed" ? "Cố định" : item.type === "percent" ? "Phần trăm" : "—"}
                                    </td>
                                    <td className="p-4 font-medium text-zinc-900">
                                        {item.value !== null && item.value !== undefined
                                            ? item.type === "percent"
                                                ? `${item.value}%`
                                                : `${item.value.toLocaleString("vi-VN")} đ`
                                            : "—"}
                                    </td>
                                    <td className="p-4 text-sm text-zinc-700">
                                        {item.amountAfter !== null && item.amountAfter !== undefined
                                            ? `${item.amountAfter.toLocaleString("vi-VN")} đ`
                                            : "—"}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col text-xs text-zinc-600 gap-1">
                                            <span>Từ: {formatDate(item.activeFrom)}</span>
                                            <span>Đến: {formatDate(item.activeTo)}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm text-zinc-700">
                                        <span className="font-medium">{item.usedCount}</span>
                                        {item.maxUses && <span className="text-zinc-500"> / {item.maxUses}</span>}
                                    </td>
                                    <td className="p-4">
                                        {isExpired(item) ? (
                                            <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 border border-red-200 text-xs font-medium">
                                                Hết hạn
                                            </span>
                                        ) : isActive(item) ? (
                                            <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 border border-green-200 text-xs font-medium">
                                                Đang hoạt động
                                            </span>
                                        ) : (
                                            <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200 text-xs font-medium">
                                                Chưa hoạt động
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setEditModal(item)}
                                                className="p-2 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-teal-600 transition-colors"
                                                title="Sửa"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => onDelete(item)}
                                                className="p-2 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-red-50 hover:text-red-600 transition-colors"
                                                title="Xóa"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {items.length === 0 && (
                                <tr>
                                    <td className="p-12 text-center text-zinc-500" colSpan={8}>
                                        <div className="flex flex-col items-center gap-2">
                                            <Ticket className="h-12 w-12 text-zinc-300" />
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
                    Tổng: <span className="font-bold text-teal-600">{total}</span> mã
                </div>
                <div className="flex items-center gap-3">
                    <button
                        disabled={page <= 1 || busy}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="px-4 py-2 rounded-lg border border-zinc-300 hover:bg-zinc-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                        Trước
                    </button>
                    <span className="text-sm font-medium text-zinc-700 px-4 py-2 bg-zinc-100 rounded-lg">
                        {page} / {pages}
                    </span>
                    <button
                        disabled={page >= pages || busy}
                        onClick={() => setPage((p) => Math.min(pages, p + 1))}
                        className="px-4 py-2 rounded-lg border border-zinc-300 hover:bg-zinc-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors font-medium"
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
                            toast.success("Cập nhật thành công");
                            setEditModal(null);
                            void load();
                        } catch (e) {
                            toast.error(e instanceof Error ? e.message : "Lỗi khi cập nhật");
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
                            if (!data.code) {
                                throw new Error("Mã khuyến mãi là bắt buộc");
                            }
                            await adminCreatePromoCode(data as Partial<AdminPromoCode> & { code: string });
                            toast.success("Tạo mã thành công");
                            setCreateModal(false);
                            void load();
                        } catch (e) {
                            toast.error(e instanceof Error ? e.message : "Lỗi khi tạo mã");
                        }
                    }}
                />
            )}

            {/* Confirm Dialog */}
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
            const data: Partial<AdminPromoCode> = {};
            if (!item) {
                if (!form.code.trim()) {
                    // Toast handled by parent
                    return;
                }
                data.code = form.code.trim().toUpperCase();
            }
            if (form.type) {
                data.type = (form.type === "fixed" || form.type === "percent") ? form.type : null;
            } else {
                data.type = null;
            }
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
        } catch {
            // error handled in parent
        } finally {
            setBusy(false);
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
            style={{ animation: "fadeIn 0.2s ease-out" }}
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                style={{ animation: "slideUp 0.3s ease-out" }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="sticky top-0 bg-gradient-to-r from-teal-500 to-blue-600 p-6 text-white rounded-t-2xl">
                    <h2 className="text-2xl font-bold flex items-center gap-3">
                        {item ? <Edit className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
                        {item ? "Sửa mã khuyến mãi" : "Tạo mã khuyến mãi mới"}
                    </h2>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {!item && (
                        <div>
                            <label className="block text-sm font-semibold text-zinc-700 mb-2">
                                Mã khuyến mãi <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                                <input
                                    type="text"
                                    value={form.code}
                                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                                    className="w-full border border-zinc-300 pl-10 pr-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all font-mono uppercase"
                                    required
                                    placeholder="TOEIC99K"
                                />
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-zinc-700 mb-2">Loại giảm giá</label>
                            <div className="relative">
                                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                                <select
                                    value={form.type}
                                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                                    className="w-full border border-zinc-300 pl-10 pr-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all appearance-none bg-white"
                                >
                                    <option value="">Không</option>
                                    <option value="fixed">Cố định (đ)</option>
                                    <option value="percent">Phần trăm (%)</option>
                                </select>
                            </div>
                        </div>
                        {form.type && (
                            <div>
                                <label className="block text-sm font-semibold text-zinc-700 mb-2">Giá trị giảm</label>
                                <div className="relative">
                                    {form.type === "percent" ? (
                                        <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                                    ) : (
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                                    )}
                                    <input
                                        type="number"
                                        value={form.value}
                                        onChange={(e) => setForm({ ...form, value: e.target.value })}
                                        className="w-full border border-zinc-300 pl-10 pr-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                                        placeholder={form.type === "percent" ? "10" : "10000"}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-zinc-700 mb-2">Giá sau giảm (đ)</label>
                            <input
                                type="number"
                                value={form.amountAfter}
                                onChange={(e) => setForm({ ...form, amountAfter: e.target.value })}
                                className="w-full border border-zinc-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                                placeholder="99000"
                            />
                            <p className="text-xs text-zinc-500 mt-1">Nếu set, sẽ dùng giá này làm giá cuối cùng</p>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-zinc-700 mb-2">Áp dụng cho gói</label>
                            <div className="relative">
                                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                                <select
                                    value={form.baseAmount}
                                    onChange={(e) => setForm({ ...form, baseAmount: e.target.value })}
                                    className="w-full border border-zinc-300 pl-10 pr-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all appearance-none bg-white"
                                >
                                    <option value="">Tất cả các gói</option>
                                    <option value="79000">Gói 1 tháng (79.000đ)</option>
                                    <option value="159000">Gói 3 tháng (159.000đ)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-zinc-700 mb-2">Từ ngày</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                                <input
                                    type="datetime-local"
                                    value={form.activeFrom}
                                    onChange={(e) => setForm({ ...form, activeFrom: e.target.value })}
                                    className="w-full border border-zinc-300 pl-10 pr-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-zinc-700 mb-2">Đến ngày</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                                <input
                                    type="datetime-local"
                                    value={form.activeTo}
                                    onChange={(e) => setForm({ ...form, activeTo: e.target.value })}
                                    className="w-full border border-zinc-300 pl-10 pr-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-zinc-700 mb-2">Lượt dùng tối đa</label>
                            <input
                                type="number"
                                value={form.maxUses}
                                onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                                className="w-full border border-zinc-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                                placeholder="100"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-zinc-700 mb-2">Lượt dùng mỗi user</label>
                            <input
                                type="number"
                                value={form.perUserLimit}
                                onChange={(e) => setForm({ ...form, perUserLimit: e.target.value })}
                                className="w-full border border-zinc-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                                placeholder="1"
                            />
                        </div>
                    </div>

                    {item && (
                        <div>
                            <label className="block text-sm font-semibold text-zinc-700 mb-2">Đã dùng</label>
                            <input
                                type="number"
                                value={form.usedCount}
                                onChange={(e) => setForm({ ...form, usedCount: e.target.value })}
                                className="w-full border border-zinc-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                                min={0}
                            />
                        </div>
                    )}

                    <div className="flex gap-3 pt-4 border-t border-zinc-200">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={busy}
                            className="flex-1 px-4 py-2.5 rounded-lg border border-zinc-300 hover:bg-zinc-50 transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={busy}
                            className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-teal-500 to-blue-600 text-white hover:from-teal-600 hover:to-blue-700 transition-all shadow-md font-medium flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {busy ? (
                                <>
                                    <span className="h-4 w-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
                                    Đang lưu...
                                </>
                            ) : (
                                "Lưu thay đổi"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
