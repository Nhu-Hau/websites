/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { useNotifications } from "@/hooks/common/useNotifications";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";
import { useTranslations } from "next-intl";

/** Phản hồi từ BE /api/practice/inactivity */
type InactResp = {
  inactive: boolean; // true khi quá ngưỡng
  shouldNudge: boolean; // true nếu không dính cooldown → được nhắc
  reason: "no_practice_yet" | "exceed_threshold" | "ok";
  lastPracticeAt: string | null; // ISO
  thresholdMs: number; // ngưỡng in ms
  cooldownMs: number; // cooldown in ms
  lastNudgedAt: string | null; // ISO
  nextNudgeAt: string; // ISO (thời điểm sớm nhất có thể nhắc lần tới)
  remainingMs: number | null; // ms còn lại để chạm ngưỡng (nếu chưa đủ)
};

const KEY_PREFIX = "practice:inactivity:nudged:";
const POLL_MS = 15_000; // poll nhẹ, chỉ đổi env là test được
const CREATE_DB_NOTIFICATION = true; // muốn tắt lưu DB thì set false
const INACTIVITY_TITLE_KEY = "Practice.inactivity.title";
const INACTIVITY_MESSAGE_KEY = "Practice.inactivity.message";

export default function PracticeInactivityWatcher() {
  const t = useTranslations("Practice.inactivity");
  const { pushLocal } = useNotifications();
  const basePrefix = useBasePrefix(); // vd: /vi hoặc /en

  const startedRef = React.useRef(false);
  const timerRef = React.useRef<number | null>(null);
  const firedThisWindowRef = React.useRef(false);

  const oncePerWindow = React.useCallback((signature: string) => {
    try {
      return !!localStorage.getItem(KEY_PREFIX + signature);
    } catch {
      return false;
    }
  }, []);

  const markWindowFired = React.useCallback((signature: string) => {
    try {
      localStorage.setItem(KEY_PREFIX + signature, "1");
    } catch {}
  }, []);

  // Ack trước rồi mới push (tránh reload → BE chưa kịp set lastInactivityNudgedAt)
  const notify = React.useCallback(
    async (sig: string, linkHref: string) => {
      // 1) Ack trước
      await fetch("/api/practice/inactivity/ack", {
        method: "POST",
        credentials: "include",
      }).catch(() => {});

      // 2) (tuỳ chọn) lưu DB notification để đồng bộ đa thiết bị
      if (CREATE_DB_NOTIFICATION) {
        fetch("/api/notifications", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "system",
            message: t("dbMessage"),
            link: linkHref,
            meta: { sig },
          }),
        }).catch(() => {});
      }

      // 3) Đẩy vào chuông + corner (useNotifications đã chống trùng nội bộ)
      pushLocal({
        type: "system",
        key: INACTIVITY_MESSAGE_KEY,
        message: t("message"),
        titleKey: INACTIVITY_TITLE_KEY,
        title: t("title"),
        link: linkHref,
      });
    },
    [pushLocal, t]
  );

  const check = React.useCallback(async () => {
    try {
      const r = await fetch("/api/practice/inactivity", {
        credentials: "include",
        cache: "no-store",
      });
      if (!r.ok) return;
      const j: InactResp = await r.json();

      // chỉ nhắc khi (1) quá ngưỡng inactivitiy và (2) không dính cooldown
      if (!j.inactive || !j.shouldNudge) return;

      // Tạo "cửa sổ" ký hiệu ổn định để de-dup:
      // - Nếu đã từng nudge: đổi theo lastNudgedAt (mỗi lần ack là 1 cửa sổ mới)
      // - Nếu chưa từng nudge: dùng firstEligibleAt = lastPracticeAt + thresholdMs (cố định tới khi có practice mới)
      // - Trường hợp chưa từng practice: vẫn tạo key ổn định theo thresholdMs
      const firstEligibleAt =
        j.lastPracticeAt ? new Date(j.lastPracticeAt).getTime() + j.thresholdMs : null;

      const windowSig = j.lastNudgedAt
        ? `nudged:${j.lastNudgedAt}|cd:${j.cooldownMs}`
        : firstEligibleAt
        ? `firstEligible:${new Date(firstEligibleAt).toISOString()}|thr:${j.thresholdMs}`
        : `noPracticeYet|thr:${j.thresholdMs}`;

      if (firedThisWindowRef.current || oncePerWindow(windowSig)) return;

      firedThisWindowRef.current = true;
      markWindowFired(windowSig);

      const linkHref = `${basePrefix}/practice/part.1?level=1`; // có locale
      await notify(windowSig, linkHref);
    } catch {
      // ignore network/misc errors
    }
  }, [oncePerWindow, markWindowFired, notify, basePrefix]);

  React.useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    // check ngay khi mount
    check();

    // poll định kỳ
    timerRef.current = window.setInterval(check, POLL_MS) as unknown as number;

    // re-check khi tab quay lại
    const onFocus = () => check();
    const onVis = () => {
      if (document.visibilityState === "visible") check();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [check]);

  return null;
}