import React from "react";
import { adminListPayments, AdminPayment } from "@/lib/apiClient";
import { Search, Filter, RefreshCw, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
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

    return (
        <div className="space-y-6">
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

            <div className="bg-white rounded-xl shadow-lg border border-zinc-200 overflow-hidden">
                <div className="overflow-auto">
                    <table className="min-w-[1000px] w-full">
                        <thead className="bg-gradient-to-r from-zinc-100 to-zinc-50 border-b border-zinc-200">
                            <tr className="text-left">
                                <th className="p-4 font-semibold text-zinc-700">Mã đơn</th>
                                <th className="p-4 font-semibold text-zinc-700">Người dùng</th>
                                <th className="p-4 font-semibold text-zinc-700">Gói</th>
                                <th className="p-4 font-semibold text-zinc-700">Số tiền</th>
                                <th className="p-4 font-semibold text-zinc-700">Mã KM</th>
                                <th className="p-4 font-semibold text-zinc-700">Trạng thái</th>
                                <th className="p-4 font-semibold text-zinc-700">Ngày tạo</th>
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
                                </tr>
                            ))}
                            {items.length === 0 && (
                                <tr>
                                    <td className="p-12 text-center text-zinc-500" colSpan={7}>
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
        </div>
    );
}
