/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SectionHeader from "./SectionHeader";
import { apiBase } from "@/lib/api/client";
import { useAuth } from "@/context/AuthContext";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";
import {
  CheckCircle2,
  XCircle,
  Sparkles,
  MessageSquare,
  PlayCircle,
  Layers,
  BarChart3,
  ShieldCheck,
  Bot,
  Infinity as InfinityIcon,
  Loader2,
  Crown,
  BadgePercent,
  X,
  Star,
  Zap,
  FileDown,
  Upload,
  MessageCircle,
  Brain,
  Users,
} from "lucide-react";
import { motion, Variants } from "framer-motion";

type PayResp = {
  data?: { checkoutUrl: string; qrCode?: string; orderCode: number };
};

type PromoPreview = {
  code: string;
  amountBefore: number;
  amountAfter: number;
  type?: "fixed" | "percent";
  value?: number;
};

type FeatureRow = {
  key: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  free: React.ReactNode;
  pro: React.ReactNode;
};

/* ================== Motion ================== */

const sectionFade: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const cardsStagger: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const cardFade: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function Pricing() {
  const router = useRouter();
  const basePrefix = useBasePrefix("vi");
  const { user } = useAuth();
  const isPremium = user?.access === "premium";

  const [loading, setLoading] = useState(false);

  // promo code
  const [code, setCode] = useState("");
  const [checking, setChecking] = useState(false);
  const [promo, setPromo] = useState<PromoPreview | null>(null);
  const [promoErr, setPromoErr] = useState<string | null>(null);

  const priceDisplay = useMemo(() => {
    const base = 129_000;
    if (promo) return { base, final: promo.amountAfter };
    return { base, final: base };
  }, [promo]);

  async function onApplyCode() {
    setPromoErr(null);
    if (!user) {
      router.push(`${basePrefix}/login`);
      return;
    }
    const trimmed = code.trim();
    if (!trimmed) return;

    setChecking(true);
    try {
      const r = await fetch(`${apiBase()}/api/payments/promo/validate`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      });
      const j = await r.json();
      if (!r.ok)
        throw new Error(j?.message || "Mã không hợp lệ hoặc đã hết hạn");

      setPromo({
        code: j.data.code,
        amountBefore: j.data.amountBefore,
        amountAfter: j.data.amountAfter,
        type: j.data.type,
        value: j.data.value,
      });
    } catch (e: any) {
      setPromo(null);
      setPromoErr(e?.message || "Không thể kiểm tra mã, vui lòng thử lại");
    } finally {
      setChecking(false);
    }
  }

  function clearCode() {
    setPromo(null);
    setPromoErr(null);
    setCode("");
  }

  const handleUpgrade = async () => {
    if (!user) {
      router.push(`${basePrefix}/login`);
      return;
    }
    if (isPremium) return;

    setLoading(true);
    try {
      const resp = await fetch(`${apiBase()}/api/payments/create`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promoCode: promo?.code || undefined }),
      });
      const json: PayResp = await resp.json();
      if (!resp.ok)
        throw new Error(
          (json as any)?.message || "Không thể tạo link thanh toán"
        );
      const url = json?.data?.checkoutUrl;
      if (!url) throw new Error("Thiếu checkoutUrl từ hệ thống thanh toán");
      window.location.href = url;
    } catch (e: any) {
      alert(e?.message || "Có lỗi xảy ra khi tạo link thanh toán");
      console.error("Error creating payment:", e);
    } finally {
      setLoading(false);
    }
  };

  // ========= BẢNG SO SÁNH TÍNH NĂNG =========
  const rows: FeatureRow[] = useMemo(
    () => [
      {
        key: "practice",
        label: "Practice Tests",
        description: "Luyện đề theo Part & Level",
        icon: <Layers className="h-4 w-4" />,
        free: <>20 bài/tháng</>,
        pro: (
          <span className="inline-flex items-center gap-1">
            <InfinityIcon className="h-4 w-4 text-indigo-600" />
            <span>Không giới hạn</span>
          </span>
        ),
      },
      {
        key: "ai-chat",
        label: "AI Chat (Gia sư TOEIC)",
        description: "Trao đổi với AI về ngữ pháp, từ vựng, chiến lược làm bài",
        icon: <Bot className="h-4 w-4" />,
        free: (
          <span className="inline-flex items-center gap-1 text-slate-500">
            <XCircle className="h-4 w-4" />
            <span>Bị khóa</span>
          </span>
        ),
        pro: (
          <span className="inline-flex items-center gap-1 text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            <span>Mở khóa</span>
          </span>
        ),
      },
      {
        key: "admin-chat",
        label: "Admin / Teacher Chat",
        description: "Hỏi đáp trực tiếp với admin hoặc giảng viên",
        icon: <MessageSquare className="h-4 w-4" />,
        free: (
          <span className="inline-flex items-center gap-1 text-slate-500">
            <XCircle className="h-4 w-4" />
            <span>Bị khóa</span>
          </span>
        ),
        pro: (
          <span className="inline-flex items-center gap-1 text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            <span>Mở khóa</span>
          </span>
        ),
      },
      {
        key: "vocab-translate",
        label: "Dịch từ vựng trên bài báo",
        description: "Dịch & lưu từ vựng trực tiếp khi đọc news",
        icon: <Sparkles className="h-4 w-4" />,
        free: (
          <span className="inline-flex items-center gap-1 text-slate-500">
            <XCircle className="h-4 w-4" />
            <span>Bị khóa</span>
          </span>
        ),
        pro: (
          <span className="inline-flex items-center gap-1 text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            <span>Mở khóa</span>
          </span>
        ),
      },
      {
        key: "livestream-comments",
        label: "Livestream Comments",
        description: "Chat trong phòng học livestream",
        icon: <MessageCircle className="h-4 w-4" />,
        free: (
          <span>
            5 comment/buổi{" "}
            <span className="text-xs text-slate-500">(giới hạn)</span>
          </span>
        ),
        pro: (
          <span className="inline-flex items-center gap-1 text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            <span>Không giới hạn</span>
          </span>
        ),
      },
      {
        key: "download-files",
        label: "Tải file giảng viên",
        description: "Download tài liệu được gửi trong phòng học",
        icon: <FileDown className="h-4 w-4" />,
        free: (
          <span className="inline-flex items-center gap-1 text-slate-500">
            <XCircle className="h-4 w-4" />
            <span>Bị khóa</span>
          </span>
        ),
        pro: (
          <span className="inline-flex items-center gap-1 text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            <span>Mở khóa</span>
          </span>
        ),
      },
      {
        key: "upload-files",
        label: "Upload file trong livestream",
        description: "Upload tài liệu hỗ trợ buổi học trực tuyến",
        icon: <Upload className="h-4 w-4" />,
        free: (
          <span className="inline-flex items-center gap-1 text-slate-500">
            <XCircle className="h-4 w-4" />
            <span>Bị khóa</span>
          </span>
        ),
        pro: (
          <span className="inline-flex items-center gap-1 text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            <span>Mở khóa</span>
          </span>
        ),
      },
      {
        key: "learning-insight",
        label: "Learning Insight",
        description: "AI phân tích kết quả làm bài & thói quen học",
        icon: <Brain className="h-4 w-4" />,
        free: (
          <span className="inline-flex items-center gap-1 text-slate-500">
            <XCircle className="h-4 w-4" />
            <span>Bị khóa</span>
          </span>
        ),
        pro: (
          <span className="inline-flex items-center gap-1 text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            <span>Mở khóa</span>
          </span>
        ),
      },
      {
        key: "groups",
        label: "Tạo Groups học chung",
        description: "Tạo nhóm học, mời bạn bè vào học chung",
        icon: <Users className="h-4 w-4" />,
        free: (
          <span className="inline-flex items-center gap-1 text-slate-500">
            <XCircle className="h-4 w-4" />
            <span>Bị khóa</span>
          </span>
        ),
        pro: (
          <span className="inline-flex items-center gap-1 text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            <span>Mở khóa</span>
          </span>
        ),
      },
    ],
    []
  );

  return (
    <section className="relative bg-slate-50 py-12 dark:bg-slate-950 sm:py-16">
      {/* subtle background accent */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(700px_200px_at_50%_0px,rgba(79,70,229,0.12),transparent)] dark:bg-[radial-gradient(700px_200px_at_50%_0px,rgba(129,140,248,0.24),transparent)]"
      />

      <div className="relative mx-auto flex max-w-6xl flex-col gap-10 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          variants={sectionFade}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
        >
          <SectionHeader
            eyebrow="Pricing"
            title="Chọn gói phù hợp với hành trình TOEIC của bạn"
            desc="Bắt đầu với gói Free để làm quen hệ thống. Khi muốn bứt tốc và mở khóa toàn bộ tính năng AI, bạn chỉ cần nâng cấp lên Premium."
            align="center"
          />
        </motion.div>

        {/* Cards */}
        <motion.div
          className="grid gap-6 md:grid-cols-2"
          variants={cardsStagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          {/* PREMIUM */}
          <motion.article
            variants={cardFade}
            className="relative flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900 sm:p-7"
          >
            <div className="absolute -top-3 right-4 inline-flex items-center gap-1 rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
              {isPremium ? (
                <>
                  <Crown className="h-3.5 w-3.5" />
                  Bạn đang dùng
                </>
              ) : (
                <>
                  <Zap className="h-3.5 w-3.5" />
                  Gói được khuyến nghị
                </>
              )}
            </div>

            <header className="mb-6 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">
                Premium
              </p>
              <div className="flex items-baseline gap-2">
                {promo ? (
                  <>
                    <span className="text-lg font-normal text-slate-400 line-through dark:text-slate-500">
                      {Math.round(priceDisplay.base / 1000)}k
                    </span>
                    <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                      {Math.round(priceDisplay.final / 1000)}k
                    </span>
                  </>
                ) : (
                  <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                    129k
                  </span>
                )}
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  / tháng
                </span>
              </div>
              <p className="max-w-md text-sm text-slate-600 dark:text-slate-300">
                Mở khóa toàn bộ Practice Tests, AI Chat, livestream, tải tài
                liệu và Learning Insight để tối ưu lộ trình luyện thi TOEIC.
              </p>

              {promo && (
                <div className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
                  <BadgePercent className="h-3 w-3" />
                  Đã áp dụng mã: {promo.code}
                </div>
              )}
            </header>

            {/* Promo input */}
            <div className="mb-4 flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Nhập mã khuyến mãi (nếu có)"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                  disabled={!!promo || isPremium}
                />
                {promo && (
                  <button
                    type="button"
                    onClick={clearCode}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <X className="h-4 w-4 text-slate-500" />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={onApplyCode}
                disabled={!!promo || !code.trim() || checking || isPremium}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500 disabled:opacity-60"
              >
                {checking ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <BadgePercent className="h-4 w-4" />
                )}
                Áp dụng
              </button>
            </div>

            {promoErr && (
              <p className="mb-2 text-xs font-medium text-red-600 dark:text-red-400">
                {promoErr}
              </p>
            )}
            {promo && (
              <p className="mb-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                Giá sau giảm:{" "}
                <span className="text-sm">
                  {Math.round(priceDisplay.final / 1000)}.000đ
                </span>
              </p>
            )}

            <ul className="mb-6 space-y-2 text-sm text-slate-700 dark:text-slate-200">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950/40">
                  <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-300" />
                </span>
                <span>Không giới hạn Practice Tests & mini tests</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950/40">
                  <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-300" />
                </span>
                <span>Chat AI & Admin/Giảng viên bất cứ lúc nào</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950/40">
                  <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-300" />
                </span>
                <span>Livestream không giới hạn bình luận & tài liệu</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950/40">
                  <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-300" />
                </span>
                <span>Learning Insight cá nhân hoá theo kết quả học</span>
              </li>
            </ul>

            <div className="mt-auto pt-1">
              <button
                type="button"
                onClick={handleUpgrade}
                disabled={isPremium || loading}
                className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors ${
                  isPremium
                    ? "bg-emerald-600 hover:bg-emerald-600"
                    : "bg-indigo-600 hover:bg-indigo-500"
                } disabled:opacity-60`}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : isPremium ? (
                  <>
                    <Crown className="h-4 w-4" />
                    Bạn đang dùng Premium
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Nâng cấp Premium
                  </>
                )}
              </button>
              <p className="mt-2 text-center text-[11px] text-slate-500 dark:text-slate-400">
                Thanh toán qua{" "}
                <span className="font-semibold text-indigo-600 dark:text-indigo-300">
                  PayOS
                </span>
                . Bạn có thể dừng gia hạn bất kỳ lúc nào.
              </p>
            </div>
          </motion.article>

          {/* FREE */}
          <motion.article
            variants={cardFade}
            className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-md shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900 sm:p-7"
          >
            <header className="mb-6 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Free
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                  0đ
                </span>
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  / tháng
                </span>
              </div>
              <p className="max-w-md text-sm text-slate-600 dark:text-slate-300">
                Làm placement test, luyện tập cơ bản và trải nghiệm giao diện
                học thử trước khi nâng cấp.
              </p>
            </header>

            <ul className="mb-6 space-y-2 text-sm text-slate-700 dark:text-slate-200">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                  <CheckCircle2 className="h-3.5 w-3.5 text-slate-500 dark:text-slate-300" />
                </span>
                <span>20 Practice Tests mỗi tháng</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                  <CheckCircle2 className="h-3.5 w-3.5 text-slate-500 dark:text-slate-300" />
                </span>
                <span>Lộ trình gợi ý cơ bản theo level</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                  <CheckCircle2 className="h-3.5 w-3.5 text-slate-500 dark:text-slate-300" />
                </span>
                <span>Báo cáo điểm tổng quan sau mỗi bài</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                  <CheckCircle2 className="h-3.5 w-3.5 text-slate-500 dark:text-slate-300" />
                </span>
                <span>Cập nhật nội dung đề & bài đọc thường xuyên</span>
              </li>
            </ul>

            <div className="mt-auto pt-1">
              <Link
                href={`${basePrefix}/register`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-500 dark:hover:bg-slate-800 dark:focus-visible:ring-offset-slate-950"
              >
                <Star className="h-4 w-4" />
                Bắt đầu với gói Free
              </Link>
            </div>
          </motion.article>
        </motion.div>

        {/* So sánh chi tiết */}
        <motion.div
          variants={sectionFade}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="rounded-3xl border border-slate-200 bg-white px-4 py-6 shadow-sm shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900 sm:px-6 sm:py-7"
        >
          <div className="mb-5 flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600/90 text-white">
                <BarChart3 className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-50 sm:text-base">
                  So sánh chi tiết tính năng Free vs Premium
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Dựa trên các module thật của hệ thống (Practice, AI Chat,
                  Livestream, Learning Insight, Groups).
                </p>
              </div>
            </div>
          </div>

          {/* Desktop table */}
          <div className="hidden text-sm text-slate-700 md:grid md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)] md:gap-x-4 dark:text-slate-200">
            <div className="pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Tính năng
            </div>
            <div className="pb-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Free
            </div>
            <div className="pb-2 text-center text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">
              Premium
            </div>

            {rows.map((row) => (
              <React.Fragment key={row.key}>
                <div className="border-t border-slate-200 py-3 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    {row.icon}
                    <span className="font-medium text-slate-900 dark:text-slate-50">
                      {row.label}
                    </span>
                  </div>
                  {row.description && (
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {row.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-center border-t border-slate-200 py-3 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-300">
                  {row.free}
                </div>
                <div className="flex items-center justify-center border-t border-slate-200 py-3 text-xs font-semibold text-indigo-700 dark:border-slate-800 dark:text-indigo-300">
                  {row.pro}
                </div>
              </React.Fragment>
            ))}
          </div>

          {/* Mobile cards */}
          <div className="space-y-4 text-sm text-slate-700 md:hidden dark:text-slate-200">
            {rows.map((row) => (
              <div
                key={row.key}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600/90 text-white">
                    {row.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                      {row.label}
                    </p>
                    {row.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {row.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl bg-white p-3 shadow-sm shadow-slate-900/5 dark:bg-slate-900">
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Free
                    </p>
                    <div className="text-[13px] text-slate-700 dark:text-slate-200">
                      {row.free}
                    </div>
                  </div>
                  <div className="rounded-xl bg-indigo-50 p-3 shadow-sm shadow-slate-900/5 dark:bg-indigo-950/40">
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
                      Premium
                    </p>
                    <div className="text-[13px] font-semibold text-indigo-800 dark:text-indigo-100">
                      {row.pro}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA cuối */}
        <motion.div
          variants={sectionFade}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          className="flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Link
            href={`${basePrefix}/practice`}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-500 dark:hover:bg-slate-800 dark:focus-visible:ring-offset-slate-950"
          >
            <PlayCircle className="h-4 w-4" />
            Làm thử bài luyện miễn phí
          </Link>

          <button
            type="button"
            onClick={handleUpgrade}
            disabled={isPremium || loading}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors disabled:opacity-60 ${
              isPremium
                ? "bg-emerald-600 hover:bg-emerald-600"
                : "bg-indigo-600 hover:bg-indigo-500"
            }`}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Crown className="h-4 w-4" />
            )}
            {isPremium ? "Bạn đang dùng Premium" : "Nâng cấp Premium ngay"}
          </button>
        </motion.div>
      </div>
    </section>
  );
}