"use client";

import React, { useState, useEffect } from "react";
import { MessageSquare, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { toast } from "@/lib/toast";

export type AIInsightSectionProps = {
  attemptId: string;
  userAccess?: string;
  apiEndpoint: string; // e.g., `/api/chat/insight/placement/${attemptId}`
};

// ---------------- Header Component ----------------
type AIInsightHeaderProps = {
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
};

function AIInsightHeader({ title, subtitle, icon }: AIInsightHeaderProps) {
  return (
    <div className="flex items-center gap-2 xs:gap-3 sm:mb-5">
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-900/40 dark:text-sky-300">
        {icon}
      </span>
      <div className="">
        <h3 className="text-sm xs:text-base font-semibold text-zinc-900 dark:text-zinc-50">
          {title}
        </h3>
        <p className="text-xs xs:text-sm text-zinc-500 dark:text-zinc-400">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

// ---------------- Button Component ----------------
type AIInsightButtonProps = {
  onClick: () => void;
  loading: boolean;
  insightExists: boolean;
};

function AIInsightButton({ onClick, loading, insightExists }: AIInsightButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-sky-600 to-sky-500 px-4 py-2 text-xs xs:text-sm font-semibold text-white shadow-sm transition-all hover:from-sky-500 hover:to-sky-400 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang tải...
        </>
      ) : (
        <>
          <MessageSquare className="h-3.5 w-3.5" />
          {insightExists ? "Xem nhận xét" : "Tạo nhận xét"}
        </>
      )}
    </button>
  );
}

// ---------------- Main Component ----------------
export function AIInsightSection({
  attemptId,
  userAccess,
  apiEndpoint,
}: AIInsightSectionProps) {
  const [showInsight, setShowInsight] = useState(false);
  const [insightLoading, setInsightLoading] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);
  const [hasUserClicked, setHasUserClicked] = useState(false);

  // Key để lưu vào localStorage
  const storageKey = `ai_insight_${attemptId}`;
  const clickedKey = `ai_insight_clicked_${attemptId}`;

  // Load insight từ localStorage khi mount - chỉ hiện nếu đã có insight đã lưu
  useEffect(() => {
    if (userAccess !== "premium" || !attemptId) return;
    
    const savedInsight = localStorage.getItem(storageKey);
    const wasClicked = localStorage.getItem(clickedKey) === "true";
    
    if (savedInsight) {
      setInsight(savedInsight);
      setHasUserClicked(wasClicked);
      // Chỉ tự động hiển thị nếu đã click trước đó (đã có insight được lưu)
      if (wasClicked) {
        setShowInsight(true);
      }
    }
  }, [attemptId, userAccess, storageKey, clickedKey]);

  const fetchInsight = async (showErrors = true) => {
    if (!attemptId || insightLoading) return;
    
    setInsightLoading(true);
    try {
      const res = await fetch(apiEndpoint, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        if (showErrors) throw new Error("Failed to load insight");
        return;
      }
      const json = await res.json();
      if (json?.data?.insight) {
        const insightContent = json.data.insight;
        setInsight(insightContent);
        
        // Lưu vào localStorage để xem lại sau
        if (typeof window !== "undefined") {
          localStorage.setItem(storageKey, insightContent);
          // Đảm bảo clickedKey cũng được lưu
          localStorage.setItem(clickedKey, "true");
        }
        
        // Hiển thị insight sau khi fetch thành công
        setShowInsight(true);
        
        if (hasUserClicked && typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("chatbox:open-and-refresh"));
        }
      } else {
        if (showErrors) {
          toast.error("Không thể tạo nhận xét");
        }
      }
    } catch (e) {
      console.error(e);
      if (showErrors) {
        toast.error("Lỗi khi tải nhận xét");
      }
    } finally {
      setInsightLoading(false);
    }
  };

  const handleLoadInsight = async () => {
    // Đánh dấu đã click
    setHasUserClicked(true);
    if (typeof window !== "undefined") {
      localStorage.setItem(clickedKey, "true");
    }

    // Nếu đã có insight từ localStorage, chỉ cần hiển thị
    if (insight) {
      setShowInsight(true);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("chatbox:open-and-refresh"));
      }
      return;
    }
    
    // Nếu chưa có insight, fetch từ API
    await fetchInsight(true);
  };

  if (userAccess !== "premium") return null;

  return (
    <section className="rounded-2xl border border-zinc-200/80 bg-white/95 p-4 xs:p-5 shadow-sm backdrop-blur-sm dark:border-zinc-700/80 dark:bg-zinc-900/95">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <AIInsightHeader
          title="Nhận xét từ AI"
          subtitle="Phân tích điểm mạnh/yếu và lộ trình khuyến nghị"
          icon={<MessageSquare className="h-4 w-4" />}
        />

        {!showInsight && (
          <AIInsightButton
            onClick={handleLoadInsight}
            loading={insightLoading}
            insightExists={!!insight}
          />
        )}
      </div>

      {showInsight && insight && (
        <div className="border-t border-zinc-200 pt-4 text-sm leading-relaxed text-zinc-700 dark:border-zinc-700 dark:text-zinc-200 xs:text-base">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            components={{
              h1: ({ children }) => (
                <h1 className="mb-2 text-base font-bold">{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 className="mb-2 text-sm font-bold">{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className="mb-1 text-xs font-bold">{children}</h3>
              ),
              p: ({ children }) => (
                <p className="mb-2 last:mb-0 text-sm">{children}</p>
              ),
              ul: ({ children }) => (
                <ul className="mb-2 list-disc list-inside space-y-1 text-sm">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="mb-2 list-decimal list-inside space-y-1 text-sm">
                  {children}
                </ol>
              ),
              li: ({ children }) => <li className="text-sm">{children}</li>,
              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
              em: ({ children }) => <em className="italic">{children}</em>,
            }}
          >
            {insight}
          </ReactMarkdown>
        </div>
      )}

      {showInsight && !insight && (
        <p className="py-3 text-center text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Chưa có nhận xét. Hãy thử tải lại sau.
        </p>
      )}
    </section>
  );
}
