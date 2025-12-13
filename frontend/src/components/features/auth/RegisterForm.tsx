"use client";

import React from "react";
import Link from "next/link";
import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import { useAuth } from "@/context/AuthContext";

import AuthLayout from "@/components/features/auth/AuthLayout";
import GoogleButton from "@/components/features/auth/GoogleButton";
import FieldError from "@/components/features/auth/FieldError";
import PasswordField from "@/components/features/auth/PasswordField";
import { Button, Input } from "@/components/ui";
import { usePasswordToggle } from "@/hooks/auth/usePasswordToggle";
import { useAuthSubmit } from "@/hooks/auth/useAuthSubmit";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";
import { useTranslations } from "next-intl";
import { logger } from "@/lib/utils/logger";
import { useNotifications } from "@/hooks/common/useNotifications";
import { QRCodeSVG } from "qrcode.react";

const RESEND_COOLDOWN = 30; // giây
const RESEND_STORAGE_KEY = "auth:resend:expiresAt";

export default function RegisterForm() {
  const t = useTranslations("auth.register");
  const tAnon = useTranslations("auth.anonymousRegister");
  const basePrefix = useBasePrefix();
  const [gLoading, setGLoading] = useState(false);
  const { login } = useAuth();
  const { pushLocal } = useNotifications();
  const router = useRouter();

  // Mode: "email" or "anonymous"
  const [mode, setMode] = useState<"email" | "anonymous">("email");

  // Password toggles
  const pw = usePasswordToggle(false);
  const cpw = usePasswordToggle(false);

  // Recovery code state for anonymous registration
  const [recoveryCode, setRecoveryCode] = useState<string | null>(null);

  // Auth Submit Hook
  const { onSubmit, loading, errors, setErrors } = useAuthSubmit({
    kind: mode === "email" ? "register" : "register-anonymous",
    url: `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/${mode === "email" ? "register" : "register-anonymous"
      }`,
    t: (key) => (mode === "email" ? t(key) : tAnon(key)),
    onSuccess: async (data) => {
      if (mode === "anonymous") {
        toast.success(tAnon("success"));
        if (data.recoveryCode) {
          setRecoveryCode(data.recoveryCode);
        }
        if (data.user) login(data.user);
        // Don't redirect yet, let user see recovery code
      } else {
        toast.success(t("success"));
        if (data.user) login(data.user);

        // Check for new user placement logic (same as before)
        const isNewUser = data.user?.createdAt
          ? Date.now() - new Date(data.user.createdAt).getTime() < 60000
          : false;

        if (isNewUser) {
          try {
            const res = await fetch("/api/placement/attempts?limit=1", {
              credentials: "include",
              cache: "no-store",
            });
            if (res.ok) {
              const json = await res.json().catch(() => ({}));
              const hasPlacement =
                Array.isArray(json?.items) && json.items.length > 0;
              if (!hasPlacement) {
                try {
                  sessionStorage.setItem("showPlacementEncourage", "true");
                } catch { }
              }
            }
          } catch { }
        }
        window.location.href = basePrefix || "/";
      }
    },
  });

  // Verification Code Logic (Only for Email mode)
  const [sendingCode, setSendingCode] = useState(false);
  const [cooldown, setCooldown] = useState<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startCooldown = useCallback((seconds = RESEND_COOLDOWN) => {
    const expiresAt = Date.now() + seconds * 1000;
    localStorage.setItem(RESEND_STORAGE_KEY, String(expiresAt));
    setCooldown(seconds);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const stored = Number(localStorage.getItem(RESEND_STORAGE_KEY) || 0);
      const remaining = Math.ceil((stored - Date.now()) / 1000);

      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
        setCooldown(0);
        localStorage.removeItem(RESEND_STORAGE_KEY);
      } else {
        setCooldown(remaining);
      }
    }, 1000);
  }, []);

  useEffect(() => {
    const stored = Number(localStorage.getItem(RESEND_STORAGE_KEY) || 0);
    const remaining = Math.ceil((stored - Date.now()) / 1000);
    if (remaining > 0) {
      startCooldown(remaining);
    }
  }, [startCooldown]);

  const handleSendCode = async () => {
    if (sendingCode || cooldown > 0) return;

    const emailInput = document.getElementById("email") as HTMLInputElement;
    const email = emailInput?.value?.trim();

    if (!email) {
      toast.error(t("verification.errorEmailRequired"));
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      toast.error(t("verification.errorEmailInvalid"));
      return;
    }

    setSendingCode(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/send-verification-code`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || t("verification.sentSuccess"));
        startCooldown(
          typeof data.cooldownSec === "number"
            ? data.cooldownSec
            : RESEND_COOLDOWN
        );
      } else {
        if (res.status === 429 && typeof data.cooldownSec === "number") {
          toast.error(
            t("verification.sentCooldown", { seconds: data.cooldownSec })
          );
          startCooldown(data.cooldownSec);
        } else {
          toast.error(data.message || t("verification.sendFailed"));
        }
      }
    } catch (e) {
      toast.error(t("verification.sendError"));
      logger.error("[send-verification-code]", e);
    } finally {
      setSendingCode(false);
    }
  };

  function onGoogle() {
    setGLoading(true);
    window.location.href = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/google`;
  }

  const handleContinue = () => {
    router.push(basePrefix || "/");
  };

  // Render Success State for Anonymous Registration
  if (mode === "anonymous" && recoveryCode) {
    return (
      <AuthLayout
        title={tAnon("successTitle")}
        subtitle={tAnon("successSubtitle")}
      >
        <div className="mt-8 space-y-6">
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
            <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-3 font-medium">
              {tAnon("recoveryCodeLabel")}
            </p>

            {/* QR Code */}
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-white rounded-lg">
                <QRCodeSVG
                  value={recoveryCode}
                  size={150}
                  level="H"
                  includeMargin={false}
                />
              </div>
            </div>

            {/* Text Code */}
            <div className="flex items-center justify-between bg-white dark:bg-zinc-900 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <code className="text-lg font-mono font-bold text-zinc-900 dark:text-zinc-100 tracking-wider">
                {recoveryCode}
              </code>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(recoveryCode);
                  toast.success(tAnon("copied"));
                }}
              >
                {tAnon("copy")}
              </Button>
            </div>
            <p className="mt-3 text-xs text-yellow-700 dark:text-yellow-300">
              {tAnon("recoveryWarning")}
            </p>
          </div>

          <Button
            onClick={handleContinue}
            variant="primary"
            size="md"
            className="w-full"
          >
            {tAnon("continue")}
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={t("title")}
      subtitle={
        <>
          {t("alreadyAccount")}{" "}
          <Link
            href={`${basePrefix}/login`}
            className="font-medium text-sky-600 dark:text-sky-400 underline underline-offset-4 decoration-dashed hover:no-underline hover:text-sky-700 dark:hover:text-sky-300 transition-colors duration-200"
          >
            {t("login")}
          </Link>
        </>
      }
      below={
        mode === "email" ? (
          <GoogleButton
            text={t("google")}
            loading={gLoading}
            onClick={onGoogle}
            className="w-full justify-center py-3 text-sm font-medium rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all duration-200 shadow-sm"
          />
        ) : undefined
      }
    >
      {/* Tabs */}
      <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl mb-6">
        <button
          type="button"
          onClick={() => {
            setMode("email");
            setErrors({});
          }}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${mode === "email"
            ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm"
            : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
            }`}
        >
          Email
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("anonymous");
            setErrors({});
          }}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${mode === "anonymous"
            ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm"
            : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
            }`}
        >
          {tAnon("tabLabel")}
        </button>
      </div>

      <form onSubmit={onSubmit} className="space-y-6" noValidate>
        {mode === "email" ? (
          <>
            {/* EMAIL REGISTRATION FIELDS */}
            <div className="space-y-2">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                {t("name")}
              </label>
              <Input
                id="name"
                name="name"
                type="text"
                required
                autoFocus
                aria-invalid={!!errors.name}
                error={!!errors.name}
                placeholder={t("placeholderName")}
                onChange={() =>
                  errors.name && setErrors((e) => ({ ...e, name: undefined }))
                }
              />
              <FieldError message={errors.name} />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                {t("email")}
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                aria-invalid={!!errors.email}
                error={!!errors.email}
                placeholder={t("placeholderEmail")}
                onChange={() =>
                  errors.email && setErrors((e) => ({ ...e, email: undefined }))
                }
              />
              <FieldError message={errors.email} />
            </div>

            <div className="space-y-2">
              <PasswordField
                id="password"
                name="password"
                label={t("password")}
                placeholder={t("placeholderPassword")}
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-200"
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

            <div className="space-y-2">
              <PasswordField
                id="confirm"
                name="confirm"
                label={t("confirmPassword")}
                placeholder={t("confirmPlaceholder")}
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-200"
                minLength={8}
                autoComplete="new-password"
                show={cpw.show}
                onToggle={cpw.toggle}
                onChange={() =>
                  errors.confirm &&
                  setErrors((e) => ({ ...e, confirm: undefined }))
                }
                aria-invalid={!!errors.confirm}
              />
              <FieldError message={errors.confirm} />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="verificationCode"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                {t("verification.label")}
              </label>
              <div className="flex gap-2 w-full">
                <div className="flex-1">
                  <Input
                    id="verificationCode"
                    name="verificationCode"
                    type="text"
                    required
                    maxLength={6}
                    className="flex-1"
                    placeholder={t("verification.placeholder")}
                  />
                </div>
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={handleSendCode}
                  disabled={sendingCode || cooldown > 0}
                  isLoading={sendingCode}
                >
                  {sendingCode
                    ? t("verification.sending")
                    : cooldown > 0
                      ? t("verification.resend", { seconds: cooldown })
                      : t("verification.send")}
                </Button>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {t("verification.help")}
              </p>
            </div>
          </>
        ) : (
          <>
            {/* ANONYMOUS REGISTRATION FIELDS */}
            <div className="space-y-2">
              <label
                htmlFor="username"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                {tAnon("username")}
              </label>
              <Input
                id="username"
                name="username"
                type="text"
                required
                autoFocus
                aria-invalid={!!errors.username}
                error={!!errors.username}
                placeholder={tAnon("placeholderUsername")}
                onChange={() =>
                  errors.username &&
                  setErrors((e) => ({ ...e, username: undefined }))
                }
              />
              <FieldError message={errors.username} />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                {tAnon("name")}{" "}
                <span className="text-zinc-400 font-normal">
                  ({tAnon("optional")})
                </span>
              </label>
              <Input
                id="name"
                name="name"
                type="text"
                aria-invalid={!!errors.name}
                error={!!errors.name}
                placeholder={tAnon("placeholderName")}
                onChange={() =>
                  errors.name && setErrors((e) => ({ ...e, name: undefined }))
                }
              />
              <FieldError message={errors.name} />
            </div>

            <div className="space-y-2">
              <PasswordField
                id="password"
                name="password"
                label={tAnon("password")}
                placeholder={tAnon("placeholderPassword")}
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-200"
                minLength={6}
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
          </>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={loading}
          className="w-full"
        >
          {loading
            ? mode === "email"
              ? t("submitting")
              : tAnon("submitting")
            : mode === "email"
              ? t("submit")
              : tAnon("submit")}
        </Button>
      </form>
    </AuthLayout>
  );
}
