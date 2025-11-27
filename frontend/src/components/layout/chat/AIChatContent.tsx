/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import {
  FiMessageSquare,
  FiSend,
  FiTrash2,
  FiClock,
  FiCopy,
  FiAlertCircle,
} from "react-icons/fi";
import { FaGraduationCap } from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";
import { postJson } from "@/lib/api/client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { useChat } from "@/context/ChatContext";
import { useTranslations } from "next-intl";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";
import { logger } from "@/lib/utils/logger";

type Msg = {
  _id?: string;
  id?: string;
  role: "user" | "assistant";
  content: string;
  at?: number;
  createdAt?: string;
  pending?: boolean;
  isLearningInsight?: boolean;
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
  role: "user" | "assistant";
  pending?: boolean;
}) {
  const t = useTranslations("layoutComponents.chat.ai");
  if (role === "user") {
    return <div className="whitespace-pre-wrap">{content}</div>;
  }

  if (pending) {
    return (
      <div className="flex items-center gap-2 text-sm opacity-80">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        <span>{t("responding")}</span>
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

function LearningInsightCard({ insightText }: { insightText: string }) {
  const t = useTranslations("layoutComponents.chat.ai.learningInsight");
  const [goalData, setGoalData] = useState<{
    hasGoal: boolean;
    goal: { targetScore: number; startScore: number } | null;
    currentScore: number | null;
    progress: number | null;
  } | null>(null);
  const [activityData, setActivityData] = useState<{
    activityData: Array<{ date: string; count: number }>;
    stats: {
      totalDays: number;
      totalAttempts: number;
      currentStreak: number;
      maxStreak: number;
    };
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        const [goalRes, activityRes] = await Promise.all([
          fetch("/api/dashboard/goal", {
            credentials: "include",
            cache: "no-store",
          }),
          fetch("/api/dashboard/activity", {
            credentials: "include",
            cache: "no-store",
          }),
        ]);

        if (cancelled) return;

        const goalJson = goalRes.ok ? await goalRes.json() : null;
        const activityJson = activityRes.ok ? await activityRes.json() : null;

        setGoalData(goalJson);
        setActivityData(activityJson);
      } catch (err) {
        logger.error("Failed to fetch Learning Insight data:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  const renderMiniHeatmap = () => {
    if (!activityData || activityData.activityData.length === 0) {
      return (
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
          {t("heatmapEmpty")}
        </div>
      );
    }

    const activityMap = new Map<string, number>();
    activityData.activityData.forEach((it) =>
      activityMap.set(it.date, it.count)
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days: Array<{ date: string; count: number }> = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        "0"
      )}-${String(d.getDate()).padStart(2, "0")}`;
      days.push({ date: dateStr, count: activityMap.get(dateStr) || 0 });
    }

    const maxCount = Math.max(...days.map((d) => d.count), 1);

    return (
      <div className="flex flex-wrap gap-1">
        {days.map((day, idx) => {
          const intensity =
            maxCount > 0
              ? Math.min(4, Math.ceil((day.count / maxCount) * 4))
              : 0;
          const colors = [
            "bg-gray-100 dark:bg-zinc-800",
            "bg-green-200 dark:bg-green-900/40",
            "bg-green-400 dark:bg-green-700/60",
            "bg-green-600 dark:bg-green-600",
            "bg-green-700 dark:bg-green-500",
          ];
          return (
            <div
              key={idx}
              className={`w-2.5 h-2.5 rounded-sm ${colors[intensity]}`}
              title={t("tooltip", { date: day.date, count: day.count })}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="prose prose-sm max-w-none dark:prose-invert">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
          components={{
            h1: ({ children }) => (
              <h1 className="text-base font-bold mb-2">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-sm font-bold mb-2">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-xs font-bold mb-1">{children}</h3>
            ),
            p: ({ children }) => (
              <p className="mb-2 last:mb-0 text-sm">{children}</p>
            ),
            ul: ({ children }) => (
              <ul className="list-disc list-inside mb-2 space-y-1 text-sm">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal list-inside mb-2 space-y-1 text-sm">
                {children}
              </ol>
            ),
            li: ({ children }) => <li className="text-sm">{children}</li>,
            strong: ({ children }) => (
              <strong className="font-semibold">{children}</strong>
            ),
            em: ({ children }) => <em className="italic">{children}</em>,
          }}
        >
          {insightText}
        </ReactMarkdown>
      </div>

      {!loading && (
        <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-zinc-700">
          {goalData?.hasGoal && goalData.progress !== null ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {t("goalProgressTitle")}
                </span>
                <span className="font-semibold text-sky-600 dark:text-sky-400">
                  {Math.round(goalData.progress)}%
                </span>
              </div>
              <div className="w-full h-2.5 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sky-500 to-indigo-600 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.max(0, goalData.progress))}%`,
                  }}
                />
              </div>
              {goalData.goal && goalData.currentScore !== null && (
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>
                    {t("range", {
                      start: goalData.goal.startScore,
                      current: goalData.currentScore,
                      target: goalData.goal.targetScore,
                    })}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg">
              {t("goalPrompt")}
            </div>
          )}

          {activityData && activityData.stats ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {t("activityTitle")}
                </span>
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                  {activityData.stats.currentStreak > 0 && (
                    <span className="flex items-center gap-1">
                      🔥{" "}
                      {t("streak", {
                        days: activityData.stats.currentStreak,
                      })}
                    </span>
                  )}
                  <span>
                    {t("attempts", { count: activityData.stats.totalAttempts })}
                  </span>
                </div>
              </div>
              {renderMiniHeatmap()}
            </div>
          ) : (
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
              {t("activityEmpty")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AIChatContent({
  isMobile = false,
}: {
  isMobile?: boolean;
}) {
  const t = useTranslations("layoutComponents.chat.ai");
  const ariaT = useTranslations("layoutComponents.chat.aria");
  const { user } = useAuth();
  const { open, setUnreadCount } = useChat();
  const basePrefix = useBasePrefix();
  const loginHref = `${basePrefix}/login`;
  const accountHref = `${basePrefix}/account`;

  const [sending, setSending] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [sessionId] = useState(() => "default");
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const lastReadCountRef = useRef(0);

  const loadChatHistory = useCallback(async () => {
    try {
      if (!user || user.access !== "premium") return;
      const response = await fetch(`/api/chat/history/${sessionId}`, {
        credentials: "include",
      });
      if (!response.ok) {
        if (response.status === 403) {
          try {
            const errorData = await response.json();
            if (errorData.code === "PREMIUM_REQUIRED") {
              setError(t("premiumRequired"));
              return;
            }
          } catch {
            // Failed to parse error response
          }
        }
        throw new Error("Failed to load chat history");
      }
      const data = await response.json();

      if (data?.data) {
        const formattedMessages: Msg[] = data.data.map(
          (msg: {
            _id: string;
            role: string;
            content: string;
            createdAt: string;
          }) => {
            const isLearningInsight =
              msg.role === "assistant" &&
              (msg.content.includes("📊") ||
                msg.content.includes("Kết quả") ||
                msg.content.includes("Progress Test") ||
                msg.content.includes("Practice Test") ||
                msg.content.includes("Placement Test") ||
                msg.content.includes("nhận xét") ||
                msg.content.includes("phân tích"));

            return {
              id: msg._id,
              role: msg.role as "user" | "assistant",
              content: msg.content,
              at: new Date(msg.createdAt).getTime(),
              isLearningInsight,
            };
          }
        );

        setMessages(formattedMessages);

        if (!open) {
          const currentCount = formattedMessages.length;
          const unread = Math.max(0, currentCount - lastReadCountRef.current);
          setUnreadCount((prev) => ({ ...prev, ai: unread }));
        } else {
          lastReadCountRef.current = formattedMessages.length;
          setUnreadCount((prev) => ({ ...prev, ai: 0 }));
          if (typeof window !== "undefined") {
            localStorage.setItem(
              `chat_read_count_${sessionId}`,
              String(formattedMessages.length)
            );
          }
        }
      } else {
        setMessages([]);
        setUnreadCount((prev) => ({ ...prev, ai: 0 }));
      }
    } catch (err) {
      logger.error("Failed to load chat history:", err);
    }
  }, [sessionId, user, open, setUnreadCount]);

  useEffect(() => {
    if (typeof window !== "undefined" && user) {
      const saved = localStorage.getItem(`chat_read_count_${sessionId}`);
      if (saved) {
        lastReadCountRef.current = parseInt(saved, 10) || 0;
      }
    }
  }, [sessionId, user]);

  useEffect(() => {
    if (user && user.access === "premium" && open) {
      loadChatHistory();
    } else if (user && user.access === "premium" && !open) {
      loadChatHistory();
    }
  }, [user, open, loadChatHistory]);

  useEffect(() => {
    if (!user || user.access !== "premium") return;
    if (!open) return;

    const interval = setInterval(() => {
      loadChatHistory();
    }, 5000);

    return () => clearInterval(interval);
  }, [user, loadChatHistory, open]);

  useEffect(() => {
    if (!user || user.access !== "premium") return;

    const handleTestSubmitted = (event: Event) => {
      const customEvent = event as CustomEvent;
      const testType = customEvent.detail?.type;
      if (testType === "placement" || testType === "progress") {
        setTimeout(() => {
          loadChatHistory();
        }, 2000);
      }
    };

    const handleOpenAndRefresh = () => {
      setTimeout(() => {
        loadChatHistory();
      }, 500);
    };

    window.addEventListener("test-submitted", handleTestSubmitted);
    window.addEventListener("chatbox:open-and-refresh", handleOpenAndRefresh);
    return () => {
      window.removeEventListener("test-submitted", handleTestSubmitted);
      window.removeEventListener(
        "chatbox:open-and-refresh",
        handleOpenAndRefresh
      );
    };
  }, [user, loadChatHistory]);

  const prevMessagesLengthRef = useRef(messages.length);
  const prevOpenRef = useRef(open);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;

    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 150;
    const hasNewMessages = messages.length > prevMessagesLengthRef.current;
    const justOpened = !prevOpenRef.current && open;

    if (justOpened || (open && (hasNewMessages || isNearBottom))) {
      setTimeout(() => {
        if (el) {
          el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
        }
      }, 16);
    }

    prevMessagesLengthRef.current = messages.length;
    prevOpenRef.current = open;
  }, [messages, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending || !user) return;

    if (user.access !== "premium") {
      setError(t("premiumRequired"));
      return;
    }

    setError(null);
    setInput("");
    textareaRef.current?.focus();
    setSending(true);

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
        logger.error("[ChatBox] Response không có data field:", json);
        throw new Error(
          json?.message || "Failed to send message: No data in response"
        );
      }

      const { userMessage, assistantMessage } = json.data;

      if (!userMessage || !assistantMessage) {
        logger.error(
          "[ChatBox] Response thiếu userMessage hoặc assistantMessage:",
          { userMessage, assistantMessage }
        );
        throw new Error("Invalid response format");
      }

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
      logger.error("Failed to send message:", err);
      let errorMessage = t("error");
      let errorCode = "";

      if (err instanceof Error) {
        errorMessage = err.message;
        errorCode = (err as any)?.code || "";

        if ((err as any)?.status === 403) {
          errorCode = errorCode || "PREMIUM_REQUIRED";
        }
      }

      if (
        errorCode === "PREMIUM_REQUIRED" ||
        errorMessage.includes("Premium") ||
        errorMessage.includes("premium")
      ) {
        setError(t("premiumRequired"));
      } else {
        setError(errorMessage);
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempAssistantId
            ? { ...m, pending: false, content: t("welcome") }
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

  const clearChat = async () => {
    if (!user) return;
    try {
      const response = await fetch(`/api/chat/clear/${sessionId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`Failed to clear chat: ${response.status}`);
      }
    } catch (err) {
      logger.error("Failed to clear chat on server:", err);
      // Continue to clear local state even if server request fails
    } finally {
      setMessages([]);
      setError(null);
    }
  };

  const contentHeight = "flex-1 min-h-0";

  return (
    <div className="flex flex-col h-full">
      {/* Header with Clear Button */}
      {messages.length > 0 && user && user.access === "premium" && (
        <div className="flex-shrink-0 px-3 xs:px-4 pt-3 pb-2 flex justify-end">
          <button
            type="button"
            onClick={clearChat}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            aria-label={ariaT("deleteAll")}
          >
            <FiTrash2 className="h-3.5 w-3.5" />
            <span>{t("clear")}</span>
          </button>
        </div>
      )}

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mx-3 mt-3 rounded-xl bg-red-50/80 border border-red-200/50 px-3 py-2.5 backdrop-blur-sm dark:bg-red-900/20 dark:border-red-800/50"
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
        className={`${contentHeight} overflow-y-auto px-3 xs:px-4 py-4 space-y-4 bg-gradient-to-b from-transparent to-gray-50/30 dark:from-transparent dark:to-zinc-900/50`}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-sky-100 to-indigo-100 dark:from-sky-900/50 dark:to-indigo-900/50 flex items-center justify-center mb-4">
              <FiMessageSquare className="h-8 w-8 text-sky-600 dark:text-sky-400" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
              {!user
                ? t("loginRequired")
                : user.access !== "premium"
                ? t("premiumRequired")
                : t("empty")}
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {messages.map((m) => (
              <motion.div
                key={m.id}
                layout="position"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{
                  type: "spring",
                  stiffness: 220,
                  damping: 24,
                  mass: 0.8,
                }}
                className={`flex ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`group relative max-w-[86%] xs:max-w-[82%] sm:max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-md transition-all ${
                    m.role === "user"
                      ? "bg-gradient-to-tr from-sky-600 to-indigo-600 text-white rounded-tr-sm"
                      : "bg-white text-gray-800 dark:bg-zinc-800 dark:text-gray-100 rounded-tl-sm"
                  }`}
                >
                  {m.role === "assistant" && (
                    <div className="mb-1.5 flex items-center gap-1.5 text-xs opacity-75">
                      <FaGraduationCap className="h-3.5 w-3.5" />
                      <span className="font-medium">{t("aiLabel")}</span>
                    </div>
                  )}

                  {m.isLearningInsight ? (
                    <LearningInsightCard insightText={m.content} />
                  ) : (
                    <MessageContent
                      content={m.content}
                      role={m.role}
                      pending={m.pending}
                    />
                  )}

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
                      : t("timestampPending")}
                  </div>

                  {m.role === "assistant" && !m.pending && (
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(m.content)}
                      className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-white/90 dark:bg-zinc-800/90 shadow-md transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-sky-400"
                      aria-label={ariaT("copy")}
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
                {t("typing")}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-gray-200/60 dark:border-zinc-700/60 p-4 bg-white/70 dark:bg-zinc-900/70 flex-shrink-0">
        <div className="flex w-full justify-center gap-3">
          <div className="flex w-full max-w-2xl items-center">
            <div className="relative flex-1">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={
                  !user
                    ? t("loginPlaceholder")
                    : user.access !== "premium"
                    ? t("premiumPlaceholder")
                    : t("placeholder")
                }
                disabled={!user || sending || user?.access !== "premium"}
                rows={1}
                className="w-full resize-none rounded-2xl border border-gray-300/70 bg-white/80 px-4 py-3 pr-12 text-sm text-gray-900 
             placeholder:text-gray-400 placeholder:text-sm 
             focus:border-sky-500 focus:ring-4 focus:ring-sky-500/20 
             disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 outline-none
             dark:border-zinc-600 dark:bg-zinc-800/70 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-sky-400"
                style={{ minHeight: "52px", maxHeight: "100px" }}
              />
              <div className="absolute right-3 bottom-3 text-xs text-gray-400">
                {input.length}/2000
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={send}
            disabled={
              sending || !input.trim() || !user || user?.access !== "premium"
            }
            className="group relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white shadow-lg shadow-sky-500/30 transition-all enabled:hover:scale-110 enabled:hover:shadow-xl enabled:focus:outline-none enabled:focus:ring-4 enabled:focus:ring-sky-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
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
            <Link href={loginHref} className="text-sky-600 hover:underline">
              {t("loginCta")}
            </Link>{" "}
            {t("loginFooter")}
          </p>
        )}
        {user && user.access !== "premium" && (
          <p className="mt-2 text-center text-xs text-orange-600 dark:text-orange-400">
            <Link href={accountHref} className="hover:underline font-medium">
              {t("premiumCta")}
            </Link>{" "}
            {t("premiumFooter")}
          </p>
        )}
      </div>
    </div>
  );
}
