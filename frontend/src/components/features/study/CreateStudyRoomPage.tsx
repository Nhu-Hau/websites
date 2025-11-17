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
  X,
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20 mx-auto">
            <Loader2 className="h-6 w-6 text-blue-600 dark:text-blue-400 animate-spin" />
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
      <main className="mx-auto max-w-4xl px-4 py-8 pt-20">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
                Phòng học
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400">
                Tạo và quản lý phòng học trực tuyến của bạn
              </p>
            </div>
            <div className="flex items-center gap-2">
              {canCreate && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors shadow-sm hover:shadow"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Tạo phòng</span>
                  <span className="sm:hidden">Tạo</span>
                </button>
              )}
              <button
                onClick={reload}
                disabled={busy === "reload"}
                className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  busy === "reload"
                    ? "text-zinc-400 dark:text-zinc-500 cursor-not-allowed"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
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
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setShowCreateModal(false);
                }
              }}
            >
              <div className="" onClick={(e) => e.stopPropagation()}>
                {/* Modal Content */}
                <div className="p-6">
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
            </div>
          )}

          {!canCreate && (
            <div className="relative rounded-2xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/10 p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                    <Lock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-white mb-1">
                    Bạn chỉ có thể tham gia
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    Chỉ <strong className="font-medium">giáo viên</strong> và{" "}
                    <strong className="font-medium">quản trị viên</strong> mới
                    có thể tạo phòng. Vai trò hiện tại:{" "}
                    <strong className="capitalize font-medium text-amber-600 dark:text-amber-400">
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
            <div className="relative rounded-2xl border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/10 p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-red-900 dark:text-red-300 mb-1">
                    {err}
                  </p>
                  <button
                    onClick={reload}
                    className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline"
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
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                {rooms.length}
              </span>
            </div>

            {rooms.length === 0 ? (
              <div className="relative rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 p-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 mx-auto mb-4">
                  <Users className="h-8 w-8 text-zinc-400 dark:text-zinc-500" />
                </div>
                {canCreate ? (
                  <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Chưa có phòng nào.{" "}
                    <span className="text-blue-600 dark:text-blue-400 font-semibold">
                      Tạo phòng đầu tiên!
                    </span>
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
                    className="group relative rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm hover:shadow transition-shadow duration-200"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="font-semibold text-zinc-900 dark:text-white text-base">
                            {r.roomName}
                          </h3>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 dark:bg-green-900/20 text-xs font-medium text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">
                            <Activity className="w-3 h-3" />
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

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Link
                          href={`${prefix}/study/${r.roomName}`}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm hover:shadow"
                        >
                          <ExternalLink className="h-4 w-4" />
                          <span>Vào phòng</span>
                        </Link>

                        {canDelete && (
                          <button
                            onClick={() => handleDelete(r.roomName)}
                            disabled={deleting === r.roomName}
                            className={cn(
                              "inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2",
                              deleting === r.roomName
                                ? "border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 opacity-50 cursor-not-allowed"
                                : "border-red-300 dark:border-red-700/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
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
