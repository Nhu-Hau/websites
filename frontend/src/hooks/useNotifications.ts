/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React from "react";
import { getSocket } from "@/lib/socket";

export type RealtimeNotification = {
  id: string;
  type: "like" | "comment";
  postId?: string;
  actorName?: string;
  message: string;
  createdAt: string;
  link: string;
  extra?: any;
  read?: boolean;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";
const MAX_ITEMS = 50;
const TTL_HOURS = 72;

const KEY_LAST_UID = "notif:__last_uid";
const KEY_TEMP = "notif:__temp";
const keyFor = (uid: string) => `notif:${uid}`;

const ttlMs = TTL_HOURS * 3600 * 1000;

function prune(arr: RealtimeNotification[]): RealtimeNotification[] {
  const now = Date.now();
  return (arr || [])
    .filter(n => {
      const t = Date.parse(n.createdAt || "");
      return isFinite(t) ? (now - t) <= ttlMs : true;
    })
    .slice(0, MAX_ITEMS);
}

function readJSON<T = any>(k: string): T | null {
  try { const raw = localStorage.getItem(k); return raw ? JSON.parse(raw) as T : null; } catch { return null; }
}
function writeJSON(k: string, v: any) {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
}
function removeKey(k: string) {
  try { localStorage.removeItem(k); } catch {}
}

export function useNotifications() {
  const [items, setItems] = React.useState<RealtimeNotification[]>([]);
  const unread = items.filter(n => !n.read).length;

  const uidRef = React.useRef<string | null>(null);
  const hydratedRef = React.useRef(false);

  const saveBox = React.useCallback((uid: string | null, arr: RealtimeNotification[]) => {
    const key = uid ? keyFor(uid) : KEY_TEMP;
    writeJSON(key, prune(arr));
    if (uid) writeJSON(KEY_LAST_UID, uid);
  }, []);

  React.useEffect(() => {
    let mounted = true;
    const s = getSocket();

    async function fetchMe(): Promise<string | null> {
      try {
        const r = await fetch(`${API_BASE}/api/auth/me`, { credentials: "include", cache: "no-store" });
        if (!r.ok) return null;
        const j = await r.json();
        return j?.user?._id ? String(j.user._id) : null;
      } catch {
        return null;
      }
    }

    const joinMyRoom = () => {
      const uid = uidRef.current;
      if (uid) s.emit("identify", { userId: uid });
    };

    const onNotify = (n: RealtimeNotification) => {
      if (!mounted) return;
      const safe: RealtimeNotification = { ...n, createdAt: n.createdAt || new Date().toISOString() };
      setItems(prev => {
        const next = prev.some(x => x.id === safe.id) ? prev : [safe, ...prev];
        // lưu ngay vào kho hiện hành (có uid → kho uid, chưa có → temp)
        saveBox(uidRef.current, next);
        // bắn corner toast
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("corner-toast", { detail: safe }));
        }
        return prune(next);
      });
    };

    (async () => {
      // B1: rehydrate sớm nhất có thể
      if (!hydratedRef.current) {
        const lastUid = readJSON<string>(KEY_LAST_UID);
        const seed = lastUid ? readJSON<RealtimeNotification[]>(keyFor(lastUid)) : readJSON<RealtimeNotification[]>(KEY_TEMP);
        if (seed && mounted) setItems(prune(seed));
      }

      // B2: lấy uid thực tế
      uidRef.current = await fetchMe();

      // B3: nếu có uid → merge từ temp sang kho uid, xoá temp
      if (!hydratedRef.current) {
        hydratedRef.current = true;
        const uid = uidRef.current;
        if (uid) {
          const temp = readJSON<RealtimeNotification[]>(KEY_TEMP) || [];
          const mine = readJSON<RealtimeNotification[]>(keyFor(uid)) || [];
          // merge de-dup theo id (ưu tiên trạng thái read của kho uid)
          const map = new Map<string, RealtimeNotification>();
          for (const n of prune([...temp, ...mine])) map.set(n.id, n);
          const merged = Array.from(map.values());
          setItems(merged);
          writeJSON(keyFor(uid), merged);
          removeKey(KEY_TEMP);
          writeJSON(KEY_LAST_UID, uid);
        }
      }

      // socket room
      if (s.connected) joinMyRoom();
      s.on("connect", joinMyRoom);
      s.on("reconnect", joinMyRoom);
      s.on("notify:user", onNotify);
    })();

    return () => {
      mounted = false;
      s.off("connect", joinMyRoom);
      s.off("reconnect", joinMyRoom);
      s.off("notify:user", onNotify);
    };
  }, [saveBox]);

  // Persist mỗi khi items đổi (kể cả chưa biết uid → lưu temp)
  React.useEffect(() => {
    saveBox(uidRef.current, items);
  }, [items, saveBox]);

  const markAllRead = React.useCallback(() => {
    setItems(prev => {
      const next = prev.map(x => ({ ...x, read: true }));
      saveBox(uidRef.current, next);
      return next;
    });
  }, [saveBox]);

  const clearAll = React.useCallback(() => {
    setItems([]);
    const uid = uidRef.current;
    removeKey(uid ? keyFor(uid) : KEY_TEMP);
  }, []);

  const markRead = React.useCallback((id: string) => {
    setItems(prev => {
      const next = prev.map(x => (x.id === id ? { ...x, read: true } : x));
      saveBox(uidRef.current, next);
      return next;
    });
  }, [saveBox]);

  return { items, unread, markAllRead, clearAll, markRead };
}