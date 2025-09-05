// app/auth/register/page.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import AuthLayout from "@/components/auth/AuthLayout";
import GoogleButton from "@/components/auth/GoogleButton";
import FieldError from "@/components/auth/FieldError";
import PasswordField from "@/components/auth/PasswordField";
import { usePasswordToggle } from "@/hooks/usePasswordToggle";
import { useAuthSubmit } from "@/hooks/useAuthSubmit";

export default function RegisterPage() {
  const t = useTranslations("register");
  const router = useRouter();
  const [gLoading, setGLoading] = useState(false);

  const pw = usePasswordToggle(false);
  const cpw = usePasswordToggle(false);

  const { onSubmit, loading, errors, setErrors } = useAuthSubmit({
    kind: "register",
    url: `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/register`,
    t,
    onSuccess: () => {
      toast.success(t("success")); // ví dụ: "Đăng ký thành công!"
      router.push("/auth/login");
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
            href="/auth/login"
            className="underline underline-offset-2 hover:no-underline text-sky-600 dark:text-sky-400"
          >
            {t("login")}
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
          <GoogleButton text={t("google")} loading={gLoading} onClick={onGoogle} />
        </>
      }
    >
      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm mb-1 text-zinc-700 dark:text-zinc-300">
            {t("name")}
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            aria-invalid={!!errors.name}
            className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 outline-none
                       focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-50/10
                       text-base sm:text-sm text-zinc-900 dark:text-zinc-100
                       placeholder:text-zinc-500 dark:placeholder:text-zinc-400"
            placeholder={t("placeholderName")}
            onChange={() => errors.name && setErrors((e) => ({ ...e, name: undefined }))}
          />
          <FieldError message={errors.name} />
        </div>

        {/* Email */}
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
                       text-base sm:text-sm text-zinc-900 dark:text-zinc-100
                       placeholder:text-zinc-500 dark:placeholder:text-zinc-400"
            placeholder={t("placeholderEmail")}
            onChange={() => errors.email && setErrors((e) => ({ ...e, email: undefined }))}
          />
          <FieldError message={errors.email} />
        </div>

        {/* Password */}
        <PasswordField
          id="password"
          name="password"
          label={t("password")}
          placeholder="••••••••"
          minLength={8}
          autoComplete="new-password"
          show={pw.show}
          onToggle={pw.toggle}
          onChange={() => errors.password && setErrors((e) => ({ ...e, password: undefined }))}
          aria-invalid={!!errors.password}
        />
        <FieldError message={errors.password} />

        {/* Confirm */}
        <PasswordField
          id="confirm"
          name="confirm"
          label={t("confirmPassword")}
          placeholder={t("confirmPlaceholder")}
          minLength={8}
          autoComplete="new-password"
          show={cpw.show}
          onToggle={cpw.toggle}
          onChange={() => errors.confirm && setErrors((e) => ({ ...e, confirm: undefined }))}
          aria-invalid={!!errors.confirm}
        />
        <FieldError message={errors.confirm} />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl px-4 py-2 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 disabled:opacity-60"
        >
          {loading ? t("submitting") : t("submit")}
        </button>
      </form>
    </AuthLayout>
  );
}
