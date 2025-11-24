/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { TrendingUp, Trash2, X } from "lucide-react";
import {
    AdminProgressAttempt,
    adminDeleteProgressAttempt,
    adminListProgressAttempts,
} from "@/lib/apiClient";

interface ProgressTabProps {
    progressAttempts: AdminProgressAttempt[];
    progressTotal: number;
    progressPage: number;
    setProgressAttempts: (attempts: AdminProgressAttempt[]) => void;
    setProgressTotal: (total: number) => void;
    setError: (error: string | undefined) => void;
    selectedProgressUserId: string | null;
    setSelectedProgressUserId: (id: string | null) => void;
    selectedUserProgresses: AdminProgressAttempt[];
    setSelectedUserProgresses: (attempts: AdminProgressAttempt[]) => void;
    loadingUserProgresses: boolean;
}

export default function ProgressTab({
    progressAttempts,
    progressTotal,
    progressPage,
    setProgressAttempts,
    setProgressTotal,
    setError,
    selectedProgressUserId,
    setSelectedProgressUserId,
    selectedUserProgresses,
    setSelectedUserProgresses,
    loadingUserProgresses,
}: ProgressTabProps) {
    return (
        <div className="flex-1 overflow-auto px-6 py-6">
            <div className="space-y-6">
                <div className="bg-white rounded-xl border border-zinc-200 shadow-sm">
                    <div className="p-6 border-b border-zinc-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-tealCustom" />
                                <h3 className="text-lg font-semibold text-zinc-900">Quản lý Progress</h3>
                            </div>
                            <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm font-medium">
                                Tổng: {progressTotal} bài
                            </span>
                        </div>
                    </div>
                    <div className="overflow-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-zinc-50">
                                <tr className="text-left">
                                    <th className="p-4 font-semibold text-zinc-700">Người dùng</th>
                                    <th className="p-4 font-semibold text-zinc-700">Email</th>
                                    <th className="p-4 font-semibold text-zinc-700">Số bài Progress</th>
                                    <th className="p-4 font-semibold text-zinc-700">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(() => {
                                    // Group progress attempts theo user
                                    const userMap = new Map<
                                        string,
                                        {
                                            userId: string;
                                            userName: string;
                                            userEmail: string;
                                            attempts: AdminProgressAttempt[];
                                        }
                                    >();
                                    progressAttempts.forEach((a) => {
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
                                                        onClick={() => setSelectedProgressUserId(user.userId)}
                                                        className="px-4 py-2 text-sm border border-tealCustom text-tealCustom rounded-lg hover:bg-teal-50 transition-colors font-medium"
                                                    >
                                                        Xem chi tiết
                                                    </button>
                                                    <button
                                                        onClick={async () => {
                                                            if (
                                                                !confirm(
                                                                    `Bạn có chắc muốn xóa tất cả ${user.attempts.length} bài progress của ${user.userName}?`
                                                                )
                                                            )
                                                                return;
                                                            try {
                                                                // Xóa tất cả attempts của user
                                                                await Promise.all(
                                                                    user.attempts.map((a) => adminDeleteProgressAttempt(a._id))
                                                                );
                                                                setProgressAttempts(
                                                                    progressAttempts.filter((a) => a.userId !== user.userId)
                                                                );
                                                                setProgressTotal(progressTotal - user.attempts.length);
                                                                setError(undefined);
                                                                // Reload data
                                                                const result = await adminListProgressAttempts({
                                                                    page: progressPage,
                                                                    limit: 1000,
                                                                });
                                                                setProgressAttempts(result.items);
                                                                setProgressTotal(result.total);
                                                            } catch (e: any) {
                                                                setError(e?.message || "Lỗi xóa bài progress");
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
                                {progressAttempts.length === 0 && (
                                    <tr>
                                        <td className="p-12 text-center text-zinc-500" colSpan={4}>
                                            <div className="flex flex-col items-center gap-2">
                                                <TrendingUp className="h-8 w-8 text-zinc-300" />
                                                <p>Chưa có dữ liệu</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Modal hiển thị bài progress của user */}
                {selectedProgressUserId && (
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        style={{ animation: "fadeIn 0.2s ease-out" }}
                        onClick={() => setSelectedProgressUserId(null)}
                    >
                        <div
                            className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col"
                            style={{ animation: "slideUp 0.3s ease-out" }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-zinc-200 flex justify-between items-center bg-gradient-to-r from-teal-50 to-blue-50">
                                <div className="flex items-center gap-3">
                                    <div className="bg-tealCustom rounded-full p-2">
                                        <TrendingUp className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-zinc-900">
                                            Bài Progress của {selectedUserProgresses[0]?.userName || "User"}
                                        </h3>
                                        <p className="text-sm text-zinc-600 mt-1">
                                            {selectedUserProgresses.length} bài progress
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedProgressUserId(null)}
                                    className="text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 rounded-full p-2 transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <div className="p-6 overflow-auto flex-1">
                                {loadingUserProgresses ? (
                                    <div className="text-center py-12">
                                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-tealCustom mx-auto mb-4"></div>
                                        <p className="text-zinc-500">Đang tải...</p>
                                    </div>
                                ) : selectedUserProgresses.length === 0 ? (
                                    <div className="text-center py-12">
                                        <TrendingUp className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
                                        <p className="text-zinc-500">Chưa có bài progress nào</p>
                                    </div>
                                ) : (
                                    <div className="overflow-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-zinc-50 sticky top-0">
                                                <tr className="text-left">
                                                    <th className="p-4 font-semibold text-zinc-700">Level</th>
                                                    <th className="p-4 font-semibold text-zinc-700">Tổng điểm</th>
                                                    <th className="p-4 font-semibold text-zinc-700">Listening</th>
                                                    <th className="p-4 font-semibold text-zinc-700">Reading</th>
                                                    <th className="p-4 font-semibold text-zinc-700">Độ chính xác</th>
                                                    <th className="p-4 font-semibold text-zinc-700">Ngày làm</th>
                                                    <th className="p-4 font-semibold text-zinc-700">Thao tác</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedUserProgresses
                                                    .sort((a, b) => a.level - b.level)
                                                    .map((a, idx) => (
                                                        <tr
                                                            key={a._id}
                                                            className={`border-t border-zinc-100 hover:bg-zinc-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-zinc-50/50"
                                                                }`}
                                                        >
                                                            <td className="p-4">
                                                                <span className="px-3 py-1 rounded-full border text-xs font-medium bg-blue-100 text-blue-800 border-blue-200">
                                                                    Level {a.level}
                                                                </span>
                                                            </td>
                                                            <td className="p-4 font-semibold text-lg text-tealCustom">
                                                                {a.overall}
                                                            </td>
                                                            <td className="p-4 text-zinc-700">
                                                                <span className="font-medium">{a.listening.score}</span>
                                                                <span className="text-zinc-500 text-xs ml-1">
                                                                    ({a.listening.correct}/{a.listening.total})
                                                                </span>
                                                            </td>
                                                            <td className="p-4 text-zinc-700">
                                                                <span className="font-medium">{a.reading.score}</span>
                                                                <span className="text-zinc-500 text-xs ml-1">
                                                                    ({a.reading.correct}/{a.reading.total})
                                                                </span>
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
                                                                                `Bạn có chắc muốn xóa bài progress Level ${a.level} của ${a.userName}?`
                                                                            )
                                                                        )
                                                                            return;
                                                                        try {
                                                                            await adminDeleteProgressAttempt(a._id);
                                                                            setSelectedUserProgresses(
                                                                                selectedUserProgresses.filter(
                                                                                    (item) => item._id !== a._id
                                                                                )
                                                                            );
                                                                            // Update main list
                                                                            setProgressAttempts(
                                                                                progressAttempts.filter((item) => item._id !== a._id)
                                                                            );
                                                                            setProgressTotal(progressTotal - 1);
                                                                            setError(undefined);
                                                                            // Reload data
                                                                            const result = await adminListProgressAttempts({
                                                                                page: progressPage,
                                                                                limit: 1000,
                                                                            });
                                                                            setProgressAttempts(result.items);
                                                                            setProgressTotal(result.total);
                                                                            // Reload selected user progresses
                                                                            if (selectedProgressUserId) {
                                                                                const userResult = await adminListProgressAttempts({
                                                                                    userId: selectedProgressUserId,
                                                                                    limit: 1000,
                                                                                });
                                                                                setSelectedUserProgresses(userResult.items);
                                                                            }
                                                                        } catch (e: any) {
                                                                            setError(e?.message || "Lỗi xóa bài progress");
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
