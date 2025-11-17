/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-html-link-for-pages */
"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  FiX,
  FiSend,
  FiTrash2,
  FiCopy,
  FiClock,
  FiAlertCircle,
} from "react-icons/fi";
import { FaUserTie } from "react-icons/fa";
import useClickOutside from "@/hooks/common/useClickOutside";
import { useAuth } from "@/context/AuthContext";
import { postJson } from "@/lib/api/client";
import { useSocket } from "@/hooks/common/useSocket";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";
import { Textarea } from "@/components/ui";
import { Button } from "@/components/ui";

type Msg = {
  _id?: string;
  id?: string;
  role: "user" | "admin";
  content: string;
  at?: number;
  createdAt?: string;
  pending?: boolean;
};

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function MessageContent({
  content,
  role,
  pending,
}: {
  content: string;
  role: "user" | "admin";
  pending?: boolean;
}) {
  if (role === "user")
    return <div className="whitespace-pre-wrap">{content}</div>;
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
  const { user } = useAuth();
  const { socket } = useSocket();
  const basePrefix = useBasePrefix();

  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const openRef = useRef(open);

  // ---- sessionId: theo user (ẩn danh → "anonymous")
  const getSessionKey = useCallback(
    () => `adminChatSessionId_${user?.id || "anonymous"}`,
    [user?.id]
  );

  const [sessionId, setSessionId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const key = `adminChatSessionId_${
        typeof window !== "undefined"
          ? (window as any).__userId || "anonymous"
          : "anonymous"
      }`;
      const stored = localStorage.getItem(key);
      if (stored) return stored;
    }
    const sid = `admin_session_${
      user?.id || "anonymous"
    }_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    if (typeof window !== "undefined") {
      const userKey = `adminChatSessionId_${user?.id || "anonymous"}`;
      localStorage.setItem(userKey, sid);
    }
    return sid;
  });

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  const listRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  useClickOutside(wrapperRef, () => setOpen(false), { enabled: open });

  // Đồng bộ sessionId khi user thay đổi
  useEffect(() => {
    const key = getSessionKey();
    const stored =
      typeof window !== "undefined" ? localStorage.getItem(key) : null;
    if (stored) {
      setSessionId(stored);
    } else {
      const sid = `admin_session_${
        user?.id || "anonymous"
      }_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      if (typeof window !== "undefined") localStorage.setItem(key, sid);
      setSessionId(sid);
    }
  }, [user?.id, getSessionKey]);

  // Load lịch sử
  const loadChatHistory = useCallback(async () => {
    try {
      if (!user || !sessionId || user.access !== "premium") return;
      const response = await fetch(`/api/admin-chat/history/${sessionId}`, {
        credentials: "include",
      });
      if (!response.ok) {
        if (response.status === 403) {
          const errorData = await response.json();
          if (errorData.code === "PREMIUM_REQUIRED") {
            setError(
              "Chức năng chat với Admin chỉ dành cho tài khoản Premium."
            );
            return;
          }
        }
        throw new Error("Failed to load chat history");
      }
      const data = await response.json();

      const formatted: Msg[] = Array.isArray(data?.data)
        ? data.data.map((msg: any) => ({
            id: msg._id,
            role: (msg.role as "user" | "admin") || "user",
            content: String(msg.content ?? ""),
            at: msg.createdAt ? new Date(msg.createdAt).getTime() : undefined,
          }))
        : [];

      // de-dupe by id
      const unique = formatted.filter(
        (m, i, arr) => i === arr.findIndex((x) => x.id === m.id)
      );
      setMessages(unique);
    } catch (err) {
      console.error("Failed to load admin chat history:", err);
    }
  }, [sessionId, user]);

  // Load unread
  const loadUnreadCount = useCallback(async () => {
    try {
      if (!user || user.access !== "premium") return;
      const response = await fetch(`/api/admin-chat/sessions`, {
        credentials: "include",
      });
      if (!response.ok) {
        if (response.status === 403) {
          return; // Premium required, không load unread
        }
        throw new Error("Failed to load unread count");
      }
      const data = await response.json();
      const total = Array.isArray(data?.data)
        ? data.data.reduce(
            (sum: number, s: any) => sum + (s.unreadCount || 0),
            0
          )
        : 0;
      setUnreadCount(total);
    } catch (err) {
      console.error("Failed to load unread count:", err);
    }
  }, [user]);

  useEffect(() => {
    if (user) loadUnreadCount();
  }, [loadUnreadCount, user]);

  useEffect(() => {
    if (user && user.access === "premium" && open) loadChatHistory();
  }, [user, open, loadChatHistory]);

  // Socket realtime
  useEffect(() => {
    if (!socket || !user || !sessionId) return;

    socket.emit("user:join-conversation", sessionId);

    const onNewMessage = (data: any) => {
      const msg = data?.message;
      if (!msg) return;
      const m: Msg = {
        id: msg._id,
        role: msg.role,
        content: msg.content,
        at: msg.createdAt ? new Date(msg.createdAt).getTime() : Date.now(),
      };
      setMessages((prev) =>
        prev.some((x) => x.id === m.id) ? prev : [...prev, m]
      );
    };

    const onAdminMessage = (data: any) => {
      const msg = data?.message;
      if (!msg) return;
      const m: Msg = {
        id: msg._id,
        role: msg.role,
        content: msg.content,
        at: msg.createdAt ? new Date(msg.createdAt).getTime() : Date.now(),
      };
      setMessages((prev) =>
        prev.some((x) => x.id === m.id) ? prev : [...prev, m]
      );
      if (!openRef.current) setUnreadCount((c) => c + 1);
    };

    const onError = (data: any) => {
      console.error("Socket error:", data?.message);
      setError(data?.message || "Socket error");
    };

    socket.on("admin-chat:new-message", onNewMessage);
    socket.on("admin-chat:admin-message", onAdminMessage);
    socket.on("error", onError);

    return () => {
      socket.off("admin-chat:new-message", onNewMessage);
      socket.off("admin-chat:admin-message", onAdminMessage);
      socket.off("error", onError);
      socket.emit("user:leave-conversation", sessionId);
    };
  }, [socket, user?.id, sessionId]);

  // Auto scroll mượt
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  // Reset unread khi mở
  useEffect(() => {
    if (open) setUnreadCount(0);
  }, [open]);

  // Gửi tin nhắn
  const send = async () => {
    const text = input.trim();
    if (!text || sending || !user) return;

    // Kiểm tra premium access
    if (user.access !== "premium") {
      setError(
        "Chức năng chat với Admin chỉ dành cho tài khoản Premium. Vui lòng nâng cấp tài khoản để sử dụng."
      );
      return;
    }

    setError(null);
    setInput("");
    textareaRef.current?.focus();
    setSending(true);

    const tempUserId = uid();
    const tempAdminId = uid();
    const now = Date.now();

    // Optimistic
    setMessages((prev) => [
      ...prev,
      { id: tempUserId, role: "user", content: text, at: now },
      { id: tempAdminId, role: "admin", content: "", at: now, pending: true },
    ]);

    try {
      const json = await postJson("/api/admin-chat/send", {
        message: text,
        sessionId,
      });
      if (!json?.data?.message) {
        console.error("[AdminChatBox] Response không có data.message:", json);
        throw new Error(
          json?.message || "Failed to send message: No data in response"
        );
      }
      const { message } = json.data;

      setMessages((prev) =>
        prev
          .map((m) => {
            // thay user temp → message thật từ server
            if (m.id === tempUserId) {
              return {
                id: message._id,
                role: message.role,
                content: message.content,
                at: new Date(message.createdAt).getTime(),
              };
            }
            // giữ nguyên id của pending bubble (KHÔNG dùng message._id + "_pending")
            if (m.id === tempAdminId) {
              return {
                ...m,
                pending: false,
                content:
                  "Admin sẽ trả lời sớm nhất có thể. Cảm ơn bạn đã liên hệ!",
              };
            }
            return m;
          })
          // de-dupe by id (phòng socket echo)
          .filter((msg, i, arr) => i === arr.findIndex((x) => x.id === msg.id))
      );
    } catch (err: any) {
      console.error("Failed to send message:", err);
      const errorMessage = err?.message || "Có lỗi xảy ra khi gửi tin nhắn";
      const errorCode = err?.code || "";
      const errorStatus = err?.status || 0;

      // Kiểm tra nếu lỗi là do không có premium
      if (
        errorCode === "PREMIUM_REQUIRED" ||
        errorStatus === 403 ||
        errorMessage.includes("Premium") ||
        errorMessage.includes("premium")
      ) {
        setError(
          "Chức năng chat với Admin chỉ dành cho tài khoản Premium. Vui lòng nâng cấp tài khoản để sử dụng."
        );
      } else {
        setError(errorMessage);
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempAdminId
            ? {
                ...m,
                pending: false,
                content:
                  "Admin sẽ trả lời sớm nhất có thể. Cảm ơn bạn đã liên hệ!",
              }
            : m
        )
      );
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

  // Xóa hội thoại
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
      const newId = `admin_session_${
        user?.id || "anonymous"
      }_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const key = getSessionKey();
      localStorage.setItem(key, newId); // ✅ Đúng key theo user
      setSessionId(newId);
    }
  };

  const maxLen = 2000;

  return (
    <>
      {/* FAB */}
      <div className="fixed bottom-24 right-6 z-[70]">
        <motion.button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Đóng chat admin" : "Mở chat admin"}
          className="relative flex h-14 w-14 items-center justify-center rounded-full
                     bg-gradient-to-tr from-orange-400 to-orange-600 text-white
                     shadow-xl shadow-orange-500/40 ring-4 ring-white/30
                     hover:scale-110 active:scale-95 transition-all duration-200
                     focus:outline-none focus:ring-4 focus:ring-orange-400/50
                     dark:from-orange-500 dark:to-orange-600"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.div
            animate={{ rotate: open ? 90 : 0 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {open ? (
              <FiX className="h-6 w-6" />
            ) : (
              <FaUserTie className="h-6 w-6" />
            )}
          </motion.div>
        </motion.button>

        {/* Badge */}
        <AnimatePresence>
          {unreadCount > 0 && !open && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center
                         rounded-full bg-red-500 text-white text-xs font-bold shadow-lg animate-pulse"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Panel */}
      <motion.div
        ref={wrapperRef}
        initial={false}
        animate={{
          opacity: open ? 1 : 0,
          y: open ? 0 : 20,
          scale: open ? 1 : 0.96,
        }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className={`fixed bottom-44 sm:bottom-4 right-4 sm:right-[6.5rem] z-[60]
                    w-[calc(100vw-2rem)] sm:w-[28rem] md:w-[32rem]
                    ${open ? "pointer-events-auto" : "pointer-events-none"}`}
      >
        <div className="overflow-hidden rounded-3xl border border-white/20 bg-white/90 backdrop-blur-xl shadow-2xl dark:bg-zinc-900/95 dark:border-zinc-700/50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 sm:py-4 bg-gradient-to-r from-orange-50/80 to-amber-50/60 dark:from-orange-900/30 dark:to-amber-900/20 border-b border-gray-200/50 dark:border-zinc-700">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-gradient-to-tr from-orange-500 to-orange-600 p-px shadow-lg">
                  <div className="flex h-full w-full items-center justify-center rounded-2xl bg-white dark:bg-zinc-900">
                    <FaUserTie className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
                <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-orange-500 border-2 border-white dark:border-zinc-900 animate-pulse" />
              </div>
              <div className="leading-tight">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
                  Chat với Admin
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                  Hỗ trợ trực tiếp
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {messages.length > 0 && (
                <button
                  onClick={clearChat}
                  className="group rounded-xl p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 transition dark:text-gray-400 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                  aria-label="Xóa cuộc trò chuyện"
                >
                  <FiTrash2 className="h-4 w-4 transition group-hover:scale-110" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="rounded-xl p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400 transition dark:text-gray-400 dark:hover:bg-zinc-800 dark:hover:text-gray-200"
                aria-label="Đóng chat"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mx-4 mt-3 rounded-xl bg-red-50/80 border border-red-200/50 px-3 py-2.5 backdrop-blur-sm dark:bg-red-900/20 dark:border-red-800/50"
              >
                <p className="text-sm font-medium text-red-700 dark:text-red-300 flex items-center gap-2">
                  <FiAlertCircle className="h-4 w-4" />
                  {error}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Messages */}
          <div
            ref={listRef}
            className="h-[38vh] xs:h-[40vh] sm:h-[50vh] overflow-y-auto px-3 sm:px-4 py-4 space-y-4 bg-gradient-to-b from-transparent to-orange-50/20 dark:from-transparent dark:to-zinc-900/50"
          >
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-10">
                <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-orange-100 to-amber-100 dark:from-orange-900/50 dark:to-amber-900/50 flex items-center justify-center mb-4">
                  <FaUserTie className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                  {!user
                    ? "Vui lòng đăng nhập để sử dụng chat admin"
                    : user.access !== "premium"
                    ? "Chức năng chat với Admin chỉ dành cho tài khoản Premium. Vui lòng nâng cấp tài khoản để sử dụng."
                    : "Chào bạn! Hãy gửi tin nhắn để bắt đầu trò chuyện với admin."}
                </p>
              </div>
            ) : (
              <AnimatePresence>
                {messages.map((m) => (
                  <motion.div
                    key={m.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className={`flex ${
                      m.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`group relative max-w-[82%] sm:max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-md transition-all ${
                        m.role === "user"
                          ? "bg-gradient-to-tr from-orange-600 to-orange-500 text-white rounded-tr-sm"
                          : "bg-white text-gray-800 dark:bg-zinc-800 dark:text-gray-100 rounded-tl-sm"
                      }`}
                    >
                      {m.role === "admin" && (
                        <div className="mb-1.5 flex items-center gap-1.5 text-xs opacity-75">
                          <FaUserTie className="h-3.5 w-3.5" />
                          <span className="font-medium">Admin</span>
                        </div>
                      )}

                      <MessageContent
                        content={m.content}
                        role={m.role}
                        pending={m.pending}
                      />

                      <div
                        className={`mt-2 text-[10px] font-medium flex items-center gap-1.5 ${
                          m.role === "user"
                            ? "text-white/70"
                            : "text-gray-400 dark:text-gray-500"
                        }`}
                      >
                        <FiClock className="h-3 w-3" />
                        {m.at
                          ? new Date(m.at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Đang gửi..."}
                      </div>

                      {/* Copy (admin only) */}
                      {m.role === "admin" && !m.pending && (
                        <button
                          onClick={() =>
                            navigator.clipboard.writeText(m.content)
                          }
                          className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-white/90 dark:bg-zinc-800/90 shadow-md transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-orange-400"
                          aria-label="Sao chép tin nhắn"
                        >
                          <FiCopy className="h-3.5 w-3.5 text-gray-600 dark:text-gray-300" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}

            {sending && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl bg-gray-100 dark:bg-zinc-800 px-4 py-3">
                  <div className="flex space-x-1">
                    <span
                      className="h-2 w-2 rounded-full bg-orange-500 animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <span
                      className="h-2 w-2 rounded-full bg-orange-500 animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="h-2 w-2 rounded-full bg-orange-500 animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Admin đang nhập...
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-gray-200/60 dark:border-zinc-700/60 p-3 sm:p-4 bg-white/70 dark:bg-zinc-900/70">
            <div className="flex items-end gap-3">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value.slice(0, maxLen))}
                  onKeyDown={onKeyDown}
                  placeholder={
                    !user
                      ? "Đăng nhập để chat..."
                      : user.access !== "premium"
                      ? "Cần tài khoản Premium để sử dụng..."
                      : "Nhập tin nhắn cho admin..."
                  }
                  disabled={!user || sending || user?.access !== "premium"}
                  rows={1}
                  maxLength={maxLen}
                  className="w-full resize-none rounded-2xl border border-gray-300/70 bg-white/80 px-4 py-3 pr-12 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 outline-none dark:border-zinc-600 dark:bg-zinc-800/70 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-orange-400"
                  style={{ minHeight: "52px", maxHeight: "120px" }}
                />
                <div className="absolute right-3 bottom-3 text-xs text-gray-400">
                  {input.length}/{maxLen}
                </div>
              </div>

              <button
                onClick={send}
                disabled={
                  sending ||
                  !input.trim() ||
                  !user ||
                  user?.access !== "premium"
                }
                className="group relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-orange-600 to-orange-500 text-white shadow-lg shadow-orange-500/30 transition-all enabled:hover:scale-110 enabled:hover:shadow-xl enabled:focus:outline-none enabled:focus:ring-4 enabled:focus:ring-orange-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/60 border-t-transparent" />
                ) : (
                  <FiSend className="h-5 w-5 transition group-enabled:group-hover:translate-x-0.5" />
                )}
              </button>
            </div>

            {!user && (
              <p className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">
                <a href="/login" className="text-orange-600 hover:underline">
                  Đăng nhập
                </a>{" "}
                để chat với admin
              </p>
            )}
            {user && user.access !== "premium" && (
              <p className="mt-2 text-center text-xs text-orange-600 dark:text-orange-400">
                <a href="/account" className="hover:underline font-medium">
                  Nâng cấp lên Premium
                </a>{" "}
                để sử dụng chat với Admin
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}
