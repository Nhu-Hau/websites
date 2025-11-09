/* eslint-disable @typescript-eslint/no-explicit-any */
// frontend/src/context/AuthContext.tsx
"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

export type User = {
  id: string;
  email: string;
  name?: string;
  role: "user" | "admin" | "teacher";
  access: "free" | "premium";
  level: 1 | 2 | 3;
  levelUpdatedAt?: string | null;
  levelSource?: "manual" | "placement" | null;
  lastPlacementAttemptId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  partLevels?: any;
} | null;

type AuthContextType = {
  user: User;
  setUser: (u: User) => void;
  login: (u: NonNullable<User>) => void;
  logout: () => Promise<void> | void;
  refresh: () => Promise<void>;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function announceUserChanged() {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new Event("auth:updated"));
    const bc = new BroadcastChannel("user-updates");
    bc.postMessage({ type: "auth:changed", ts: Date.now() });
    bc.close();
    localStorage.setItem("user:levels:changed", String(Date.now()));
  } catch {
  }
}

export function announceLevelsChanged() {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new Event("practice:updated"));
    const bc = new BroadcastChannel("user-updates");
    bc.postMessage({ type: "levels:changed", ts: Date.now() });
    bc.close();
    localStorage.setItem("user:levels:changed", String(Date.now()));
  } catch {
    /* noop */
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  async function fetchMe() {
    const res = await fetch("/api/auth/me", {
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) throw new Error(String(res.status));
    const profile = await res.json();
    const u =
      (profile && typeof profile === "object" && (profile.user || profile.data)) ||
      profile;
    setUser(u ?? null);
  }

  async function refresh() {
    try {
      // Thử refresh token trước nếu /auth/me fail
      try {
        await fetchMe();
      } catch (e: any) {
        if (String(e?.message) === "401" || String(e?.message) === "403") {
          // Token hết hạn, thử refresh
          const refreshRes = await fetch("/api/auth/refresh", {
            method: "POST",
            credentials: "include",
          });
          if (refreshRes.ok) {
            // Refresh thành công, thử lại fetchMe
            await fetchMe();
          } else {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
    } catch {
      setUser(null);
    }
  }

  const refreshTimer = useRef<number | null>(null);
  const debouncedRefresh = useMemo(
    () =>
      function () {
        if (refreshTimer.current) {
          window.clearTimeout(refreshTimer.current);
        }
        refreshTimer.current = window.setTimeout(() => {
          refresh();
          refreshTimer.current = null;
        }, 200); // debounce 200ms
      },
    []
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        try {
          await fetchMe();
        } catch (e: any) {
          if (String(e?.message) === "401" || String(e?.message) === "403") {
            const r = await fetch("/api/auth/refresh", {
              method: "POST",
              credentials: "include",
            });
            if (r.ok) await fetchMe();
            else setUser(null);
          } else {
            setUser(null);
          }
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Auto-refresh token trước khi hết hạn (mỗi 25 phút, token có 30 phút)
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(async () => {
      try {
        // Refresh token trước khi hết hạn
        const refreshRes = await fetch("/api/auth/refresh", {
          method: "POST",
          credentials: "include",
        });
        if (refreshRes.ok) {
          // Refresh thành công, cập nhật user info
          await fetchMe();
        }
      } catch (e) {
        console.warn("Auto-refresh token failed:", e);
      }
    }, 25 * 60 * 1000); // Mỗi 25 phút

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Lắng nghe các tín hiệu để luôn cập nhật không cần reload
  useEffect(() => {
    // 1) Trong-tab: các component khác có thể dispatch các event này
    const onPracticeUpdated = () => debouncedRefresh();
    const onAuthUpdated = () => debouncedRefresh();

    window.addEventListener("practice:updated", onPracticeUpdated as any);
    window.addEventListener("auth:updated", onAuthUpdated as any);

    // 2) Đa-tab: BroadcastChannel
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("user-updates");
      bc.onmessage = (e) => {
        const t = e?.data?.type;
        if (t === "levels:changed" || t === "auth:changed") {
          debouncedRefresh();
        }
      };
    } catch {
      // ignore if not supported
    }

    // 3) Đa-tab fallback: storage event
    const onStorage = (ev: StorageEvent) => {
      if (ev.key === "user:levels:changed") debouncedRefresh();
    };
    window.addEventListener("storage", onStorage);

    // 4) Quay lại tab (visibilitychange)
    const onVis = () => {
      if (document.visibilityState === "visible") debouncedRefresh();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      window.removeEventListener("practice:updated", onPracticeUpdated as any);
      window.removeEventListener("auth:updated", onAuthUpdated as any);
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVis);
      if (bc) bc.close();
      if (refreshTimer.current) {
        window.clearTimeout(refreshTimer.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function login(u: NonNullable<User>) {
    setUser(u); // sau khi /login trả về
    // phát tín hiệu để các nơi khác (đa tab/khác component) tự refresh
    announceUserChanged();
  }

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {}
    setUser(null);
    announceUserChanged();
  }

  const ctxValue: AuthContextType = {
    user,
    setUser,   // cho phép optimistic update từ ngoài nếu cần
    login,
    logout,
    refresh,
    loading,
  };

  return <AuthContext.Provider value={ctxValue}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}