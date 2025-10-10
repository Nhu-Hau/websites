// frontend/src/components/layout/UserMenu.tsx
"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User as UserIcon,
  LogIn,
  UserPlus,
  LogOut,
  Star,
  Crown,
  IdCard,
  Gauge,
  Target,
} from "lucide-react";
import Dropdown from "../common/DropIconHeader";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

type Role = "free" | "premium";
type Lvl = 1 | 2 | 3 | 4;

type PartStat = { total: number; correct: number; acc: number };
type AttemptLite = {
  _id: string;
  acc: number;
  submittedAt?: string;
  partStats?: Record<string, PartStat>;
  predicted?: { overall: number; listening: number; reading: number };
};

const PART_ORDER = [
  "part.1",
  "part.2",
  "part.3",
  "part.4",
  "part.5",
  "part.6",
  "part.7",
];

const LV_BADGE: Record<Lvl, string> = {
  1: "border-emerald-300 bg-emerald-100 text-emerald-800",
  2: "border-sky-300 bg-sky-100 text-sky-800",
  3: "border-violet-300 bg-violet-100 text-violet-800",
  4: "border-amber-300 bg-amber-100 text-amber-900",
};

function RoleBadge({ role }: { role: Role }) {
  const isPro = role === "premium";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium capitalize border
      ${
        isPro
          ? "border-yellow-300 bg-yellow-100 text-yellow-700"
          : "border-zinc-300 bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300"
      }`}
    >
      {isPro ? (
        <Crown className="h-3.5 w-3.5" />
      ) : (
        <Star className="h-3.5 w-3.5" />
      )}
      {isPro ? "Pro" : "Free"}
    </span>
  );
}

function accToLevel(acc: number): Lvl {
  if (acc >= 0.85) return 4;
  if (acc >= 0.7) return 3;
  if (acc >= 0.55) return 2;
  return 1;
}
function partLabel(key: string) {
  const n = key.match(/\d+/)?.[0];
  return n ? `Part ${n}` : key;
}

export default function UserMenu() {
  const t = useTranslations("UserMenu");
  const { user, logout } = useAuth();
  const router = useRouter();

  const [loadingPT, setLoadingPT] = React.useState(false);
  const [latest, setLatest] = React.useState<AttemptLite | null>(null);

  // Lấy placement attempt gần nhất
  React.useEffect(() => {
    let mounted = true;
    if (!user) {
      setLatest(null);
      return;
    }
    (async () => {
      try {
        setLoadingPT(true);
        const res = await fetch("/api/placement/attempts?limit=1", {
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) return;
        const j = await res.json();
        const id = j?.items?.[0]?._id as string | undefined;
        if (!id) return;
        const d = await fetch(`/api/placement/attempts/${id}`, {
          credentials: "include",
          cache: "no-store",
        });
        if (!d.ok) return;
        const full = await d.json();
        if (!mounted) return;
        setLatest({
          _id: full._id,
          acc: full.acc,
          submittedAt: full.submittedAt,
          partStats: full.partStats,
          predicted: full.predicted,
        });
      } finally {
        if (mounted) setLoadingPT(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Đăng xuất thành công");
      router.push("/auth/login");
    } catch {
      toast.error("Lỗi khi đăng xuất");
    }
  };

  const toToeicStep5 = (raw: number, min: number, max: number) => {
    const rounded = Math.round(raw / 5) * 5;
    return Math.min(max, Math.max(min, rounded));
  };

  const rawOverall = (latest?.acc ?? 0) * 990;
  const predictedOverall = toToeicStep5(
    latest?.predicted?.overall ?? rawOverall,
    10,
    990
  );
  const userLevel = ((user?.level as Lvl | undefined) ?? 1) as Lvl;

  // map part → level
  const partRows = PART_ORDER.map((key) => {
    const stat = latest?.partStats?.[key];
    if (!stat)
      return {
        key,
        label: partLabel(key),
        level: null as Lvl | null,
        href: undefined as string | undefined,
      };
    const lv = accToLevel(stat.acc);
    return {
      key,
      label: partLabel(key),
      level: lv,
      href: `/practice/parts/${encodeURIComponent(key)}?level=${lv}`,
    };
  });

  return (
    <Dropdown
      button={
        <div className="w-6 h-6">
          <UserIcon size="100%" />
        </div>
      }
    >
      {user ? (
        <>
          {/* Trang cá nhân */}
          <li>
            <Link
              href="/account"
              className="flex items-center gap-2 px-4 py-3 text-sm text-zinc-800 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-700"
            >
              <IdCard className="h-4 w-4 text-blue-500" />
              <span>Trang cá nhân</span>
            </Link>
          </li>

          {/* Gói */}
          <li>
            <div className="flex items-center justify-between px-4 py-3 text-sm text-zinc-800 dark:text-zinc-100">
              <div className="flex items-center gap-2">
                {user.role === "premium" ? (
                  <Crown className="h-4 w-4 text-yellow-500" />
                ) : (
                  <Star className="h-4 w-4 text-gray-400" />
                )}
                <span>Gói</span>
              </div>
              <RoleBadge role={user.role as Role} />
            </div>
          </li>

          {/* TOEIC ước lượng (li kiểu hàng) */}
          <li>
            <div className="flex items-center justify-between px-4 py-3 text-sm text-zinc-800 dark:text-zinc-100">
              <div className="flex items-center gap-2">
                <Gauge className="h-4 w-4 text-zinc-700" />
                <span>TOEIC ước lượng</span>
              </div>
              <span className="font-semibold">
                {loadingPT ? "—" : predictedOverall}
                <span className="text-xs text-zinc-500"> / 990</span>
              </span>
            </div>
          </li>

          {/* Level tổng (li kiểu hàng) */}
          <li>
            <div className="flex items-center justify-between px-4 py-3 text-sm text-zinc-800 dark:text-zinc-100">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-zinc-700" />
                <span>Level tổng</span>
              </div>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${LV_BADGE[userLevel]}`}
              >
                Level {userLevel}
              </span>
            </div>
          </li>
          {/* Đăng xuất */}
          <li>
            <button
              onClick={async () => {
                try {
                  await logout();
                  toast.success("Đăng xuất thành công");
                  router.push("/auth/login");
                } catch {
                  toast.error("Lỗi khi đăng xuất");
                }
              }}
              className="flex items-center gap-2 px-4 py-3 text-sm text-red-600 hover:bg-zinc-50 dark:hover:bg-zinc-700 w-full text-left"
            >
              <LogOut className="h-4 w-4" />
              <span>Đăng xuất</span>
            </button>
          </li>
        </>
      ) : (
        <>
          <li>
            <Link
              href="/auth/login"
              className="flex items-center gap-2 px-4 py-3 text-sm text-zinc-800 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-700"
            >
              <LogIn className="h-4 w-4 text-green-600" />
              <span>{t("login")}</span>
            </Link>
          </li>
          <li>
            <Link
              href="/auth/register"
              className="flex items-center gap-2 px-4 py-3 text-sm text-zinc-800 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-700"
            >
              <UserPlus className="h-4 w-4 text-indigo-600" />
              <span>{t("register")}</span>
            </Link>
          </li>
        </>
      )}
    </Dropdown>
  );
}
