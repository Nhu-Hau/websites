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
      router.push(`${basePrefix}/auth/login`);
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
      router.push(`${basePrefix}/auth/login`);
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
            <InfinityIcon className="inline w-4 h-4 mr-1 -mt-0.5" />
            Không giới hạn
          </>
        ),
      },
      {
        key: "fulltest",
        label: "Full Test & giải chi tiết",
        icon: <PlayCircle className="w-4 h-4" />,
        free: (
          <span className="inline-flex items-center gap-1 text-zinc-500">
            <XCircle className="w-4 h-4" /> Không hỗ trợ
          </span>
        ),
        pro: (
          <span className="inline-flex items-center gap-1 text-emerald-600">
            <CheckCircle2 className="w-4 h-4" /> Có
          </span>
        ),
      },
      {
        key: "ai",
        label: "Chat với AI (gia sư TOEIC)",
        icon: <Bot className="w-4 h-4" />,
        free: (
          <span className="inline-flex items-center gap-1 text-zinc-500">
            <XCircle className="w-4 h-4" /> Bị khóa
          </span>
        ),
        pro: (
          <span className="inline-flex items-center gap-1 text-emerald-600">
            <CheckCircle2 className="w-4 h-4" /> Mở khóa
          </span>
        ),
      },
      {
        key: "adminchat",
        label: "Chat với Admin/Giảng viên",
        icon: <MessageSquare className="w-4 h-4" />,
        free: (
          <span className="inline-flex items-center gap-1 text-zinc-500">
            <XCircle className="w-4 h-4" /> Bị khóa
          </span>
        ),
        pro: (
          <span className="inline-flex items-center gap-1 text-emerald-600">
            <CheckCircle2 className="w-4 h-4" /> Mở khóa
          </span>
        ),
      },
      {
        key: "livestream",
        label: "Bình luận trong livestream/phòng học",
        icon: <MessageCircle className="w-4 h-4" />,
        free: (
          <>
            Giới hạn <span className="text-zinc-400">(số lượt/buổi)</span>
          </>
        ),
        pro: (
          <span className="inline-flex items-center gap-1 text-emerald-600">
            <CheckCircle2 className="w-4 h-4" /> Không giới hạn
          </span>
        ),
      },
      {
        key: "download",
        label: "Tải file giảng viên gửi",
        icon: <Download className="w-4 h-4" />,
        free: (
          <span className="inline-flex items-center gap-1 text-zinc-500">
            <XCircle className="w-4 h-4" /> Không hỗ trợ
          </span>
        ),
        pro: (
          <span className="inline-flex items-center gap-1 text-emerald-600">
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
            <span className="text-zinc-400">(gợi ý theo level/part)</span>
          </>
        ),
        pro: (
          <>
            Bản nâng cao{" "}
            <span className="text-zinc-400">
              (điều chỉnh theo kết quả Practice/Progress)
            </span>
          </>
        ),
      },
      {
        key: "analytics",
        label: "Phân tích lỗi & báo cáo",
        icon: <BarChart3 className="w-4 h-4" />,
        free: <>Báo cáo cơ bản</>,
        pro: <>Phân tích lỗi nâng cao - Theo dõi tiến bộ</>,
      },
      {
        key: "support",
        label: "Hỗ trợ & ưu tiên",
        icon: <ShieldCheck className="w-4 h-4" />,
        free: <>Chuẩn</>,
        pro: <>Ưu tiên - Nhanh hơn</>,
      },
    ],
    []
  );

  return (
    <section className="py-12 bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-900 dark:to-zinc-950">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <SectionHeader
          eyebrow="Bảng giá"
          title="Chọn gói phù hợp với mục tiêu TOEIC"
          desc="Bắt đầu miễn phí — nâng cấp khi cần để mở khoá toàn bộ tính năng học thông minh."
        />

        {/* Cards trên cùng */}
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {/* Free */}
          <div className="relative rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/70 shadow-sm hover:shadow-md transition-all">
            <div className="p-6">
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Miễn phí
              </h3>
              <div className="mt-3 text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
                0đ
                <span className="text-sm font-normal text-zinc-500 dark:text-zinc-400">
                  /tháng
                </span>
              </div>

              <ul className="mt-5 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="text-emerald-600 w-4 h-4" />
                  20 bài luyện/tháng
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="text-emerald-600 w-4 h-4" />
                  Mini test theo từng Part (miễn phí)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="text-emerald-600 w-4 h-4" />
                  Lộ trình cá nhân hoá (cơ bản)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="text-emerald-600 w-4 h-4" />
                  Báo cáo cơ bản
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="text-emerald-600 w-4 h-4" />
                  Cập nhật tính năng và đề luyện mới hàng tuần
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="text-emerald-600 w-4 h-4" />
                  Thống kê tiến bộ cá nhân theo từng Part
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="text-emerald-600 w-4 h-4" />
                  Trải nghiệm giao diện thân thiện – dễ sử dụng
                </li>
              </ul>

              <Link
                href={`${basePrefix}/auth/register`}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold border border-zinc-300 text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800 transition"
              >
                Dùng thử
              </Link>
            </div>
          </div>

          {/* Pro / Premium */}
          <div className="relative rounded-2xl border border-sky-300 bg-sky-50/60 shadow-md dark:border-sky-500 dark:bg-zinc-900/60 transition-all hover:shadow-lg">
            <span className="absolute -top-3 left-6 rounded-full bg-sky-600 px-3 py-1 text-xs font-semibold text-white">
              Phổ biến
            </span>

            {isPremium && (
              <span className="absolute -top-3 right-6 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
                <Crown className="w-3.5 h-3.5" /> Đang là Premium
              </span>
            )}

            <div className="p-6">
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Premium
              </h3>

              {/* Giá + promo hiển thị */}
              <div className="mt-3 flex items-end gap-3">
                <div className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
                  {promo ? (
                    <>
                      <span className="line-through text-zinc-400 mr-2">
                        {Math.round(priceDisplay.base / 1000)}k
                      </span>
                      <span>{Math.round(priceDisplay.final / 1000)}k</span>
                    </>
                  ) : (
                    <>129k</>
                  )}
                  <span className="text-sm font-normal text-zinc-600 dark:text-zinc-400">
                    /tháng
                  </span>
                </div>

                {promo && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                    <BadgePercent className="w-3.5 h-3.5" />
                    Đã áp dụng {promo.code}
                  </span>
                )}
              </div>

              {/* Ô nhập mã khuyến mãi */}
              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="Nhập mã khuyến mãi"
                    className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-400"
                    disabled={!!promo || isPremium}
                  />
                  {promo && (
                    <button
                      onClick={clearCode}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      aria-label="Xoá mã"
                    >
                      <X className="w-4 h-4 text-zinc-500" />
                    </button>
                  )}
                </div>
                <button
                  onClick={onApplyCode}
                  disabled={!!promo || !code.trim() || checking || isPremium}
                  className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold bg-sky-600 text-white hover:bg-sky-500 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {checking ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang kiểm tra
                    </>
                  ) : (
                    <>
                      <BadgePercent className="w-4 h-4" />
                      Áp dụng
                    </>
                  )}
                </button>
              </div>
              {promoErr && (
                <p className="mt-1 text-xs text-red-600">{promoErr}</p>
              )}
              {promo && (
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Giá sau giảm:{" "}
                  <strong>{Math.round(priceDisplay.final / 1000)}.000đ</strong>
                </p>
              )}

              {/* Tính năng */}
              <ul className="mt-5 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="text-emerald-600 w-4 h-4" />
                  Không giới hạn luyện đề
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="text-emerald-600 w-4 h-4" />
                  Full Test & giải chi tiết
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="text-emerald-600 w-4 h-4" />
                  Chat với AI & Admin, bình luận livestream không giới hạn
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="text-emerald-600 w-4 h-4" />
                  Tải file giảng viên - Phân tích lỗi nâng cao
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="text-emerald-600 w-4 h-4" />
                  Lộ trình cá nhân hoá nâng cao
                </li>
              </ul>

              {/* CTA nâng cấp */}
              <button
                onClick={handleUpgrade}
                disabled={isPremium || loading}
                className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed
                  ${
                    isPremium
                      ? "bg-emerald-600 text-white"
                      : "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                  }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Đang xử lý…
                  </>
                ) : isPremium ? (
                  <>
                    <Crown className="w-4 h-4" /> Đã nâng cấp
                  </>
                ) : (
                  "Nâng cấp"
                )}
              </button>

              <p className="mt-3 text-[12px] text-zinc-500 dark:text-zinc-400">
                Thanh toán bảo mật qua PayOS. Có thể huỷ bất cứ lúc nào.
              </p>
            </div>
          </div>
        </div>

        {/* Bảng so sánh chi tiết */}
        <div className="mt-10 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/70 shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h4 className="text-sm font-semibold">
              So sánh chi tiết tính năng
            </h4>
          </div>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {rows.map((r) => (
              <div
                key={r.key}
                className="px-4 sm:px-6 py-4 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center"
              >
                <div className="text-sm font-medium text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                  {r.icon}
                  {r.label}
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-300">
                  {r.free}
                </div>
                <div className="text-sm text-zinc-900 dark:text-zinc-100 font-semibold">
                  {r.pro}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA dưới cùng */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href={`${basePrefix}/practice`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
            >
              Khám phá bài luyện miễn phí
            </Link>
            <button
              onClick={handleUpgrade}
              disabled={isPremium || loading}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition
                ${
                  isPremium
                    ? "bg-emerald-600 text-white"
                    : "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                } disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Crown className="w-4 h-4" />
              )}
              {isPremium ? "Bạn đang là Premium" : "Nâng cấp Premium"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
