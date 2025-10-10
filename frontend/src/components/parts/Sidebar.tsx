//frontend/src/components/parts/Sidebar.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Item, ChoiceId } from "@/types/tests";
import type { GradeResp } from "@/types/placement";
import { FaRegClock } from "react-icons/fa";
import {
  ListChecks,
  Timer as TimerIcon,
  Play,
  LogIn,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
} from "lucide-react";

function fmtMMSS(sec: number) {
  const m = Math.floor(Math.max(sec, 0) / 60);
  const s = Math.max(sec, 0) % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function Sidebar({
  items,
  answers,
  resp,
  total,
  answered,
  timeLabel,
  onSubmit,
  onJump,
  disabledSubmit, // vẫn giữ, nhưng submit sẽ dựa theo started/resp
  onToggleDetails,
  showDetails,
  countdownSec = 35 * 60,
  started,
  onStart,
  isAuthed,
  onLoginRequest,
}: {
  items: Item[];
  answers: Record<string, ChoiceId>;
  resp: GradeResp | null;
  total: number;
  answered: number;
  timeLabel: string;
  onSubmit: () => void;
  onJump: (i: number) => void;
  disabledSubmit: boolean;
  onToggleDetails: () => void;
  showDetails: boolean;
  countdownSec?: number;
  started: boolean;
  onStart: () => void;
  isAuthed: boolean;
  onLoginRequest: () => void;
}) {
  const [leftSec, setLeftSec] = useState<number>(countdownSec);
  const tickingRef = useRef<number | null>(null);
  const submittedRef = useRef(false);
  const router = useRouter();

  // Reset lại thời gian khi CHƯA bắt đầu và chưa có kết quả
  useEffect(() => {
    if (!started && !resp) setLeftSec(countdownSec);
  }, [countdownSec, started, resp]);

  // Interval đếm lùi
  useEffect(() => {
    if (resp || !started) {
      if (tickingRef.current) {
        clearInterval(tickingRef.current);
        tickingRef.current = null;
      }
      return;
    }
    if (!tickingRef.current) {
      tickingRef.current = window.setInterval(
        () => setLeftSec((t) => t - 1),
        1000
      );
    }
    return () => {
      if (tickingRef.current) {
        clearInterval(tickingRef.current);
        tickingRef.current = null;
      }
    };
  }, [resp, started]);

  // Hết giờ → auto submit
  useEffect(() => {
    if (!resp && started && leftSec <= 0 && !submittedRef.current) {
      submittedRef.current = true;
      if (tickingRef.current) {
        clearInterval(tickingRef.current);
        tickingRef.current = null;
      }
      onSubmit();
    }
  }, [leftSec, resp, started, onSubmit]);

  // Clear khi unmount
  useEffect(() => {
    return () => {
      if (tickingRef.current) {
        clearInterval(tickingRef.current);
        tickingRef.current = null;
      }
    };
  }, []);

  const countdownLabel = useMemo(
    () => (started ? fmtMMSS(leftSec) : "--:--"),
    [leftSec, started]
  );

  function handleManualSubmit() {
    submittedRef.current = true;
    onSubmit();
  }

  function handleStartClick() {
    if (!isAuthed) {
      onLoginRequest?.();
      return;
    }
    onStart();
  }

  const canSubmit = started && !resp; // chỉ cần đã bắt đầu & chưa nộp
  const progress = total
    ? Math.min(100, Math.round((answered / total) * 100))
    : 0;

  return (
    <aside className="col-span-1">
      <div className="sticky top-24 h-[calc(100vh-8rem)] overflow-y-auto space-y-4">
        {/* Title + chips */}
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-bold">Bài luyện theo Part</h2>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1">
              <ListChecks className="h-4 w-4" />
              {total} câu
            </span>
            <span className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1">
              <TimerIcon className="h-4 w-4" />
              {Math.round(countdownSec / 60)} phút
            </span>
          </div>
        </div>

        {/* Banner: chưa bắt đầu & chưa nộp */}
        {!started && !resp && (
          <div className="rounded-xl border p-4 bg-amber-50 text-amber-900">
            <div className="text-sm">
              Thời gian sẽ bắt đầu tính khi bạn nhấn <b>Bắt đầu</b>.
            </div>
            <div className="mt-3 flex items-center gap-2">
              <button
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-black text-white"
                onClick={handleStartClick}
              >
                <Play className="h-4 w-4" />
                Bắt đầu
              </button>
              {!isAuthed && (
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border"
                  onClick={() => router.push("/auth/login")}
                >
                  <LogIn className="h-4 w-4" />
                  Đăng nhập
                </button>
              )}
            </div>
            {!isAuthed && (
              <div className="text-xs mt-2 text-amber-900/80">
                Bạn cần <b>đăng nhập</b> để bắt đầu làm bài và lưu kết quả.
              </div>
            )}
          </div>
        )}

        {/* Stats card */}
        <div className="rounded-2xl border p-4 space-y-3">
          {!resp ? (
            <>
              <div className="flex items-center justify-between text-sm">
                <div>
                  Đã chọn: <b>{answered}</b> / {total}
                </div>
                <div className="text-red-600 flex items-center gap-1">
                  <FaRegClock className="inline-block align-middle text-gray-600" />
                  {countdownLabel}
                </div>
              </div>

              {/* Progress */}
              <div className="h-2 w-full rounded-full bg-zinc-200 overflow-hidden">
                <div
                  className="h-2 bg-zinc-900 transition-all"
                  style={{ width: `${progress}%` }}
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>

              <button
                onClick={handleManualSubmit}
                className="w-full px-4 py-2 rounded-xl bg-black text-white disabled:opacity-50"
                disabled={!canSubmit}
              >
                Nộp bài
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="text-sm text-gray-600 flex items-center gap-1">
                <FaRegClock className="inline-block align-middle" />
                Thời gian làm: {timeLabel}
              </div>

              {/* Toggle xem chi tiết sau khi nộp */}
              <button
                onClick={onToggleDetails}
                className="inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm hover:bg-zinc-50"
              >
                {showDetails ? (
                  <>
                    <EyeOff className="h-4 w-4" />
                    Ẩn chi tiết đáp án
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4" />
                    Xem chi tiết đáp án
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Legend sau khi nộp */}
        {resp && (
          <div className="rounded-2xl border p-4">
            <div className="font-semibold mb-2">Chú thích</div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center gap-1 rounded-full bg-green-600 text-white px-2 py-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Đúng
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-red-600 text-white px-2 py-1">
                <XCircle className="h-3.5 w-3.5" />
                Sai
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-zinc-300 text-zinc-800 px-2 py-1">
                {/* dùng icon CheckCircle2 mờ hoặc bỏ icon cũng được */}
                Bỏ trống
              </span>
            </div>
          </div>
        )}

        {/* Grid câu hỏi */}
        {/* Grid câu hỏi */}
        <div className="rounded-2xl border p-4">
          <div className="font-semibold mb-2">Câu hỏi</div>
          <div className="flex flex-wrap gap-2">
            {items.map((it, i) => {
              const picked = answers[it.id];
              const correct = resp?.answersMap?.[it.id]?.correctAnswer as
                | ChoiceId
                | undefined;

              let cls =
                "w-9 h-9 rounded-full border text-sm flex items-center justify-center transition-all duration-200";

              if (!resp) {
                // 🟡 Trước khi nộp
                cls += picked
                  ? " bg-zinc-900 text-white border-zinc-900"
                  : " hover:bg-zinc-100 dark:hover:bg-zinc-700";
              } else {
                // ✅ Sau khi nộp: Xanh = đúng / Đỏ = sai / Xám = bỏ trống
                if (picked === undefined) {
                  cls +=
                    " bg-zinc-300 text-zinc-800 border-zinc-300 dark:bg-zinc-700 dark:text-zinc-200";
                } else if (correct !== undefined && picked === correct) {
                  cls += " bg-green-600 text-white border-green-600";
                } else {
                  cls += " bg-red-600 text-white border-red-600";
                }
              }

              return (
                <button
                  key={it.id}
                  className={cls}
                  title={
                    !resp
                      ? `Câu ${i + 1}`
                      : picked === undefined
                      ? `Câu ${i + 1}: Bỏ trống`
                      : picked === correct
                      ? `Câu ${i + 1}: Đúng`
                      : `Câu ${i + 1}: Sai`
                  }
                  onClick={() => onJump(i)}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}
