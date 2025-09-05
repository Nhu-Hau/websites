"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { FiMessageSquare, FiX, FiSend, FiTrash2 } from "react-icons/fi";
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
};

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// Component để render message content với Markdown
function MessageContent({
  content,
  role,
}: {
  content: string;
  role: "user" | "assistant";
}) {
  if (role === "user") {
    return <div className="whitespace-pre-wrap">{content}</div>;
  }

  return (
    <div className="prose prose-sm max-w-none dark:prose-invert">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // Custom styling cho các elements
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
  const [sessionId] = useState(
    () => `session_${Date.now()}_${Math.random().toString(36).slice(2)}`
  );
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useClickOutside(wrapperRef, () => setOpen(false));

  // Load chat history when component mounts
  const loadChatHistory = useCallback(async () => {
    try {
      const response = await fetch(`/api/chat/history/${sessionId}`, {
        credentials: "include",
      });
      const data = await response.json();
      if (data?.data) {
        const formattedMessages = data.data.map(
          (msg: {
            _id: string;
            role: string;
            content: string;
            createdAt: string;
          }) => ({
            id: msg._id,
            role: msg.role,
            content: msg.content,
            at: new Date(msg.createdAt).getTime(),
          })
        );
        setMessages(formattedMessages);
      }
    } catch (err) {
      console.error("Failed to load chat history:", err);
    }
  }, [sessionId]);

  useEffect(() => {
    if (user && open) {
      loadChatHistory();
    }
  }, [user, open, loadChatHistory]);

  // Auto-scroll
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending || !user) return;

    setError(null);
    setSending(true);

    try {
      const { ok, json } = await postJson("/api/chat/send", {
        message: text,
        sessionId,
      });

      if (ok && json?.data) {
        const { userMessage, assistantMessage } = json.data;

        // Add both messages to the chat
        setMessages((prev) => [
          ...prev,
          {
            id: userMessage._id,
            role: userMessage.role,
            content: userMessage.content,
            at: new Date(userMessage.createdAt).getTime(),
          },
          {
            id: assistantMessage._id,
            role: assistantMessage.role,
            content: assistantMessage.content,
            at: new Date(assistantMessage.createdAt).getTime(),
          },
        ]);
      } else {
        throw new Error(json?.message || "Failed to send message");
      }
    } catch (err: unknown) {
      console.error("Failed to send message:", err);
      setError((err as Error).message || "Có lỗi xảy ra khi gửi tin nhắn");

      // Fallback: add user message and demo response
      const userMsg: Msg = {
        id: uid(),
        role: "user",
        content: text,
        at: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);

      const assistantMsg: Msg = {
        id: uid(),
        role: "assistant",
        content: t("demoReply"),
        at: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } finally {
      setInput("");
      setSending(false);
      textareaRef.current?.focus();
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? t("closeChat") : t("openChat")}
        className="fixed bottom-5 right-5 z-[60] h-14 w-14 rounded-full
          bg-gradient-to-tr from-sky-500 to-indigo-500 text-white
          shadow-lg shadow-blue-500/30 hover:scale-105 active:scale-95 transition
          dark:from-sky-500 dark:to-indigo-500"
      >
        {open ? (
          <FiX className="mx-auto h-6 w-6" />
        ) : (
          <FiMessageSquare className="mx-auto h-6 w-6" />
        )}
      </button>

      {/* Panel */}
      <div
        ref={wrapperRef}
        className={`fixed bottom-24 right-5 z-[59] w-[92vw] max-w-sm
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
              bg-gradient-to-r from-gray-50 to-white dark:from-zinc-900 dark:to-zinc-800
              border-b border-gray-200/70 dark:border-gray-700"
          >
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl
                  bg-gradient-to-tr from-indigo-600 to-sky-600 text-white
                  shadow-sm dark:from-indigo-500 dark:to-sky-500"
              >
                <FaGraduationCap className="h-5 w-5" />
              </span>
              <div className="leading-tight">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  {t("title")}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t("subtitle")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={clearChat}
                  className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700
                    focus:outline-none focus:ring-2 focus:ring-blue-400
                    dark:text-gray-400 dark:hover:bg-zinc-800 dark:hover:text-gray-200"
                  aria-label="Clear chat"
                  title="Clear chat"
                >
                  <FiTrash2 className="h-5 w-5" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700
                  focus:outline-none focus:ring-2 focus:ring-blue-400
                  dark:text-gray-400 dark:hover:bg-zinc-800 dark:hover:text-gray-200"
                aria-label={t("close")}
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
                {user ? t("empty") : "Vui lòng đăng nhập để sử dụng chat"}
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
                        ? "bg-gradient-to-tr from-sky-600 to-indigo-500 text-white dark:from-sky-500 dark:to-indigo-400"
                        : "bg-gray-100 text-gray-900 dark:bg-zinc-800 dark:text-gray-100"
                    }`}
                  >
                    {m.role === "assistant" && (
                      <div className="mb-1 inline-flex items-center gap-1 text-[11px] opacity-80">
                        <FaGraduationCap className="h-3.5 w-3.5" />
                        <span>{t("ai")}</span>
                      </div>
                    )}
                    <MessageContent content={m.content} role={m.role} />
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
                  user ? t("placeholder") : "Vui lòng đăng nhập để sử dụng chat"
                }
                disabled={!user}
                rows={2}
                className="flex-1 resize-none rounded-xl border border-gray-300 bg-white/90 px-3 py-2 text-base sm:text-sm text-gray-900
                  placeholder:text-gray-400 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-600
                  max-h-48 min-h-[3.5rem] dark:border-gray-700 dark:bg-zinc-900/70 dark:text-gray-100
                  dark:placeholder:text-gray-500 dark:focus:border-blue-400 dark:focus:ring-blue-900/40
                  disabled:opacity-50 disabled:cursor-not-allowed"
              />

              <button
                onClick={send}
                disabled={sending || input.trim().length === 0 || !user}
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2
                  rounded-xl bg-sky-600 px-3 text-sm font-medium text-white
                  shadow-sm transition enabled:hover:bg-sky-700
                  enabled:focus:outline-none enabled:focus:ring-2 enabled:focus:ring-sky-400
                  disabled:opacity-50 dark:bg-sky-500 dark:enabled:hover:bg-sky-600"
              >
                {sending ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-transparent" />
                    {t("sending")}
                  </span>
                ) : (
                  <>
                    <FiSend className="h-4 w-4" />
                    {t("send")}
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
