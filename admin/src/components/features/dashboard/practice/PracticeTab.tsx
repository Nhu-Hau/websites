/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { FileText, Trash2, X } from "lucide-react";
import {
    AdminPracticeAttempt,
    adminDeletePracticeAttempt,
    adminListPracticeAttempts,
} from "@/lib/apiClient";

interface PracticeTabProps {
    practiceAttempts: AdminPracticeAttempt[];
    practiceTotal: number;
    practicePage: number;
    setPracticeAttempts: (attempts: AdminPracticeAttempt[]) => void;
    setPracticeTotal: (total: number) => void;
    setError: (error: string | undefined) => void;
    selectedUserId: string | null;
    setSelectedUserId: (id: string | null) => void;
    selectedUserPractices: AdminPracticeAttempt[];
    setSelectedUserPractices: (attempts: AdminPracticeAttempt[]) => void;
    loadingUserPractices: boolean;
}

export default function PracticeTab({
    practiceAttempts,
    practiceTotal,
    practicePage,
    setPracticeAttempts,
    setPracticeTotal,
    setError,
    selectedUserId,
    setSelectedUserId,
    selectedUserPractices,
    setSelectedUserPractices,
    loadingUserPractices,
}: PracticeTabProps) {
    return (
        <div className="flex-1 overflow-auto px-6 py-6">
            <div className="space-y-6">
                <div className="bg-white rounded-xl border border-zinc-200 shadow-sm">
                    <div className="p-6 border-b border-zinc-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-tealCustom" />
                                <h3 className="text-lg font-semibold text-zinc-900">Quản lý Practice</h3>
                            </div>
                            <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm font-medium">
                                Tổng: {practiceTotal} bài
                            </span>
                        </div>
                    </div>
                    <div className="overflow-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-zinc-50">
                                <tr className="text-left">
                                    <th className="p-4 font-semibold text-zinc-700">Người dùng</th>
                                    <th className="p-4 font-semibold text-zinc-700">Email</th>
                                    <th className="p-4 font-semibold text-zinc-700">Số bài Practice</th>
                                    <th className="p-4 font-semibold text-zinc-700">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(() => {
                                    // Group practice attempts theo user
                                    const userMap = new Map<
                                        string,
                                        {
                                            userId: string;
                                            userName: string;
                                            userEmail: string;
                                            attempts: AdminPracticeAttempt[];
                                        }
                                    >();
                                    practiceAttempts.forEach((a) => {
                                        if (!userMap.has(a.userId)) {
                                            userMap.set(a.userId, {
                                                userId: a.userId,
                                                userName: a.userName,
                                                userEmail: a.userEmail,
                                                attempts: [],
                                            });
                                        }
                                        userMap.get(a.userId)!.attempts.push(a);
                                    });
                                    const users = Array.from(userMap.values());
                                    return users.map((user, idx) => (
                                        <tr
                                            key={user.userId}
                                            className={`border-t border-zinc-100 hover:bg-zinc-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-zinc-50/50"
                                                }`}
                                        >
                                            <td className="p-4 font-medium text-zinc-900">{user.userName}</td>
                                            <td className="p-4 font-mono text-xs text-zinc-600">
                                                {user.userEmail}
                                            </td>
                                            <td className="p-4">
                                                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                                                    {user.attempts.length} bài
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setSelectedUserId(user.userId)}
                                                        className="px-4 py-2 text-sm border border-tealCustom text-tealCustom rounded-lg hover:bg-teal-50 transition-colors font-medium"
                                                    >
                                                        Xem chi tiết
                                                    </button>
                                                    <button
                                                        onClick={async () => {
                                                            if (
                                                                !confirm(
                                                                    `Bạn có chắc muốn xóa tất cả ${user.attempts.length} bài practice của ${user.userName}?`
                                                                )
                                                            )
                                                                return;
                                                            try {
                                                                // Xóa tất cả attempts của user
                                                                await Promise.all(
                                                                    user.attempts.map((a) => adminDeletePracticeAttempt(a._id))
                                                                );
                                                                setPracticeAttempts(
                                                                    practiceAttempts.filter((a) => a.userId !== user.userId)
                                                                );
                                                                setPracticeTotal(practiceTotal - user.attempts.length);
                                                                setError(undefined);
                                                                // Reload data
                                                                const result = await adminListPracticeAttempts({
                                                                    page: practicePage,
                                                                    limit: 1000,
                                                                });
                                                                setPracticeAttempts(result.items);
                                                                setPracticeTotal(result.total);
                                                            } catch (e: any) {
                                                                setError(e?.message || "Lỗi xóa bài practice");
                                                            }
                                                        }}
                                                        className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg border border-red-200 hover:border-red-300 transition-colors flex items-center gap-1.5"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                        Xóa tất cả
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ));
                                })()}
                                {practiceAttempts.length === 0 && (
                                    <tr>
                                        <td className="p-12 text-center text-zinc-500" colSpan={4}>
                                            <div className="flex flex-col items-center gap-2">
                                                <FileText className="h-8 w-8 text-zinc-300" />
                                                <p>Chưa có dữ liệu</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Modal hiển thị bài practice của user */}
                {selectedUserId && (
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        style={{ animation: "fadeIn 0.2s ease-out" }}
                        onClick={() => setSelectedUserId(null)}
                    >
                        <div
                            className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col"
                            style={{ animation: "slideUp 0.3s ease-out" }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-zinc-200 flex justify-between items-center bg-gradient-to-r from-teal-50 to-blue-50">
                                <div className="flex items-center gap-3">
                                    <div className="bg-tealCustom rounded-full p-2">
                                        <FileText className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-zinc-900">
                                            Bài Practice của {selectedUserPractices[0]?.userName || "User"}
                                        </h3>
                                        <p className="text-sm text-zinc-600 mt-1">
                                            {selectedUserPractices.length} bài practice
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedUserId(null)}
                                    className="text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 rounded-full p-2 transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <div className="p-6 overflow-auto flex-1">
                                {loadingUserPractices ? (
                                    <div className="text-center py-12">
                                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-tealCustom mx-auto mb-4"></div>
                                        <p className="text-zinc-500">Đang tải...</p>
                                    </div>
                                ) : selectedUserPractices.length === 0 ? (
                                    <div className="text-center py-12">
                                        <FileText className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
                                        <p className="text-zinc-500">Chưa có bài practice nào</p>
                                    </div>
                                ) : (
                                    <div className="overflow-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-zinc-50 sticky top-0">
                                                <tr className="text-left">
                                                    <th className="p-4 font-semibold text-zinc-700">Part</th>
                                                    <th className="p-4 font-semibold text-zinc-700">Level</th>
                                                    <th className="p-4 font-semibold text-zinc-700">Test</th>
                                                    <th className="p-4 font-semibold text-zinc-700">Đúng/Sai</th>
                                                    <th className="p-4 font-semibold text-zinc-700">Độ chính xác</th>
                                                    <th className="p-4 font-semibold text-zinc-700">Thời gian</th>
                                                    <th className="p-4 font-semibold text-zinc-700">Ngày làm</th>
                                                    <th className="p-4 font-semibold text-zinc-700">Thao tác</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedUserPractices
                                                    .sort((a, b) => {
                                                        // Sắp xếp theo part trước
                                                        const partA = a.partKey || "";
                                                        const partB = b.partKey || "";
                                                        const partCompare = partA.localeCompare(partB, undefined, {
                                                            numeric: true,
                                                            sensitivity: "base",
                                                        });
                                                        if (partCompare !== 0) return partCompare;
                                                        // Nếu part giống nhau, sắp xếp theo level
                                                        return a.level - b.level;
                                                    })
                                                    .map((a, idx) => (
                                                        <tr
                                                            key={a._id}
                                                            className={`border-t border-zinc-100 hover:bg-zinc-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-zinc-50/50"
                                                                }`}
                                                        >
                                                            <td className="p-4 font-medium text-zinc-900">{a.partKey}</td>
                                                            <td className="p-4">
                                                                <span className="px-3 py-1 rounded-full border text-xs font-medium bg-blue-100 text-blue-800 border-blue-200">
                                                                    Level {a.level}
                                                                </span>
                                                            </td>
                                                            <td className="p-4 text-zinc-700">{a.test ?? "-"}</td>
                                                            <td className="p-4 text-zinc-700">
                                                                <span className="font-medium">{a.correct}</span>
                                                                <span className="text-zinc-500">/{a.total}</span>
                                                            </td>
                                                            <td className="p-4">
                                                                <span
                                                                    className={`px-2 py-1 rounded text-xs font-medium ${a.acc >= 0.8
                                                                            ? "bg-green-100 text-green-700"
                                                                            : a.acc >= 0.6
                                                                                ? "bg-yellow-100 text-yellow-700"
                                                                                : "bg-red-100 text-red-700"
                                                                        }`}
                                                                >
                                                                    {(a.acc * 100).toFixed(1)}%
                                                                </span>
                                                            </td>
                                                            <td className="p-4 text-zinc-700 font-mono">
                                                                {Math.floor(a.timeSec / 60)}:
                                                                {(a.timeSec % 60).toString().padStart(2, "0")}
                                                            </td>
                                                            <td className="p-4 text-xs text-zinc-500">
                                                                {new Date(a.submittedAt).toLocaleDateString("vi-VN", {
                                                                    year: "numeric",
                                                                    month: "short",
                                                                    day: "numeric",
                                                                })}
                                                            </td>
                                                            <td className="p-4">
                                                                <button
                                                                    onClick={async () => {
                                                                        if (
                                                                            !confirm(
                                                                                `Bạn có chắc muốn xóa bài practice ${a.partKey} Level ${a.level} của ${a.userName}?`
                                                                            )
                                                                        )
                                                                            return;
                                                                        try {
                                                                            await adminDeletePracticeAttempt(a._id);
                                                                            setSelectedUserPractices(
                                                                                selectedUserPractices.filter(
                                                                                    (item) => item._id !== a._id
                                                                                )
                                                                            );
                                                                            // Update main list
                                                                            setPracticeAttempts(
                                                                                practiceAttempts.filter((item) => item._id !== a._id)
                                                                            );
                                                                            setPracticeTotal(practiceTotal - 1);
                                                                            setError(undefined);
                                                                            // Reload data
                                                                            const result = await adminListPracticeAttempts({
                                                                                page: practicePage,
                                                                                limit: 1000,
                                                                            });
                                                                            setPracticeAttempts(result.items);
                                                                            setPracticeTotal(result.total);
                                                                            // Reload selected user practices
                                                                            if (selectedUserId) {
                                                                                const userResult = await adminListPracticeAttempts({
                                                                                    userId: selectedUserId,
                                                                                    limit: 1000,
                                                                                });
                                                                                setSelectedUserPractices(userResult.items);
                                                                            }
                                                                        } catch (e: any) {
                                                                            setError(e?.message || "Lỗi xóa bài practice");
                                                                        }
                                                                    }}
                                                                    className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg border border-red-200 hover:border-red-300 transition-colors flex items-center gap-1.5"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                    Xóa
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
