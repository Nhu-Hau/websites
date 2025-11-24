/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
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
import { toast } from "@/lib/toast";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";
import { useMobileAvatarSheet } from "@/context/MobileAvatarSheetContext";

/* ================= Types ================= */
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

const LV_BADGE: Record<
  Lvl,
  { bg: string; border: string; text: string; icon: string }
> = {
  1: {
    bg: "bg-[#4C9C43]/10 dark:bg-[#4C9C43]/20",
    border: "border-[#4C9C43]/30 dark:border-[#4C9C43]/50",
    text: "text-[#4C9C43] dark:text-[#4C9C43]/90",
    icon: "text-[#4C9C43] dark:text-[#4C9C43]/90",
  },
  2: {
    bg: "bg-[#2E5EB8]/10 dark:bg-[#2E5EB8]/20",
    border: "border-[#2E5EB8]/30 dark:border-[#2E5EB8]/50",
    text: "text-[#2E5EB8] dark:text-[#2E5EB8]/90",
    icon: "text-[#2E5EB8] dark:text-[#2E5EB8]/90",
  },
  3: {
    bg: "bg-[#C44E1D]/10 dark:bg-[#C44E1D]/20",
    border: "border-[#C44E1D]/30 dark:border-[#C44E1D]/50",
    text: "text-[#C44E1D] dark:text-[#C44E1D]/90",
    icon: "text-[#C44E1D] dark:text-[#C44E1D]/90",
  },
};

const round5_990 = (n: number) =>
  Math.min(990, Math.max(10, Math.round(n / 5) * 5));

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
  const base = useBasePrefix(locale || "vi"); // 👈 DÙNG base prefix thống nhất
  const { setOpen, setUser, setMe } = useMobileAvatarSheet();

  const [open, setOpenLocal] = useState(false);
  const [me, setMeLocal] = useState<SafeUser | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  useClickOutside(wrapperRef, () => {
    setOpenLocal(false);
  });

  // Detect mobile - use md breakpoint (768px)
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Check immediately
    checkMobile();

    // Listen for resize
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const fetchMe = React.useCallback(async () => {
    try {
      const r = await fetch("/api/auth/me", {
        credentials: "include",
        cache: "no-store",
      });
      if (!r.ok) return;
      const j = await r.json();
      const u = pickUserFromMe(j);
      if (u) {
        setMeLocal(u);
        setMe(u); // Update context
      }
    } catch {
      /* ignore */
    }
  }, [setMe]);

  React.useEffect(() => {
    (async () => {
      if (!ctxUser) {
        setMeLocal(null);
        setMe(null); // Update context
        setUser(null); // Update context
        return;
      }
      setUser(ctxUser); // Update context
      await fetchMe();
    })();

    const onVis = () => document.visibilityState === "visible" && fetchMe();
    document.addEventListener("visibilitychange", onVis);

    // 👇 NGHE event đồng bộ với PracticeRunner (announceLevelsChanged)
    const onLevelsChanged = () => fetchMe();
    window.addEventListener("levels:changed", onLevelsChanged as any);

    // (tuỳ bạn còn bắn event này ở nơi khác)
    const onPracticeUpdated = () => fetchMe();
    window.addEventListener("practice:updated", onPracticeUpdated as any);

    const t = setInterval(fetchMe, 15000);

    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("levels:changed", onLevelsChanged as any);
      window.removeEventListener("practice:updated", onPracticeUpdated as any);
      clearInterval(t);
    };
  }, [ctxUser, fetchMe, setMe, setUser]);

  const handleLogout = async () => {
    setOpenLocal(false);
    setOpen(false); // Update context
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
  // const predictedOverall: number | undefined = React.useMemo(() => {
  //   const val = me?.toeicPred?.overall;
  //   return typeof val === "number" && Number.isFinite(val)
  //     ? round5_990(val)
  //     : undefined;
  // }, [me]);

  const userRole = (me?.role as Role | undefined) ?? "user";
  const userAccess = (me?.access as Access | undefined) ?? "free";

  // 👇 BUILD LINK THEO LEVEL HIỆN TẠI (param ?level=), dùng base prefix
  const partRows = PARTS.map((key) => {
    const lv = levels?.[key] as Lvl | undefined;
    const label = `Part ${key.split(".")[1]}`;
    const href = lv
      ? `${base}/practice/${encodeURIComponent(key)}?level=${lv}`
      : `${base}/practice/${encodeURIComponent(key)}`;
    return { key, label, lv, href };
  });

  const avatarSrc = (me as any)?.picture || (ctxUser as any)?.picture;

  // On mobile, use MobileAvatarSheet (visible only on mobile)
  if (isMobile) {
    return (
      <div className="md:hidden">
        <button
          type="button"
          aria-label={ctxUser ? "Quản lý tài khoản" : "Đăng nhập/Đăng ký"}
          onClick={() => {
            const newOpen = !open;
            setOpenLocal(newOpen);
            setOpen(newOpen); // Update context
            if (newOpen) {
              setUser(ctxUser); // Update context
              setMe(me); // Update context
            }
          }}
          className="group rounded-full focus:outline-none transition-all duration-200 flex items-center"
        >
          {avatarSrc ? (
            <div className="relative w-8 h-8">
              <Image
                src={avatarSrc}
                alt={me?.name || "avatar"}
                fill
                className="rounded-full object-cover border-2 border-zinc-200 dark:border-zinc-700"
                unoptimized
              />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-100 to-sky-50 dark:from-sky-900/30 dark:to-sky-800/20 flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            </div>
          )}
        </button>
      </div>
    );
  }

  // Desktop: use dropdown (hidden on mobile)
  return (
    <div
      ref={wrapperRef}
      className="relative hidden md:block"
      data-tooltip-id={open ? undefined : "user-tooltip"}
      data-tooltip-content={ctxUser ? "Quản lý tài khoản" : "Đăng nhập/Đăng ký"}
    >
      <button
        type="button"
        aria-label={ctxUser ? "Quản lý tài khoản" : "Đăng nhập/Đăng ký"}
        onClick={() => {
          const newOpen = !open;
          setOpenLocal(newOpen);
        }}
        className={`group rounded-full focus:outline-none transition-all duration-200 hover:scale-105 flex items-center ${
          avatarSrc ? "p-0.5" : "p-2 hover:bg-sky-100 dark:hover:bg-sky-900/50"
        }`}
      >
        {avatarSrc ? (
          <div className="relative w-8 h-8">
            <Image
              src={avatarSrc}
              alt={me?.name || "avatar"}
              fill
              className="rounded-full object-cover border-2 border-zinc-200 dark:border-zinc-700 group-hover:border-sky-500 dark:group-hover:border-sky-400 transition-colors"
              unoptimized
            />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-100 to-sky-50 dark:from-sky-900/30 dark:to-sky-800/20 flex items-center justify-center group-hover:from-sky-200 dark:group-hover:from-sky-800/50 transition-all">
            <UserIcon className="w-5 h-5 text-sky-600 dark:text-sky-400" />
          </div>
        )}
      </button>

      {open && !isMobile && (
        <div
          className="absolute right-2 xs:right-0 mt-2
             w-[min(19rem,calc(100vw-1rem))] sm:w-80
             max-w-[calc(100vw-0.75rem)]
             bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl shadow-2xl rounded-2xl
             p-3 xs:p-4 border border-zinc-200/80 dark:border-zinc-700/80 z-[55] animate-in fade-in zoom-in-95 duration-200"
        >
          {ctxUser ? (
            <>
              {/* Header */}
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-zinc-200 dark:border-zinc-700">
                {avatarSrc ? (
                  <div className="relative w-10 h-10">
                    <Image
                      src={avatarSrc}
                      alt={me?.name || "avatar"}
                      fill
                      className="rounded-full object-cover border-2 border-sky-500"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-100 to-sky-50 dark:from-sky-900/30 dark:to-sky-800/20 flex items-center justify-center">
                    <UserIcon className="w-6 h-6 text-sky-600 dark:text-sky-400" />
                  </div>
                )}
                <div>
                  <p className="font-semibold text-sm text-zinc-900 dark:text-white">
                    {me?.name || (ctxUser as any)?.name || "Người dùng"}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {me?.email || (ctxUser as any)?.email || "—"}
                  </p>
                </div>
              </div>

              {/* Trang cá nhân */}
              <Link
                href={`${base}/account`}
                onClick={() => {
                  setOpenLocal(false);
                }}
                className="flex items-center gap-3 px-3 py-1.5 rounded-xl hover:bg-sky-50 dark:hover:bg-sky-900/30 transition-all duration-200 group"
              >
                <IdCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                  Trang cá nhân
                </span>
                <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
                </div>
              </Link>

              {/* Quyền */}
              <div className="flex items-center justify-between px-3 py-1.5 rounded-xl hover:bg-sky-50 dark:hover:bg-sky-900/30 transition-all duration-200">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                    Quyền
                  </span>
                </div>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                    userRole === "admin"
                      ? "border-purple-300 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700"
                      : userRole === "teacher"
                      ? "border-blue-300 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700"
                      : "border-zinc-300 bg-zinc-100 text-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-300 dark:border-zinc-700"
                  }`}
                >
                  {userRole === "admin"
                    ? "Quản trị"
                    : userRole === "teacher"
                    ? "Giáo viên"
                    : "Người dùng"}
                </span>
              </div>

              {/* Gói */}
              <Link
                href={`${base}/pricing`}
                onClick={() => {
                  setOpenLocal(false);
                }}
                className="flex items-center justify-between px-3 py-1.5 rounded-xl hover:bg-sky-50 dark:hover:bg-sky-900/30 transition-all duration-200 group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  {userAccess === "premium" ? (
                    <Crown className="w-4 h-4 text-yellow-500" />
                  ) : (
                    <Star className="w-4 h-4 text-zinc-400" />
                  )}
                  <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                    Gói
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                      userAccess === "premium"
                        ? "border-yellow-300 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700"
                        : "border-zinc-300 bg-zinc-100 text-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-300 dark:border-zinc-700"
                    }`}
                  >
                    {userAccess === "premium" ? "Cao cấp" : "Miễn phí"}
                  </span>
                </div>
              </Link>

              {/* TOEIC */}
              {/* <div className="flex items-center justify-between px-3 py-1.5 rounded-xl hover:bg-sky-50 dark:hover:bg-sky-900/30 transition-all duration-200">
                <div className="flex items-center gap-3">
                  <Gauge className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                    TOEIC ước lượng
                  </span>
                </div>
                <span className="font-bold text-zinc-900 dark:text-white">
                  {loading ? "—" : predictedOverall ?? "—"}
                  <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">
                    {" "}
                    / 990
                  </span>
                </span>
              </div> */}

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
                    onClick={() => {
                      setOpenLocal(false);
                    }}
                    className="flex items-center justify-between px-3 py-1.5 rounded-xl hover:bg-sky-50 dark:hover:bg-sky-900/30 transition-all duration-200 group"
                  >
                    <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                      {row.label}
                    </span>
                    {config ? (
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold border ${config.bg} ${config.border} ${config.text}`}
                      >
                        <Zap className={`w-3 h-3 ${config.icon}`} />
                        Level {row.lv}
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-400">—</span>
                    )}
                  </Link>
                );
              })}

              {/* Logout */}
              <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-3 py-1.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/30 transition-all duration-200 text-red-600 dark:text-red-400"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-medium">Đăng xuất</span>
                </button>
              </div>
            </>
          ) : (
            <>
              {/* === PHẦN CHƯA ĐĂNG NHẬP === */}
              <div className="px-1">
                <div className="text-sm font-bold text-zinc-800 dark:text-zinc-100 mb-3 text-start">
                  Tài khoản
                </div>

                <div className="space-y-2">
                  {/* ĐĂNG NHẬP */}
                  <Link
                    href={`${base}/login`}
                    onClick={() => {
                      setOpenLocal(false);
                    }}
                    className={`group flex items-center gap-3 p-1.5 rounded-xl transition-all duration-200 bg-zinc-50 dark:bg-zinc-800 hover:bg-sky-50 dark:hover:bg-sky-900/30`}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-100 dark:bg-emerald-900/30 shadow-sm">
                      <LogIn className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                        Đăng nhập
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Đã có tài khoản
                      </p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  </Link>

                  {/* ĐĂNG KÝ */}
                  <Link
                    href={`${base}/register`}
                    onClick={() => {
                      setOpenLocal(false);
                    }}
                    className={`group flex items-center gap-3 p-1.5 rounded-xl transition-all duration-200 bg-zinc-50 dark:bg-zinc-800 hover:bg-sky-50 dark:hover:bg-sky-900/30`}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sky-100 dark:bg-sky-900/30 shadow-sm">
                      <UserPlus className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                        Đăng ký
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Tạo tài khoản mới
                      </p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRight className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    </div>
                  </Link>
                </div>
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
          offset={10}
          className="z-50 !bg-zinc-800 !text-white !text-xs !rounded-lg !px-2.5 !py-1.5 shadow-lg"
        />
      )}
    </div>
  );
}

<Tooltip
  id="user-tooltip"
  place="bottom"
  positionStrategy="fixed"
  offset={10}
  className="z-50 !bg-zinc-800 !text-white !text-xs !rounded-lg !px-2.5 !py-1.5 shadow-lg"
/>;
