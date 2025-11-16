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
  MessageCircle,
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
  Underline,
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
  icon?: React.ReactNode;
  free: React.ReactNode;
  pro: React.ReactNode;
};

/* ==== Motion variants ==== */
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4 },
  },
};

const staggerCards: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
};

const cardItem: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35 },
  },
};

export default function Pricing() {
  const router = useRouter();
  const basePrefix = useBasePrefix("vi");
  const { user } = useAuth();
  const isPremium = user?.access === "premium";

  const [loading, setLoading] = useState(false);

  // ---- Mã khuyến mãi ----
  const [code, setCode] = useState("");
  const [checking, setChecking] = useState(false);
  const [promo, setPromo] = useState<PromoPreview | null>(null);
  const [promoErr, setPromoErr] = useState<string | null>(null);

  const priceDisplay = useMemo(() => {
    const base = 129_000;
    if (promo) return { base, final: promo.amountAfter };
    return { base, final: 129_000 };
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
      setPromoErr(e?.message || "Không thể kiểm tra mã");
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
      if (!url) throw new Error("Thiếu checkoutUrl");
      window.location.href = url;
    } catch (e: any) {
      alert(e?.message || "Có lỗi xảy ra khi tạo link thanh toán");
      console.error("Error creating payment:", e);
    } finally {
      setLoading(false);
    }
  };

  // Bảng so sánh tính năng
  const rows: FeatureRow[] = useMemo(
    () => [
      {
        key: "practice",
        label: "Luyện đề",
        icon: <Layers className="h-4 w-4" />,
        free: <>20 bài/tháng</>,
        pro: (
          <>
            <InfinityIcon className="mr-1 inline h-4 w-4 text-sky-600 dark:text-sky-400" />
            <span className="font-semibold text-sky-700 dark:text-sky-400">
              Không giới hạn
            </span>
          </>
        ),
      },
      {
        key: "fulltest",
        label: "Full Test & giải chi tiết",
        icon: <PlayCircle className="h-4 w-4" />,
        free: (
          <span className="inline-flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
            <XCircle className="h-4 w-4" /> Không hỗ trợ
          </span>
        ),
        pro: (
          <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4" /> Có
          </span>
        ),
      },
      {
        key: "ai",
        label: "Chat với AI (gia sư TOEIC)",
        icon: <Bot className="h-4 w-4" />,
        free: (
          <span className="inline-flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
            <XCircle className="h-4 w-4" /> Bị khóa
          </span>
        ),
        pro: (
          <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4" /> Mở khóa
          </span>
        ),
      },
      {
        key: "adminchat",
        label: "Chat với Admin/Giảng viên",
        icon: <MessageSquare className="h-4 w-4" />,
        free: (
          <span className="inline-flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
            <XCircle className="h-4 w-4" /> Bị khóa
          </span>
        ),
        pro: (
          <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4" /> Mở khóa
          </span>
        ),
      },
      {
        key: "livestream",
        label: "Bình luận trong livestream",
        icon: <MessageCircle className="h-4 w-4" />,
        free: (
          <>
            Giới hạn{" "}
            <span className="text-zinc-400 dark:text-zinc-500">
              (lượt/buổi)
            </span>
          </>
        ),
        pro: (
          <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4" /> Không giới hạn
          </span>
        ),
      },
      {
        key: "download",
        label: "Tải file giảng viên gửi",
        icon: <Underline className="h-4 w-4" />,
        free: (
          <span className="inline-flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
            <XCircle className="h-4 w-4" /> Không hỗ trợ
          </span>
        ),
        pro: (
          <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4" /> Có
          </span>
        ),
      },
      {
        key: "roadmap",
        label: "Lộ trình học cá nhân hoá",
        icon: <Sparkles className="h-4 w-4" />,
        free: (
          <>
            Bản cơ bản{" "}
            <span className="text-zinc-400 dark:text-zinc-500">
              (theo level)
            </span>
          </>
        ),
        pro: (
          <>
            Bản nâng cao{" "}
            <span className="text-zinc-400 dark:text-zinc-500">
              (theo tiến độ)
            </span>
          </>
        ),
      },
      {
        key: "analytics",
        label: "Phân tích lỗi & báo cáo",
        icon: <BarChart3 className="h-4 w-4" />,
        free: <>Báo cáo cơ bản</>,
        pro: <>Phân tích lỗi nâng cao</>,
      },
      {
        key: "support",
        label: "Hỗ trợ & ưu tiên",
        icon: <ShieldCheck className="h-4 w-4" />,
        free: <>Chuẩn</>,
        pro: <>Ưu tiên</>,
      },
    ],
    []
  );

  return (
    <section className="relative border-y border-zinc-200 bg-white py-16 dark:border-zinc-900 dark:bg-zinc-950">
      {/* Soft gradient sky trên nền */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(900px_260px_at_50%_0,rgba(56,189,248,0.12),transparent)] dark:bg-[radial-gradient(900px_260px_at_50%_0,rgba(56,189,248,0.22),transparent)]"
      />

      <div className="relative mx-auto max-w-6xl px-6 lg:px-8">
        {/* Header */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.35 }}
        >
          <SectionHeader
            eyebrow="Bảng giá"
            title="Chọn gói phù hợp với hành trình TOEIC của bạn"
            desc="Bắt đầu hoàn toàn miễn phí. Khi cần tăng tốc để đạt mục tiêu điểm số, bạn chỉ cần nâng cấp lên Premium."
            align="center"
          />
        </motion.div>

        {/* 2 thẻ pricing */}
        <motion.div
          className="mt-14 grid gap-6 md:grid-cols-2"
          variants={staggerCards}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
        >
          {/* PREMIUM – thẻ chính */}
          <motion.article
            variants={cardItem}
            className="relative flex h-full flex-col rounded-[32px] bg-white/95 p-8 shadow-[0_22px_45px_rgba(15,23,42,0.12)] ring-1 ring-zinc-100 
                       transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_26px_60px_rgba(15,23,42,0.16)]
                       dark:bg-zinc-900/95 dark:ring-zinc-800"
          >
            <div className="absolute -top-3 right-7 inline-flex items-center gap-1.5 rounded-full bg-sky-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
              {isPremium ? (
                <>
                  <Crown className="h-3.5 w-3.5" />
                  Bạn đang dùng
                </>
              ) : (
                <>
                  <Zap className="h-3.5 w-3.5" />
                  Gói khuyên dùng
                </>
              )}
            </div>

            <header className="mb-7 space-y-2">
              <p className="text-sm font-semibold text-sky-600 dark:text-sky-400">
                Premium
              </p>
              <div className="flex items-baseline gap-2">
                <div className="flex items-baseline gap-1">
                  {promo ? (
                    <>
                      <span className="text-xl font-normal text-zinc-400 line-through dark:text-zinc-500">
                        {Math.round(priceDisplay.base / 1000)}k
                      </span>
                      <span className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">
                        {Math.round(priceDisplay.final / 1000)}k
                      </span>
                    </>
                  ) : (
                    <span className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">
                      129k
                    </span>
                  )}
                  <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    / tháng
                  </span>
                </div>
              </div>
              <p className="max-w-md text-sm text-zinc-500 dark:text-zinc-400">
                Toàn bộ chức năng luyện đề, phân tích lỗi, chat AI & giáo viên –
                dành cho bạn khi muốn bứt tốc điểm TOEIC.
              </p>
              {promo && (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                  <BadgePercent className="h-3.5 w-3.5" />
                  Đã áp dụng mã: {promo.code}
                </div>
              )}
            </header>

            {/* Promo input */}
            <div className="mb-6 flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Nhập mã khuyến mãi (nếu có)"
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm font-medium text-zinc-700 placeholder:text-zinc-400 
                             focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/15
                             dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:placeholder:text-zinc-500"
                  disabled={!!promo || isPremium}
                />
                {promo && (
                  <button
                    type="button"
                    onClick={clearCode}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <X className="h-4 w-4 text-zinc-500" />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={onApplyCode}
                disabled={!!promo || !code.trim() || checking || isPremium}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all 
                           hover:bg-sky-500 disabled:opacity-60"
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
              <p className="mb-3 text-xs font-medium text-red-600 dark:text-red-400">
                {promoErr}
              </p>
            )}
            {promo && (
              <p className="mb-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                Giá sau giảm:{" "}
                <strong className="text-sm">
                  {Math.round(priceDisplay.final / 1000)}.000đ
                </strong>
              </p>
            )}

            <ul className="mb-8 space-y-3 text-sm text-zinc-700 dark:text-zinc-300">
              {[
                "Không giới hạn số bài luyện",
                "Full Test + giải chi tiết từng câu",
                "Chat AI & Admin/Giảng viên hỗ trợ",
                "Phân tích lỗi nâng cao & tải file",
                "Lộ trình học tối ưu theo tiến độ",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-950/50">
                    <CheckCircle2 className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                  </div>
                  <span className="font-medium leading-snug">{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-auto pt-1">
              <button
                type="button"
                onClick={handleUpgrade}
                disabled={isPremium || loading}
                className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all disabled:opacity-60 ${
                  isPremium
                    ? "bg-gradient-to-r from-amber-600 to-amber-500"
                    : "bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400"
                }`}
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
              <p className="mt-3 text-center text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                Thanh toán qua{" "}
                <span className="font-semibold text-sky-600 dark:text-sky-400">
                  PayOS
                </span>
                . Có thể huỷ bất kỳ lúc nào.
              </p>
            </div>
          </motion.article>

          {/* FREE – thẻ phụ */}
          <motion.article
            variants={cardItem}
            className="flex h-full flex-col rounded-[32px] border border-zinc-200 bg-white/95 p-8 shadow-[0_18px_35px_rgba(15,23,42,0.06)] 
                       transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_45px_rgba(15,23,42,0.10)]
                       dark:border-zinc-800 dark:bg-zinc-900/95"
          >
            <header className="mb-7 space-y-2">
              <p className="text-sm font-semibold text-sky-600 dark:text-sky-400">
                Free
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">
                  0đ
                </span>
                <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  / tháng
                </span>
              </div>
            </header>

            <p className="mb-6 max-w-md text-sm text-zinc-500 dark:text-zinc-400">
              Thử trải nghiệm giao diện, làm placement test, luyện tập cơ bản
              trước khi quyết định nâng cấp.
            </p>

            <ul className="mb-8 space-y-3 text-sm text-zinc-700 dark:text-zinc-300">
              {[
                "20 bài luyện/tháng",
                "Mini test theo từng Part",
                "Lộ trình gợi ý cơ bản",
                "Báo cáo điểm tổng quan",
                "Cập nhật nội dung thường xuyên",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800/70">
                    <CheckCircle2 className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-300" />
                  </div>
                  <span className="font-medium leading-snug">{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-auto pt-1">
              <Link
                href={`${basePrefix}/register`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-6 py-3 text-sm font-semibold text-zinc-700 
                           shadow-sm transition-all hover:border-zinc-400 hover:bg-zinc-50
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2
                           dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-800 dark:focus-visible:ring-offset-zinc-950"
              >
                <Star className="h-4 w-4" />
                Bắt đầu với gói Free
              </Link>
            </div>
          </motion.article>
        </motion.div>

        {/* Bảng so sánh */}
        <motion.div
          className="mt-16 rounded-3xl border border-zinc-200/90 bg-zinc-50/80 p-6 shadow-sm ring-1 ring-zinc-100/80 
                     dark:border-zinc-800/80 dark:bg-zinc-900/95 dark:ring-zinc-900/80 sm:p-8"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
        >
          <div className="mb-6 flex flex-col gap-3 border-b border-zinc-200 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-sky-400">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <h4 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-white sm:text-lg">
                So sánh chi tiết giữa Free và Premium
              </h4>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Nhìn nhanh để xem gói nào phù hợp với nhu cầu luyện thi TOEIC của
              bạn.
            </p>
          </div>

          {/* Desktop table */}
          <div className="hidden gap-4 text-sm text-zinc-700 md:grid md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)] dark:text-zinc-300">
            <div className="pb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Tính năng
            </div>
            <div className="pb-2 text-center text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Free
            </div>
            <div className="pb-2 text-center text-xs font-semibold uppercase tracking-wide text-sky-600 dark:text-sky-400">
              Premium
            </div>

            {rows.map((r) => (
              <React.Fragment key={r.key}>
                <div className="flex items-center gap-2.5 border-t border-zinc-200 py-3 dark:border-zinc-800">
                  {r.icon}
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">
                    {r.label}
                  </span>
                </div>
                <div className="flex items-center justify-center border-t border-zinc-200 py-3 text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
                  {r.free}
                </div>
                <div className="flex items-center justify-center border-t border-zinc-200 py-3 font-semibold text-sky-700 dark:border-zinc-800 dark:text-sky-400">
                  {r.pro}
                </div>
              </React.Fragment>
            ))}
          </div>

          {/* Mobile list */}
          <div className="space-y-4 text-sm text-zinc-700 md:hidden dark:text-zinc-300">
            {rows.map((r) => (
              <div
                key={r.key}
                className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="mb-3 flex items-center gap-2.5">
                  {r.icon}
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {r.label}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-900/60">
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      Free
                    </p>
                    <div className="text-[13px] text-zinc-700 dark:text-zinc-300">
                      {r.free}
                    </div>
                  </div>
                  <div className="rounded-xl bg-sky-50 p-3 dark:bg-sky-900/40">
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-sky-600 dark:text-sky-300">
                      Premium
                    </p>
                    <div className="text-[13px] font-semibold text-sky-800 dark:text-sky-50">
                      {r.pro}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA cuối */}
        <motion.div
          className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <Link
            href={`${basePrefix}/practice`}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-6 py-3 text-sm font-semibold text-zinc-700 
                       shadow-sm transition-all hover:border-zinc-400 hover:bg-zinc-50
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2
                       dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-800 dark:focus-visible:ring-offset-zinc-950"
          >
            Khám phá bài luyện miễn phí
          </Link>
          <button
            type="button"
            onClick={handleUpgrade}
            disabled={isPremium || loading}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all disabled:opacity-60 ${
              isPremium
                ? "bg-gradient-to-r from-emerald-600 to-emerald-500"
                : "bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400"
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