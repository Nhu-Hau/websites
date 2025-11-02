"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Loader2 } from "lucide-react";
import { apiBase, apiGet } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useAuth();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"success" | "checking" | "error">("checking");
  const orderCode = searchParams.get("orderCode");

  useEffect(() => {
    if (!orderCode) {
      setStatus("error");
      setLoading(false);
      return;
    }

    // Kiểm tra trạng thái payment
    const checkPayment = async () => {
      try {
        const response = await apiGet<{
          data: {
            status: string;
            orderCode: number;
            amount: number;
            paidAt?: string;
          };
        }>(`${apiBase()}/api/payments/status/${orderCode}`);

        if (response.data?.status === "paid") {
          setStatus("success");
          // Refresh user data để cập nhật access level
          await refresh();
        } else {
          setStatus("error");
        }
      } catch (error) {
        console.error("Error checking payment:", error);
        setStatus("error");
      } finally {
        setLoading(false);
      }
    };

    checkPayment();
  }, [orderCode, refresh]);

  if (loading || status === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-zinc-900">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-sky-600" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Đang xác thực thanh toán...</p>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-4 dark:bg-zinc-900">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
          <CheckCircle className="mx-auto h-16 w-16 text-emerald-600 dark:text-emerald-500" />
          <h1 className="mt-4 text-2xl font-bold text-slate-900 dark:text-zinc-100">
            Thanh toán thành công!
          </h1>
          <p className="mt-2 text-slate-600 dark:text-zinc-400">
            Chúc mừng! Bạn đã nâng cấp lên gói Pro thành công.
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-zinc-500">
            Bạn có thể sử dụng tất cả tính năng Premium ngay bây giờ.
          </p>
          <div className="mt-6 space-y-3">
            <Link
              href="/dashboard"
              className="inline-block w-full rounded-lg bg-sky-600 px-4 py-2 font-semibold text-white transition hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600"
            >
              Đi đến Dashboard
            </Link>
            <Link
              href="/"
              className="inline-block w-full rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 dark:bg-zinc-900">
      <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
        <div className="mx-auto h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/20">
          <span className="flex h-full items-center justify-center text-2xl">⚠️</span>
        </div>
        <h1 className="mt-4 text-2xl font-bold text-slate-900 dark:text-zinc-100">
          Không thể xác thực thanh toán
        </h1>
        <p className="mt-2 text-slate-600 dark:text-zinc-400">
          Vui lòng liên hệ hỗ trợ nếu bạn đã thanh toán thành công.
        </p>
        <div className="mt-6 space-y-3">
          <Link
            href="/account"
            className="inline-block w-full rounded-lg bg-sky-600 px-4 py-2 font-semibold text-white transition hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600"
          >
            Đi đến Tài khoản
          </Link>
          <Link
            href="/"
            className="inline-block w-full rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}

