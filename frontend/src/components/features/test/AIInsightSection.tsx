"use client";

import React, { useState } from "react";
import { MessageSquare, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { toast } from "sonner";

export type AIInsightSectionProps = {
  attemptId: string;
  userAccess?: string;
  apiEndpoint: string; // e.g., `/api/chat/insight/placement/${attemptId}`
};

export function AIInsightSection({
  attemptId,
  userAccess,
  apiEndpoint,
}: AIInsightSectionProps) {
  const [showInsight, setShowInsight] = useState(false);
  const [insightLoading, setInsightLoading] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);

  if (userAccess !== "premium") return null;

  const handleLoadInsight = async () => {
    if (insight) {
      setShowInsight(true);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("chatbox:open-and-refresh"));
      }
      return;
    }
    if (!attemptId) return;
    setInsightLoading(true);
    try {
      const res = await fetch(apiEndpoint, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load insight");
      const json = await res.json();
      if (json?.data?.insight) {
        setInsight(json.data.insight);
        setShowInsight(true);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("chatbox:open-and-refresh"));
        }
      } else {
        toast.error("Không thể tạo nhận xét");
      }
    } catch (e) {
      console.error(e);
      toast.error("Lỗi khi tải nhận xét");
    } finally {
      setInsightLoading(false);
    }
  };

  return (
    <section className="rounded-2xl border border-zinc-200/80 bg-white/95 p-5 shadow-sm backdrop-blur-sm dark:border-zinc-700/80 dark:bg-zinc-900/95">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-900/40 dark:text-sky-300">
            <MessageSquare className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Nhận xét từ AI
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-5">
              Phân tích điểm mạnh/yếu và lộ trình khuyến nghị
            </p>
          </div>
        </div>

        {!showInsight && (
          <button
            onClick={handleLoadInsight}
            disabled={insightLoading}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-sky-600 to-sky-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:from-sky-500 hover:to-sky-400 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
          >
            {insightLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Đang tải...
              </>
            ) : (
              <>
                <MessageSquare className="h-3.5 w-3.5" />
                {insight ? "Xem nhận xét" : "Tạo nhận xét"}
              </>
            )}
          </button>
        )}
      </div>

      {showInsight && insight && (
        <div className="border-t border-zinc-200 pt-4 text-sm leading-relaxed text-zinc-700 dark:border-zinc-700 dark:text-zinc-200">
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
              li: ({ children }) => (
                <li className="text-sm">{children}</li>
              ),
              strong: ({ children }) => (
                <strong className="font-semibold">{children}</strong>
              ),
              em: ({ children }) => (
                <em className="italic">{children}</em>
              ),
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

