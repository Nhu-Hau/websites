"use client";

import React from "react";
import {
  adminListStudyRooms,
  adminDeleteStudyRoom,
  adminListRoomComments,
  adminDeleteRoomComment,
  adminListRoomDocuments,
  adminDeleteRoomDocument,
  AdminStudyRoom,
  AdminRoomComment,
  AdminRoomDocument,
} from "@/lib/apiClient";
import { useToast } from "@/components/common/ToastProvider";
import {
  GraduationCap,
  Users,
  FileText,
  MessageSquare,
  Trash2,
  RefreshCw,
  Eye,
  Shield,
  Paperclip,
  Loader2,
} from "lucide-react";

const LIMIT = 15;

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, exponent);
  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

export default function StudyRoomsPage() {
  const [me, setMe] = React.useState<{ id: string; role?: string } | null>(null);
  const [loadingMe, setLoadingMe] = React.useState(true);
  const [items, setItems] = React.useState<AdminStudyRoom[]>([]);
  const [page, setPage] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [q, setQ] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [selectedRoom, setSelectedRoom] = React.useState<AdminStudyRoom | null>(null);
  const [roomComments, setRoomComments] = React.useState<AdminRoomComment[]>([]);
  const [roomDocuments, setRoomDocuments] = React.useState<AdminRoomDocument[]>([]);
  const [extrasLoading, setExtrasLoading] = React.useState(false);
  const toast = useToast();

  const pages = Math.max(1, Math.ceil(total / LIMIT));

  const loadRooms = React.useCallback(async () => {
    setBusy(true);
    try {
      const data = await adminListStudyRooms({ page, limit: LIMIT, q });
      setItems(data.items);
      setTotal(data.total);
      setSelectedRoom((prev) => {
        if (!prev) return prev;
        const updated = data.items.find((room) => room.roomName === prev.roomName);
        return updated ?? prev;
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể tải phòng học");
    } finally {
      setBusy(false);
    }
  }, [page, q, toast, selectedRoom]);

  const loadExtras = React.useCallback(
    async (roomName: string) => {
      setExtrasLoading(true);
      try {
        const [commentsRes, documentsRes] = await Promise.all([
          adminListRoomComments(roomName, { page: 1, limit: 50 }),
          adminListRoomDocuments(roomName, { page: 1, limit: 50 }),
        ]);
        setRoomComments(commentsRes.items);
        setRoomDocuments(documentsRes.items);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Không thể tải chi tiết phòng");
      } finally {
        setExtrasLoading(false);
      }
    },
    [toast]
  );

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
    if (me?.role === "admin") {
      void loadRooms();
    }
  }, [me, loadRooms]);

  React.useEffect(() => {
    if (selectedRoom) {
      void loadExtras(selectedRoom.roomName);
    } else {
      setRoomComments([]);
      setRoomDocuments([]);
    }
  }, [selectedRoom, loadExtras]);

  const onDeleteRoom = async (room: AdminStudyRoom) => {
    try {
      await adminDeleteStudyRoom(room.roomName);
      toast.success(`Đã xóa phòng ${room.roomName}`);
      if (selectedRoom?.roomName === room.roomName) {
        setSelectedRoom(null);
      }
      await loadRooms();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể xóa phòng");
    }
  };

  const onDeleteComment = async (comment: AdminRoomComment) => {
    if (!selectedRoom) return;
    try {
      await adminDeleteRoomComment(selectedRoom.roomName, comment._id);
      toast.success("Đã xóa bình luận");
      await loadExtras(selectedRoom.roomName);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể xóa bình luận");
    }
  };

  const onDeleteDocument = async (doc: AdminRoomDocument) => {
    if (!selectedRoom) return;
    try {
      await adminDeleteRoomDocument(selectedRoom.roomName, doc._id);
      toast.success("Đã xóa tài liệu");
      await loadExtras(selectedRoom.roomName);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể xóa tài liệu");
    }
  };

  if (loadingMe) return <div className="p-6">Đang kiểm tra quyền…</div>;
  if (!me || me.role !== "admin") return <div className="p-6 text-red-600">Chỉ dành cho Admin</div>;

  return (
    <div className="min-h-screen space-y-6">
      <header className="bg-white rounded-2xl shadow-lg border border-zinc-200 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-zinc-900">Quản lý Phòng học</h1>
              <p className="text-sm text-zinc-600">Theo dõi hoạt động và tài nguyên của phòng LiveKit</p>
            </div>
          </div>
          <button
            onClick={() => void loadRooms()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-200 text-sm font-medium hover:bg-zinc-50 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Làm mới
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-500">Tổng phòng</p>
              <p className="text-2xl font-semibold text-zinc-900">{total}</p>
            </div>
            <Users className="h-8 w-8 text-amber-500" />
          </div>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-500">Tài liệu</p>
              <p className="text-2xl font-semibold text-zinc-900">
                {items.reduce((sum, room) => sum + room.documentsCount, 0)}
              </p>
            </div>
            <FileText className="h-8 w-8 text-amber-500" />
          </div>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-500">Bình luận</p>
              <p className="text-2xl font-semibold text-zinc-900">
                {items.reduce((sum, room) => sum + room.commentsCount, 0)}
              </p>
            </div>
            <MessageSquare className="h-8 w-8 text-amber-500" />
          </div>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
          <div className="flex-1">
            <label className="text-sm font-medium text-zinc-600 block mb-2">Tìm theo tên phòng</label>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="study-room"
              className="w-full border border-zinc-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setPage(1);
                void loadRooms();
              }}
              className="px-4 py-2 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-sm font-medium"
            >
              Tìm kiếm
            </button>
            <button
              onClick={() => {
                setQ("");
                setPage(1);
                void loadRooms();
              }}
              className="px-4 py-2 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-sm font-medium"
            >
              Xóa lọc
            </button>
          </div>
        </div>

        <div className="overflow-x-auto border border-zinc-100 rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-zinc-600">
              <tr>
                <th className="p-3 text-left font-medium">Phòng</th>
                <th className="p-3 text-left font-medium">Host/Người tạo</th>
                <th className="p-3 text-left font-medium">Online</th>
                <th className="p-3 text-left font-medium">Tài liệu</th>
                <th className="p-3 text-left font-medium">Bình luận</th>
                <th className="p-3 text-left font-medium">Bị cấm</th>
                <th className="p-3 text-left font-medium">Tạo lúc</th>
                <th className="p-3 text-right font-medium">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {items.map((room) => (
                <tr key={room.roomName} className="border-t border-zinc-100 hover:bg-zinc-50/60">
                  <td className="p-3 font-semibold text-zinc-900">{room.roomName}</td>
                  <td className="p-3 text-zinc-700">
                    <div className="flex flex-col gap-1">
                      <div>
                        <span className="font-medium text-zinc-900">{room.currentHost?.name || "—"}</span>
                        <span className="block text-xs text-zinc-500 truncate">
                          {room.currentHost?.role || room.createdBy?.role || "Host"}
                        </span>
                        {room.currentHost?.id || room.currentHostId ? (
                          <span className="text-xs text-zinc-400 truncate">{room.currentHost?.id || room.currentHostId}</span>
                        ) : null}
                      </div>
                      <div className="text-xs text-zinc-500">
                        Người tạo:{" "}
                        <span className="font-medium text-zinc-900">
                          {room.createdBy?.name || "—"}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 font-semibold text-amber-600">{room.numParticipants}</td>
                  <td className="p-3">
                    <div className="flex flex-col">
                      <span className="font-semibold text-zinc-900">{room.documentsCount}</span>
                      <span className="text-xs text-zinc-500">{formatBytes(room.totalDocumentSize)}</span>
                    </div>
                  </td>
                  <td className="p-3 font-semibold text-zinc-900">{room.commentsCount}</td>
                  <td className="p-3 font-semibold text-zinc-900">{room.bannedCount}</td>
                  <td className="p-3 text-xs text-zinc-500">
                    {room.createdAt ? new Date(room.createdAt).toLocaleString("vi-VN") : "—"}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => setSelectedRoom(room)}
                        className="px-3 py-1.5 rounded-lg border border-amber-200 text-amber-700 text-xs font-semibold hover:bg-amber-50 flex items-center gap-1"
                      >
                        <Eye className="h-3.5 w-3.5" /> Chi tiết
                      </button>
                      <button
                        onClick={() => onDeleteRoom(room)}
                        className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 flex items-center gap-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td className="p-8 text-center text-zinc-500" colSpan={8}>
                    {busy ? "Đang tải..." : "Chưa có phòng nào"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="flex items-center justify-between text-sm text-zinc-600">
            <span>
              Trang {page}/{pages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-zinc-200 disabled:opacity-40"
              >
                Trước
              </button>
              <button
                disabled={page === pages}
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-zinc-200 disabled:opacity-40"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedRoom && (
        <div className="bg-white border border-amber-200 rounded-2xl shadow-md p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-amber-600 font-semibold">Chi tiết phòng</p>
              <h2 className="text-2xl font-bold text-zinc-900">{selectedRoom.roomName}</h2>
            </div>
            <button
              onClick={() => setSelectedRoom(null)}
              className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              Đóng panel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white border border-zinc-200">
                  <Shield className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-zinc-500">Host hiện tại</p>
                  <p className="font-semibold text-zinc-900">
                    {selectedRoom.currentHost?.name ?? "—"}
                  </p>
                  {(selectedRoom.currentHost?.id || selectedRoom.currentHostId) && (
                    <p className="text-xs text-zinc-500">
                      {selectedRoom.currentHost?.id || selectedRoom.currentHostId}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white border border-zinc-200">
                  <Users className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-zinc-500">Đang online</p>
                  <p className="font-semibold text-zinc-900">{selectedRoom.numParticipants}</p>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white border border-zinc-200">
                  <Paperclip className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-zinc-500">Dung lượng tài liệu</p>
                  <p className="font-semibold text-zinc-900">{formatBytes(selectedRoom.totalDocumentSize)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="border border-zinc-100 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-amber-600" />
                  <h3 className="text-lg font-semibold text-zinc-900">Bình luận ({roomComments.length})</h3>
                </div>
                {extrasLoading && <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />}
              </div>
              <div className="space-y-3 max-h-80 overflow-auto">
                {roomComments.map((comment) => (
                  <div key={comment._id} className="p-3 rounded-xl border border-zinc-100 bg-zinc-50">
                    <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
                      <span className="font-semibold text-zinc-700">{comment.userName}</span>
                      <span>{new Date(comment.createdAt).toLocaleString("vi-VN")}</span>
                    </div>
                    <p className="text-sm text-zinc-800 whitespace-pre-wrap">{comment.content}</p>
                    <div className="flex justify-end mt-2">
                      <button
                        onClick={() => onDeleteComment(comment)}
                        className="text-xs text-red-500 hover:text-red-700 inline-flex items-center gap-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Xóa
                      </button>
                    </div>
                  </div>
                ))}
                {roomComments.length === 0 && (
                  <p className="text-sm text-zinc-500 text-center py-6">Chưa có bình luận</p>
                )}
              </div>
            </div>

            <div className="border border-zinc-100 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-amber-600" />
                  <h3 className="text-lg font-semibold text-zinc-900">Tài liệu ({roomDocuments.length})</h3>
                </div>
                {extrasLoading && <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />}
              </div>
              <div className="space-y-3 max-h-80 overflow-auto">
                {roomDocuments.map((doc) => (
                  <div key={doc._id} className="p-3 rounded-xl border border-zinc-100 bg-zinc-50">
                    <div className="flex items-center justify-between text-sm text-zinc-700">
                      <div>
                        <p className="font-semibold">{doc.originalName}</p>
                        <p className="text-xs text-zinc-500">{formatBytes(doc.fileSize)}</p>
                      </div>
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-amber-600 hover:text-amber-800"
                      >
                        Tải
                      </a>
                    </div>
                    <div className="flex justify-end mt-2">
                      <button
                        onClick={() => onDeleteDocument(doc)}
                        className="text-xs text-red-500 hover:text-red-700 inline-flex items-center gap-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Xóa
                      </button>
                    </div>
                  </div>
                ))}
                {roomDocuments.length === 0 && (
                  <p className="text-sm text-zinc-500 text-center py-6">Chưa có tài liệu</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

