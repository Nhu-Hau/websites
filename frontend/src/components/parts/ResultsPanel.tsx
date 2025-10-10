/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import type { GradeResp } from "@/types/placement";
import React from "react";
import {
  Gauge,
  Headphones,
  BookOpen,
  Timer,
  Target,
  ArrowRight,
} from "lucide-react";

/** Đổi link luyện tập ở đây nếu cần */
function buildPracticeHref(partKey: string, level: 1 | 2 | 3 | 4) {
  return `/practice/parts/${encodeURIComponent(partKey)}?level=${level}`;
}
function partLabel(partKey: string) {
  const n = partKey.match(/\d+/)?.[0];
  return n ? `Part ${n}` : partKey;
}
function statusFromAcc(acc: number) {
  if (acc < 0.55)
    return {
      key: "weak",
      label: "Yếu",
      color: "bg-rose-100 text-rose-800 border-rose-300",
    };
  if (acc < 0.7)
    return {
      key: "avg",
      label: "Trung bình",
      color: "bg-amber-100 text-amber-800 border-amber-300",
    };
  if (acc < 0.85)
    return {
      key: "good",
      label: "Khá",
      color: "bg-sky-100 text-sky-800 border-sky-300",
    };
  return {
    key: "great",
    label: "Tốt",
    color: "bg-emerald-100 text-emerald-800 border-emerald-300",
  };
}
function recommendLevel(acc: number): 1 | 2 | 3 | 4 {
  if (acc < 0.55) return 1;
  if (acc < 0.7) return 2;
  if (acc < 0.85) return 3;
  return 4;
}
function fmtTime(totalSec: number) {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
function levelColor(lv: 1 | 2 | 3 | 4) {
  switch (lv) {
    case 1:
      return "text-emerald-200 font-extrabold"; // xanh lá nhạt
    case 2:
      return "text-sky-200 font-extrabold"; // xanh dương nhạt
    case 3:
      return "text-violet-200 font-extrabold"; // tím nhạt
    case 4:
      return "text-amber-200 font-extrabold"; // vàng nhạt
    default:
      return "text-white";
  }
}
export function ResultsPanel({
  resp,
  timeLabel,
  onToggleDetails,
  showDetails,
}: {
  resp: GradeResp & {
    predicted?: { overall: number; listening: number; reading: number };
    partStats?: Record<string, { total: number; correct: number; acc: number }>;
    weakParts?: string[];
  };
  timeLabel?: string;
  onToggleDetails?: () => void;
  showDetails?: boolean;
}) {
  const lv = (resp.level ?? 1) as 1 | 2 | 3 | 4;

  const wrapClass =
    lv === 4
      ? "border-amber-300/70 bg-amber-50 text-amber-900"
      : lv === 3
      ? "border-violet-300/70 bg-violet-50 text-violet-900"
      : lv === 2
      ? "border-blue-300/70 bg-blue-50 text-blue-900"
      : "border-emerald-300/70 bg-emerald-50 text-emerald-900";

  const levelName =
    lv === 4
      ? "Level 4 - Nâng cao"
      : lv === 3
      ? "Level 3 - Khá"
      : lv === 2
      ? "Level 2 - Trung cấp"
      : "Level 1 - Cơ bản";

  const partsSorted = React.useMemo(() => {
    const entries = Object.entries(resp.partStats || {});
    return entries.sort(([a], [b]) => {
      const na = parseInt(a.match(/\d+/)?.[0] || "0", 10);
      const nb = parseInt(b.match(/\d+/)?.[0] || "0", 10);
      return na - nb;
    });
  }, [resp.partStats]);
  const toToeicStep5 = (raw: number, min: number, max: number) => {
    const rounded = Math.round(raw / 5) * 5;
    return Math.min(max, Math.max(min, rounded));
  };

  const rawL = (resp.listening?.acc || 0) * 495;
  const rawR = (resp.reading?.acc || 0) * 495;
  const predictedL = toToeicStep5(resp.predicted?.listening ?? rawL, 5, 495);
  const predictedR = toToeicStep5(resp.predicted?.reading ?? rawR, 5, 495);
  const predictedOverall = toToeicStep5(
    resp.predicted?.overall ?? predictedL + predictedR,
    10,
    990
  );

  return (
    <div className="space-y-8">
      {/* 1) Banner to, dễ đọc */}
      <div className={`rounded-3xl border p-6 sm:p-8 ${wrapClass}`}>
        <div className="text-2xl font-extrabold tracking-tight">
          {levelName}
        </div>
        <div className="mt-2 text-base sm:text-lg">
          Chính xác{" "}
          <span className="font-semibold">{(resp.acc * 100).toFixed(1)}%</span>
          {typeof resp.timeSec === "number" ? (
            <>
              {" "}
              - Thời gian:{" "}
              <span className="font-semibold">{fmtTime(resp.timeSec)}</span>
            </>
          ) : timeLabel ? (
            <>
              {" "}
              - Thời gian: <span className="font-semibold">{timeLabel}</span>
            </>
          ) : null}
        </div>
      </div>

      {/* 2) Card điểm lớn */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border p-6 flex items-center gap-4">
          <Gauge className="h-10 w-10 text-zinc-800" />
          <div>
            <div className="text-sm text-zinc-600">Điểm TOEIC ước lượng</div>
            <div className="text-4xl font-black leading-none">
              {predictedOverall}{" "}
              <span className="text-xl font-bold">/ 990</span>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border p-6 flex items-center gap-4">
          <Headphones className="h-9 w-9 text-zinc-800" />
          <div>
            <div className="text-sm text-zinc-600">Listening (ước lượng)</div>
            <div className="text-2xl font-extrabold leading-none">
              {predictedL} <span className="text-base font-bold">/ 495</span>
            </div>
            <div className="text-xs text-zinc-500 mt-1">
              Độ chính xác {(resp.listening.acc * 100).toFixed(0)}%
            </div>
          </div>
        </div>
        <div className="rounded-2xl border p-6 flex items-center gap-4">
          <BookOpen className="h-9 w-9 text-zinc-800" />
          <div>
            <div className="text-sm text-zinc-600">Reading (ước lượng)</div>
            <div className="text-2xl font-extrabold leading-none">
              {predictedR} <span className="text-base font-bold">/ 495</span>
            </div>
            <div className="text-xs text-zinc-500 mt-1">
              Độ chính xác {(resp.reading.acc * 100).toFixed(0)}%
            </div>
          </div>
        </div>
      </section>

      {/* 3) Tổng quan đậm nét */}
      <section className="rounded-2xl border p-6">
        <div className="text-xl font-bold text-center">TỔNG QUAN</div>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3 text-center">
          <div className="rounded-xl border p-4">
            <div className="text-sm text-zinc-600">Số câu đúng</div>
            <div className="text-3xl font-extrabold">
              {resp.correct}/{resp.total}
            </div>
          </div>
          <div className="rounded-xl border p-4">
            <div className="text-sm text-zinc-600">Độ chính xác</div>
            <div className="text-3xl font-extrabold text-emerald-700">
              {(resp.acc * 100).toFixed(1)}%
            </div>
          </div>
          <div className="rounded-xl border p-4">
            <div className="text-sm text-zinc-600">Thời gian</div>
            <div className="text-3xl font-extrabold">
              {fmtTime(resp.timeSec)}
            </div>
          </div>
        </div>

        {!!onToggleDetails && (
          <div className="mt-4">
            <button
              onClick={onToggleDetails}
              className="w-full rounded-xl border px-4 py-3 text-base font-semibold hover:bg-zinc-50"
            >
              {showDetails ? "Ẩn chi tiết đáp án" : "Xem chi tiết đáp án"}
            </button>
          </div>
        )}
      </section>

      {/* 4) Phân tích từng Part + đề xuất (to, dễ chạm) */}
      {partsSorted.length > 0 && (
        <section className="rounded-2xl border p-6">
          <header className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Target className="h-6 w-6 text-zinc-800" />
              <h3 className="text-xl font-bold">
                Phân tích theo Part & Gợi ý luyện tập
              </h3>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-sm text-zinc-500">
              <Timer className="h-4 w-4" />
              Mini test 55 câu • 35 phút
            </div>
          </header>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {partsSorted.map(([partKey, stat]) => {
              const status = statusFromAcc(stat.acc);
              const recommend = recommendLevel(stat.acc);
              const href = buildPracticeHref(partKey, recommend);

              return (
                <div
                  key={partKey}
                  className="rounded-2xl border p-5 flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border text-base font-bold">
                        {partKey.match(/\d+/)?.[0] ?? "?"}
                      </span>
                      <div className="text-lg font-semibold">
                        {partLabel(partKey)}
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded border px-2.5 py-1 text-sm font-semibold ${status.color}`}
                    >
                      {status.label}
                    </span>
                  </div>

                  <div className="text-sm text-zinc-600">
                    Đúng{" "}
                    <b>
                      {stat.correct}/{stat.total}
                    </b>{" "}
                    -{" "}
                    <b className="text-green-700">
                      {(stat.acc * 100).toFixed(0)}%
                    </b>
                  </div>

                  <a
                    href={href}
                    className="mt-1 inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-3 text-base font-semibold text-white hover:bg-zinc-800"
                  >
                    Luyện {partLabel(partKey)} –
                    <span className={levelColor(recommend)}>
                      Level {recommend}
                    </span>
                    <ArrowRight className="h-6 w-6" />
                  </a>
                </div>
              );
            })}
          </div>

          {resp.weakParts?.length ? (
            <p className="mt-4 text-sm text-zinc-700">
              Gợi ý ưu tiên:{" "}
              <b>{resp.weakParts.map((k) => partLabel(k)).join(", ")}</b>. Hãy
              luyện trước các phần này để cải thiện nhanh.
            </p>
          ) : (
            <p className="mt-4 text-sm text-zinc-700">
              Nhịp độ ổn! Tiếp tục luyện đều để tăng điểm nhanh hơn.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
