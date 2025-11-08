/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { getSocket } from "@/lib/socket";

export type RealtimeNotification = {
  id: string;
  type: "like" | "comment" | "system";
  message: string;
  link: string;
  createdAt: string;
  read?: boolean;
  // có thể có meta nếu cần
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
const MAX_ITEMS = 50;
const TTL_HOURS = 72;

const KEY_LAST_UID = "notif:__last_uid";
const KEY_TEMP = "notif:__temp";
const keyFor = (uid: string) => `notif:${uid}`;
const ttlMs = TTL_HOURS * 3600 * 1000;

// ====== Event Bus toàn cục (an toàn StrictMode/HMR) ======
const getBus = () => {
  if (typeof window === "undefined") return null;
  if (!(window as any).__notifBus) {
    (window as any).__notifBus = new EventTarget();
  }
  return (window as any).__notifBus as EventTarget;
};

function prune(arr: RealtimeNotification[]): RealtimeNotification[] {
  const now = Date.now();
  return (arr || [])
    .filter((n) => {
      const t = Date.parse(n.createdAt || "");
      return isFinite(t) ? now - t <= ttlMs : true;
    })
    .slice(0, MAX_ITEMS);
}
function readJSON<T = any>(k: string): T | null {
  try {
    const raw = localStorage.getItem(k);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function writeJSON(k: string, v: any) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {}
}
function removeKey(k: string) {
  try {
    localStorage.removeItem(k);
  } catch {}
}

export function useNotifications() {
  const [items, setItems] = React.useState<RealtimeNotification[]>([]);
  const unread = items.filter((n) => !n.read).length;

  const uidRef = React.useRef<string | null>(null);

  const saveBox = React.useCallback(
    (uid: string | null, arr: RealtimeNotification[]) => {
      const key = uid ? keyFor(uid) : KEY_TEMP;
      writeJSON(key, prune(arr));
      if (uid) writeJSON(KEY_LAST_UID, uid);
    },
    []
  );

  // 🧠 chuẩn hóa + merge helper (dùng lại ở nhiều nơi)
  const mergeIn = React.useCallback(
    (incoming: RealtimeNotification | RealtimeNotification[]) => {
      const list = Array.isArray(incoming) ? incoming : [incoming];
      setItems((prev) => {
        const map = new Map<string, RealtimeNotification>();
        // prev trước để giữ trạng thái read
        for (const n of prev) map.set(n.id, n);
        for (const n0 of list) {
          const n: RealtimeNotification = {
            ...n0,
            createdAt: n0.createdAt || new Date().toISOString(),
          };
          const existed = map.get(n.id);
          map.set(n.id, existed ? { ...existed, ...n } : n);
        }
        const merged = Array.from(map.values()).sort(
          (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)
        );
        saveBox(uidRef.current, merged);
        return prune(merged);
      });
    },
    [saveBox]
  );

  // 🔔 Đẩy local + corner toast + phát bus để các instance khác nhận ngay
  const pushLocal = React.useCallback(
    (payload: {
      id?: string;
      title?: string;
      message: string;
      link?: string;
      type?: "system" | "like" | "comment";
    }) => {
      const id =
        payload.id || `${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const n: RealtimeNotification = {
        id,
        type: payload.type || "system",
        message: payload.message,
        link: payload.link || "#",
        createdAt: new Date().toISOString(),
        read: false,
      };

      // 1) cập nhật state hiện tại
      mergeIn(n);

      // 2) corner toast (chỉ 1 nơi)
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("corner-toast", {
            detail: {
              id,
              title: payload.title || "Thông báo",
              message: payload.message,
              link: payload.link || "#",
            },
          })
        );
      }

      // 3) phát bus để MỌI instance useNotifications khác merge ngay lập tức
      const bus = getBus();
      bus?.dispatchEvent(new CustomEvent("notif:add", { detail: n }));
    },
    [mergeIn]
  );

  React.useEffect(() => {
    const s = getSocket();
    const bus = getBus();

    async function fetchMe(): Promise<string | null> {
      try {
        const r = await fetch(`${API_BASE}/api/auth/me`, {
          credentials: "include",
          cache: "no-store",
        });
        if (!r.ok) return null;
        const j = await r.json();
        return j?.user?._id ? String(j.user._id) : null;
      } catch {
        return null;
      }
    }

    const joinMyRoom = () => {
      const uid = uidRef.current;
      if (uid) {
        s.emit("identify", { userId: uid });
        s.emit("join", { room: `user:${uid}` });
      }
      s.emit("join", { room: "community" });
    };

    const onNotify = (n: RealtimeNotification) => {
      // socket → merge + corner + phát bus
      mergeIn(n);
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("corner-toast", {
            detail: {
              id: n.id,
              title: "Thông báo",
              message: n.message,
              link: n.link,
            },
          })
        );
      }
      const bus = getBus();
      bus?.dispatchEvent(new CustomEvent("notif:add", { detail: n }));
    };

    const onBusAdd = (e: Event) => {
      const n = (e as CustomEvent).detail as RealtimeNotification;
      if (!n?.id) return;
      mergeIn(n);
    };

    (async () => {
      // rehydrate từ local
      const lastUid = readJSON<string>(KEY_LAST_UID);
      const seed = lastUid
        ? readJSON<RealtimeNotification[]>(keyFor(lastUid))
        : readJSON<RealtimeNotification[]>(KEY_TEMP);
      if (seed?.length) setItems(prune(seed));

      // lấy uid
      uidRef.current = await fetchMe();

      // sync từ DB (không corner để tránh double)
      try {
        const r = await fetch(`${API_BASE}/api/notifications?limit=50`, {
          credentials: "include",
          cache: "no-store",
        });
        const j = await r.json();
        const dbItems: RealtimeNotification[] = Array.isArray(j.items)
          ? j.items
          : [];
        if (dbItems.length) mergeIn(dbItems);
      } catch {}

      if (s.connected) joinMyRoom();
      s.on("connect", joinMyRoom);
      s.on("notify:user", onNotify);
      bus?.addEventListener("notif:add", onBusAdd as EventListener);
    })();

    return () => {
      s.off("connect", joinMyRoom);
      s.off("notify:user", onNotify);
      bus?.removeEventListener("notif:add", onBusAdd as EventListener);
    };
  }, [mergeIn]);

  const markAllRead = React.useCallback(() => {
    setItems((prev) => {
      const next = prev.map((x) => ({ ...x, read: true }));
      saveBox(uidRef.current, next);
      return next;
    });
    fetch(`${API_BASE}/api/notifications/mark-read-all`, {
      method: "POST",
      credentials: "include",
    }).catch(() => {});
  }, [saveBox]);

  const clearAll = React.useCallback(async () => {
    setItems([]);
    const uid = uidRef.current;
    removeKey(uid ? keyFor(uid) : KEY_TEMP);
    try {
      await fetch(`${API_BASE}/api/notifications/clear`, {
        method: "DELETE",
        credentials: "include",
      });
    } catch {}
  }, []);

  return { items, unread, markAllRead, clearAll, pushLocal };
}