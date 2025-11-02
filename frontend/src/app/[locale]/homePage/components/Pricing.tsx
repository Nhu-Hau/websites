"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SectionHeader from "./SectionHeader";
import { FiCheck } from "react-icons/fi";
import { apiBase, apiPost } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function Pricing() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    // Kiểm tra đăng nhập
    if (!user) {
      router.push("/auth/login");
      return;
    }

    // Kiểm tra đã là premium
    if (user.access === "premium") {
      alert("Bạn đã là thành viên Premium!");
      return;
    }

    setLoading(true);
    try {
      const response = await apiPost<{
        data: { checkoutUrl: string; qrCode?: string; orderCode: number };
      }>(`${apiBase()}/api/payments/create`);

      if (response.data?.checkoutUrl) {
        // Chuyển hướng đến trang thanh toán PayOS
        window.location.href = response.data.checkoutUrl;
      } else {
        throw new Error("Không thể tạo link thanh toán");
      }
    } catch (error: any) {
      console.error("Error creating payment:", error);
      alert(error.message || "Có lỗi xảy ra khi tạo link thanh toán");
    } finally {
      setLoading(false);
    }
  };

  const tiers = [
    {
      name: "Miễn phí",
      price: "0đ",
      features: ["20 bài luyện/tháng", "Mini test", "Báo cáo cơ bản"],
      cta: "Dùng thử",
      href: "/auth/register",
      popular: false,
      onClick: undefined,
    },
    {
      name: "Pro",
      price: "129k",
      features: [
        "Không giới hạn luyện đề",
        "Full Test & giải chi tiết",
        "Phân tích lỗi nâng cao",
        "Lộ trình cá nhân hoá",
      ],
      cta: loading ? "Đang xử lý..." : user?.access === "premium" ? "Đã nâng cấp" : "Nâng cấp",
      href: "#",
      popular: true,
      onClick: handleUpgrade,
      disabled: user?.access === "premium" || loading,
    },
  ];
  return (
    <section id="pricing" className="bg-white py-10 dark:bg-zinc-800">
      <div className="mx-auto max-w-sm sm:max-w-3xl px-4 sm:px-6">
        <SectionHeader
          eyebrow="Bảng giá"
          title="Chọn gói phù hợp với mục tiêu"
          desc="Bắt đầu miễn phí và nâng cấp khi cần."
        />
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={`relative rounded-2xl border p-6 ${
                t.popular
                  ? "border-sky-300 bg-sky-50/50 shadow-md dark:border-sky-500 dark:bg-zinc-900/50"
                  : "border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-900/30"
              }`}
            >
              {t.popular && (
                <span className="absolute -top-3 left-6 rounded-full bg-sky-600 px-3 py-1 text-xs font-semibold text-white">
                  Phổ biến
                </span>
              )}
              <h3 className="text-base font-semibold text-slate-900 dark:text-zinc-100">
                {t.name}
              </h3>
              <div className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-zinc-100">
                {t.price}
                <span className="text-sm font-normal text-slate-500 dark:text-zinc-400">
                  /tháng
                </span>
              </div>
              <ul className="mt-5 space-y-2 text-sm text-slate-700 dark:text-zinc-300">
                {t.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <FiCheck className="text-emerald-600 dark:text-emerald-500" /> {f}
                  </li>
                ))}
              </ul>
              {t.onClick ? (
                <button
                  onClick={t.onClick}
                  disabled={t.disabled}
                  className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${
                    t.popular
                      ? "bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                      : "border border-slate-300 text-slate-800 hover:bg-slate-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-700"
                  }`}
                >
                  {t.cta}
                </button>
              ) : (
                <Link
                  href={t.href}
                  className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    t.popular
                      ? "bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                      : "border border-slate-300 text-slate-800 hover:bg-slate-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-700"
                  }`}
                >
                  {t.cta}
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}