/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { X, Loader2, Target } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface BaselineModalProps {
  open: boolean;
  onClose: () => void;
  initialData?: {
    currentToeicSource: "unknown" | "self_report_official";
    currentToeicScore: number | null;
    currentToeicExamDate: string | null; // vẫn giữ type cho tương thích, nhưng không dùng nữa
  } | null;
}

export default function BaselineModal({
  open,
  onClose,
  initialData,
}: BaselineModalProps) {
  const { refresh } = useAuth();

  const [source, setSource] = useState<"unknown" | "self_report_official">(
    initialData?.currentToeicSource || "unknown"
  );
  const [score, setScore] = useState<string>(
    initialData?.currentToeicScore?.toString() || ""
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setSource(initialData.currentToeicSource || "unknown");
      setScore(initialData.currentToeicScore?.toString() || "");
    }
  }, [initialData]);

  if (!open) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const body: any = {
        currentToeicSource: source,
      };

      if (source === "self_report_official") {
        const scoreNum = parseInt(score, 10);
        if (isNaN(scoreNum) || scoreNum < 10 || scoreNum > 990) {
          alert("Điểm TOEIC phải là số từ 10 đến 990");
          setIsSaving(false);
          return;
        }
        body.currentToeicScore = scoreNum;
        // bỏ chọn ngày -> luôn clear exam date (hoặc backend ignore field)
        body.currentToeicExamDate = null;
      } else {
        // nếu chọn "chưa thi", clear score & date
        body.currentToeicScore = null;
        body.currentToeicExamDate = null;
      }

      const res = await fetch("/api/profile/assessment-baseline", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.message || "Lưu thất bại");
        setIsSaving(false);
        return;
      }

      await refresh();
      onClose();
    } catch (e) {
      console.error("Failed to save baseline", e);
      alert("Lưu thất bại");
    } finally {
      setIsSaving(false);
    }
  };

  const canSubmit =
    source === "unknown" ||
    (source === "self_report_official" && score.trim().length > 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-sm"
      onClick={() => {
        if (!isSaving) onClose();
      }}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/95 shadow-2xl ring-1 ring-black/[0.06] dark:border-zinc-800/80 dark:bg-zinc-900/95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-zinc-100 px-5 pb-3 pt-4 dark:border-zinc-800">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
              <Target className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Thiết lập điểm TOEIC hiện tại
              </h3>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Giúp hệ thống so sánh với kết quả placement test và progress
                test, từ đó gợi ý lộ trình chính xác hơn.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (!isSaving) onClose();
            }}
            disabled={isSaving}
            className="rounded-full p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 disabled:opacity-60 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 pb-5 pt-4">
          <div className="space-y-3">
            {/* Option 1: Unknown */}
            <button
              type="button"
              onClick={() => setSource("unknown")}
              className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-all ${
                source === "unknown"
                  ? "border-amber-400 bg-amber-50/60 shadow-sm dark:border-amber-400/80 dark:bg-amber-500/10"
                  : "border-zinc-200 hover:border-amber-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:border-amber-300/60 dark:hover:bg-zinc-800"
              }`}
            >
              <div className="mt-0.5">
                <span
                  className={`inline-flex h-4 w-4 items-center justify-center rounded-full border ${
                    source === "unknown"
                      ? "border-amber-500 bg-amber-500"
                      : "border-zinc-400 bg-white dark:bg-zinc-900"
                  }`}
                >
                  {source === "unknown" && (
                    <span className="h-2 w-2 rounded-full bg-white" />
                  )}
                </span>
              </div>
              <div className="flex-1">
                <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-50">
                  Tôi chưa thi TOEIC / chưa xác định
                </div>
                <div className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                  Hệ thống sẽ dùng điểm placement test làm mốc ban đầu để theo
                  dõi tiến bộ của bạn.
                </div>
              </div>
            </button>

            {/* Option 2: Self reported */}
            <button
              type="button"
              onClick={() => setSource("self_report_official")}
              className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-all ${
                source === "self_report_official"
                  ? "border-amber-400 bg-amber-50/60 shadow-sm dark:border-amber-400/80 dark:bg-amber-500/10"
                  : "border-zinc-200 hover:border-amber-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:border-amber-300/60 dark:hover:bg-zinc-800"
              }`}
            >
              <div className="mt-0.5">
                <span
                  className={`inline-flex h-4 w-4 items-center justify-center rounded-full border ${
                    source === "self_report_official"
                      ? "border-amber-500 bg-amber-500"
                      : "border-zinc-400 bg-white dark:bg-zinc-900"
                  }`}
                >
                  {source === "self_report_official" && (
                    <span className="h-2 w-2 rounded-full bg-white" />
                  )}
                </span>
              </div>
              <div className="flex-1">
                <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-50">
                  Tôi đã thi TOEIC và nhớ điểm
                </div>
                <div className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                  Nhập điểm TOEIC chính thức gần nhất của bạn để hệ thống dùng
                  làm baseline.
                </div>
              </div>
            </button>

            {/* Input fields khi chọn self_report_official (không còn chọn ngày) */}
            {source === "self_report_official" && (
              <div className="mt-1 rounded-xl border border-amber-100 bg-amber-50/60 p-3 dark:border-amber-500/40 dark:bg-amber-500/5">
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                  Điểm TOEIC của bạn (10–990) *
                </label>
                <input
                  type="number"
                  min={10}
                  max={990}
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  placeholder="Ví dụ: 650"
                  className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm font-medium text-zinc-900 shadow-sm outline-none placeholder:text-zinc-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-300/80 dark:border-amber-500/60 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-amber-400 dark:focus:ring-amber-500/40"
                />
                <p className="mt-1 text-[11px] text-amber-700/80 dark:text-amber-200/80">
                  Hệ thống hiểu đây là điểm từ bài thi TOEIC chính thức (hoặc
                  tương đương).
                </p>
              </div>
            )}
          </div>

          {/* Footer buttons */}
          <div className="mt-5 flex gap-3">
            <button
              onClick={() => {
                if (!isSaving) onClose();
              }}
              disabled={isSaving}
              className="flex-1 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Để sau
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !canSubmit}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:from-amber-400 hover:to-amber-500 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                "Lưu baseline"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}