"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

import AuthLayout from "@/components/auth/AuthLayout";
import GoogleButton from "@/components/auth/GoogleButton";
import FieldError from "@/components/auth/FieldError";
import PasswordField from "@/components/auth/PasswordField";
import { usePasswordToggle } from "@/hooks/usePasswordToggle";
import { useAuthSubmit } from "@/hooks/useAuthSubmit";
import { useBasePrefix } from "@/hooks/useBasePrefix";

const RESEND_COOLDOWN = 30; // giây
const RESEND_STORAGE_KEY = "auth:resend:expiresAt";

export default function RegisterForm() {
  const t = useTranslations("register");
  const basePrefix = useBasePrefix();
  const router = useRouter();
  const [gLoading, setGLoading] = useState(false);
  const { login } = useAuth();

  const pw = usePasswordToggle(false);
  const cpw = usePasswordToggle(false);

  const { onSubmit, loading, errors, setErrors } = useAuthSubmit({
    kind: "register",
    url: `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/register`,
    t,
    onSuccess: (data) => {
      toast.success(t("success"));
      if (data.user) login(data.user);
      router.push(`${basePrefix}/homePage`);
    },
  });

  // ====== STATE cho gửi mã xác thực ======
  const [sendingCode, setSendingCode] = useState(false);
  const [cooldown, setCooldown] = useState<number>(0); // 0 nghĩa là có thể gửi
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clear timer khi unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startCooldown = (seconds = RESEND_COOLDOWN) => {
    const expiresAt = Date.now() + seconds * 1000;
    localStorage.setItem(RESEND_STORAGE_KEY, String(expiresAt));
    setCooldown(seconds);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const stored = Number(localStorage.getItem(RESEND_STORAGE_KEY) || 0);
      const remaining = Math.ceil((stored - Date.now()) / 1000);

      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
        setCooldown(0);
        localStorage.removeItem(RESEND_STORAGE_KEY);
      } else {
        setCooldown(remaining);
      }
    }, 1000);
  };

  // Khôi phục cooldown nếu đang còn hạn (VD: user F5)
  useEffect(() => {
    const stored = Number(localStorage.getItem(RESEND_STORAGE_KEY) || 0);
    const remaining = Math.ceil((stored - Date.now()) / 1000);
    if (remaining > 0) {
      startCooldown(remaining);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSendCode = async () => {
    if (sendingCode || cooldown > 0) return;

    const email = (
      document.getElementById("email") as HTMLInputElement
    )?.value?.trim();
    if (!email) {
      toast.error("Vui lòng nhập email trước");
      return;
    }
    // kiểm tra định dạng đơn giản
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      toast.error("Email không hợp lệ");
      return;
    }

    setSendingCode(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/send-verification-code`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Đã gửi mã");
        // Bắt đầu đếm ngược (ưu tiên cooldown từ server nếu có)
        startCooldown(
          typeof data.cooldownSec === "number"
            ? data.cooldownSec
            : RESEND_COOLDOWN
        );
      } else {
        if (res.status === 429 && typeof data.cooldownSec === "number") {
          toast.error(
            `Bạn vừa gửi mã. Vui lòng thử lại sau ${data.cooldownSec}s`
          );
          // Cũng kích hoạt đếm ngược theo server báo
          startCooldown(data.cooldownSec);
        } else {
          toast.error(data.message || "Gửi mã thất bại");
        }
      }
    } catch (e) {
      toast.error("Không thể gửi mã. Vui lòng thử lại.");
      console.error("[send-verification-code]", e);
    } finally {
      setSendingCode(false);
    }
  };

  function onGoogle() {
    setGLoading(true);
    window.location.href = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/google`;
  }

  return (
    <AuthLayout
      title={t("title")}
      subtitle={
        <>
          {t("alreadyAccount")}{" "}
          <Link
            href={`${basePrefix}/auth/login`}
            className="font-medium text-sky-600 dark:text-sky-400 underline underline-offset-4 decoration-dashed hover:no-underline hover:text-sky-700 dark:hover:text-sky-300 transition-colors duration-200"
          >
            {t("login")}
          </Link>
        </>
      }
      below={
        <GoogleButton
          text={t("google")}
          loading={gLoading}
          onClick={onGoogle}
          className="w-full justify-center py-3 text-sm font-medium rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all duration-200 shadow-sm"
        />
      }
    >
      <form onSubmit={onSubmit} className="mt-8 space-y-6" noValidate>
        {/* Name Field */}
        <div className="space-y-2">
          <label
            htmlFor="name"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            {t("name")}
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            autoFocus
            aria-invalid={!!errors.name}
            className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-200"
            placeholder={t("placeholderName")}
            onChange={() =>
              errors.name && setErrors((e) => ({ ...e, name: undefined }))
            }
          />
          <FieldError message={errors.name} />
        </div>

        {/* Email Field */}
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            {t("email")}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            aria-invalid={!!errors.email}
            className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-200"
            placeholder={t("placeholderEmail")}
            onChange={() =>
              errors.email && setErrors((e) => ({ ...e, email: undefined }))
            }
          />
          <FieldError message={errors.email} />
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <PasswordField
            id="password"
            name="password"
            label={t("password")}
            placeholder={
              t("placeholderPassword") || "Nhập mật khẩu (tối thiểu 8 ký tự)"
            }
            className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-200"
            minLength={8}
            autoComplete="new-password"
            show={pw.show}
            onToggle={pw.toggle}
            onChange={() =>
              errors.password &&
              setErrors((e) => ({ ...e, password: undefined }))
            }
            aria-invalid={!!errors.password}
          />
          <FieldError message={errors.password} />
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <PasswordField
            id="confirm"
            name="confirm"
            label={t("confirmPassword")}
            placeholder={t("confirmPlaceholder") || "Nhập lại mật khẩu"}
            className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-200"
            minLength={8}
            autoComplete="new-password"
            show={cpw.show}
            onToggle={cpw.toggle}
            onChange={() =>
              errors.confirm && setErrors((e) => ({ ...e, confirm: undefined }))
            }
            aria-invalid={!!errors.confirm}
          />
          <FieldError message={errors.confirm} />
        </div>

        {/* Verification code */}
        <div className="space-y-2">
          <label
            htmlFor="verificationCode"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Mã xác thực email
          </label>
          <div className="flex gap-2">
            <input
              id="verificationCode"
              name="verificationCode"
              type="text"
              required
              maxLength={6}
              className="flex-1 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2.5 text-sm"
              placeholder="Nhập mã 6 số"
            />
            <button
              type="button"
              onClick={handleSendCode}
              disabled={sendingCode || cooldown > 0}
              aria-disabled={sendingCode || cooldown > 0}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                sendingCode || cooldown > 0
                  ? "bg-zinc-300 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 cursor-not-allowed"
                  : "bg-sky-600 hover:bg-sky-700 text-white"
              }`}
            >
              {sendingCode
                ? "Đang gửi…"
                : cooldown > 0
                ? `Gửi lại mã (${cooldown}s)`
                : "Gửi mã"}
            </button>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Nếu không nhận được mã, bạn có thể yêu cầu gửi lại sau 30 giây.
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-700 hover:to-sky-600 text-white font-medium py-3 text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  opacity="0.3"
                />
                <path fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              {t("submitting")}
            </span>
          ) : (
            t("submit")
          )}
        </button>
      </form>
    </AuthLayout>
  );
}
