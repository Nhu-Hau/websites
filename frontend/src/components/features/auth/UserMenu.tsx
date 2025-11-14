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
  Sparkles,
} from "lucide-react";
import { Tooltip } from "react-tooltip";
import { useLocaleSwitch } from "@/hooks/routing/useLocaleSwitch";
import useClickOutside from "@/hooks/common/useClickOutside";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";

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

// BẢNG MÀU LEVEL – CHUẨN
const LEVEL_COLORS: Record<
  Lvl,
  {
    primary: string;
    light: string;
    text: string;
    border: string;
    gradient: string;
    glow: string;
  }
> = {
  1: {
    primary: "bg-[#347433]",
    light: "bg-[#347433]/10 dark:bg-[#347433]/15",
    text: "text-[#347433] dark:text-[#347433]/90",
    border: "border-[#347433]/30 dark:border-[#347433]/40",
    gradient: "bg-gradient-to-r from-[#347433] to-[#3d8a3d]",
    glow: "shadow-[0_0_20px_rgba(52,116,51,0.4)]",
  },
  2: {
    primary: "bg-[#27548A]",
    light: "bg-[#27548A]/10 dark:bg-[#27548A]/15",
    text: "text-[#27548A] dark:text-[#27548A]/90",
    border: "border-[#27548A]/30 dark:border-[#27548A]/40",
    gradient: "bg-gradient-to-r from-[#27548A] to-[#2d62a0]",
    glow: "shadow-[0_0_20px_rgba(39,84,138,0.4)]",
  },
  3: {
    primary: "bg-[#BB3E00]",
    light: "bg-[#BB3E00]/10 dark:bg-[#BB3E00]/15",
    text: "text-[#BB3E00] dark:text-[#BB3E00]/90",
    border: "border-[#BB3E00]/30 dark:border-[#BB3E00]/40",
    gradient: "bg-gradient-to-r from-[#BB3E00] to-[#d14800]",
    glow: "shadow-[0_0_20px_rgba(187,62,0,0.4)]",
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
      className="relative"
      data-tooltip-id={open ? undefined : "user-tooltip"}
      data-tooltip-content={ctxUser ? "Quản lý tài khoản" : "Đăng nhập/Đăng ký"}
    >
      {/* Avatar Button */}
      <button
        type="button"
        aria-label={ctxUser ? "Quản lý tài khoản" : "Đăng nhập/Đăng ký"}
        onClick={() => setOpen((prev) => !prev)}
        className="group relative rounded-full focus:outline-none transition-all duration-200 hover:scale-[1.03]"
      >
        {avatarSrc ? (
          <img
            src={avatarSrc}
            alt={me?.name || "avatar"}
            className="w-8 h-8 rounded-full object-cover border border-white/50 dark:border-zinc-700/50 shadow-md ring-1 ring-white/30 dark:ring-zinc-800/30 group-hover:ring-sky-400/60 dark:group-hover:ring-sky-500/60 transition-all"
          />
        ) : (
          <div className="relative w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-sky-600 shadow-md ring-1 ring-white/50 dark:ring-zinc-800/50 flex items-center justify-center group-hover:from-sky-600 group-hover:to-sky-700 transition-all">
            <div className="w-5 h-5 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center">
              <UserIcon className="w-3.5 h-3.5 text-white drop-shadow-md" />
            </div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-sky-400/40 to-sky-500/40 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-400" />
          </div>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="group/dropdown absolute right-0 mt-2 w-[min(16rem,calc(100vw-1rem))] sm:w-72 bg-white/95 dark:bg-zinc-800/95 backdrop-blur-xl rounded-2xl shadow-2xl ring-1 ring-white/30 dark:ring-zinc-700/60 p-3 transition-all duration-300 hover:shadow-3xl overflow-hidden z-50">
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-sky-500/6 to-purple-500/6 opacity-0 group-hover/dropdown:opacity-100 transition-opacity duration-400" />

          <div className="relative">
            {ctxUser ? (
              <>
                {/* Header */}
                <div className="flex items-center gap-2.5 pb-2.5 mb-2 border-b border-white/30 dark:border-zinc-700/50">
                  {avatarSrc ? (
                    <img
                      src={avatarSrc}
                      alt={me?.name || "avatar"}
                      className="w-9 h-9 rounded-full object-cover border border-white/50 dark:border-zinc-700/50 shadow-md ring-1 ring-white/30 dark:ring-zinc-800/30"
                    />
                  ) : (
                    <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-sky-500 to-sky-600 shadow-md ring-1 ring-white/50 dark:ring-zinc-800/50 flex items-center justify-center">
                      <div className="w-6 h-6 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center">
                        <UserIcon className="w-4 h-4 text-white drop-shadow-md" />
                      </div>
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-sky-400/40 to-sky-500/40 blur-md opacity-0 group-hover/dropdown:opacity-100 transition-opacity duration-400" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-black text-zinc-900 dark:text-white">
                      {me?.name || "Người dùng"}
                    </p>
                    <p className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                      {me?.email || "—"}
                    </p>
                  </div>
                </div>

                {/* Trang cá nhân */}
                <Link
                  href={`${base}/account`}
                  onClick={() => setOpen(false)}
                  className="group/item mt-1 flex items-center justify-between px-3 py-1.5 rounded-2xl bg-white/60 dark:bg-zinc-800/60 backdrop-blur-md hover:bg-zinc-50 dark:hover:bg-zinc-700/70 transition-all duration-200"
                >
                  <div className="flex items-center gap-2.5">
                    <IdCard className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                    <span className="text-[13px] font-black text-zinc-800 dark:text-zinc-100">
                      Trang cá nhân
                    </span>
                  </div>
                  <ArrowRight className="w-3 h-3 text-zinc-400 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                </Link>

                {/* Quyền */}
                <div className="mt-1 flex items-center justify-between px-3 py-1.5 rounded-2xl bg-white/60 dark:bg-zinc-800/60 backdrop-blur-md">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span className="text-[13px] font-black text-zinc-800 dark:text-zinc-100">
                      Quyền
                    </span>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-black border ${
                      userRole === "admin"
                        ? "border-purple-300 bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-700"
                        : userRole === "teacher"
                        ? "border-blue-300 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700"
                        : "border-zinc-300 bg-zinc-100 text-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300 dark:border-zinc-700"
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
                <div className="mt-1 flex items-center justify-between px-3 py-1.5 rounded-2xl bg-white/60 dark:bg-zinc-800/60 backdrop-blur-md">
                  <div className="flex items-center gap-2.5">
                    {userAccess === "premium" ? (
                      <Crown className="w-3.5 h-3.5 text-yellow-500" />
                    ) : (
                      <Star className="w-3.5 h-3.5 text-zinc-400" />
                    )}
                    <span className="text-[13px] font-black text-zinc-800 dark:text-zinc-100">
                      Gói
                    </span>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-black border ${
                      userAccess === "premium"
                        ? "border-yellow-300 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-700"
                        : "border-zinc-300 bg-zinc-100 text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-300 dark:border-zinc-700"
                    }`}
                  >
                    {userAccess === "premium" ? "Cao cấp" : "Miễn phí"}
                  </span>
                </div>

                {/* Gợi ý theo phần */}
                <div className="mt-3 mb-1 px-3">
                  <p className="text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Gợi ý theo phần
                  </p>
                </div>

                {partRows.map((row) => {
                  const config = row.lv ? LEVEL_COLORS[row.lv] : null;
                  return (
                    <Link
                      key={row.key}
                      href={row.href}
                      onClick={() => setOpen(false)}
                      className="group/item flex items-center justify-between px-3 py-1.5 rounded-2xl bg-white/60 dark:bg-zinc-800/60 backdrop-blur-md hover:bg-zinc-50 dark:hover:bg-zinc-700/70 transition-all duration-200"
                    >
                      <span className="text-[13px] font-black text-zinc-800 dark:text-zinc-100">
                        {row.label}
                      </span>
                      {config ? (
                        <span
                          className={`group/badge inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-black border ${config.border} ${config.light} ${config.text} transition-all duration-200 group-hover/item:shadow-md`}
                        >
                          <Zap className="w-3 h-3" />
                          Level {row.lv}
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-zinc-400">
                          —
                        </span>
                      )}
                    </Link>
                  );
                })}

                {/* Logout */}
                <div className="mt-3 pt-2 border-t border-white/30 dark:border-zinc-700/50">
                  <button
                    onClick={handleLogout}
                    className="group w-full flex items-center justify-center gap-2 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-red-500 to-red-600 text-white font-black text-[13px] shadow-xl transition-all duration-200 hover:shadow-2xl hover:scale-[1.01] hover:from-red-500 hover:to-red-500"
                  >
                    <LogOut className="w-4 h-4 transition-transform group-hover:scale-110" />
                    Đăng xuất
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* === CHƯA ĐĂNG NHẬP === */}
                <div className="text-center py-4">
                  <div className="mx-auto w-14 h-14 rounded-full bg-gradient-to-br from-slate-100 to-slate-50 dark:from-zinc-800 dark:to-zinc-700 shadow-inner flex items-center justify-center mb-3">
                    <UserIcon className="w-9 h-9 text-slate-400 dark:text-zinc-500" />
                  </div>
                  <p className="text-sm font-black text-zinc-700 dark:text-zinc-300 mb-1">
                    Chưa đăng nhập
                  </p>
                  <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-5">
                    Đăng nhập để theo dõi tiến trình học tập
                  </p>

                  <div className="space-y-2">
                    <Link
                      href={`${base}/login`}
                      onClick={() => setOpen(false)}
                      className="group flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-black text-sm shadow-xl transition-all duration-200 hover:shadow-2xl hover:scale-[1.01] hover:from-emerald-500 hover:to-emerald-500"
                    >
                      <LogIn className="w-4 h-4 transition-transform group-hover:scale-110" />
                      Đăng nhập
                    </Link>

                    <Link
                      href={`${base}/register`}
                      onClick={() => setOpen(false)}
                      className="group flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 to-sky-600 text-white font-black text-sm shadow-xl transition-all duration-200 hover:shadow-2xl hover:scale-[1.01] hover:from-sky-500 hover:to-sky-500"
                    >
                      <UserPlus className="w-4 h-4 transition-transform group-hover:scale-110" />
                      Đăng ký
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {!open && (
        <Tooltip
          id="user-tooltip"
          place="bottom"
          positionStrategy="fixed"
          offset={10}
          className="z-50 !bg-black/90 !text-white !text-xs !rounded-lg !px-3 !py-1.5 shadow-2xl backdrop-blur-md"
        />
      )}
    </div>
  );
}