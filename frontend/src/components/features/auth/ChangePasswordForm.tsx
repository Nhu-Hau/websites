/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import { ArrowLeft } from "lucide-react"; // Nếu dùng lucide-react

import AuthLayout from "@/components/features/auth/AuthLayout";
import PasswordField from "@/components/features/auth/PasswordField";
import { usePasswordToggle } from "@/hooks/auth/usePasswordToggle";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";

export default function ChangePasswordForm() {
  const basePrefix = useBasePrefix();
  const router = useRouter();

  const oldPw = usePasswordToggle(false);
  const newPw = usePasswordToggle(false);
  const confirmPw = usePasswordToggle(false);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!oldPassword || !newPassword || !confirmNewPassword) {
      toast.error("Vui lòng nhập đầy đủ các trường");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Mật khẩu mới phải có ít nhất 8 ký tự");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          oldPassword,
          newPassword,
          confirmNewPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success(data.message || "Đổi mật khẩu thành công!");
        router.push(basePrefix);
      } else {
        toast.error(data.message || "Đổi mật khẩu thất bại. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Đổi mật khẩu"
      subtitle="Cập nhật mật khẩu mới để bảo vệ tài khoản của bạn."
    >
      <form onSubmit={onSubmit} className="mt-8 space-y-6" noValidate>
        {/* Current Password */}
        <div className="space-y-2">
          <PasswordField
            id="oldPassword"
            name="oldPassword"
            label="Mật khẩu hiện tại"
            placeholder="Nhập mật khẩu hiện tại"
            className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 
                       bg-white dark:bg-zinc-800 px-4 py-2.5 text-sm
                       text-zinc-900 dark:text-zinc-100 
                       placeholder:text-zinc-500 dark:placeholder:text-zinc-400
                       focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500
                       transition-all duration-200"
            autoComplete="current-password"
            minLength={8}
            show={oldPw.show}
            onToggle={oldPw.toggle}
            onChange={(e: any) => setOldPassword(e.target.value)}
            autoFocus
          />
        </div>

        {/* New Password */}
        <div className="space-y-2">
          <PasswordField
            id="newPassword"
            name="newPassword"
            label="Mật khẩu mới"
            placeholder="Tối thiểu 8 ký tự"
            className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 
                       bg-white dark:bg-zinc-800 px-4 py-2.5 text-sm
                       text-zinc-900 dark:text-zinc-100 
                       placeholder:text-zinc-500 dark:placeholder:text-zinc-400
                       focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500
                       transition-all duration-200"
            autoComplete="new-password"
            minLength={8}
            show={newPw.show}
            onToggle={newPw.toggle}
            onChange={(e: any) => setNewPassword(e.target.value)}
          />
        </div>

        {/* Confirm New Password */}
        <div className="space-y-2">
          <PasswordField
            id="confirmNewPassword"
            name="confirmNewPassword"
            label="Xác nhận mật khẩu mới"
            placeholder="Nhập lại mật khẩu mới"
            className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 
                       bg-white dark:bg-zinc-800 px-4 py-2.5 text-sm
                       text-zinc-900 dark:text-zinc-100 
                       placeholder:text-zinc-500 dark:placeholder:text-zinc-400
                       focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500
                       transition-all duration-200"
            autoComplete="new-password"
            minLength={8}
            show={confirmPw.show}
            onToggle={confirmPw.toggle}
            onChange={(e: any) => setConfirmNewPassword(e.target.value)}
          />
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
              Đang đổi mật khẩu...
            </span>
          ) : (
            "Đổi mật khẩu"
          )}
        </button>

        {/* Back to Home */}
        <div className="flex justify-center">
          <Link
            href={basePrefix}
            className="inline-flex items-center gap-1.5 text-sm text-sky-600 dark:text-sky-400 
                       hover:text-sky-700 dark:hover:text-sky-300 
                       underline underline-offset-4 decoration-dashed 
                       hover:no-underline transition-all duration-200"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Về trang chủ
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
