"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export function GoogleAuthEffect({ auth }: { auth?: string }) {
  const router = useRouter();
  const pathname = usePathname(); // ví dụ: /vi/homePage
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
        // XÓA query ?auth=... nhưng giữ nguyên locale/path hiện tại
        router.replace(pathname);
      }
    })();
  }, [auth, login, pathname, router]);

  return null;
}
