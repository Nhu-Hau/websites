"use client";

import React, { useEffect, useState } from "react";
import { adminGetReports, adminUpdateReportStatus, adminGetTestItems, AdminPart, AdminStimulus } from "@/lib/apiClient";
import { format } from "date-fns";
import { Loader2, CheckCircle, XCircle, ExternalLink, Flag, Home, Filter, RefreshCw, PenSquare } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/common/ToastProvider";
import EditQuestionModal from "@/components/features/parts/EditQuestionModal";
import EditStimulusModal from "@/components/features/parts/EditStimulusModal";

export default function ReportsPage() {
    const toast = useToast();
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState<string>("");

    // Modal state
    const [editQuestion, setEditQuestion] = useState<AdminPart | null>(null);
    const [editStimulus, setEditStimulus] = useState<AdminStimulus | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isStimulusModalOpen, setIsStimulusModalOpen] = useState(false);
    const [loadingQuestion, setLoadingQuestion] = useState(false);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const res = await adminGetReports({ page, limit: 20, status: statusFilter });
            setReports(res.items);
            setTotalPages(res.totalPages);
        } catch (error) {
            toast.error("Failed to fetch reports");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, [page, statusFilter]);

    const handleStatusUpdate = async (id: string, newStatus: "pending" | "resolved" | "ignored") => {
        try {
            await adminUpdateReportStatus(id, newStatus);
            toast.success("Status updated");
            fetchReports();
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    const handleQuickFix = async (report: any) => {
        if (!report.testId || !report.questionId) return;
        const parts = report.testId.split("-");
        if (parts.length < 3) return;

        const partKey = parts[0];
        const level = parseInt(parts[1]);
        const test = parseInt(parts[2]);

        setLoadingQuestion(true);
        try {
            const res = await adminGetTestItems({ part: partKey, level, test });
            const item = res.items.find((it) => it.id === report.questionId);

            if (item) {
                setEditQuestion(item);
                if (item.stimulusId && res.stimulusMap[item.stimulusId]) {
                    setEditStimulus(res.stimulusMap[item.stimulusId]);
                } else {
                    setEditStimulus(null);
                }
                setIsEditModalOpen(true);
            } else {
                toast.error("Question not found in the specified test");
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load question details");
        } finally {
            setLoadingQuestion(false);
        }
    };

    return (
        <div className="bg-gradient-to-br from-zinc-50 to-zinc-100 p-4 space-y-4">
            {/* Header */}
            <header className="bg-white rounded-lg shadow-md p-4 border border-zinc-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg p-2 shadow-md">
                            <Flag className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-zinc-900">Báo cáo lỗi</h1>
                            <p className="text-xs text-zinc-600 mt-0.5">Quản lý phản hồi và báo cáo lỗi từ người dùng</p>
                        </div>
                    </div>
                    <nav className="flex items-center gap-2">
                        <Link
                            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-teal-500 to-blue-600 text-white hover:from-teal-600 hover:to-blue-700 transition-all shadow-md flex items-center gap-1.5 text-xs font-medium"
                            href="/"
                        >
                            <Home className="h-3.5 w-3.5" /> Trang chủ
                        </Link>
                    </nav>
                </div>
            </header>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-md p-4 border border-zinc-200">
                <div className="flex flex-wrap gap-3 items-end">
                    <div className="flex flex-col min-w-[180px]">
                        <label className="text-xs font-medium text-zinc-700 mb-1.5 flex items-center gap-1.5">
                            <Filter className="h-3.5 w-3.5" /> Trạng thái
                        </label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="border border-zinc-300 px-3 py-1.5 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                        >
                            <option value="">Tất cả</option>
                            <option value="pending">Chờ xử lý</option>
                            <option value="resolved">Đã giải quyết</option>
                            <option value="ignored">Đã bỏ qua</option>
                        </select>
                    </div>
                    <button
                        onClick={fetchReports}
                        className="px-4 py-1.5 text-sm rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 transition-all shadow-md flex items-center gap-1.5 font-medium"
                    >
                        <RefreshCw className="h-3.5 w-3.5" /> Làm mới
                    </button>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-md border border-zinc-200 overflow-hidden">
                    <div className="overflow-auto">
                        <table className="w-full text-left text-sm text-zinc-600">
                            <thead className="bg-zinc-50 text-xs uppercase font-medium text-zinc-500 border-b border-zinc-200">
                                <tr>
                                    <th className="px-3 py-2 text-xs">Trạng thái</th>
                                    <th className="px-3 py-2 text-xs">Người báo cáo</th>
                                    <th className="px-3 py-2 text-xs">Nội dung</th>
                                    <th className="px-3 py-2 text-xs">Ngữ cảnh</th>
                                    <th className="px-3 py-2 text-xs">Ngày tạo</th>
                                    <th className="px-3 py-2 text-xs text-right">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {reports.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-zinc-400">
                                            <div className="flex flex-col items-center gap-2">
                                                <Flag className="h-12 w-12 text-zinc-200" />
                                                <p>Không có báo cáo nào.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    reports.map((report) => (
                                        <tr key={report._id} className="hover:bg-zinc-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${report.status === 'resolved' ? 'bg-green-50 text-green-700 border-green-200' :
                                                    report.status === 'ignored' ? 'bg-zinc-100 text-zinc-700 border-zinc-200' :
                                                        'bg-amber-50 text-amber-700 border-amber-200'
                                                    }`}>
                                                    {report.status === 'pending' ? 'Chờ xử lý' :
                                                        report.status === 'resolved' ? 'Đã giải quyết' : 'Đã bỏ qua'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {report.userId?.avatar ? (
                                                        <img src={report.userId.avatar} alt="" className="h-8 w-8 rounded-full object-cover border border-zinc-200" />
                                                    ) : (
                                                        <div className="h-8 w-8 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-bold text-zinc-500 border border-zinc-200">
                                                            {report.userId?.name?.[0] || '?'}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="font-medium text-zinc-900">{report.userId?.name || 'Unknown'}</div>
                                                        <div className="text-xs text-zinc-400">{report.userId?.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 max-w-xs truncate" title={report.content}>
                                                {report.content}
                                            </td>
                                            <td className="px-6 py-4 text-xs font-mono text-zinc-500">
                                                <div className="bg-zinc-50 px-2 py-1 rounded border border-zinc-100 inline-block mb-1" title={report.testId}>
                                                    {report.testId}
                                                </div>
                                                <div title={report.questionId} className="truncate max-w-[100px] text-zinc-400">
                                                    {report.questionId}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-zinc-500">
                                                {format(new Date(report.createdAt), "dd/MM/yyyy HH:mm")}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {report.status === 'pending' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleStatusUpdate(report._id, 'resolved')}
                                                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors border border-transparent hover:border-green-200"
                                                                title="Đánh dấu đã giải quyết"
                                                            >
                                                                <CheckCircle className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleStatusUpdate(report._id, 'ignored')}
                                                                className="p-2 text-zinc-400 hover:bg-zinc-100 rounded-lg transition-colors border border-transparent hover:border-zinc-200"
                                                                title="Bỏ qua"
                                                            >
                                                                <XCircle className="h-4 w-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                    <button
                                                        onClick={() => handleQuickFix(report)}
                                                        disabled={loadingQuestion}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-200 disabled:opacity-50"
                                                        title="Sửa nhanh (Mở popup)"
                                                    >
                                                        {loadingQuestion ? <Loader2 className="h-4 w-4 animate-spin" /> : <PenSquare className="h-4 w-4" />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {totalPages > 1 && (
                <div className="bg-white rounded-lg shadow-md p-3 border border-zinc-200 flex justify-center gap-2">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                        className="px-3 py-1.5 text-xs rounded-lg border border-zinc-300 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                    >
                        Trước
                    </button>
                    <span className="px-3 py-1.5 text-xs font-medium text-zinc-700 bg-zinc-50 rounded-lg border border-zinc-200">
                        Trang {page} / {totalPages}
                    </span>
                    <button
                        disabled={page === totalPages}
                        onClick={() => setPage(p => p + 1)}
                        className="px-3 py-1.5 text-xs rounded-lg border border-zinc-300 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                    >
                        Sau
                    </button>
                </div>
            )}

            {/* Edit Question Modal */}
            {isEditModalOpen && editQuestion && (
                <EditQuestionModal
                    isOpen={isEditModalOpen}
                    onClose={() => {
                        setIsEditModalOpen(false);
                        setEditQuestion(null);
                        setEditStimulus(null);
                    }}
                    item={editQuestion}
                    stimulus={editStimulus}
                    onUpdate={(updatedItem) => {
                        // Just close the modal, maybe show success toast
                        setIsEditModalOpen(false);
                        setEditQuestion(null);
                        setEditStimulus(null);
                        toast.success("Question updated successfully");
                    }}
                    onEditStimulus={() => {
                        if (editStimulus) {
                            setIsStimulusModalOpen(true);
                        }
                    }}
                />
            )}

            {/* Edit Stimulus Modal */}
            {isStimulusModalOpen && editStimulus && (
                <EditStimulusModal
                    isOpen={isStimulusModalOpen}
                    stimulus={editStimulus}
                    onClose={() => setIsStimulusModalOpen(false)}
                    onUpdate={(updatedStimulus) => {
                        setEditStimulus(updatedStimulus);
                        setIsStimulusModalOpen(false);
                        toast.success("Stimulus updated successfully");
                    }}
                />
            )}
        </div>
    );
}
