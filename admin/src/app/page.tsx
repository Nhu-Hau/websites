/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { adminOverview, adminUserScores, adminUserToeicPred, adminListPlacementAttempts, adminListProgressAttempts, adminListPracticeAttempts, AdminPlacementAttempt, AdminProgressAttempt, AdminPracticeAttempt, adminVisitorCount, adminOnlineUsersCount, adminDeletePlacementAttempt, adminDeleteProgressAttempt, adminDeletePracticeAttempt, adminDeleteUserScore, adminDeleteUserToeicPred } from "@/lib/apiClient";
import { Users, TrendingUp, BarChart3, FileText, Activity, Award, X, Eye, Wifi, Trash2 } from "lucide-react";
import { useSocket } from "@/hooks/useSocket";

export default function Home() {
  const [me, setMe] = React.useState<{ id: string; role?: string } | null>(null);
  const [loadingMe, setLoadingMe] = React.useState(true);
  const [data, setData] = React.useState<{ totalUsers: number; avgOverall: number; byLevel: Record<string, number>; histogram: { min: number; max: number; count: number }[] } | null>(null);
  const [userScores, setUserScores] = React.useState<Array<{ _id: string; name: string; email: string; level: number; overall: number; listening: number; reading: number; submittedAt: string }>>([]);
  const [userToeicPred, setUserToeicPred] = React.useState<Array<{ _id: string; name: string; email: string; level: number; toeicPred: { overall: number | null; listening: number | null; reading: number | null } }>>([]);
  const [placementAttempts, setPlacementAttempts] = React.useState<AdminPlacementAttempt[]>([]);
  const [progressAttempts, setProgressAttempts] = React.useState<AdminProgressAttempt[]>([]);
  const [practiceAttempts, setPracticeAttempts] = React.useState<AdminPracticeAttempt[]>([]);
  const [placementPage, setPlacementPage] = React.useState(1);
  const [progressPage, setProgressPage] = React.useState(1);
  const [practicePage, setPracticePage] = React.useState(1);
  const [placementTotal, setPlacementTotal] = React.useState(0);
  const [progressTotal, setProgressTotal] = React.useState(0);
  const [practiceTotal, setPracticeTotal] = React.useState(0);
  const [error, setError] = React.useState<string|undefined>(undefined);
  const [activeTab, setActiveTab] = React.useState<'overview' | 'placement' | 'progress' | 'practice' | 'toeic-pred'>('overview');
  const [selectedUserId, setSelectedUserId] = React.useState<string | null>(null);
  const [selectedUserPractices, setSelectedUserPractices] = React.useState<AdminPracticeAttempt[]>([]);
  const [loadingUserPractices, setLoadingUserPractices] = React.useState(false);
  const [selectedProgressUserId, setSelectedProgressUserId] = React.useState<string | null>(null);
  const [selectedUserProgresses, setSelectedUserProgresses] = React.useState<AdminProgressAttempt[]>([]);
  const [loadingUserProgresses, setLoadingUserProgresses] = React.useState(false);
  const [visitorCount, setVisitorCount] = React.useState<{ totalVisits: number; uniqueVisitorsLast30Days: number } | null>(null);
  const [onlineUsers, setOnlineUsers] = React.useState<number>(0);
  const { socket, connected } = useSocket();

  React.useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/admin-auth/me", { credentials: "include", cache: "no-store" });
        if (r.ok) {
          const j = await r.json();
          setMe({ id: j?.id, role: j?.role });
        } else {
          setMe(null);
        }
      } finally {
        setLoadingMe(false);
      }
    })();
  }, []);

  React.useEffect(() => {
    (async () => {
      if (me?.role !== 'admin') return;
      try {
        const [overview, scores, toeicPred, visitorData, onlineData] = await Promise.all([
          adminOverview(),
          adminUserScores(),
          adminUserToeicPred(),
          adminVisitorCount(),
          adminOnlineUsersCount()
        ]);
        const byLevel = (overview.byLevel as any);
        setData({ totalUsers: overview.totalUsers, avgOverall: overview.avgOverall, byLevel, histogram: overview.histogram });
        setUserScores(scores.users);
        setUserToeicPred(toeicPred.users);
        setVisitorCount(visitorData);
        setOnlineUsers(onlineData.onlineUsers);
      } catch (e: any) {
        setError(e?.message || 'Lỗi tải dữ liệu');
      }
    })();
  }, [me]);

  // Realtime online users via socket
  React.useEffect(() => {
    if (me?.role !== 'admin' || !socket) return;

    // Join admin room khi socket connected
    if (connected) {
      socket.emit("admin:join");
    }

    // Listen for realtime updates
    const handleOnlineUsersUpdate = (data: { onlineUsers: number }) => {
      setOnlineUsers(data.onlineUsers);
    };

    socket.on("admin:online-users-update", handleOnlineUsersUpdate);

    return () => {
      socket.off("admin:online-users-update", handleOnlineUsersUpdate);
    };
  }, [socket, connected, me]);

  React.useEffect(() => {
    (async () => {
      if (me?.role !== 'admin' || activeTab !== 'placement') return;
      try {
        const result = await adminListPlacementAttempts({ page: placementPage, limit: 20 });
        setPlacementAttempts(result.items);
        setPlacementTotal(result.total);
      } catch (e: any) {
        setError(e?.message || 'Lỗi tải placement attempts');
      }
    })();
  }, [me, activeTab, placementPage]);

  React.useEffect(() => {
    (async () => {
      if (me?.role !== 'admin' || activeTab !== 'progress') return;
      try {
        const result = await adminListProgressAttempts({ page: progressPage, limit: 1000 }); // Lấy tất cả để group theo user
        setProgressAttempts(result.items);
        setProgressTotal(result.total);
      } catch (e: any) {
        setError(e?.message || 'Lỗi tải progress attempts');
      }
    })();
  }, [me, activeTab, progressPage]);

  // Fetch progress attempts của user được chọn
  React.useEffect(() => {
    (async () => {
      if (!selectedProgressUserId) {
        setSelectedUserProgresses([]);
        return;
      }
      setLoadingUserProgresses(true);
      try {
        const result = await adminListProgressAttempts({ userId: selectedProgressUserId, limit: 1000 });
        setSelectedUserProgresses(result.items);
      } catch (e: any) {
        setError(e?.message || 'Lỗi tải progress attempts của user');
      } finally {
        setLoadingUserProgresses(false);
      }
    })();
  }, [selectedProgressUserId]);

  React.useEffect(() => {
    (async () => {
      if (me?.role !== 'admin' || activeTab !== 'practice') return;
      try {
        const result = await adminListPracticeAttempts({ page: practicePage, limit: 1000 }); // Lấy tất cả để group theo user
        setPracticeAttempts(result.items);
        setPracticeTotal(result.total);
      } catch (e: any) {
        setError(e?.message || 'Lỗi tải practice attempts');
      }
    })();
  }, [me, activeTab, practicePage]);

  // Fetch practice attempts của user được chọn
  React.useEffect(() => {
    (async () => {
      if (!selectedUserId) {
        setSelectedUserPractices([]);
        return;
      }
      setLoadingUserPractices(true);
      try {
        const result = await adminListPracticeAttempts({ userId: selectedUserId, limit: 1000 });
        setSelectedUserPractices(result.items);
      } catch (e: any) {
        setError(e?.message || 'Lỗi tải practice attempts của user');
      } finally {
        setLoadingUserPractices(false);
      }
    })();
  }, [selectedUserId]);


  if (loadingMe) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tealCustom mx-auto"></div>
        <p className="text-zinc-600">Đang kiểm tra quyền…</p>
      </div>
    </div>
  );
  if (!me || me.role !== 'admin') return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="text-red-500 text-xl font-semibold">Chỉ dành cho Admin</div>
        <p className="text-zinc-600">Bạn không có quyền truy cập trang này</p>
      </div>
    </div>
  );

  const bars = data?.histogram || [];
  const maxCount = Math.max(1, ...bars.map(b => b.count));
  const width = 600, height = 220, pad = 24;
  const bw = (width - pad * 2) / (bars.length || 1);

  return (
    <div className="h-full flex flex-col bg-zinc-50">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 bg-white border-b border-zinc-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Dashboard Admin</h1>
            <p className="text-sm text-zinc-600 mt-0.5">Quản lý và theo dõi hiệu suất người dùng</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex-shrink-0 mx-6 mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <X className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex-shrink-0 border-b border-zinc-200 bg-white">
        <div className="flex gap-1 overflow-x-auto px-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 border-b-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'overview' 
                ? 'border-tealCustom text-tealCustom' 
                : 'border-transparent text-zinc-600 hover:text-zinc-900 hover:border-zinc-300'
            }`}
          >
            Tổng quan
          </button>
          <button
            onClick={() => setActiveTab('toeic-pred')}
            className={`px-6 py-3 border-b-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'toeic-pred' 
                ? 'border-tealCustom text-tealCustom' 
                : 'border-transparent text-zinc-600 hover:text-zinc-900 hover:border-zinc-300'
            }`}
          >
            TOEIC Dự đoán
          </button>
          <button
            onClick={() => setActiveTab('placement')}
            className={`px-6 py-3 border-b-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'placement' 
                ? 'border-tealCustom text-tealCustom' 
                : 'border-transparent text-zinc-600 hover:text-zinc-900 hover:border-zinc-300'
            }`}
          >
            Placement
          </button>
          <button
            onClick={() => setActiveTab('progress')}
            className={`px-6 py-3 border-b-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'progress' 
                ? 'border-tealCustom text-tealCustom' 
                : 'border-transparent text-zinc-600 hover:text-zinc-900 hover:border-zinc-300'
            }`}
          >
            Progress
          </button>
          <button
            onClick={() => setActiveTab('practice')}
            className={`px-6 py-3 border-b-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'practice' 
                ? 'border-tealCustom text-tealCustom' 
                : 'border-transparent text-zinc-600 hover:text-zinc-900 hover:border-zinc-300'
            }`}
          >
            Practice
          </button>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
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
                    <p className="text-3xl font-bold text-teal-900">{Math.round(data?.avgOverall ?? 0)}</p>
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
                        className={`border-t border-zinc-100 hover:bg-zinc-50 transition-colors ${
                          idx % 2 === 0 ? 'bg-white' : 'bg-zinc-50/50'
                        }`}
                      >
                        <td className="p-4 font-medium text-zinc-900">{u.name}</td>
                        <td className="p-4 font-mono text-xs text-zinc-600">{u.email}</td>
                        <td className="p-4 font-semibold text-lg text-tealCustom">{u.overall}</td>
                        <td className="p-4 text-zinc-700">{u.listening}</td>
                        <td className="p-4 text-zinc-700">{u.reading}</td>
                        <td className="p-4 text-xs text-zinc-500">
                          {new Date(u.submittedAt).toLocaleDateString('vi-VN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                        <td className="p-4">
                          <button
                            onClick={async () => {
                              if (!confirm(`Bạn có chắc muốn xóa điểm của ${u.name}?`)) return;
                              try {
                                await adminDeleteUserScore(u._id);
                                setUserScores(userScores.filter(s => s._id !== u._id));
                                setError(undefined);
                                // Reload data
                                const [overview, scores] = await Promise.all([
                                  adminOverview(),
                                  adminUserScores(),
                                ]);
                                const byLevel = (overview.byLevel as any);
                                setData({ totalUsers: overview.totalUsers, avgOverall: overview.avgOverall, byLevel, histogram: overview.histogram });
                                setUserScores(scores.users);
                              } catch (e: any) {
                                setError(e?.message || 'Lỗi xóa điểm');
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
      )}

      {/* TOEIC Predicted Tab */}
      {activeTab === 'toeic-pred' && (
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
                        className={`border-t border-zinc-100 hover:bg-zinc-50 transition-colors ${
                          idx % 2 === 0 ? 'bg-white' : 'bg-zinc-50/50'
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
                        <td className="p-4 text-zinc-700">{u.toeicPred?.listening ?? <span className="text-zinc-400">-</span>}</td>
                        <td className="p-4 text-zinc-700">{u.toeicPred?.reading ?? <span className="text-zinc-400">-</span>}</td>
                        <td className="p-4">
                          <button
                            onClick={async () => {
                              if (!confirm(`Bạn có chắc muốn xóa điểm TOEIC dự đoán của ${u.name}?`)) return;
                              try {
                                await adminDeleteUserToeicPred(u._id);
                                setUserToeicPred(userToeicPred.filter(s => s._id !== u._id));
                                setError(undefined);
                                // Reload data
                                const toeicPred = await adminUserToeicPred();
                                setUserToeicPred(toeicPred.users);
                              } catch (e: any) {
                                setError(e?.message || 'Lỗi xóa điểm TOEIC dự đoán');
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
      )}

      {/* Placement Tab */}
      {activeTab === 'placement' && (
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
                        className={`border-t border-zinc-100 hover:bg-zinc-50 transition-colors ${
                          idx % 2 === 0 ? 'bg-white' : 'bg-zinc-50/50'
                        }`}
                      >
                        <td className="p-4 font-medium text-zinc-900">{a.userName}</td>
                        <td className="p-4 font-mono text-xs text-zinc-600">{a.userEmail}</td>
                        <td className="p-4">
                          <span className="px-3 py-1 rounded-full border text-xs font-medium bg-blue-100 text-blue-800 border-blue-200">
                            Level {a.level}
                          </span>
                        </td>
                        <td className="p-4 font-semibold text-lg text-tealCustom">{a.overall}</td>
                        <td className="p-4 text-zinc-700">
                          <span className="font-medium">{a.listening.score}</span>
                          <span className="text-zinc-500 text-xs ml-1">({a.listening.correct}/{a.listening.total})</span>
                        </td>
                        <td className="p-4 text-zinc-700">
                          <span className="font-medium">{a.reading.score}</span>
                          <span className="text-zinc-500 text-xs ml-1">({a.reading.correct}/{a.reading.total})</span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            a.acc >= 0.8 ? 'bg-green-100 text-green-700' :
                            a.acc >= 0.6 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {(a.acc * 100).toFixed(1)}%
                          </span>
                        </td>
                        <td className="p-4 text-xs text-zinc-500">
                          {new Date(a.submittedAt).toLocaleDateString('vi-VN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                        <td className="p-4">
                          <button
                            onClick={async () => {
                              if (!confirm(`Bạn có chắc muốn xóa bài làm placement của ${a.userName}?`)) return;
                              try {
                                await adminDeletePlacementAttempt(a._id);
                                setPlacementAttempts(placementAttempts.filter(item => item._id !== a._id));
                                setPlacementTotal(placementTotal - 1);
                                setError(undefined);
                              } catch (e: any) {
                                setError(e?.message || 'Lỗi xóa bài làm placement');
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
                    onClick={() => setPlacementPage(p => Math.max(1, p - 1))}
                    disabled={placementPage === 1}
                    className="px-4 py-2 border border-zinc-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-50 transition-colors"
                  >
                    Trước
                  </button>
                  <span className="px-4 py-2 text-sm text-zinc-600">
                    Trang {placementPage} / {Math.ceil(placementTotal / 20)}
                  </span>
                  <button
                    onClick={() => setPlacementPage(p => p + 1)}
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
      )}

      {/* Progress Tab */}
      {activeTab === 'progress' && (
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
                      const userMap = new Map<string, { userId: string; userName: string; userEmail: string; attempts: AdminProgressAttempt[] }>();
                      progressAttempts.forEach((a) => {
                        if (!userMap.has(a.userId)) {
                          userMap.set(a.userId, { userId: a.userId, userName: a.userName, userEmail: a.userEmail, attempts: [] });
                        }
                        userMap.get(a.userId)!.attempts.push(a);
                      });
                      const users = Array.from(userMap.values());
                      return users.map((user, idx) => (
                        <tr 
                          key={user.userId} 
                          className={`border-t border-zinc-100 hover:bg-zinc-50 transition-colors ${
                            idx % 2 === 0 ? 'bg-white' : 'bg-zinc-50/50'
                          }`}
                        >
                          <td className="p-4 font-medium text-zinc-900">{user.userName}</td>
                          <td className="p-4 font-mono text-xs text-zinc-600">{user.userEmail}</td>
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
                                  if (!confirm(`Bạn có chắc muốn xóa tất cả ${user.attempts.length} bài progress của ${user.userName}?`)) return;
                                  try {
                                    // Xóa tất cả attempts của user
                                    await Promise.all(user.attempts.map(a => adminDeleteProgressAttempt(a._id)));
                                    setProgressAttempts(progressAttempts.filter(a => a.userId !== user.userId));
                                    setProgressTotal(progressTotal - user.attempts.length);
                                    setError(undefined);
                                    // Reload data
                                    const result = await adminListProgressAttempts({ page: progressPage, limit: 1000 });
                                    setProgressAttempts(result.items);
                                    setProgressTotal(result.total);
                                  } catch (e: any) {
                                    setError(e?.message || 'Lỗi xóa bài progress');
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
                style={{ animation: 'fadeIn 0.2s ease-out' }}
                onClick={() => setSelectedProgressUserId(null)}
              >
                <div 
                  className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col"
                  style={{ animation: 'slideUp 0.3s ease-out' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-6 border-b border-zinc-200 flex justify-between items-center bg-gradient-to-r from-teal-50 to-blue-50">
                    <div className="flex items-center gap-3">
                      <div className="bg-tealCustom rounded-full p-2">
                        <TrendingUp className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-zinc-900">
                          Bài Progress của {selectedUserProgresses[0]?.userName || 'User'}
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
                                className={`border-t border-zinc-100 hover:bg-zinc-50 transition-colors ${
                                  idx % 2 === 0 ? 'bg-white' : 'bg-zinc-50/50'
                                }`}
                              >
                                <td className="p-4">
                                  <span className="px-3 py-1 rounded-full border text-xs font-medium bg-blue-100 text-blue-800 border-blue-200">
                                    Level {a.level}
                                  </span>
                                </td>
                                <td className="p-4 font-semibold text-lg text-tealCustom">{a.overall}</td>
                                <td className="p-4 text-zinc-700">
                                  <span className="font-medium">{a.listening.score}</span>
                                  <span className="text-zinc-500 text-xs ml-1">({a.listening.correct}/{a.listening.total})</span>
                                </td>
                                <td className="p-4 text-zinc-700">
                                  <span className="font-medium">{a.reading.score}</span>
                                  <span className="text-zinc-500 text-xs ml-1">({a.reading.correct}/{a.reading.total})</span>
                                </td>
                                <td className="p-4">
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    a.acc >= 0.8 ? 'bg-green-100 text-green-700' :
                                    a.acc >= 0.6 ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                                  }`}>
                                    {(a.acc * 100).toFixed(1)}%
                                  </span>
                                </td>
                                <td className="p-4 text-xs text-zinc-500">
                                  {new Date(a.submittedAt).toLocaleDateString('vi-VN', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </td>
                                <td className="p-4">
                                  <button
                                    onClick={async () => {
                                      if (!confirm(`Bạn có chắc muốn xóa bài progress Level ${a.level} của ${a.userName}?`)) return;
                                      try {
                                        await adminDeleteProgressAttempt(a._id);
                                        setSelectedUserProgresses(selectedUserProgresses.filter(item => item._id !== a._id));
                                        // Update main list
                                        setProgressAttempts(progressAttempts.filter(item => item._id !== a._id));
                                        setProgressTotal(progressTotal - 1);
                                        setError(undefined);
                                        // Reload data
                                        const result = await adminListProgressAttempts({ page: progressPage, limit: 1000 });
                                        setProgressAttempts(result.items);
                                        setProgressTotal(result.total);
                                        // Reload selected user progresses
                                        if (selectedProgressUserId) {
                                          const userResult = await adminListProgressAttempts({ userId: selectedProgressUserId, limit: 1000 });
                                          setSelectedUserProgresses(userResult.items);
                                        }
                                      } catch (e: any) {
                                        setError(e?.message || 'Lỗi xóa bài progress');
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
      )}

      {/* Practice Tab */}
      {activeTab === 'practice' && (
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
                      const userMap = new Map<string, { userId: string; userName: string; userEmail: string; attempts: AdminPracticeAttempt[] }>();
                      practiceAttempts.forEach((a) => {
                        if (!userMap.has(a.userId)) {
                          userMap.set(a.userId, { userId: a.userId, userName: a.userName, userEmail: a.userEmail, attempts: [] });
                        }
                        userMap.get(a.userId)!.attempts.push(a);
                      });
                      const users = Array.from(userMap.values());
                      return users.map((user, idx) => (
                        <tr 
                          key={user.userId} 
                          className={`border-t border-zinc-100 hover:bg-zinc-50 transition-colors ${
                            idx % 2 === 0 ? 'bg-white' : 'bg-zinc-50/50'
                          }`}
                        >
                          <td className="p-4 font-medium text-zinc-900">{user.userName}</td>
                          <td className="p-4 font-mono text-xs text-zinc-600">{user.userEmail}</td>
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
                                  if (!confirm(`Bạn có chắc muốn xóa tất cả ${user.attempts.length} bài practice của ${user.userName}?`)) return;
                                  try {
                                    // Xóa tất cả attempts của user
                                    await Promise.all(user.attempts.map(a => adminDeletePracticeAttempt(a._id)));
                                    setPracticeAttempts(practiceAttempts.filter(a => a.userId !== user.userId));
                                    setPracticeTotal(practiceTotal - user.attempts.length);
                                    setError(undefined);
                                    // Reload data
                                    const result = await adminListPracticeAttempts({ page: practicePage, limit: 1000 });
                                    setPracticeAttempts(result.items);
                                    setPracticeTotal(result.total);
                                  } catch (e: any) {
                                    setError(e?.message || 'Lỗi xóa bài practice');
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
                style={{ animation: 'fadeIn 0.2s ease-out' }}
                onClick={() => setSelectedUserId(null)}
              >
                <div 
                  className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col"
                  style={{ animation: 'slideUp 0.3s ease-out' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-6 border-b border-zinc-200 flex justify-between items-center bg-gradient-to-r from-teal-50 to-blue-50">
                    <div className="flex items-center gap-3">
                      <div className="bg-tealCustom rounded-full p-2">
                        <FileText className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-zinc-900">
                          Bài Practice của {selectedUserPractices[0]?.userName || 'User'}
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
                                const partA = a.partKey || '';
                                const partB = b.partKey || '';
                                const partCompare = partA.localeCompare(partB, undefined, { numeric: true, sensitivity: 'base' });
                                if (partCompare !== 0) return partCompare;
                                // Nếu part giống nhau, sắp xếp theo level
                                return a.level - b.level;
                              })
                              .map((a, idx) => (
                              <tr 
                                key={a._id} 
                                className={`border-t border-zinc-100 hover:bg-zinc-50 transition-colors ${
                                  idx % 2 === 0 ? 'bg-white' : 'bg-zinc-50/50'
                                }`}
                              >
                                <td className="p-4 font-medium text-zinc-900">{a.partKey}</td>
                                <td className="p-4">
                                  <span className="px-3 py-1 rounded-full border text-xs font-medium bg-blue-100 text-blue-800 border-blue-200">
                                    Level {a.level}
                                  </span>
                                </td>
                                <td className="p-4 text-zinc-700">{a.test ?? '-'}</td>
                                <td className="p-4 text-zinc-700">
                                  <span className="font-medium">{a.correct}</span>
                                  <span className="text-zinc-500">/{a.total}</span>
                                </td>
                                <td className="p-4">
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    a.acc >= 0.8 ? 'bg-green-100 text-green-700' :
                                    a.acc >= 0.6 ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                                  }`}>
                                    {(a.acc * 100).toFixed(1)}%
                                  </span>
                                </td>
                                <td className="p-4 text-zinc-700 font-mono">
                                  {Math.floor(a.timeSec / 60)}:{(a.timeSec % 60).toString().padStart(2, '0')}
                                </td>
                                <td className="p-4 text-xs text-zinc-500">
                                  {new Date(a.submittedAt).toLocaleDateString('vi-VN', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </td>
                                <td className="p-4">
                                  <button
                                    onClick={async () => {
                                      if (!confirm(`Bạn có chắc muốn xóa bài practice ${a.partKey} Level ${a.level} của ${a.userName}?`)) return;
                                      try {
                                        await adminDeletePracticeAttempt(a._id);
                                        setSelectedUserPractices(selectedUserPractices.filter(item => item._id !== a._id));
                                        // Update main list
                                        setPracticeAttempts(practiceAttempts.filter(item => item._id !== a._id));
                                        setPracticeTotal(practiceTotal - 1);
                                        setError(undefined);
                                        // Reload data
                                        const result = await adminListPracticeAttempts({ page: practicePage, limit: 1000 });
                                        setPracticeAttempts(result.items);
                                        setPracticeTotal(result.total);
                                        // Reload selected user practices
                                        if (selectedUserId) {
                                          const userResult = await adminListPracticeAttempts({ userId: selectedUserId, limit: 1000 });
                                          setSelectedUserPractices(userResult.items);
                                        }
                                      } catch (e: any) {
                                        setError(e?.message || 'Lỗi xóa bài practice');
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
      )}

    </div>
  );
}
