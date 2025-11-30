/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { Activity, Trash2 } from "lucide-react";
import { AdminPlacementAttempt, adminDeletePlacementAttempt } from "@/lib/apiClient";

interface PlacementTabProps {
    placementAttempts: AdminPlacementAttempt[];
    placementTotal: number;
    placementPage: number;
    setPlacementPage: (page: number | ((prev: number) => number)) => void;
    setPlacementAttempts: (attempts: AdminPlacementAttempt[]) => void;
    setPlacementTotal: (total: number) => void;
    setError: (error: string | undefined) => void;
}

export default function PlacementTab({
    placementAttempts,
    placementTotal,
    placementPage,
    setPlacementPage,
    setPlacementAttempts,
    setPlacementTotal,
    setError,
}: PlacementTabProps) {
    return (
        <div className="flex-1 overflow-auto px-6 py-6">
            <div className="space-y-6">
                <div className="bg-white rounded-xl border border-zinc-200 shadow-sm">
                    <div className="p-6 border-b border-zinc-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Activity className="h-5 w-5 text-tealCustom" />
                                <h3 className="text-lg font-semibold text-zinc-900">Quản lý Placement</h3>
                            </div>
                            <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm font-medium">
                                Tổng: {placementTotal} bài
                            </span>
                        </div>
                    </div>
                    <div className="overflow-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-zinc-50">
                                <tr className="text-left">
                                    <th className="p-4 font-semibold text-zinc-700">Người dùng</th>
                                    <th className="p-4 font-semibold text-zinc-700">Email</th>
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
                                {placementAttempts.map((a, idx) => (
                                    <tr
                                        key={a._id}
                                        className={`border-t border-zinc-100 hover:bg-zinc-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-zinc-50/50"
                                            }`}
                                    >
                                        <td className="p-4 font-medium text-zinc-900">{a.userName}</td>
                                        <td className="p-4 font-mono text-xs text-zinc-600">{a.userEmail}</td>
                                        <td className="p-4">
                                            <span className="px-3 py-1 rounded-full border text-xs font-medium bg-blue-100 text-blue-800 border-blue-200 whitespace-nowrap">
                                                Level {a.level}
                                            </span>
                                        </td>
                                        <td className="p-4 font-semibold text-lg text-tealCustom">{a.overall}</td>
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
                                            {(() => {
                                                const accPercent = a.acc > 1 ? a.acc : a.acc * 100;
                                                return (
                                                    <span
                                                        className={`px-2 py-1 rounded text-xs font-medium ${accPercent >= 80
                                                            ? "bg-green-100 text-green-700"
                                                            : accPercent >= 60
                                                                ? "bg-yellow-100 text-yellow-700"
                                                                : "bg-red-100 text-red-700"
                                                            }`}
                                                    >
                                                        {accPercent.toFixed(1)}%
                                                    </span>
                                                );
                                            })()}
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
                                                            `Bạn có chắc muốn xóa bài làm placement của ${a.userName}?`
                                                        )
                                                    )
                                                        return;
                                                    try {
                                                        await adminDeletePlacementAttempt(a._id);
                                                        setPlacementAttempts(
                                                            placementAttempts.filter((item) => item._id !== a._id)
                                                        );
                                                        setPlacementTotal(placementTotal - 1);
                                                        setError(undefined);
                                                    } catch (e: any) {
                                                        setError(e?.message || "Lỗi xóa bài làm placement");
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
                                {placementAttempts.length === 0 && (
                                    <tr>
                                        <td className="p-12 text-center text-zinc-500" colSpan={9}>
                                            <div className="flex flex-col items-center gap-2">
                                                <Activity className="h-8 w-8 text-zinc-300" />
                                                <p>Chưa có dữ liệu</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {placementTotal > 20 && (
                        <div className="p-4 border-t border-zinc-200 flex gap-2 justify-center items-center">
                            <button
                                onClick={() => setPlacementPage((p) => Math.max(1, p - 1))}
                                disabled={placementPage === 1}
                                className="px-4 py-2 border border-zinc-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-50 transition-colors"
                            >
                                Trước
                            </button>
                            <span className="px-4 py-2 text-sm text-zinc-600">
                                Trang {placementPage} / {Math.ceil(placementTotal / 20)}
                            </span>
                            <button
                                onClick={() => setPlacementPage((p) => p + 1)}
                                disabled={placementPage >= Math.ceil(placementTotal / 20)}
                                className="px-4 py-2 border border-zinc-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-50 transition-colors"
                            >
                                Sau
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
