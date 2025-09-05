"use client";

import { createContext, useContext, useEffect, useState } from "react";

type User = {
  id: string;
  email: string;
  name?: string;
  role?: "free" | "premium";
  level?: "beginner" | "intermediate" | "advanced";
  createdAt?: string;
  updatedAt?: string;
} | null;

type AuthContextType = {
  user: User;
  login: (u: NonNullable<User>) => void;
  logout: () => Promise<void> | void;
  loading: boolean; // đang tải profile ban đầu
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  // Gọi /me khi mount; nếu 401 thì thử /refresh rồi gọi lại /me
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // 1) thử /me
        let res = await fetch("/api/auth/me", { credentials: "include" });

        // 2) nếu 401 → refresh
        if (res.status === 401) {
          const r = await fetch("/api/auth/refresh", {
            method: "POST",
            credentials: "include",
          });
          if (r.ok) {
            res = await fetch("/api/auth/me", { credentials: "include" });
          }
        }

        // 3) ok → set user
        if (res.ok) {
          const profile = await res.json();
          if (mounted) setUser(profile);
        }
      } catch {}
      if (mounted) setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  function login(u: NonNullable<User>) {
    setUser(u); // cập nhật ngay sau khi API đăng nhập/đăng ký trả về
  }

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {}
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
