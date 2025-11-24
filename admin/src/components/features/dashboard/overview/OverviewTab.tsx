/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { Users, TrendingUp, BarChart3, FileText, Trash2, Wifi } from "lucide-react";
import { adminDeleteUserScore, adminOverview, adminUserScores } from "@/lib/apiClient";

interface OverviewTabProps {
    data: {
        totalUsers: number;
        avgOverall: number;
        byLevel: Record<string, number>;
        histogram: { min: number; max: number; count: number }[];
    } | null;
    onlineUsers: number;
    userScores: Array<{
        _id: string;
        name: string;
        email: string;
        level: number;
        overall: number;
        listening: number;
        reading: number;
        submittedAt: string;
    }>;
    setUserScores: (scores: any[]) => void;
    setData: (data: any) => void;
    setError: (error: string | undefined) => void;
}

export default function OverviewTab({
    data,
    onlineUsers,
    userScores,
    setUserScores,
    setData,
    setError,
}: OverviewTabProps) {
    const bars = data?.histogram || [];
    const maxCount = Math.max(1, ...bars.map((b) => b.count));
    const width = 600,
        height = 220,
        pad = 24;
    const bw = (width - pad * 2) / (bars.length || 1);

    return (
        <div className="flex-1 overflow-auto px-6 py-6">
            <div className="space-y-6">
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-blue-700 mb-1">Số người dùng</p>
                                <p className="text-3xl font-bold text-blue-900">{data?.totalUsers ?? 0}</p>
                                <p className="text-xs text-blue-600 mt-2">Có điểm Placement</p>
                            </div>
                            <div className="bg-blue-200 rounded-full p-3">
                                <Users className="h-6 w-6 text-blue-700" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl border border-teal-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-teal-700 mb-1">Điểm TOEIC TB</p>
                                <p className="text-3xl font-bold text-teal-900">
                                    {Math.round(data?.avgOverall ?? 0)}
                                </p>
                                <p className="text-xs text-teal-600 mt-2">Trung bình tổng điểm</p>
                            </div>
                            <div className="bg-teal-200 rounded-full p-3">
                                <TrendingUp className="h-6 w-6 text-teal-700" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-green-700 mb-1">Người đang online</p>
                                <p className="text-3xl font-bold text-green-900">{onlineUsers}</p>
                            </div>
                            <div className="bg-green-200 rounded-full p-3">
                                <Wifi className="h-6 w-6 text-green-700" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Histogram Chart */}
                <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <BarChart3 className="h-5 w-5 text-tealCustom" />
                        <h3 className="text-lg font-semibold text-zinc-900">Phân phối điểm (0-990)</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <svg width={width} height={height} className="block">
                            {bars.map((b, i) => {
                                const h = Math.round(((b.count || 0) / maxCount) * (height - pad * 2));
                                const x = pad + i * bw;
                                const y = height - pad - h;
                                return (
                                    <g key={i}>
                                        <rect
                                            x={x}
                                            y={y}
                                            width={bw - 8}
                                            height={h}
                                            className="fill-tealCustom hover:fill-teal-600 transition-colors"
                                            rx="4"
                                        />
                                        <text
                                            x={x + (bw - 8) / 2}
                                            y={height - pad + 14}
                                            textAnchor="middle"
                                            className="text-[10px] fill-zinc-600 font-medium"
                                        >
                                            {b.min}-{b.max === 1000 ? 990 : b.max}
                                        </text>
                                        {b.count > 0 && (
                                            <text
                                                x={x + (bw - 8) / 2}
                                                y={y - 4}
                                                textAnchor="middle"
                                                className="text-[10px] fill-zinc-700 font-semibold"
                                            >
                                                {b.count}
                                            </text>
                                        )}
                                    </g>
                                );
                            })}
                        </svg>
                    </div>
                </div>

                {/* User Scores Table */}
                <div className="bg-white rounded-xl border border-zinc-200 shadow-sm">
                    <div className="p-6 border-b border-zinc-200">
                        <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-tealCustom" />
                            <h3 className="text-lg font-semibold text-zinc-900">Điểm từng người dùng</h3>
                        </div>
                        <p className="text-sm text-zinc-600 mt-1">Sắp xếp theo điểm giảm dần</p>
                    </div>
                    <div className="overflow-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-zinc-50">
                                <tr className="text-left">
                                    <th className="p-4 font-semibold text-zinc-700">Tên</th>
                                    <th className="p-4 font-semibold text-zinc-700">Email</th>
                                    <th className="p-4 font-semibold text-zinc-700">Tổng điểm</th>
                                    <th className="p-4 font-semibold text-zinc-700">Listening</th>
                                    <th className="p-4 font-semibold text-zinc-700">Reading</th>
                                    <th className="p-4 font-semibold text-zinc-700">Ngày làm</th>
                                    <th className="p-4 font-semibold text-zinc-700">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {userScores.map((u, idx) => (
                                    <tr
                                        key={u._id}
                                        className={`border-t border-zinc-100 hover:bg-zinc-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-zinc-50/50"
                                            }`}
                                    >
                                        <td className="p-4 font-medium text-zinc-900">{u.name}</td>
                                        <td className="p-4 font-mono text-xs text-zinc-600">{u.email}</td>
                                        <td className="p-4 font-semibold text-lg text-tealCustom">{u.overall}</td>
                                        <td className="p-4 text-zinc-700">{u.listening}</td>
                                        <td className="p-4 text-zinc-700">{u.reading}</td>
                                        <td className="p-4 text-xs text-zinc-500">
                                            {new Date(u.submittedAt).toLocaleDateString("vi-VN", {
                                                year: "numeric",
                                                month: "short",
                                                day: "numeric",
                                            })}
                                        </td>
                                        <td className="p-4">
                                            <button
                                                onClick={async () => {
                                                    if (!confirm(`Bạn có chắc muốn xóa điểm của ${u.name}?`)) return;
                                                    try {
                                                        await adminDeleteUserScore(u._id);
                                                        setUserScores(userScores.filter((s) => s._id !== u._id));
                                                        setError(undefined);
                                                        // Reload data
                                                        const [overview, scores] = await Promise.all([
                                                            adminOverview(),
                                                            adminUserScores(),
                                                        ]);
                                                        const byLevel = overview.byLevel as any;
                                                        setData({
                                                            totalUsers: overview.totalUsers,
                                                            avgOverall: overview.avgOverall,
                                                            byLevel,
                                                            histogram: overview.histogram,
                                                        });
                                                        setUserScores(scores.users);
                                                    } catch (e: any) {
                                                        setError(e?.message || "Lỗi xóa điểm");
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
                                {userScores.length === 0 && (
                                    <tr>
                                        <td className="p-12 text-center text-zinc-500" colSpan={7}>
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
            </div>
        </div>
    );
}
