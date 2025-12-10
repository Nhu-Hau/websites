import React from "react";
import { adminListPayments, adminUpdatePaymentStatus, adminDeletePayment, AdminPayment } from "@/lib/apiClient";
import { Search, Filter, RefreshCw, CheckCircle, XCircle, Clock, AlertCircle, Eye, Trash2, X, Save } from "lucide-react";
import { useToast } from "@/components/common/ToastProvider";

export default function OrdersTable() {
    const [items, setItems] = React.useState<AdminPayment[]>([]);
    const [page, setPage] = React.useState(1);
    const [limit] = React.useState(20);
    const [total, setTotal] = React.useState(0);
    const [q, setQ] = React.useState("");
    const [status, setStatus] = React.useState("");
    const [busy, setBusy] = React.useState(false);
    const toast = useToast();

    // Modal states
    const [selectedPayment, setSelectedPayment] = React.useState<AdminPayment | null>(null);
    const [modalBusy, setModalBusy] = React.useState(false);
    const [editStatus, setEditStatus] = React.useState("");

    // Delete confirmation
    const [deleteTarget, setDeleteTarget] = React.useState<AdminPayment | null>(null);
    const [deleteBusy, setDeleteBusy] = React.useState(false);

    const pages = Math.max(1, Math.ceil(total / limit));

    const load = React.useCallback(async () => {
        setBusy(true);
        try {
            const data = await adminListPayments({ page, limit, q, status });
            setItems(data.items);
            setTotal(data.total);
        } catch (e) {
            toast.error("Không thể tải danh sách đơn hàng");
        } finally {
            setBusy(false);
        }
    }, [page, limit, q, status, toast]);

    React.useEffect(() => {
        void load();
    }, [load]);

    const formatDate = (dateStr?: string | null) => {
        if (!dateStr) return "—";
        try {
            return new Date(dateStr).toLocaleString("vi-VN");
        } catch {
            return dateStr;
        }
    };

    const formatCurrency = (amount: number) => {
        return amount.toLocaleString("vi-VN") + " đ";
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "paid":
                return <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium flex items-center gap-1 w-fit"><CheckCircle className="h-3 w-3" /> Đã thanh toán</span>;
            case "pending":
                return <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-medium flex items-center gap-1 w-fit"><Clock className="h-3 w-3" /> Chờ thanh toán</span>;
            case "cancelled":
                return <span className="px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium flex items-center gap-1 w-fit"><XCircle className="h-3 w-3" /> Đã hủy</span>;
            case "expired":
                return <span className="px-2 py-1 rounded-full bg-zinc-100 text-zinc-700 text-xs font-medium flex items-center gap-1 w-fit"><AlertCircle className="h-3 w-3" /> Hết hạn</span>;
            default:
                return <span className="px-2 py-1 rounded-full bg-zinc-100 text-zinc-700 text-xs font-medium">{status}</span>;
        }
    };

    const getPlanLabel = (plan?: string | null) => {
        switch (plan) {
            case "monthly_79": return "Premium 79k/tháng";
            case "monthly_159": return "Premium 159k/3 tháng";
            default: return plan || "—";
        }
    };

    const openDetailModal = async (item: AdminPayment) => {
        setSelectedPayment(item);
        setEditStatus(item.status);
    };

    const handleUpdateStatus = async () => {
        if (!selectedPayment) return;
        setModalBusy(true);
        try {
            await adminUpdatePaymentStatus(selectedPayment._id, editStatus);
            toast.success("Cập nhật trạng thái thành công");
            setSelectedPayment(null);
            await load();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Lỗi cập nhật trạng thái");
        } finally {
            setModalBusy(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleteBusy(true);
        try {
            await adminDeletePayment(deleteTarget._id);
            toast.success("Xóa đơn hàng thành công");
            setDeleteTarget(null);
            setSelectedPayment(null);
            await load();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Lỗi xóa đơn hàng");
        } finally {
            setDeleteBusy(false);
        }
    };



    return (
        <div className="space-y-6">
            {/* Toolbar */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-zinc-200">
                <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex flex-col flex-1 min-w-[200px]">
                        <label className="text-sm font-medium text-zinc-700 mb-2 flex items-center gap-2">
                            <Search className="h-4 w-4" /> Tìm kiếm (Mã đơn)
                        </label>
                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Nhập mã đơn hàng..."
                            className="border border-zinc-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    setPage(1);
                                    void load();
                                }
                            }}
                        />
                    </div>
                    <div className="flex flex-col w-[200px]">
                        <label className="text-sm font-medium text-zinc-700 mb-2 flex items-center gap-2">
                            <Filter className="h-4 w-4" /> Trạng thái
                        </label>
                        <select
                            value={status}
                            onChange={(e) => {
                                setStatus(e.target.value);
                                setPage(1);
                            }}
                            className="border border-zinc-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all appearance-none bg-white"
                        >
                            <option value="">Tất cả</option>
                            <option value="paid">Đã thanh toán</option>
                            <option value="pending">Chờ thanh toán</option>
                            <option value="cancelled">Đã hủy</option>
                            <option value="expired">Hết hạn</option>
                        </select>
                    </div>
                    <button
                        onClick={() => {
                            setPage(1);
                            void load();
                        }}
                        disabled={busy}
                        className="px-6 py-2.5 rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-md flex items-center gap-2 font-medium"
                    >
                        <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} /> Làm mới
                    </button>

                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-lg border border-zinc-200 overflow-hidden">
                <div className="overflow-auto">
                    <table className="min-w-[1100px] w-full">
                        <thead className="bg-gradient-to-r from-zinc-100 to-zinc-50 border-b border-zinc-200">
                            <tr className="text-left">
                                <th className="p-4 font-semibold text-zinc-700">Mã đơn</th>
                                <th className="p-4 font-semibold text-zinc-700">Người dùng</th>
                                <th className="p-4 font-semibold text-zinc-700">Gói</th>
                                <th className="p-4 font-semibold text-zinc-700">Số tiền</th>
                                <th className="p-4 font-semibold text-zinc-700">Mã KM</th>
                                <th className="p-4 font-semibold text-zinc-700">Trạng thái</th>
                                <th className="p-4 font-semibold text-zinc-700">Ngày tạo</th>
                                <th className="p-4 font-semibold text-zinc-700 text-center">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr key={item._id} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
                                    <td className="p-4 font-mono text-sm text-zinc-600">
                                        #{item.orderCode}
                                    </td>
                                    <td className="p-4">
                                        {item.userId && typeof item.userId === 'object' ? (
                                            <div className="flex items-center gap-3">
                                                {item.userId.picture ? (
                                                    <img src={item.userId.picture} alt="" className="w-8 h-8 rounded-full object-cover" />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center font-bold text-xs">
                                                        {item.userId.name?.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="font-medium text-zinc-900 text-sm">{item.userId.name}</div>
                                                    <div className="text-xs text-zinc-500">{item.userId.email}</div>
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-zinc-500 text-sm">Unknown User</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-sm text-zinc-700">
                                        {item.description}
                                    </td>
                                    <td className="p-4">
                                        <div className="font-medium text-zinc-900">{formatCurrency(item.amount)}</div>
                                        {item.amountBefore && item.amountBefore !== item.amount && (
                                            <div className="text-xs text-zinc-500 line-through">{formatCurrency(item.amountBefore)}</div>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        {item.promoCode ? (
                                            <span className="font-mono font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded border border-teal-100 text-xs">
                                                {item.promoCode}
                                            </span>
                                        ) : (
                                            <span className="text-zinc-400 text-sm">—</span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        {getStatusBadge(item.status)}
                                    </td>
                                    <td className="p-4 text-sm text-zinc-600">
                                        {formatDate(item.createdAt)}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => openDetailModal(item)}
                                                className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                                                title="Xem chi tiết"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => setDeleteTarget(item)}
                                                className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
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
                                            <Search className="h-12 w-12 text-zinc-300" />
                                            <p className="text-lg font-medium">Không có đơn hàng nào</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-zinc-200 flex items-center justify-between">
                <div className="text-sm font-medium text-zinc-700">
                    Tổng: <span className="font-bold text-teal-600">{total}</span> đơn hàng
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

            {/* Detail Modal */}
            {selectedPayment && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto">
                        <div className="flex items-center justify-between p-6 border-b border-zinc-200">
                            <h2 className="text-xl font-bold text-zinc-900">Chi tiết đơn hàng #{selectedPayment.orderCode}</h2>
                            <button
                                onClick={() => setSelectedPayment(null)}
                                className="p-2 rounded-lg hover:bg-zinc-100 transition-colors"
                            >
                                <X className="h-5 w-5 text-zinc-500" />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* User Info */}
                            <div className="bg-zinc-50 rounded-xl p-4">
                                <h3 className="text-sm font-semibold text-zinc-500 mb-3">Thông tin người dùng</h3>
                                {selectedPayment.userId && typeof selectedPayment.userId === 'object' ? (
                                    <div className="flex items-center gap-4">
                                        {selectedPayment.userId.picture ? (
                                            <img src={selectedPayment.userId.picture} alt="" className="w-12 h-12 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center font-bold text-lg">
                                                {selectedPayment.userId.name?.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <div>
                                            <div className="font-semibold text-zinc-900">{selectedPayment.userId.name}</div>
                                            <div className="text-sm text-zinc-500">{selectedPayment.userId.email}</div>
                                        </div>
                                    </div>
                                ) : (
                                    <span className="text-zinc-500">Unknown User</span>
                                )}
                            </div>

                            {/* Payment Details */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-zinc-500">Gói</label>
                                    <p className="text-zinc-900 font-medium">{getPlanLabel(selectedPayment.plan)}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-zinc-500">Mô tả</label>
                                    <p className="text-zinc-900">{selectedPayment.description}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-zinc-500">Số tiền</label>
                                    <p className="text-zinc-900 font-bold text-lg">{formatCurrency(selectedPayment.amount)}</p>
                                    {selectedPayment.amountBefore && selectedPayment.amountBefore !== selectedPayment.amount && (
                                        <p className="text-sm text-zinc-500 line-through">{formatCurrency(selectedPayment.amountBefore)}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-zinc-500">Mã khuyến mãi</label>
                                    <p className="text-zinc-900">{selectedPayment.promoCode || "—"}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-zinc-500">Ngày tạo</label>
                                    <p className="text-zinc-900">{formatDate(selectedPayment.createdAt)}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-zinc-500">Ngày thanh toán</label>
                                    <p className="text-zinc-900">{formatDate(selectedPayment.paidAt)}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-zinc-500">Hết hạn Premium</label>
                                    <p className="text-zinc-900">{formatDate(selectedPayment.premiumExpiryDate)}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-zinc-500">PayOS Transaction ID</label>
                                    <p className="text-zinc-900 font-mono text-sm">{selectedPayment.payOSTransactionId || "—"}</p>
                                </div>
                            </div>

                            {/* Status Update */}
                            <div className="bg-zinc-50 rounded-xl p-4">
                                <h3 className="text-sm font-semibold text-zinc-500 mb-3">Cập nhật trạng thái</h3>
                                <div className="flex items-center gap-4">
                                    <select
                                        value={editStatus}
                                        onChange={(e) => setEditStatus(e.target.value)}
                                        className="flex-1 border border-zinc-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    >
                                        <option value="pending">Chờ thanh toán</option>
                                        <option value="paid">Đã thanh toán</option>
                                        <option value="cancelled">Đã hủy</option>
                                        <option value="expired">Hết hạn</option>
                                    </select>
                                    <button
                                        onClick={handleUpdateStatus}
                                        disabled={modalBusy || editStatus === selectedPayment.status}
                                        className="px-6 py-2.5 rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center gap-2 font-medium"
                                    >
                                        <Save className="h-4 w-4" /> Lưu
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-6 border-t border-zinc-200 bg-zinc-50">
                            <button
                                onClick={() => setDeleteTarget(selectedPayment)}
                                className="px-4 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 font-medium"
                            >
                                <Trash2 className="h-4 w-4" /> Xóa đơn hàng
                            </button>
                            <button
                                onClick={() => setSelectedPayment(null)}
                                className="px-6 py-2.5 rounded-lg border border-zinc-300 hover:bg-zinc-100 transition-colors font-medium"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteTarget && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="p-6">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                    <AlertCircle className="h-6 w-6 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-zinc-900">Xác nhận xóa</h3>
                                    <p className="text-sm text-zinc-500">Hành động này không thể hoàn tác</p>
                                </div>
                            </div>
                            <p className="text-zinc-700 mb-6">
                                Bạn có chắc chắn muốn xóa đơn hàng <span className="font-bold">#{deleteTarget.orderCode}</span>?
                            </p>
                            <div className="flex items-center gap-3 justify-end">
                                <button
                                    onClick={() => setDeleteTarget(null)}
                                    disabled={deleteBusy}
                                    className="px-4 py-2 rounded-lg border border-zinc-300 hover:bg-zinc-50 transition-colors font-medium"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={deleteBusy}
                                    className="px-6 py-2.5 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center gap-2 font-medium"
                                >
                                    {deleteBusy ? "Đang xóa..." : "Xóa"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
