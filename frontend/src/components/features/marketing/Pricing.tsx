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
  Download,
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
        icon: <Layers className="w-5 h-5" />,
        free: <>20 bài/tháng</>,
        pro: (
          <>
            <InfinityIcon className="inline w-5 h-5 mr-1 text-indigo-600 dark:text-indigo-400" />
            <span className="font-black text-indigo-700 dark:text-indigo-400">Không giới hạn</span>
          </>
        ),
      },
      {
        key: "fulltest",
        label: "Full Test & giải chi tiết",
        icon: <PlayCircle className="w-5 h-5" />,
        free: (
          <span className="inline-flex items-center gap-1.5 text-slate-500 dark:text-zinc-500">
            <XCircle className="w-5 h-5" /> Không hỗ trợ
          </span>
        ),
        pro: (
          <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" /> Có
          </span>
        ),
      },
      {
        key: "ai",
        label: "Chat với AI (gia sư TOEIC)",
        icon: <Bot className="w-5 h-5" />,
        free: (
          <span className="inline-flex items-center gap-1.5 text-slate-500 dark:text-zinc-500">
            <XCircle className="w-5 h-5" /> Bị khóa
          </span>
        ),
        pro: (
          <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" /> Mở khóa
          </span>
        ),
      },
      {
        key: "adminchat",
        label: "Chat với Admin/Giảng viên",
        icon: <MessageSquare className="w-5 h-5" />,
        free: (
          <span className="inline-flex items-center gap-1.5 text-slate-500 dark:text-zinc-500">
            <XCircle className="w-5 h-5" /> Bị khóa
          </span>
        ),
        pro: (
          <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" /> Mở khóa
          </span>
        ),
      },
      {
        key: "livestream",
        label: "Bình luận trong livestream",
        icon: <MessageCircle className="w-5 h-5" />,
        free: (
          <>
            Giới hạn <span className="text-slate-400 dark:text-zinc-500">(lượt/buổi)</span>
          </>
        ),
        pro: (
          <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" /> Không giới hạn
          </span>
        ),
      },
      {
        key: "download",
        label: "Tải file giảng viên gửi",
        icon: <Underline className="w-5 h-5" />,
        free: (
          <span className="inline-flex items-center gap-1.5 text-slate-500 dark:text-zinc-500">
            <XCircle className="w-5 h-5" /> Không hỗ trợ
          </span>
        ),
        pro: (
          <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" /> Có
          </span>
        ),
      },
      {
        key: "roadmap",
        label: "Lộ trình học cá nhân hoá",
        icon: <Sparkles className="w-5 h-5" />,
        free: (
          <>
            Bản cơ bản{" "}
            <span className="text-slate-400 dark:text-zinc-500">(theo level)</span>
          </>
        ),
        pro: (
          <>
            Bản nâng cao{" "}
            <span className="text-slate-400 dark:text-zinc-500">
              (theo tiến độ)
            </span>
          </>
        ),
      },
      {
        key: "analytics",
        label: "Phân tích lỗi & báo cáo",
        icon: <BarChart3 className="w-5 h-5" />,
        free: <>Báo cáo cơ bản</>,
        pro: <>Phân tích lỗi nâng cao</>,
      },
      {
        key: "support",
        label: "Hỗ trợ & ưu tiên",
        icon: <ShieldCheck className="w-5 h-5" />,
        free: <>Chuẩn</>,
        pro: <>Ưu tiên</>,
      },
    ],
    []
  );

  return (
    <section className="py-16 bg-gradient-to-b from-white via-indigo-50/20 to-white dark:from-zinc-900 dark:via-zinc-900/95 dark:to-zinc-900">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <SectionHeader
          eyebrow="Bảng giá"
          title="Chọn gói phù hợp"
          desc="Miễn phí để bắt đầu — nâng cấp để học nhanh hơn."
          align="center"
        />

        {/* Cards */}
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {/* Free */}
          <div className="group relative rounded-3xl bg-white/90 dark:bg-zinc-800/90 backdrop-blur-xl p-6 shadow-xl ring-2 ring-slate-200/60 dark:ring-zinc-700/60 transition-all duration-500 hover:shadow-2xl hover:ring-emerald-300 dark:hover:ring-emerald-600">
            {/* Glow */}
            <div className="absolute -inset-1 rounded-3xl" />

            <div className="relative z-10 flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900 dark:text-zinc-100">
                Miễn phí
              </h3>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg ring-2 ring-white/50">
                <Star className="h-5 w-5 text-white" />
              </div>
            </div>

            <div className="relative z-10 mt-3 text-4xl font-black text-slate-900 dark:text-zinc-100">
              0đ
              <span className="ml-1 text-sm font-bold text-slate-500 dark:text-zinc-400">
                /tháng
              </span>
            </div>

            <ul className="relative z-10 mt-6 space-y-3 text-sm text-slate-700 dark:text-zinc-300">
              {[
                "20 bài luyện/tháng",
                "Mini test từng Part",
                "Lộ trình cơ bản",
                "Báo cáo cơ bản",
                "Cập nhật hàng tuần",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2.5">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-md">
                    <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="font-medium">{item}</span>
                </li>
              ))}
            </ul>

            <Link
              href={`${basePrefix}/register`}
              className="relative z-10 mt-8 inline-flex w-full items-center justify-center gap-2.5 rounded-2xl border-2 border-emerald-500 bg-white dark:bg-zinc-800 px-5 py-3 text-sm font-black text-emerald-600 dark:text-emerald-400 shadow-lg transition-all hover:bg-emerald-50 dark:hover:bg-zinc-700"
            >
              Dùng thử
            </Link>
          </div>

          {/* Premium */}
          <div className="group relative rounded-3xl bg-gradient-to-br from-indigo-50/90 via-white to-indigo-50/80 dark:from-indigo-900/40 dark:via-zinc-800 dark:to-indigo-900/30 p-6 shadow-2xl ring-2 ring-indigo-300/70 dark:ring-indigo-600/70 transition-all duration-500 hover:shadow-3xl hover:ring-indigo-400 dark:hover:ring-indigo-500">
            {/* Glow */}
            <div className="absolute -inset-1 rounded-3xl" />

            <div className="absolute -top-3 left-6 flex items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-500 px-3 py-1 text-xs font-black text-white shadow-xl">
              <Zap className="h-3.5 w-3.5" />
              Phổ biến
            </div>
            {isPremium && (
              <div className="absolute -top-3 right-6 flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500 px-3 py-1 text-xs font-black text-white shadow-xl">
                <Crown className="h-3.5 w-3.5" />
                Đang dùng
              </div>
            )}

            <h3 className="relative z-10 text-lg font-black text-slate-900 dark:text-zinc-100">
              Premium
            </h3>

            <div className="relative z-10 mt-3 flex items-end gap-3">
              <div className="text-4xl font-black text-slate-900 dark:text-zinc-100">
                {promo ? (
                  <>
                    <span className="mr-2 text-xl line-through text-slate-400">
                      {Math.round(priceDisplay.base / 1000)}k
                    </span>
                    <span>{Math.round(priceDisplay.final / 1000)}k</span>
                  </>
                ) : (
                  <>129k</>
                )}
                <span className="ml-1 text-sm font-bold text-slate-500 dark:text-zinc-400">
                  /tháng
                </span>
              </div>

              {promo && (
                <div className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-400 px-2.5 py-1 text-[11px] font-black text-white shadow-md">
                  <BadgePercent className="h-3.5 w-3.5" />
                  {promo.code}
                </div>
              )}
            </div>

            {/* Promo */}
            <div className="relative z-10 mt-5 flex gap-3">
              <div className="relative flex-1">
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Mã khuyến mãi"
                  className="w-full rounded-xl border-2 border-indigo-300 bg-white/80 dark:bg-zinc-800/80 px-3.5 py-2.5 text-sm font-bold text-slate-700 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-400 dark:border-indigo-600 dark:text-zinc-200 dark:placeholder:text-zinc-500 backdrop-blur-sm transition-all"
                  disabled={!!promo || isPremium}
                />
                {promo && (
                  <button
                    onClick={clearCode}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-all"
                  >
                    <X className="h-4 w-4 text-slate-500" />
                  </button>
                )}
              </div>
              <button
                onClick={onApplyCode}
                disabled={!!promo || !code.trim() || checking || isPremium}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-5 py-2.5 text-sm font-black text-white shadow-lg hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-60 transition-all"
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
              <p className="relative z-10 mt-2 text-xs font-medium text-red-600 dark:text-red-400">
                {promoErr}
              </p>
            )}
            {promo && (
              <p className="relative z-10 mt-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                Giá sau giảm:{" "}
                <strong className="text-sm">
                  {Math.round(priceDisplay.final / 1000)}.000đ
                </strong>
              </p>
            )}

            {/* Features */}
            <ul className="relative z-10 mt-6 space-y-3 text-sm text-slate-700 dark:text-zinc-300">
              {[
                "Không giới hạn luyện đề",
                "Full Test & giải chi tiết",
                "Chat AI + Admin",
                "Tải file & phân tích lỗi",
                "Lộ trình nâng cao",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2.5">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-md">
                    <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="font-bold">{item}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={handleUpgrade}
              disabled={isPremium || loading}
              className={`relative z-10 mt-8 inline-flex w-full items-center justify-center gap-2.5 rounded-2xl px-5 py-3 text-sm font-black text-white shadow-xl transition-all disabled:opacity-60 overflow-hidden
                ${
                  isPremium
                    ? "bg-gradient-to-r from-emerald-600 to-emerald-500"
                    : "bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400"
                }`}
            >
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isPremium ? (
                <>
                  <Crown className="h-4 w-4" /> Đã nâng cấp
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Nâng cấp
                </>
              )}
            </button>

            <p className="relative z-10 mt-3 text-center text-xs font-medium text-slate-500 dark:text-zinc-400">
              Thanh toán qua{" "}
              <strong className="text-indigo-600 dark:text-indigo-400">
                PayOS
              </strong>
              . Huỷ bất kỳ lúc nào.
            </p>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="mt-12 rounded-3xl bg-white/90 dark:bg-zinc-800/90 backdrop-blur-xl p-6 shadow-2xl ring-2 ring-slate-200/60 dark:ring-zinc-700/60">
          <div className="flex items-center gap-3 border-b border-slate-200 dark:border-zinc-700 pb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <h4 className="text-lg font-black text-slate-900 dark:text-zinc-100">
              So sánh tính năng
            </h4>
          </div>
          <div className="mt-5 divide-y divide-slate-100 dark:divide-zinc-700">
            {rows.map((r) => (
              <div
                key={r.key}
                className="grid grid-cols-1 items-center gap-4 py-4 sm:grid-cols-3"
              >
                <div className="flex items-center gap-3 text-sm font-bold text-slate-800 dark:text-zinc-200">
                  {r.icon}
                  {r.label}
                </div>
                <div className="text-sm text-slate-600 dark:text-zinc-400">
                  {r.free}
                </div>
                <div className="text-sm font-black text-indigo-700 dark:text-indigo-400">
                  {r.pro}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href={`${basePrefix}/practice`}
            className="inline-flex items-center gap-2.5 rounded-2xl border-2 border-slate-300 bg-white dark:bg-zinc-800 px-7 py-3 text-sm font-black text-slate-800 dark:text-zinc-200 shadow-lg transition-all hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-zinc-700"
          >
            Khám phá miễn phí
          </Link>
          <button
            onClick={handleUpgrade}
            disabled={isPremium || loading}
            className={`inline-flex items-center gap-2.5 rounded-2xl px-7 py-3 text-sm font-black text-white shadow-xl transition-all disabled:opacity-60
              ${
                isPremium
                  ? "bg-gradient-to-r from-emerald-600 to-emerald-500"
                  : "bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400"
              }`}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Crown className="h-4 w-4" />
            )}
            {isPremium ? "Đang dùng" : "Nâng cấp"}
          </button>
        </div>
      </div>
    </section>
  );
}