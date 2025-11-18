/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User as UserIcon,
  LogOut,
  Crown,
  Star,
  IdCard,
  ShieldCheck,
  Zap,
  X,
  Globe,
  Moon,
  Sun,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useLocaleSwitch } from "@/hooks/routing/useLocaleSwitch";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import Flag from "react-world-flags";

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
    bg: "bg-amber-100 dark:bg-amber-900/30",
    border: "border-amber-300 dark:border-amber-700",
    text: "text-amber-800 dark:text-amber-300",
    icon: "text-amber-600 dark:text-amber-400",
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

function pickUserFromMe(json: any): any | null {
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

interface User {
  id: string;
  email: string;
  name?: string | undefined;
  role: "admin" | "user" | "teacher";
  access: "free" | "premium";
  level: 2 | 1 | 3;
  levelUpdatedAt?: string | null | undefined;
  levelSource?: "manual" | "auto" | "admin" | undefined;
  lastPlacementAttemptId?: string | null | undefined;
  createdAt?: string | null | undefined;
  picture?: string | null | undefined;
}

interface MobileAvatarSheetProps {
  open: boolean;
  onClose: () => void;
  user: User;
  me: User;
}

export default function MobileAvatarSheet({
  open,
  onClose,
  user,
  me: initialMe,
}: MobileAvatarSheetProps) {
  const { logout, user: ctxUser } = useAuth();
  const router = useRouter();
  const { locale, hrefFor } = useLocaleSwitch();
  const base = useBasePrefix(locale || "vi");
  const { theme, setTheme } = useTheme();
  const [me, setMe] = useState<any | null>(initialMe);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Fetch user data
  useEffect(() => {
    if (!open || !ctxUser) {
      setMe(null);
      return;
    }
    const fetchMe = async () => {
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
    };
    fetchMe();
  }, [open, ctxUser]);

  const handleLogout = async () => {
    onClose();
    try {
      await logout();
      toast.success("Đăng xuất thành công");
      router.push(`${base}/login`);
    } catch {
      toast.error("Lỗi khi đăng xuất");
    }
  };

  const levels = normalizePartLevels(me?.partLevels) ?? null;
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

  const avatarSrc =
    ("picture" in (me || {}) ? me.picture : undefined) ||
    ("picture" in (user || {}) ? user.picture : undefined) ||
    ("picture" in (ctxUser || {}) ? (ctxUser as any).picture : undefined);

  if (!open) return null;

  return (
    // Container duy nhất: fixed inset-0, flex justify-end để sheet luôn dính đáy
    <div className="fixed inset-0 z-[10001] md:hidden flex flex-col justify-end">
      {/* Backdrop: absolute inset-0 để phủ toàn màn hình */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet: relative w-full, rounded-t-3xl, max-h với calc để tránh overflow */}
      <div
        className={cn(
          "relative w-full bg-white dark:bg-zinc-900",
          "rounded-t-3xl shadow-2xl",
          "flex flex-col",
          "max-h-[calc(100vh-4rem)]"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
            Tài khoản
          </h2>
          <button
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Đóng"
          >
            <X className="h-5 w-5 text-zinc-700 dark:text-zinc-200" />
          </button>
        </div>

        {/* Content: flex-1 overflow-y-auto để có thể scroll */}
        <div className="flex-1 overflow-y-auto px-4 py-4 pb-20">
          {ctxUser || user ? (
            <>
              {/* User Info */}
              <div className="mb-3 flex items-center gap-3 border-b border-zinc-200 pb-4 dark:border-zinc-700">
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt={me?.name || "avatar"}
                    className="h-14 w-14 rounded-full border-2 border-sky-500 object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-sky-100 to-sky-50 dark:from-sky-900/30 dark:to-sky-800/20">
                    <UserIcon className="h-7 w-7 text-sky-600 dark:text-sky-400" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-base font-semibold text-zinc-900 dark:text-white">
                    {me?.name || user?.name || ctxUser?.name || "Người dùng"}
                  </p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {me?.email || user?.email || ctxUser?.email || "—"}
                  </p>
                </div>
              </div>

              {/* Menu Items */}
              <div className="space-y-1">
                {/* Trang cá nhân */}
                <Link
                  href={`${base}/account`}
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-xl px-4 py-2 transition-all duration-200 hover:bg-sky-50 dark:hover:bg-sky-900/30"
                >
                  <IdCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                    Trang cá nhân
                  </span>
                </Link>

                {/* Quyền */}
                <div className="flex items-center justify-between rounded-xl px-4 py-2">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                      Quyền
                    </span>
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold",
                      userRole === "admin"
                        ? "border-purple-300 bg-purple-100 text-purple-700 dark:border-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                        : userRole === "teacher"
                        ? "border-blue-300 bg-blue-100 text-blue-700 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
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

                {/* Gói */}
                <div className="flex items-center justify-between rounded-xl px-4 py-2">
                  <div className="flex items-center gap-3">
                    {userAccess === "premium" ? (
                      <Crown className="h-5 w-5 text-yellow-500" />
                    ) : (
                      <Star className="h-5 w-5 text-zinc-400" />
                    )}
                    <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                      Gói
                    </span>
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold",
                      userAccess === "premium"
                        ? "border-yellow-300 bg-yellow-100 text-yellow-700 dark:border-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                        : "border-zinc-300 bg-zinc-100 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-300"
                    )}
                  >
                    {userAccess === "premium" ? "Cao cấp" : "Miễn phí"}
                  </span>
                </div>

                {/* Level từng part */}
                <div className="pt-4 pb-5 px-4">
                  <p className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Level từng part
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {partRows.map((row) => {
                      const config = row.lv ? LV_BADGE[row.lv] : null;
                      return (
                        <Link
                          key={row.key}
                          href={row.href}
                          onClick={onClose}
                          className={cn(
                            "flex items-center justify-between rounded-xl px-3 py-2 transition-all duration-200",
                            "hover:bg-sky-50 dark:hover:bg-sky-900/30",
                            config
                              ? `${config.bg} ${config.border} border`
                              : "bg-zinc-50 dark:bg-zinc-800"
                          )}
                        >
                          <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                            {row.label}
                          </span>
                          {config ? (
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold",
                                config.text
                              )}
                            >
                              <Zap className={cn("h-3 w-3", config.icon)} />
                              Lv{row.lv}
                            </span>
                          ) : (
                            <span className="text-xs text-zinc-400">—</span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {/* Đổi ngôn ngữ */}
                <div className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-700">
                  <Link
                    href={hrefFor(locale === "vi" ? "en" : "vi")}
                    onClick={onClose}
                    className="flex items-center gap-3 rounded-xl px-4 py-2 transition-all duration-200 hover:bg-sky-50 dark:hover:bg-sky-900/30"
                  >
                    <Globe className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                    <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                      {locale === "vi" ? "English" : "Tiếng Việt"}
                    </span>
                    <Flag
                      code={locale === "vi" ? "gb" : "vn"}
                      className="ml-auto h-5 w-7 rounded-sm object-cover"
                    />
                  </Link>
                </div>

                {/* Đổi giao diện */}
                <button
                  onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                  className="mt-1 flex w-full items-center gap-3 rounded-xl px-4 py-2 transition-all duration-200 hover:bg-sky-50 dark:hover:bg-sky-900/30"
                >
                  {theme === "light" ? (
                    <Moon className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
                  ) : (
                    <Sun className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
                  )}
                  <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                    {theme === "light" ? "Chế độ tối" : "Chế độ sáng"}
                  </span>
                </button>

                {/* Đăng xuất */}
                <button
                  onClick={handleLogout}
                  className="mt-2 flex w-full items-center gap-3 rounded-xl px-4 py-2 text-red-600 transition-all duration-200 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="text-sm font-medium">Đăng xuất</span>
                </button>
              </div>
            </>
          ) : (
            <div className="py-8 text-center">
              <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
                Vui lòng đăng nhập để xem thông tin tài khoản
              </p>
              <div className="space-y-3">
                <Link
                  href={`${base}/login`}
                  onClick={onClose}
                  className="block w-full rounded-xl bg-sky-600 px-4 py-3 font-medium text-white transition-colors hover:bg-sky-700"
                >
                  Đăng nhập
                </Link>
                <Link
                  href={`${base}/register`}
                  onClick={onClose}
                  className="block w-full rounded-xl border border-zinc-300 px-4 py-3 font-medium text-zinc-800 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  Đăng ký
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
