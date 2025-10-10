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
  ShieldCheck,
} from "lucide-react";
import Dropdown from "../common/DropIconHeader";
import { useTranslations, useLocale } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

type Role = "user" | "admin";
type Access = "free" | "premium";
type Lvl = 1 | 2 | 3 | 4;

type PartStat = { total: number; correct: number; acc: number };

type AttemptItem = {
  id: string;
  part: string;           // "part.1" ... "part.7"
  isCorrect?: boolean;    // một số BE dùng isCorrect
  correct?: boolean;      // phòng trường hợp tên khác
};

type AttemptFull = {
  _id: string;
  acc: number;
  submittedAt?: string;
  partStats?: Record<string, PartStat>;
  predicted?: { overall: number; listening: number; reading: number };
  items?: AttemptItem[]; // để tổng hợp khi thiếu partStats
};

const PART_ORDER = ["part.1","part.2","part.3","part.4","part.5","part.6","part.7"];

const LV_BADGE: Record<Lvl, string> = {
  1: "border-emerald-300 bg-emerald-100 text-emerald-800",
  2: "border-sky-300 bg-sky-100 text-sky-800",
  3: "border-violet-300 bg-violet-100 text-violet-800",
  4: "border-amber-300 bg-amber-100 text-amber-900",
};

function RoleBadge({ role }: { role: Role }) {
  const isAdmin = role === "admin";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium capitalize border ${
        isAdmin
          ? "border-purple-300 bg-purple-100 text-purple-700"
          : "border-zinc-300 bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300"
      }`}
      title={isAdmin ? "Admin" : "User"}
    >
      <ShieldCheck className="h-3.5 w-3.5" />
      {isAdmin ? "Admin" : "User"}
    </span>
  );
}

function AccessBadge({ access }: { access: Access }) {
  const isPro = access === "premium";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium capitalize border ${
        isPro
          ? "border-yellow-300 bg-yellow-100 text-yellow-700"
          : "border-zinc-300 bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300"
      }`}
      title={isPro ? "Premium" : "Free"}
    >
      {isPro ? <Crown className="h-3.5 w-3.5" /> : <Star className="h-3.5 w-3.5" />}
      {isPro ? "Premium" : "Free"}
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

/** Gom thống kê per-part từ attempt.items khi BE không trả sẵn partStats */
function buildPartStatsFromItems(items?: AttemptItem[]): Record<string, PartStat> {
  const stats: Record<string, { total: number; correct: number }> = {};
  if (!items?.length) return {};
  for (const it of items) {
    const part = it.part || "unknown";
    if (!stats[part]) stats[part] = { total: 0, correct: 0 };
    stats[part].total += 1;
    const ok = it.isCorrect ?? it.correct ?? false;
    if (ok) stats[part].correct += 1;
  }
  const out: Record<string, PartStat> = {};
  for (const [k, v] of Object.entries(stats)) {
    out[k] = { total: v.total, correct: v.correct, acc: v.total ? v.correct / v.total : 0 };
  }
  return out;
}

export default function UserMenu() {
  const t = useTranslations("UserMenu");
  const { user, logout } = useAuth();
  const router = useRouter();
  const locale = useLocale();

  const [loadingPT, setLoadingPT] = React.useState(false);
  const [latest, setLatest] = React.useState<AttemptFull | null>(null);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      if (!user) { setLatest(null); return; }
      try {
        setLoadingPT(true);

        // 1) Lấy id attempt gần nhất
        const res = await fetch("/api/placement/attempts?limit=1", {
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) return;
        const j = await res.json();
        const id = j?.items?.[0]?._id as string | undefined;
        if (!id) return;

        // 2) Lấy full attempt
        const d = await fetch(`/api/placement/attempts/${id}`, {
          credentials: "include",
          cache: "no-store",
        });
        if (!d.ok) return;
        const full = (await d.json()) as AttemptFull;

        if (!mounted) return;

        // 3) Nếu thiếu partStats → tự build từ items
        let partStats = full.partStats;
        if (!partStats || Object.keys(partStats).length === 0) {
          partStats = buildPartStatsFromItems(full.items);
        }

        setLatest({
          _id: full._id,
          acc: full.acc,
          submittedAt: full.submittedAt,
          predicted: full.predicted,
          partStats,
          items: full.items,
        });
      } catch {
        // ignore
      } finally {
        if (mounted) setLoadingPT(false);
      }
    })();
    return () => { mounted = false; };
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
  const predictedOverall = toToeicStep5(latest?.predicted?.overall ?? rawOverall, 10, 990);

  const userLevel = ((user?.level as Lvl | undefined) ?? 1) as Lvl;
  const userRole = (user?.role as Role | undefined) ?? "user";
  const userAccess = (user?.access as Access | undefined) ?? "free";

  // Dùng stats đã chuẩn hoá; phần nào không có dữ liệu sẽ hiển thị "—"
  const stats = latest?.partStats ?? {};
  const partRows = PART_ORDER.map((key) => {
    const stat = stats[key];
    if (!stat || !stat.total) {
      return { key, label: partLabel(key), level: null as Lvl | null, href: undefined as string | undefined };
    }
    const lv = accToLevel(stat.acc);
    // ✅ Link luôn kèm locale + query level
    const href = `/${locale}/practice/${encodeURIComponent(key)}?level=${lv}`;
    return { key, label: partLabel(key), level: lv, href };
  });

  return (
    <Dropdown button={<div className="w-6 h-6"><UserIcon size="100%" /></div>}>
      {user ? (
        <>
          {/* Trang cá nhân */}
          <li>
            <Link
              href={`/${locale}/account`}
              className="flex items-center gap-2 px-4 py-3 text-sm text-zinc-800 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-700"
            >
              <IdCard className="h-4 w-4 text-blue-500" />
              <span>Trang cá nhân</span>
            </Link>
          </li>

          {/* Quyền */}
          <li>
            <div className="flex items-center justify-between px-4 py-3 text-sm text-zinc-800 dark:text-zinc-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-purple-600" />
                <span>Quyền</span>
              </div>
              <RoleBadge role={userRole} />
            </div>
          </li>

          {/* Gói */}
          <li>
            <div className="flex items-center justify-between px-4 py-3 text-sm text-zinc-800 dark:text-zinc-100">
              <div className="flex items-center gap-2">
                {userAccess === "premium" ? (
                  <Crown className="h-4 w-4 text-yellow-500" />
                ) : (
                  <Star className="h-4 w-4 text-gray-400" />
                )}
                <span>Gói</span>
              </div>
              <AccessBadge access={userAccess} />
            </div>
          </li>

          {/* TOEIC ước lượng */}
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

          {/* Level tổng */}
          <li>
            <div className="flex items-center justify-between px-4 py-3 text-sm text-zinc-800 dark:text-zinc-100">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-zinc-700" />
                <span>Level tổng</span>
              </div>
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${LV_BADGE[userLevel]}`}>
                Level {userLevel}
              </span>
            </div>
          </li>

          {/* Gợi ý theo Part (tự tính nếu thiếu partStats) */}
          <li className="px-4 py-2 text-xs uppercase tracking-wide text-zinc-500">
            Gợi ý theo Part
          </li>
          {partRows.map((row) => (
            <li key={row.key}>
              <Link
                href={row.href || "#"}
                className={`flex items-center justify-between px-4 py-3 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-700 ${
                  row.href ? "text-zinc-800 dark:text-zinc-100" : "text-zinc-400 cursor-not-allowed"
                }`}
                aria-disabled={!row.href}
                onClick={(e) => { if (!row.href) e.preventDefault(); }}
              >
                <span>{row.label}</span>
                {row.level ? (
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${LV_BADGE[row.level]}`}>
                    Level {row.level}
                  </span>
                ) : (
                  <span className="text-xs text-zinc-400">—</span>
                )}
              </Link>
            </li>
          ))}

          {/* Đăng xuất */}
          <li>
            <button
              onClick={handleLogout}
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
              href={`/${locale}/auth/login`}
              className="flex items-center gap-2 px-4 py-3 text-sm text-zinc-800 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-700"
            >
              <LogIn className="h-4 w-4 text-green-600" />
              <span>{t("login")}</span>
            </Link>
          </li>
          <li>
            <Link
              href={`/${locale}/auth/register`}
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