/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef } from "react";
import type { ChoiceId } from "@/types/tests";

type AutoSaveData = {
  answers: Record<string, ChoiceId>;
  timeSec: number;
  started: boolean;
  timestamp: number;
};

const STORAGE_PREFIX = "test_autosave_";

/**
 * Hook để tự động lưu và khôi phục dữ liệu bài test
 * @param testType - Loại test: 'progress' | 'placement' | 'practice'
 * @param testId - ID duy nhất của test (ví dụ: partKey-level-test cho practice, hoặc version cho progress)
 * @param answers - State answers
 * @param timeSec - State timeSec
 * @param started - State started
 * @param resp - Response sau khi submit (để xóa dữ liệu khi đã nộp)
 * @param onRestore - Callback khi khôi phục dữ liệu
 * @param enabled - Bật/tắt khôi phục (mặc định: true)
 */
export function useAutoSave(
  testType: "progress" | "placement" | "practice",
  testId: string,
  answers: Record<string, ChoiceId>,
  timeSec: number,
  started: boolean,
  resp: any,
  onRestore: (data: { answers: Record<string, ChoiceId>; timeSec: number; started: boolean }) => void,
  enabled: boolean = true
) {
  const storageKey = `${STORAGE_PREFIX}${testType}_${testId}`;
  const isRestoredRef = useRef(false);
  const lastSaveRef = useRef<AutoSaveData | null>(null);

  // Khôi phục dữ liệu khi mount (chỉ một lần)
  useEffect(() => {
    if (isRestoredRef.current || resp || !enabled) return;

    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) return;

      const data: AutoSaveData = JSON.parse(saved);
      
      // Kiểm tra timestamp (không khôi phục nếu quá cũ - hơn 24 giờ)
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 giờ
      if (now - data.timestamp > maxAge) {
        localStorage.removeItem(storageKey);
        return;
      }

      // Khôi phục dữ liệu (khôi phục nếu có answers hoặc đã started)
      if ((data.answers && Object.keys(data.answers).length > 0) || data.started) {
        onRestore({
          answers: data.answers || {},
          timeSec: data.timeSec || 0,
          started: data.started || false,
        });
        isRestoredRef.current = true;
      }
    } catch (e) {
      console.error("Failed to restore auto-save data:", e);
      localStorage.removeItem(storageKey);
    }
  }, [storageKey, resp, onRestore, enabled]);

  // Lưu ngay lập tức khi answers thay đổi (không debounce cho answers)
  useEffect(() => {
    if (!started || resp) return;

    const current: AutoSaveData = {
      answers,
      timeSec,
      started,
      timestamp: Date.now(),
    };

    // Chỉ lưu nếu answers thay đổi
    const last = lastSaveRef.current;
    if (last && JSON.stringify(last.answers) === JSON.stringify(current.answers)) {
      // Nếu chỉ timeSec thay đổi, không lưu ngay (sẽ lưu ở useEffect khác với debounce)
      return;
    }

    try {
      localStorage.setItem(storageKey, JSON.stringify(current));
      lastSaveRef.current = current;
    } catch (e) {
      console.error("Failed to save auto-save data:", e);
    }
  }, [answers, storageKey, started, resp, timeSec]);

  // Lưu timeSec với debounce (mỗi 2 giây) để tránh lưu quá nhiều
  useEffect(() => {
    if (!started || resp) return;

    const current: AutoSaveData = {
      answers,
      timeSec,
      started,
      timestamp: Date.now(),
    };

    // Chỉ lưu nếu timeSec thay đổi (không lưu nếu chỉ answers thay đổi)
    const last = lastSaveRef.current;
    if (last && last.timeSec === current.timeSec) {
      return; // Không có thay đổi timeSec
    }

    // Debounce: lưu sau 2 giây (để tránh lưu mỗi giây)
    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(current));
        lastSaveRef.current = current;
      } catch (e) {
        console.error("Failed to save auto-save data:", e);
      }
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [timeSec, answers, started, resp, storageKey]);

  // Xóa dữ liệu khi đã submit thành công
  useEffect(() => {
    if (resp) {
      try {
        localStorage.removeItem(storageKey);
        lastSaveRef.current = null;
      } catch (e) {
        console.error("Failed to clear auto-save data:", e);
      }
    }
  }, [resp, storageKey]);

  // Lưu trước khi đóng tab/refresh (beforeunload)
  useEffect(() => {
    if (!started || resp) return;

    const handleBeforeUnload = () => {
      try {
        const current: AutoSaveData = {
          answers,
          timeSec,
          started,
          timestamp: Date.now(),
        };
        localStorage.setItem(storageKey, JSON.stringify(current));
      } catch (e) {
        console.error("Failed to save on beforeunload:", e);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [answers, timeSec, started, resp, storageKey]);
}

