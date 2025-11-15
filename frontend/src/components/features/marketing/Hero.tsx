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
import { Trophy, Sparkles } from "lucide-react";
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
}: {
  number: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="group relative flex flex-col items-center justify-center rounded-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm p-6 shadow-sm border border-zinc-200 dark:border-zinc-800 transition-all duration-300 hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700">
      <div className="mb-3 text-2xl text-sky-600 dark:text-sky-400 transition-transform duration-300 group-hover:scale-110">
        {icon}
      </div>
      <div className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
        {number}
      </div>
      <div className="mt-1.5 text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
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
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-zinc-900/80 backdrop-blur-sm p-4 transition-all animate-in fade-in duration-300"
    >
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl border border-zinc-200 dark:border-zinc-800 transition-all animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-sky-600">
              <Trophy className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Mini TOEIC – Placement Test
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-500 transition-all hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
            aria-label="Đóng"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-5 px-6 py-6 text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
          <div className="flex items-center gap-3 font-medium text-zinc-800 dark:text-zinc-200">
            <FiClock className="text-xl text-sky-600 dark:text-sky-400" />
            <span className="text-lg">35 phút</span>
            <span className="text-zinc-400">•</span>
            <span className="text-lg">55 câu</span>
          </div>
          <p className="text-base leading-relaxed">
            Gồm cả <strong className="text-sky-600 dark:text-sky-400">Listening & Reading</strong> (đề rút gọn, mô phỏng cấu trúc thi thật).
          </p>
          <p className="text-base leading-relaxed">
            Hoàn thành <strong className="text-sky-600 dark:text-sky-400">Mini TOEIC 55 câu</strong>, hệ thống sẽ ước lượng{" "}
            <strong className="text-sky-600 dark:text-sky-400">điểm TOEIC (0–990)</strong> và xếp bạn vào{" "}
            <strong className="text-sky-600 dark:text-sky-400">Level 1–3</strong>, kèm gợi ý{" "}
            <span className="font-semibold text-sky-600 dark:text-sky-400">
              lộ trình học cá nhân hóa
            </span>.
          </p>
          <div className="flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 px-4 py-2.5 text-sm font-medium text-amber-700 dark:text-amber-300">
            <Sparkles className="h-4 w-4" />
            <span>Nhận báo cáo chi tiết qua email</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-zinc-200 dark:border-zinc-800 px-6 py-5">
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-zinc-300 bg-white dark:bg-zinc-800 dark:border-zinc-700 px-5 py-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300 transition-all hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-50"
          >
            Để sau
          </button>
          <button
            onClick={onStart}
            disabled={loading}
            className="group relative flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-sky-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:from-sky-500 hover:to-sky-400 disabled:opacity-70 overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            {loading ? (
              <>
                <FiLoader className="animate-spin text-lg" />
                Đang kiểm tra...
              </>
            ) : (
              <>
                <FiPlayCircle className="text-lg transition-transform group-hover:scale-110" />
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
            toast: "rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800",
            success: "bg-emerald-600 text-white",
            error: "bg-red-600 text-white",
            info: "bg-sky-600 text-white",
            actionButton: "bg-white/20 hover:bg-white/30 rounded-lg font-semibold",
          },
        }}
      />

      <section className="relative overflow-hidden bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-900">
        <PlacementModal open={openPrompt} onClose={handleClose} onStart={handleStart} loading={checking} />

        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl py-20 sm:py-28 lg:py-32 text-center">
            {/* Badge */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-sky-50 dark:bg-sky-950/50 px-4 py-2 text-sm font-medium text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-900">
              <FiShield className="h-4 w-4" />
              <span>Cấu trúc bám sát đề thi thật</span>
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            </div>

            {/* Title */}
            <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-6xl lg:text-7xl">
              Xác định trình độ trong{" "}
              <span className="bg-gradient-to-r from-sky-600 via-sky-500 to-sky-400 bg-clip-text text-transparent">
                35 phút
              </span>
            </h1>

            {/* Description */}
            <p className="mt-6 text-lg leading-8 text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
              Bài <strong className="text-zinc-900 dark:text-white">Mini TOEIC 55 câu</strong> (Listening & Reading) giúp bạn ước lượng{" "}
              <strong className="text-zinc-900 dark:text-white">điểm TOEIC (0–990)</strong>, xếp{" "}
              <strong className="text-zinc-900 dark:text-white">Level 1–3</strong> và đề xuất{" "}
              <span className="font-semibold text-sky-600 dark:text-sky-400">
                lộ trình học cá nhân hóa
              </span>.
            </p>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <button
                onClick={handleStart}
                disabled={checking}
                className="group inline-flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-sky-500 px-8 py-3.5 text-base font-semibold text-white shadow-sm transition-all hover:from-sky-500 hover:to-sky-400 hover:shadow-md disabled:opacity-70"
              >
                {checking ? (
                  <FiLoader className="animate-spin text-lg" />
                ) : (
                  <FiPlayCircle className="text-lg transition-transform group-hover:scale-110" />
                )}
                {checking ? "Đang kiểm tra..." : "Làm Placement Test"}
              </button>

              <button
                onClick={() => router.push(`${base}/practice/part.1?level=1`)}
                className="inline-flex items-center justify-center gap-2.5 rounded-xl border border-zinc-300 bg-white dark:bg-zinc-900 dark:border-zinc-700 px-8 py-3.5 text-base font-semibold text-zinc-700 dark:text-zinc-300 transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                Xem bộ đề
                <FiArrowRight className="transition-transform group-hover:translate-x-1" />
              </button>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3">
              <Stat number="55 câu" label="Số lượng câu hỏi" icon={<FiCheckCircle />} />
              <Stat number="35 phút" label="Thời gian làm bài" icon={<FiClock />} />
              <Stat number="0–990" label="Điểm TOEIC ước lượng" icon={<FiTarget />} />
            </div>

            {/* Footer Note */}
            <p className="mt-12 text-sm text-zinc-500 dark:text-zinc-400">
              * Hoàn thành bài kiểm tra để nhận{" "}
              <span className="font-medium text-sky-600 dark:text-sky-400">
                đánh giá chi tiết
              </span>{" "}
              và{" "}
              <span className="font-medium text-sky-600 dark:text-sky-400">
                lộ trình cá nhân hoá
              </span>{" "}
              qua email.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}