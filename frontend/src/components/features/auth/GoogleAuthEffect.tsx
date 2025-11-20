"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "@/lib/toast";
import { useAuth } from "@/context/AuthContext";

export function GoogleAuthEffect({ auth }: { auth?: string }) {
  const router = useRouter();
  const pathname = usePathname(); // ví dụ: /vi/home
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
          toast.success("Đăng nhập Google thành công!");
        } else {
          // Nếu không thành công, thử refresh token trước
          const refreshRes = await fetch("/api/auth/refresh", {
            method: "POST",
            credentials: "include",
            cache: "no-store",
          });
          if (refreshRes.ok) {
            // Thử lại lấy thông tin user
            const retryRes = await fetch("/api/auth/me", {
              credentials: "include",
              cache: "no-store",
            });
            if (retryRes.ok) {
              const profile = await retryRes.json();
              login(profile);
              toast.success("Đăng nhập Google thành công!");
            } else {
              toast.error("Không thể lấy thông tin người dùng sau khi đăng nhập Google");
            }
          } else {
            toast.error("Phiên đăng nhập đã hết hạn, vui lòng thử lại");
          }
        }
      } catch (error) {
        console.error("[GoogleAuthEffect] Error:", error);
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
