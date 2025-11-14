/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React from "react";
import {
  FiShield,
  FiPlayCircle,
  FiArrowRight,
  FiClock,
  FiCheckCircle,
  FiTarget,
  FiLoader,
} from "react-icons/fi";
import { Trophy, Sparkles } from 'lucide-react';
import { toast, Toaster } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";
import { useRouter } from "next/navigation";

const customToast = {
  success: (message: string, options?: any) => toast.success(message, options),
  error: (message: string, options?: any) => toast.error(message, options),
  info: (message: string, options?: any) => toast(message, options),
};

function Stat({
  number,
  label,
  icon,
  glowColor,
}: {
  number: string;
  label: string;
  icon: React.ReactNode;
  glowColor: string;
}) {
  return (
    <div className="group relative flex flex-col items-center justify-center rounded-3xl bg-white/90 dark:bg-zinc-800/90 backdrop-blur-xl p-6 shadow-2xl ring-1 ring-white/30 dark:ring-zinc-700/50 transition-all duration-500 hover:shadow-3xl hover:scale-[1.03] hover:ring-sky-300 dark:hover:ring-sky-600">
      {/* Glow */}
      <div className={`absolute -inset-1 rounded-3xl bg-gradient-to-br ${glowColor} blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
      
      <div className="relative z-10 mb-4 text-4xl text-sky-600 dark:text-sky-400 transition-transform duration-300 group-hover:scale-125">
        {icon}
      </div>
      <div className="relative z-10 text-3xl font-black tracking-tighter text-zinc-900 dark:text-white">
        {number}
      </div>
      <div className="relative z-10 mt-2 text-sm font-bold uppercase tracking-widest text-zinc-600 dark:text-zinc-400">
        {label}
      </div>
    </div>
  );
}

function PlacementModal({
  open,
  onClose,
  onStart,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onStart: () => void;
  loading: boolean;
}) {
  const { user } = useAuth();
  if (!open || (user && (user as any).lastPlacementAttemptId)) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-slate-900/90 via-sky-900/80 to-slate-900/90 p-4 backdrop-blur-2xl transition-all animate-in fade-in duration-500"
    >
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white/95 dark:bg-zinc-800/95 backdrop-blur-2xl shadow-3xl ring-2 ring-white/30 dark:ring-zinc-700/50 transition-all animate-in zoom-in-90 duration-500">
        {/* Glow Border */}
        <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-sky-400/50 to-sky-600/50 blur-2xl opacity-70" />
        
        <div className="relative z-10 flex items-center justify-between border-b border-white/30 dark:border-zinc-700/50 px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-sky-600 shadow-xl ring-4 ring-white/50">
              <Trophy className="h-7 w-7 text-white" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">
              Mini TOEIC – Placement Test
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-2xl p-3 text-zinc-500 transition-all hover:bg-white/50 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-700/50"
            aria-label="Đóng"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6 px-8 py-8 text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
          <div className="flex items-center gap-4 font-bold text-zinc-800 dark:text-zinc-200">
            <FiClock className="text-2xl text-sky-600 dark:text-sky-400" />
            <span className="text-xl">35 phút</span>
            <span className="text-zinc-400">•</span>
            <span className="text-xl">55 câu</span>
          </div>
          <p className="text-lg">
            Gồm cả <strong className="text-sky-600 dark:text-sky-400">Listening & Reading</strong> (đề rút gọn, mô phỏng cấu trúc thi thật).
          </p>
          <p className="text-lg">
            Hoàn thành <strong className="text-sky-600 dark:text-sky-400">Mini TOEIC 55 câu</strong>, hệ thống sẽ ước lượng{" "}
            <strong className="text-sky-600 dark:text-sky-400">điểm TOEIC (0–990)</strong> và xếp bạn vào{" "}
            <strong className="text-sky-600 dark:text-sky-400">Level 1–3</strong>, kèm gợi ý{" "}
            <span className="font-black text-sky-600 dark:text-sky-400">
              lộ trình học cá nhân hóa
            </span>.
          </p>
          <div className="flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 px-4 py-2 text-sm font-bold uppercase tracking-widest text-amber-700 dark:text-amber-300">
            <Sparkles className="h-4 w-4" />
            <span>Nhận báo cáo chi tiết qua email</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-white/30 dark:border-zinc-700/50 px-8 py-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-2xl border border-white/50 bg-white/80 dark:bg-zinc-800/80 px-6 py-4 text-base font-bold text-zinc-700 dark:text-zinc-300 transition-all hover:bg-white dark:hover:bg-zinc-700 disabled:opacity-50 backdrop-blur-sm"
          >
            Để sau
          </button>
          <button
            onClick={onStart}
            disabled={loading}
            className="group relative flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-sky-600 to-sky-500 px-6 py-4 text-base font-black text-white shadow-2xl transition-all hover:from-sky-500 hover:to-sky-400 hover:shadow-3xl disabled:opacity-70 overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            {loading ? (
              <>
                <FiLoader className="animate-spin text-xl" />
                Đang kiểm tra...
              </>
            ) : (
              <>
                <FiPlayCircle className="text-xl transition-transform group-hover:scale-110" />
                Làm ngay
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Hero() {
  const [openPrompt, setOpenPrompt] = React.useState(false);
  const [checking, setChecking] = React.useState(false);
  const { user } = useAuth();
  const base = useBasePrefix("vi");
  const router = useRouter();

  React.useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const force = params.get("placement") === "1";
      const key = "placement_prompt_last_seen";
      const last = localStorage.getItem(key);
      const now = Date.now();
      const coolDownMs = 24 * 60 * 60 * 1000;

      const shouldOpen = force || !last || now - Number(last) > coolDownMs;
      if (shouldOpen) setOpenPrompt(true);
    } catch {
      setOpenPrompt(true);
    }
  }, []);

  const handleClose = React.useCallback(() => {
    try {
      localStorage.setItem("placement_prompt_last_seen", String(Date.now()));
    } catch {}
    setOpenPrompt(false);
  }, []);

  const handleStart = React.useCallback(async () => {
    if (checking) return;

    try {
      localStorage.setItem("placement_prompt_last_seen", String(Date.now()));
    } catch {}

    if (!user) {
      customToast.error("Vui lòng đăng nhập để làm Mini TOEIC 55 câu", {
        duration: 2500,
      });
      setTimeout(() => {
        router.push(`${base}/login`);
      }, 1000);
      return;
    }

    setChecking(true);
    try {
      const res = await fetch("/api/placement/attempts?limit=1", {
        credentials: "include",
        cache: "no-store",
      });

      if (!res.ok) {
        if (res.status === 401) {
          customToast.error("Phiên đăng nhập đã hết hạn", {
            duration: 3000,
            action: {
              label: "Đăng nhập lại",
              onClick: () => router.push(`${base}/login`),
            },
          });
        } else {
          customToast.error("Không kiểm tra được trạng thái bài kiểm tra");
        }
        return;
      }

      const data = await res.json();
      const total = Number(data?.total ?? 0);
      const firstId = data?.items?.[0]?._id as string | undefined;

      if (total > 0) {
        customToast.error("Bạn đã làm Placement Test rồi", {
          duration: 5000,
          action: {
            label: firstId ? "Xem kết quả" : "Xem lịch sử",
            onClick: () => {
              if (firstId) router.push(`${base}/placement/result/${firstId}`);
              else router.push(`${base}/placement/history`);
            },
          },
        });
        return;
      }

      customToast.info("Bắt đầu Mini TOEIC 55 câu! Chúc bạn làm bài thật tốt", {
        duration: 2500,
      });

      setTimeout(() => {
        router.push(`${base}/placement`);
      }, 2600);
    } catch {
      customToast.error("Không kiểm tra được trạng thái bài kiểm tra");
    } finally {
      setChecking(false);
      setOpenPrompt(false);
    }
  }, [user, checking, router, base]);

  return (
    <>
      <Toaster
        position="top-center"
        richColors
        toastOptions={{
          classNames: {
            toast: "rounded-3xl shadow-2xl border border-white/30 backdrop-blur-xl",
            success: "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white",
            error: "bg-gradient-to-r from-red-600 to-red-500 text-white",
            info: "bg-gradient-to-r from-sky-600 to-sky-500 text-white",
            actionButton: "bg-white/30 hover:bg-white/40 rounded-2xl font-bold",
          },
        }}
      />

      <section className="relative overflow-hidden bg-gradient-to-br from-sky-50 via-white to-sky-50 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900">

        <PlacementModal open={openPrompt} onClose={handleClose} onStart={handleStart} loading={checking} />

        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid items-center gap-20 py-24 lg:gap-24">
            <div className="text-left">
              {/* Badge */}
              <div className="group relative mb-8 inline-flex items-center gap-3 rounded-full bg-white/80 dark:bg-zinc-800/80 backdrop-blur-xl px-6 py-3 shadow-xl ring-2 ring-white/30 dark:ring-zinc-700/50 transition-all duration-500 hover:shadow-2xl hover:scale-105">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-sky-600 shadow-lg ring-2 ring-white/50">
                  <FiShield className="h-6 w-6 text-white" />
                </div>
                <span className="text-base font-black uppercase tracking-widest text-sky-700 dark:text-sky-300">
                  Cấu trúc bám sát đề thi thật
                </span>
                <Sparkles className="h-5 w-5 text-amber-500 animate-pulse" />
              </div>

              {/* Title */}
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-zinc-900 dark:text-white leading-tight">
                Xác định trình độ trong{" "}
                <span className="relative inline-block">
                  <span className="relative z-10 bg-gradient-to-r from-sky-600 via-sky-500 to-sky-400 bg-clip-text text-transparent">
                    35 phút
                  </span>
                  <span className="absolute -inset-1 bg-gradient-to-r from-sky-400/30 to-sky-600/30 blur-2xl -z-10 opacity-70" />
                </span>
              </h1>

              {/* Description */}
              <p className="mt-8 max-w-4xl text-xl leading-relaxed text-zinc-700 dark:text-zinc-300 font-medium">
                Bài <strong className="text-sky-600 dark:text-sky-400">Mini TOEIC 55 câu</strong> (Listening & Reading) giúp bạn ước lượng{" "}
                <strong className="text-sky-600 dark:text-sky-400">điểm TOEIC (0–990)</strong>, xếp{" "}
                <strong className="text-sky-600 dark:text-sky-400">Level 1–3</strong> và đề xuất{" "}
                <span className="font-black text-sky-600 dark:text-sky-400">
                  lộ trình học cá nhân hóa
                </span>.
              </p>

              {/* CTA Buttons */}
              <div className="mt-12 flex flex-col gap-5 sm:flex-row">
                <button
                  onClick={handleStart}
                  disabled={checking}
                  className="group relative inline-flex items-center justify-center gap-4 rounded-3xl bg-gradient-to-r from-sky-600 to-sky-500 px-9 py-5 text-lg font-black text-white shadow-2xl transition-all hover:from-sky-500 hover:to-sky-400 hover:shadow-3xl hover:scale-105 disabled:opacity-70 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  {checking ? (
                    <FiLoader className="animate-spin text-2xl" />
                  ) : (
                    <FiPlayCircle className="text-2xl transition-transform group-hover:scale-110" />
                  )}
                  {checking ? "Đang kiểm tra..." : "Làm Placement Test"}
                </button>

                <button
                  onClick={() => router.push(`${base}/practice/part.1?level=1`)}
                  className="group relative inline-flex items-center justify-center gap-4 rounded-3xl border-2 border-white/50 bg-white/80 dark:bg-zinc-800/80 px-9 py-5 text-lg font-bold text-zinc-800 dark:text-zinc-200 shadow-xl backdrop-blur-xl transition-all hover:bg-white dark:hover:bg-zinc-700 hover:shadow-2xl hover:scale-105"
                >
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-sky-400/20 to-sky-600/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  Xem bộ đề
                  <FiArrowRight className="transition-transform group-hover:translate-x-2" />
                </button>
              </div>

              {/* Stats */}
              <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3">
                <Stat number="55 câu" label="Số lượng câu hỏi" icon={<FiCheckCircle />} glowColor="from-emerald-400/30 to-emerald-600/30" />
                <Stat number="35 phút" label="Thời gian làm bài" icon={<FiClock />} glowColor="from-amber-400/30 to-orange-600/30" />
                <Stat number="0–990" label="Điểm TOEIC ước lượng" icon={<FiTarget />} glowColor="from-sky-400/30 to-sky-600/30" />
              </div>

              {/* Footer Note */}
              <p className="mt-12 text-center text-base font-medium text-zinc-600 dark:text-zinc-400 lg:text-left">
                * Hoàn thành bài kiểm tra để nhận{" "}
                <span className="font-black text-sky-600 dark:text-sky-400">
                  đánh giá chi tiết
                </span>{" "}
                và{" "}
                <span className="font-black text-sky-600 dark:text-sky-400">
                  lộ trình cá nhân hoá
                </span>{" "}
                qua email.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}