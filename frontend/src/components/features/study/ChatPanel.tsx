// frontend/src/components/study/ChatPanel.tsx
"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRoomContext } from "@livekit/components-react";
import type {
  LocalParticipant,
  RemoteParticipant,
  DataPacket_Kind,
  Encryption_Type,
} from "livekit-client";
import { RoomEvent } from "livekit-client";
import { Send, Upload, Download, X, AlertCircle, Trash2, MessageSquare } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/lib/toast";
import Swal from "sweetalert2";

type Role = "student" | "teacher" | "admin";
type Me = { id: string; name: string; role: Role };

type RoomDocument = {
  _id: string;
  roomName: string;
  uploadedBy: { id: string; name?: string; role?: string };
  fileName: string;
  originalName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
};

type ChatMsgKind = "text" | "doc";

type ChatMsg = {
  id: string;
  kind: ChatMsgKind;
  room: string;
  fromId: string;
  fromName: string;
  role: Role;
  text?: string;
  docId?: string;
  docName?: string;
  ts: number;
};

interface Props {
  me: Me;
  roomName: string;
  isHost?: boolean;
  hostIdentity?: string;
}

const LS_KEY = (room: string) => `livechat:${room}`;

export default function ChatPanel({ me, roomName }: Props) {
  const room = useRoomContext();
  const { user: authUser } = useAuth();

  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [commentCount, setCommentCount] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadingRef = useRef(false);

  const seenIdsRef = useRef<Set<string>>(new Set());
  const sendingRef = useRef(false);

  const isPremium = authUser?.access === "premium";
  const canUpload = me.role === "teacher" || me.role === "admin" || isPremium;
  const canDeleteRoom = me.role === "admin" || me.role === "teacher";
  const commentLimit = isPremium ? Infinity : 5;
  const canDownload = isPremium || me.role === "teacher" || me.role === "admin";

  // ===== localStorage =====
  const saveToLS = useCallback(
    (arr: ChatMsg[]) => {
      try {
        localStorage.setItem(LS_KEY(roomName), JSON.stringify(arr.slice(-500)));
      } catch {}
    },
    [roomName]
  );

  const loadFromLS = useCallback(() => {
    try {
      const raw = localStorage.getItem(LS_KEY(roomName));
      if (!raw) return [];
      const parsed = JSON.parse(raw) as ChatMsg[];
      parsed.forEach((m) => seenIdsRef.current.add(m.id));
      return parsed;
    } catch {
      return [];
    }
  }, [roomName]);

  // ===== counters =====
  const loadCommentCount = useCallback(async () => {
    if (isPremium) return;
    try {
      const res = await fetch(
        `/api/rooms/${encodeURIComponent(roomName)}/comments/count/${me.id}`,
        { credentials: "include" }
      );
      if (res.ok) {
        const data = await res.json();
        setCommentCount(data.count || 0);
      }
    } catch {}
  }, [roomName, me.id, isPremium]);

  // mount
  useEffect(() => {
    setMsgs(loadFromLS());
    loadCommentCount();
  }, [loadFromLS, loadCommentCount]);

  // autoscroll
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [msgs.length]);

  // receive data
  useEffect(() => {
    if (!room) return;

    const onData = (
      payload: Uint8Array<ArrayBufferLike>,
      participant?: RemoteParticipant | LocalParticipant,
      _kind?: DataPacket_Kind,
      topic?: string,
      _enc?: Encryption_Type
    ) => {
      if (topic !== "chat") return;
      if (participant && "isLocal" in participant && participant.isLocal) return;

      try {
        const text = new TextDecoder().decode(payload);
        const obj = JSON.parse(text) as Partial<ChatMsg>;
        if (!obj || !obj.fromId || (!obj.text && obj.kind !== "doc")) return;

        const id = obj.id || crypto.randomUUID();
        if (seenIdsRef.current.has(id)) return;
        seenIdsRef.current.add(id);

        const msg: ChatMsg = {
          id,
          kind: (obj.kind as ChatMsgKind) || "text",
          room: obj.room || roomName,
          fromId: obj.fromId!,
          fromName: obj.fromName || participant?.name || "Guest",
          role: (obj.role as Role) || "student",
          text: obj.text,
          docId: obj.docId,
          docName: obj.docName,
          ts: obj.ts || Date.now(),
        };

        setMsgs((prev) => {
          const next = [...prev, msg];
          saveToLS(next);
          return next;
        });
      } catch {}
    };

    room.on(RoomEvent.DataReceived, onData);
    return () => {
      room.off(RoomEvent.DataReceived, onData);
    };
  }, [room, roomName, saveToLS]);

  // send TEXT
  const sendText = useCallback(async () => {
    const text = input.trim();
    if (!text || !room) return;
    if (sendingRef.current) return;

    if (!isPremium && commentCount >= commentLimit) {
      toast.error("Bạn đã đạt giới hạn 5 comment", {
        description: "Nâng cấp Premium để comment không giới hạn.",
      });
      return;
    }

    sendingRef.current = true;
    setInput("");

    const msg: ChatMsg = {
      id: crypto.randomUUID(),
      kind: "text",
      room: roomName,
      fromId: me.id,
      fromName: me.name,
      role: me.role,
      text,
      ts: Date.now(),
    };

    try {
      const bytes = new TextEncoder().encode(JSON.stringify(msg));
      await room.localParticipant.publishData(bytes, {
        reliable: true,
        topic: "chat",
      });

      seenIdsRef.current.add(msg.id);
      setMsgs((prev) => {
        const next = [...prev, msg];
        saveToLS(next);
        return next;
      });
    } catch (e) {
      console.error("LiveKit send error:", e);
    }

    try {
      const res = await fetch(
        `/api/rooms/${encodeURIComponent(roomName)}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ content: text }),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (err.code === "COMMENT_LIMIT_REACHED") {
          toast.error("Bạn đã đạt giới hạn 5 comment", {
            description: "Nâng cấp Premium để comment không giới hạn.",
          });
          await loadCommentCount();
        }
      } else {
        if (!isPremium) setCommentCount((c) => c + 1);
      }
    } catch {}

    setTimeout(() => (sendingRef.current = false), 250);
  }, [
    room,
    input,
    me,
    roomName,
    saveToLS,
    isPremium,
    commentCount,
    commentLimit,
    loadCommentCount,
  ]);

  const onSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const anyEv = e as unknown as { nativeEvent?: { isComposing?: boolean } };
      if (anyEv?.nativeEvent?.isComposing) return;
      void sendText();
    },
    [sendText]
  );

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!canUpload) return;

      if (file.size > 50 * 1024 * 1024) {
        toast.error("File quá lớn", { description: "Tối đa 50MB" });
        e.currentTarget.value = "";
        return;
      }
      if (uploadingRef.current) return;
      uploadingRef.current = true;

      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch(
          `/api/rooms/${encodeURIComponent(roomName)}/documents`,
          {
            method: "POST",
            credentials: "include",
            body: formData,
          }
        );
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          toast.error(err.message || "Upload thất bại");
          return;
        }
        const data = await res.json();
        const doc = data.document as RoomDocument;

        const docMsg: ChatMsg = {
          id: crypto.randomUUID(),
          kind: "doc",
          room: roomName,
          fromId: me.id,
          fromName: me.name,
          role: me.role,
          docId: doc._id,
          docName: doc.originalName || doc.fileName,
          ts: Date.now(),
        };

        try {
          const bytes = new TextEncoder().encode(JSON.stringify(docMsg));
          await room!.localParticipant.publishData(bytes, {
            reliable: true,
            topic: "chat",
          });

          seenIdsRef.current.add(docMsg.id);
          setMsgs((prev) => {
            const next = [...prev, docMsg];
            saveToLS(next);
            return next;
          });
          toast.success("Đã gửi tài liệu vào chat");
        } catch (err) {
          console.error("Send doc message failed:", err);
          toast.error("Không thể gửi tin nhắn tài liệu");
        }
      } catch (err) {
        console.error("Upload error:", err);
        toast.error("Upload thất bại");
      } finally {
        uploadingRef.current = false;
        e.currentTarget.value = "";
      }
    },
    [roomName, canUpload, me, room, saveToLS]
  );

  const handleDownload = useCallback(
    async (docId: string) => {
      if (!isPremium) {
        toast.error("Chỉ tài khoản Premium mới được download", {
          description: "Vui lòng nâng cấp để tải tài liệu.",
        });
        return;
      }
      try {
        const res = await fetch(
          `/api/rooms/${encodeURIComponent(roomName)}/documents/${docId}/download`,
          { credentials: "include" }
        );
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          toast.error(err.message || "Download thất bại");
          return;
        }
        const { downloadUrl } = await res.json();
        window.open(downloadUrl, "_blank");
      } catch (e) {
        toast.error("Download thất bại");
      }
    },
    [roomName, isPremium]
  );

  const handleDeleteRoom = useCallback(async () => {
    const result = await Swal.fire({
      title: "Xác nhận xoá",
      text: "Bạn có chắc muốn xóa phòng này? Tất cả dữ liệu sẽ bị mất.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#ef4444",
    });
    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/rooms/${encodeURIComponent(roomName)}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        toast.error(error.message || "Xóa phòng thất bại");
        return;
      }
      toast.success("Đã xóa phòng");
      window.location.href = "/study/create";
    } catch (e: unknown) {
      toast.error("Xóa phòng thất bại");
      console.error("Failed to delete room:", e);
    }
  }, [roomName]);

  // render message bubbles
  const items = useMemo(() => {
    return msgs.map((m) => {
      const isMe = m.fromId === me.id;

      if (m.kind === "text") {
        return (
          <div
            key={m.id}
            className={`flex ${isMe ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`relative max-w-[85%] rounded-lg px-3 py-2 text-sm shadow-sm transition-all duration-200 ${
                isMe
                  ? "bg-blue-600 text-white rounded-tr-sm"
                  : "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 rounded-tl-sm"
              }`}
              title={new Date(m.ts).toLocaleString("vi-VN")}
            >
              {!isMe && (
                <div className="text-xs font-medium opacity-75 mb-1">
                  {m.fromName} • <span className="capitalize">{m.role}</span>
                </div>
              )}
              <div className="whitespace-pre-wrap break-words">{m.text}</div>
            </div>
          </div>
        );
      }

      return (
        <div
          key={m.id}
          className={`flex ${isMe ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`relative max-w-[85%] rounded-lg px-3 py-2 text-sm shadow-sm border transition-all duration-200 ${
              isMe
                ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100"
                : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white"
            }`}
            title={new Date(m.ts).toLocaleString("vi-VN")}
          >
            {!isMe && (
              <div className="text-xs font-medium opacity-75 mb-1">
                {m.fromName} • <span className="capitalize">{m.role}</span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-700">
                  <Upload className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                </div>
                <div className="min-w-[80px] max-w-[110px]">
                  <div
                    className="text-sm font-medium truncate"
                    title={m.docName || "Tệp tin"}
                  >
                    {m.docName?.length && m.docName.length > 20
                      ? m.docName.slice(0, 17) + "..."
                      : m.docName || "Tệp tin"}
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    Tài liệu
                  </div>
                </div>
              </div>

              {canDownload && m.docId ? (
                <button
                  onClick={() => handleDownload(m.docId!)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                  title="Tải xuống"
                >
                  <Download className="w-3.5 h-3.5" />
                  Tải
                </button>
              ) : (
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-600 text-zinc-400 dark:text-zinc-500 text-xs cursor-not-allowed"
                  title="Chỉ Premium hoặc Teacher/Admin"
                >
                  <Download className="w-3.5 h-3.5" />
                  Khóa
                </span>
              )}
            </div>
          </div>
        </div>
      );
    });
  }, [msgs, me.id, canDownload, handleDownload]);

  return (
    <aside className="flex flex-col h-[calc(100dvh-5rem)] md:h-[calc(100dvh-6rem)] border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
            <span className="text-sm font-semibold text-zinc-900 dark:text-white">
              Bình luận
            </span>
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-500 mt-0.5">
            #{roomName}
          </div>
        </div>
        {canDeleteRoom && (
          <button
            onClick={handleDeleteRoom}
            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            title="Xóa phòng"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div
        ref={listRef}
        className="flex-1 px-4 py-4 space-y-3 overflow-y-auto"
      >
        {items.length ? (
          items
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 mb-4">
              <Send className="h-8 w-8 text-zinc-400 dark:text-zinc-500" />
            </div>
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Hãy là người bình luận đầu tiên!
            </p>
          </div>
        )}
      </div>

      {/* Input row */}
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <form onSubmit={onSubmit} className="flex items-end gap-2">
          {canUpload && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleUpload}
                className="hidden"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif,.heic,.webp"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                title="Tải tệp lên và gửi vào chat"
              >
                <Upload className="w-4 h-4" />
              </button>
            </>
          )}
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              !isPremium && commentCount >= commentLimit
                ? "Đã đạt giới hạn comment"
                : "Nhập tin nhắn…"
            }
            disabled={!isPremium && commentCount >= commentLimit}
            className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={
              !input.trim() || (!isPremium && commentCount >= commentLimit)
            }
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        {!isPremium && (
          <div className="mt-2 text-center text-xs text-zinc-500 dark:text-zinc-500">
            Comment: {commentCount}/{commentLimit}
          </div>
        )}
      </div>
    </aside>
  );
}
