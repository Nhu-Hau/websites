"use client";

import React, { useState, useEffect } from "react";
import { MessageSquare, Loader2, Lock, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { toast } from "@/lib/toast";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";

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
  viewLabel: string;
  createLabel: string;
  loadingLabel: string;
};

function AIInsightButton({ onClick, loading, insightExists, viewLabel, createLabel, loadingLabel }: AIInsightButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-sky-600 to-sky-500 px-4 py-2 text-xs xs:text-sm font-semibold text-white shadow-sm transition-all hover:from-sky-500 hover:to-sky-400 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> {loadingLabel}
        </>
      ) : (
        <>
          <MessageSquare className="h-3.5 w-3.5" />
          {insightExists ? viewLabel : createLabel}
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
  const t = useTranslations("test.aiInsight");
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
        if (showErrors) {
          try {
            const errorData = await res.json();
            throw new Error(errorData.message || "Failed to load insight");
          } catch {
            throw new Error("Failed to load insight");
          }
        }
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
          toast.error(t("createError"));
        }
      }
    } catch (e) {
      // Error already handled via toast
      if (showErrors) {
        toast.error(t("loadError"));
      }
    } finally {
      setInsightLoading(false);
    }
  };

  const handleLoadInsight = async () => {
    // Nếu không phải premium, không làm gì (sẽ hiển thị UI khóa)
    if (userAccess !== "premium") return;
    
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

  const basePrefix = useBasePrefix("vi");
  const isPremium = userAccess === "premium";

  return (
    <section className="rounded-2xl border border-zinc-200/80 bg-white/95 p-4 xs:p-5 shadow-sm backdrop-blur-sm dark:border-zinc-700/80 dark:bg-zinc-900/95">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <AIInsightHeader
          title={t("title")}
          subtitle={t("subtitle")}
          icon={<MessageSquare className="h-4 w-4" />}
        />

        {!isPremium ? (
          // UI khóa cho free user
          <Link
            href={`${basePrefix}/pricing`}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-xs xs:text-sm font-semibold text-white shadow-sm transition-all hover:from-amber-400 hover:to-orange-400 hover:shadow-md"
          >
            <Lock className="h-3.5 w-3.5" />
            {t("upgradeToUnlock") || "Nâng cấp Premium"}
          </Link>
        ) : !showInsight ? (
          <AIInsightButton
            onClick={handleLoadInsight}
            loading={insightLoading}
            insightExists={!!insight}
            viewLabel={t("view")}
            createLabel={t("create")}
            loadingLabel={t("loading")}
          />
        ) : null}
      </div>

      {!isPremium && (
        // Hiển thị thông báo khóa
        <div className="mt-4 rounded-xl border border-amber-200/80 bg-amber-50/90 dark:border-amber-800/70 dark:bg-amber-950/60 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/40 flex-shrink-0">
              <Lock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1 space-y-2">
              <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                {t("premiumFeature") || "Tính năng Premium"}
              </h4>
              <p className="text-xs xs:text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
                {t("premiumDescription") || "Nhận xét AI Insight chi tiết chỉ dành cho tài khoản Premium. Nâng cấp ngay để nhận phân tích chuyên sâu về bài làm của bạn!"}
              </p>
              <Link
                href={`${basePrefix}/pricing`}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:from-amber-500 hover:to-orange-500 hover:shadow-md mt-2"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {t("upgradeNow") || "Nâng cấp ngay"}
              </Link>
            </div>
          </div>
        </div>
      )}

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
          {t("noInsight")}
        </p>
      )}
    </section>
  );
}
