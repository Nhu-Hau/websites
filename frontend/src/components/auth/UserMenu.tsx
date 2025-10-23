/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useRef, useState } from "react";
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
import { Tooltip } from "react-tooltip";
import { useLocaleSwitch } from "@/hooks/useLocaleSwitch";
import useClickOutside from "@/hooks/useClickOutside";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

type Role = "user" | "admin";
type Access = "free" | "premium";
type Lvl = 1 | 2 | 3;

type PartStat = { total: number; correct: number; acc: number };

type AttemptItem = {
  id: string;
  part: string;
  isCorrect?: boolean;
  correct?: boolean;
};

type AttemptFull = {
  _id: string;
  acc: number;
  submittedAt?: string;
  partStats?: Record<string, PartStat>;
  predicted?: { overall: number; listening: number; reading: number };
  listening?: { acc: number };
  reading?: { acc: number };
  items?: AttemptItem[];
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
  1: "border-emerald-300 bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 dark:border-emerald-700",
  2: "border-sky-300 bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200 dark:border-sky-700",
  3: "border-violet-300 bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200 dark:border-violet-700",
};

function RoleBadge({ role }: { role: Role }) {
  const isAdmin = role === "admin";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize border ${
        isAdmin
          ? "border-purple-300 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-700"
          : "border-zinc-300 bg-zinc-50 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700"
      }`}
      data-tooltip-id="role-tooltip"
      data-tooltip-content={
        isAdmin ? "Quyền quản trị" : "Người dùng thông thường"
      }
    >
      <ShieldCheck className="h-3.5 w-3.5" />
      {isAdmin ? "Quản trị" : "Người dùng"}
      <Tooltip
        id="role-tooltip"
        place="bottom"
        positionStrategy="fixed"
        offset={8}
        delayHide={0}
        className="bg-zinc-800 text-white text-xs rounded-lg px-2 py-1"
      />
    </span>
  );
}

function AccessBadge({ access }: { access: Access }) {
  const isPro = access === "premium";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize border ${
        isPro
          ? "border-yellow-300 bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700"
          : "border-zinc-300 bg-zinc-50 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700"
      }`}
      data-tooltip-id="access-tooltip"
      data-tooltip-content={isPro ? "Tài khoản cao cấp" : "Tài khoản miễn phí"}
    >
      {isPro ? (
        <Crown className="h-3.5 w-3.5" />
      ) : (
        <Star className="h-3.5 w-3.5" />
      )}
      {isPro ? "Cao cấp" : "Miễn phí"}
      <Tooltip
        id="access-tooltip"
        place="bottom"
        positionStrategy="fixed"
        offset={8}
        delayHide={0}
        className="bg-zinc-800 text-white text-xs rounded-lg px-2 py-1"
      />
    </span>
  );
}

function accToLevel(acc: number): Lvl {
  if (acc >= 0.7) return 3;
  if (acc >= 0.55) return 2;
  return 1;
}

function partLabel(key: string) {
  const n = key.match(/\d+/)?.[0];
  return n ? `Phần ${n}` : key;
}

function buildPartStatsFromItems(
  items?: AttemptItem[]
): Record<string, PartStat> {
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
    out[k] = {
      total: v.total,
      correct: v.correct,
      acc: v.total ? v.correct / v.total : 0,
    };
  }
  return out;
}

const round5_495 = (n: number) =>
  Math.min(495, Math.max(5, Math.round(n / 5) * 5));

export default function UserMenu() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { locale } = useLocaleSwitch();
  const [loadingPT, setLoadingPT] = useState(false);
  const [latest, setLatest] = useState<AttemptFull | null>(null);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  useClickOutside(wrapperRef, () => setOpen(false));

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      if (!user) {
        setLatest(null);
        return;
      }
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
        const full = (await d.json()) as AttemptFull;
        if (!mounted) return;

        let partStats = full.partStats;
        if (!partStats || Object.keys(partStats).length === 0) {
          partStats = buildPartStatsFromItems(full.items);
        }

        setLatest({
          _id: full._id,
          acc: full.acc,
          submittedAt: full.submittedAt,
          predicted: full.predicted,
          listening: (full as any).listening,
          reading: (full as any).reading,
          partStats,
          items: full.items,
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
    setOpen(false); // đóng dropdown ngay khi bấm
    try {
      await logout();
      toast.success("Đăng xuất thành công");
      router.push("/auth/login");
    } catch {
      toast.error("Lỗi khi đăng xuất");
    }
  };

  const round5_990 = (n: number) =>
    Math.min(990, Math.max(10, Math.round(n / 5) * 5));

  const predictedOverall: number | undefined = React.useMemo(() => {
    const be = latest?.predicted?.overall;
    if (Number.isFinite(be)) return round5_990(be as number);
    const Lacc = latest?.listening?.acc;
    const Racc = latest?.reading?.acc;
    if (typeof Lacc === "number" && typeof Racc === "number") {
      const L = round5_495(Lacc * 495);
      const R = round5_495(Racc * 495);
      return L + R;
    }
    return undefined;
  }, [latest]);

  const userLevel = ((user?.level as Lvl | undefined) ?? 1) as Lvl;
  const userRole = (user?.role as Role | undefined) ?? "user";
  const userAccess = (user?.access as Access | undefined) ?? "free";

  const stats = latest?.partStats ?? {};
  const partRows = PART_ORDER.map((key) => {
    const stat = stats[key];
    if (!stat || !stat.total) {
      return {
        key,
        label: partLabel(key),
        level: null as Lvl | null,
        href: undefined as string | undefined,
      };
    }
    const lv = accToLevel(stat.acc);
    const href = `/${locale}/practice/${encodeURIComponent(key)}?level=${lv}`;
    return { key, label: partLabel(key), level: lv, href };
  });

  return (
    <div
      ref={wrapperRef} // <- thêm dòng này
      className="relative"
      data-tooltip-id={open ? undefined : "user-tooltip"}
      data-tooltip-content={user ? "Quản lý tài khoản" : "Đăng nhập/Đăng ký"}
    >
      <button
        type="button"
        aria-label={user ? "Quản lý tài khoản" : "Đăng nhập/Đăng ký"}
        onClick={() => setOpen((prev) => !prev)}
        className={`rounded-full focus:outline-none transition duration-300 hover:scale-105 flex items-center ${
          (user as any)?.picture
            ? "text-gray-800 dark:text-gray-100"
            : "p-2 hover:bg-sky-100 dark:hover:bg-sky-900 text-gray-800 dark:text-gray-100"
        }`}
      >
        {(user as any)?.picture ? (
          <img
            src={(user as any).picture}
            alt={(user as any)?.name || "avatar"}
            className="w-8 h-8 rounded-full object-cover border border-zinc-200 dark:border-zinc-700"
          />
        ) : (
          <div className="w-6 h-6 flex items-center justify-center">
            <UserIcon className="w-6 h-6" />
          </div>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-80 bg-white dark:bg-zinc-900 shadow-xl rounded-lg p-3 border border-zinc-200 dark:border-zinc-700 z-50 animate-fadeIn"
          // p-3 (thay vì p-4) để dropdown thấp hơn
        >
          {user ? (
            <>
              <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 mb-2">
                Tài khoản
              </div>

              <div className="px-3 py-2 bg-zinc-50 dark:bg-zinc-800 rounded-md hover:bg-sky-100 dark:hover:bg-sky-900 transition-colors duration-200">
                <Link
                  href={`/${locale}/account`}
                  className="flex items-center gap-2.5 text-sm text-zinc-800 dark:text-zinc-100"
                  onClick={() => setOpen(false)}
                >
                  <IdCard className="h-4 w-4 text-blue-500" />
                  <span>Trang cá nhân</span>
                </Link>
              </div>

              <div className="px-3 py-2 bg-zinc-50 dark:bg-zinc-800 rounded-md hover:bg-sky-100 dark:hover:bg-sky-900 transition-colors duration-200">
                <div className="flex items-center justify-between text-sm text-zinc-800 dark:text-zinc-100">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="h-4 w-4 text-purple-600" />
                    <span>Quyền</span>
                  </div>
                  <RoleBadge role={userRole} />
                </div>
              </div>

              <div className="px-3 py-2 bg-zinc-50 dark:bg-zinc-800 rounded-md hover:bg-sky-100 dark:hover:bg-sky-900 transition-colors duration-200">
                <div className="flex items-center justify-between text-sm text-zinc-800 dark:text-zinc-100">
                  <div className="flex items-center gap-2.5">
                    {userAccess === "premium" ? (
                      <Crown className="h-4 w-4 text-yellow-500" />
                    ) : (
                      <Star className="h-4 w-4 text-gray-400" />
                    )}
                    <span>Gói</span>
                  </div>
                  <AccessBadge access={userAccess} />
                </div>
              </div>

              <div className="px-3 py-2 bg-zinc-50 dark:bg-zinc-800 rounded-md hover:bg-sky-100 dark:hover:bg-sky-900 transition-colors duration-200">
                <div className="flex items-center justify-between text-sm text-zinc-800 dark:text-zinc-100">
                  <div className="flex items-center gap-2.5">
                    <Gauge className="h-4 w-4 text-zinc-700" />
                    <span>TOEIC ước lượng</span>
                  </div>
                  <span className="font-semibold">
                    {loadingPT ? "—" : predictedOverall ?? "—"}
                    <span className="text-xs text-zinc-500"> / 990</span>
                  </span>
                </div>
              </div>

              <div className="px-3 py-2 text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Gợi ý theo Phần
              </div>

              {partRows.map((row) => (
                <div
                  key={row.key}
                  className="px-3 py-2 bg-zinc-50 dark:bg-zinc-800 rounded-md hover:bg-sky-100 dark:hover:bg-sky-900 transition-colors duration-200"
                >
                  <Link
                    href={row.href || "#"}
                    className={`flex items-center justify-between text-sm ${
                      row.href
                        ? "text-zinc-800 dark:text-zinc-100"
                        : "text-zinc-400 cursor-not-allowed"
                    }`}
                    aria-disabled={!row.href}
                    onClick={(e) => {
                      if (!row.href) {
                        e.preventDefault();
                      } else {
                        setOpen(false); // auto-close khi có điều hướng hợp lệ
                      }
                    }}
                  >
                    <span>{row.label}</span>
                    {row.level ? (
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${
                          LV_BADGE[row.level]
                        }`}
                      >
                        Level {row.level}
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-400">—</span>
                    )}
                  </Link>
                </div>
              ))}

              <div className="px-3 py-2 bg-zinc-50 dark:bg-zinc-800 rounded-md hover:bg-sky-100 dark:hover:bg-sky-900 transition-colors duration-200">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2.5 text-sm text-red-600 w-full text-left"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 mb-2">
                Tài khoản
              </div>

              <div className="px-3 py-2 bg-zinc-50 dark:bg-zinc-800 rounded-md hover:bg-sky-100 dark:hover:bg-sky-900 transition-colors duration-200">
                <Link
                  href={`/${locale}/auth/login`}
                  className="flex items-center gap-2.5 text-sm text-zinc-800 dark:text-zinc-100"
                  onClick={() => setOpen(false)}
                >
                  <LogIn className="h-4 w-4 text-green-600" />
                  <span>Đăng nhập</span>
                </Link>
              </div>

              <div className="px-3 py-2 bg-zinc-50 dark:bg-zinc-800 rounded-md hover:bg-sky-100 dark:hover:bg-sky-900 transition-colors duration-200">
                <Link
                  href={`/${locale}/auth/register`}
                  className="flex items-center gap-2.5 text-sm text-zinc-800 dark:text-zinc-100"
                  onClick={() => setOpen(false)}
                >
                  <UserPlus className="h-4 w-4 text-indigo-600" />
                  <span>Đăng ký</span>
                </Link>
              </div>
            </>
          )}
        </div>
      )}

      {!open && (
        <Tooltip
          id="user-tooltip"
          place="bottom"
          positionStrategy="fixed"
          offset={8}
          className="bg-zinc-800 text-white text-xs rounded-lg px-2 py-1"
        />
      )}
    </div>
  );
}
