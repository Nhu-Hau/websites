// app/forgot-password/page.tsx
"use client";

import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") || "");
    if (!email) return;

    setLoading(true);
    try {
      // TODO: gọi API gửi email đặt lại mật khẩu của bạn
      // await fetch("/api/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) })
      await new Promise((r) => setTimeout(r, 700));
      setSent(true); // Không tiết lộ email có tồn tại hay không
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[750px] grid place-items-center">
      <div className="w-full max-w-xs xs:max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Quên mật khẩu</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Nhập email. Nếu khớp, bạn sẽ nhận được liên kết đặt lại mật khẩu.
        </p>

        {sent ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-lg border border-zinc-300/60 dark:border-zinc-700/60 bg-zinc-50 dark:bg-zinc-800/40 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200">
              Nếu email tồn tại, liên kết đặt lại đã được gửi.
              Kiểm tra hộp thư hoặc thư mục spam.
            </div>
            <div className="flex items-center justify-between text-sm">
              <Link href="/login" className="underline underline-offset-2 hover:no-underline">
                Quay lại đăng nhập
              </Link>
              <button
                type="button"
                onClick={() => setSent(false)}
                className="underline underline-offset-2 hover:no-underline"
              >
                Gửi lại
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm mb-1">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-50/10"
                placeholder="Nhập địa chỉ email của bạn"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl px-4 py-2 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 disabled:opacity-60"
            >
              {loading ? "Đang gửi..." : "Gửi yêu cầu"}
            </button>

            <div className="flex items-center justify-between text-sm">
              <Link href="/auth/login" className="underline underline-offset-2 hover:no-underline">
                Quay lại đăng nhập
              </Link>
              <Link href="/auth/register" className="underline underline-offset-2 hover:no-underline">
                Tạo tài khoản
              </Link>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
