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
  const base = "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold shadow-sm";
  if (role === "admin") {
    return (
      <span className={`${base} bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300`}>
        <Shield className="w-3.5 h-3.5" />
        Admin
      </span>
    );
  }
  if (role === "teacher") {
    return (
      <span className={`${base} bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300`}>
        <GraduationCap className="w-3.5 h-3.5" />
        Giáo viên
      </span>
    );
  }
  return (
    <span className={`${base} bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400`}>
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

  const handleDelete = async (roomName: string) => {
    if (!user?.id || !user?.name) return;
    setDeleting(roomName);
    try {
      await deleteStudyRoom(roomName, {
        id: user.id,
        name: user.name,
        role: user.role,
      });
      await reload();
      toast.success(`Đã xóa phòng "${roomName}"`);
    } catch (e: any) {
      toast.error(e?.message || "Xóa phòng thất bại");
    } finally {
      setDeleting(null);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Phòng Học Cộng Đồng
            </h1>
            <RoleBadge role={role} />
          </div>
          <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
            {headerSubtitle}
          </p>
        </div>

          <button
            onClick={reload}
            disabled={busy === "reload"}
            className={cn(
              "group flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-200",
              busy === "reload" && "opacity-70 cursor-not-allowed"
            )}
            title="Làm mới danh sách"
          >
            {busy === "reload" ? (
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            ) : (
              <RefreshCw className="h-4 w-4 text-slate-500 group-hover:rotate-180 transition-all duration-300" />
            )}
            <span className="text-sm font-semibold">Làm mới</span>
          </button>
      </div>

      {/* Create Room Section */}
      {canCreate ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm p-6 shadow-sm">
          <CreateStudyRoom
            onCreated={() => {
              reload();
              toast.success("Tạo phòng thành công!");
            }}
          />
        </div>
      ) : (
        <div className="rounded-2xl border border-amber-300/50 bg-amber-50/70 dark:bg-amber-900/20 backdrop-blur-sm p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <Lock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            <h3 className="text-lg font-bold text-amber-900 dark:text-amber-200">
              Bạn chỉ có thể tham gia
            </h3>
          </div>
          <p className="text-sm text-amber-800 dark:text-amber-300">
            Chỉ <strong>giáo viên</strong> và <strong>quản trị viên</strong> mới có thể tạo phòng. Vai trò hiện tại: <strong className="capitalize">{role}</strong>.
          </p>
        </div>
      )}

      {/* Error Alert */}
      {err && (
        <div className="rounded-2xl border border-red-300/50 bg-red-50/70 dark:bg-red-900/20 backdrop-blur-sm p-5 flex items-center gap-3 shadow-sm">
          <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-700 dark:text-red-300">{err}</p>
            <button
              onClick={reload}
              className="mt-1 text-xs font-bold text-red-600 dark:text-red-400 hover:underline"
            >
              Thử lại ngay
            </button>
          </div>
        </div>
      )}

      {/* Room List */}
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-md">
            <Users className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Danh sách phòng ({rooms.length})
          </h2>
        </div>

        {rooms.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
              <Users className="h-10 w-10 text-slate-400 dark:text-slate-500" />
            </div>
            {canCreate ? (
              <p className="text-base text-slate-600 dark:text-slate-400">
                Chưa có phòng nào.{" "}
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  Tạo phòng đầu tiên!
                </span>
              </p>
            ) : (
              <p className="text-base text-slate-600 dark:text-slate-400">
                Hiện chưa có phòng học nào được mở. Vui lòng quay lại sau.
              </p>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {rooms.map((r) => (
              <div
                key={r.roomName}
                className="group rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                        {r.roomName}
                      </h3>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-xs font-bold text-blue-700 dark:text-blue-300">
                        <Activity className="w-3 h-3 animate-pulse" />
                        {r.numParticipants} online
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
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

                  <div className="flex items-center gap-3">
                    <Link
                      href={`${prefix}/study/${r.roomName}`}
                      className="group/btn inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      <ExternalLink className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />
                      Mở phòng
                    </Link>

                    {canDelete && (
                      <button
                        onClick={() => handleDelete(r.roomName)}
                        disabled={deleting === r.roomName}
                        className={cn(
                          "group/del flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-bold transition-all duration-200",
                          deleting === r.roomName
                            ? "border-red-300 dark:border-red-600/50 text-red-600 dark:text-red-400 opacity-70 cursor-not-allowed"
                            : "border-red-300 dark:border-red-600/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:border-red-400"
                        )}
                        title="Xóa phòng (chỉ admin)"
                      >
                        {deleting === r.roomName ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Đang xóa
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 transition-transform group-hover/del:scale-110" />
                            Xóa
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