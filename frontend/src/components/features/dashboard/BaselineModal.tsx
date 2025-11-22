/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { Loader2, Target } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface BaselineModalProps {
  open: boolean;
  onClose: () => void;
  onSave?: () => void;
  initialData?: {
    currentToeicSource: "unknown" | "self_report_official" | null;
    currentToeicScore: number | null;
    currentToeicExamDate: string | null;
  } | null;
}

export default function BaselineModal({
  open,
  onClose,
  onSave,
  initialData,
}: BaselineModalProps) {
  const { refresh } = useAuth();

  const [source, setSource] = useState<"unknown" | "self_report_official">(
    initialData?.currentToeicSource ?? "unknown"
  );
  const [score, setScore] = useState<string>(
    initialData?.currentToeicScore?.toString() || ""
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setSource(initialData.currentToeicSource ?? "unknown");
      setScore(initialData.currentToeicScore?.toString() || "");
    } else {
      // Reset về default khi không có initialData
      setSource("unknown");
      setScore("");
    }
  }, [initialData]);

  if (!open) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const body: any = {
        currentToeicSource: source,
        currentToeicScore:
          source === "self_report_official" ? Number(score) : null,
        currentToeicExamDate: null, // bỏ ngày thi
      };

      if (source === "self_report_official") {
        const value = Number(score);
        if (isNaN(value) || value < 10 || value > 990) {
          alert("Điểm TOEIC phải từ 10 đến 990");
          setIsSaving(false);
          return;
        }
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
      onSave?.();
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3 py-6 backdrop-blur-sm"
      // Không cho phép đóng bằng click outside - bắt buộc phải điền
    >
      <div
        className="
          w-full max-w-md sm:max-w-lg rounded-2xl sm:rounded-3xl 
          bg-white/95 dark:bg-zinc-900/95 
          border border-zinc-200 dark:border-zinc-800
          shadow-xl ring-1 ring-black/5
          overflow-hidden
        "
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <Target className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600 dark:text-amber-300" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-50 leading-tight">
                Thiết lập baseline TOEIC
              </h3>
              <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">
                Giúp hệ thống cá nhân hóa lộ trình học
              </p>
            </div>
          </div>

          {/* Bỏ nút X - không cho phép đóng nếu chưa lưu */}
        </div>

        {/* BODY */}
        <div className="px-4 sm:px-5 py-4 sm:py-5 space-y-3 sm:space-y-4">
          {/* OPTION 1 */}
          <button
            onClick={() => setSource("unknown")}
            className={`
              w-full flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl border text-left transition-all 
              ${
                source === "unknown"
                  ? "border-amber-400/60 bg-amber-50 shadow-sm dark:bg-amber-500/10"
                  : "border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              }
            `}
          >
            <div className="pt-0.5 sm:pt-1">
              <span
                className={`
                  h-5 w-5 sm:h-6 sm:w-6 rounded-full border flex items-center justify-center flex-shrink-0
                  ${
                    source === "unknown"
                      ? "border-amber-500 bg-amber-500"
                      : "border-zinc-400 bg-white dark:bg-zinc-900"
                  }
                `}
              >
                {source === "unknown" && (
                  <span className="h-2.5 w-2.5 sm:h-3 sm:w-3 bg-white rounded-full" />
                )}
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-zinc-50 leading-tight">
                Tôi chưa thi TOEIC / chưa xác định
              </p>
              <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 mt-1 sm:mt-1.5 leading-relaxed">
                Hệ thống sẽ dùng điểm placement test làm baseline.
              </p>
            </div>
          </button>

          {/* OPTION 2 */}
          <button
            onClick={() => setSource("self_report_official")}
            className={`
              w-full flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl border text-left transition-all 
              ${
                source === "self_report_official"
                  ? "border-amber-400/60 bg-amber-50 shadow-sm dark:bg-amber-500/10"
                  : "border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              }
            `}
          >
            <div className="pt-0.5 sm:pt-1">
              <span
                className={`
                  h-5 w-5 sm:h-6 sm:w-6 rounded-full border flex items-center justify-center flex-shrink-0
                  ${
                    source === "self_report_official"
                      ? "border-amber-500 bg-amber-500"
                      : "border-zinc-400 bg-white dark:bg-zinc-900"
                  }
                `}
              >
                {source === "self_report_official" && (
                  <span className="h-2.5 w-2.5 sm:h-3 sm:w-3 bg-white rounded-full" />
                )}
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-zinc-50 leading-tight">
                Tôi đã thi TOEIC và nhớ điểm
              </p>
              <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 mt-1 sm:mt-1.5 leading-relaxed">
                Nhập điểm thi chính thức gần nhất của bạn.
              </p>
            </div>
          </button>

          {/* INPUT CHO SELF REPORT */}
          {source === "self_report_official" && (
            <div
              className="
                rounded-xl sm:rounded-2xl border border-amber-200/70 bg-amber-50/40 
                p-3 sm:p-4 dark:border-amber-500/40 dark:bg-amber-500/5
              "
            >
              <label className="text-sm sm:text-base font-semibold text-amber-700 dark:text-amber-300">
                Điểm TOEIC của bạn *
              </label>

              <input
                type="number"
                min={10}
                max={990}
                value={score}
                onChange={(e) => setScore(e.target.value)}
                placeholder="VD: 650"
                className="
                  mt-2 sm:mt-3 w-full rounded-lg sm:rounded-xl border border-amber-200 bg-white px-4 py-3 sm:py-3.5
                  text-base sm:text-lg font-medium text-zinc-900 shadow-sm 
                  placeholder:text-zinc-400 outline-none
                  focus:border-amber-400 focus:ring-2 focus:ring-amber-300/70
                  dark:bg-zinc-900 dark:text-zinc-50 dark:border-amber-500/60
                "
              />
            </div>
          )}
        </div>

        {/* FOOTER BUTTONS */}
        <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-3 sm:pt-4">
          <button
            onClick={handleSave}
            disabled={isSaving || (source === "self_report_official" && (!score || isNaN(Number(score)) || Number(score) < 10 || Number(score) > 990))}
            className="
              w-full py-3 sm:py-3.5 rounded-xl sm:rounded-2xl
              bg-gradient-to-r from-amber-500 to-amber-600
              text-sm sm:text-base font-semibold text-white shadow-sm
              hover:from-amber-400 hover:to-amber-500
              disabled:opacity-60 disabled:cursor-not-allowed
              flex items-center justify-center gap-2
              transition-colors
            "
          >
            {isSaving ? (
              <>
                <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
                <span className="hidden sm:inline">Đang lưu...</span>
                <span className="sm:hidden">Đang lưu</span>
              </>
            ) : (
              "Lưu baseline"
            )}
          </button>
          <p className="mt-2 sm:mt-3 text-center text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            Vui lòng điền thông tin để tiếp tục sử dụng dashboard
          </p>
        </div>
      </div>
    </div>
  );
}