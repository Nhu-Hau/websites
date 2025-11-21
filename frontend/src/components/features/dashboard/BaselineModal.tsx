"use client";

import React, { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface BaselineModalProps {
  open: boolean;
  onClose: () => void;
  initialData?: {
    currentToeicSource: "unknown" | "self_report_official";
    currentToeicScore: number | null;
    currentToeicExamDate: string | null;
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
  const [examDate, setExamDate] = useState<string>(
    initialData?.currentToeicExamDate || ""
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setSource(initialData.currentToeicSource);
      setScore(initialData.currentToeicScore?.toString() || "");
      setExamDate(initialData.currentToeicExamDate || "");
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
        const scoreNum = parseInt(score);
        if (isNaN(scoreNum) || scoreNum < 10 || scoreNum > 990) {
          alert("Điểm TOEIC phải là số từ 10 đến 990");
          setIsSaving(false);
          return;
        }
        body.currentToeicScore = scoreNum;
        body.currentToeicExamDate = examDate || null;
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-sm"
      onClick={() => {
        if (!isSaving) {
          onClose();
        }
      }}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/95 shadow-xl ring-1 ring-black/[0.05] dark:border-zinc-800/80 dark:bg-zinc-900/95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* top accent */}
        <div className="h-1 w-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600" />

        <div className="px-5 pb-5 pt-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Khai báo điểm TOEIC hiện tại
              </h3>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Giúp hệ thống so sánh với kết quả placement và progress test
              </p>
            </div>
            <button
              onClick={() => {
                if (!isSaving) {
                  onClose();
                }
              }}
              disabled={isSaving}
              className="rounded-full p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 disabled:opacity-60 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Option 1: Unknown */}
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-200 p-3 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800">
              <input
                type="radio"
                name="source"
                checked={source === "unknown"}
                onChange={() => setSource("unknown")}
                className="mt-0.5 h-4 w-4 text-amber-500 focus:ring-amber-500"
              />
              <div className="flex-1">
                <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-50">
                  Tôi chưa thi TOEIC / chưa xác định
                </div>
                <div className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                  Hệ thống sẽ chỉ dùng kết quả placement test làm baseline
                </div>
              </div>
            </label>

            {/* Option 2: Self reported */}
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-200 p-3 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800">
              <input
                type="radio"
                name="source"
                checked={source === "self_report_official"}
                onChange={() => setSource("self_report_official")}
                className="mt-0.5 h-4 w-4 text-amber-500 focus:ring-amber-500"
              />
              <div className="flex-1">
                <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-50">
                  Tôi đã thi TOEIC và nhớ điểm
                </div>
                <div className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                  Nhập điểm TOEIC chính thức của bạn
                </div>
              </div>
            </label>

            {/* Input fields khi chọn self_report_official */}
            {source === "self_report_official" && (
              <div className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 dark:border-zinc-700 dark:bg-zinc-800/50">
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                    Điểm TOEIC (10-990) *
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={990}
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                    placeholder="Ví dụ: 650"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 shadow-sm outline-none placeholder:text-zinc-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-300/80 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-amber-500 dark:focus:ring-amber-500/40"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                    Ngày thi (tùy chọn)
                  </label>
                  <input
                    type="date"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 shadow-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-300/80 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-amber-500 dark:focus:ring-amber-500/40"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="mt-5 flex gap-3">
            <button
              onClick={() => {
                if (!isSaving) {
                  onClose();
                }
              }}
              disabled={isSaving}
              className="flex-1 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:from-amber-400 hover:to-amber-500 hover:shadow-md disabled:opacity-60"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                "Lưu điểm TOEIC"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

