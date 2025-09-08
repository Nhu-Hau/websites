/* eslint-disable @typescript-eslint/no-explicit-any */
// app/[locale]/auth/forgot-password/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

import AuthLayout from "@/components/auth/AuthLayout";
import PasswordField from "@/components/auth/PasswordField";
import { usePasswordToggle } from "@/hooks/usePasswordToggle";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const newPw = usePasswordToggle(false);
  const confirmPw = usePasswordToggle(false);

  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);

  // Step 1
  const [email, setEmail] = useState("");
  const [cooldown, setCooldown] = useState(0);

  // Step 2
  const [code, setCode] = useState("");
  const [pw, setPw] = useState("");
  const [cpw, setCpw] = useState("");

  // simple cooldown timer for resend
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const canResend = useMemo(() => cooldown === 0, [cooldown]);

  async function sendCode(e?: React.FormEvent) {
    e?.preventDefault();
    if (!email) return toast.error("Vui lòng nhập email");

    setLoading(true);
    try {
      // This endpoint should trigger an email with either a reset code OR a reset link.
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/forgot-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        // If your backend sends code: we advance to step 2.
        // If your backend sends a link: user can click the link from email; we still allow code entry below if supported.
        toast.success(
          data.message ||
            "Nếu email tồn tại, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu."
        );
        setStep(2);
        setCooldown(60); // 60s cooldown for resend
      } else {
        toast.error(data.message || "Không thể gửi email. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function onResetWithCode(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return toast.error("Thiếu email");
    if (!code || code.length < 4)
      return toast.error("Mã xác nhận không hợp lệ");
    if (pw.length < 8) return toast.error("Mật khẩu phải có ít nhất 8 ký tự");
    if (pw !== cpw) return toast.error("Mật khẩu không khớp");

    setLoading(true);
    try {
      // Preferred: backend supports code-based reset
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/reset-password-code`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, code, password: pw }),
        }
      );

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success(data.message || "Đặt lại mật khẩu thành công");
        router.push("/auth/login");
        return;
      }

      // Fallback if code-based API not available:
      // Tell user to use the reset link that was emailed.
      toast.error(
        data.message ||
          "Không thể xác nhận mã. Nếu bạn đã nhận email chứa LIÊN KẾT đặt lại mật khẩu, vui lòng bấm vào liên kết đó để hoàn tất."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Quên mật khẩu"
      subtitle={
        step === 1
          ? "Nhập email để nhận mã xác nhận (hoặc liên kết) đặt lại mật khẩu."
          : "Nhập mã xác nhận và mật khẩu mới."
      }
    >
      {step === 1 ? (
        <form onSubmit={sendCode} className="mt-6 space-y-4" noValidate>
          <div>
            <label
              htmlFor="email"
              className="block text-sm mb-1 text-zinc-700 dark:text-zinc-300"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 outline-none
                       focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-50/10
                       text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400"
              placeholder="Nhập địa chỉ email của bạn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl px-4 py-2 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 disabled:opacity-60"
          >
            {loading ? "Đang gửi..." : "Gửi mã/ liên kết đặt lại"}
          </button>

          <div className="flex items-center justify-between text-sm mt-2">
            <span />
            <Link
              href="/auth/login"
              className="underline underline-offset-2 hover:no-underline text-sky-600 dark:text-sky-400"
            >
              Quay lại đăng nhập
            </Link>
          </div>

          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            Sau khi gửi, vui lòng kiểm tra hộp thư (và cả mục Spam/Quảng cáo).
          </div>
        </form>
      ) : (
        <form onSubmit={onResetWithCode} className="mt-6 space-y-4" noValidate>
          <div>
            <label className="block text-sm mb-1 text-zinc-700 dark:text-zinc-300">
              Email
            </label>
            <input
              type="email"
              disabled
              value={email}
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 px-3 py-2 text-base sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm mb-1 text-zinc-700 dark:text-zinc-300">
              Mã xác nhận
            </label>
            <input
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="Nhập mã 4–6 số"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 outline-none
                       focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-50/10
                       text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400"
            />
            <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              Không nhận được mã?
              <button
                type="button"
                disabled={!canResend || loading}
                onClick={sendCode}
                className="ml-1 underline underline-offset-2 disabled:no-underline disabled:opacity-50"
                aria-disabled={!canResend || loading}
              >
                {canResend ? "Gửi lại" : `Gửi lại sau ${cooldown}s`}
              </button>
            </div>
          </div>

          <PasswordField
            id="password"
            name="password"
            label="Mật khẩu mới"
            placeholder={"Nhập mật khẩu của bạn"}
            className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 outline-none
                         focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-50/10
                         text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400"
            autoComplete="new-password"
            minLength={8}
            show={newPw.show}
            onToggle={newPw.toggle}
            onChange={(e: any) => setPw(e.target.value)}
            aria-invalid={false}
          />

          <PasswordField
            id="confirm"
            name="confirm"
            label="Xác nhận mật khẩu"
            placeholder={"Nhập lại mật khẩu"}
            className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 outline-none
                         focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-50/10
                         text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400"
            autoComplete="new-password"
            minLength={8}
            show={confirmPw.show}
            onToggle={confirmPw.toggle}
            onChange={(e: any) => setCpw(e.target.value)}
            aria-invalid={false}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl px-4 py-2 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 disabled:opacity-60"
          >
            {loading ? "Đang đổi mật khẩu..." : "Đổi mật khẩu"}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
