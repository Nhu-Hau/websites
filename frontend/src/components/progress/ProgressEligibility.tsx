/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { useNotifications } from "@/hooks/useNotifications";

type Elig = {
  eligible: boolean;
  nextEligibleAt?: string;
};

const DEMO_MODE = false; // bật true để demo nhanh (15s)
const KEY_PREFIX = "progress:nudged:";
const POLL_MS = process.env.NODE_ENV === "production" ? 60_000 : 5_000; // prod 60s / dev 5s
const CREATE_DB_NOTIFICATION = true; // lưu DB để đồng bộ cross-device

export default function ProgressEligibilityWatcher() {
  const { pushLocal } = useNotifications();

  const startedRef = React.useRef(false);
  const firedThisMountRef = React.useRef(false);
  const timerRef = React.useRef<number | null>(null);

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
    // lưu DB (không corner ở đây để tránh double)
    if (CREATE_DB_NOTIFICATION) {
      fetch("/api/notifications", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "system",
          message: "Đến lúc kiểm tra tiến bộ! Nhấn để bắt đầu Progress Test.",
          link: "/progress",
          meta: { nextEligibleAt },
        }),
      }).catch(() => {});
    }

    // ack BE để ghi dấu đã hiển thị
    fetch("/api/progress/eligibility/ack", {
      method: "POST",
      credentials: "include",
    }).catch(() => {});
  }, []);

  const check = React.useCallback(async () => {
    try {
      const r = await fetch("/api/progress/eligibility", {
        credentials: "include",
        cache: "no-store",
      });
      if (!r.ok) return;
      const j: Elig = await r.json();

      if (DEMO_MODE) {
        await new Promise((res) => setTimeout(res, 15_000));
        pushLocal({
          type: "system",
          title: "Đến lúc kiểm tra tiến bộ!",
          message: "Đến lúc kiểm tra tiến bộ! Nhấn để bắt đầu Progress Test.",
          link: "/progress",
        });
        return;
      }

      if (!j.eligible || !j.nextEligibleAt) return;
      if (oncePerWindow(j.nextEligibleAt) || firedThisMountRef.current) return;

      firedThisMountRef.current = true;
      markWindowFired(j.nextEligibleAt);
      await notify(j.nextEligibleAt);
    } catch {
      // ignore
    }
  }, [oncePerWindow, markWindowFired, notify, pushLocal]);

  React.useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    check();
    timerRef.current = window.setInterval(check, POLL_MS) as unknown as number;

    const onFocus = () => check();
    const onVisibility = () => {
      if (document.visibilityState === "visible") check();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [check]);

  return null;
}
