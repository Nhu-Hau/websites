"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Loader2 } from "lucide-react";
import { apiBase, apiGet } from "@/lib/api/client";
import { useAuth } from "@/context/AuthContext";

export default function PaymentSuccess() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useAuth();

  const orderCode = searchParams.get("orderCode");

  const calledRef = useRef(false);          // chặn gọi lặp verify
  const intervalRef = useRef<NodeJS.Timeout | null>(null); // giữ id interval

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [seconds, setSeconds] = useState(5);

  // Prefetch trang đích để chuyển nhanh hơn
  useEffect(() => {
    router.prefetch("/homePage");
  }, [router]);

  // Verify thanh toán (một lần)
  useEffect(() => {
    if (!orderCode) {
      setLoading(false);
      setSuccess(false);
      return;
    }
    if (calledRef.current) return;
    calledRef.current = true;

    (async () => {
      try {
        const res = await apiGet<{ data: { status: string } }>(
          `${apiBase()}/api/payments/status/${orderCode}`
        );
        if (res.data?.status?.toLowerCase() === "paid") {
          setSuccess(true);
          await refresh(); // cập nhật user access
        } else {
          setSuccess(false);
        }
      } catch (err) {
        console.error("Payment check failed:", err);
        setSuccess(false);
      } finally {
        setLoading(false);
      }
    })();
  }, [orderCode, refresh]);

  // Nếu success: bắt đầu đếm ngược 5s
  useEffect(() => {
    if (!success) return;
    setSeconds(5);
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setSeconds((s) => (s > 0 ? s - 1 : 0));
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [success]);

  // Khi seconds == 0 thì điều hướng (KHÔNG gọi router.push trong setState)
  useEffect(() => {
    if (success && seconds === 0) {
      router.push("/homePage");
    }
  }, [success, seconds, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-zinc-900">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-sky-600" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Đang xác thực thanh toán...
          </p>
        </div>
      </div>
    );
  }

  if (success) {
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
            Hệ thống sẽ tự chuyển về trang chủ sau{" "}
            <span className="font-semibold">{seconds}</span> giây…
          </p>

          <div className="mt-6">
            <Link
              href="/homePage"
              className="inline-block w-full rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              Quay về trang chủ ngay
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Trạng thái lỗi
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
        <div className="mt-6">
          <Link
            href="/homePage"
            className="inline-block w-full rounded-lg bg-sky-600 px-4 py-2 font-semibold text-white transition hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600"
          >
            Quay lại trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}