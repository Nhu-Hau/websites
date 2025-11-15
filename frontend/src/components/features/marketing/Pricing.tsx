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
        icon: <Layers className="w-4 h-4" />,
        free: <>20 bài/tháng</>,
        pro: (
          <>
            <InfinityIcon className="inline w-4 h-4 mr-1 text-indigo-600 dark:text-indigo-400" />
            <span className="font-semibold text-indigo-700 dark:text-indigo-400">Không giới hạn</span>
          </>
        ),
      },
      {
        key: "fulltest",
        label: "Full Test & giải chi tiết",
        icon: <PlayCircle className="w-4 h-4" />,
        free: (
          <span className="inline-flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
            <XCircle className="w-4 h-4" /> Không hỗ trợ
          </span>
        ),
        pro: (
          <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4" /> Có
          </span>
        ),
      },
      {
        key: "ai",
        label: "Chat với AI (gia sư TOEIC)",
        icon: <Bot className="w-4 h-4" />,
        free: (
          <span className="inline-flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
            <XCircle className="w-4 h-4" /> Bị khóa
          </span>
        ),
        pro: (
          <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4" /> Mở khóa
          </span>
        ),
      },
      {
        key: "adminchat",
        label: "Chat với Admin/Giảng viên",
        icon: <MessageSquare className="w-4 h-4" />,
        free: (
          <span className="inline-flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
            <XCircle className="w-4 h-4" /> Bị khóa
          </span>
        ),
        pro: (
          <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4" /> Mở khóa
          </span>
        ),
      },
      {
        key: "livestream",
        label: "Bình luận trong livestream",
        icon: <MessageCircle className="w-4 h-4" />,
        free: (
          <>
            Giới hạn <span className="text-zinc-400 dark:text-zinc-500">(lượt/buổi)</span>
          </>
        ),
        pro: (
          <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4" /> Không giới hạn
          </span>
        ),
      },
      {
        key: "download",
        label: "Tải file giảng viên gửi",
        icon: <Underline className="w-4 h-4" />,
        free: (
          <span className="inline-flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
            <XCircle className="w-4 h-4" /> Không hỗ trợ
          </span>
        ),
        pro: (
          <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4" /> Có
          </span>
        ),
      },
      {
        key: "roadmap",
        label: "Lộ trình học cá nhân hoá",
        icon: <Sparkles className="w-4 h-4" />,
        free: (
          <>
            Bản cơ bản{" "}
            <span className="text-zinc-400 dark:text-zinc-500">(theo level)</span>
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
        icon: <BarChart3 className="w-4 h-4" />,
        free: <>Báo cáo cơ bản</>,
        pro: <>Phân tích lỗi nâng cao</>,
      },
      {
        key: "support",
        label: "Hỗ trợ & ưu tiên",
        icon: <ShieldCheck className="w-4 h-4" />,
        free: <>Chuẩn</>,
        pro: <>Ưu tiên</>,
      },
    ],
    []
  );

  return (
    <section className="bg-white dark:bg-zinc-950 py-20 sm:py-24 border-y border-zinc-200 dark:border-zinc-900">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <SectionHeader
          eyebrow="Bảng giá"
          title="Chọn gói phù hợp"
          desc="Miễn phí để bắt đầu — nâng cấp để học nhanh hơn."
          align="center"
        />

        {/* Cards */}
        <div className="mt-16 grid gap-8 sm:grid-cols-2">
          {/* Free */}
          <div className="relative rounded-2xl bg-white dark:bg-zinc-900 p-8 shadow-sm border border-zinc-200 dark:border-zinc-800 transition-all duration-300 hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                Miễn phí
              </h3>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600">
                <Star className="h-5 w-5 text-white" />
              </div>
            </div>

            <div className="mb-8">
              <div className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">
                0đ
                <span className="ml-2 text-base font-normal text-zinc-500 dark:text-zinc-400">
                  /tháng
                </span>
              </div>
            </div>

            <ul className="mb-8 space-y-3 text-sm text-zinc-700 dark:text-zinc-300">
              {[
                "20 bài luyện/tháng",
                "Mini test từng Part",
                "Lộ trình cơ bản",
                "Báo cáo cơ bản",
                "Cập nhật hàng tuần",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/50">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="font-medium">{item}</span>
                </li>
              ))}
            </ul>

            <Link
              href={`${basePrefix}/register`}
              className="block w-full rounded-xl border-2 border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-6 py-3 text-center text-sm font-semibold text-zinc-700 dark:text-zinc-300 transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600"
            >
              Dùng thử
            </Link>
          </div>

          {/* Premium */}
          <div className="relative rounded-2xl bg-gradient-to-br from-indigo-50 via-white to-indigo-50/50 dark:from-indigo-950/30 dark:via-zinc-900 dark:to-indigo-950/20 p-8 shadow-md border-2 border-indigo-200 dark:border-indigo-900 transition-all duration-300 hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-800">
            {!isPremium && (
              <div className="absolute -top-3 left-6 flex items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-500 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                <Zap className="h-3.5 w-3.5" />
                Phổ biến
              </div>
            )}
            {isPremium && (
              <div className="absolute -top-3 right-6 flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                <Crown className="h-3.5 w-3.5" />
                Đang dùng
              </div>
            )}

            <h3 className="mb-6 text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">
              Premium
            </h3>

            <div className="mb-6">
              <div className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">
                {promo ? (
                  <>
                    <span className="mr-2 text-xl line-through text-zinc-400 dark:text-zinc-500">
                      {Math.round(priceDisplay.base / 1000)}k
                    </span>
                    <span>{Math.round(priceDisplay.final / 1000)}k</span>
                  </>
                ) : (
                  <>129k</>
                )}
                <span className="ml-2 text-base font-normal text-zinc-500 dark:text-zinc-400">
                  /tháng
                </span>
              </div>
              {promo && (
                <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-100 dark:bg-amber-950/50 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
                  <BadgePercent className="h-3.5 w-3.5" />
                  {promo.code}
                </div>
              )}
            </div>

            {/* Promo */}
            <div className="mb-6 flex gap-2">
              <div className="relative flex-1">
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Mã khuyến mãi"
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-700 placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:text-zinc-200 dark:placeholder:text-zinc-500 transition-all"
                  disabled={!!promo || isPremium}
                />
                {promo && (
                  <button
                    onClick={clearCode}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <X className="h-4 w-4 text-zinc-500" />
                  </button>
                )}
              </div>
              <button
                onClick={onApplyCode}
                disabled={!!promo || !code.trim() || checking || isPremium}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-60 transition-all"
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
              <p className="mb-4 text-xs font-medium text-red-600 dark:text-red-400">
                {promoErr}
              </p>
            )}
            {promo && (
              <p className="mb-4 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                Giá sau giảm:{" "}
                <strong className="text-sm">
                  {Math.round(priceDisplay.final / 1000)}.000đ
                </strong>
              </p>
            )}

            {/* Features */}
            <ul className="mb-8 space-y-3 text-sm text-zinc-700 dark:text-zinc-300">
              {[
                "Không giới hạn luyện đề",
                "Full Test & giải chi tiết",
                "Chat AI + Admin",
                "Tải file & phân tích lỗi",
                "Lộ trình nâng cao",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-950/50">
                    <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <span className="font-semibold">{item}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={handleUpgrade}
              disabled={isPremium || loading}
              className={`block w-full rounded-xl px-6 py-3 text-center text-sm font-semibold text-white shadow-sm transition-all disabled:opacity-60 ${
                isPremium
                  ? "bg-gradient-to-r from-emerald-600 to-emerald-500"
                  : "bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400"
              }`}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang xử lý...
                </span>
              ) : isPremium ? (
                <span className="inline-flex items-center gap-2">
                  <Crown className="h-4 w-4" /> Đã nâng cấp
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <Sparkles className="h-4 w-4" /> Nâng cấp
                </span>
              )}
            </button>

            <p className="mt-4 text-center text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Thanh toán qua{" "}
              <strong className="text-indigo-600 dark:text-indigo-400">
                PayOS
              </strong>
              . Huỷ bất kỳ lúc nào.
            </p>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="mt-16 rounded-2xl bg-zinc-50 dark:bg-zinc-900 p-8 shadow-sm border border-zinc-200 dark:border-zinc-800">
          <div className="mb-6 flex items-center gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-500">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <h4 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-white">
              So sánh tính năng
            </h4>
          </div>
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {rows.map((r) => (
              <div
                key={r.key}
                className="grid grid-cols-1 items-center gap-4 py-4 sm:grid-cols-3"
              >
                <div className="flex items-center gap-3 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  {r.icon}
                  {r.label}
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400 sm:text-left">
                  {r.free}
                </div>
                <div className="text-sm font-semibold text-indigo-700 dark:text-indigo-400 sm:text-left">
                  {r.pro}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href={`${basePrefix}/practice`}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-6 py-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300 transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600"
          >
            Khám phá miễn phí
          </Link>
          <button
            onClick={handleUpgrade}
            disabled={isPremium || loading}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all disabled:opacity-60 ${
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