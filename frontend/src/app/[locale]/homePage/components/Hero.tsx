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
import { toast, Toaster } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useBasePrefix } from "@/hooks/useBasePrefix";
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
    <div className="group flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-5 transition-all hover:shadow-md dark:border-zinc-700 dark:bg-zinc-800">
      <div className="mb-2 text-3xl text-sky-500 transition-transform group-hover:scale-110 dark:text-sky-400">
        {icon}
      </div>
      <div className="text-2xl font-bold text-slate-900 dark:text-zinc-100">
        {number}
      </div>
      <div className="mt-1 text-xs font-medium text-slate-600 dark:text-zinc-400">
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
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 transition-all animate-in zoom-in-95 duration-200 dark:bg-zinc-800 dark:ring-white/10">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-zinc-700">
          <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-100">
            Mini TOEIC – Placement Test
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-zinc-400 dark:hover:bg-zinc-700"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 px-6 py-5 text-sm text-slate-700 dark:text-zinc-300">
          <p className="flex items-center gap-2.5 font-medium text-slate-800 dark:text-zinc-200">
            <FiClock className="text-sky-600 dark:text-sky-500" />
            <span className="font-bold">35 phút</span> •{" "}
            <span className="font-bold">55 câu</span>
          </p>
          <p className="leading-relaxed">
            Gồm cả <strong>Listening & Reading</strong> (đề rút gọn, mô phỏng
            cấu trúc thi thật).
          </p>
          <p className="leading-relaxed">
            Hoàn thành <strong>Mini TOEIC 55 câu</strong>, hệ thống sẽ ước lượng{" "}
            <strong>điểm TOEIC (0–990)</strong> và xếp bạn vào{" "}
            <strong>Level 1–3</strong>, kèm gợi ý{" "}
            <strong className="text-sky-600 dark:text-sky-400">
              lộ trình học phù hợp
            </strong>
            .
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-slate-200 px-6 py-5 dark:border-zinc-700">
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
          >
            Để sau
          </button>
          <button
            onClick={onStart}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-sky-500 disabled:opacity-70"
          >
            {loading ? (
              <>
                <FiLoader className="animate-spin" /> Đang kiểm tra...
              </>
            ) : (
              "Làm ngay"
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
      // ✅ push sang trang đăng nhập nếu chưa đăng nhập
      customToast.error("Vui lòng đăng nhập để làm Mini TOEIC 55 câu", {
        duration: 2500,
      });
      setTimeout(() => {
        router.push(`${base}/auth/login`);
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
              onClick: () => router.push(`${base}/auth/login`),
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
      {/* Toaster cấu hình chuẩn màu web */}
      <Toaster
        position="top-center"
        richColors
        toastOptions={{
          classNames: {
            toast:
              "rounded-xl shadow-lg border border-slate-200 dark:border-zinc-700",
            success: "bg-emerald-600 text-white",
            error: "bg-red-600 text-white",
            info: "bg-sky-600 text-white",
            actionButton: "bg-white/20 hover:bg-white/30",
          },
        }}
      />

      <section className="relative overflow-hidden bg-gradient-to-b from-white via-sky-50/30 to-white dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-32 h-96 bg-[radial-gradient(700px_300px_at_50%_-100px,rgba(14,165,233,0.15),transparent)] dark:bg-[radial-gradient(700px_300px_at_50%_-100px,rgba(14,165,233,0.08),transparent)]"
        />

        <PlacementModal
          open={openPrompt}
          onClose={handleClose}
          onStart={handleStart}
          loading={checking}
        />

        <div className="mx-auto max-w-[1350px] px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 pt-20 pb-10 lg:gap-16">
            <div className="text-left">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/80 px-4 py-1.5 text-sm font-medium text-sky-700 backdrop-blur-sm dark:border-sky-800/50 dark:bg-zinc-800/80 dark:text-sky-400">
                <FiShield className="text-lg" /> Cấu trúc bám sát đề thi thật
              </div>

              <h1 className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text dark:bg-none dark:text-white text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Xác định trình độ trong{" "}
                <span className="text-sky-600 dark:text-sky-400">35 phút</span>
              </h1>

              <p className="mt-6 max-w-3xl text-base leading-7 text-slate-600 dark:text-zinc-400 lg:text-lg">
                Bài <strong>Mini TOEIC 55 câu</strong> (Listening & Reading)
                giúp bạn ước lượng <strong>điểm TOEIC (0–990)</strong>, xếp{" "}
                <strong>Level 1–3</strong> và đề xuất{" "}
                <strong className="text-sky-600 dark:text-sky-400">
                  lộ trình học cá nhân hóa
                </strong>
                .
              </p>

              <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row lg:justify-start">
                <button
                  onClick={handleStart}
                  disabled={checking}
                  className="group inline-flex items-center gap-2.5 rounded-xl bg-sky-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg transition-all hover:bg-sky-500 hover:shadow-xl disabled:opacity-70"
                >
                  {checking ? (
                    <FiLoader className="animate-spin" />
                  ) : (
                    <FiPlayCircle className="text-xl transition-transform group-hover:scale-110" />
                  )}
                  {checking ? "Đang kiểm tra..." : "Làm Placement Test"}
                </button>

                <button
                  onClick={() => router.push(`${base}/practice/part.1?level=1`)}
                  className="inline-flex items-center gap-2.5 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-base font-medium text-slate-800 transition-all hover:bg-slate-50 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                >
                  Xem bộ đề{" "}
                  <FiArrowRight className="transition-transform group-hover:translate-x-1" />
                </button>
              </div>

              <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
                <Stat
                  number="55 câu"
                  label="Số lượng câu hỏi"
                  icon={<FiCheckCircle />}
                />
                <Stat
                  number="35 phút"
                  label="Thời gian làm bài"
                  icon={<FiClock />}
                />
                <Stat
                  number="0–990"
                  label="Điểm TOEIC ước lượng"
                  icon={<FiTarget />}
                />
              </div>

              <p className="mt-6 text-center text-xs text-slate-500 dark:text-zinc-500 lg:text-left">
                * Hoàn thành bài kiểm tra để nhận{" "}
                <span className="font-semibold text-sky-600 dark:text-sky-400">
                  đánh giá chi tiết
                </span>{" "}
                và{" "}
                <span className="font-semibold text-sky-600 dark:text-sky-400">
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
