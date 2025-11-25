/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import Link from "next/link";
import { ArrowLeft } from "lucide-react"; // Nếu dùng lucide-react
import { useTranslations } from "next-intl";

import AuthLayout from "@/components/features/auth/AuthLayout";
import PasswordField from "@/components/features/auth/PasswordField";
import { usePasswordToggle } from "@/hooks/auth/usePasswordToggle";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";

export default function ForgotPasswordForm() {
  const basePrefix = useBasePrefix();
  const router = useRouter();
  const t = useTranslations("auth.forgotPassword");

  const newPw = usePasswordToggle(false);
  const confirmPw = usePasswordToggle(false);

  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [cooldown, setCooldown] = useState(0);

  const [code, setCode] = useState("");
  const [pw, setPw] = useState("");
  const [cpw, setCpw] = useState("");

  // Cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const canResend = useMemo(() => cooldown === 0, [cooldown]);

  // Step 1: Gửi email
  async function sendCode(e?: React.FormEvent) {
    e?.preventDefault();
    if (!email.trim()) return toast.error(t("errorEmailRequired"));

    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        toast.success(
          data.message || t("successStep1")
        );
        setStep(2);
        setCooldown(60);
      } else {
        toast.error(data.message || t("sendCodeError"));
      }
    } finally {
      setLoading(false);
    }
  }

  // Step 2: Đặt lại mật khẩu
  async function onResetWithCode(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return toast.error(t("missingEmail"));
    if (!code || code.length < 4)
      return toast.error(t("errorCodeInvalid"));
    if (pw.length < 8) return toast.error(t("errorPasswordLength"));
    if (pw !== cpw) return toast.error(t("errorPasswordMismatch"));

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, code, password: pw }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success(data.message || t("successStep2"));
        router.push(`${basePrefix}/login`);
      } else {
        toast.error(data.message || t("resetCodeError"));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title={step === 1 ? t("title") : t("resetTitle")}
      subtitle={
        step === 1 ? (
          t("subtitleStep1")
        ) : (
          <div className="flex items-center gap-1 text-sm">
            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300">
              2
            </span>
            {t("subtitleStep2")}
          </div>
        )
      }
    >
      {/* Progress Indicator */}
      <div className="flex justify-center mb-6">
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
              step >= 1
                ? "bg-sky-600 text-white"
                : "bg-zinc-200 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400"
            }`}
          >
            1
          </div>
          <div className="w-12 h-1 bg-zinc-200 dark:bg-zinc-700 rounded-full">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                step === 2 ? "w-full bg-sky-600" : "w-0"
              }`}
            />
          </div>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
              step === 2
                ? "bg-sky-600 text-white"
                : "bg-zinc-200 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400"
            }`}
          >
            2
          </div>
        </div>
      </div>

      {step === 1 ? (
        <form onSubmit={sendCode} className="mt-4 space-y-6" noValidate>
          {/* Email */}
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              {t("emailLabel")}
            </label>
            <input
              id="email"
              type="email"
              required
              autoFocus
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("emailPlaceholder")}
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 
                         bg-white dark:bg-zinc-800 px-4 py-2.5 text-sm
                         text-zinc-900 dark:text-zinc-100 
                         placeholder:text-zinc-500 dark:placeholder:text-zinc-400
                         focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500
                         transition-all duration-200"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="w-full rounded-xl bg-gradient-to-r from-sky-600 to-sky-500 
                       hover:from-sky-700 hover:to-sky-600
                       text-white font-medium py-3 text-sm shadow-sm
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transform transition-all duration-200 
                       hover:scale-[1.01] active:scale-[0.99]
                       focus:outline-none focus:ring-2 focus:ring-sky-500 
                       focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
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
                {t("submitStep1Loading")}
              </span>
            ) : (
              t("submitStep1")
            )}
          </button>

          {/* Back to login */}
          <div className="flex justify-center">
            <Link
              href={`${basePrefix}/login`}
              className="inline-flex items-center gap-1 text-sm text-sky-600 dark:text-sky-400 
                         hover:text-sky-700 dark:hover:text-sky-300 
                         underline underline-offset-4 decoration-dashed 
                         hover:no-underline transition-all duration-200"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {t("backToLogin")}
            </Link>
          </div>

          <p className="text-xs text-center text-zinc-500 dark:text-zinc-400">
            {t.rich("checkSpam", {
              span: (chunks) => <span className="font-medium">{chunks}</span>
            })}
          </p>
        </form>
      ) : (
        <form onSubmit={onResetWithCode} className="mt-4 space-y-6" noValidate>
          {/* Email (disabled) */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {t("emailLabel")}
            </label>
            <input
              type="email"
              disabled
              value={email}
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 
                         bg-zinc-50 dark:bg-zinc-800/50 px-4 py-2.5 text-sm
                         text-zinc-900 dark:text-zinc-100 
                         cursor-not-allowed select-none"
            />
          </div>

          {/* Code */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {t("codeLabel")}
            </label>
            <input
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder={t("codePlaceholder")}
              autoFocus
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 
                         bg-white dark:bg-zinc-800 px-4 py-2.5 text-sm text-center font-mono tracking-widest
                         text-zinc-900 dark:text-zinc-100 
                         placeholder:text-zinc-500 dark:placeholder:text-zinc-400
                         focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500
                         transition-all duration-200"
            />
            <div className="flex justify-center">
              <button
                type="button"
                disabled={!canResend || loading}
                onClick={() => sendCode()}
                className="text-xs text-sky-600 dark:text-sky-400 
                           hover:text-sky-700 dark:hover:text-sky-300 
                           underline underline-offset-2 disabled:no-underline disabled:opacity-50
                           transition-colors"
              >
                {canResend ? t("resendCode") : t("resendWait", { seconds: cooldown })}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <PasswordField
              id="password"
              name="password"
              label={t("newPasswordLabel")}
              placeholder={t("newPasswordPlaceholder")}
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 
                         bg-white dark:bg-zinc-800 px-4 py-2.5 text-sm
                         text-zinc-900 dark:text-zinc-100 
                         placeholder:text-zinc-500 dark:placeholder:text-zinc-400
                         focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500
                         transition-all duration-200"
              minLength={8}
              autoComplete="new-password"
              show={newPw.show}
              onToggle={newPw.toggle}
              onChange={(e: any) => setPw(e.target.value)}
            />
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <PasswordField
              id="confirm"
              name="confirm"
              label={t("confirmPasswordLabel")}
              placeholder={t("confirmPasswordPlaceholder")}
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 
                         bg-white dark:bg-zinc-800 px-4 py-2.5 text-sm
                         text-zinc-900 dark:text-zinc-100 
                         placeholder:text-zinc-500 dark:placeholder:text-zinc-400
                         focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500
                         transition-all duration-200"
              minLength={8}
              autoComplete="new-password"
              show={confirmPw.show}
              onToggle={confirmPw.toggle}
              onChange={(e: any) => setCpw(e.target.value)}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-sky-600 to-sky-500 
                       hover:from-sky-700 hover:to-sky-600
                       text-white font-medium py-3 text-sm shadow-sm
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transform transition-all duration-200 
                       hover:scale-[1.01] active:scale-[0.99]
                       focus:outline-none focus:ring-2 focus:ring-sky-500 
                       focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
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
                {t("submitStep2Loading")}
              </span>
            ) : (
              t("submitStep2")
            )}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
