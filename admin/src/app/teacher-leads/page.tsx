"use client";

import React from "react";
import {
    adminListTeacherLeads,
    adminApproveTeacherLead,
    adminRejectTeacherLead,
    adminDeleteTeacherLead,
    AdminTeacherLead,
} from "@/lib/apiClient";
import { useToast } from "@/components/common/ToastProvider";
import {
    GraduationCap,
    Search,
    Filter,
    RefreshCw,
    CheckCircle,
    XCircle,
    Clock,
    Eye,
    Trash2,
    X,
    Check,
    Phone,
    Mail,
    Award,
    Briefcase,
    Calendar,
    MessageSquare,
} from "lucide-react";

const LIMIT = 15;

export default function TeacherLeadsPage() {
    const [items, setItems] = React.useState<AdminTeacherLead[]>([]);
    const [page, setPage] = React.useState(1);
    const [total, setTotal] = React.useState(0);
    const [status, setStatus] = React.useState("");
    const [q, setQ] = React.useState("");
    const [busy, setBusy] = React.useState(false);
    const [selectedLead, setSelectedLead] = React.useState<AdminTeacherLead | null>(null);
    const [actionBusy, setActionBusy] = React.useState(false);
    const [adminNote, setAdminNote] = React.useState("");
    const toast = useToast();

    const pages = Math.max(1, Math.ceil(total / LIMIT));

    const load = React.useCallback(async () => {
        setBusy(true);
        try {
            const data = await adminListTeacherLeads({ page, limit: LIMIT, status, q });
            setItems(data.items);
            setTotal(data.total);
        } catch (e) {
            toast.error("Không thể tải danh sách đăng ký");
        } finally {
            setBusy(false);
        }
    }, [page, status, q, toast]);

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

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "approved":
                return <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium flex items-center gap-1 w-fit"><CheckCircle className="h-3 w-3" /> Đã duyệt</span>;
            case "pending":
                return <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-medium flex items-center gap-1 w-fit"><Clock className="h-3 w-3" /> Chờ duyệt</span>;
            case "rejected":
                return <span className="px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium flex items-center gap-1 w-fit"><XCircle className="h-3 w-3" /> Từ chối</span>;
            default:
                return <span className="px-2 py-1 rounded-full bg-zinc-100 text-zinc-700 text-xs font-medium">{status}</span>;
        }
    };

    const handleApprove = async () => {
        if (!selectedLead) return;
        setActionBusy(true);
        try {
            await adminApproveTeacherLead(selectedLead._id, adminNote);
            toast.success("Đã duyệt đơn đăng ký");
            setSelectedLead(null);
            setAdminNote("");
            await load();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Lỗi duyệt đơn");
        } finally {
            setActionBusy(false);
        }
    };

    const handleReject = async () => {
        if (!selectedLead) return;
        setActionBusy(true);
        try {
            await adminRejectTeacherLead(selectedLead._id, adminNote);
            toast.success("Đã từ chối đơn đăng ký");
            setSelectedLead(null);
            setAdminNote("");
            await load();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Lỗi từ chối đơn");
        } finally {
            setActionBusy(false);
        }
    };

    const handleDelete = async (lead: AdminTeacherLead) => {
        if (!confirm(`Xóa đơn đăng ký của ${lead.fullName}?`)) return;
        try {
            await adminDeleteTeacherLead(lead._id);
            toast.success("Đã xóa đơn đăng ký");
            if (selectedLead?._id === lead._id) setSelectedLead(null);
            await load();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Lỗi xóa đơn");
        }
    };

    const pendingCount = items.filter(i => i.status === "pending").length;

    return (
        <div className="min-h-screen space-y-6">
            {/* Header */}
            <header className="bg-white rounded-2xl shadow-lg border border-zinc-200 p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-500 text-white shadow-lg">
                            <GraduationCap className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-zinc-900">Đăng ký Giáo viên</h1>
                            <p className="text-sm text-zinc-600">Quản lý đơn đăng ký trở thành giáo viên</p>
                        </div>
                    </div>
                    {pendingCount > 0 && (
                        <div className="px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-700 font-medium">
                            {pendingCount} đơn chờ duyệt
                        </div>
                    )}
                </div>
            </header>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm">
                    <p className="text-sm text-zinc-500">Tổng đơn</p>
                    <p className="text-2xl font-bold text-zinc-900">{total}</p>
                </div>
                <div className="bg-white border border-yellow-200 rounded-xl p-4 shadow-sm">
                    <p className="text-sm text-yellow-600">Chờ duyệt</p>
                    <p className="text-2xl font-bold text-yellow-600">{items.filter(i => i.status === "pending").length}</p>
                </div>
                <div className="bg-white border border-green-200 rounded-xl p-4 shadow-sm">
                    <p className="text-sm text-green-600">Đã duyệt</p>
                    <p className="text-2xl font-bold text-green-600">{items.filter(i => i.status === "approved").length}</p>
                </div>
                <div className="bg-white border border-red-200 rounded-xl p-4 shadow-sm">
                    <p className="text-sm text-red-600">Từ chối</p>
                    <p className="text-2xl font-bold text-red-600">{items.filter(i => i.status === "rejected").length}</p>
                </div>
            </div>

            {/* Toolbar */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-zinc-200">
                <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex flex-col flex-1 min-w-[200px]">
                        <label className="text-sm font-medium text-zinc-700 mb-2 flex items-center gap-2">
                            <Search className="h-4 w-4" /> Tìm kiếm
                        </label>
                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Tên, email, SĐT..."
                            className="border border-zinc-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    setPage(1);
                                    void load();
                                }
                            }}
                        />
                    </div>
                    <div className="flex flex-col w-[180px]">
                        <label className="text-sm font-medium text-zinc-700 mb-2 flex items-center gap-2">
                            <Filter className="h-4 w-4" /> Trạng thái
                        </label>
                        <select
                            value={status}
                            onChange={(e) => {
                                setStatus(e.target.value);
                                setPage(1);
                            }}
                            className="border border-zinc-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                        >
                            <option value="">Tất cả</option>
                            <option value="pending">Chờ duyệt</option>
                            <option value="approved">Đã duyệt</option>
                            <option value="rejected">Từ chối</option>
                        </select>
                    </div>
                    <button
                        onClick={() => {
                            setPage(1);
                            void load();
                        }}
                        disabled={busy}
                        className="px-6 py-2.5 rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-60 flex items-center gap-2 font-medium"
                    >
                        <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} /> Làm mới
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-lg border border-zinc-200 overflow-hidden">
                <div className="overflow-auto">
                    <table className="min-w-[900px] w-full text-sm">
                        <thead className="bg-zinc-50 border-b border-zinc-200">
                            <tr>
                                <th className="p-4 text-left font-semibold text-zinc-700">Họ tên</th>
                                <th className="p-4 text-left font-semibold text-zinc-700">Email</th>
                                <th className="p-4 text-left font-semibold text-zinc-700">SĐT</th>
                                <th className="p-4 text-left font-semibold text-zinc-700">Chứng chỉ</th>
                                <th className="p-4 text-left font-semibold text-zinc-700">Trạng thái</th>
                                <th className="p-4 text-left font-semibold text-zinc-700">Ngày đăng ký</th>
                                <th className="p-4 text-center font-semibold text-zinc-700">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((lead) => (
                                <tr key={lead._id} className="border-b border-zinc-100 hover:bg-zinc-50">
                                    <td className="p-4 font-medium text-zinc-900">{lead.fullName}</td>
                                    <td className="p-4 text-zinc-600">{lead.email}</td>
                                    <td className="p-4 text-zinc-600">{lead.phone}</td>
                                    <td className="p-4 text-zinc-600 max-w-[150px] truncate" title={lead.scoreOrCert}>{lead.scoreOrCert}</td>
                                    <td className="p-4">{getStatusBadge(lead.status)}</td>
                                    <td className="p-4 text-zinc-500 text-sm">{formatDate(lead.createdAt)}</td>
                                    <td className="p-4">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedLead(lead);
                                                    setAdminNote("");
                                                }}
                                                className="p-2 rounded-lg text-blue-600 hover:bg-blue-50"
                                                title="Xem chi tiết"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(lead)}
                                                className="p-2 rounded-lg text-red-600 hover:bg-red-50"
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
                                    <td className="p-12 text-center text-zinc-500" colSpan={7}>
                                        <GraduationCap className="h-12 w-12 text-zinc-300 mx-auto mb-2" />
                                        <p>Chưa có đơn đăng ký nào</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {pages > 1 && (
                <div className="bg-white rounded-xl shadow-lg p-4 border border-zinc-200 flex items-center justify-between">
                    <span className="text-sm text-zinc-600">Trang {page}/{pages}</span>
                    <div className="flex gap-2">
                        <button
                            disabled={page <= 1}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            className="px-4 py-2 rounded-lg border border-zinc-300 disabled:opacity-40"
                        >
                            Trước
                        </button>
                        <button
                            disabled={page >= pages}
                            onClick={() => setPage(p => Math.min(pages, p + 1))}
                            className="px-4 py-2 rounded-lg border border-zinc-300 disabled:opacity-40"
                        >
                            Sau
                        </button>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {selectedLead && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto">
                        <div className="flex items-center justify-between p-6 border-b border-zinc-200">
                            <h2 className="text-xl font-bold text-zinc-900">Chi tiết đơn đăng ký</h2>
                            <button onClick={() => setSelectedLead(null)} className="p-2 rounded-lg hover:bg-zinc-100">
                                <X className="h-5 w-5 text-zinc-500" />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Status */}
                            <div className="flex items-center gap-3">
                                {getStatusBadge(selectedLead.status)}
                                {selectedLead.reviewedAt && (
                                    <span className="text-sm text-zinc-500">
                                        Xử lý lúc: {formatDate(selectedLead.reviewedAt)}
                                    </span>
                                )}
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-start gap-3 p-4 bg-zinc-50 rounded-xl">
                                    <GraduationCap className="h-5 w-5 text-teal-600 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-zinc-500">Họ tên</p>
                                        <p className="font-semibold text-zinc-900">{selectedLead.fullName}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-4 bg-zinc-50 rounded-xl">
                                    <Mail className="h-5 w-5 text-teal-600 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-zinc-500">Email</p>
                                        <p className="font-semibold text-zinc-900">{selectedLead.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-4 bg-zinc-50 rounded-xl">
                                    <Phone className="h-5 w-5 text-teal-600 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-zinc-500">Số điện thoại</p>
                                        <p className="font-semibold text-zinc-900">{selectedLead.phone}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-4 bg-zinc-50 rounded-xl">
                                    <Award className="h-5 w-5 text-teal-600 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-zinc-500">Chứng chỉ/Điểm số</p>
                                        <p className="font-semibold text-zinc-900">{selectedLead.scoreOrCert}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-4 bg-zinc-50 rounded-xl">
                                    <Briefcase className="h-5 w-5 text-teal-600 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-zinc-500">Kinh nghiệm</p>
                                        <p className="font-semibold text-zinc-900">{selectedLead.experience}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-4 bg-zinc-50 rounded-xl">
                                    <Calendar className="h-5 w-5 text-teal-600 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-zinc-500">Thời gian rảnh</p>
                                        <p className="font-semibold text-zinc-900">{selectedLead.availability}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Message */}
                            {selectedLead.message && (
                                <div className="flex items-start gap-3 p-4 bg-zinc-50 rounded-xl">
                                    <MessageSquare className="h-5 w-5 text-teal-600 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-sm text-zinc-500">Lời nhắn</p>
                                        <p className="text-zinc-900 whitespace-pre-wrap">{selectedLead.message}</p>
                                    </div>
                                </div>
                            )}

                            {/* Admin Note */}
                            {selectedLead.adminNote && (
                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                                    <p className="text-sm font-medium text-blue-700">Ghi chú của Admin:</p>
                                    <p className="text-blue-900">{selectedLead.adminNote}</p>
                                </div>
                            )}

                            {/* Action Section (only for pending) */}
                            {selectedLead.status === "pending" && (
                                <div className="border-t border-zinc-200 pt-6">
                                    <label className="block text-sm font-medium text-zinc-700 mb-2">
                                        Ghi chú (tùy chọn)
                                    </label>
                                    <textarea
                                        value={adminNote}
                                        onChange={(e) => setAdminNote(e.target.value)}
                                        placeholder="Nhập ghi chú cho người đăng ký..."
                                        className="w-full border border-zinc-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[80px]"
                                    />
                                    <div className="flex gap-3 mt-4">
                                        <button
                                            onClick={handleApprove}
                                            disabled={actionBusy}
                                            className="flex-1 px-6 py-3 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-60 flex items-center justify-center gap-2 font-medium"
                                        >
                                            <Check className="h-5 w-5" /> Duyệt
                                        </button>
                                        <button
                                            onClick={handleReject}
                                            disabled={actionBusy}
                                            className="flex-1 px-6 py-3 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 flex items-center justify-center gap-2 font-medium"
                                        >
                                            <XCircle className="h-5 w-5" /> Từ chối
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-end p-6 border-t border-zinc-200 bg-zinc-50">
                            <button
                                onClick={() => setSelectedLead(null)}
                                className="px-6 py-2.5 rounded-lg border border-zinc-300 hover:bg-zinc-100 font-medium"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
