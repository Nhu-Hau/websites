"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

import AuthLayout from "@/components/auth/AuthLayout";
import GoogleButton from "@/components/auth/GoogleButton";
import PasswordField from "@/components/auth/PasswordField";
import FieldError from "@/components/auth/FieldError";
import { usePasswordToggle } from "@/hooks/usePasswordToggle";
import { useAuthSubmit } from "@/hooks/useAuthSubmit";
import { useBasePrefix } from "@/hooks/useBasePrefix";

export default function LoginForm() {
  const basePrefix = useBasePrefix(); // -> "/vi" | "/en" | ...
  const t = useTranslations("Login");
  const router = useRouter();
  const [gLoading, setGLoading] = useState(false);
  const pw = usePasswordToggle(false);
  const { login } = useAuth();

  const { onSubmit, loading, errors, setErrors } = useAuthSubmit({
    kind: "login",
    url: `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/login`,
    t,
    onSuccess: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/me`,
        {
          credentials: "include",
        }
      );
      const profile = res.ok ? await res.json() : null;
      if (profile) login(profile);
      toast.success("Đăng nhập thành công!");
      router.push(`${basePrefix}/homePage`);
    },
  });

  function onGoogle() {
    setGLoading(true);
    window.location.href = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/google`;
  }

  return (
    <AuthLayout
      title={t("title")}
      subtitle={
        <>
          {t("noAccount")}{" "}
          <Link
            href={`${basePrefix}/auth/register`}
            className="underline underline-offset-2 hover:no-underline text-sky-600 dark:text-sky-400"
          >
            {t("register")}
          </Link>
        </>
      }
      below={
        <>
          <GoogleButton
            text={t("continueWithGoogle")}
            loading={gLoading}
            onClick={onGoogle}
          />
        </>
      }
    >
      <form onSubmit={onSubmit} className="mt-8 space-y-6" noValidate>
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
            className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2.5 text-sm
                 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400
                 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500
                 transition-all duration-200"
            placeholder={t("emailPlaceholder")}
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
            placeholder={t("passwordPlaceholder") || "Nhập mật khẩu của bạn"}
            className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2.5 text-sm
                 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400
                 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500
                 transition-all duration-200"
            autoComplete="current-password"
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

        {/* Forgot Password */}
        <div className="flex justify-end">
          <Link
            href={`${basePrefix}/auth/forgot-password`}
            className="text-sm text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 
                 underline underline-offset-4 decoration-dashed hover:no-underline 
                 transition-colors duration-200"
          >
            {t("forgotPassword")}
          </Link>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-700 hover:to-sky-600
               text-white font-medium py-3 text-sm shadow-sm
               disabled:opacity-50 disabled:cursor-not-allowed
               transform transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]
               focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
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
              {t("processing")}
            </span>
          ) : (
            t("login")
          )}
        </button>
      </form>
    </AuthLayout>
  );
}
