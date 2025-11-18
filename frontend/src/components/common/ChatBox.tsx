/* eslint-disable @typescript-eslint/no-explicit-any */
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
import useClickOutside from "@/hooks/common/useClickOutside";
import { useAuth } from "@/context/AuthContext";
import { postJson } from "@/lib/api/client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";

type Msg = {
  _id?: string;
  id?: string;
  role: "user" | "assistant";
  content: string;
  at?: number;
  createdAt?: string;
  /** hiển thị bong bóng chờ */
  pending?: boolean;
  /** Đánh dấu là Learning Insight message */
  isLearningInsight?: boolean;
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

// Component để render Learning Insight với progress bar và heatmap
function LearningInsightCard({ insightText }: { insightText: string }) {
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
        console.error("Failed to fetch Learning Insight data:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  // Render heatmap mini (30 ngày gần nhất)
  const renderMiniHeatmap = () => {
    if (!activityData || activityData.activityData.length === 0) {
      return (
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
          Chưa có dữ liệu hoạt động
        </div>
      );
    }

    const activityMap = new Map<string, number>();
    activityData.activityData.forEach((it) =>
      activityMap.set(it.date, it.count)
    );

    // Lấy 30 ngày gần nhất
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
              title={`${day.date}: ${day.count} bài`}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Insight Text */}
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

      {/* Progress Bar & Heatmap */}
      {!loading && (
        <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-zinc-700">
          {/* Progress Bar */}
          {goalData?.hasGoal && goalData.progress !== null ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Tiến độ đạt mục tiêu TOEIC
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
                    {goalData.goal.startScore} → {goalData.currentScore} /{" "}
                    {goalData.goal.targetScore}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg">
              💡 Hãy đặt mục tiêu TOEIC để theo dõi tiến độ
            </div>
          )}

          {/* Activity Heatmap Mini */}
          {activityData && activityData.stats ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Hoạt động học tập (30 ngày)
                </span>
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                  {activityData.stats.currentStreak > 0 && (
                    <span className="flex items-center gap-1">
                      🔥 {activityData.stats.currentStreak} ngày
                    </span>
                  )}
                  <span>{activityData.stats.totalAttempts} bài</span>
                </div>
              </div>
              {renderMiniHeatmap()}
            </div>
          ) : (
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
              Chưa có dữ liệu Learning Insight
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ChatBox() {
  const t = useTranslations("chat");
  const { user } = useAuth();
  const basePrefix = useBasePrefix();
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  // Sử dụng session "default" để nhận Learning Insights từ backend
  const [sessionId, setSessionId] = useState(() => {
    // Ưu tiên session "default" để nhận Learning Insights
    return "default";
  });
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const listRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const lastReadCountRef = useRef(0);

  useClickOutside(wrapperRef, () => setOpen(false));

  // Load chat history when component mounts / session changes
  const loadChatHistory = useCallback(async () => {
    try {
      if (!user || user.access !== "premium") return;
      const response = await fetch(`/api/chat/history/${sessionId}`, {
        credentials: "include",
      });
      if (!response.ok) {
        if (response.status === 403) {
          const errorData = await response.json();
          if (errorData.code === "PREMIUM_REQUIRED") {
            setError("Chức năng chat với AI chỉ dành cho tài khoản Premium.");
            return;
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
            // Phát hiện Learning Insight message (thường có pattern đặc biệt hoặc được tạo tự động)
            // Kiểm tra nếu là assistant message và có nội dung dài, có thể là Learning Insight
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
        // Emit event nếu có Learning Insight mới (trước khi set state)
        const prevLearningInsightCount = messages.filter(
          (m) => m.isLearningInsight
        ).length;
        const learningInsights = formattedMessages.filter(
          (m) => m.isLearningInsight
        );

        if (
          learningInsights.length > prevLearningInsightCount &&
          typeof window !== "undefined"
        ) {
          // Có Learning Insight mới, emit event
          window.dispatchEvent(
            new CustomEvent("learning-insight:received", {
              detail: { count: learningInsights.length },
            })
          );
        }

        setMessages(formattedMessages);

        // Cập nhật unread count: so sánh với số lượng đã đọc
        if (!open) {
          // Chỉ tính unread khi ChatBox đóng
          const currentCount = formattedMessages.length;
          const unread = Math.max(0, currentCount - lastReadCountRef.current);
          setUnreadCount(unread);
        } else {
          // Khi mở ChatBox, đánh dấu tất cả là đã đọc
          lastReadCountRef.current = formattedMessages.length;
          setUnreadCount(0);
          // Lưu vào localStorage để persist
          if (typeof window !== "undefined") {
            localStorage.setItem(
              `chat_read_count_${sessionId}`,
              String(formattedMessages.length)
            );
          }
        }
      } else {
        setMessages([]);
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Failed to load chat history:", err);
    }
  }, [sessionId, user, open]);

  // Load last read count from localStorage khi mount
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
      // Khi đóng ChatBox, vẫn load để cập nhật unread count
      loadChatHistory();
    }
  }, [user, open, loadChatHistory]);

  // Polling để tự động refresh messages mới (Learning Insights)
  // Chỉ polling khi ChatBox mở hoặc khi có placement/progress test mới
  useEffect(() => {
    if (!user || user.access !== "premium") return;

    // Chỉ polling khi ChatBox mở để tránh refresh không cần thiết
    // Khi đóng, chỉ refresh khi có event test-submitted
    if (!open) return;

    const interval = setInterval(() => {
      loadChatHistory();
    }, 5000); // Giảm tần suất xuống 5 giây để tránh refresh quá thường xuyên

    return () => clearInterval(interval);
  }, [user, loadChatHistory, open]);

  // Lắng nghe sự kiện khi submit test để refresh messages ngay lập tức
  // Chỉ listen cho placement và progress test, không listen cho practice test
  useEffect(() => {
    if (!user || user.access !== "premium") return;

    const handleTestSubmitted = (event: Event) => {
      const customEvent = event as CustomEvent;
      const testType = customEvent.detail?.type;
      // Chỉ refresh cho placement và progress test
      if (testType === "placement" || testType === "progress") {
        // Refresh messages sau 2 giây để đợi backend tạo Learning Insight
        setTimeout(() => {
          loadChatHistory();
        }, 2000);
      }
    };

    // Lắng nghe event để mở ChatBox và refresh
    const handleOpenAndRefresh = () => {
      setOpen(true);
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

  // Auto-scroll chỉ khi:
  // 1. Mới mở ChatBox
  // 2. Có message mới được thêm vào (số lượng tăng)
  // 3. Người dùng đang ở gần cuối danh sách (cách đáy < 150px)
  const prevMessagesLengthRef = useRef(messages.length);
  const prevOpenRef = useRef(open);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;

    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 150;
    const hasNewMessages = messages.length > prevMessagesLengthRef.current;
    const justOpened = !prevOpenRef.current && open; // Mới mở ChatBox

    // Chỉ auto-scroll nếu:
    // - Mới mở ChatBox
    // - Có message mới VÀ đang ở gần cuối
    // - Hoặc đang ở gần cuối và messages thay đổi (polling refresh)
    if (justOpened || (open && (hasNewMessages || isNearBottom))) {
      // Sử dụng setTimeout để đảm bảo DOM đã render xong
      setTimeout(() => {
        if (el) {
          el.scrollTop = el.scrollHeight;
        }
      }, 0);
    }

    prevMessagesLengthRef.current = messages.length;
    prevOpenRef.current = open;
  }, [messages, open]);

  // --- SEND with optimistic UI (user msg + pending assistant bubble) ---
  const send = async () => {
    const text = input.trim();
    if (!text || sending || !user) return;

    // Kiểm tra premium access
    if (user.access !== "premium") {
      setError(
        "Chức năng chat với AI chỉ dành cho tài khoản Premium. Vui lòng nâng cấp tài khoản để sử dụng."
      );
      return;
    }

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
        throw new Error(
          json?.message || "Failed to send message: No data in response"
        );
      }

      const { userMessage, assistantMessage } = json.data;

      if (!userMessage || !assistantMessage) {
        console.error(
          "[ChatBox] Response thiếu userMessage hoặc assistantMessage:",
          { userMessage, assistantMessage }
        );
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
      let errorMessage = "Có lỗi xảy ra khi gửi tin nhắn";
      let errorCode = "";

      // Kiểm tra error code từ response
      if (err instanceof Error) {
        errorMessage = err.message;
        errorCode = (err as any)?.code || "";

        // Kiểm tra nếu status là 403 (Forbidden)
        if ((err as any)?.status === 403) {
          errorCode = errorCode || "PREMIUM_REQUIRED";
        }
      }

      // Kiểm tra nếu lỗi là do không có premium
      if (
        errorCode === "PREMIUM_REQUIRED" ||
        errorMessage.includes("Premium") ||
        errorMessage.includes("premium")
      ) {
        setError(
          "Chức năng chat với AI chỉ dành cho tài khoản Premium. Vui lòng nâng cấp tài khoản để sử dụng."
        );
      } else {
        setError(errorMessage);
      }

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
      // Giữ session "default" để tiếp tục nhận Learning Insights
      setSessionId("default");
      // không reload trang — giữ UI mượt
    }
  };

  return (
    <>
      {/* Floating Action Button với badge unread */}
      <div className="fixed bottom-6 right-6 z-[70]">
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? t("closeChat") : t("openChat")}
          className="relative flex h-14 w-14 items-center justify-center 
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
          {/* Badge unread count */}
          {!open && unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow-lg ring-2 ring-white dark:ring-zinc-900"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          )}
        </button>
      </div>

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
            h-[38vh] xs:h-[40vh] sm:h-[50vh]
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
                  {!user
                    ? "Vui lòng đăng nhập để bắt đầu trò chuyện"
                    : user.access !== "premium"
                    ? "Chức năng chat với AI chỉ dành cho tài khoản Premium. Vui lòng nâng cấp tài khoản để sử dụng."
                    : t("empty")}
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

                      {/* Delete button (user messages only) */}
                      {m.role === "user" && (m.id || m._id) && (
                        <button
                          onClick={() => {
                            const msgId = m.id || m._id;
                            setMessages((prev) =>
                              prev.filter(
                                (msg) => (msg.id || msg._id) !== msgId
                              )
                            );
                          }}
                          className="absolute -top-2 -left-2 opacity-70 group-hover:opacity-100 
                          p-1.5 rounded-lg bg-red-50 dark:bg-red-900/30 shadow-md
                          transition hover:scale-110 hover:bg-red-100 dark:hover:bg-red-900/50
                          focus:outline-none focus:ring-2 focus:ring-red-400"
                          aria-label="Xóa tin nhắn"
                        >
                          <FiTrash2 className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
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
                  placeholder={
                    !user
                      ? "Đăng nhập để chat..."
                      : user.access !== "premium"
                      ? "Cần tài khoản Premium để sử dụng..."
                      : t("placeholder")
                  }
                  disabled={!user || sending || user?.access !== "premium"}
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
                disabled={
                  sending ||
                  !input.trim() ||
                  !user ||
                  user?.access !== "premium"
                }
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
                <a href="/login" className="text-sky-600 hover:underline">
                  Đăng nhập
                </a>{" "}
                để sử dụng
              </p>
            )}
            {user && user.access !== "premium" && (
              <p className="mt-2 text-center text-xs text-orange-600 dark:text-orange-400">
                <a href="/account" className="hover:underline font-medium">
                  Nâng cấp lên Premium
                </a>{" "}
                để sử dụng chat với AI
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}
