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
  ShieldCheck,
  Zap,
  ArrowRight,
} from "lucide-react";
import { Tooltip } from "react-tooltip";
import { useLocaleSwitch } from "@/hooks/routing/useLocaleSwitch";
import useClickOutside from "@/hooks/common/useClickOutside";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";

type Role = "user" | "admin" | "teacher";
type Access = "free" | "premium";
type Lvl = 1 | 2 | 3;
type PartKey =
  | "part.1"
  | "part.2"
  | "part.3"
  | "part.4"
  | "part.5"
  | "part.6"
  | "part.7";

type SafeUser = {
  id?: string;
  _id?: string;
  name?: string;
  email?: string;
  role?: Role;
  access?: Access;
  picture?: string;
  partLevels?: any;
  toeicPred?: {
    overall?: number | null;
    listening?: number | null;
    reading?: number | null;
  } | null;
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/* ================= Consts ================= */

const PARTS: PartKey[] = [
  "part.1",
  "part.2",
  "part.3",
  "part.4",
  "part.5",
  "part.6",
  "part.7",
];

// 🎨 Level badge: 1 = xanh lá, 2 = xanh dương, 3 = tím
const LV_BADGE: Record<
  Lvl,
  { bg: string; border: string; text: string; icon: string }
> = {
  1: {
    bg: "bg-green-100 dark:bg-green-900/30",
    border: "border-green-300 dark:border-green-700",
    text: "text-green-800 dark:text-green-300",
    icon: "text-green-600 dark:text-green-400",
  },
  2: {
    bg: "bg-sky-100 dark:bg-sky-900/30",
    border: "border-sky-300 dark:border-sky-700",
    text: "text-sky-800 dark:text-sky-300",
    icon: "text-sky-600 dark:text-sky-400",
  },
  3: {
    bg: "bg-violet-100 dark:bg-violet-900/30",
    border: "border-violet-300 dark:border-violet-700",
    text: "text-violet-800 dark:text-violet-300",
    icon: "text-violet-600 dark:text-violet-400",
  },
};


/* ================= Utils ================= */

function normalizePartLevels(raw: any): Partial<Record<PartKey, Lvl>> | null {
  if (!raw || typeof raw !== "object") return null;
  const out: Partial<Record<PartKey, Lvl>> = {};
  for (const p of PARTS) {
    const num = p.split(".")[1];
    let v: any = raw[p];
    if (v == null && raw.part && typeof raw.part === "object")
      v = raw.part[num];
    if (v == null && raw[num] != null) v = raw[num];
    const n = Number(v);
    if (n === 1 || n === 2 || n === 3) out[p] = n as Lvl;
  }
  return Object.keys(out).length ? out : null;
}

function pickUserFromMe(json: any): SafeUser | null {
  if (!json) return null;
  if (json.user && typeof json.user === "object") return json.user;
  if (json.data && typeof json.data === "object") return json.data;
  if (
    json._id ||
    json.id ||
    json.email ||
    json.partLevels ||
    json.toeicPred ||
    json.access
  )
    return json;
  return null;
}

/* ================= Main ================= */

export default function UserMenu() {
  const { user: ctxUser, logout } = useAuth();
  const router = useRouter();
  const { locale } = useLocaleSwitch();
  const base = useBasePrefix(locale || "vi");

  const [open, setOpen] = useState(false);
  const [me, setMe] = useState<SafeUser | null>(null);

  const wrapperRef = useRef<HTMLDivElement>(null);
  useClickOutside(wrapperRef, () => setOpen(false));

  const fetchMe = React.useCallback(async () => {
    try {
      const r = await fetch("/api/auth/me", {
        credentials: "include",
        cache: "no-store",
      });
      if (!r.ok) return;
      const j = await r.json();
      const u = pickUserFromMe(j);
      if (u) setMe(u);
    } catch {
      /* ignore */
    }
  }, []);

  React.useEffect(() => {
    (async () => {
      if (!ctxUser) {
        setMe(null);
        return;
      }
      await fetchMe();
    })();

    const onVis = () => document.visibilityState === "visible" && fetchMe();
    document.addEventListener("visibilitychange", onVis);

    const onLevelsChanged = () => fetchMe();
    window.addEventListener("levels:changed", onLevelsChanged as any);

    const onPracticeUpdated = () => fetchMe();
    window.addEventListener("practice:updated", onPracticeUpdated as any);

    const t = setInterval(fetchMe, 15000);

    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("levels:changed", onLevelsChanged as any);
      window.removeEventListener("practice:updated", onPracticeUpdated as any);
      clearInterval(t);
    };
  }, [ctxUser, fetchMe]);

  const handleLogout = async () => {
    setOpen(false);
    try {
      await logout();
      toast.success("Đăng xuất thành công");
      router.push(`${base}/login`);
    } catch {
      toast.error("Lỗi khi đăng xuất");
    }
  };

  const levels = React.useMemo(
    () => normalizePartLevels(me?.partLevels) ?? null,
    [me]
  );

  const userRole = (me?.role as Role | undefined) ?? "user";
  const userAccess = (me?.access as Access | undefined) ?? "free";

  const partRows = PARTS.map((key) => {
    const lv = levels?.[key] as Lvl | undefined;
    const label = `Part ${key.split(".")[1]}`;
    const href = lv
      ? `${base}/practice/${encodeURIComponent(key)}?level=${lv}`
      : `${base}/practice/${encodeURIComponent(key)}`;
    return { key, label, lv, href };
  });

  const avatarSrc = (me as any)?.picture || (ctxUser as any)?.picture;

  return (
    <div
      ref={wrapperRef}
      className="relative flex-shrink-0"
      data-tooltip-id={open ? undefined : "user-tooltip"}
      data-tooltip-content={ctxUser ? "Quản lý tài khoản" : "Đăng nhập/Đăng ký"}
    >
      {/* Trigger button */}
      <button
        type="button"
        aria-label={ctxUser ? "Quản lý tài khoản" : "Đăng nhập/Đăng ký"}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "group inline-flex items-center justify-center rounded-full",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/70",
          "focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950",
          avatarSrc
            ? "p-0.5 hover:scale-105 transition-transform duration-150"
            : "h-9 w-9 p-0 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/70 hover:scale-105 transition-all duration-150 text-zinc-700 dark:text-zinc-200"
        )}
      >
        {avatarSrc ? (
          <img
            src={avatarSrc}
            alt={me?.name || "avatar"}
            className="h-8 w-8 rounded-full border-2 border-zinc-200 object-cover transition-colors duration-200 group-hover:border-sky-500 dark:border-zinc-700 dark:group-hover:border-sky-400"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-sky-100 to-sky-50 dark:from-sky-900/30 dark:to-sky-800/20 group-hover:from-sky-200 dark:group-hover:from-sky-800/50">
            <UserIcon className="h-5 w-5 text-sky-600 dark:text-sky-400" />
          </div>
        )}
      </button>

      {/* Menu panel */}
      {open && (
        <div
          className={cn(
            "absolute right-1 xs:right-0 mt-2 z-50",
            "w-[min(20rem,calc(100vw-1.25rem))] xs:w-[min(20rem,calc(100vw-2rem))] sm:w-80",
            "max-w-[calc(100vw-1rem)]",
            "rounded-2xl border border-zinc-200/80 bg-white/95 p-3 xs:p-4",
            "shadow-2xl ring-1 ring-black/5 backdrop-blur-xl",
            "dark:border-zinc-700/80 dark:bg-zinc-900/95 dark:ring-white/10",
            "animate-in fade-in zoom-in-95 duration-200 origin-top-right"
          )}
        >
          {ctxUser ? (
            <>
              {/* Header user info */}
              <div className="mb-4 flex items-center gap-3 border-b border-zinc-200 pb-3 dark:border-zinc-700">
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt={me?.name || "avatar"}
                    className="h-10 w-10 rounded-full border-2 border-amber-500 object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-100 to-sky-50 dark:from-sky-900/30 dark:to-sky-800/20">
                    <UserIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-zinc-900 dark:text-white">
                    {me?.name || "Người dùng"}
                  </p>
                  <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                    {me?.email || "—"}
                  </p>
                </div>
              </div>

              {/* Trang cá nhân */}
              <Link
                href={`${base}/account`}
                onClick={() => setOpen(false)}
                className="group flex items-center gap-3 rounded-xl px-3 py-1.5 transition-colors duration-200 hover:bg-sky-50 dark:hover:bg-sky-900/30"
              >
                <IdCard className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                  Trang cá nhân
                </span>
                <div className="ml-auto opacity-0 transition-opacity group-hover:opacity-100">
                  <ArrowRight className="h-3.5 w-3.5 text-zinc-400" />
                </div>
              </Link>

              {/* Quyền (Role) */}
              <div className="mt-1.5 flex items-center justify-between rounded-xl px-3 py-1.5 transition-colors duration-200 hover:bg-zinc-50/80 dark:hover:bg-zinc-900/40">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                  <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                    Quyền
                  </span>
                </div>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border",
                    userRole === "admin"
                      ? "border-purple-300 bg-purple-100 text-purple-700 dark:border-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                      : userRole === "teacher"
                      ? "border-emerald-300 bg-emerald-100 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                      : "border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-300"
                  )}
                >
                  {userRole === "admin"
                    ? "Quản trị"
                    : userRole === "teacher"
                    ? "Giáo viên"
                    : "Người dùng"}
                </span>
              </div>

              {/* Gói (Access) */}
              <div className="mt-1.5 flex items-center justify-between rounded-xl px-3 py-1.5 transition-colors duration-200 hover:bg-zinc-50/80 dark:hover:bg-zinc-900/40">
                <div className="flex items-center gap-3">
                  {userAccess === "premium" ? (
                    <Crown className="h-4 w-4 text-amber-500" />
                  ) : (
                    <Star className="h-4 w-4 text-zinc-400" />
                  )}
                  <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                    Gói
                  </span>
                </div>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border",
                    userAccess === "premium"
                      ? "border-amber-300 bg-amber-100 text-amber-700 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                      : "border-zinc-300 bg-zinc-100 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-300"
                  )}
                >
                  {userAccess === "premium" ? "Cao cấp" : "Miễn phí"}
                </span>
              </div>

              {/* Gợi ý theo phần */}
              <div className="mt-3 mb-1 px-3">
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Gợi ý theo phần
                </p>
              </div>

              {partRows.map((row) => {
                const config = row.lv ? LV_BADGE[row.lv] : null;
                return (
                  <Link
                    key={row.key}
                    href={row.href}
                    onClick={() => setOpen(false)}
                    className="group flex items-center justify-between rounded-xl px-3 py-1.5 text-sm transition-colors duration-200 hover:bg-sky-50 dark:hover:bg-sky-900/30"
                  >
                    <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                      {row.label}
                    </span>
                    {config ? (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold border",
                          config.bg,
                          config.border,
                          config.text
                        )}
                      >
                        <Zap className={cn("h-3 w-3", config.icon)} />
                        Level {row.lv}
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-400">—</span>
                    )}
                  </Link>
                );
              })}

              {/* Logout */}
              <div className="mt-3 border-t border-zinc-200 pt-3 dark:border-zinc-700">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-1.5 text-sm font-medium text-red-600 transition-colors duration-200 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </>
          ) : (
            /* === Chưa đăng nhập === */
            <div className="px-1">
              <div className="mb-3 text-start text-sm font-bold text-zinc-800 dark:text-zinc-100">
                Tài khoản
              </div>

              <div className="space-y-2">
                {/* Đăng nhập */}
                <Link
                  href={`${base}/login`}
                  onClick={() => setOpen(false)}
                  className="group flex items-center gap-3 rounded-xl p-1.5 bg-zinc-50 text-zinc-900 transition-colors duration-200 hover:bg-emerald-50 dark:bg-zinc-800 dark:text-white dark:hover:bg-emerald-900/25"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-100 shadow-sm dark:bg-emerald-900/30">
                    <LogIn className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">Đăng nhập</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Đã có tài khoản
                    </p>
                  </div>
                  <div className="opacity-0 transition-opacity group-hover:opacity-100">
                    <ArrowRight className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </Link>

                {/* Đăng ký */}
                <Link
                  href={`${base}/register`}
                  onClick={() => setOpen(false)}
                  className="group flex items-center gap-3 rounded-xl p-1.5 bg-zinc-50 text-zinc-900 transition-colors duration-200 hover:bg-sky-50 dark:bg-zinc-800 dark:text-white dark:hover:bg-sky-900/25"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sky-100 shadow-sm dark:bg-sky-900/30">
                    <UserPlus className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">Đăng ký</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Tạo tài khoản mới
                    </p>
                  </div>
                  <div className="opacity-0 transition-opacity group-hover:opacity-100">
                    <ArrowRight className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                  </div>
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {!open && (
        <Tooltip
          id="user-tooltip"
          place="bottom"
          positionStrategy="fixed"
          offset={10}
          className="z-50 !rounded-lg !bg-zinc-900 !px-2.5 !py-1.5 !text-xs !text-white shadow-lg"
        />
      )}
    </div>
  );
}