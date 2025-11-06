/* eslint-disable @next/next/no-html-link-for-pages */
"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  FiMessageSquare,
  FiX,
  FiSend,
  FiTrash2,
  FiClock,
  FiCopy,
  FiAlertCircle,
} from "react-icons/fi";
import { FaGraduationCap } from "react-icons/fa";
import { useTranslations } from "next-intl";
import useClickOutside from "@/hooks/useClickOutside";
import { useAuth } from "@/context/AuthContext";
import { postJson } from "@/lib/http";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

type Msg = {
  _id?: string;
  id?: string;
  role: "user" | "assistant";
  content: string;
  at?: number;
  createdAt?: string;
  /** hiển thị bong bóng chờ */
  pending?: boolean;
};

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// Component để render message content với Markdown
function MessageContent({
  content,
  role,
  pending,
}: {
  content: string;
  role: "user" | "assistant";
  pending?: boolean;
}) {
  if (role === "user") {
    return <div className="whitespace-pre-wrap">{content}</div>;
  }

  // Assistant
  if (pending) {
    return (
      <div className="flex items-center gap-2 text-sm opacity-80">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        <span>Đang trả lời…</span>
      </div>
    );
  }

  return (
    <div className="prose prose-sm max-w-none dark:prose-invert">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-lg font-bold mb-2">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base font-bold mb-2">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-bold mb-1">{children}</h3>
          ),
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          ul: ({ children }) => (
            <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside mb-2 space-y-1">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="text-sm">{children}</li>,
          code: ({ children, className }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-xs font-mono">
                  {children}
                </code>
              );
            }
            return (
              <code
                className={`${className} block bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs font-mono overflow-x-auto`}
              >
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs font-mono overflow-x-auto mb-2">
              {children}
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-600 dark:text-gray-400 mb-2">
              {children}
            </blockquote>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default function ChatBox() {
  const t = useTranslations("chat");
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [sessionId, setSessionId] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("chatSessionId");
      if (stored) return stored;
    }
    const newSessionId = `session_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2)}`;
    if (typeof window !== "undefined") {
      localStorage.setItem("chatSessionId", newSessionId);
    }
    return newSessionId;
  });
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useClickOutside(wrapperRef, () => setOpen(false));

  // Load chat history when component mounts / session changes
  const loadChatHistory = useCallback(async () => {
    try {
      if (!user) return;
      const response = await fetch(`/api/chat/history/${sessionId}`, {
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
            role: msg.role as "user" | "assistant",
            content: msg.content,
            at: new Date(msg.createdAt).getTime(),
          })
        );
        setMessages(formattedMessages);
      } else {
        setMessages([]);
      }
    } catch (err) {
      console.error("Failed to load chat history:", err);
    }
  }, [sessionId, user]);

  useEffect(() => {
    if (user && open) {
      loadChatHistory();
    }
  }, [user, open, loadChatHistory]);

  // Auto-scroll when messages change/open toggles
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, open]);

  // --- SEND with optimistic UI (user msg + pending assistant bubble) ---
  const send = async () => {
    const text = input.trim();
    if (!text || sending || !user) return;

    setError(null);

    // 🔹 XÓA NGAY nội dung trong ô nhập & giữ focus
    setInput("");
    textareaRef.current?.focus();

    setSending(true);

    // 1) Push user msg + pending assistant bubble (optimistic UI)
    const tempUserId = uid();
    const tempAssistantId = uid();
    const now = Date.now();

    setMessages((prev) => [
      ...prev,
      { id: tempUserId, role: "user", content: text, at: now },
      {
        id: tempAssistantId,
        role: "assistant",
        content: "",
        at: now,
        pending: true,
      },
    ]);

    try {
      const json = await postJson("/api/chat/send", {
        message: text,
        sessionId,
      });

      if (!json?.data) {
        console.error("[ChatBox] Response không có data field:", json);
        throw new Error(json?.message || "Failed to send message: No data in response");
      }

      const { userMessage, assistantMessage } = json.data;
      
      if (!userMessage || !assistantMessage) {
        console.error("[ChatBox] Response thiếu userMessage hoặc assistantMessage:", { userMessage, assistantMessage });
        throw new Error("Invalid response format");
      }

      // 2) Thay bubble tạm bằng dữ liệu thật từ server
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id === tempUserId) {
            return {
              id: userMessage._id,
              role: userMessage.role,
              content: userMessage.content,
              at: new Date(userMessage.createdAt).getTime(),
            };
          }
          if (m.id === tempAssistantId) {
            return {
              id: assistantMessage._id,
              role: assistantMessage.role,
              content: assistantMessage.content,
              at: new Date(assistantMessage.createdAt).getTime(),
            };
          }
          return m;
        })
      );
    } catch (err: unknown) {
      console.error("Failed to send message:", err);
      setError((err as Error).message || "Có lỗi xảy ra khi gửi tin nhắn");

      // Chuyển bubble pending thành trả lời demo
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempAssistantId
            ? { ...m, pending: false, content: t("demoReply") }
            : m
        )
      );
    } finally {
      // ❌ ĐỪNG gọi setInput("") ở đây nữa để tránh chớp nháy
      setSending(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  // Xóa hội thoại + tạo session mới (thay cho nút "+")
  const clearChat = async () => {
    if (!user) return;
    try {
      await fetch(`/api/chat/clear/${sessionId}`, {
        method: "DELETE",
        credentials: "include",
      });
    } catch (err) {
      console.error("Failed to clear chat on server:", err);
    } finally {
      setMessages([]);
      setError(null);
      const newSessionId = `session_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2)}`;
      localStorage.setItem("chatSessionId", newSessionId);
      setSessionId(newSessionId);
      // không reload trang — giữ UI mượt
    }
  };

  return (
    <>
      {/* Floating Action Button (giữ nguyên) */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? t("closeChat") : t("openChat")}
        className="fixed bottom-6 right-6 z-[70] flex h-14 w-14 items-center justify-center 
      rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 text-white
      shadow-xl shadow-indigo-500/30 ring-4 ring-white/20
      hover:scale-110 active:scale-95 transition-all duration-200
      focus:outline-none focus:ring-4 focus:ring-sky-400/50
      dark:from-sky-500 dark:to-indigo-500"
      >
        <motion.div
          animate={{ rotate: open ? 90 : 0 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          {open ? (
            <FiX className="h-6 w-6" />
          ) : (
            <FiMessageSquare className="h-6 w-6" />
          )}
        </motion.div>
      </button>

      {/* Chat Panel */}
      <motion.div
        ref={wrapperRef}
        initial={false}
        animate={{
          opacity: open ? 1 : 0,
          y: open ? 0 : 16,
          scale: open ? 1 : 0.95,
        }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className={`fixed bottom-44 sm:bottom-4 right-4 sm:right-[6.5rem] z-[60]
                    w-[calc(100vw-2rem)] sm:w-[28rem] md:w-[32rem]
        ${open ? "pointer-events-auto" : "pointer-events-none"}`}
      >
        <div
          className="overflow-hidden rounded-3xl border border-white/20 
        bg-white/85 backdrop-blur-xl shadow-2xl
        dark:bg-zinc-900/90 dark:border-zinc-700/50"
        >
          {/* Header */}
          <div
            className="relative flex items-center justify-between
            px-4 xs:px-5 py-3.5 xs:py-4
            bg-gradient-to-r from-gray-50/80 to-white/60
            dark:from-zinc-900 dark:to-zinc-800/80
            border-b border-gray-200/50 dark:border-zinc-700"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div
                  className="h-10 w-10 xs:h-11 xs:w-11 rounded-2xl
                  bg-gradient-to-tr from-indigo-600 to-sky-600 p-px shadow-lg"
                >
                  <div className="flex h-full w-full items-center justify-center rounded-2xl bg-white dark:bg-zinc-900">
                    <FaGraduationCap className="h-5 w-5 text-indigo-600 dark:text-sky-400" />
                  </div>
                </div>
                <span
                  className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full 
                bg-green-500 border-2 border-white dark:border-zinc-900"
                />
              </div>

              <div className="leading-tight">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm xs:text-base">
                  {t("title")}
                </h3>
                <p className="text-[11px] xs:text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  {t("subtitle")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {messages.length > 0 && (
                <button
                  onClick={clearChat}
                  className="group rounded-xl p-2 xs:p-2.5 text-gray-500 hover:bg-red-50 hover:text-red-600
                focus:outline-none focus:ring-2 focus:ring-red-400 transition
                dark:text-gray-400 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                  aria-label="Xóa cuộc trò chuyện"
                >
                  <FiTrash2 className="h-4 w-4 xs:h-4.5 xs:w-4.5 transition group-hover:scale-110" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="rounded-xl p-2 xs:p-2.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700
              focus:outline-none focus:ring-2 focus:ring-gray-400 transition
              dark:text-gray-400 dark:hover:bg-zinc-800 dark:hover:text-gray-200"
                aria-label={t("close")}
              >
                <FiX className="h-4 w-4 xs:h-4.5 xs:w-4.5" />
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mx-3 mt-3 rounded-xl bg-red-50/80 border border-red-200/50 
            px-3 py-2.5 backdrop-blur-sm dark:bg-red-900/20 dark:border-red-800/50"
            >
              <p className="text-sm font-medium text-red-700 dark:text-red-300 flex items-center gap-2">
                <FiAlertCircle className="h-4 w-4" />
                {error}
              </p>
            </motion.div>
          )}

          {/* Messages */}
          <div
            ref={listRef}
            className="px-3 xs:px-4 py-4 space-y-4
            max-h-[65vh] xs:max-h-[70vh] sm:max-h-[60vh]
            min-h-[38vh] xs:min-h-[40vh]
            overflow-y-auto
            bg-gradient-to-b from-transparent to-gray-50/30
            dark:from-transparent dark:to-zinc-900/50"
          >
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <div
                  className="h-16 w-16 rounded-full bg-gradient-to-tr from-sky-100 to-indigo-100 
                dark:from-sky-900/50 dark:to-indigo-900/50 flex items-center justify-center mb-4"
                >
                  <FiMessageSquare className="h-8 w-8 text-sky-600 dark:text-sky-400" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                  {user
                    ? t("empty")
                    : "Vui lòng đăng nhập để bắt đầu trò chuyện"}
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
                      className={`group relative
                      max-w-[86%] xs:max-w-[82%] sm:max-w-[80%]
                      rounded-2xl px-4 py-3 text-sm shadow-md transition-all ${
                        m.role === "user"
                          ? "bg-gradient-to-tr from-sky-600 to-indigo-600 text-white rounded-tr-sm"
                          : "bg-white text-gray-800 dark:bg-zinc-800 dark:text-gray-100 rounded-tl-sm"
                      }`}
                    >
                      {m.role === "assistant" && (
                        <div className="mb-1.5 flex items-center gap-1.5 text-xs opacity-75">
                          <FaGraduationCap className="h-3.5 w-3.5" />
                          <span className="font-medium">{t("ai")}</span>
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

                      {/* Copy (assistant only) */}
                      {m.role === "assistant" && !m.pending && (
                        <button
                          onClick={() =>
                            navigator.clipboard.writeText(m.content)
                          }
                          className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 
                          p-1.5 rounded-lg bg-white/90 dark:bg-zinc-800/90 shadow-md
                          transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-sky-400"
                          aria-label="Sao chép"
                        >
                          <FiCopy className="h-3.5 w-3.5 text-gray-600 dark:text-gray-300" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}

            {/* Typing */}
            {sending && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl bg-gray-100 dark:bg-zinc-800 px-4 py-3">
                  <div className="flex space-x-1">
                    <span
                      className="h-2 w-2 rounded-full bg-gray-400 animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <span
                      className="h-2 w-2 rounded-full bg-gray-400 animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="h-2 w-2 rounded-full bg-gray-400 animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    AI đang suy nghĩ...
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-gray-200/60 dark:border-zinc-700/60 p-4 bg-white/70 dark:bg-zinc-900/70">
            <div className="flex items-end gap-3">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder={user ? t("placeholder") : "Đăng nhập để chat..."}
                  disabled={!user || sending}
                  rows={1}
                  className="w-full resize-none rounded-2xl border border-gray-300/70 bg-white/80 
                  px-4 py-3 pr-12 text-sm text-gray-900 placeholder:text-gray-400
                  focus:border-sky-500 focus:ring-4 focus:ring-sky-500/20
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-200 outline-none
                  dark:border-zinc-600 dark:bg-zinc-800/70 dark:text-gray-100
                  dark:placeholder:text-gray-500 dark:focus:border-sky-400"
                  style={{ minHeight: "52px", maxHeight: "120px" }}
                />
                <div className="absolute right-3 bottom-3 text-xs text-gray-400">
                  {input.length}/2000
                </div>
              </div>

              <button
                onClick={send}
                disabled={sending || !input.trim() || !user}
                className="group relative flex h-12 w-12 shrink-0 items-center justify-center 
                rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white
                shadow-lg shadow-sky-500/30 transition-all
                enabled:hover:scale-110 enabled:hover:shadow-xl
                enabled:focus:outline-none enabled:focus:ring-4 enabled:focus:ring-sky-400/50
                disabled:opacity-50 disabled:cursor-not-allowed"
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
                <a href="/auth/login" className="text-sky-600 hover:underline">
                  Đăng nhập
                </a>{" "}
                để sử dụng
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}
