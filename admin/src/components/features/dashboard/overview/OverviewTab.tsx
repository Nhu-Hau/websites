/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { Users, TrendingUp, BarChart3, FileText, Trash2, Wifi, AlertCircle, Trophy } from "lucide-react";
import { adminDeleteUserScore, adminOverview, adminUserScores } from "@/lib/apiClient";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface OverviewTabProps {
    data: {
        totalUsers: number;
        avgOverall: number;
        byLevel: Record<string, number>;
        histogram: { min: number; max: number; count: number }[];
    } | null;
    onlineUsers: number;
    totalSystemUsers: number;
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
    totalSystemUsers,
    userScores,
    setUserScores,
    setData,
    setError,
}: OverviewTabProps) {
    const bars = data?.histogram || [];
    const maxCount = Math.max(1, ...bars.map((b) => b.count));
    const width = 700;
    const height = 260;
    const pad = 32;
    const bw = (width - pad * 2) / (bars.length || 1);

    const points = bars.map((b, i) => {
        const h = ((b.count || 0) / maxCount) * (height - pad * 2);
        const x = pad + i * bw + bw / 2;
        const y = height - pad - h;
        return { x, y, count: b.count, label: `${b.min}-${b.max}` };
    });

    const pathD = points.length > 0
        ? points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(" ")
        : "";

    const areaD = points.length > 0
        ? `${pathD} L ${points[points.length - 1].x} ${height - pad} L ${points[0].x} ${height - pad} Z`
        : "";

    // Find user with highest score
    const highestScoreUser = userScores.length > 0
        ? userScores.reduce((prev, current) => (prev.overall > current.overall ? prev : current))
        : null;

    const handleDelete = async (userId: string, name: string) => {
        if (!confirm(`Xóa điểm của "${name}"?\nHành động này không thể hoàn tác.`)) return;

        try {
            await adminDeleteUserScore(userId);
            setUserScores(userScores.filter((s) => s._id !== userId));

            const [overview, scores] = await Promise.all([adminOverview(), adminUserScores()]);
            setData({
                totalUsers: overview.totalUsers,
                avgOverall: overview.avgOverall,
                byLevel: overview.byLevel,
                histogram: overview.histogram,
            });
            setUserScores(scores.users);
            setError(undefined);
        } catch (e: any) {
            setError(e?.message || "Xóa thất bại");
        }
    };

    return (
        <div className="flex-1 overflow-y-auto px-4 py-6 lg:px-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header Title */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-zinc-800">Tổng quan hệ thống Placement TOEIC</h1>
                    <p className="text-zinc-500 mt-2">Thống kê thời gian thực • Cập nhật mỗi 30 giây</p>
                </div>

                {/* Stats Cards - Glassmorphism Style */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {/* Total Users */}
                    <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-lg hover:shadow-2xl transition-all duration-300">
                        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
                        <div className="relative flex items-center justify-between">
                            <div>
                                <p className="text-blue-100 text-sm font-medium">Tổng người dùng</p>
                                <p className="text-4xl font-bold mt-2">{data?.totalUsers ?? 0} / {totalSystemUsers}</p>
                                <p className="text-blue-100 text-xs mt-3 opacity-90">Có điểm / Tổng user</p>
                            </div>
                            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur">
                                <Users className="h-9 w-9" />
                            </div>
                        </div>
                    </div>

                    {/* Online Users */}
                    <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 p-6 text-white shadow-lg hover:shadow-2xl transition-all duration-300">
                        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
                        <div className="relative flex items-center justify-between">
                            <div>
                                <p className="text-purple-100 text-sm font-medium">Đang online</p>
                                <p className="text-4xl font-bold mt-2">{onlineUsers}</p>
                                <div className="flex items-center gap-2 mt-3">
                                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                                    <span className="text-purple-100 text-xs opacity-90">Hoạt động</span>
                                </div>
                            </div>
                            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur">
                                <Wifi className="h-9 w-9" />
                            </div>
                        </div>
                    </div>

                    {/* Average Score */}
                    <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white shadow-lg hover:shadow-2xl transition-all duration-300">
                        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
                        <div className="relative flex items-center justify-between">
                            <div>
                                <p className="text-emerald-100 text-sm font-medium">Điểm trung bình</p>
                                <p className="text-4xl font-bold mt-2">{Math.round(data?.avgOverall ?? 0)}</p>
                                <p className="text-emerald-100 text-xs mt-3 opacity-90">TOEIC Overall</p>
                            </div>
                            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur">
                                <TrendingUp className="h-9 w-9" />
                            </div>
                        </div>
                    </div>

                    {/* Highest Score */}
                    <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 p-6 text-white shadow-lg hover:shadow-2xl transition-all duration-300">
                        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
                        <div className="relative flex items-center justify-between">
                            <div>
                                <p className="text-orange-100 text-sm font-medium">Điểm cao nhất</p>
                                <p className="text-4xl font-bold mt-2">{highestScoreUser?.overall ?? 0}</p>
                                <p className="text-orange-100 text-xs mt-3 opacity-90 truncate max-w-[150px]" title={highestScoreUser?.name}>
                                    {highestScoreUser ? highestScoreUser.name : "Chưa có dữ liệu"}
                                </p>
                            </div>
                            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur">
                                <Trophy className="h-9 w-9" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Histogram Chart - Line Chart */}
                <div className="bg-white/70 backdrop-blur-lg border border-zinc-200/80 rounded-2xl shadow-xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <BarChart3 className="h-6 w-6 text-teal-600" />
                            <h3 className="text-xl font-bold text-zinc-800">Phân phối điểm số TOEIC (0–990)</h3>
                        </div>
                        <span className="text-xs text-zinc-500 bg-zinc-100 px-3 py-1 rounded-full">
                            Tổng: {data?.totalUsers ?? 0} người
                        </span>
                    </div>

                    <div className="overflow-x-auto pb-4">
                        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="mx-auto">
                            {/* Grid lines */}
                            <line x1={pad} y1={pad} x2={pad} y2={height - pad} stroke="#e4e4e7" strokeWidth="1.5" />
                            <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="#e4e4e7" strokeWidth="1.5" />

                            {/* Area fill */}
                            <path d={areaD} className="fill-teal-100/50" />

                            {/* Line */}
                            <path d={pathD} fill="none" stroke="#0d9488" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                            {points.map((p, i) => (
                                <g key={i}>
                                    {/* Point */}
                                    <circle
                                        cx={p.x}
                                        cy={p.y}
                                        r="4"
                                        className="fill-white stroke-teal-600 stroke-2 hover:r-6 transition-all cursor-pointer"
                                    >
                                        <title>{`${p.label}: ${p.count} người`}</title>
                                    </circle>

                                    {/* Count Label */}
                                    {p.count > 0 && (
                                        <text
                                            x={p.x}
                                            y={p.y - 12}
                                            textAnchor="middle"
                                            className="text-xs font-bold fill-teal-700"
                                        >
                                            {p.count}
                                        </text>
                                    )}
                                    {/* X-axis label */}
                                    <text
                                        x={p.x}
                                        y={height - 8}
                                        textAnchor="middle"
                                        className="text-[10px] fill-zinc-600 font-medium"
                                    >
                                        {p.label}
                                    </text>
                                </g>
                            ))}
                        </svg>
                    </div>
                </div>

                {/* User Scores Table - Modern Table */}
                <div className="bg-white/70 backdrop-blur-lg border border-zinc-200/80 rounded-2xl shadow-xl overflow-hidden">
                    <div className="p-6 border-b border-zinc-200 bg-gradient-to-r from-teal-50 to-blue-50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <FileText className="h-6 w-6 text-teal-600" />
                                <h3 className="text-xl font-bold text-zinc-800">Danh sách kết quả người dùng</h3>
                            </div>
                            <span className="text-sm font-medium text-teal-700 bg-teal-100 px-4 py-1.5 rounded-full">
                                {userScores.length} kết quả
                            </span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        {userScores.length === 0 ? (
                            <div className="p-20 text-center">
                                <FileText className="h-16 w-16 text-zinc-300 mx-auto mb-4" />
                                <p className="text-zinc-500 font-medium">Chưa có dữ liệu placement</p>
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead className="bg-zinc-50/80 text-xs uppercase tracking-wider text-zinc-600">
                                    <tr>
                                        <th className="px-6 py-4 text-left font-semibold">Họ tên</th>
                                        <th className="px-6 py-4 text-left font-semibold">Email</th>
                                        <th className="px-6 py-4 text-center font-semibold">Tổng điểm</th>
                                        <th className="px-6 py-4 text-center font-semibold">Listening</th>
                                        <th className="px-6 py-4 text-center font-semibold">Reading</th>
                                        <th className="px-6 py-4 text-left font-semibold">Ngày nộp</th>
                                        <th className="px-6 py-4 text-center font-semibold">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100">
                                    {userScores.map((u, idx) => (
                                        <tr
                                            key={u._id}
                                            className="hover:bg-zinc-50/70 transition-colors duration-150"
                                        >
                                            <td className="px-6 py-5 font-medium text-zinc-900">{u.name}</td>
                                            <td className="px-6 py-5 text-sm font-mono text-zinc-600">{u.email}</td>
                                            <td className="px-6 py-5 text-center">
                                                <span className="inline-flex items-center px-4 py-2 rounded-full text-lg font-bold bg-teal-100 text-teal-700">
                                                    {u.overall}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-center font-semibold text-zinc-700">{u.listening}</td>
                                            <td className="px-6 py-5 text-center font-semibold text-zinc-700">{u.reading}</td>
                                            <td className="px-6 py-5 text-sm text-zinc-500">
                                                {format(new Date(u.submittedAt), "dd MMM yyyy", { locale: vi })}
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <button
                                                    onClick={() => handleDelete(u._id, u.name)}
                                                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors duration-200 border border-red-200"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    Xóa
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}