/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/[locale]/account/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

type SafeUser = {
  id: string;
  name?: string;
  email: string;
  role: "user" | "admin";
  access: "free" | "premium";
  level: number;
  levelUpdatedAt?: string | null;
  levelSource?: "manual" | "placement" | null;
  lastPlacementAttemptId?: string | null;
  picture?: string;
  createdAt?: string;
  updatedAt?: string;
};

export default function AccountPage() {
  const router = useRouter();
  const { user: ctxUser } = useAuth();
  const [user, setUser] = useState<SafeUser | null>(ctxUser as any ?? null);
  const [loading, setLoading] = useState(!ctxUser);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        if (ctxUser) {
          setUser(ctxUser as any);
          setLoading(false);
          return;
        }
        setLoading(true);
        const res = await fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
        });
        if (!alive) return;
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        } else {
          toast.error("Vui lòng đăng nhập");
          router.push("/auth/login");
        }
      } catch {
        toast.error("Không thể tải thông tin người dùng");
        router.push("/auth/login");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, [ctxUser, router]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-6 mt-16 text-sm text-zinc-500">
        Đang tải hồ sơ…
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto p-6 mt-16 space-y-6">
      <h1 className="text-2xl font-bold">Hồ sơ của bạn</h1>

      <div className="rounded-2xl border p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <div className="text-xs text-zinc-500">Họ tên</div>
          <div className="font-medium">{user.name || "-"}</div>
        </div>
        <div className="space-y-1">
          <div className="text-xs text-zinc-500">Email</div>
          <div className="font-medium">{user.email}</div>
        </div>
        <div className="space-y-1">
          <div className="text-xs text-zinc-500">Gói</div>
          <div className="font-medium capitalize">{user.role}</div>
        </div>
        <div className="space-y-1">
          <div className="text-xs text-zinc-500">Level hiện tại</div>
          <div className="font-medium">
            <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-sm">
              {user.level}
            </span>
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-xs text-zinc-500">Nguồn level</div>
          <div className="font-medium">{user.levelSource || "-"}</div>
        </div>
        <div className="space-y-1">
          <div className="text-xs text-zinc-500">Cập nhật level lúc</div>
          <div className="font-medium">
            {user.levelUpdatedAt
              ? new Date(user.levelUpdatedAt).toLocaleString()
              : "-"}
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-xs text-zinc-500">Lần kiểm tra gần nhất</div>
          <div className="font-medium">
            {user.lastPlacementAttemptId ? (
              <a
                className="underline"
                href={`/placement/result/${user.lastPlacementAttemptId}`}
              >
                Xem kết quả
              </a>
            ) : (
              "-"
            )}
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-xs text-zinc-500">Thời gian tạo</div>
          <div className="font-medium">
            {user.createdAt ? new Date(user.createdAt).toLocaleString() : "-"}
          </div>
        </div>
      </div>
    </div>
  );
}