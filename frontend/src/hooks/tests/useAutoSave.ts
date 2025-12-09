/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef, useCallback } from "react";
import type { ChoiceId } from "@/types/tests.types";
import { fetchWithAuth } from "@/lib/api/client";

type AutoSaveData = {
  answers: Record<string, ChoiceId>;
  timeSec: number;
  started: boolean;
  timestamp: number;
};

type BackendDraft = {
  answers: Record<string, string>;
  allIds: string[];
  timeSec: number;
  startedAt: string | null;
  savedAt: string;
};

const STORAGE_PREFIX = "test_autosave_";
const BACKEND_SYNC_INTERVAL = 5000; // Sync với backend mỗi 5 giây

/**
 * Hook để tự động lưu và khôi phục dữ liệu bài test
 * - Lưu localStorage: ngay lập tức
 * - Sync backend: mỗi 5 giây (để cross-device sync)
 * 
 * @param testType - Loại test: 'progress' | 'placement' | 'practice'
 * @param testId - ID duy nhất của test (ví dụ: partKey-level-test cho practice, hoặc version cho progress)
 * @param answers - State answers
 * @param timeSec - State timeSec
 * @param started - State started
 * @param resp - Response sau khi submit (để xóa dữ liệu khi đã nộp)
 * @param onRestore - Callback khi khôi phục dữ liệu
 * @param enabled - Bật/tắt khôi phục (mặc định: true)
 * @param allIds - Danh sách các item IDs (cần cho backend)
 */
export function useAutoSave(
  testType: "progress" | "placement" | "practice",
  testId: string,
  answers: Record<string, ChoiceId>,
  timeSec: number,
  started: boolean,
  resp: any,
  onRestore: (data: { answers: Record<string, ChoiceId>; timeSec: number; started: boolean }) => void,
  enabled: boolean = true,
  allIds: string[] = []
) {
  const storageKey = `${STORAGE_PREFIX}${testType}_${testId}`;
  const isRestoredRef = useRef(false);
  const lastSaveRef = useRef<AutoSaveData | null>(null);
  const lastBackendSyncRef = useRef<number>(0);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Lưu lên backend (debounced)
  const syncToBackend = useCallback(async () => {
    if (!started || resp) return;

    const now = Date.now();
    // Throttle: không sync nếu vừa sync cách đây chưa đến 5s
    if (now - lastBackendSyncRef.current < BACKEND_SYNC_INTERVAL) return;

    try {
      await fetchWithAuth("/api/draft/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testType,
          testKey: testId,
          answers,
          allIds,
          timeSec,
          startedAt: null, // Có thể thêm sau nếu cần
        }),
      });
      lastBackendSyncRef.current = now;
    } catch (e) {
      console.error("Failed to sync draft to backend:", e);
    }
  }, [testType, testId, answers, allIds, timeSec, started, resp]);

  // Khôi phục dữ liệu khi mount (ưu tiên backend, fallback localStorage)
  useEffect(() => {
    if (isRestoredRef.current || resp || !enabled) return;

    const restore = async () => {
      // 1. Thử restore từ backend trước (cross-device sync)
      try {
        const res = await fetchWithAuth(`/api/draft/${testType}/${encodeURIComponent(testId)}`);
        if (res.ok) {
          const { draft }: { draft: BackendDraft | null } = await res.json();
          if (draft && draft.answers && Object.keys(draft.answers).length > 0) {
            onRestore({
              answers: draft.answers as Record<string, ChoiceId>,
              timeSec: draft.timeSec || 0,
              started: true,
            });
            isRestoredRef.current = true;
            return;
          }
        }
      } catch (e) {
        console.error("Failed to fetch draft from backend:", e);
      }

      // 2. Fallback: restore từ localStorage
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
    };

    restore();
  }, [storageKey, resp, onRestore, enabled, testType, testId]);

  // Lưu ngay lập tức khi answers thay đổi (localStorage + schedule backend sync)
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
      return;
    }

    // Lưu localStorage ngay
    try {
      localStorage.setItem(storageKey, JSON.stringify(current));
      lastSaveRef.current = current;
    } catch (e) {
      console.error("Failed to save auto-save data:", e);
    }

    // Schedule backend sync (debounce 5s)
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    syncTimeoutRef.current = setTimeout(() => {
      syncToBackend();
    }, BACKEND_SYNC_INTERVAL);
  }, [answers, storageKey, started, resp, timeSec, syncToBackend]);

  // Lưu timeSec với debounce (mỗi 2 giây) để tránh lưu quá nhiều
  useEffect(() => {
    if (!started || resp) return;

    const current: AutoSaveData = {
      answers,
      timeSec,
      started,
      timestamp: Date.now(),
    };

    // Chỉ lưu nếu timeSec thay đổi
    const last = lastSaveRef.current;
    if (last && last.timeSec === current.timeSec) {
      return;
    }

    // Debounce localStorage: 2 giây
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

  // Xóa dữ liệu khi đã submit thành công (cả local + backend)
  useEffect(() => {
    if (resp) {
      try {
        localStorage.removeItem(storageKey);
        lastSaveRef.current = null;
      } catch (e) {
        console.error("Failed to clear auto-save data:", e);
      }

      // Xóa draft trên backend
      fetchWithAuth(`/api/draft/${testType}/${encodeURIComponent(testId)}`, {
        method: "DELETE",
      }).catch((e) => {
        console.error("Failed to delete draft from backend:", e);
      });
    }
  }, [resp, storageKey, testType, testId]);

  // Lưu trước khi đóng tab/refresh (beforeunload) - chỉ localStorage vì async không hoạt động
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

  // Cleanup
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  // Expose manual save function cho nút Tạm dừng
  const saveNow = useCallback(async () => {
    // Lưu localStorage ngay
    try {
      const current: AutoSaveData = {
        answers,
        timeSec,
        started,
        timestamp: Date.now(),
      };
      localStorage.setItem(storageKey, JSON.stringify(current));
    } catch (e) {
      console.error("Failed to save:", e);
    }

    // Sync backend ngay
    try {
      await fetchWithAuth("/api/draft/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testType,
          testKey: testId,
          answers,
          allIds,
          timeSec,
          startedAt: null,
        }),
      });
    } catch (e) {
      console.error("Failed to sync to backend:", e);
    }
  }, [answers, timeSec, started, storageKey, testType, testId, allIds]);

  return { saveNow };
}
