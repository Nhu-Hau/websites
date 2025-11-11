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

  // Cache để tránh fetch quá nhiều lần trong thời gian ngắn
  const fetchMeCache = useRef<{ data: User; timestamp: number } | null>(null);
  const CACHE_DURATION = 1000; // 1 giây cache

  async function fetchMe(skipCache = false) {
    // Kiểm tra cache
    if (!skipCache && fetchMeCache.current) {
      const age = Date.now() - fetchMeCache.current.timestamp;
      if (age < CACHE_DURATION) {
        setUser(fetchMeCache.current.data);
        return;
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // Timeout 5s

    try {
      const res = await fetch("/api/auth/me", {
        credentials: "include",
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      
      if (!res.ok) throw new Error(String(res.status));
      const profile = await res.json();
      const u =
        (profile && typeof profile === "object" && (profile.user || profile.data)) ||
        profile;
      const userData = u ?? null;
      
      // Lưu cache
      fetchMeCache.current = { data: userData, timestamp: Date.now() };
      setUser(userData);
    } catch (e: any) {
      clearTimeout(timeoutId);
      if (e.name === "AbortError") {
        // Timeout - không set user null, giữ nguyên state
        return;
      }
      throw e;
    }
  }

  async function refresh() {
    try {
      // Thử fetchMe trước (có cache nên nhanh)
      try {
        await fetchMe();
      } catch (e: any) {
        const status = String(e?.message);
        if (status === "401" || status === "403") {
          // Token hết hạn, refresh ngay lập tức
          const refreshController = new AbortController();
          const refreshTimeout = setTimeout(() => refreshController.abort(), 3000); // Timeout 3s cho refresh
          
          try {
            const refreshRes = await fetch("/api/auth/refresh", {
              method: "POST",
              credentials: "include",
              signal: refreshController.signal,
            });
            clearTimeout(refreshTimeout);
            
            if (refreshRes.ok) {
              // Refresh thành công, fetchMe lại (skip cache)
              await fetchMe(true);
            } else {
              setUser(null);
              fetchMeCache.current = null;
            }
          } catch (refreshErr: any) {
            clearTimeout(refreshTimeout);
            if (refreshErr.name !== "AbortError") {
              setUser(null);
              fetchMeCache.current = null;
            }
          }
        } else {
          setUser(null);
          fetchMeCache.current = null;
        }
      }
    } catch {
      setUser(null);
      fetchMeCache.current = null;
    }
  }

  const refreshTimer = useRef<number | null>(null);
  const isRefreshing = useRef(false);
  
  const debouncedRefresh = useMemo(
    () =>
      function () {
        // Tránh refresh đồng thời
        if (isRefreshing.current) return;
        
        if (refreshTimer.current) {
          window.clearTimeout(refreshTimer.current);
        }
        refreshTimer.current = window.setTimeout(async () => {
          if (isRefreshing.current) return;
          isRefreshing.current = true;
          try {
            await refresh();
          } finally {
            isRefreshing.current = false;
            refreshTimer.current = null;
          }
        }, 100); // Giảm debounce xuống 100ms để nhanh hơn
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
            const refreshController = new AbortController();
            const refreshTimeout = setTimeout(() => refreshController.abort(), 3000);
            
            try {
              const r = await fetch("/api/auth/refresh", {
                method: "POST",
                credentials: "include",
                signal: refreshController.signal,
              });
              clearTimeout(refreshTimeout);
              
              if (r.ok) {
                await fetchMe(true);
              } else {
                setUser(null);
                fetchMeCache.current = null;
              }
            } catch (refreshErr: any) {
              clearTimeout(refreshTimeout);
              if (refreshErr.name !== "AbortError") {
                setUser(null);
                fetchMeCache.current = null;
              }
            }
          } else {
            setUser(null);
            fetchMeCache.current = null;
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

  // Auto-refresh token trước khi hết hạn (mỗi 20 phút, token có 30 phút) - tăng tần suất để tránh hết hạn
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(async () => {
      if (isRefreshing.current) return;
      
      try {
        isRefreshing.current = true;
        const refreshController = new AbortController();
        const refreshTimeout = setTimeout(() => refreshController.abort(), 3000);
        
        try {
          // Refresh token trước khi hết hạn
          const refreshRes = await fetch("/api/auth/refresh", {
            method: "POST",
            credentials: "include",
            signal: refreshController.signal,
          });
          clearTimeout(refreshTimeout);
          
          if (refreshRes.ok) {
            // Refresh thành công, cập nhật user info (skip cache)
            await fetchMe(true);
          }
        } catch (e: any) {
          clearTimeout(refreshTimeout);
          if (e.name !== "AbortError") {
            console.warn("Auto-refresh token failed:", e);
          }
        } finally {
          isRefreshing.current = false;
        }
      } catch (e) {
        isRefreshing.current = false;
        console.warn("Auto-refresh token failed:", e);
      }
    }, 20 * 60 * 1000); // Mỗi 20 phút (tăng tần suất từ 25 phút)

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
    fetchMeCache.current = null;
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