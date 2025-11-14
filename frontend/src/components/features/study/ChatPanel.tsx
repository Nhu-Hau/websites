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
import { Send, Upload, Download, X, AlertCircle, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
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
          toast.error("Không 보내 được tin nhắn tài liệu");
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
      const base =
        "group/msg relative max-w-[85%] rounded-2xl px-3.5 py-2 text-sm shadow-lg border-2 transition-all duration-300";

      const bubble = isMe
        ? "bg-gradient-to-tr from-sky-600 to-indigo-600 text-white border-sky-700 rounded-tr-sm"
        : "bg-white/90 dark:bg-zinc-800/90 text-zinc-900 dark:text-zinc-100 border-white/30 dark:border-zinc-700/50 rounded-tl-sm backdrop-blur-sm";

      if (m.kind === "text") {
        return (
          <div
            key={m.id}
            className={`flex ${isMe ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`${base} ${bubble}`}
              title={new Date(m.ts).toLocaleString("vi-VN")}
            >
              {!isMe && (
                <div className="text-xs opacity-80 mb-0.5 font-black">
                  {m.fromName} • <span className="capitalize">{m.role}</span>
                </div>
              )}
              <div className="whitespace-pre-wrap break-words font-medium">
                {m.text}
              </div>
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
            className={`${base} ${
              isMe
                ? "bg-gradient-to-br from-sky-50 to-indigo-50 text-sky-900 border-sky-200"
                : "bg-white/90 dark:bg-zinc-900/90 border-white/30 dark:border-zinc-700/50 backdrop-blur-sm"
            }`}
            title={new Date(m.ts).toLocaleString("vi-VN")}
          >
            {!isMe && (
              <div className="text-xs opacity-80 mb-0.5 font-black">
                {m.fromName} - {m.role}
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-gradient-to-br from-sky-100 to-indigo-100 text-sky-700 shadow-inner">
                  <Upload className="w-4 h-4" />
                </div>
                <div className="min-w-[80px] max-w-[110px]">
                  <div
                    className="text-sm font-black truncate text-ellipsis overflow-hidden"
                    title={m.docName || "Tệp tin"}
                  >
                    {m.docName?.length && m.docName.length > 20
                      ? m.docName.slice(0, 17) + "..."
                      : m.docName || "Tệp tin"}
                  </div>
                  <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    Tài liệu đính kèm
                  </div>
                </div>
              </div>

              {canDownload && m.docId ? (
                <button
                  onClick={() => handleDownload(m.docId!)}
                  className="ml-auto flex items-center gap-1 text-xs font-black px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-400 hover:to-teal-400 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300"
                  title="Tải xuống"
                >
                  <Download className="w-3.5 h-3.5" />
                  Tải
                </button>
              ) : (
                <span
                  className="ml-auto flex items-center gap-1 text-xs font-black px-2.5 py-1.5 rounded-lg border-2 border-zinc-300 dark:border-zinc-600 text-zinc-400 cursor-not-allowed"
                  title="Chỉ Premium hoặc Teacher/Admin"
                >
                  <Download className="w-3.5 h-3.5" />
                  Khoá
                </span>
              )}
            </div>
          </div>
        </div>
      );
    });
  }, [msgs, me.id, canDownload, handleDownload]);

  return (
    <aside className="group relative h-[calc(100dvh-5rem)] md:h-[calc(100dvh-6rem)] border-l-2 border-white/30 dark:border-zinc-700/50 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-xl flex flex-col shadow-2xl ring-2 ring-white/20 dark:ring-zinc-700/50 transition-all duration-500 hover:ring-blue-300/50 dark:hover:ring-blue-600/50 overflow-hidden">
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      {/* Header */}
      <div className="relative px-4 py-3 border-b-2 border-white/30 dark:border-zinc-700/50 flex items-center justify-between bg-gradient-to-r from-blue-50/90 to-indigo-50/90 dark:from-blue-900/30 dark:to-indigo-900/20">
        <div>
          <div className="text-sm font-black text-zinc-900 dark:text-white">
            Bình luận livestream
          </div>
          <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            #{roomName}
          </div>
        </div>
        <div className="relative flex items-center gap-2">
          {canDeleteRoom && (
            <button
              onClick={handleDeleteRoom}
              className="group/del relative p-2 rounded-xl bg-red-50/80 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 transition-all duration-300 hover:scale-110 shadow-md hover:shadow-lg overflow-hidden"
              title="Xóa phòng"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-rose-500/5 opacity-0 group-hover/del:opacity-100 transition-opacity duration-300" />
              <Trash2 className="w-4 h-4 relative z-10 transition-transform group-hover/del:rotate-12" />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div
        ref={listRef}
        className="relative flex-1 px-3 py-3 space-y-2 overflow-y-auto bg-gradient-to-b from-transparent to-white/30 dark:to-zinc-800/50"
      >
        {items.length ? (
          items
        ) : (
          <div className="relative text-center mt-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 mb-3 shadow-inner ring-4 ring-white/30 dark:ring-zinc-700/30">
              <Send className="w-10 h-10 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Hãy là người bình luận đầu tiên!
            </p>
          </div>
        )}
      </div>

      {/* Input row */}
      <div className="relative p-3 border-t-2 border-white/30 dark:border-zinc-700/50 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-md">
        <form onSubmit={onSubmit} className="relative flex items-center gap-2">
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
                className="group/upload relative p-2 rounded-xl bg-white/90 dark:bg-zinc-700/90 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 overflow-hidden"
                title="Tải tệp lên và gửi vào chat"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 opacity-0 group-hover/upload:opacity-100 transition-opacity duration-300" />
                <Upload className="w-5 h-5 text-blue-600 dark:text-blue-400 relative z-10 transition-transform group-hover/upload:scale-110" />
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
            className="flex-1 rounded-2xl border-2 border-white/30 dark:border-zinc-700/50 bg-white/90 dark:bg-zinc-700/90 px-3 py-2 text-sm font-medium outline-none focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500/50 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-zinc-900 dark:text-white transition-all duration-300 shadow-md"
          />
          <button
            type="submit"
            disabled={
              !input.trim() || (!isPremium && commentCount >= commentLimit)
            }
            className="group/btn relative inline-flex items-center justify-center gap-2 rounded-2xl px-3.5 py-2 text-sm font-black bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 disabled:opacity-60 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
            <Send className="w-4 h-4 relative z-10 transition-transform group-hover/btn:translate-x-0.5" />
          </button>
        </form>
        {!isPremium && (
          <div className="relative mt-2 text-center text-xs font-black text-zinc-500 dark:text-zinc-400">
            Comment: {commentCount}/{commentLimit}
          </div>
        )}
      </div>
    </aside>
  );
}