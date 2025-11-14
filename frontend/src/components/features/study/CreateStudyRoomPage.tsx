/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { CreateStudyRoom } from "@/components/features/study/CreateStudyRoom";
import { listStudyRooms, deleteStudyRoom } from "@/lib/api/client";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  RefreshCw,
  Users,
  Trash2,
  ExternalLink,
  AlertCircle,
  Loader2,
  Shield,
  GraduationCap,
  User,
  Lock,
  Clock,
  Activity,
} from "lucide-react";
import { toast } from "sonner";
import Swal from "sweetalert2";

type Role = "user" | "teacher" | "admin";

interface Room {
  roomName: string;
  numParticipants: number;
  createdAt: string;
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function RoleBadge({ role }: { role?: string }) {
  const base =
    "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black shadow-md";
  if (role === "admin") {
    return (
      <span
        className={`${base} bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700`}
      >
        <Shield className="w-3.5 h-3.5" />
        Admin
      </span>
    );
  }
  if (role === "teacher") {
    return (
      <span
        className={`${base} bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/50 dark:to-cyan-900/50 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700`}
      >
        <GraduationCap className="w-3.5 h-3.5" />
        Giáo viên
      </span>
    );
  }
  return (
    <span
      className={`${base} bg-gradient-to-r from-slate-100 to-zinc-100 dark:from-slate-800/50 dark:to-zinc-800/50 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700`}
    >
      <User className="w-3.5 h-3.5" />
      Học viên
    </span>
  );
}

export default function CreateStudyRoomPage() {
  const { user, loading: authLoading } = useAuth();
  const role = (user?.role as Role) || "user";
  const isAdmin = role === "admin";
  const isTeacher = role === "teacher";
  const canCreate = isAdmin || isTeacher;
  const canDelete = isAdmin;

  const headerSubtitle = useMemo(() => {
    if (isAdmin) return "Quản lý toàn bộ phòng học & người tham gia";
    if (isTeacher) return "Tạo và điều hành phòng học livestream";
    return "Tham gia các lớp học cộng đồng";
  }, [isAdmin, isTeacher]);

  const [rooms, setRooms] = useState<Room[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const p = useParams<{ locale?: string }>();
  const prefix = p?.locale ? `/${p.locale}` : "";

  const reload = useCallback(async () => {
    if (!user?.id || !user?.name) return;
    try {
      setBusy("reload");
      setErr(null);
      const data = await listStudyRooms({
        id: user.id,
        name: user.name,
        role: user.role,
      });
      setRooms(data.rooms || []);
    } catch (e: any) {
      const msg = e?.message || "Không thể tải danh sách phòng";
      setErr(msg);
      toast.error(msg);
    } finally {
      setBusy(null);
    }
  }, [user]);

  useEffect(() => {
    if (user) reload();
  }, [user, reload]);

  // Auto-delete empty rooms after 5 minutes
  useEffect(() => {
    if (!canDelete || !user?.id) return;

    const checkEmptyRooms = setInterval(async () => {
      try {
        const data = await listStudyRooms({
          id: user.id,
          name: user.name || "",
          role: user.role || "admin",
        });
        
        const currentRooms = data.rooms || [];
        
        // Check each room
        for (const room of currentRooms) {
          // If room is empty (0 participants), check if it should be deleted
          if (room.numParticipants === 0) {
            // Note: This uses createdAt as a proxy for when room became empty
            // In production, backend should track lastActivityTime or lastEmptyTime
            // For now, we assume if room is empty and created more than 5 minutes ago,
            // it has been empty long enough to delete
            const roomAge = Date.now() - new Date(room.createdAt).getTime();
            const fiveMinutes = 5 * 60 * 1000;
            
            // If room is empty and has been around for 5+ minutes, delete it
            // This is a simplified check - ideally backend tracks when room became empty
            if (roomAge >= fiveMinutes) {
              try {
                await deleteStudyRoom(room.roomName, {
                  id: user.id,
                  name: user.name || "",
                  role: user.role || "admin",
                });
                toast.info(`Đã tự động xóa phòng trống sau 5 phút: ${room.roomName}`);
                // Reload will happen automatically on next check, but do it here for immediate feedback
                setTimeout(() => reload(), 1000);
              } catch (e: any) {
                console.error("Auto-delete failed:", e);
                // Silently fail to avoid spam
              }
            }
          }
        }
      } catch (e) {
        console.error("Auto-delete check failed:", e);
        // Silently fail to avoid spam
      }
    }, 60000); // Check every minute

    return () => clearInterval(checkEmptyRooms);
  }, [canDelete, user, reload]);

  const handleDelete = async (roomName: string) => {
    if (!user?.id || !user?.name || !canDelete) return;
    
    const result = await Swal.fire({
      title: "Xác nhận xóa",
      text: `Bạn có chắc muốn xóa phòng "${roomName}"? Hành động này không thể hoàn tác.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
    });
    
    if (!result.isConfirmed) return;
    
    setDeleting(roomName);
    try {
      await deleteStudyRoom(roomName, {
        id: user.id,
        name: user.name,
        role: user.role || "admin",
      });
      toast.success(`Đã xóa phòng "${roomName}"`);
      await reload();
    } catch (e: any) {
      const errorMsg = e?.message || e?.response?.data?.message || "Xóa phòng thất bại";
      toast.error(errorMsg);
      console.error("Delete room error:", e);
    } finally {
      setDeleting(null);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-64 bg-[#DFD0B8] dark:bg-gradient-to-br dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900 mt-16">
        <div className="group relative rounded-3xl bg-white/90 dark:bg-zinc-800/90 backdrop-blur-xl shadow-2xl ring-2 ring-white/30 dark:ring-zinc-700/50 p-8 transition-all duration-500 hover:shadow-3xl hover:scale-[1.005] hover:ring-blue-300/50 dark:hover:ring-blue-600/50 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
          <div className="relative flex items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-xl ring-3 ring-white/50 dark:ring-zinc-800/50">
              <Loader2 className="h-8 w-8 text-white animate-spin" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 mt-16 bg-[#DFD0B8] dark:bg-gradient-to-br dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="group">
          <div className="relative inline-flex items-center gap-5 rounded-3xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl px-7 py-5 shadow-xl ring-2 ring-white/30 dark:ring-zinc-700/50 transition-all duration-500 hover:shadow-2xl hover:scale-[1.005] hover:ring-blue-400/50 dark:hover:ring-blue-600/50 overflow-hidden">
            {/* Gradient Overlay khi hover */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Icon 3D với hiệu ứng hover */}
            <div className="relative transform-gpu transition-all duration-400 group-hover:scale-110 group-hover:-rotate-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg ring-3 ring-white/50 dark:ring-zinc-800/50">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/30 backdrop-blur-md">
                  <svg
                    className="h-6 w-6 text-white drop-shadow-md"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  </svg>
                </div>
              </div>
              {/* Subtle glow khi hover */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-400/40 to-indigo-400/40 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>

            {/* Text Content */}
            <div className="relative">
              {/* Title với gradient + 3D shadow */}
              <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-900 dark:from-white dark:via-zinc-100 dark:to-white drop-shadow-md transition-all duration-300 group-hover:drop-shadow-lg">
                Phòng Học
              </h1>
            </div>

            {/* Role Badge – giữ nguyên */}
            <div className="ml-4">
              <RoleBadge role={role} />
            </div>
          </div>

          {/* Subtitle */}
          <p className="mt-3 text-sm font-medium text-zinc-600 dark:text-zinc-400">
            {headerSubtitle}
          </p>
        </div>

        <button
          onClick={reload}
          disabled={busy === "reload"}
          className={cn(
            "group flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm border-2 border-white/30 dark:border-zinc-700/50 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300",
            busy === "reload" && "opacity-70 cursor-not-allowed"
          )}
          title="Làm mới danh sách"
        >
          {busy === "reload" ? (
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          ) : (
            <RefreshCw className="h-4 w-4 text-zinc-500 group-hover:rotate-180 transition-all duration-500" />
          )}
          <span className="text-sm font-black">Làm mới</span>
        </button>
      </div>

      {/* Create Room Section */}
      {canCreate ? (
        <div className="group relative rounded-3xl bg-white/90 dark:bg-zinc-800/90 backdrop-blur-xl shadow-2xl ring-2 ring-white/30 dark:ring-zinc-700/50 p-6 transition-all duration-500 hover:shadow-3xl hover:scale-[1.005] hover:ring-blue-300/50 dark:hover:ring-blue-600/50 overflow-hidden">
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
          
          <div className="relative">
            <CreateStudyRoom
              onCreated={() => {
                reload();
                toast.success("Tạo phòng thành công!");
              }}
            />
          </div>
        </div>
      ) : (
        <div className="group relative rounded-3xl bg-white/90 dark:bg-zinc-800/90 backdrop-blur-xl shadow-2xl ring-2 ring-white/30 dark:ring-zinc-700/50 p-6 transition-all duration-500 hover:shadow-3xl hover:scale-[1.005] hover:ring-amber-300/50 dark:hover:ring-amber-600/50 overflow-hidden">
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
          
          <div className="relative flex items-center gap-3 mb-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-xl ring-3 ring-white/50 dark:ring-zinc-800/50">
              <Lock className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-lg font-black text-zinc-900 dark:text-white">
              Bạn chỉ có thể tham gia
            </h3>
          </div>
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Chỉ <strong className="font-black">giáo viên</strong> và{" "}
            <strong className="font-black">quản trị viên</strong> mới có thể tạo
            phòng. Vai trò hiện tại:{" "}
            <strong className="capitalize font-black text-amber-600 dark:text-amber-400">{role}</strong>.
          </p>
        </div>
      )}

      {/* Error Alert */}
      {err && (
        <div className="group relative rounded-3xl bg-white/90 dark:bg-zinc-800/90 backdrop-blur-xl shadow-2xl ring-2 ring-white/30 dark:ring-zinc-700/50 p-5 flex items-center gap-3 transition-all duration-500 hover:shadow-3xl hover:scale-[1.005] hover:ring-rose-300/50 dark:hover:ring-rose-600/50 overflow-hidden">
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
          
          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 shadow-xl ring-3 ring-white/50 dark:ring-zinc-800/50 flex-shrink-0">
            <AlertCircle className="h-7 w-7 text-white" />
          </div>
          <div className="relative flex-1">
            <p className="text-sm font-black text-zinc-900 dark:text-white">
              {err}
            </p>
            <button
              onClick={reload}
              className="mt-1 text-xs font-black text-blue-600 dark:text-blue-400 hover:underline transition-all duration-200"
            >
              Thử lại ngay
            </button>
          </div>
        </div>
      )}

      {/* Room List */}
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-xl ring-3 ring-white/50 dark:ring-zinc-800/50">
            <Users className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-xl font-black text-zinc-900 dark:text-white">
            Danh sách phòng ({rooms.length})
          </h2>
        </div>

        {rooms.length === 0 ? (
          <div className="group relative text-center py-16 rounded-3xl bg-white/90 dark:bg-zinc-800/90 backdrop-blur-xl shadow-2xl ring-2 ring-white/30 dark:ring-zinc-700/50 border-2 border-dashed border-zinc-300 dark:border-zinc-600 transition-all duration-500 hover:shadow-3xl hover:scale-[1.005] hover:ring-blue-300/50 dark:hover:ring-blue-600/50 overflow-hidden">
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
            
            <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 mb-4 shadow-inner ring-4 ring-white/30 dark:ring-zinc-700/30">
              <Users className="h-12 w-12 text-blue-600 dark:text-blue-400" />
            </div>
            {canCreate ? (
              <p className="relative text-base font-bold text-zinc-600 dark:text-zinc-400">
                Chưa có phòng nào.{" "}
                <span className="font-black text-blue-600 dark:text-blue-400">
                  Tạo phòng đầu tiên!
                </span>
              </p>
            ) : (
              <p className="relative text-base font-medium text-zinc-600 dark:text-zinc-400">
                Hiện chưa có phòng học nào được mở. Vui lòng quay lại sau.
              </p>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {rooms.map((r) => (
              <div
                key={r.roomName}
                className="group/overlay relative rounded-3xl bg-white/90 dark:bg-zinc-800/90 backdrop-blur-xl p-5 shadow-2xl ring-2 ring-white/30 dark:ring-zinc-700/50 hover:shadow-3xl hover:scale-[1.005] hover:ring-blue-300/50 dark:hover:ring-blue-600/50 transition-all duration-500 overflow-hidden"
              >
                {/* Hover gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover/overlay:opacity-100 transition-opacity duration-500 rounded-3xl" />

                <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-black text-lg text-zinc-900 dark:text-white">
                        {r.roomName}
                      </h3>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 text-xs font-black text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700 shadow-md">
                        <Activity className="w-3 h-3 animate-pulse" />
                        {r.numParticipants} online
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(r.createdAt).toLocaleString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    <Link
                      href={`${prefix}/study/${r.roomName}`}
                      className="group/btn relative inline-flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
                      <ExternalLink className="h-4 w-4 relative z-10 transition-transform group-hover/btn:translate-x-0.5" />
                      <span className="relative z-10">Mở phòng</span>
                    </Link>

                    {canDelete && (
                      <button
                        onClick={() => handleDelete(r.roomName)}
                        disabled={deleting === r.roomName}
                        className={cn(
                          "group/del relative inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 text-sm font-black transition-all duration-300 overflow-hidden",
                          deleting === r.roomName
                            ? "border-red-300 dark:border-red-600/50 text-red-600 dark:text-red-400 opacity-70 cursor-not-allowed"
                            : "border-red-300 dark:border-red-600/50 text-red-600 dark:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-900/30 hover:border-red-400 hover:scale-105 shadow-md hover:shadow-lg"
                        )}
                        title="Xóa phòng (chỉ admin)"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-rose-500/5 opacity-0 group-hover/del:opacity-100 transition-opacity duration-300" />
                        {deleting === r.roomName ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin relative z-10" />
                            <span className="relative z-10">Đang xóa</span>
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 relative z-10 transition-transform group-hover/del:scale-110 group-hover/del:rotate-12" />
                            <span className="relative z-10">Xóa</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
