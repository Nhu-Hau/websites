"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { FiMessageSquare, FiX, FiSend, FiTrash2, FiUser } from "react-icons/fi";
import { FaUserTie } from "react-icons/fa";
import { useTranslations } from "next-intl";
import useClickOutside from "@/hooks/useClickOutside";
import { useAuth } from "@/context/AuthContext";
import { postJson } from "@/lib/http";
import { useSocket } from "@/hooks/useSocket";

type Msg = {
  _id?: string;
  id?: string;
  role: "user" | "admin";
  content: string;
  at?: number;
  createdAt?: string;
  /** hiển thị bong bóng chờ */
  pending?: boolean;
};

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// Component để render message content
function MessageContent({
  content,
  role,
  pending,
}: {
  content: string;
  role: "user" | "admin";
  pending?: boolean;
}) {
  if (role === "user") {
    return <div className="whitespace-pre-wrap">{content}</div>;
  }

  // Admin
  if (pending) {
    return (
      <div className="flex items-center gap-2 text-sm opacity-80">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        <span>Đang gửi…</span>
      </div>
    );
  }

  return <div className="whitespace-pre-wrap">{content}</div>;
}

export default function AdminChatBox() {
  const t = useTranslations("adminChat");
  const { user } = useAuth();
  const { socket } = useSocket();
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [sessionId, setSessionId] = useState(() => {
    if (typeof window !== "undefined") {
      // Tạo sessionId riêng cho mỗi user
      const userSessionKey = `adminChatSessionId_${user?.id || 'anonymous'}`;
      const stored = localStorage.getItem(userSessionKey);
      if (stored) return stored;
    }
    const newSessionId = `admin_session_${user?.id || 'anonymous'}_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2)}`;
    if (typeof window !== "undefined") {
      const userSessionKey = `adminChatSessionId_${user?.id || 'anonymous'}`;
      localStorage.setItem(userSessionKey, newSessionId);
    }
    return newSessionId;
  });
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useClickOutside(wrapperRef, () => setOpen(false));

  // Update sessionId when user changes
  useEffect(() => {
    if (user?.id) {
      const userSessionKey = `adminChatSessionId_${user.id}`;
      const stored = localStorage.getItem(userSessionKey);
      if (stored) {
        setSessionId(stored);
      } else {
        const newSessionId = `admin_session_${user.id}_${Date.now()}_${Math.random()
          .toString(36)
          .slice(2)}`;
        localStorage.setItem(userSessionKey, newSessionId);
        setSessionId(newSessionId);
      }
    }
  }, [user?.id]);

  // Load chat history when component mounts / session changes
  const loadChatHistory = useCallback(async () => {
    try {
      if (!user) return;
      const response = await fetch(`/api/admin-chat/history/${sessionId}`, {
        credentials: "include",
      });
      const data = await response.json();

      if (data?.data) {
        const formattedMessages: Msg[] = data.data.map(
          (msg: {
            _id: string;
            role: string;
            content: string;
            createdAt: string;
          }) => ({
            id: msg._id,
            role: msg.role as "user" | "admin",
            content: msg.content,
            at: new Date(msg.createdAt).getTime(),
          })
        );
        
        // Loại bỏ tin nhắn trùng lặp dựa trên id
        const uniqueMessages = formattedMessages.filter((msg, index, self) => 
          index === self.findIndex(m => m.id === msg.id)
        );
        
        setMessages(uniqueMessages);
      } else {
        // Nếu không có data, set messages rỗng
        setMessages([]);
      }
    } catch (err) {
      console.error("Failed to load admin chat history:", err);
    }
  }, [sessionId, user]);

  useEffect(() => {
    if (user && open) {
      loadChatHistory();
    }
  }, [user, open, loadChatHistory]);

  // Real-time listeners
  useEffect(() => {
    if (!socket || !user) return;

    const handleNewMessage = (data: any) => {
      console.log("Received new-message:", data);
      if (data.message) {
        const newMessage: Msg = {
          id: data.message._id,
          role: data.message.role,
          content: data.message.content,
          at: new Date(data.message.createdAt).getTime(),
        };
        setMessages(prev => {
          // Kiểm tra xem tin nhắn đã tồn tại chưa
          const exists = prev.some(msg => msg.id === newMessage.id);
          if (exists) {
            console.log("Message already exists, skipping:", newMessage.id);
            return prev;
          }
          return [...prev, newMessage];
        });
      }
    };

    const handleAdminMessage = (data: any) => {
      console.log("Received admin-message:", data);
      if (data.message) {
        const newMessage: Msg = {
          id: data.message._id,
          role: data.message.role,
          content: data.message.content,
          at: new Date(data.message.createdAt).getTime(),
        };
        setMessages(prev => {
          // Kiểm tra xem tin nhắn đã tồn tại chưa
          const exists = prev.some(msg => msg.id === newMessage.id);
          if (exists) {
            console.log("Message already exists, skipping:", newMessage.id);
            return prev;
          }
          return [...prev, newMessage];
        });
      }
    };

    // Join conversation room
    socket.emit("user:join-conversation", sessionId);

    const handleError = (data: any) => {
      console.error("Socket error:", data.message);
      setError(data.message);
    };

    socket.on("new-message", handleNewMessage);
    socket.on("admin-message", handleAdminMessage);
    socket.on("error", handleError);

    return () => {
      socket.off("new-message", handleNewMessage);
      socket.off("admin-message", handleAdminMessage);
      socket.off("error", handleError);
      socket.emit("user:leave-conversation", sessionId);
    };
  }, [socket, user, sessionId]);

  // Auto-scroll when messages change/open toggles
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, open]);

  // --- SEND with optimistic UI (user msg + pending admin bubble) ---
  const send = async () => {
    const text = input.trim();
    if (!text || sending || !user) return;

    setError(null);

    // Xóa nội dung trong ô nhập & giữ focus
    setInput("");
    textareaRef.current?.focus();

    setSending(true);

    // 1) Push user msg + pending admin bubble (optimistic UI)
    const tempUserId = uid();
    const tempAdminId = uid();
    const now = Date.now();

    setMessages((prev) => [
      ...prev,
      { id: tempUserId, role: "user", content: text, at: now },
      {
        id: tempAdminId,
        role: "admin",
        content: "",
        at: now,
        pending: true,
      },
    ]);

    try {
      const { ok, json } = await postJson("/api/admin-chat/send", {
        message: text,
        sessionId,
      });

      if (!ok || !json?.data) {
        throw new Error(json?.message || "Failed to send message");
      }

      const { message } = json.data;

      // 2) Thay bubble tạm bằng dữ liệu thật từ server
      setMessages((prev) => {
        const updatedMessages = prev.map((m) => {
          if (m.id === tempUserId) {
            return {
              id: message._id,
              role: message.role,
              content: message.content,
              at: new Date(message.createdAt).getTime(),
            };
          }
          if (m.id === tempAdminId) {
            return {
              id: message._id + "_pending",
              role: "admin",
              content: "Admin sẽ trả lời sớm nhất có thể. Cảm ơn bạn đã liên hệ!",
              at: new Date().getTime(),
            };
          }
          return m;
        });
        
        // Loại bỏ tin nhắn trùng lặp dựa trên id
        const uniqueMessages = updatedMessages.filter((msg, index, self) => 
          index === self.findIndex(m => m.id === msg.id)
        );
        
        return uniqueMessages;
      });
    } catch (err: unknown) {
      console.error("Failed to send message:", err);
      setError((err as Error).message || "Có lỗi xảy ra khi gửi tin nhắn");

      // Chuyển bubble pending thành thông báo
      setMessages((prev) => {
        const updatedMessages = prev.map((m) =>
          m.id === tempAdminId
            ? {
                ...m,
                pending: false,
                content: "Admin sẽ trả lời sớm nhất có thể. Cảm ơn bạn đã liên hệ!",
              }
            : m
        );
        
        // Loại bỏ tin nhắn trùng lặp dựa trên id
        const uniqueMessages = updatedMessages.filter((msg, index, self) => 
          index === self.findIndex(m => m.id === msg.id)
        );
        
        return uniqueMessages;
      });
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  // Xóa hội thoại + tạo session mới
  const clearChat = async () => {
    if (!user) return;
    try {
      await fetch(`/api/admin-chat/clear/${sessionId}`, {
        method: "DELETE",
        credentials: "include",
      });
    } catch (err) {
      console.error("Failed to clear admin chat on server:", err);
    } finally {
      setMessages([]);
      setError(null);
      const newSessionId = `admin_session_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2)}`;
      localStorage.setItem("adminChatSessionId", newSessionId);
      setSessionId(newSessionId);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Đóng chat admin" : "Mở chat admin"}
        className="fixed bottom-20 right-5 z-[60] h-14 w-14 rounded-full
          bg-gradient-to-tr from-green-500 to-emerald-500 text-white
          shadow-lg shadow-green-500/30 hover:scale-105 active:scale-95 transition
          dark:from-green-500 dark:to-emerald-500"
      >
        {open ? (
          <FiX className="mx-auto h-6 w-6" />
        ) : (
          <FaUserTie className="mx-auto h-6 w-6" />
        )}
      </button>

      {/* Panel */}
      <div
        ref={wrapperRef}
        className={`fixed bottom-32 right-5 z-[59] w-[92vw] max-w-sm
          transition-all duration-200 ${
            open
              ? "opacity-100 translate-y-0"
              : "pointer-events-none opacity-0 translate-y-2"
          }`}
      >
        <div className="overflow-hidden rounded-2xl border border-gray-200/70 bg-white/90 backdrop-blur shadow-2xl dark:bg-zinc-900/90 dark:border-gray-700">
          {/* Header */}
          <div
            className="relative flex items-center justify-between px-4 py-3
              bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20
              border-b border-gray-200/70 dark:border-gray-700"
          >
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl
                  bg-gradient-to-tr from-green-600 to-emerald-600 text-white
                  shadow-sm dark:from-green-500 dark:to-emerald-500"
              >
                <FaUserTie className="h-5 w-5" />
              </span>
              <div className="leading-tight">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  Chat với Admin
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Hỗ trợ trực tiếp từ admin
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={clearChat}
                  className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700
                    focus:outline-none focus:ring-2 focus:ring-green-400
                    dark:text-gray-400 dark:hover:bg-zinc-800 dark:hover:text-gray-200"
                  aria-label="Clear chat"
                  title="Xóa cuộc trò chuyện"
                >
                  <FiTrash2 className="h-5 w-5" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700
                  focus:outline-none focus:ring-2 focus:ring-green-400
                  dark:text-gray-400 dark:hover:bg-zinc-800 dark:hover:text-gray-200"
                aria-label="Đóng chat"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="px-3 py-2 bg-red-50 border-b border-red-200 dark:bg-red-900/20 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Messages */}
          <div
            ref={listRef}
            className="max-h-[26rem] min-h-[14rem] overflow-y-auto
              px-3 py-3 space-y-3 bg-white/70 dark:bg-zinc-900/70"
          >
            {messages.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 p-4 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                {user ? "Chào bạn! Hãy gửi tin nhắn để bắt đầu trò chuyện với admin." : "Vui lòng đăng nhập để sử dụng chat admin"}
              </div>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${
                    m.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                      m.role === "user"
                        ? "bg-gradient-to-tr from-green-600 to-emerald-500 text-white dark:from-green-500 dark:to-emerald-400"
                        : "bg-gray-100 text-gray-900 dark:bg-zinc-800 dark:text-gray-100"
                    }`}
                  >
                    {m.role === "admin" && (
                      <div className="mb-1 inline-flex items-center gap-1 text-[11px] opacity-80">
                        <FaUserTie className="h-3.5 w-3.5" />
                        <span>Admin</span>
                      </div>
                    )}
                    <MessageContent
                      content={m.content}
                      role={m.role}
                      pending={m.pending}
                    />
                    <div
                      className={`mt-1 text-[10px] ${
                        m.role === "user"
                          ? "text-white/80"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {m.at
                        ? new Date(m.at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Input */}
          <div className="border-t border-gray-200/70 p-3 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={
                  user ? "Nhập tin nhắn cho admin..." : "Vui lòng đăng nhập để sử dụng chat admin"
                }
                disabled={!user}
                rows={2}
                className="flex-1 resize-none rounded-xl border border-gray-300 bg-white/90 px-3 py-2 text-base sm:text-sm text-gray-900
                  placeholder:text-gray-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-600
                  max-h-48 min-h-[3.5rem] dark:border-gray-700 dark:bg-zinc-900/70 dark:text-gray-100
                  dark:placeholder:text-gray-500 dark:focus:border-green-400 dark:focus:ring-green-900/40
                  disabled:opacity-50 disabled:cursor-not-allowed"
              />

              <button
                onClick={send}
                disabled={sending || input.trim().length === 0 || !user}
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2
                  rounded-xl bg-green-600 px-3 text-sm font-medium text-white
                  shadow-sm transition enabled:hover:bg-green-700
                  enabled:focus:outline-none enabled:focus:ring-2 enabled:focus:ring-green-400
                  disabled:opacity-50 dark:bg-green-500 dark:enabled:hover:bg-green-600"
              >
                {sending ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-transparent" />
                    Đang gửi...
                  </span>
                ) : (
                  <>
                    <FiSend className="h-4 w-4" />
                    Gửi
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
