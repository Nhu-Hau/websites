// frontend/src/components/study/ChatPanel.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRoomContext } from "@livekit/components-react";
import type { LocalParticipant, RemoteParticipant, DataPacket_Kind, Encryption_Type } from "livekit-client";
import { RoomEvent } from "livekit-client";
import { Send, Upload, FileText, Download, X, AlertCircle, Users, Ban, Trash2, Loader2 } from "lucide-react";
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

type ChatMsg = {
  id: string;
  room: string;
  fromId: string;
  fromName: string;
  role: Role;
  text: string;
  ts: number;
};

interface Props {
  me: Me;
  roomName: string;
  isHost?: boolean;
  hostIdentity?: string;
}

const LS_KEY = (room: string) => `livechat:${room}`;

export default function ChatPanel({ me, roomName, isHost, hostIdentity }: Props) {
  const room = useRoomContext();
  const { user: authUser } = useAuth();
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [documents, setDocuments] = useState<RoomDocument[]>([]);
  const [commentCount, setCommentCount] = useState(0);
  const [participants, setParticipants] = useState<any[]>([]);
  const [showDocuments, setShowDocuments] = useState(false);
  const [uploading, setUploading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // chống trùng theo id
  const seenIdsRef = useRef<Set<string>>(new Set());
  // khoá gửi + cooldown ngắn
  const sendingRef = useRef(false);
  
  const canUpload = me.role === "teacher" || me.role === "admin";
  const canKick = canUpload;
  const canDeleteRoom = isHost || me.role === "admin";
  const isPremium = authUser?.access === "premium";
  const commentLimit = isPremium ? Infinity : 5;

  // ====== localStorage helpers ======
  const saveToLS = useCallback((arr: ChatMsg[]) => {
    try {
      localStorage.setItem(LS_KEY(roomName), JSON.stringify(arr.slice(-500)));
    } catch {}
  }, [roomName]);

  const loadFromLS = useCallback(() => {
    try {
      const raw = localStorage.getItem(LS_KEY(roomName));
      if (!raw) return [];
      const parsed = JSON.parse(raw) as ChatMsg[];
      parsed.forEach(m => seenIdsRef.current.add(m.id));
      return parsed;
    } catch {
      return [];
    }
  }, [roomName]);

  // Load documents
  const loadDocuments = useCallback(async () => {
    try {
      const res = await fetch(`/api/rooms/${encodeURIComponent(roomName)}/documents`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch (e) {
      console.error("Failed to load documents:", e);
    }
  }, [roomName]);

  // Load comment count
  const loadCommentCount = useCallback(async () => {
    if (isPremium) return; // Premium không giới hạn
    try {
      const res = await fetch(`/api/rooms/${encodeURIComponent(roomName)}/comments/count/${me.id}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setCommentCount(data.count || 0);
      }
    } catch (e) {
      console.error("Failed to load comment count:", e);
    }
  }, [roomName, me.id, isPremium]);

  // Load participants (để kick)
  const loadParticipants = useCallback(async () => {
    if (!canKick) return;
    try {
      const res = await fetch(`/api/rooms/${encodeURIComponent(roomName)}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setParticipants(data.participants || []);
      }
    } catch (e) {
      console.error("Failed to load participants:", e);
    }
  }, [roomName, canKick]);

  // mount: khôi phục tin nhắn
  useEffect(() => {
    setMsgs(loadFromLS());
    loadDocuments();
    loadCommentCount();
    if (canKick) loadParticipants();
  }, [loadFromLS, loadDocuments, loadCommentCount, loadParticipants, canKick]);

  // auto-scroll
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [msgs.length]);

  // Nhận data (chỉ topic "chat"), bỏ qua self echo
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
        if (!obj || !obj.text || !obj.fromId) return;

        const id = obj.id || crypto.randomUUID();
        if (seenIdsRef.current.has(id)) return;
        seenIdsRef.current.add(id);

        const msg: ChatMsg = {
          id,
          room: obj.room || roomName,
          fromId: obj.fromId!,
          fromName: obj.fromName || participant?.name || "Guest",
          role: (obj.role as Role) || "student",
          text: obj.text!,
          ts: obj.ts || Date.now(),
        };

        setMsgs(prev => {
          const next = [...prev, msg];
          saveToLS(next);
          return next;
        });
      } catch {
        // ignore malformed
      }
    };

    room.on(RoomEvent.DataReceived, onData);
    return () => {
      room.off(RoomEvent.DataReceived, onData);
    };
  }, [room, roomName, saveToLS]);

  // Gửi comment: kết hợp LiveKit data channel (real-time) và API (lưu DB)
  const doSend = useCallback(async () => {
    const text = input.trim();
    if (!text || !room) return;
    if (sendingRef.current) return;
    
    // Kiểm tra giới hạn comment cho free user
    if (!isPremium && commentCount >= commentLimit) {
      toast.error("Bạn đã đạt giới hạn 5 comment", {
        description: "Vui lòng nâng cấp lên Premium để comment không giới hạn.",
      });
      return;
    }

    sendingRef.current = true;
    setInput("");

    // Tạo message object
    const msg: ChatMsg = {
      id: crypto.randomUUID(),
      room: roomName,
      fromId: me.id,
      fromName: me.name,
      role: me.role,
      text,
      ts: Date.now(),
    };

    // 1. Gửi qua LiveKit data channel để real-time (ngay lập tức)
    try {
      const bytes = new TextEncoder().encode(JSON.stringify(msg));
      await room.localParticipant.publishData(bytes, { reliable: true, topic: "chat" });
      
      // Echo local ngay lập tức
      seenIdsRef.current.add(msg.id);
      setMsgs(prev => {
        const next = [...prev, msg];
        saveToLS(next);
        return next;
      });
    } catch (e) {
      console.error("Failed to send via LiveKit:", e);
    }

    // 2. Lưu vào DB qua API (background, không chặn UI)
    try {
      const res = await fetch(`/api/rooms/${encodeURIComponent(roomName)}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: text }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        if (error.code === "COMMENT_LIMIT_REACHED") {
          toast.error("Bạn đã đạt giới hạn 5 comment", {
            description: "Vui lòng nâng cấp lên Premium để comment không giới hạn.",
          });
          await loadCommentCount();
        }
        // Không hiển thị lỗi nếu đã gửi thành công qua LiveKit
      } else {
        // Cập nhật comment count
        if (!isPremium) {
          setCommentCount(prev => prev + 1);
        }
      }
    } catch (e: any) {
      // Lỗi lưu DB không ảnh hưởng real-time chat
      console.error("Failed to save comment to DB:", e);
    } finally {
      setTimeout(() => { sendingRef.current = false; }, 250);
    }
  }, [room, input, me, roomName, saveToLS, isPremium, commentCount, commentLimit, loadCommentCount]);

  // Form submit: 1 luồng duy nhất
  const onSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const anyEv = e as unknown as { nativeEvent?: any };
    // tránh submit khi còn đang compose (gõ tiếng Việt)
    if (anyEv?.nativeEvent?.isComposing) return;
    void doSend();
  }, [doSend]);

  // Upload document
  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 50 * 1024 * 1024) {
      toast.error("File quá lớn", { description: "Kích thước tối đa: 50MB" });
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`/api/rooms/${encodeURIComponent(roomName)}/documents`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        toast.error(error.message || "Upload thất bại");
        return;
      }

      toast.success("Upload tài liệu thành công");
      await loadDocuments();
    } catch (e: any) {
      toast.error("Upload thất bại");
      console.error("Failed to upload:", e);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [roomName, loadDocuments]);

  // Download document
  const handleDownload = useCallback(async (doc: RoomDocument) => {
    if (!isPremium) {
      toast.error("Chỉ tài khoản Premium mới được download", {
        description: "Vui lòng nâng cấp lên Premium để download tài liệu.",
      });
      return;
    }

    try {
      const res = await fetch(`/api/rooms/${encodeURIComponent(roomName)}/documents/${doc._id}/download`, {
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        toast.error(error.message || "Download thất bại");
        return;
      }
      const data = await res.json();
      window.open(data.downloadUrl, "_blank");
    } catch (e: any) {
      toast.error("Download thất bại");
      console.error("Failed to download:", e);
    }
  }, [roomName, isPremium]);

  // Delete document
  const handleDeleteDoc = useCallback(async (docId: string) => {
    if (!confirm("Bạn có chắc muốn xóa tài liệu này?")) return;
    
    try {
      const res = await fetch(`/api/rooms/${encodeURIComponent(roomName)}/documents/${docId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        toast.error(error.message || "Xóa thất bại");
        return;
      }
      toast.success("Đã xóa tài liệu");
      await loadDocuments();
    } catch (e: any) {
      toast.error("Xóa thất bại");
      console.error("Failed to delete:", e);
    }
  }, [roomName, loadDocuments]);

  // Kick user
  const handleKick = useCallback(async (userId: string, userName: string) => {
    if (!confirm(`Bạn có chắc muốn kick "${userName}" khỏi phòng?`)) return;
    
    try {
      const res = await fetch(`/api/rooms/${encodeURIComponent(roomName)}/kick`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId, reason: "Bị kick bởi giáo viên/quản trị viên" }),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        toast.error(error.message || "Kick thất bại");
        return;
      }
      toast.success(`Đã kick "${userName}" khỏi phòng`);
      await loadParticipants();
    } catch (e: any) {
      toast.error("Kick thất bại");
      console.error("Failed to kick:", e);
    }
  }, [roomName, loadParticipants]);

  // Delete room
  const handleDeleteRoom = useCallback(async () => {
    if (!confirm("Bạn có chắc muốn xóa phòng này? Tất cả dữ liệu sẽ bị mất.")) return;
    
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

  const items = useMemo(() => {
    return msgs.map((m) => {
      const isMe = m.fromId === me.id;
      return (
        <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
          <div
            className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm shadow-sm
              ${isMe ? "bg-sky-600 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"}`}
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
    });
  }, [msgs, me.id]);

  return (
    <aside className="h-[calc(100dvh-5rem)] md:h-[calc(100dvh-6rem)] border-l border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/50 backdrop-blur-sm flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">Bình luận livestream</div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">#{roomName}</div>
        </div>
        <div className="flex items-center gap-2">
          {canUpload && (
            <button
              onClick={() => setShowDocuments(!showDocuments)}
              className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
              title="Tài liệu"
            >
              <FileText className="w-4 h-4" />
            </button>
          )}
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

      {/* Documents Section */}
      {showDocuments && canUpload && (
        <div className="px-3 py-2 border-b border-zinc-200 dark:border-zinc-800 max-h-40 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold">Tài liệu</span>
            <label className="cursor-pointer">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleUpload}
                className="hidden"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png"
              />
              <button
                type="button"
                disabled={uploading}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-sky-600 text-white hover:bg-sky-500 disabled:opacity-60"
              >
                {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                Upload
              </button>
            </label>
          </div>
          <div className="space-y-1">
            {documents.length === 0 ? (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Chưa có tài liệu</p>
            ) : (
              documents.map((doc) => (
                <div key={doc._id} className="flex items-center justify-between text-xs p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800">
                  <span className="truncate flex-1">{doc.originalName}</span>
                  <div className="flex items-center gap-1">
                    {isPremium ? (
                      <button
                        onClick={() => handleDownload(doc)}
                        className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700"
                        title="Download"
                      >
                        <Download className="w-3 h-3" />
                      </button>
                    ) : (
                      <span className="text-zinc-400" title="Premium only">
                        <Download className="w-3 h-3 opacity-50" />
                      </span>
                    )}
                    {canUpload && (
                      <button
                        onClick={() => handleDeleteDoc(doc._id)}
                        className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600"
                        title="Xóa"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

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

      {/* Comment limit warning */}
      {!isPremium && commentCount >= commentLimit && (
        <div className="px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border-t border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300">
            <AlertCircle className="w-4 h-4" />
            <span>Bạn đã đạt giới hạn 5 comment. <a href="/account" className="underline font-medium">Nâng cấp Premium</a> để comment không giới hạn.</span>
          </div>
        </div>
      )}

      {/* Input (Form) */}
      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800">
        <form onSubmit={onSubmit} className="flex items-stretch gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={!isPremium && commentCount >= commentLimit ? "Đã đạt giới hạn comment" : "Nhập tin nhắn…"}
            disabled={!isPremium && commentCount >= commentLimit}
            className="flex-1 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-400 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!input.trim() || (!isPremium && commentCount >= commentLimit)}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold bg-sky-600 text-white hover:bg-sky-500 disabled:opacity-60"
          >
            <Send className="w-4 h-4" />
            Gửi
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