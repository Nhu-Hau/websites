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
import {
  Send,
  Upload,
  Download,
  X,
  AlertCircle,
  MessageSquare,
  MoreVertical,
  Edit,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/lib/toast";
import { useConfirmModal } from "@/components/common/ConfirmModal";
import { cn } from "@/lib/utils";

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
  editedAt?: number;
  commentId?: string; // ID từ database để edit/delete
};

interface Props {
  me: Me;
  roomName: string;
  isHost?: boolean;
  hostIdentity?: string;
  className?: string;
  variant?: "sidebar" | "overlay";
  onCloseOverlay?: () => void;
}

const LS_KEY = (room: string) => `livechat:${room}`;

export default function ChatPanel({
  me,
  roomName,
  className,
  variant = "sidebar",
  onCloseOverlay,
}: Props) {
  const room = useRoomContext();
  const { user: authUser } = useAuth();
  const { show, Modal: ConfirmModal } = useConfirmModal();
  const isOverlay = variant === "overlay";

  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [commentCount, setCommentCount] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadingRef = useRef(false);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const sendingRef = useRef(false);

  const isPremium = authUser?.access === "premium";
  const canUpload = me.role === "teacher" || me.role === "admin" || isPremium;
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

  // Load comments from API to get commentId
  const loadCommentsFromAPI = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/rooms/${encodeURIComponent(roomName)}/comments`,
        { credentials: "include" }
      );
      if (!res.ok) return;
      const data = await res.json();
      const apiComments = (data.comments || []) as Array<{
        _id: string;
        userId: string;
        userName: string;
        userRole: string;
        content: string;
        createdAt: string;
        editedAt?: string;
      }>;

      // Merge với messages từ localStorage, cập nhật commentId
      setMsgs((prev) => {
        const updated = prev.map((msg) => {
          if (msg.kind === "text" && msg.fromId === me.id && !msg.commentId) {
            // Tìm comment tương ứng từ API (match theo content và userId)
            const apiComment = apiComments.find(
              (c) =>
                c.userId === me.id &&
                c.content === msg.text &&
                Math.abs(
                  new Date(c.createdAt).getTime() - msg.ts
                ) < 60000 // Trong vòng 1 phút
            );
            if (apiComment) {
              return {
                ...msg,
                commentId: apiComment._id,
                editedAt: apiComment.editedAt
                  ? new Date(apiComment.editedAt).getTime()
                  : undefined,
              };
            }
          }
          return msg;
        });
        saveToLS(updated);
        return updated;
      });
    } catch {}
  }, [roomName, me.id, saveToLS]);

  // mount
  useEffect(() => {
    setMsgs(loadFromLS());
    loadCommentCount();
    loadCommentsFromAPI();
  }, [loadFromLS, loadCommentCount, loadCommentsFromAPI]);

  // autoscroll
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [msgs.length]);

  // Close menu when clicking outside
  useEffect(() => {
    if (!menuOpenId) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(`[data-menu-id="${menuOpenId}"]`)) {
        setMenuOpenId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpenId]);

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
      if (topic === "chat") {
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
            editedAt: obj.editedAt,
            commentId: obj.commentId,
          };

          setMsgs((prev) => {
            const next = [...prev, msg];
            saveToLS(next);
            return next;
          });
        } catch {}
      } else if (topic === "chat-edit") {
        try {
          const text = new TextDecoder().decode(payload);
          const obj = JSON.parse(text) as Partial<ChatMsg>;
          if (!obj?.id) return;

          setMsgs((prev) => {
            const next = prev.map((m) =>
              m.id === obj.id
                ? { ...m, text: obj.text, editedAt: obj.editedAt || Date.now() }
                : m
            );
            saveToLS(next);
            return next;
          });
        } catch {}
      } else if (topic === "chat-delete") {
        try {
          const text = new TextDecoder().decode(payload);
          const obj = JSON.parse(text) as Partial<ChatMsg>;
          if (!obj?.id) return;

          setMsgs((prev) => {
            const next = prev.filter((m) => m.id !== obj.id);
            saveToLS(next);
            return next;
          });
        } catch {}
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
        const data = await res.json().catch(() => ({}));
        if (data.comment?._id) {
          // Cập nhật msg với commentId từ database
          setMsgs((prev) => {
            const next = prev.map((m) =>
              m.id === msg.id ? { ...m, commentId: data.comment._id } : m
            );
            saveToLS(next);
            return next;
          });
        }
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

  const handleEditComment = useCallback(
    async (msgId: string, newText: string) => {
      const msg = msgs.find((m) => m.id === msgId);
      if (!msg || !msg.commentId) {
        toast.error("Không thể chỉnh sửa comment này");
        return;
      }

      try {
        const res = await fetch(
          `/api/rooms/${encodeURIComponent(roomName)}/comments/${msg.commentId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ content: newText.trim() }),
          }
        );

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          toast.error(err.message || "Chỉnh sửa thất bại");
          return;
        }

        const data = await res.json();
        setMsgs((prev) => {
          const next = prev.map((m) =>
            m.id === msgId
              ? {
                  ...m,
                  text: newText.trim(),
                  editedAt: data.comment?.editedAt
                    ? new Date(data.comment.editedAt).getTime()
                    : Date.now(),
                }
              : m
          );
          saveToLS(next);
          return next;
        });

        // Broadcast edit qua LiveKit
        try {
          const editMsg: Partial<ChatMsg> = {
            id: msgId,
            kind: "text",
            text: newText.trim(),
            editedAt: Date.now(),
          };
          const bytes = new TextEncoder().encode(JSON.stringify(editMsg));
          await room!.localParticipant.publishData(bytes, {
            reliable: true,
            topic: "chat-edit",
          });
        } catch {}

        toast.success("Đã chỉnh sửa comment");
        setEditingId(null);
        setEditText("");
      } catch (e) {
        console.error("Edit comment error:", e);
        toast.error("Chỉnh sửa thất bại");
      }
    },
    [msgs, roomName, room, saveToLS]
  );

  const handleDeleteComment = useCallback(
    async (msgId: string) => {
      const msg = msgs.find((m) => m.id === msgId);
      if (!msg || !msg.commentId) {
        toast.error("Không thể xóa comment này");
        return;
      }

      show(
        {
          title: "Xóa bình luận?",
          message: "Bạn có chắc chắn muốn xóa bình luận này?",
          icon: "warning",
          confirmText: "Xóa",
          cancelText: "Hủy",
          confirmColor: "red",
        },
        async () => {
          try {
            const res = await fetch(
              `/api/rooms/${encodeURIComponent(roomName)}/comments/${msg.commentId}`,
              {
                method: "DELETE",
                credentials: "include",
              }
            );

            if (!res.ok) {
              const err = await res.json().catch(() => ({}));
              toast.error(err.message || "Xóa thất bại");
              return;
            }

            setMsgs((prev) => {
              const next = prev.filter((m) => m.id !== msgId);
              saveToLS(next);
              return next;
            });

            // Broadcast delete qua LiveKit
            try {
              const deleteMsg: Partial<ChatMsg> = {
                id: msgId,
                kind: "text",
              };
              const bytes = new TextEncoder().encode(JSON.stringify(deleteMsg));
              await room!.localParticipant.publishData(bytes, {
                reliable: true,
                topic: "chat-delete",
              });
            } catch {}

            toast.success("Đã xóa comment");
            setMenuOpenId(null);
          } catch (e) {
            console.error("Delete comment error:", e);
            toast.error("Xóa thất bại");
          }
        }
      );
    },
    [msgs, roomName, room, show, saveToLS]
  );


  // render message bubbles
  const items = useMemo(() => {
    return msgs.map((m) => {
      const isMe = m.fromId === me.id;
      const canEdit = isMe && m.commentId && m.kind === "text";
      const isEditing = editingId === m.id;

      if (m.kind === "text") {
        if (isEditing) {
          return (
            <div
              key={m.id}
              className={cn("flex", isMe ? "justify-end" : "justify-start")}
            >
              <div className="relative max-w-[85%] rounded-2xl border border-sky-300 bg-white p-3 shadow-sm dark:border-sky-700 dark:bg-zinc-900">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:border-slate-700 dark:bg-zinc-900 dark:text-zinc-50"
                  rows={3}
                  autoFocus
                />
                <div className="mt-2 flex items-center justify-end gap-2">
                  <button
                    onClick={() => {
                      setEditingId(null);
                      setEditText("");
                    }}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-zinc-800"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={() => handleEditComment(m.id, editText)}
                    disabled={!editText.trim()}
                    className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-700 disabled:opacity-50 dark:bg-sky-500 dark:hover:bg-sky-600"
                  >
                    Lưu
                  </button>
                </div>
              </div>
            </div>
          );
        }

        return (
          <div
            key={m.id}
            className={cn(
              "group flex",
              isMe ? "justify-end" : "justify-start"
            )}
            onContextMenu={(e) => {
              if (canEdit) {
                e.preventDefault();
                setMenuOpenId(menuOpenId === m.id ? null : m.id);
              }
            }}
          >
            <div
              className={cn(
                "relative max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm transition-all duration-200",
                isMe
                  ? "rounded-br-sm bg-sky-600 text-white dark:bg-sky-500"
                  : "rounded-bl-sm border border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-zinc-900 dark:text-zinc-50"
              )}
              title={new Date(m.ts).toLocaleString("vi-VN")}
            >
              {canEdit && (
                <button
                  onClick={() => setMenuOpenId(menuOpenId === m.id ? null : m.id)}
                  className="absolute -right-2 -top-2 hidden rounded-full bg-slate-100 p-1.5 shadow-md hover:bg-slate-200 group-hover:block dark:bg-zinc-800 dark:hover:bg-zinc-700"
                >
                  <MoreVertical className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                </button>
              )}
              {menuOpenId === m.id && canEdit && (
                <div
                  data-menu-id={m.id}
                  className="absolute right-0 top-full mt-1 z-[100] rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-zinc-900"
                >
                  <button
                    onClick={() => {
                      setEditingId(m.id);
                      setEditText(m.text || "");
                      setMenuOpenId(null);
                    }}
                    className="flex w-full items-center gap-2 rounded-t-lg px-3 py-2 text-left text-xs hover:bg-slate-50 dark:hover:bg-zinc-800 whitespace-nowrap"
                  >
                    <Edit className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                    <span className="text-black">Chỉnh sửa</span>
                  </button>
                  <button
                    onClick={() => handleDeleteComment(m.id)}
                    className="flex w-full items-center gap-2 rounded-b-lg px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Xóa</span>
                  </button>
                </div>
              )}
              {!isMe && (
                <div className="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                  {m.fromName} •{" "}
                  <span className="capitalize text-sky-600 dark:text-sky-300">
                    {m.role}
                  </span>
                </div>
              )}
              <div className="whitespace-pre-wrap break-words">{m.text}</div>
              {m.editedAt && (
                <div className="mt-1 text-[10px] italic text-slate-400 dark:text-slate-500">
                  Đã chỉnh sửa
                </div>
              )}
            </div>
          </div>
        );
      }

      return (
        <div
          key={m.id}
          className={cn("flex", isMe ? "justify-end" : "justify-start")}
        >
          <div
            className={cn(
              "relative max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm border transition-all duration-200",
              isMe
                ? "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-700 dark:bg-sky-950/40 dark:text-sky-100"
                : "border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-zinc-900 dark:text-zinc-50"
            )}
            title={new Date(m.ts).toLocaleString("vi-VN")}
          >
            {!isMe && (
              <div className="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                {m.fromName} •{" "}
                  <span className="capitalize text-sky-600 dark:text-sky-300">
                    {m.role}
                  </span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                  <Upload className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                </div>
                <div className="min-w-[80px] max-w-[110px]">
                  <div
                    className="truncate text-sm font-medium"
                    title={m.docName || "Tệp tin"}
                  >
                    {m.docName?.length && m.docName.length > 20
                      ? m.docName.slice(0, 17) + "..."
                      : m.docName || "Tệp tin"}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Tài liệu
                  </div>
                </div>
              </div>

              {canDownload && m.docId ? (
                <button
                  onClick={() => handleDownload(m.docId!)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-2.5 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 dark:bg-sky-500 dark:hover:bg-sky-600"
                  title="Tải xuống"
                >
                  <Download className="h-3.5 w-3.5" />
                  Tải
                </button>
              ) : (
                <span
                  className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-400 dark:border-slate-600 dark:text-slate-500"
                  title="Chỉ Premium hoặc Teacher/Admin"
                >
                  <Download className="h-3.5 w-3.5" />
                  Khóa
                </span>
              )}
            </div>
          </div>
        </div>
      );
    });
  }, [
    msgs,
    me.id,
    canDownload,
    handleDownload,
    editingId,
    editText,
    menuOpenId,
    handleEditComment,
    handleDeleteComment,
  ]);

  return (
    <aside
      className={cn(
        "relative flex md:max-h-[85vh] max-h-[100vh] flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-sm ring-1 ring-black/[0.03] dark:border-zinc-800/80 dark:bg-zinc-950/90 md:my-5",
        isOverlay ? "w-full md:w-[420px]" : "w-full",
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {/* top accent */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-500 via-sky-500 to-emerald-500" />

      {/* Header */}
      <div
        className={cn(
          "flex items-center justify-between border-b border-slate-200 bg-slate-50/95 px-4 py-3 text-sm dark:border-zinc-800 dark:bg-zinc-900/95",
          "sticky top-0 z-20"
        )}
      >
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-300">
              <MessageSquare className="h-4 w-4" />
            </div>
            <span className="font-semibold text-slate-900 dark:text-zinc-50">
              Bình luận
            </span>
          </div>
          <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
            Phòng: <span className="font-medium text-slate-700">#{roomName}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isOverlay && (
            <button
              type="button"
              onClick={onCloseOverlay}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-zinc-800"
              aria-label="Đóng chat"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div
        ref={listRef}
        className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
      >
        {items.length ? (
          items
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
              <Send className="h-8 w-8 text-slate-400 dark:text-slate-500" />
            </div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Hãy là người bình luận đầu tiên!
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Trao đổi với bạn bè hoặc giảng viên ngay trong phòng học này.
            </p>
          </div>
        )}
      </div>

      {/* Input row */}
      <div className="border-t border-slate-200 bg-white/95 px-4 py-3 text-sm dark:border-zinc-800 dark:bg-zinc-950/95">
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
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 dark:border-slate-700 dark:bg-zinc-900 dark:text-slate-200 dark:hover:bg-zinc-800"
                title="Tải tệp lên và gửi vào chat"
              >
                <Upload className="h-4 w-4" />
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
            className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:border-slate-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-slate-500"
          />

          <button
            type="submit"
            disabled={
              !input.trim() || (!isPremium && commentCount >= commentLimit)
            }
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-sky-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-sky-500 dark:hover:bg-sky-600"
          >
            <Send className="h-4 w-4" />
            Gửi
          </button>
        </form>

        {!isPremium && (
          <div className="mt-2 flex items-center justify-center gap-1 text-[11px] text-slate-500 dark:text-slate-500">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>
              Comment:{" "}
              <span className="font-semibold">
                {commentCount}/{commentLimit}
              </span>
            </span>
          </div>
        )}
      </div>

      {/* Confirm Modal */}
      {ConfirmModal}
    </aside>
  );
}