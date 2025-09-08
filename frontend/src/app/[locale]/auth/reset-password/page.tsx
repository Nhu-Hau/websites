/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import AuthLayout from "@/components/auth/AuthLayout";
import PasswordField from "@/components/auth/PasswordField";
import { usePasswordToggle } from "@/hooks/usePasswordToggle";

export default function ChangePasswordPage() {
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
      toast.error("Mật khẩu mới tối thiểu 8 ký tự");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error("Xác nhận mật khẩu mới không khớp");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ oldPassword, newPassword, confirmNewPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success(data.message || "Đổi mật khẩu thành công");
        router.push("/homePage");
      } else {
        toast.error(data.message || "Đổi mật khẩu thất bại");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Đổi mật khẩu" subtitle="Nhập mật khẩu hiện tại và đặt mật khẩu mới.">
      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
        <PasswordField
          id="oldPassword"
          name="oldPassword"
          label="Mật khẩu hiện tại"
          placeholder="Nhập mật khẩu hiện tại"
          className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 outline-none
                     focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-50/10
                     text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400"
          autoComplete="current-password"
          minLength={8}
          show={oldPw.show}
          onToggle={oldPw.toggle}
          onChange={(e: any) => setOldPassword(e.target.value)}
          aria-invalid={false}
        />

        <PasswordField
          id="newPassword"
          name="newPassword"
          label="Mật khẩu mới"
          placeholder="Nhập mật khẩu mới"
          className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 outline-none
                     focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-50/10
                     text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400"
          autoComplete="new-password"
          minLength={8}
          show={newPw.show}
          onToggle={newPw.toggle}
          onChange={(e: any) => setNewPassword(e.target.value)}
          aria-invalid={false}
        />

        <PasswordField
          id="confirmNewPassword"
          name="confirmNewPassword"
          label="Xác nhận mật khẩu mới"
          placeholder="Nhập lại mật khẩu mới"
          className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 outline-none
                     focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-50/10
                     text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400"
          autoComplete="new-password"
          minLength={8}
          show={confirmPw.show}
          onToggle={confirmPw.toggle}
          onChange={(e: any) => setConfirmNewPassword(e.target.value)}
          aria-invalid={false}
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl px-4 py-2 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 disabled:opacity-60"
        >
          {loading ? "Đang đổi mật khẩu..." : "Đổi mật khẩu"}
        </button>

        <div className="flex items-center justify-between text-sm">
          <span />
          <Link
            href="/homePage"
            className="underline underline-offset-2 hover:no-underline text-sky-600 dark:text-sky-400"
          >
            Về trang chủ
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
