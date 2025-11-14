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
      <div className="max-w-md mx-auto p-6">
        <div className="group relative rounded-3xl bg-white/90 dark:bg-zinc-800/90 backdrop-blur-xl shadow-2xl ring-2 ring-white/30 dark:ring-zinc-700/50 p-6 transition-all duration-500 hover:shadow-3xl hover:scale-[1.005] hover:ring-amber-300/50 dark:hover:ring-amber-600/50 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
          
          <div className="relative flex items-center gap-3 mb-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-xl ring-3 ring-white/50 dark:ring-zinc-800/50">
              <AlertCircle className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-lg font-black text-zinc-900 dark:text-white">
              Yêu cầu đăng nhập
            </h3>
          </div>
          <p className="relative text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Vui lòng đăng nhập để tạo phòng học. Chỉ giáo viên và quản trị viên mới có thể tạo phòng.
          </p>
        </div>
      </div>
    );
  }

  if (!canCreateRoom) {
    return (
      <div className="max-w-md mx-auto p-6">
        <div className="group relative rounded-3xl bg-white/90 dark:bg-zinc-800/90 backdrop-blur-xl shadow-2xl ring-2 ring-white/30 dark:ring-zinc-700/50 p-6 transition-all duration-500 hover:shadow-3xl hover:scale-[1.005] hover:ring-rose-300/50 dark:hover:ring-rose-600/50 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
          
          <div className="relative flex items-center gap-3 mb-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 shadow-xl ring-3 ring-white/50 dark:ring-zinc-800/50">
              <AlertCircle className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-lg font-black text-zinc-900 dark:text-white">
              Không có quyền tạo phòng
            </h3>
          </div>
          <p className="relative text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Vai trò hiện tại: <span className="font-black capitalize text-rose-600 dark:text-rose-400">{role}</span>
          </p>
          <p className="relative text-xs font-medium text-zinc-600 dark:text-zinc-400 mt-1">
            Liên hệ quản trị viên để được cấp quyền giáo viên.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 p-px shadow-xl ring-3 ring-white/50 dark:ring-zinc-800/50">
              <div className="flex h-full w-full items-center justify-center rounded-2xl bg-white dark:bg-zinc-900 backdrop-blur-md">
                <Shield className="h-7 w-7 text-blue-600 dark:text-blue-400 drop-shadow-md" />
              </div>
            </div>
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-400/40 to-indigo-400/40 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>
          <div>
            <h1 className="text-xl font-black text-zinc-900 dark:text-white">
              Tạo phòng học trực tuyến
            </h1>
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
              <UserCheck className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              Vai trò: <span className="font-black capitalize">{role}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Card */}
      <div className="group relative rounded-3xl bg-white/90 dark:bg-zinc-800/90 backdrop-blur-xl p-6 shadow-2xl ring-2 ring-white/30 dark:ring-zinc-700/50 transition-all duration-500 hover:shadow-3xl hover:scale-[1.005] hover:ring-blue-300/50 dark:hover:ring-blue-600/50 overflow-hidden">
        
        <label htmlFor={fieldId} className="relative block text-sm font-black text-zinc-700 dark:text-zinc-200 mb-3">
          Tên phòng học
        </label>

        <div className="relative space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <div className="flex items-center border-2 border-white/30 dark:border-zinc-700/50 rounded-2xl bg-white/90 dark:bg-zinc-800/90 overflow-hidden focus-within:ring-4 focus-within:ring-blue-500/30 focus-within:border-blue-500 transition-all duration-300 shadow-md">
                <Hash className="ml-3 h-5 w-5 text-zinc-400 dark:text-zinc-500" />
                <input
                  id={fieldId}
                  value={input}
                  onChange={onInputChange}
                  onKeyDown={onKeyDown}
                  placeholder="Nhập tên phòng..."
                  className="w-full px-3 py-3.5 text-sm font-medium text-zinc-900 dark:text-white bg-transparent outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                  autoComplete="off"
                  aria-invalid={!isValid}
                  aria-describedby={`${helpId} ${!isValid ? errId : ""}`}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-sm">
            {isValid ? (
              <>
                <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <p id={helpId} className="text-zinc-600 dark:text-zinc-400 font-medium">
                  Tên hợp lệ! Nhấn <kbd className="mx-1 px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-xs font-mono">Enter</kbd> để tạo nhanh.
                </p>
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <p id={errId} className="text-red-600 font-black">
                  {errorMsg}
                </p>
              </>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={onCreate}
              disabled={loading || authLoading || !isValid}
              className={cn(
                "group inline-flex items-center justify-center gap-2.5 rounded-2xl px-6 py-3.5 text-sm font-black text-white transition-all duration-300 shadow-xl",
                loading || !isValid
                  ? "bg-zinc-400 dark:bg-zinc-600 cursor-not-allowed opacity-70"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]"
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
              className="group/quick relative inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-black border-2 border-white/30 dark:border-zinc-700/50 bg-white/90 dark:bg-zinc-800/90 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-amber-500/5 opacity-0 group-hover/quick:opacity-100 transition-opacity duration-300" />
              <Zap className="h-4 w-4 text-yellow-600 dark:text-yellow-400 relative z-10 transition-transform group-hover/quick:scale-110" />
              <span className="relative z-10">Dùng tên gợi ý</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}