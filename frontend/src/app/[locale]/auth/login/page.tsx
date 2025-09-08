// app/auth/login/page.tsx
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

export default function LoginPage() {
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

      if (profile) {
        login(profile);
      }
      toast.success("Đăng nhập thành công!");
      router.push("/homePage");
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
            href="/auth/register"
            className="underline underline-offset-2 hover:no-underline text-sky-600 dark:text-sky-400"
          >
            {t("register")}
          </Link>
        </>
      }
      below={
        <>
          <div className="relative flex items-center justify-center">
            <span className="bg-white dark:bg-zinc-900 px-2 text-xs text-zinc-500 dark:text-zinc-400">
              {t("or")}
            </span>
          </div>
          <GoogleButton
            text={t("continueWithGoogle")}
            loading={gLoading}
            onClick={onGoogle}
          />
        </>
      }
    >
      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm mb-1 text-zinc-700 dark:text-zinc-300"
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
            className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 outline-none
                       focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-50/10
                       text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400"
            placeholder={t("emailPlaceholder")}
            onChange={() =>
              errors.email && setErrors((e) => ({ ...e, email: undefined }))
            }
          />
          <FieldError message={errors.email} />
        </div>
        {/* Password */}
        <PasswordField
          id="password"
          name="password"
          label={t("password")}
          placeholder={"Nhập mật khẩu của bạn"}
          className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 outline-none
                       focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-50/10
                       text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400"
          autoComplete="current-password"
          show={pw.show}
          onToggle={pw.toggle}
          onChange={() =>
            errors.password && setErrors((e) => ({ ...e, password: undefined }))
          }
          aria-invalid={!!errors.password}
        />
        <FieldError message={errors.password} />

        <div className="flex items-center justify-between text-sm">
          <span />
          <Link
            href="/auth/forgot-password"
            className="underline underline-offset-2 hover:no-underline text-sky-600 dark:text-sky-400"
          >
            {t("forgotPassword")}
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl px-4 py-2 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 disabled:opacity-60"
        >
          {loading ? t("processing") : t("login")}
        </button>
      </form>
    </AuthLayout>
  );
}
