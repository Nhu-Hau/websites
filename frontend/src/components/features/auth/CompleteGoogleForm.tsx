/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import { useAuth } from "@/context/AuthContext";

import AuthLayout from "@/components/features/auth/AuthLayout";
import PasswordField from "@/components/features/auth/PasswordField";
import FieldError from "@/components/features/auth/FieldError";
import { usePasswordToggle } from "@/hooks/auth/usePasswordToggle";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";

export default function CompleteGoogleForm() {
  const basePrefix = useBasePrefix();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const router = useRouter();
  const { login } = useAuth();

  const pw = usePasswordToggle(false);
  const cpw = usePasswordToggle(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get("password") || "").trim();
    const confirm = String(fd.get("confirm") || "").trim();

    // Reset errors
    setErrors({});

    if (password.length < 8) {
      setErrors({ password: "Mật khẩu phải có ít nhất 8 ký tự" });
      return;
    }
    if (password !== confirm) {
      setErrors({ confirm: "Mật khẩu xác nhận không khớp" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/google/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password }),
      });

      const json = await res.json().catch(() => ({} as any));

      if (res.status === 201) {
        if (json.user) login(json.user);
        toast.success(json.message || "Đăng ký bằng Google thành công!");
        router.replace(basePrefix);
        return;
      }

      if (res.status === 400) return toast.error(json.message || "Dữ liệu không hợp lệ");
      if (res.status === 401) return toast.error(json.message || "Phiên đăng ký đã hết hạn, vui lòng thử lại");
      if (res.status === 409) return toast.error(json.message || "Tài khoản đã tồn tại, vui lòng đăng nhập");

      toast.error(json.message || "Có lỗi xảy ra, vui lòng thử lại");
    } catch {
      toast.error("Không thể kết nối máy chủ. Vui lòng kiểm tra mạng.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Hoàn tất đăng ký Google"
      subtitle={
        <>
          Bạn đã đăng nhập bằng <strong>Google</strong>. Vui lòng tạo mật khẩu để hoàn tất tài khoản.
        </>
      }
    >
      <form onSubmit={onSubmit} className="mt-8 space-y-6" noValidate>
        {/* Password */}
        <div className="space-y-2">
          <PasswordField
            id="password"
            name="password"
            label="Mật khẩu"
            placeholder="Tối thiểu 8 ký tự"
            className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 
            bg-white dark:bg-zinc-800 px-4 py-2.5 text-sm
            text-zinc-900 dark:text-zinc-100 
            placeholder:text-zinc-500 dark:placeholder:text-zinc-400
            focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-200"
            autoComplete="new-password"
            minLength={8}
            required
            show={pw.show}
            onToggle={pw.toggle}
            onChange={() => errors.password && setErrors((e) => ({ ...e, password: undefined }))}
            autoFocus
          />
          <FieldError message={errors.password} />
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <PasswordField
            id="confirm"
            name="confirm"
            label="Xác nhận mật khẩu"
            placeholder="Nhập lại mật khẩu"
            className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 
                       bg-white dark:bg-zinc-800 px-4 py-2.5 text-sm
                       text-zinc-900 dark:text-zinc-100 
                       placeholder:text-zinc-500 dark:placeholder:text-zinc-400
                       focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500
                       transition-all duration-200"
            autoComplete="new-password"
            minLength={8}
            required
            show={cpw.show}
            onToggle={cpw.toggle}
            onChange={() => errors.confirm && setErrors((e) => ({ ...e, confirm: undefined }))}
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
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.3" />
                <path fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Đang xử lý...
            </span>
          ) : (
            "Hoàn tất đăng ký"
          )}
        </button>
      </form>
    </AuthLayout>
  );
}