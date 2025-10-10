/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React from "react";
import Link from "next/link";
import {
  FiShield,
  FiPlayCircle,
  FiArrowRight,
  FiBarChart2,
  FiClock,
  FiCheckCircle,
  FiTarget,
} from "react-icons/fi";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

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
    <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-4 dark:border-zinc-700 dark:bg-zinc-800">
      <div className="mb-1 text-2xl text-sky-500 dark:text-sky-400">{icon}</div>
      <div className="text-xl font-extrabold text-slate-900 dark:text-zinc-100">
        {number}
      </div>
      <div className="text-xs text-slate-600 dark:text-zinc-400">{label}</div>
    </div>
  );
}

function PlacementModal({
  open,
  onClose,
  onStart,
}: {
  open: boolean;
  onClose: () => void;
  onStart: () => void;
}) {
  const { user } = useAuth();
  // nếu đã có attempt placement thì ẩn modal
  if (!open || (user && (user as any).lastPlacementAttemptId)) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 p-4"
    >
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-zinc-800">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-zinc-700">
          <h2 className="text-base font-semibold text-slate-900 dark:text-zinc-100">
            Mini TOEIC – Placement Test
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-700"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 px-5 py-4 text-sm text-slate-700 dark:text-zinc-300">
          <p className="flex items-center gap-2 text-slate-800 dark:text-zinc-200">
            <FiClock className="text-sky-600 dark:text-sky-500" />{" "}
            <b>35 phút</b> • <b>55 câu</b>
          </p>
          <p>
            Gồm cả Listening & Reading (đề rút gọn mô phỏng cấu trúc thi thật).
          </p>
          <p>
            Hoàn thành <b>Mini TOEIC 55 câu</b>, hệ thống sẽ ước lượng{" "}
            <b>điểm TOEIC (0–990)</b> và xếp bạn vào <b>Level 1–4</b>, kèm gợi ý{" "}
            <b>lộ trình học phù hợp</b>.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-slate-200 px-5 py-4 dark:border-zinc-700">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-slate-800 hover:bg-slate-50 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
          >
            Để sau
          </button>
          <button
            onClick={onStart}
            className="rounded-xl bg-sky-600 px-4 py-2 font-semibold text-white hover:bg-sky-500"
          >
            Làm ngay
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
    try {
      localStorage.setItem("placement_prompt_last_seen", String(Date.now()));
    } catch {}

    // Chưa đăng nhập
    if (!user) {
      toast.error("Vui lòng đăng nhập để làm Mini TOEIC 55 câu", {
        duration: 2500,
        action: {
          label: "Đăng nhập",
          onClick: () => (window.location.href = "/auth/login"),
        },
      });
      return;
    }

    // Đã đăng nhập → kiểm tra đã làm placement chưa
    if (checking) return;
    setChecking(true);
    try {
      const res = await fetch("/api/placement/attempts?limit=1", {
        credentials: "include",
        cache: "no-store",
      });

      if (!res.ok) {
        if (res.status === 401) {
          toast.error("Phiên đăng nhập đã hết hạn", {
            duration: 3000,
            action: {
              label: "Đăng nhập lại",
              onClick: () => (window.location.href = "/auth/login"),
            },
          });
        } else {
          toast.error("Không kiểm tra được trạng thái bài kiểm tra");
        }
        return;
      }

      const data = await res.json();
      const total = Number(data?.total ?? 0);
      const firstId = data?.items?.[0]?._id as string | undefined;

      if (total > 0) {
        // ĐÃ LÀM RỒI → show toast có nút xem lại
        toast.error("Bạn đã làm Placement Test rồi, không thể làm lại", {
          duration: 5000,
          action: {
            label: firstId ? "Xem kết quả" : "Xem lịch sử",
            onClick: () => {
              if (firstId) {
                window.location.href = `/placement/result/${firstId}`;
              } else {
                window.location.href = `/placement/history`;
              }
            },
          },
        });
        return;
      }

      toast.info("Bắt đầu Mini TOEIC 55 câu! Chúc bạn làm bài thật tốt", {
        duration: 2500,
      });

      setTimeout(() => {
        window.location.href = "/placement";
      }, 2500); 
    } catch {
      toast.error("Không kiểm tra được trạng thái bài kiểm tra");
    } finally {
      setChecking(false);
    }
  }, [user, checking]);

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-indigo-50/50 to-white dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-900">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-24 h-[360px] bg-[radial-gradient(600px_200px_at_50%_-50px,rgba(99,102,241,0.20),transparent)] dark:bg-[radial-gradient(600px_200px_at-50%_-50px,rgba(99,102,241,0.10),transparent)]"
      />

      <PlacementModal
        open={openPrompt}
        onClose={handleClose}
        onStart={handleStart}
      />

      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pt-24 pb-5 sm:px-6">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-3 py-1 text-xs text-sky-700 dark:border-sky-900/50 dark:bg-zinc-800 dark:text-sky-400">
            <FiShield /> Cấu trúc bám sát đề thi thật
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-100 md:text-6xl">
            Xác định trình độ trong{" "}
            <span className="text-sky-500 dark:text-sky-400">35 phút</span>
          </h1>

          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600 dark:text-zinc-400 md:text-lg">
            Bài <b>Mini TOEIC 55 câu</b> (Listening & Reading) giúp bạn ước
            lượng <b>điểm TOEIC (0–990)</b>, xếp <b>Level 1–4</b> và đề xuất{" "}
            <b>lộ trình học cá nhân hóa</b>. Sau đó bạn có thể luyện các đề đầy
            đủ, mô phỏng phòng thi và chấm điểm tức thì.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              onClick={handleStart}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-5 py-3 font-semibold text-white hover:bg-sky-400"
            >
              <FiPlayCircle />
              Làm Placement Test
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-slate-800 hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            >
              Xem bộ đề <FiArrowRight />
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-4 text-center md:max-w-xl">
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
              number="Dự đoán 0–990"
              label="Điểm TOEIC ước lượng"
              icon={<FiTarget />}
            />
          </div>

          <p className="mt-4 text-xs text-slate-500 dark:text-zinc-500">
            * Hoàn thành bài kiểm tra để nhận bản{" "}
            <span className="font-semibold dark:text-zinc-400">
              đánh giá chi tiết
            </span>{" "}
            (theo từng Part) và{" "}
            <span className="font-semibold dark:text-zinc-400">
              lộ trình cá nhân hoá
            </span>{" "}
            qua email.
          </p>
        </div>
      </div>
    </section>
  );
}
