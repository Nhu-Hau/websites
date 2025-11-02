"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
            className="font-medium text-sky-600 dark:text-sky-400 
                       underline underline-offset-4 decoration-dashed 
                       hover:no-underline hover:text-sky-700 dark:hover:text-sky-300 
                       transition-colors duration-200"
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
            className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 
                       bg-white dark:bg-zinc-800 px-4 py-2.5 text-sm
                       text-zinc-900 dark:text-zinc-100 
                       placeholder:text-zinc-500 dark:placeholder:text-zinc-400
                       focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500
                       transition-all duration-200"
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
            className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 
                       bg-white dark:bg-zinc-800 px-4 py-2.5 text-sm
                       text-zinc-900 dark:text-zinc-100 
                       placeholder:text-zinc-500 dark:placeholder:text-zinc-400
                       focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500
                       transition-all duration-200"
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
            className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 
                       bg-white dark:bg-zinc-800 px-4 py-2.5 text-sm
                       text-zinc-900 dark:text-zinc-100 
                       placeholder:text-zinc-500 dark:placeholder:text-zinc-400
                       focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500
                       transition-all duration-200"
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
            className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 
                       bg-white dark:bg-zinc-800 px-4 py-2.5 text-sm
                       text-zinc-900 dark:text-zinc-100 
                       placeholder:text-zinc-500 dark:placeholder:text-zinc-400
                       focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500
                       transition-all duration-200"
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

        {/* Submit Button */}
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
