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
  ShieldCheck,
} from "lucide-react";
import { Tooltip } from "react-tooltip";
import { useLocaleSwitch } from "@/hooks/useLocaleSwitch";
import useClickOutside from "@/hooks/useClickOutside";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

/* ================= Types ================= */
type Role = "user" | "admin";
type Access = "free" | "premium";
type Lvl = 1 | 2 | 3;
type PartKey =
  | "part.1" | "part.2" | "part.3" | "part.4" | "part.5" | "part.6" | "part.7";

type SafeUser = {
  id?: string;
  _id?: string;
  name?: string;
  email?: string;
  role?: Role;
  access?: Access;
  picture?: string;
  partLevels?: any;
  toeicPred?: { overall?: number | null; listening?: number | null; reading?: number | null } | null;
};

/* ================= Consts ================= */
const PARTS: PartKey[] = ["part.1","part.2","part.3","part.4","part.5","part.6","part.7"];

const LV_BADGE: Record<Lvl, string> = {
  1: "border-emerald-300 bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 dark:border-emerald-700",
  2: "border-sky-300 bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200 dark:border-sky-700",
  3: "border-violet-300 bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200 dark:border-violet-700",
};

const round5_990 = (n: number) => Math.min(990, Math.max(10, Math.round(n / 5) * 5));

/* ================= Utils ================= */
function normalizePartLevels(raw: any): Partial<Record<PartKey, Lvl>> | null {
  if (!raw || typeof raw !== "object") return null;
  const out: Partial<Record<PartKey, Lvl>> = {};
  for (const p of PARTS) {
    const num = p.split(".")[1]; // "1".."7"
    // Chuẩn hiện tại của BE: partLevels.part[num]
    let v: any = raw[p];
    if (v == null && raw.part && typeof raw.part === "object") v = raw.part[num];
    if (v == null && raw[num] != null) v = raw[num]; // legacy
    const n = Number(v);
    if (n === 1 || n === 2 || n === 3) out[p] = n as Lvl;
  }
  return Object.keys(out).length ? out : null;
}

// Hỗ trợ cả hai dạng response: { user: {...} } hoặc {...}
function pickUserFromMe(json: any): SafeUser | null {
  if (!json) return null;
  if (json.user && typeof json.user === "object") return json.user;
  if (json.data && typeof json.data === "object") return json.data; // phòng khi bạn bọc ở key data
  if (json._id || json.id || json.email || json.partLevels || json.toeicPred || json.access) return json;
  return null;
}

/* ================= Main ================= */
export default function UserMenu() {
  const { user: ctxUser, logout } = useAuth(); // chỉ dùng để biết đã đăng nhập và lấy avatar fallback
  const router = useRouter();
  const { locale } = useLocaleSwitch();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [me, setMe] = useState<SafeUser | null>(null);

  const wrapperRef = useRef(null);
  useClickOutside(wrapperRef, () => setOpen(false));

  const fetchMe = React.useCallback(async () => {
    try {
      const r = await fetch("/api/auth/me", { credentials: "include", cache: "no-store" });
      if (!r.ok) return;
      const j = await r.json();
      const u = pickUserFromMe(j);
      if (u) setMe(u);
    } catch {/* ignore */}
  }, []);

  React.useEffect(() => {
    (async () => {
      if (!ctxUser) {
        setMe(null);
        return;
      }
      setLoading(true);
      await fetchMe();
      setLoading(false);
    })();

    // Refetch khi tab quay lại (sau khi user làm practice)
    const onVis = () => document.visibilityState === "visible" && fetchMe();
    document.addEventListener("visibilitychange", onVis);

    // Optional: lắng nghe sự kiện khi trang practice phát
    const onPracticeUpdated = () => fetchMe();
    window.addEventListener("practice:updated", onPracticeUpdated as any);

    // Interval nhẹ để đồng bộ
    const t = setInterval(fetchMe, 15000);

    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("practice:updated", onPracticeUpdated as any);
      clearInterval(t);
    };
  }, [ctxUser, fetchMe]);

  const handleLogout = async () => {
    setOpen(false);
    try {
      await logout();
      toast.success("Đăng xuất thành công");
      router.push("/auth/login");
    } catch {
      toast.error("Lỗi khi đăng xuất");
    }
  };

  /* ===== Đọc trực tiếp từ DB ===== */
  const levels = React.useMemo(
    () => normalizePartLevels(me?.partLevels) ?? null,
    [me]
  );

  const predictedOverall: number | undefined = React.useMemo(() => {
    const val = me?.toeicPred?.overall;
    return typeof val === "number" && Number.isFinite(val) ? round5_990(val) : undefined;
  }, [me]);

  const userRole = (me?.role as Role | undefined) ?? "user";
  const userAccess = (me?.access as Access | undefined) ?? "free";

  /* ===== Rows gợi ý theo phần — dùng level CHUẨN từ DB ===== */
  const PARTS: PartKey[] = ["part.1","part.2","part.3","part.4","part.5","part.6","part.7"];
  const partRows = PARTS.map((key) => {
    const lv = levels?.[key] as Lvl | undefined;
    const label = `Phần ${key.split(".")[1]}`;
    const href = lv
      ? `/${locale}/practice/${encodeURIComponent(key)}/${lv}/1`
      : `/${locale}/practice/${encodeURIComponent(key)}`;
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
      <button
        type="button"
        aria-label={ctxUser ? "Quản lý tài khoản" : "Đăng nhập/Đăng ký"}
        onClick={() => setOpen((prev) => !prev)}
        className={`rounded-full focus:outline-none transition duration-300 hover:scale-105 flex items-center ${
          avatarSrc
            ? "text-gray-800 dark:text-gray-100"
            : "p-2 hover:bg-sky-100 dark:hover:bg-sky-900 text-gray-800 dark:text-gray-100"
        }`}
      >
        {avatarSrc ? (
          <img
            src={avatarSrc}
            alt={me?.name || "avatar"}
            className="w-8 h-8 rounded-full object-cover border border-zinc-200 dark:border-zinc-700"
          />
        ) : (
          <div className="w-6 h-6 flex items-center justify-center">
            <UserIcon className="w-6 h-6" />
          </div>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-zinc-900 shadow-xl rounded-lg p-3 border border-zinc-200 dark:border-zinc-700 z-50 animate-fadeIn">
          {ctxUser ? (
            <>
              <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 mb-2">
                Tài khoản
              </div>

              {/* Trang cá nhân */}
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

              {/* Quyền (role) */}
              <div className="px-3 py-2 bg-zinc-50 dark:bg-zinc-800 rounded-md hover:bg-sky-100 dark:hover:bg-sky-900 transition-colors duration-200">
                <div className="flex items-center justify-between text-sm text-zinc-800 dark:text-zinc-100">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="h-4 w-4 text-purple-600" />
                    <span>Quyền</span>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize border ${
                      userRole === "admin"
                        ? "border-purple-300 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-700"
                        : "border-zinc-300 bg-zinc-50 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700"
                    }`}
                  >
                    {userRole === "admin" ? "Quản trị" : "Người dùng"}
                  </span>
                </div>
              </div>

              {/* Gói truy cập (access) — THÊM LẠI */}
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
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize border ${
                      userAccess === "premium"
                        ? "border-yellow-300 bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700"
                        : "border-zinc-300 bg-zinc-50 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700"
                    }`}
                  >
                    {userAccess === "premium" ? "Cao cấp" : "Miễn phí"}
                  </span>
                </div>
              </div>

              {/* TOEIC ước lượng */}
              <div className="px-3 py-2 bg-zinc-50 dark:bg-zinc-800 rounded-md hover:bg-sky-100 dark:hover:bg-sky-900 transition-colors duration-200">
                <div className="flex items-center justify-between text-sm text-zinc-800 dark:text-zinc-100">
                  <div className="flex items-center gap-2.5">
                    <Gauge className="h-4 w-4 text-zinc-700" />
                    <span>TOEIC ước lượng</span>
                  </div>
                  <span className="font-semibold">
                    {loading ? "—" : (predictedOverall ?? "—")}
                    <span className="text-xs text-zinc-500"> / 990</span>
                  </span>
                </div>
              </div>

              {/* Gợi ý theo phần */}
              <div className="px-3 py-2 text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Gợi ý theo Phần
              </div>

              {partRows.map((row) => (
                <div
                  key={row.key}
                  className="px-3 py-2 bg-zinc-50 dark:bg-zinc-800 rounded-md hover:bg-sky-100 dark:hover:bg-sky-900 transition-colors duration-200"
                >
                  <Link
                    href={row.href}
                    className="flex items-center justify-between text-sm text-zinc-800 dark:text-zinc-100"
                    onClick={() => setOpen(false)}
                  >
                    <span>{row.label}</span>
                    {row.lv ? (
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${LV_BADGE[row.lv]}`}
                        title="Level hiện tại (DB)"
                      >
                        Level {row.lv}
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-400">—</span>
                    )}
                  </Link>
                </div>
              ))}

              {/* Logout */}
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