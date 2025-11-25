/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";

import AuthLayout from "@/components/features/auth/AuthLayout";
import PasswordField from "@/components/features/auth/PasswordField";
import { usePasswordToggle } from "@/hooks/auth/usePasswordToggle";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";

export default function ChangePasswordForm() {
  const basePrefix = useBasePrefix();
  const router = useRouter();
  const t = useTranslations("auth.changePassword");

  const currentPw = usePasswordToggle(false);
  const newPw = usePasswordToggle(false);
  const confirmPw = usePasswordToggle(false);

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { currentPassword, newPassword, confirmPassword } = formData;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return toast.error(t("errorMissingFields"));
    }
    if (newPassword.length < 8) {
      return toast.error(t("errorPasswordLength"));
    }
    if (newPassword !== confirmPassword) {
      return toast.error(t("errorPasswordMismatch"));
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        toast.success(data.message || t("success"));
        router.push(`${basePrefix}/`);
      } else {
        toast.error(data.message || t("errorGeneric"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={t("title")}
      subtitle={t("subtitle")}
    >
      <form onSubmit={handleSubmit} className="mt-8 space-y-6" noValidate>
        {/* Current Password */}
        <div className="space-y-2">
          <PasswordField
            id="currentPassword"
            name="currentPassword"
            label={t("currentPasswordLabel")}
            placeholder={t("currentPasswordPlaceholder")}
            className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 
                       bg-white dark:bg-zinc-800 px-4 py-2.5 text-sm
                       text-zinc-900 dark:text-zinc-100 
                       placeholder:text-zinc-500 dark:placeholder:text-zinc-400
                       focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500
                       transition-all duration-200"
            autoComplete="current-password"
            show={currentPw.show}
            onToggle={currentPw.toggle}
            onChange={handleChange}
            value={formData.currentPassword}
          />
        </div>

        {/* New Password */}
        <div className="space-y-2">
          <PasswordField
            id="newPassword"
            name="newPassword"
            label={t("newPasswordLabel")}
            placeholder={t("newPasswordPlaceholder")}
            className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 
                       bg-white dark:bg-zinc-800 px-4 py-2.5 text-sm
                       text-zinc-900 dark:text-zinc-100 
                       placeholder:text-zinc-500 dark:placeholder:text-zinc-400
                       focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500
                       transition-all duration-200"
            minLength={8}
            autoComplete="new-password"
            show={newPw.show}
            onToggle={newPw.toggle}
            onChange={handleChange}
            value={formData.newPassword}
          />
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <PasswordField
            id="confirmPassword"
            name="confirmPassword"
            label={t("confirmPasswordLabel")}
            placeholder={t("confirmPasswordPlaceholder")}
            className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 
                       bg-white dark:bg-zinc-800 px-4 py-2.5 text-sm
                       text-zinc-900 dark:text-zinc-100 
                       placeholder:text-zinc-500 dark:placeholder:text-zinc-400
                       focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500
                       transition-all duration-200"
            minLength={8}
            autoComplete="new-password"
            show={confirmPw.show}
            onToggle={confirmPw.toggle}
            onChange={handleChange}
            value={formData.confirmPassword}
          />
        </div>

        {/* Submit */}
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
              {t("submitLoading")}
            </span>
          ) : (
            t("submit")
          )}
        </button>

        {/* Back to Home */}
        <div className="flex justify-center">
          <Link
            href={`${basePrefix}/`}
            className="inline-flex items-center gap-1 text-sm text-sky-600 dark:text-sky-400 
                       hover:text-sky-700 dark:hover:text-sky-300 
                       underline underline-offset-4 decoration-dashed 
                       hover:no-underline transition-all duration-200"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {t("backToHome")}
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
