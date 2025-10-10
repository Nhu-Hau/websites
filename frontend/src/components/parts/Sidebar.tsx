/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Item, ChoiceId } from "@/types/tests";
import type { GradeResp } from "@/types/placement";
import { FaRegClock } from "react-icons/fa";

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
  // giữ prop cho tương thích nhưng sẽ override theo started
  disabledSubmit,
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

  // Quản lý interval đếm ngược
  useEffect(() => {
    if (resp || !started) {
      if (tickingRef.current) {
        clearInterval(tickingRef.current);
        tickingRef.current = null;
      }
      return;
    }
    if (!tickingRef.current) {
      tickingRef.current = window.setInterval(() => setLeftSec((t) => t - 1), 1000);
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

  const canSubmit = started && !resp; // ✅ chỉ cần đã bắt đầu (không bắt buộc answered > 0)

  return (
    <aside className="col-span-1">
      <div className="sticky top-24 h-[calc(100vh-8rem)] overflow-y-auto space-y-4">
        <div className="flex items-start flex-col">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Bài luyện theo Part
          </h1>
          <h1 className="flex items-center gap-1 text-gray-600 font-normal text-2xl">
            {total} câu • {Math.round(countdownSec / 60)} phút
          </h1>
        </div>

        {/* Banner: chỉ hiện khi chưa bắt đầu & chưa nộp */}
        {!started && !resp && (
          <div className="rounded-xl border p-3 bg-amber-50 text-amber-900">
            <div className="text-sm">
              Thời gian sẽ bắt đầu tính khi bạn nhấn <b>Bắt đầu</b>.
            </div>
            <div className="mt-2 flex items-center gap-2">
              <button className="px-3 py-2 rounded-lg bg-black text-white" onClick={handleStartClick}>
                Bắt đầu
              </button>
              {!isAuthed && (
                <button
                  type="button"
                  className="px-3 py-2 rounded-lg border"
                  onClick={() => router.push("/auth/login")}
                >
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

        <div className="rounded-2xl border p-4 space-y-3">
          {!resp ? (
            <div className="flex items-center justify-between">
              <div className="text-sm">
                Câu đã chọn: <b>{answered}</b> / {total}
              </div>
              <div className="text-md text-red-600 flex items-center gap-1">
                <FaRegClock className="inline-block align-middle text-gray-600" />
                {countdownLabel}
              </div>
            </div>
          ) : (
            <div className="text-md text-gray-600 flex items-center gap-1">
              <FaRegClock className="inline-block align-middle" />
              Thời gian làm: {timeLabel}
            </div>
          )}

          {!resp && (
            <button
              onClick={handleManualSubmit}
              className="w-full px-4 py-2 rounded-xl bg-black text-white disabled:opacity-50"
              disabled={!canSubmit}
            >
              Nộp bài
            </button>
          )}
        </div>

        <div className="rounded-2xl border p-4">
          <div className="font-semibold mb-2">Câu hỏi</div>
          <div className="flex flex-wrap gap-2">
            {items.map((it, i) => {
              const picked = answers[it.id];
              const correct = resp?.answersMap?.[it.id]?.correctAnswer as ChoiceId | undefined;

              let cls = "w-9 h-9 rounded-full border text-sm flex items-center justify-center";

              if (!resp) {
                cls += picked ? " bg-green-600 text-white border-green-600" : " hover:bg-gray-50";
              } else {
                if (picked !== undefined && correct !== undefined && picked === correct) {
                  cls += " bg-green-600 text-white border-green-600";
                } else {
                  cls += " bg-red-600 text-white border-red-600";
                }
              }

              return (
                <button
                  key={it.id}
                  className={cls}
                  title={`Câu ${i + 1}`}
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