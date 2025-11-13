/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useMemo, useState, useCallback, useId } from "react";
import { createRoom } from "@/lib/api/client";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";
import { toast } from "sonner";
import {
  Loader2,
  PlusCircle,
  Sparkles,
  ShieldCheck,
  Link as LinkIcon,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";

interface CreateStudyRoomProps {
  onCreated?: () => void;
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

function randomSuggestion(): string {
  const n = Math.floor(1000 + Math.random() * 9000);
  const pool = ["toeic", "study", "practice", "listening", "reading", "grammar"];
  const pick = pool[Math.floor(Math.random() * pool.length)];
  return `${pick}-room-${n}`;
}

function cn(...args: Array<string | false | null | undefined>) {
  return args.filter(Boolean).join(" ");
}

function validateRoom(slug: string): string | null {
  if (!slug) return "Tên phòng không được để trống.";
  if (slug.length < 3) return "Tên phòng phải có ít nhất 3 ký tự.";
  if (slug.length > 32) return "Tên phòng tối đa 32 ký tự.";
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug))
    return "Chỉ dùng chữ thường, số và dấu gạch (-), không bắt đầu bằng dấu gạch.";
  return null;
}

export function CreateStudyRoom({ onCreated }: CreateStudyRoomProps = {}) {
  const [input, setInput] = useState("");
  const [room, setRoom] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const router = useRouter();
  const basePrefix = useBasePrefix("vi");
  const { user: authUser, loading: authLoading } = useAuth();

  const role: Role = (authUser?.role as Role) || "user"; // đồng bộ với trang list
  const displayName = authUser?.name || "Guest";
  const userId = authUser?.id || `guest-${crypto.randomUUID()}`;

  const fieldId = useId();
  const helpId = `${fieldId}-help`;
  const errId = `${fieldId}-err`;

  const normalized = useMemo(() => slugifyRoom(input), [input]);
  const finalSlug = room || normalized;
  const errorMsg = useMemo(() => validateRoom(finalSlug), [finalSlug]);
  const isValid = !errorMsg && finalSlug.length >= 3;

  const canCreateRoom = role === "teacher" || role === "admin";

  const quickUseSuggestion = useCallback(() => {
    const sug = slugifyRoom(randomSuggestion());
    setInput(sug);
    setRoom(sug);
    toast.success("Đã gợi ý tên phòng!", { duration: 1500 });
  }, []);

  const onInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setInput(raw);
    setRoom(slugifyRoom(raw));
  }, []);

  const copySlug = useCallback(() => {
    if (!finalSlug) return;
    navigator.clipboard.writeText(finalSlug);
    setCopied(true);
    toast.success("Đã sao chép tên phòng!", { duration: 1500 });
    setTimeout(() => setCopied(false), 1500);
  }, [finalSlug]);

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
      const errorCode = e?.code || "";
      const errorStatus = e?.status || 0;

      if (
        errorCode === "TEACHER_OR_ADMIN_REQUIRED" ||
        errorStatus === 403 ||
        message.includes("teacher") ||
        message.includes("admin")
      ) {
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
  }, [finalSlug, isValid, errorMsg, userId, displayName, role, canCreateRoom, onCreated, router, basePrefix]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !loading && !authLoading && isValid) {
        e.preventDefault();
        onCreate();
      }
    },
    [loading, authLoading, isValid, onCreate]
  );

  // Nếu chưa đăng nhập
  if (!authUser) {
    return (
      <div className="w-full mx-auto">
        <div className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/80 dark:bg-amber-900/20 backdrop-blur-sm p-6">
          <div className="flex items-center gap-3 mb-3">
            <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <h3 className="text-lg font-bold text-amber-900 dark:text-amber-200">
              Yêu cầu đăng nhập
            </h3>
          </div>
          <p className="text-sm text-amber-800 dark:text-amber-300">
            Vui lòng đăng nhập để tạo phòng học. Chỉ giáo viên và quản trị viên mới có thể tạo phòng học livestream.
          </p>
        </div>
      </div>
    );
  }

  // Không có quyền
  if (!canCreateRoom) {
    return (
      <div className="w-full mx-auto">
        <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50/80 dark:bg-red-900/20 backdrop-blur-sm p-6">
          <div className="flex items-center gap-3 mb-3">
            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0" />
            <h3 className="text-lg font-bold text-red-900 dark:text-red-200">
              Không có quyền tạo phòng
            </h3>
          </div>
          <p className="text-sm text-red-800 dark:text-red-300 mb-1">
            Vai trò hiện tại của bạn: <span className="font-semibold capitalize">{role}</span>.
          </p>
          <p className="text-xs text-red-700 dark:text-red-400">
            Nếu bạn là giáo viên nhưng chưa có quyền, vui lòng liên hệ quản trị viên để được cấp quyền.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-md">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
              Tạo phòng học trực tuyến
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Vai trò: <span className="font-semibold capitalize">{role}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Card */}
      <div>
        <label
          htmlFor={fieldId}
          className="block text-sm font-bold text-zinc-800 dark:text-zinc-200 mb-3"
        >
          Tên phòng học
        </label>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <input
              id={fieldId}
              value={input}
              onChange={onInputChange}
              onKeyDown={onKeyDown}
              placeholder=""
              className={cn(
                "w-full rounded-xl border px-4 py-3 text-sm font-medium outline-none transition-all duration-300",
                "bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm",
                isValid
                  ? "border-zinc-300 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  : "border-rose-400 focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
              )}
              aria-invalid={!isValid}
              aria-describedby={`${helpId} ${!isValid ? errId : ""}`}
              autoComplete="off"
            />

            {/* Slug Preview */}
            <div className="absolute -bottom-6 left-0 right-0 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                <code className="font-mono bg-zinc-100 dark:bg-zinc-700 px-1.5 py-0.5 rounded">
                  {finalSlug || "—"}
                </code>
                {finalSlug && (
                  <button
                    onClick={copySlug}
                    className="group flex items-center gap-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                    title="Sao chép tên phòng"
                    type="button"
                  >
                    {copied ? (
                      <Check className="h-3 w-3 text-emerald-600" />
                    ) : (
                      <Copy className="h-3 w-3 group-hover:scale-110 transition-transform" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={quickUseSuggestion}
            className="group inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-3 text-sm font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 hover:border-emerald-500 transition-all duration-300"
          >
            <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400 transition-transform group-hover:scale-110" />
            Gợi ý
          </button>
        </div>

        {/* Validation Message */}
        <div className="mt-8 flex items-center gap-2">
          {isValid ? (
            <>
              <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
              <p id={helpId} className="text-xs text-zinc-600 dark:text-zinc-400">
                Tên hợp lệ! Nhấn{" "}
                <kbd className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-[10px] font-mono">
                  Enter
                </kbd>{" "}
                để tạo nhanh.
              </p>
            </>
          ) : (
            <>
              <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0" />
              <p id={errId} className="text-xs text-rose-600 font-medium">
                {errorMsg}
              </p>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            onClick={onCreate}
            disabled={loading || authLoading || !isValid}
            className={cn(
              "group inline-flex items-center justify-center gap-2.5 rounded-xl px-6 py-3 text-sm font-bold text-white transition-all duration-300 shadow-md",
              loading || !isValid
                ? "bg-zinc-400 dark:bg-zinc-600 cursor-not-allowed opacity-70"
                : "bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 hover:shadow-lg hover:scale-[1.02]"
            )}
            type="button"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Đang tạo…
              </>
            ) : (
              <>
                <PlusCircle className="h-5 w-5 transition-transform group-hover:scale-110" />
                Tạo & vào phòng
              </>
            )}
          </button>

          <button
            type="button"
            onClick={quickUseSuggestion}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-medium border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all"
          >
            <LinkIcon className="h-4 w-4" />
            Dùng tên gợi ý
          </button>
        </div>
      </div>

      {/* Footer Tip */}
      <p className="mt-5 text-xs text-center text-zinc-500 dark:text-zinc-400 flex items-center justify-center gap-1.5">
        <Sparkles className="h-3.5 w-3.5 text-amber-500" />
        Gõ tên phòng → Nhấn{" "}
        <kbd className="mx-1 px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 font-mono">
          Enter
        </kbd>{" "}
        để tạo nhanh
      </p>
    </div>
  );
}