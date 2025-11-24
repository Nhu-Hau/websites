/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { Award, TrendingUp, Trash2 } from "lucide-react";
import { adminDeleteUserToeicPred, adminUserToeicPred } from "@/lib/apiClient";

interface ToeicPredTabProps {
    userToeicPred: Array<{
        _id: string;
        name: string;
        email: string;
        level: number;
        toeicPred: { overall: number | null; listening: number | null; reading: number | null };
    }>;
    setUserToeicPred: (data: any[]) => void;
    setError: (error: string | undefined) => void;
}

export default function ToeicPredTab({
    userToeicPred,
    setUserToeicPred,
    setError,
}: ToeicPredTabProps) {
    return (
        <div className="flex-1 overflow-auto px-6 py-6">
            <div className="space-y-6">
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-amber-200 rounded-full p-3">
                            <Award className="h-6 w-6 text-amber-700" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-amber-900">Điểm TOEIC Dự đoán</h2>
                            <p className="text-sm text-amber-700 mt-1">Dựa trên kết quả Placement Test</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-zinc-200 shadow-sm">
                    <div className="p-6 border-b border-zinc-200">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-tealCustom" />
                            <h3 className="text-lg font-semibold text-zinc-900">Bảng điểm TOEIC dự đoán</h3>
                        </div>
                        <p className="text-sm text-zinc-600 mt-1">Sắp xếp theo điểm giảm dần</p>
                    </div>
                    <div className="overflow-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-zinc-50">
                                <tr className="text-left">
                                    <th className="p-4 font-semibold text-zinc-700">Tên</th>
                                    <th className="p-4 font-semibold text-zinc-700">Email</th>
                                    <th className="p-4 font-semibold text-zinc-700">Level</th>
                                    <th className="p-4 font-semibold text-zinc-700">Tổng điểm</th>
                                    <th className="p-4 font-semibold text-zinc-700">Listening</th>
                                    <th className="p-4 font-semibold text-zinc-700">Reading</th>
                                    <th className="p-4 font-semibold text-zinc-700">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {userToeicPred.map((u, idx) => (
                                    <tr
                                        key={u._id}
                                        className={`border-t border-zinc-100 hover:bg-zinc-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-zinc-50/50"
                                            }`}
                                    >
                                        <td className="p-4 font-medium text-zinc-900">{u.name}</td>
                                        <td className="p-4 font-mono text-xs text-zinc-600">{u.email}</td>
                                        <td className="p-4">
                                            <span className="px-3 py-1 rounded-full border text-xs font-medium bg-blue-100 text-blue-800 border-blue-200">
                                                Level {u.level}
                                            </span>
                                        </td>
                                        <td className="p-4 font-semibold text-lg text-amber-600">
                                            {u.toeicPred?.overall ?? <span className="text-zinc-400">-</span>}
                                        </td>
                                        <td className="p-4 text-zinc-700">
                                            {u.toeicPred?.listening ?? <span className="text-zinc-400">-</span>}
                                        </td>
                                        <td className="p-4 text-zinc-700">
                                            {u.toeicPred?.reading ?? <span className="text-zinc-400">-</span>}
                                        </td>
                                        <td className="p-4">
                                            <button
                                                onClick={async () => {
                                                    if (
                                                        !confirm(`Bạn có chắc muốn xóa điểm TOEIC dự đoán của ${u.name}?`)
                                                    )
                                                        return;
                                                    try {
                                                        await adminDeleteUserToeicPred(u._id);
                                                        setUserToeicPred(userToeicPred.filter((s) => s._id !== u._id));
                                                        setError(undefined);
                                                        // Tải lại dữ liệu
                                                        const toeicPred = await adminUserToeicPred();
                                                        setUserToeicPred(toeicPred.users);
                                                    } catch (e: any) {
                                                        setError(e?.message || "Lỗi xóa điểm TOEIC dự đoán");
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
                                {userToeicPred.length === 0 && (
                                    <tr>
                                        <td className="p-12 text-center text-zinc-500" colSpan={7}>
                                            <div className="flex flex-col items-center gap-2">
                                                <Award className="h-8 w-8 text-zinc-300" />
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
