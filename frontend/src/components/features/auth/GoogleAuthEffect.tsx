"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";

export function GoogleAuthEffect({ auth }: { auth?: string }) {
  const router = useRouter();
  const basePrefix = useBasePrefix(); // -> "/vi" | "/en" | ...
  const { login } = useAuth();
  const hasRun = useRef(false);

  useEffect(() => {
    if (auth !== "login_success") return;
    if (hasRun.current) return;
    hasRun.current = true;

    (async () => {
      try {
        const res = await fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
        });
        if (res.ok) {
          const profile = await res.json();
          login(profile);
        }
        toast.success("Đăng nhập Google thành công!");
      } catch {
        toast.error(
          "Không thể lấy thông tin người dùng sau khi đăng nhập Google"
        );
      } finally {
        // Redirect đến /home (không có query)
        router.replace(`${basePrefix}/home`);
      }
    })();
  }, [auth, login, basePrefix, router]);

  return null;
}
