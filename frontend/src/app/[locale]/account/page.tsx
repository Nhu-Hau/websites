/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

type PartStat = { total:number; correct:number; acc:number };

type AttemptLite = {
  _id: string;
  acc: number;
  submittedAt?: string;
  partStats?: Record<string, PartStat>;
  predicted?: { overall:number; listening:number; reading:number };
};

type SafeUser = {
  id: string;
  name?: string;
  email: string;
  role: "user" | "admin";
  access: "free" | "premium";
  level: 1|2|3;
  levelUpdatedAt?: string | null;
  levelSource?: "manual" | "placement" | null;
  lastPlacementAttemptId?: string | null;
  picture?: string;
  createdAt?: string;
  updatedAt?: string;
};

const ACCESS_LABEL: Record<SafeUser["access"], string> = {
  free: "Free",
  premium: "Premium",
};
const ACCESS_BADGE: Record<SafeUser["access"], string> = {
  free: "border-zinc-300 bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200",
  premium: "border-yellow-300 bg-yellow-100 text-yellow-800",
};
const LEVEL_BADGE: Record<1|2|3, string> = {
  1: "border-emerald-300 bg-emerald-100 text-emerald-800",
  2: "border-sky-300 bg-sky-100 text-sky-800",
  3: "border-violet-300 bg-violet-100 text-violet-800",
};

export default function AccountPage() {
  const locale = useLocale();
  const router = useRouter();
  const { user: ctxUser } = useAuth();

  const [user, setUser] = useState<SafeUser | null>((ctxUser as any) ?? null);
  const [loading, setLoading] = useState(!ctxUser);
  const [latest, setLatest] = useState<AttemptLite | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        // 1) user
        if (ctxUser) {
          setUser(ctxUser as any);
        } else {
          const res = await fetch("/api/auth/me", { credentials: "include", cache: "no-store" });
          if (!res.ok) { toast.error("Vui lòng đăng nhập"); router.push("/auth/login"); return; }
          const u = await res.json();
          if (!alive) return;
          setUser(u);
        }

        // 2) latest placement (for predicted + part suggestions)
        const r = await fetch("/api/placement/attempts?limit=1", { credentials: "include", cache: "no-store" });
        if (r.ok) {
          const j = await r.json();
          const id = j?.items?.[0]?._id as string | undefined;
          if (id) {
            const d = await fetch(`/api/placement/attempts/${id}`, { credentials: "include", cache: "no-store" });
            if (d.ok) {
              const full = await d.json();
              if (alive) setLatest({
                _id: full._id,
                acc: full.acc,
                submittedAt: full.submittedAt,
                partStats: full.partStats,
                predicted: full.predicted,
              });
            }
          }
        }
      } catch {
        if (alive) {
          toast.error("Không thể tải hồ sơ");
          router.push("/auth/login");
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [ctxUser, router]);

  if (loading) {
    return <div className="max-w-3xl mx-auto p-6 mt-16 text-sm text-zinc-500">Đang tải hồ sơ…</div>;
  }
  if (!user) return null;

  const levelBadgeClass = LEVEL_BADGE[(Math.min(Math.max(user.level, 1), 3) as 1|2|3) || 1];
  const predictedOverall = latest?.predicted?.overall;

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
          <div className="text-xs text-zinc-500">Quyền</div>
          <div className="font-medium capitalize">{user.role}</div>
        </div>

        <div className="space-y-1">
          <div className="text-xs text-zinc-500">Gói truy cập</div>
          <div className="font-medium">
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-sm ${ACCESS_BADGE[user.access]}`}>
              {ACCESS_LABEL[user.access]}
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-xs text-zinc-500">Level hiện tại</div>
          <div className="font-medium">
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-sm ${levelBadgeClass}`}>
              Level {user.level}
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
            {user.levelUpdatedAt ? new Date(user.levelUpdatedAt).toLocaleString() : "-"}
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-xs text-zinc-500">Lần kiểm tra gần nhất</div>
          <div className="font-medium">
            {user.lastPlacementAttemptId ? (
              <Link
                className="underline"
                href={{ pathname: `/${locale}/placement/result/${user.lastPlacementAttemptId}` }}
              >
                Xem kết quả
              </Link>
            ) : "—"}
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-xs text-zinc-500">Điểm TOEIC ước lượng</div>
          <div className="font-medium">
            {predictedOverall ? (
              <>
                {predictedOverall} <span className="text-xs text-zinc-500">/ 990</span>
              </>
            ) : "—"}
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