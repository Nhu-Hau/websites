/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useMemo, useState, useCallback, useId } from "react";
import { createRoom } from "@/lib/api/client";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";
import { toast } from "sonner";
import {
  Hash,
  Lightbulb,
  Copy,
  Check,
  AlertCircle,
  CheckCircle,
  Loader2,
  Plus,
  Zap,
  Shield,
  UserCheck,
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
  const pool = ["toeic", "ielts", "math", "physics", "english", "grammar"];
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

  const role: Role = (authUser?.role as Role) || "user";
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
        description: "Chỉ giáo viên và quản trị viên mới có thể tạo phòng học livestream.",
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
          description: "Chỉ giáo viên và quản trị viên mới có thể tạo phòng học livestream.",
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

  // === Không đăng nhập ===
  if (!authUser) {
    return (
      <div className="max-w-md mx-auto p-6">
        <div className="rounded-2xl border border-amber-300/50 bg-amber-50/70 dark:bg-amber-900/20 backdrop-blur-sm p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            <h3 className="text-lg font-bold text-amber-900 dark:text-amber-200">
              Yêu cầu đăng nhập
            </h3>
          </div>
          <p className="text-sm text-amber-800 dark:text-amber-300">
            Vui lòng đăng nhập để tạo phòng học. Chỉ giáo viên và quản trị viên mới có thể tạo phòng.
          </p>
        </div>
      </div>
    );
  }

  // === Không có quyền ===
  if (!canCreateRoom) {
    return (
      <div className="max-w-md mx-auto p-6">
        <div className="rounded-2xl border border-red-300/50 bg-red-50/70 dark:bg-red-900/20 backdrop-blur-sm p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            <h3 className="text-lg font-bold text-red-900 dark:text-red-200">
              Không có quyền tạo phòng
            </h3>
          </div>
          <p className="text-sm text-red-800 dark:text-red-300">
            Vai trò hiện tại: <span className="font-semibold capitalize">{role}</span>
          </p>
          <p className="text-xs text-red-700 dark:text-red-400 mt-1">
            Liên hệ quản trị viên để được cấp quyền giáo viên.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header - Thanh trạng thái */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg shadow-blue-500/20">
            <Shield className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Tạo phòng học trực tuyến
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <UserCheck className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              Vai trò: <span className="font-semibold capitalize">{role}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 shadow-sm">
        {/* Label */}
        <label htmlFor={fieldId} className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">
          Tên phòng học
        </label>

        {/* Input + Preview + Button */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <div className="flex items-center border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900/50 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/30 focus-within:border-blue-500 transition-all">
                <Hash className="ml-3 h-5 w-5 text-slate-400" />
                <input
                  id={fieldId}
                  value={input}
                  onChange={onInputChange}
                  onKeyDown={onKeyDown}
                  placeholder="Nhập tên phòng..."
                  className="w-full px-3 py-3.5 text-sm font-medium text-slate-900 dark:text-white bg-transparent outline-none placeholder:text-slate-400"
                  autoComplete="off"
                  aria-invalid={!isValid}
                  aria-describedby={`${helpId} ${!isValid ? errId : ""}`}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={quickUseSuggestion}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 dark:border-slate-600 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 px-5 text-sm font-semibold text-blue-700 dark:text-blue-300 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-800/40 dark:hover:to-indigo-800/40 transition-all duration-200 shadow-sm"
            >
              <Lightbulb className="h-4.5 w-4.5 text-yellow-600 dark:text-yellow-400" />
              Gợi ý
            </button>
          </div>

          {/* Validation Feedback */}
          <div className="flex items-center gap-2.5 text-sm">
            {isValid ? (
              <>
                <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <p id={helpId} className="text-slate-600 dark:text-slate-400">
                  Tên hợp lệ! Nhấn <kbd className="mx-1 px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-xs font-mono">Enter</kbd> để tạo nhanh.
                </p>
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <p id={errId} className="text-red-600 font-medium">
                  {errorMsg}
                </p>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={onCreate}
              disabled={loading || authLoading || !isValid}
              className={cn(
                "group inline-flex items-center justify-center gap-2.5 rounded-xl px-6 py-3.5 text-sm font-bold text-white transition-all duration-200 shadow-md",
                loading || !isValid
                  ? "bg-slate-400 dark:bg-slate-600 cursor-not-allowed opacity-70"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
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
                  <Plus className="h-5 w-5 transition-transform group-hover:scale-110" />
                  Tạo & vào phòng
                </>
              )}
            </button>

            <button
              type="button"
              onClick={quickUseSuggestion}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-medium border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
            >
              <Zap className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              Dùng tên gợi ý
            </button>
          </div>
        </div>
      </div>

      {/* Footer Tip */}
      <p className="mt-5 text-center text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5">
        <Lightbulb className="h-3.5 w-3.5 text-yellow-500" />
        Gõ tên phòng → Nhấn <kbd className="mx-1 px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono">Enter</kbd> để tạo nhanh
      </p>
    </>
  );
}