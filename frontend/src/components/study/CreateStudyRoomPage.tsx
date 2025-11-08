/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useCallback, useEffect, useState } from "react";
import { CreateStudyRoom } from "@/components/study/CreateStudyRoom";
import { listStudyRooms, deleteStudyRoom } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Plus, RefreshCw, Users, Trash2, ExternalLink, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Room {
  roomName: string;
  numParticipants: number;
  createdAt: string;
}

export default function CreateStudyRoomPage() {
  const { user, loading: authLoading } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const p = useParams<{ locale?: string }>();
  const prefix = p?.locale ? `/${p.locale}` : "";

  const canDelete = user?.role === "admin";

  const reload = useCallback(async () => {
    if (!user?.id || !user?.name) return;
    try {
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
      setBusy(null);
    }
  };

  if (authLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-64">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

  return (
    <div className="p-6 space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-emerald-600 to-sky-600 bg-clip-text text-transparent">
          Phòng Học Cộng Đồng
        </h1>
        <button
          onClick={reload}
          disabled={busy === "reload"}
          className={cn(
            "group flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm border border-zinc-200 dark:border-zinc-700 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300",
            busy === "reload" && "opacity-70 cursor-not-allowed"
          )}
        >
          {busy === "reload" ? (
            <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
          ) : (
            <RefreshCw className="h-4 w-4 text-zinc-600 dark:text-zinc-400 transition-all group-hover:rotate-180 group-hover:text-emerald-600 dark:group-hover:text-emerald-400" />
          )}
          <span className="text-sm font-bold">Làm mới</span>
        </button>
      </div>

      {/* Create Room - chỉ hiển thị cho teacher và admin */}
      {(user?.role === "teacher" || user?.role === "admin") && (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm p-6 shadow-lg">
          <CreateStudyRoom
            onCreated={() => {
              reload();
              toast.success("Tạo phòng thành công!");
            }}
          />
        </div>
      )}
      
      {/* Thông báo cho user thường */}
      {user && user.role !== "teacher" && user.role !== "admin" && (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/80 dark:bg-amber-900/20 backdrop-blur-sm p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-3">
            <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <h3 className="text-lg font-bold text-amber-900 dark:text-amber-200">
              Không có quyền tạo phòng
            </h3>
          </div>
          <p className="text-sm text-amber-800 dark:text-amber-300">
            Chỉ giáo viên và quản trị viên mới có thể tạo phòng học livestream. Vai trò hiện tại của bạn: <span className="font-semibold capitalize">{user.role}</span>
          </p>
        </div>
      )}

      {/* Error */}
      {err && (
        <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50/80 dark:bg-red-900/20 backdrop-blur-sm p-5 flex items-center gap-3 shadow-sm">
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
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 shadow-md">
            <Users className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
            Phòng đã tạo ({rooms.length})
          </h2>
        </div>

        {rooms.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-zinc-100 dark:bg-zinc-800 mb-5">
              <Users className="h-10 w-10 text-zinc-400 dark:text-zinc-600" />
            </div>
            <p className="text-base text-zinc-600 dark:text-zinc-400">
              Chưa có phòng nào. <span className="font-semibold text-emerald-600 dark:text-emerald-400">Tạo ngay!</span>
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {rooms.map((r) => (
              <div
                key={r.roomName}
                className="group rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 space-y-1.5">
                    <h3 className="font-bold text-lg text-zinc-900 dark:text-white flex items-center gap-2.5">
                      {r.roomName}
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                        <div className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-pulse" />
                        {r.numParticipants} online
                      </span>
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Tạo lúc: {new Date(r.createdAt).toLocaleString("vi-VN")}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Link
                      href={`${prefix}/study/${r.roomName}`}
                      className="group/btn flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all duration-300"
                    >
                      <ExternalLink className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />
                      Mở phòng
                    </Link>

                    {canDelete && (
                      <button
                        onClick={() => handleDelete(r.roomName)}
                        disabled={deleting === r.roomName}
                        className={cn(
                          "group/del flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-bold transition-all duration-300",
                          deleting === r.roomName
                            ? "border-red-300 dark:border-red-600/50 text-red-600 dark:text-red-400 opacity-70 cursor-not-allowed"
                            : "border-red-300 dark:border-red-600/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:border-red-400"
                        )}
                        title="Xóa phòng (chỉ admin)"
                      >
                        {deleting === r.roomName ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Đang xóa...
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