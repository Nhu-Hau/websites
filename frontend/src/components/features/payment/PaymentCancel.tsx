"use client";

import React from "react";
import Link from "next/link";
import { XCircle } from "lucide-react";

export default function PaymentCancel() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 dark:bg-zinc-900">
      <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
        <XCircle className="mx-auto h-16 w-16 text-amber-600 dark:text-amber-500" />
        <h1 className="mt-4 text-2xl font-bold text-slate-900 dark:text-zinc-100">
          Thanh toán đã bị hủy
        </h1>
        <p className="mt-2 text-slate-600 dark:text-zinc-400">
          Bạn đã hủy quá trình thanh toán. Bạn có thể thử lại bất cứ lúc nào.
        </p>
        <div className="mt-6 space-y-3">
          <Link
            href="/#pricing"
            className="inline-block w-full rounded-lg bg-sky-600 px-4 py-2 font-semibold text-white transition hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600"
          >
            Thử lại thanh toán
          </Link>
          <Link
            href="/homePage"
            className="inline-block w-full rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}