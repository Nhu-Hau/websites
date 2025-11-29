/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import {
  adminOverview,
  adminUserScores,
  adminUserToeicPred,
  adminListPlacementAttempts,
  adminListProgressAttempts,
  adminListPracticeAttempts,
  AdminPlacementAttempt,
  AdminProgressAttempt,
  AdminPracticeAttempt,
  adminVisitorCount,
  adminOnlineUsersCount,
  adminListUsers,
} from "@/lib/apiClient";
import { X } from "lucide-react";
import { useSocket } from "@/hooks/useSocket";
import DashboardHeader from "@/components/features/dashboard/DashboardHeader";
import DashboardTabs from "@/components/features/dashboard/DashboardTabs";
import OverviewTab from "@/components/features/dashboard/overview/OverviewTab";
import ToeicPredTab from "@/components/features/dashboard/toeic-pred/ToeicPredTab";
import PlacementTab from "@/components/features/dashboard/placement/PlacementTab";
import ProgressTab from "@/components/features/dashboard/progress/ProgressTab";
import PracticeTab from "@/components/features/dashboard/practice/PracticeTab";

export default function Home() {
  const [me, setMe] = React.useState<{ id: string; role?: string } | null>(null);
  const [loadingMe, setLoadingMe] = React.useState(true);
  const [data, setData] = React.useState<{
    totalUsers: number;
    avgOverall: number;
    byLevel: Record<string, number>;
    histogram: { min: number; max: number; count: number }[];
  } | null>(null);
  const [userScores, setUserScores] = React.useState<
    Array<{
      _id: string;
      name: string;
      email: string;
      level: number;
      overall: number;
      listening: number;
      reading: number;
      currentToeicScore: number | null;
      submittedAt: string;
    }>
  >([]);
  const [userToeicPred, setUserToeicPred] = React.useState<
    Array<{
      _id: string;
      name: string;
      email: string;
      level: number;
      toeicPred: { overall: number | null; listening: number | null; reading: number | null };
    }>
  >([]);
  const [placementAttempts, setPlacementAttempts] = React.useState<AdminPlacementAttempt[]>([]);
  const [progressAttempts, setProgressAttempts] = React.useState<AdminProgressAttempt[]>([]);
  const [practiceAttempts, setPracticeAttempts] = React.useState<AdminPracticeAttempt[]>([]);
  const [placementPage, setPlacementPage] = React.useState(1);
  const [progressPage, setProgressPage] = React.useState(1);
  const [practicePage, setPracticePage] = React.useState(1);
  const [placementTotal, setPlacementTotal] = React.useState(0);
  const [progressTotal, setProgressTotal] = React.useState(0);
  const [practiceTotal, setPracticeTotal] = React.useState(0);
  const [error, setError] = React.useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = React.useState<
    "overview" | "placement" | "progress" | "practice" | "toeic-pred"
  >("overview");
  const [selectedUserId, setSelectedUserId] = React.useState<string | null>(null);
  const [selectedUserPractices, setSelectedUserPractices] = React.useState<AdminPracticeAttempt[]>(
    []
  );
  const [loadingUserPractices, setLoadingUserPractices] = React.useState(false);
  const [selectedProgressUserId, setSelectedProgressUserId] = React.useState<string | null>(null);
  const [selectedUserProgresses, setSelectedUserProgresses] = React.useState<AdminProgressAttempt[]>(
    []
  );
  const [loadingUserProgresses, setLoadingUserProgresses] = React.useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [visitorCount, setVisitorCount] = React.useState<{
    totalVisits: number;
    uniqueVisitorsLast30Days: number;
  } | null>(null);
  const [onlineUsers, setOnlineUsers] = React.useState<number>(0);
  const [totalSystemUsers, setTotalSystemUsers] = React.useState<number>(0);
  const { socket, connected } = useSocket();

  React.useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/admin-auth/me", {
          credentials: "include",
          cache: "no-store",
        });
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
      if (me?.role !== "admin") return;
      try {
        const [overview, scores, toeicPred, visitorData, onlineData, usersData] = await Promise.all([
          adminOverview(),
          adminUserScores(),
          adminUserToeicPred(),
          adminVisitorCount(),
          adminOnlineUsersCount(),
          adminListUsers({ limit: 1 }), // Chỉ cần lấy tổng số lượng
        ]);
        const byLevel = overview.byLevel as any;
        setData({
          totalUsers: overview.totalUsers,
          avgOverall: overview.avgOverall,
          byLevel,
          histogram: overview.histogram,
        });
        setUserScores(scores.users);
        setUserToeicPred(toeicPred.users);
        setVisitorCount(visitorData);
        setOnlineUsers(onlineData.onlineUsers);
        setTotalSystemUsers(usersData.total);
      } catch (e: any) {
        setError(e?.message || "Lỗi tải dữ liệu");
      }
    })();
  }, [me]);

  // Người dùng online thời gian thực qua socket
  React.useEffect(() => {
    if (me?.role !== "admin" || !socket) return;

    // Tham gia phòng admin khi socket đã kết nối
    if (connected) {
      socket.emit("admin:join");
    }

    // Lắng nghe cập nhật thời gian thực
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
      if (me?.role !== "admin" || activeTab !== "placement") return;
      try {
        const result = await adminListPlacementAttempts({ page: placementPage, limit: 20 });
        setPlacementAttempts(result.items);
        setPlacementTotal(result.total);
      } catch (e: any) {
        setError(e?.message || "Lỗi tải placement attempts");
      }
    })();
  }, [me, activeTab, placementPage]);

  React.useEffect(() => {
    (async () => {
      if (me?.role !== "admin" || activeTab !== "progress") return;
      try {
        const result = await adminListProgressAttempts({ page: progressPage, limit: 1000 }); // Lấy tất cả để group theo user
        setProgressAttempts(result.items);
        setProgressTotal(result.total);
      } catch (e: any) {
        setError(e?.message || "Lỗi tải progress attempts");
      }
    })();
  }, [me, activeTab, progressPage]);

  // Lấy danh sách progress attempts của user được chọn
  React.useEffect(() => {
    (async () => {
      if (!selectedProgressUserId) {
        setSelectedUserProgresses([]);
        return;
      }
      setLoadingUserProgresses(true);
      try {
        const result = await adminListProgressAttempts({
          userId: selectedProgressUserId,
          limit: 1000,
        });
        setSelectedUserProgresses(result.items);
      } catch (e: any) {
        setError(e?.message || "Lỗi tải progress attempts của user");
      } finally {
        setLoadingUserProgresses(false);
      }
    })();
  }, [selectedProgressUserId]);

  React.useEffect(() => {
    (async () => {
      if (me?.role !== "admin" || activeTab !== "practice") return;
      try {
        const result = await adminListPracticeAttempts({ page: practicePage, limit: 1000 }); // Lấy tất cả để group theo user
        setPracticeAttempts(result.items);
        setPracticeTotal(result.total);
      } catch (e: any) {
        setError(e?.message || "Lỗi tải practice attempts");
      }
    })();
  }, [me, activeTab, practicePage]);

  // Lấy danh sách practice attempts của user được chọn
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
        setError(e?.message || "Lỗi tải practice attempts của user");
      } finally {
        setLoadingUserPractices(false);
      }
    })();
  }, [selectedUserId]);

  if (loadingMe)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tealCustom mx-auto"></div>
          <p className="text-zinc-600">Đang kiểm tra quyền…</p>
        </div>
      </div>
    );
  if (!me || me.role !== "admin")
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-red-500 text-xl font-semibold">Chỉ dành cho Admin</div>
          <p className="text-zinc-600">Bạn không có quyền truy cập trang này</p>
        </div>
      </div>
    );

  return (
    <div className="h-full flex flex-col bg-zinc-50">
      <DashboardHeader />

      {error && (
        <div className="flex-shrink-0 mx-6 mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <X className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      <DashboardTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {activeTab === "overview" && (
        <OverviewTab
          data={data}
          onlineUsers={onlineUsers}
          totalSystemUsers={totalSystemUsers}
          userScores={userScores}
          setUserScores={setUserScores}
          setData={setData}
          setError={setError}
        />
      )}

      {activeTab === "toeic-pred" && (
        <ToeicPredTab
          userToeicPred={userToeicPred}
          setUserToeicPred={setUserToeicPred}
          setError={setError}
        />
      )}

      {activeTab === "placement" && (
        <PlacementTab
          placementAttempts={placementAttempts}
          placementTotal={placementTotal}
          placementPage={placementPage}
          setPlacementPage={setPlacementPage}
          setPlacementAttempts={setPlacementAttempts}
          setPlacementTotal={setPlacementTotal}
          setError={setError}
        />
      )}

      {activeTab === "progress" && (
        <ProgressTab
          progressAttempts={progressAttempts}
          progressTotal={progressTotal}
          progressPage={progressPage}
          setProgressAttempts={setProgressAttempts}
          setProgressTotal={setProgressTotal}
          setError={setError}
          selectedProgressUserId={selectedProgressUserId}
          setSelectedProgressUserId={setSelectedProgressUserId}
          selectedUserProgresses={selectedUserProgresses}
          setSelectedUserProgresses={setSelectedUserProgresses}
          loadingUserProgresses={loadingUserProgresses}
        />
      )}

      {activeTab === "practice" && (
        <PracticeTab
          practiceAttempts={practiceAttempts}
          practiceTotal={practiceTotal}
          practicePage={practicePage}
          setPracticeAttempts={setPracticeAttempts}
          setPracticeTotal={setPracticeTotal}
          setError={setError}
          selectedUserId={selectedUserId}
          setSelectedUserId={setSelectedUserId}
          selectedUserPractices={selectedUserPractices}
          setSelectedUserPractices={setSelectedUserPractices}
          loadingUserPractices={loadingUserPractices}
        />
      )}
    </div>
  );
}
