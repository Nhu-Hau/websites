"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
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
  timeLabel, // dùng khi đã nộp
  onSubmit,
  onJump,
  disabledSubmit,
  onToggleDetails,
  showDetails,
  countdownSec = 18 * 60,
  started, // NEW
  onStart, // NEW
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
  started: boolean; // NEW
  onStart: () => void; // NEW
}) {
  const [leftSec, setLeftSec] = useState<number>(countdownSec);
  const tickingRef = useRef<number | null>(null);
  const submittedRef = useRef(false);

  // Nếu `countdownSec` đổi (hiếm), reset leftSec khi CHƯA bắt đầu
  useEffect(() => {
    if (!started && !resp) setLeftSec(countdownSec);
  }, [countdownSec, started, resp]);

  // Start/Stop interval theo started/resp
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

  // Hết giờ -> auto submit 1 lần
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

  return (
    <aside className="col-span-1">
      <div className="sticky top-24 h-[calc(100vh-8rem)] overflow-y-auto space-y-4">
        <div className="flex items-start flex-col">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Bài đánh giá trình độ
          </h1>
          <h1 className="flex items-center gap-1 text-gray-600 font-normal text-2xl">
            33 câu, 18 phút
          </h1>
        </div>

        {/* Banner nhỏ: chỉ hiện khi chưa bắt đầu & chưa nộp */}
        {!started && !resp && (
          <div className="rounded-xl border p-3 bg-amber-50 text-amber-900">
            <div className="text-sm">
              Thời gian sẽ bắt đầu tính khi bạn nhấn <b>Bắt đầu</b>.
            </div>
            <div className=" mt-2">
              <button
                className="px-3 py-2 rounded-lg bg-black text-white"
                onClick={onStart}
              >
                Bắt đầu
              </button>
            </div>
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
              disabled={disabledSubmit || !started}
              // chỉ cho nộp khi đã bắt đầu (tránh lỡ tay nộp khi chưa start)
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
              const correct = resp?.answersMap?.[it.id]?.correctAnswer;
              let cls =
                "w-9 h-9 rounded-full border text-sm flex items-center justify-center";
              if (!resp) {
                cls += picked
                  ? " bg-green-600 text-white border-green-600"
                  : " hover:bg-gray-50";
              } else {
                if (!picked)
                  cls += " bg-gray-300 text-gray-800 border-gray-300";
                else if (picked === correct)
                  cls += " bg-green-600 text-white border-green-600";
                else cls += " bg-red-600 text-white border-red-600";
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

        {resp && (
          <div className="rounded-2xl border p-4 space-y-1 bg-gray-50">
            <div className="font-semibold text-center">TỔNG QUAN</div>
            <div className="text-sm text-center">
              Đúng: <b>{resp.correct}</b> / {resp.total}
            </div>
            <div className="text-sm text-center">
              Chính xác:{" "}
              <b className="text-green-600">{(resp.acc * 100).toFixed(1)}%</b>
            </div>
            <div className="text-xs text-gray-500 text-center">
              Listening: {resp.listening.correct}/{resp.listening.total} (
              {(resp.listening.acc * 100).toFixed(0)}%)
              <br />
              Reading: {resp.reading.correct}/{resp.reading.total} (
              {(resp.reading.acc * 100).toFixed(0)}%)
            </div>
            <div className="text-sm text-center mt-1">
              Level: <b>{resp.level.toUpperCase()}</b>
            </div>

            <button
              onClick={onToggleDetails}
              className="w-full mt-2 px-3 py-2 rounded-xl border"
            >
              {showDetails ? "Ẩn chi tiết đáp án" : "Xem chi tiết đáp án"}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
