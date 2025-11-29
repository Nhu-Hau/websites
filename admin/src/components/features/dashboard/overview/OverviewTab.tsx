/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { Users, TrendingUp, BarChart3, FileText, Trash2, Wifi, Trophy } from "lucide-react";
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
        currentToeicScore: number | null;
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
    const [width, setWidth] = React.useState(0);
    const containerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (!containerRef.current) return;
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                if (entry.contentRect.width > 0) {
                    setWidth(entry.contentRect.width);
                }
            }
        });
        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    const chartWidth = width > 0 ? width : 1200; // Fallback width
    const height = 260;
    const pad = 48;

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

                {/* Comparison Chart - Line Chart */}
                <div className="bg-white/70 backdrop-blur-lg border border-zinc-200/80 rounded-2xl shadow-xl p-6">
                    <div className="flex flex-col items-center gap-2 mb-6">
                        <div className="flex items-center gap-3">
                            <TrendingUp className="h-6 w-6 text-blue-600" />
                            <h3 className="text-xl font-bold text-zinc-800">So sánh: Điểm dự đoán vs Tự báo cáo</h3>
                        </div>
                        <span className="text-xs text-zinc-500 bg-zinc-100 px-3 py-1 rounded-full">
                            Dữ liệu: {userScores.filter(u => u.currentToeicScore !== null).length} người dùng
                        </span>
                    </div>

                    <div className="overflow-x-auto pb-4" ref={containerRef}>
                        <svg width={chartWidth} height={height} viewBox={`0 0 ${chartWidth} ${height}`} className="mx-auto">
                            {/* Grid lines */}
                            <line x1={pad} y1={pad} x2={pad} y2={height - pad} stroke="#e4e4e7" strokeWidth="1.5" />
                            <line x1={pad} y1={height - pad} x2={chartWidth - pad} y2={height - pad} stroke="#e4e4e7" strokeWidth="1.5" />

                            {/* Y-axis Labels (Scores) */}
                            {[0, 200, 400, 600, 800, 990].map((score) => {
                                const y = height - pad - (score / 990) * (height - pad * 2);
                                return (
                                    <g key={score}>
                                        <line x1={pad} y1={y} x2={chartWidth - pad} y2={y} stroke="#e4e4e7" strokeWidth="1" strokeDasharray="4,4" className="opacity-30" />
                                        <text x={pad - 10} y={y + 3} textAnchor="end" className="text-[10px] fill-zinc-400">{score}</text>
                                    </g>
                                );
                            })}

                            {(() => {
                                const validUsers = userScores.filter(u => u.currentToeicScore !== null);
                                const count = validUsers.length;
                                if (count === 0) return <text x={chartWidth / 2} y={height / 2} textAnchor="middle" className="fill-zinc-400">Chưa có dữ liệu so sánh</text>;

                                const step = (chartWidth - pad * 2) / Math.max(1, count - 1);

                                const getPoints = (getter: (u: any) => number) =>
                                    validUsers.map((u, i) => {
                                        const x = pad + i * step;
                                        const y = height - pad - (getter(u) / 990) * (height - pad * 2);
                                        return `${x},${y}`;
                                    }).join(" ");

                                const predictedPoints = getPoints(u => u.overall);
                                const selfReportedPoints = getPoints(u => u.currentToeicScore || 0);

                                return (
                                    <>
                                        {/* Predicted Line */}
                                        <polyline points={predictedPoints} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-sm" />

                                        {/* Self Reported Line */}
                                        <polyline points={selfReportedPoints} fill="none" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4,4" className="drop-shadow-sm" />

                                        {/* Points and Tooltips */}
                                        {validUsers.map((u, i) => {
                                            const x = pad + i * step;
                                            const yPred = height - pad - (u.overall / 990) * (height - pad * 2);
                                            const ySelf = height - pad - ((u.currentToeicScore || 0) / 990) * (height - pad * 2);

                                            return (
                                                <g key={u._id} className="group/point">
                                                    {/* Vertical hover line */}
                                                    <line x1={x} y1={pad} x2={x} y2={height - pad} stroke="#e4e4e7" strokeWidth="1" className="opacity-0 group-hover/point:opacity-100 transition-opacity" />

                                                    {/* Predicted Point */}
                                                    <circle cx={x} cy={yPred} r="4" className="fill-white stroke-indigo-500 stroke-2 hover:r-6 transition-all cursor-pointer" />

                                                    {/* Self Point */}
                                                    <circle cx={x} cy={ySelf} r="4" className="fill-white stroke-rose-500 stroke-2 hover:r-6 transition-all cursor-pointer" />

                                                    <title>{`${u.name}\nEmail: ${u.email}\nDự đoán: ${u.overall}\nTự báo cáo: ${u.currentToeicScore}`}</title>
                                                </g>
                                            );
                                        })}
                                    </>
                                );
                            })()}
                        </svg>
                        <div className="flex justify-center gap-6 mt-4 text-xs text-zinc-600">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-indigo-500"></span>
                                <span className="font-medium">Dự đoán</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                                <span className="font-medium">Tự báo cáo</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Deviation Chart - Scatter Plot */}
                <div className="bg-white/70 backdrop-blur-lg border border-zinc-200/80 rounded-2xl shadow-xl p-6">
                    <div className="flex flex-col items-center gap-2 mb-6">
                        <div className="flex items-center gap-3">
                            <BarChart3 className="h-6 w-6 text-indigo-600" />
                            <h3 className="text-xl font-bold text-zinc-800">Độ lệch: Điểm dự đoán vs Tự báo cáo</h3>
                        </div>
                        <span className="text-xs text-zinc-500 bg-zinc-100 px-3 py-1 rounded-full">
                            Dữ liệu: {userScores.filter(u => u.currentToeicScore !== null).length} người dùng
                        </span>
                    </div>

                    <div className="overflow-x-auto pb-4">
                        <svg width={chartWidth} height={height} viewBox={`0 0 ${chartWidth} ${height}`} className="mx-auto">
                            {/* Grid lines */}
                            <line x1={pad} y1={pad} x2={pad} y2={height - pad} stroke="#e4e4e7" strokeWidth="1.5" />
                            <line x1={pad} y1={height - pad} x2={chartWidth - pad} y2={height - pad} stroke="#e4e4e7" strokeWidth="1.5" />

                            {/* Axis Labels */}
                            <text x={chartWidth / 2} y={height - 2} textAnchor="middle" className="text-xs fill-zinc-500 font-medium">Điểm tự báo cáo</text>
                            <text x={15} y={height / 2} textAnchor="middle" transform={`rotate(-90, 15, ${height / 2})`} className="text-xs fill-zinc-500 font-medium">Điểm dự đoán</text>

                            {/* Ticks for X and Y */}
                            {[0, 200, 400, 600, 800, 990].map((score) => {
                                const pos = (score / 990) * (chartWidth - pad * 2);
                                const x = pad + pos;
                                const y = height - pad - (score / 990) * (height - pad * 2);
                                return (
                                    <g key={score}>
                                        {/* X-axis ticks (Self-reported) */}
                                        <text x={x} y={height - pad + 15} textAnchor="middle" className="text-[10px] fill-zinc-400">{score}</text>
                                        <line x1={x} y1={height - pad} x2={x} y2={height - pad + 5} stroke="#e4e4e7" strokeWidth="1" />

                                        {/* Y-axis ticks (Predicted) */}
                                        <text x={pad - 8} y={y + 3} textAnchor="end" className="text-[10px] fill-zinc-400">{score}</text>
                                        <line x1={pad - 5} y1={y} x2={pad} y2={y} stroke="#e4e4e7" strokeWidth="1" />

                                        {/* Grid lines (optional, light) */}
                                        <line x1={x} y1={pad} x2={x} y2={height - pad} stroke="#e4e4e7" strokeWidth="0.5" className="opacity-20" />
                                        <line x1={pad} y1={y} x2={chartWidth - pad} y2={y} stroke="#e4e4e7" strokeWidth="0.5" className="opacity-20" />
                                    </g>
                                );
                            })}

                            {/* Diagonal Line (Perfect Match) */}
                            <line x1={pad} y1={height - pad} x2={chartWidth - pad} y2={pad} stroke="#e4e4e7" strokeWidth="2" strokeDasharray="5,5" />
                            {/* Points */}
                            {userScores.filter(u => u.currentToeicScore !== null).map((u, i) => {
                                const x = pad + ((u.currentToeicScore || 0) / 990) * (chartWidth - pad * 2);
                                const y = height - pad - ((u.overall / 990) * (height - pad * 2));
                                const diff = u.overall - (u.currentToeicScore || 0);
                                const absDiff = Math.abs(diff);
                                let color = "#ef4444"; // > 80 (Red)
                                if (absDiff <= 20) color = "#10b981"; // <= 20 (Emerald)
                                else if (absDiff <= 40) color = "#06b6d4"; // <= 40 (Cyan)
                                else if (absDiff <= 60) color = "#3b82f6"; // <= 60 (Blue)
                                else if (absDiff <= 80) color = "#f59e0b"; // <= 80 (Amber)

                                return (
                                    <g key={u._id}>
                                        <circle
                                            cx={x}
                                            cy={y}
                                            r="5"
                                            fill={color}
                                            className="opacity-80 hover:opacity-100 transition-opacity cursor-pointer stroke-white stroke-1"
                                        >
                                            <title>{`${u.name}\nEmail: ${u.email}\nTự báo cáo: ${u.currentToeicScore}\nDự đoán: ${u.overall}\nChênh lệch: ${diff > 0 ? '+' : ''}${diff}`}</title>
                                        </circle>
                                    </g>
                                );
                            })}
                        </svg>
                        <div className="flex flex-wrap justify-center gap-4 mt-4 text-xs text-zinc-600">
                            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500"></span>≤ 20</div>
                            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-cyan-500"></span>≤ 40</div>
                            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500"></span>≤ 60</div>
                            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-500"></span>≤ 80</div>
                            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500"></span>&gt; 80</div>
                        </div>
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
                                        <th className="px-6 py-4 text-center font-semibold">Điểm tự báo cáo</th>
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
                                            <td className="px-6 py-5 text-center">
                                                {u.currentToeicScore ? (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                                                        {u.currentToeicScore}
                                                    </span>
                                                ) : (
                                                    <span className="text-zinc-400 text-sm italic">--</span>
                                                )}
                                            </td>
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