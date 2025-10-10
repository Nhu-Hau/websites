/* eslint-disable @typescript-eslint/no-explicit-any */
// frontend/src/context/AuthContext.tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type User = {
  id: string;
  email: string;
  name?: string;
  role: "free" | "premium";
  level: 1 | 2 | 3 | 4;              
  levelUpdatedAt?: string | null;
  levelSource?: "manual" | "placement" | null;
  lastPlacementAttemptId?: string | null;
  createdAt?: string;
  updatedAt?: string;
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
    setUser(profile);
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        try {
          await fetchMe();
        } catch (e: any) {
          if (String(e.message) === "401") {
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

  function login(u: NonNullable<User>) {
    setUser(u); // sau khi /login trả về
  }

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {}
    setUser(null);
  }

  async function refresh() {
    try {
      await fetchMe();
    } catch {
      // nếu lỗi (401…) thì set null
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider
      value={{ user, setUser, login, logout, refresh, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
