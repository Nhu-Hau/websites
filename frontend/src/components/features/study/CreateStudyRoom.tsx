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
  Copy,
  Check,
  AlertCircle,
  CheckCircle,
  Loader2,
  Plus,
  Zap,
  Shield,
  UserCheck,
  Sparkles,
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
      if (message.includes("teacher") || message.includes("admin")) {
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

  if (!authUser) {
    return (
      <div className="relative rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/20">
              <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-1">
              Yêu cầu đăng nhập
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Vui lòng đăng nhập để tạo phòng học. Chỉ giáo viên và quản trị viên mới có thể tạo phòng.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!canCreateRoom) {
    return (
      <div className="relative rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-900/20">
              <AlertCircle className="h-6 w-6 text-rose-600 dark:text-rose-400" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-1">
              Không có quyền tạo phòng
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-2">
              Vai trò hiện tại: <span className="font-medium capitalize text-rose-600 dark:text-rose-400">{role}</span>
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-500">
              Liên hệ quản trị viên để được cấp quyền giáo viên.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Form */}
      <div className="space-y-4">
        <div>
          <label htmlFor={fieldId} className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Tên phòng học
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Hash className="h-5 w-5 text-zinc-400 dark:text-zinc-500" />
            </div>
            <input
              id={fieldId}
              value={input}
              onChange={onInputChange}
              onKeyDown={onKeyDown}
              placeholder="ví dụ: toeic-grammar-class"
              className={cn(
                "block w-full pl-10 pr-4 py-3 rounded-lg border bg-white dark:bg-zinc-900",
                "text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                "transition-all duration-200",
                isValid
                  ? "border-green-300 dark:border-green-700/50 focus:ring-green-500"
                  : errorMsg
                  ? "border-red-300 dark:border-red-700/50 focus:ring-red-500"
                  : "border-zinc-300 dark:border-zinc-700"
              )}
              autoComplete="off"
              aria-invalid={!isValid}
              aria-describedby={`${helpId} ${!isValid ? errId : ""}`}
              disabled={loading}
            />
          </div>

          {/* Validation message */}
          <div className="mt-2 flex items-start gap-2">
            {isValid ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <p id={helpId} className="text-xs text-zinc-600 dark:text-zinc-400">
                  Tên hợp lệ. Nhấn <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-xs font-mono border border-zinc-200 dark:border-zinc-700">Enter</kbd> để tạo nhanh.
                </p>
              </>
            ) : errorMsg ? (
              <>
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p id={errId} className="text-xs text-red-600 dark:text-red-400 font-medium">
                  {errorMsg}
                </p>
              </>
            ) : null}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={onCreate}
            disabled={loading || authLoading || !isValid}
            className={cn(
              "group relative flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-3 rounded-lg",
              "text-sm font-medium text-white transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
              loading || !isValid
                ? "bg-zinc-300 dark:bg-zinc-700 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 shadow-sm hover:shadow"
            )}
            type="button"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Đang tạo…</span>
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                <span>Tạo phòng</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={quickUseSuggestion}
            disabled={loading}
            className="group relative flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Zap className="h-4 w-4" />
            <span>Gợi ý tên</span>
          </button>
        </div>
      </div>
    </div>
  );
}
