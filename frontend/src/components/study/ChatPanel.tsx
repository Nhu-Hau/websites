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
  // Với doc:
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
        {
          credentials: "include",
        }
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
      if (participant && "isLocal" in participant && participant.isLocal)
        return;

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
      } catch {
        // ignore
      }
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

    // save to DB (background)
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
      const anyEv = e as unknown as { nativeEvent?: any };
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

        // phát 1 chat message kind="doc"
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
          toast.error("Không gửi được tin nhắn tài liệu");
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

  // download (premium only)
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
          `/api/rooms/${encodeURIComponent(
            roomName
          )}/documents/${docId}/download`,
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
    if (!confirm("Bạn có chắc muốn xóa phòng này? Tất cả dữ liệu sẽ bị mất."))
      return;

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
    } catch (e: any) {
      toast.error("Xóa phòng thất bại");
      console.error("Failed to delete room:", e);
    }
  }, [roomName]);

  // render message bubbles
  const items = useMemo(() => {
    return msgs.map((m) => {
      const isMe = m.fromId === me.id;
      const base =
        "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm shadow-sm border transition";
      const bubble = isMe
        ? "bg-sky-600 text-white border-sky-700"
        : "bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-700";

      // 💬 text message
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
                <div className="text-[11px] opacity-70 mb-0.5">
                  {m.fromName} • {m.role}
                </div>
              )}
              <div className="whitespace-pre-wrap break-words">{m.text}</div>
            </div>
          </div>
        );
      }

      // 📎 doc message
      return (
        <div
          key={m.id}
          className={`flex ${isMe ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`${base} ${
              isMe
                ? "bg-sky-50 text-sky-900 border-sky-200"
                : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700"
            }`}
            title={new Date(m.ts).toLocaleString("vi-VN")}
          >
            {!isMe && (
              <div className="text-[11px] opacity-70 mb-0.5">
                {m.fromName} - {m.role}
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                  <Upload className="w-4 h-4" />
                </div>
                <div className="min-w-[80px] max-w-[110px]">
                  <div
                    className="text-sm font-medium truncate text-ellipsis overflow-hidden"
                    title={m.docName || "Tệp tin"}
                  >
                    {m.docName?.length && m.docName.length > 20
                      ? m.docName.slice(0, 17) + "..."
                      : m.docName || "Tệp tin"}
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                    Tài liệu đính kèm
                  </div>
                </div>
              </div>

              {canDownload && m.docId ? (
                <a
                  href={`/api/rooms/${encodeURIComponent(roomName)}/documents/${
                    m.docId
                  }/download`}
                  target="_blank"
                  rel="noopener"
                  className="ml-auto flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                  title="Tải xuống"
                >
                  <Download className="w-3.5 h-3.5" />
                  Tải
                </a>
              ) : (
                <span
                  className="ml-auto flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-zinc-300 text-zinc-400 cursor-not-allowed"
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
  }, [msgs, me.id, isPremium, handleDownload]);

  return (
    <aside className="h-[calc(100dvh-5rem)] md:h-[calc(100dvh-6rem)] border-l border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/50 backdrop-blur-sm flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">Bình luận livestream</div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            #{roomName}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canDeleteRoom && (
            <button
              onClick={handleDeleteRoom}
              className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400"
              title="Xóa phòng"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div ref={listRef} className="flex-1 px-3 py-3 space-y-2 overflow-y-auto">
        {items.length ? (
          items
        ) : (
          <div className="text-xs text-zinc-500 dark:text-zinc-400 text-center mt-6">
            Hãy là người bình luận đầu tiên!
          </div>
        )}
      </div>

      {/* Input row */}
      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800">
        <form onSubmit={onSubmit} className="flex items-center gap-2">
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
                className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                title="Tải tệp lên và gửi vào chat"
              >
                <Upload className="w-5 h-5 text-sky-600" />
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
            className="flex-1 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-400 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={
              !input.trim() || (!isPremium && commentCount >= commentLimit)
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold bg-sky-600 text-white hover:bg-sky-500 disabled:opacity-60"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        {!isPremium && (
          <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 text-center">
            Comment: {commentCount}/{commentLimit}
          </div>
        )}
      </div>
    </aside>
  );
}
