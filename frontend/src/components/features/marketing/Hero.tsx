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
    <div className="group flex flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-4 text-center shadow-sm backdrop-blur-sm transition-all hover:-translate-y-1 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-800/90">
      <div className="mb-2 text-2xl text-sky-500 transition-transform group-hover:scale-110 dark:text-sky-400">
        {icon}
      </div>
      <div className="text-xl font-bold text-slate-900 dark:text-zinc-100">
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
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 animate-in zoom-in-95 duration-200 dark:bg-zinc-800 dark:ring-white/10">
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
    } catch {
      // ignore
    }
    setOpenPrompt(false);
  }, []);

  const handleStart = React.useCallback(async () => {
    if (checking) return;

    try {
      localStorage.setItem("placement_prompt_last_seen", String(Date.now()));
    } catch {
      // ignore
    }

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
              if (firstId) {
                router.push(`${base}/placement/result/${firstId}`);
              } else {
                router.push(`${base}/placement/history`);
              }
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
      {/* Toaster */}
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

      <PlacementModal
        open={openPrompt}
        onClose={handleClose}
        onStart={handleStart}
        loading={checking}
      />

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white pt-20">
        {/* Background effects */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-32 h-72 bg-[radial-gradient(700px_300px_at_50%_-100px,rgba(56,189,248,0.25),transparent)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(600px_600px_at_100%_20%,rgba(59,130,246,0.18),transparent)] opacity-80"
        />

        {/* MAIN CONTAINER */}
        <div className="relative mx-auto flex max-w-[1380px] flex-col px-4 xs:px-5 sm:px-6 lg:px-8">
          {/* CONTENT */}
          <div
            className="grid grid-cols-1 items-center gap-8 pb-20 pt-4 xs:gap-9 xs:pb-24 sm:gap-10 sm:pb-28 lg:grid-cols-3 lg:gap-12 lg:pb-32"
          >
            {/* LEFT TEXT */}
            <div className="lg:col-span-2 text-center lg:text-start">
              <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-sky-400/40 bg-sky-500/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-sky-100 backdrop-blur-sm xs:text-xs lg:mx-0">
                <FiShield className="text-sm" />
                <span>Cấu trúc bám sát đề thi TOEIC thật</span>
              </div>

              <h1 className="font-bold tracking-tight text-white text-4xl sm:text-5xl lg:text-6xl">
                Xây lộ trình{" "}
                <span className="text-sky-300">TOEIC thông minh</span> cho riêng
                bạn
              </h1>

              <p className="mt-4 text-xs leading-relaxed text-slate-300 xs:text-sm sm:mt-5 sm:text-base md:text-lg">
                Chỉ với <strong>35 phút</strong> làm{" "}
                <strong>Mini TOEIC 55 câu</strong>, hệ thống sẽ ước lượng{" "}
                <strong>điểm TOEIC (0–990)</strong>, xếp{" "}
                <strong>Level 1–3</strong> và đề xuất{" "}
                <span className="font-semibold text-sky-200">
                  lộ trình học cá nhân hóa
                </span>
                .
              </p>

              {/* CTA */}
              <div className="mt-7 flex flex-col items-center gap-3 xs:flex-row xs:justify-center xs:gap-4 lg:justify-start">
                <button
                  onClick={handleStart}
                  disabled={checking}
                  className="group inline-flex w-full max-w-[280px] items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-white shadow-lg shadow-emerald-500/30 transition-all hover:bg-emerald-400 hover:shadow-emerald-400/40 disabled:opacity-70 xs:w-auto sm:text-sm"
                >
                  {checking ? (
                    <FiLoader className="animate-spin text-base" />
                  ) : (
                    <FiPlayCircle className="text-base" />
                  )}
                  {checking ? "Đang kiểm tra..." : "Bắt đầu Mini TOEIC 55 câu"}
                </button>

                <button
                  onClick={() => router.push(`${base}/practice/part.1?level=1`)}
                  className="inline-flex w-full max-w-[260px] items-center justify-center gap-2 rounded-xl border border-slate-600 bg-slate-900/40 px-5 py-2.5 text-xs font-medium text-slate-100 transition-all hover:border-slate-400 hover:bg-slate-800/80 xs:w-auto sm:text-sm"
                >
                  Xem bộ đề luyện tập
                  <FiArrowRight className="text-sm" />
                </button>
              </div>

              {/* META */}
              <p className="mt-4 text-[11px] text-slate-400 xs:text-xs sm:text-sm">
                * Sau khi làm bài sẽ nhận{" "}
                <span className="font-semibold text-sky-200">
                  báo cáo chi tiết
                </span>{" "}
                và{" "}
                <span className="font-semibold text-sky-200">
                  lộ trình học cá nhân hóa
                </span>{" "}
                gửi qua email.
              </p>

              {/* STATS */}
              <div className="mt-7 grid max-w-md grid-cols-3 gap-3 xs:gap-4 xs:mt-8 mx-auto lg:mx-0">
                <Stat
                  number="55 câu"
                  label="Mini TOEIC"
                  icon={<FiCheckCircle />}
                />
                <Stat number="35 phút" label="Thời gian" icon={<FiClock />} />
                <Stat
                  number="0–990"
                  label="Điểm ước lượng"
                  icon={<FiTarget />}
                />
              </div>
            </div>

            {/* RIGHT CARD */}
            <div className="flex items-center justify-center w-full col-span-1">
              <div className="relative w-full max-w-xs xs:max-w-sm sm:max-w-md">
                {/* GLOW */}
                <div
                  aria-hidden
                  className="absolute inset-0 -translate-y-4 scale-105 rounded-3xl bg-gradient-to-br from-sky-500/30 via-emerald-400/20 to-sky-600/10 blur-3xl"
                />

                {/* CARD */}
                <div className="relative rounded-3xl bg-slate-900/80 p-5 xs:p-6 shadow-2xl ring-1 ring-sky-500/30 backdrop-blur-md">
                  {/* TITLE */}
                  <div className="mb-4 flex xl:flex-row lg:flex-col flex-row xl:items-center xl:justify-between lg:items-start items-center gap-3">
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-300">
                        Bài kiểm tra đang chờ
                      </span>
                      <div className="mt-1 text-sm font-semibold text-white xs:text-base">
                        Mini TOEIC – Placement Test
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-3 py-1 text-[10px] font-medium text-sky-200 xs:text-[11px]">
                      <FiClock className="text-xs" />
                      35 phút
                    </span>
                  </div>

                  {/* STEPS */}
                  <div className="space-y-2 text-[11px] text-slate-300 xs:text-xs">
                    <p className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-[10px] text-emerald-300">
                        1
                      </span>
                      Làm bài Mini TOEIC rút gọn.
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-500/20 text-[10px] text-sky-200">
                        2
                      </span>
                      Hệ thống ước lượng điểm & xếp level.
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-500/20 text-[10px] text-violet-200">
                        3
                      </span>
                      Gợi ý lộ trình học phù hợp.
                    </p>
                  </div>

                  {/* TAGS */}
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[10px] text-slate-300 xs:gap-3 xs:text-[11px]">
                    <div className="rounded-2xl bg-slate-800/80 px-2 py-3">
                      <div className="text-xs font-semibold text-slate-100">
                        Listening
                      </div>
                      <div className="mt-1 text-[10px] text-sky-200">
                        Part 1–4
                      </div>
                    </div>

                    <div className="rounded-2xl bg-slate-800/80 px-2 py-3">
                      <div className="text-xs font-semibold text-slate-100">
                        Reading
                      </div>
                      <div className="mt-1 text-[10px] text-sky-200">
                        Part 5–7
                      </div>
                    </div>

                    <div className="rounded-2xl bg-slate-800/80 px-2 py-3">
                      <div className="text-xs font-semibold text-slate-100">
                        Lộ trình
                      </div>
                      <div className="mt-1 text-[10px] text-sky-200">
                        Tự động
                      </div>
                    </div>
                  </div>

                  {/* CTA */}
                  <button
                    onClick={handleStart}
                    disabled={checking}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-500 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-white shadow-lg shadow-sky-500/40 transition-all hover:bg-sky-400 hover:shadow-sky-400/50 disabled:opacity-70 xs:text-xs"
                  >
                    {checking ? (
                      <FiLoader className="animate-spin text-sm" />
                    ) : (
                      <FiPlayCircle className="text-sm" />
                    )}
                    {checking ? "Đang kiểm tra..." : "Bắt đầu ngay bây giờ"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* WAVE — FULL WIDTH 100vw, KHÔNG BỊ MAX-W */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 bottom-0 w-[100vw] -translate-x-1/2 text-slate-50 dark:text-zinc-950"
        >
          <svg
            className="block h-12 w-full xs:h-16 sm:h-20 md:h-24"
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
          >
            <path
              fill="currentColor"
              d="M0,256L60,245.3C120,235,240,213,360,197.3C480,181,600,171,720,181.3C840,192,960,224,1080,229.3C1200,235,1320,213,1380,202.7L1440,192L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
            />
          </svg>
        </div>
      </section>
    </>
  );
}
