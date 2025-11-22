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
          w-full max-w-sm rounded-2xl 
          bg-white/95 dark:bg-zinc-900/95 
          border border-zinc-200 dark:border-zinc-800
          shadow-xl ring-1 ring-black/5
          overflow-hidden
        "
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
              <Target className="h-4 w-4 text-amber-600 dark:text-amber-300" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Thiết lập baseline TOEIC
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Giúp hệ thống cá nhân hóa lộ trình học
              </p>
            </div>
          </div>

          {/* Bỏ nút X - không cho phép đóng nếu chưa lưu */}
        </div>

        {/* BODY */}
        <div className="px-4 py-4 space-y-3">
          {/* OPTION 1 */}
          <button
            onClick={() => setSource("unknown")}
            className={`
              w-full flex gap-3 p-3 rounded-xl border text-left transition-all 
              ${
                source === "unknown"
                  ? "border-amber-400/60 bg-amber-50 shadow-sm dark:bg-amber-500/10"
                  : "border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              }
            `}
          >
            <div className="pt-0.5">
              <span
                className={`
                  h-4 w-4 rounded-full border flex items-center justify-center
                  ${
                    source === "unknown"
                      ? "border-amber-500 bg-amber-500"
                      : "border-zinc-400 bg-white dark:bg-zinc-900"
                  }
                `}
              >
                {source === "unknown" && (
                  <span className="h-2 w-2 bg-white rounded-full" />
                )}
              </span>
            </div>

            <div>
              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-50">
                Tôi chưa thi TOEIC / chưa xác định
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-4">
                Hệ thống sẽ dùng điểm placement test làm baseline.
              </p>
            </div>
          </button>

          {/* OPTION 2 */}
          <button
            onClick={() => setSource("self_report_official")}
            className={`
              w-full flex gap-3 p-3 rounded-xl border text-left transition-all 
              ${
                source === "self_report_official"
                  ? "border-amber-400/60 bg-amber-50 shadow-sm dark:bg-amber-500/10"
                  : "border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              }
            `}
          >
            <div className="pt-0.5">
              <span
                className={`
                  h-4 w-4 rounded-full border flex items-center justify-center
                  ${
                    source === "self_report_official"
                      ? "border-amber-500 bg-amber-500"
                      : "border-zinc-400 bg-white dark:bg-zinc-900"
                  }
                `}
              >
                {source === "self_report_official" && (
                  <span className="h-2 w-2 bg-white rounded-full" />
                )}
              </span>
            </div>

            <div>
              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-50">
                Tôi đã thi TOEIC và nhớ điểm
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-4">
                Nhập điểm thi chính thức gần nhất của bạn.
              </p>
            </div>
          </button>

          {/* INPUT CHO SELF REPORT */}
          {source === "self_report_official" && (
            <div
              className="
                rounded-xl border border-amber-200/70 bg-amber-50/40 
                p-3 dark:border-amber-500/40 dark:bg-amber-500/5
              "
            >
              <label className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">
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
                  mt-1 w-full rounded-lg border border-amber-200 bg-white px-3 py-2 
                  text-sm font-medium text-zinc-900 shadow-sm 
                  placeholder:text-zinc-400 outline-none
                  focus:border-amber-400 focus:ring-2 focus:ring-amber-300/70
                  dark:bg-zinc-900 dark:text-zinc-50 dark:border-amber-500/60
                "
              />
            </div>
          )}
        </div>

        {/* FOOTER BUTTONS */}
        <div className="px-4 pb-4 pt-1">
          <button
            onClick={handleSave}
            disabled={isSaving || (source === "self_report_official" && (!score || isNaN(Number(score)) || Number(score) < 10 || Number(score) > 990))}
            className="
              w-full py-2.5 rounded-xl
              bg-gradient-to-r from-amber-500 to-amber-600
              text-xs font-semibold text-white shadow-sm
              hover:from-amber-400 hover:to-amber-500
              disabled:opacity-60 disabled:cursor-not-allowed
              flex items-center justify-center gap-2
            "
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
          <p className="mt-2 text-center text-[10px] text-zinc-500 dark:text-zinc-400">
            Vui lòng điền thông tin để tiếp tục sử dụng dashboard
          </p>
        </div>
      </div>
    </div>
  );
}