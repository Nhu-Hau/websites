// app/auth/forgot-password/page.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import AuthLayout from "@/components/auth/AuthLayout";
import FieldError from "@/components/auth/FieldError";
import { useAuthSubmit } from "@/hooks/useAuthSubmit";

export default function ForgotPasswordPage() {
  const t = useTranslations("ForgotPassword");
  const [sent, setSent] = useState(false);

  const { onSubmit, loading, errors, setErrors } = useAuthSubmit({
    kind: "forgot",
    url: `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/forgot-password`,
    t,
    onSuccess: () => {
      toast.success(t("success")); // ví dụ: "Đã gửi email đặt lại mật khẩu"
      setSent(true);
    },
  });

  return (
    <AuthLayout title={t("title")} subtitle={t("subtitle")}>
      {sent ? (
        <div className="mt-6 space-y-4">
          <div className="rounded-lg border border-zinc-300/60 dark:border-zinc-700/60 bg-zinc-50 dark:bg-zinc-800/40 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200">
            {t("emailSent")}
          </div>
          <div className="flex items-center justify-between text-sm">
            <Link href="/auth/login" className="underline underline-offset-2 hover:no-underline text-sky-600 dark:text-sky-400">
              {t("backToLogin")}
            </Link>
            <button
              type="button"
              onClick={() => setSent(false)}
              className="underline underline-offset-2 hover:no-underline text-sky-600 dark:text-sky-400"
            >
              {t("resend")}
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
          <div>
            <label htmlFor="email" className="block text-sm mb-1 text-zinc-700 dark:text-zinc-300">
              {t("email")}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              aria-invalid={!!errors.email}
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 outline-none 
                         focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-50/10
                         text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400"
              placeholder={t("placeholder")}
              onChange={() => errors.email && setErrors((e) => ({ ...e, email: undefined }))}
            />
            <FieldError message={errors.email} />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl px-4 py-2 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 disabled:opacity-60"
          >
            {loading ? t("sending") : t("submit")}
          </button>

          <div className="flex items-center justify-between text-sm">
            <Link href="/auth/login" className="underline underline-offset-2 hover:no-underline text-sky-600 dark:text-sky-400">
              {t("backToLogin")}
            </Link>
            <Link href="/auth/register" className="underline underline-offset-2 hover:no-underline text-sky-600 dark:text-sky-400">
              {t("createAccount")}
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
