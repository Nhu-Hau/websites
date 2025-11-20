"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "@/lib/toast";
import { useAuth } from "@/context/AuthContext";

import AuthLayout from "@/components/features/auth/AuthLayout";
import GoogleButton from "@/components/features/auth/GoogleButton";
import PasswordField from "@/components/features/auth/PasswordField";
import FieldError from "@/components/features/auth/FieldError";
import { Button, Input } from "@/components/ui";
import { usePasswordToggle } from "@/hooks/auth/usePasswordToggle";
import { useAuthSubmit } from "@/hooks/auth/useAuthSubmit";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";

const LOGIN_COPY = {
  title: "Đăng nhập",
  noAccount: "Chưa có tài khoản?",
  register: "Đăng ký",
  continueWithGoogle: "Tiếp tục với Google",
  email: "Email",
  emailPlaceholder: "Nhập email của bạn",
  password: "Mật khẩu",
  passwordPlaceholder: "Nhập mật khẩu của bạn",
  forgotPassword: "Quên mật khẩu?",
  processing: "Đang xử lý...",
  login: "Đăng nhập",
  errorEmailRequired: "Vui lòng nhập email",
  errorEmailInvalid: "Email không hợp lệ",
  errorPasswordRequired: "Vui lòng nhập mật khẩu",
  errorPasswordLen: "Mật khẩu phải có tối thiểu 8 ký tự",
} as const;

export default function LoginForm() {
  const basePrefix = useBasePrefix(); // -> "/vi" | "/en" | ...
  const translate = (key: string) =>
    LOGIN_COPY[key as keyof typeof LOGIN_COPY] ?? key;
  const router = useRouter();
  const [gLoading, setGLoading] = useState(false);
  const pw = usePasswordToggle(false);
  const { login } = useAuth();

  const { onSubmit, loading, errors, setErrors } = useAuthSubmit({
    kind: "login",
    url: `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/login`,
    t: translate,
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
      router.push(`${basePrefix}/home`);
    },
  });

  function onGoogle() {
    setGLoading(true);
    window.location.href = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/google`;
  }

  return (
    <AuthLayout
      title={translate("title")}
      subtitle={
        <>
          {translate("noAccount")}{" "}
          <Link
            href={`${basePrefix}/register`}
            className="underline underline-offset-2 hover:no-underline text-sky-600 dark:text-sky-400"
          >
            {translate("register")}
          </Link>
        </>
      }
      below={
        <>
          <GoogleButton
            text={translate("continueWithGoogle")}
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
            {translate("email")}
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            aria-invalid={!!errors.email}
            error={!!errors.email}
            placeholder={translate("emailPlaceholder")}
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
            label={translate("password")}
            placeholder={translate("passwordPlaceholder") || "Nhập mật khẩu của bạn"}
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
            href={`${basePrefix}/forgot-password`}
            className="text-sm text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 
                 underline underline-offset-4 decoration-dashed hover:no-underline 
                 transition-colors duration-200"
          >
            {translate("forgotPassword")}
          </Link>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={loading}
          className="w-full"
        >
          {loading ? translate("processing") : translate("login")}
        </Button>
      </form>
    </AuthLayout>
  );
}
