/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import AuthLayout from "@/components/auth/AuthLayout";
import FieldError from "@/components/auth/FieldError";

export default function CompleteGooglePage() {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>(
    {}
  );
  const router = useRouter();
  const { login } = useAuth();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get("password") || "");
    const confirm = String(fd.get("confirm") || "");

    if (password.length < 8)
      return setErrors({ password: "Mật khẩu tối thiểu 8 ký tự" });
    if (password !== confirm)
      return setErrors({ confirm: "Mật khẩu không khớp" });

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
        toast.success(json.message || "Đăng ký bằng Google thành công");
        router.replace("/homePage");
        return;
      }

      if (res.status === 400)
        return toast.error(json.message || "Dữ liệu không hợp lệ");
      if (res.status === 401)
        return toast.error(
          json.message || "Phiên đăng ký đã hết hạn, vui lòng thử lại"
        );
      if (res.status === 409)
        return toast.error(
          json.message || "Tài khoản đã tồn tại, vui lòng đăng nhập"
        );

      return toast.error(json.message || "Có lỗi xảy ra, vui lòng thử lại");
    } catch {
      toast.error("Không thể kết nối máy chủ. Kiểm tra mạng và thử lại");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Đặt mật khẩu cho tài khoản Google"
      subtitle="Vui lòng tạo mật khẩu cho tài khoản mới của bạn"
    >
      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
        {/* Password */}
        <div>
          <label
            htmlFor="password"
            className="block text-sm mb-1 text-zinc-700 dark:text-zinc-300"
          >
            Mật khẩu
          </label>
          <input
            name="password"
            type="password"
            placeholder={"Nhập mật khẩu của bạn"}
            className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 outline-none
                       focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-50/10
                       text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400"
            autoComplete="new-password"
            minLength={8}
            required
          />
          <FieldError message={errors.password} />
        </div>

        {/* Confirm Password */}
        <div>
          <label
            htmlFor="confirm"
            className="block text-sm mb-1 text-zinc-700 dark:text-zinc-300"
          >
            Nhập lại mật khẩu
          </label>
          <input
            name="confirm"
            type="password"
            placeholder="Nhập lại mật khẩu"
            className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 outline-none
                       focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-50/10
                       text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400"
            autoComplete="new-password"
            minLength={8}
            required
          />
          <FieldError message={errors.confirm} />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl px-4 py-2 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 disabled:opacity-60"
        >
          {loading ? "Đang xử lý..." : "Hoàn tất"}
        </button>
      </form>
    </AuthLayout>
  );
}
