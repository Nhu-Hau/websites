/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useCallback, useEffect, useState } from "react";
import { CreateStudyRoom } from "@/components/features/study/CreateStudyRoom";
import { listStudyRooms, deleteStudyRoom } from "@/lib/api/client";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Users,
  Trash2,
  ExternalLink,
  AlertCircle,
  Loader2,
  Lock,
  Clock,
  Activity,
  Plus,
  RefreshCw,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { useConfirmModal } from "@/components/common/ConfirmModal";

type Role = "user" | "teacher" | "admin";

interface Room {
  roomName: string;
  numParticipants: number;
  createdAt: string;
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function CreateStudyRoomPage() {
  const { user, loading: authLoading } = useAuth();
  const role = (user?.role as Role) || "user";
  const isAdmin = role === "admin";
  const isTeacher = role === "teacher";
  const canCreate = isAdmin || isTeacher;
  const canDelete = isAdmin;
  const { show, Modal: ConfirmModal } = useConfirmModal();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const p = useParams<{ locale?: string }>();
  const prefix = p?.locale ? `/${p.locale}` : "";
  const locale = p?.locale || "vi";

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

        for (const room of currentRooms) {
          if (room.numParticipants === 0) {
            const roomAge = Date.now() - new Date(room.createdAt).getTime();
            const fiveMinutes = 5 * 60 * 1000;

            if (roomAge >= fiveMinutes) {
              try {
                await deleteStudyRoom(room.roomName, {
                  id: user.id,
                  name: user.name || "",
                  role: user.role || "admin",
                });
                toast.info(
                  `Đã tự động xóa phòng trống sau 5 phút: ${room.roomName}`
                );
                setTimeout(() => reload(), 1000);
              } catch (e: any) {
                console.error("Auto-delete failed:", e);
              }
            }
          }
        }
      } catch (e) {
        console.error("Auto-delete check failed:", e);
      }
    }, 60000);

    return () => clearInterval(checkEmptyRooms);
  }, [canDelete, user, reload]);

  const handleDelete = async (roomName: string) => {
    if (!user?.id || !user?.name || !canDelete) return;

    show(
      {
        title: "Xác nhận xóa",
        message: `Bạn có chắc muốn xóa phòng "${roomName}"? Hành động này không thể hoàn tác.`,
        icon: "warning",
        confirmText: "Xóa",
        cancelText: "Hủy",
        confirmColor: "red",
      },
      async () => {
        setDeleting(roomName);
        try {
          await deleteStudyRoom(roomName, {
            id: user.id,
            name: user.name || "",
            role: user.role || "admin",
          });
          toast.success(`Đã xóa phòng "${roomName}"`);
          await reload();
        } catch (e: any) {
          const errorMsg =
            e?.message || e?.response?.data?.message || "Xóa phòng thất bại";
          toast.error(errorMsg);
          console.error("Delete room error:", e);
        } finally {
          setDeleting(null);
        }
      }
    );
  };

  if (authLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 dark:bg-sky-900/20">
            <Loader2 className="h-6 w-6 animate-spin text-sky-600 dark:text-sky-400" />
          </div>
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            Đang tải…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <main className="mx-auto max-w-4xl px-4 pb-20 pt-20 lg:pb-8 lg:pt-28">
        {/* Page Header */}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-bold text-zinc-900 dark:text-white">
                Phòng học
              </h1>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Tạo và quản lý phòng học trực tuyến của bạn.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {canCreate && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-sky-700 hover:shadow-md dark:bg-sky-500 dark:hover:bg-sky-400"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Tạo phòng</span>
                  <span className="sm:hidden">Tạo</span>
                </button>
              )}
              <button
                onClick={reload}
                disabled={busy === "reload"}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all",
                  busy === "reload"
                    ? "cursor-not-allowed text-zinc-400 dark:text-zinc-500"
                    : "text-zinc-600 hover:-translate-y-0.5 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                )}
              >
                {busy === "reload" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">Làm mới</span>
                <span className="sm:hidden">Refresh</span>
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Create Room Modal */}
          {showCreateModal && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setShowCreateModal(false);
                }
              }}
            >
              <div
                className="w-full max-w-md rounded-2xl border border-zinc-200/80 bg-white/95 p-1 shadow-2xl ring-1 ring-black/5 dark:border-zinc-800/80 dark:bg-zinc-900/95"
                onClick={(e) => e.stopPropagation()}
              >
                <CreateStudyRoom
                  onCreated={() => {
                    setShowCreateModal(false);
                    reload();
                    toast.success("Tạo phòng thành công!");
                  }}
                  onCancel={() => setShowCreateModal(false)}
                />
              </div>
            </div>
          )}

          {!canCreate && (
            <div className="relative rounded-2xl border border-amber-200/80 bg-amber-50/95 p-6 shadow-sm ring-1 ring-amber-100/60 dark:border-amber-800/60 dark:bg-amber-900/10">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
                    <Lock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="mb-1 text-base font-semibold text-zinc-900 dark:text-white">
                    Bạn chỉ có thể tham gia
                  </h3>
                  <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                    Chỉ <strong className="font-medium">giáo viên</strong> và{" "}
                    <strong className="font-medium">quản trị viên</strong> mới
                    có thể tạo phòng. Vai trò hiện tại:{" "}
                    <strong className="font-medium capitalize text-amber-700 dark:text-amber-400">
                      {role}
                    </strong>
                    .
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Alert */}
          {err && (
            <div className="relative rounded-2xl border border-red-200/80 bg-red-50/95 p-4 shadow-sm ring-1 ring-red-100/60 dark:border-red-800/70 dark:bg-red-900/15">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" />
                <div className="min-w-0 flex-1">
                  <p className="mb-1 text-sm font-medium text-red-900 dark:text-red-200">
                    {err}
                  </p>
                  <button
                    onClick={reload}
                    className="text-xs font-medium text-red-600 hover:underline dark:text-red-400"
                  >
                    Thử lại ngay
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Room List */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                Danh sách phòng
              </h2>
              <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                {rooms.length}
              </span>
            </div>

            {rooms.length === 0 ? (
              <div className="relative rounded-2xl border border-dashed border-zinc-300/80 bg-white/90 p-12 text-center shadow-sm ring-1 ring-black/[0.02] dark:border-zinc-700/80 dark:bg-zinc-900/90">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-50 text-sky-500 dark:bg-sky-900/30 dark:text-sky-300">
                  <Users className="h-8 w-8" />
                </div>
                {canCreate ? (
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Chưa có phòng nào.{" "}
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="font-semibold text-sky-600 underline-offset-2 hover:underline dark:text-sky-400"
                    >
                      Tạo phòng đầu tiên!
                    </button>
                  </p>
                ) : (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Hiện chưa có phòng học nào được mở. Vui lòng quay lại sau.
                  </p>
                )}
              </div>
            ) : (
              <div className="grid gap-3">
                {rooms.map((r) => (
                  <div
                    key={r.roomName}
                    className="group relative rounded-2xl border border-zinc-200/80 bg-white/95 p-4 shadow-sm ring-1 ring-black/[0.02] transition-all duration-150 hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md dark:border-zinc-800/80 dark:bg-zinc-900/95"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
                            {r.roomName}
                          </h3>
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-800/70 dark:bg-emerald-900/20 dark:text-emerald-300">
                            <Activity className="h-3 w-3" />
                            {r.numParticipants} online
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-500">
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

                      <div className="flex flex-shrink-0 items-center gap-2">
                        <Link
                          href={`${prefix}/study/${r.roomName}`}
                          className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-sky-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 dark:bg-sky-500 dark:hover:bg-sky-400"
                        >
                          <ExternalLink className="h-4 w-4" />
                          <span>Vào phòng</span>
                        </Link>

                        {canDelete && (
                          <button
                            onClick={() => handleDelete(r.roomName)}
                            disabled={deleting === r.roomName}
                            className={cn(
                              "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2",
                              deleting === r.roomName
                                ? "cursor-not-allowed border-red-300 text-red-600 opacity-60 dark:border-red-700 dark:text-red-400"
                                : "border-red-200 text-red-600 hover:-translate-y-0.5 hover:bg-red-50 dark:border-red-700/70 dark:text-red-400 dark:hover:bg-red-900/20"
                            )}
                          >
                            {deleting === r.roomName ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Đang xóa</span>
                              </>
                            ) : (
                              <>
                                <Trash2 className="h-4 w-4" />
                                <span className="hidden sm:inline">Xóa</span>
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
      </main>

      {/* Confirm Modal */}
      {ConfirmModal}
    </div>
  );
}