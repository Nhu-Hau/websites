/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { useNotifications } from "@/hooks/common/useNotifications";
import { useAuth } from "@/context/AuthContext";

type Elig = {
  eligible: boolean;
  nextEligibleAt?: string | null;
  remainingMs?: number | null;
  windowMinutes?: number;
  reason?: string;
  suggestedAt?: string | null;
};

const DEMO_MODE = false; // bật true để demo nhanh (15s)
const KEY_PREFIX = "progress:nudged:";
const PROGRESS_NOTIFICATION_TITLE_KEY = "newsComponents.progress.notification.title";
const PROGRESS_NOTIFICATION_MESSAGE_KEY = "newsComponents.progress.notification.message";

/** Ngưỡng điều chỉnh lịch check (ms) */
const NEAR_THRESHOLD_MS = 5 * 60 * 1000; // 5 phút
const FAR_SLEEP_MS_PROD = 15 * 60 * 1000; // 15 phút (prod)
const FAR_SLEEP_MS_DEV = 60 * 1000; // 60s (dev)
const NEAR_SLEEP_MS = 30 * 1000; // 30s khi gần tới hạn
const MIN_SLEEP_MS = 15 * 1000; // không ngủ ngắn hơn 15s (phòng timer spam)

/** Tiện ích: clamp khoảng ngủ hợp lý */
function clampSleep(ms: number) {
  const FAR = process.env.NODE_ENV === "production" ? FAR_SLEEP_MS_PROD : FAR_SLEEP_MS_DEV;
  // Nếu còn rất xa, không cần poll liên tục.
  if (ms > FAR) return FAR;
  // Nếu đã rất gần, poll nhanh hơn.
  if (ms <= NEAR_THRESHOLD_MS) return Math.max(NEAR_SLEEP_MS, MIN_SLEEP_MS);
  // Khoảng giữa thì ngủ đúng remaining, nhưng không nhỏ hơn MIN_SLEEP_MS
  return Math.max(ms, MIN_SLEEP_MS);
}

export default function ProgressEligibilityWatcher() {
  const { pushLocal } = useNotifications();
  const { user } = useAuth();
  const notificationT = useTranslations("newsComponents.progress.notification");

  // state/refs
  const timerRef = React.useRef<number | null>(null);
  const runningRef = React.useRef(false); // đang có 1 vòng check
  const startedRef = React.useRef(false); // đã khởi chạy watcher
  const firedThisMountRef = React.useRef(false); // tránh double-notify trong 1 mount

  const clearTimer = React.useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const schedule = React.useCallback((ms: number) => {
    clearTimer();
    timerRef.current = window.setTimeout(() => {
      void check();
    }, ms) as unknown as number;
  }, [clearTimer]);

  const oncePerWindow = React.useCallback((nextEligibleAt: string) => {
    try {
      return !!localStorage.getItem(KEY_PREFIX + nextEligibleAt);
    } catch {
      return false;
    }
  }, []);

  const markWindowFired = React.useCallback((nextEligibleAt: string) => {
    try {
      localStorage.setItem(KEY_PREFIX + nextEligibleAt, "1");
    } catch {}
  }, []);

  const notify = React.useCallback(async (nextEligibleAt: string) => {
    const fallbackTitle = notificationT("title");
    const fallbackMessage = notificationT("message");

    if (DEMO_MODE) {
      // demo: thả local noti sau 15s
      await new Promise((res) => setTimeout(res, 15_000));
      pushLocal({
        type: "system",
        key: PROGRESS_NOTIFICATION_MESSAGE_KEY,
        message: fallbackMessage,
        titleKey: PROGRESS_NOTIFICATION_TITLE_KEY,
        title: fallbackTitle,
        link: "/progress",
      });
      return;
    }

    // Tạo notification DB (để đồng bộ đa thiết bị)
    fetch("/api/notifications", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "system",
        key: PROGRESS_NOTIFICATION_MESSAGE_KEY,
        variables: {},
        message: fallbackMessage,
        link: "/progress",
        meta: { nextEligibleAt },
      }),
    }).catch(() => {});

    // Gửi ACK để BE ghi dấu đã nhắc
    fetch("/api/progress/eligibility/ack", {
      method: "POST",
      credentials: "include",
    }).catch(() => {});
  }, [pushLocal, notificationT]);

  const check = React.useCallback(async () => {
    // Chưa đăng nhập thì thôi, khỏi chạy
    if (!user?.id) return;

    if (runningRef.current) return;
    runningRef.current = true;

    try {
      const r = await fetch("/api/progress/eligibility", {
        credentials: "include",
        cache: "no-store",
      });

      // 401 → dừng watcher, tránh spam log BE
      if (r.status === 401) {
        clearTimer();
        startedRef.current = false;
        return;
      }

      if (!r.ok) {
        // lỗi khác → backoff nhẹ
        schedule(process.env.NODE_ENV === "production" ? FAR_SLEEP_MS_PROD : FAR_SLEEP_MS_DEV);
        return;
      }

      const j: Elig = await r.json();

      // Nếu chưa tới hạn mở progress
      if (!j.eligible || !j.nextEligibleAt) {
        // Nếu BE trả remainingMs thì dùng để hẹn, không thì dùng ngưỡng xa/gần
        const remaining = typeof j.remainingMs === "number" ? j.remainingMs : Number.MAX_SAFE_INTEGER;
        schedule(clampSleep(remaining));
        return;
      }

      // Tới hạn rồi → chỉ báo 1 lần trong “cửa sổ” này
      if (!oncePerWindow(j.nextEligibleAt) && !firedThisMountRef.current) {
        firedThisMountRef.current = true;
        markWindowFired(j.nextEligibleAt);
        await notify(j.nextEligibleAt);
      }

      // Sau khi đã notify, để tránh spam: ngủ 6 giờ rồi mới kiểm tra lại
      // (tuỳ ý, bạn có thể tăng/giảm)
      schedule(6 * 60 * 60 * 1000);
    } catch {
      // network error → backoff nhẹ
      schedule(process.env.NODE_ENV === "production" ? FAR_SLEEP_MS_PROD : FAR_SLEEP_MS_DEV);
    } finally {
      runningRef.current = false;
    }
  }, [
    user?.id,
    clearTimer,
    schedule,
    oncePerWindow,
    markWindowFired,
    notify,
  ]);

  // lifecycle
  React.useEffect(() => {
    // Chỉ khởi động khi đã đăng nhập
    if (!user?.id) {
      clearTimer();
      startedRef.current = false;
      firedThisMountRef.current = false;
      return;
    }

    if (startedRef.current) return;
    startedRef.current = true;

    // chạy ngay 1 lần
    void check();

    // check lại khi tab được focus/visible
    const onFocus = () => void check();
    const onVisibility = () => {
      if (document.visibilityState === "visible") void check();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearTimer();
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      startedRef.current = false;
      firedThisMountRef.current = false;
    };
  }, [user?.id, check, clearTimer]);

  return null;
}