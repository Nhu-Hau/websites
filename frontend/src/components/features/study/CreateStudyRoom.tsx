/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useMemo, useState, useCallback, useId } from "react";
import { useRouter } from "next/navigation";
import { Hash, AlertCircle, CheckCircle, Loader2 } from "lucide-react";

import { createRoom } from "@/lib/api/client";
import { useAuth } from "@/context/AuthContext";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";
import { toast } from "@/lib/toast";

interface CreateStudyRoomProps {
  onCreated?: () => void;
  onCancel?: () => void;
}

type Role = "user" | "teacher" | "admin";

function slugifyRoom(input: string): string {
  return input
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

function validateRoom(slug: string): string | null {
  if (!slug) return "Tên phòng không được để trống.";
  if (slug.length < 3) return "Tên phòng phải có ít nhất 3 ký tự.";
  if (slug.length > 32) return "Tên phòng tối đa 32 ký tự.";
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
    return "Chỉ dùng chữ thường, số và dấu gạch (-), không bắt đầu bằng dấu gạch.";
  }
  return null;
}

function cn(...args: Array<string | false | null | undefined>) {
  return args.filter(Boolean).join(" ");
}

export function CreateStudyRoom({ onCreated, onCancel }: CreateStudyRoomProps = {}) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const basePrefix = useBasePrefix(); // không hard-code "vi"
  const { user: authUser, loading: authLoading } = useAuth();

  const role: Role = (authUser?.role as Role) || "user";
  const displayName = authUser?.name || "Guest";
  const userId =
    authUser?.id ||
    `guest-${typeof crypto !== "undefined" ? crypto.randomUUID() : "temp"}`;

  const fieldId = useId();
  const helpId = `${fieldId}-help`;
  const errId = `${fieldId}-err`;

  const normalized = useMemo(() => slugifyRoom(input), [input]);
  const finalSlug = normalized;
  const errorMsg = useMemo(() => validateRoom(finalSlug), [finalSlug]);
  const isValid = !errorMsg && finalSlug.length >= 3;

  const canCreateRoom = role === "teacher" || role === "admin";

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      setInput(slugifyRoom(raw));
    },
    []
  );

  const onCreate = useCallback(async () => {
    if (!isValid) {
      toast.error(errorMsg || "Tên phòng không hợp lệ");
      return;
    }

    if (!canCreateRoom) {
      toast.error("Bạn không có quyền tạo phòng học", {
        description:
          "Chỉ giáo viên và quản trị viên mới có thể tạo phòng học livestream.",
      });
      return;
    }

    setLoading(true);
    try {
      const u = { id: userId, name: displayName, role };
      await createRoom(finalSlug, u);
      onCreated?.();
      toast.success("Phòng đã được tạo!", {
        description: "Đang chuyển đến phòng học…",
        duration: 1800,
      });
      router.push(`${basePrefix}/study/${finalSlug}`);
    } catch (e: any) {
      const message = e?.message || "Không thể tạo phòng. Vui lòng thử lại.";
      if (message.includes("teacher") || message.includes("admin")) {
        toast.error("Bạn không có quyền tạo phòng học", {
          description:
            "Chỉ giáo viên và quản trị viên mới có thể tạo phòng học livestream.",
        });
      } else {
        toast.error("Tạo phòng thất bại", { description: message });
      }
    } finally {
      setLoading(false);
    }
  }, [
    isValid,
    errorMsg,
    canCreateRoom,
    userId,
    displayName,
    role,
    finalSlug,
    onCreated,
    router,
    basePrefix,
  ]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !loading && !authLoading && isValid) {
        e.preventDefault();
        onCreate();
      }
    },
    [loading, authLoading, isValid, onCreate]
  );

  // Yêu cầu đăng nhập
  if (!authUser) {
    return (
      <div className="w-full max-w-md rounded-2xl border border-zinc-200/80 bg-white/95 p-6 shadow-lg ring-1 ring-black/[0.02] dark:border-zinc-800/80 dark:bg-zinc-900/95">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/20">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            <h3 className="mb-1 text-base font-semibold text-zinc-900 dark:text-white">
              Yêu cầu đăng nhập
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Vui lòng đăng nhập để tạo phòng học. Chỉ giáo viên và quản trị
              viên mới có thể tạo phòng.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Không có quyền tạo phòng
  if (!canCreateRoom) {
    return (
      <div className="w-full max-w-md rounded-2xl border border-zinc-200/80 bg-white/95 p-6 shadow-lg ring-1 ring-black/[0.02] dark:border-zinc-800/80 dark:bg-zinc-900/95">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-900/20">
            <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="flex-1">
            <h3 className="mb-1 text-base font-semibold text-zinc-900 dark:text-white">
              Không có quyền tạo phòng
            </h3>
            <p className="mb-1 text-sm text-zinc-600 dark:text-zinc-400">
              Vai trò hiện tại:{" "}
              <span className="capitalize font-medium text-rose-600 dark:text-rose-400">
                {role}
              </span>
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-500">
              Liên hệ quản trị viên để được cấp quyền giáo viên.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Form tạo phòng
  return (
    <div className="w-full max-w-md rounded-2xl border border-zinc-200/80 bg-white/95 p-6 shadow-lg ring-1 ring-black/[0.02] dark:border-zinc-800/80 dark:bg-zinc-900/95">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
          Tạo phòng học mới
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Nhập tên phòng học để bắt đầu buổi học trực tuyến.
        </p>
      </div>

      {/* Form */}
      <div className="space-y-4">
        <div>
          <label
            htmlFor={fieldId}
            className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Tên phòng học
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Hash className="h-5 w-5 text-zinc-400 dark:text-zinc-500" />
            </div>
            <input
              id={fieldId}
              value={input}
              onChange={onInputChange}
              onKeyDown={onKeyDown}
              placeholder="toeic-lr-class"
              className={cn(
                "block w-full rounded-xl border bg-white px-10 py-3 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition-all duration-200 dark:bg-zinc-900 dark:text-white dark:placeholder-zinc-500",
                isValid
                  ? "border-emerald-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/60 dark:border-emerald-700/60"
                  : errorMsg
                  ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-500/60 dark:border-red-700/70"
                  : "border-zinc-300 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/60 dark:border-zinc-700"
              )}
              autoComplete="off"
              aria-invalid={!isValid}
              aria-describedby={`${helpId} ${!isValid ? errId : ""}`}
              disabled={loading}
            />
          </div>

          {/* Validation message */}
          <div className="mt-2 min-h-[18px]">
            {isValid ? (
              <p
                id={helpId}
                className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400"
              >
                <CheckCircle className="h-4 w-4" />
                Tên phòng hợp lệ.
              </p>
            ) : errorMsg ? (
              <p
                id={errId}
                className="flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400"
              >
                <AlertCircle className="h-4 w-4" />
                {errorMsg}
              </p>
            ) : null}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-2 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => onCancel?.()}
            disabled={loading}
            className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Hủy
          </button>

          <button
            type="button"
            onClick={onCreate}
            disabled={loading || authLoading || !isValid}
            className={cn(
              "inline-flex items-center justify-center rounded-xl px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900",
              loading || !isValid
                ? "cursor-not-allowed bg-zinc-300 dark:bg-zinc-700"
                : "bg-sky-600 hover:-translate-y-0.5 hover:bg-sky-700 hover:shadow-md dark:bg-sky-500 dark:hover:bg-sky-400"
            )}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang tạo…
              </>
            ) : (
              "Tạo phòng"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}