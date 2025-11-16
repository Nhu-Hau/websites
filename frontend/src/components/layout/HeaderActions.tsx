"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Flag from "react-world-flags";
import { Globe, Bell, Moon, Sun } from "lucide-react";
import { Tooltip } from "react-tooltip";
import { useLocaleSwitch } from "@/hooks/routing/useLocaleSwitch";
import useClickOutside from "@/hooks/common/useClickOutside";
import { useTheme } from "@/context/ThemeContext";
import { useNotifications } from "@/hooks/common/useNotifications";
import ProgressEligibilityWatcher from "@/components/features/progress/ProgressEligibility";
import PracticeInactivityWatcher from "@/components/features/practice/PracticeInactivity";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/* ================= Base button style ================= */

const iconButtonBase =
  "inline-flex h-9 w-9 items-center justify-center rounded-full border border-transparent bg-transparent " +
  "text-zinc-700 dark:text-zinc-200 " +
  "transition-transform transition-colors duration-200 ease-out " +
  "hover:bg-zinc-100/80 dark:hover:bg-zinc-800/70 hover:text-amber-600 dark:hover:text-amber-300 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/70 " +
  "focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950";

/* ================= LanguageSwitcher ================= */
export function LanguageSwitcher() {
  const { locale, hrefFor } = useLocaleSwitch();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useClickOutside(wrapperRef, () => {
    if (open) setOpen(false);
  });

return (
  <div className="relative flex-shrink-0" ref={wrapperRef}>
    <button
      type="button"
      aria-label="Chọn ngôn ngữ"
      onClick={() => setOpen((prev) => !prev)}
      className={cn(iconButtonBase)}
      {...(!open
        ? {
            "data-tooltip-id": "language-tooltip",
            "data-tooltip-content": "Chọn ngôn ngữ",
          }
        : {})}
    >
      <Globe className="h-5 w-5" />
    </button>

    {open && (
      <div
        className={cn(
          "absolute right-0 mt-3.5 z-50",
          "w-64 sm:w-72 max-w-[90vw]",
          "rounded-2xl border border-zinc-200/70 bg-white/95 shadow-2xl ring-1 ring-black/5",
          "dark:border-zinc-700/70 dark:bg-zinc-900/95 dark:ring-white/10",
          "backdrop-blur-xl p-3 sm:p-4",
          "animate-in fade-in zoom-in-95 duration-200 origin-top-right"
        )}
      >
        <div className="mb-2 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
          Chọn ngôn ngữ
        </div>
        <ul className="space-y-2">
          {/* Tiếng Việt */}
          <li>
            <Link
              href={hrefFor("vi")}
              aria-current={locale === "vi" ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm",
                "transition-colors duration-200 ease-out",
                locale === "vi"
                  ? "bg-sky-50 text-sky-800 shadow-sm ring-1 ring-sky-100 dark:bg-sky-900/25 dark:text-sky-100 dark:ring-sky-500/40"
                  : "bg-zinc-50 text-zinc-800 hover:bg-zinc-100/80 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700/80"
              )}
            >
              <Flag code="vn" className="h-5 w-7 rounded-sm object-cover" />
              <div className="flex flex-col">
                <span className="font-medium">Tiếng Việt</span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  Ngôn ngữ Việt Nam
                </span>
              </div>
            </Link>
          </li>

          {/* Tiếng Anh */}
          <li>
            <Link
              href={hrefFor("en")}
              aria-current={locale === "en" ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm",
                "transition-colors duration-200 ease-out",
                locale === "en"
                  ? "bg-sky-50 text-sky-800 shadow-sm ring-1 ring-sky-100 dark:bg-sky-900/25 dark:text-sky-100 dark:ring-sky-500/40"
                  : "bg-zinc-50 text-zinc-800 hover:bg-zinc-100/80 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700/80"
              )}
            >
              <Flag code="gb" className="h-5 w-7 rounded-sm object-cover" />
              <div className="flex flex-col">
                <span className="font-medium">Tiếng Anh</span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  Ngôn ngữ quốc tế
                </span>
              </div>
            </Link>
          </li>
        </ul>
      </div>
    )}

    {!open && (
      <Tooltip
        id="language-tooltip"
        place="bottom"
        positionStrategy="fixed"
        offset={8}
        delayHide={0}
        className="rounded-lg bg-zinc-900 px-2 py-1 text-xs text-white shadow-lg"
      />
    )}
  </div>
);
}

/* ================= Notification ================= */
export function Notification() {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  useClickOutside(wrapperRef, () => {
    if (open) setOpen(false);
  });

  const { items, unread, markAllRead, clearAll } = useNotifications();

  const handleToggle = () => {
    setOpen((prev) => !prev);
    if (!open) {
      setTimeout(() => markAllRead(), 150);
    }
  };

  return (
    <div className="relative flex-shrink-0" ref={wrapperRef}>
      <button
        type="button"
        aria-label="Thông báo"
        onClick={handleToggle}
        className={cn(iconButtonBase, "relative")}
        {...(!open
          ? {
              "data-tooltip-id": "notification-tooltip",
              "data-tooltip-content": "Xem thông báo",
            }
          : {})}
      >
        <div className="relative flex h-5 w-5 items-center justify-center">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white shadow-md">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </div>
      </button>

      {open && (
        <div
          className={cn(
            "absolute right-0 mt-3.5 z-50",
            "w-72 sm:w-80 max-w-[90vw]",
            "rounded-2xl border border-zinc-200/70 bg-white/95 shadow-2xl ring-1 ring-black/5",
            "dark:border-zinc-700/70 dark:bg-zinc-900/95 dark:ring-white/10",
            "backdrop-blur-xl p-3 sm:p-4",
            "animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right"
          )}
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
              Thông báo
            </div>
            {items.length > 0 && (
              <button
                onClick={clearAll}
                className="text-xs font-medium text-amber-700 hover:text-amber-600 dark:text-amber-300 dark:hover:text-amber-200 underline-offset-2 hover:underline"
              >
                Xoá tất cả
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="py-2 text-sm text-zinc-500 dark:text-zinc-400">
              Chưa có thông báo
            </div>
          ) : (
            <ul className="max-h-80 space-y-2 overflow-y-auto pr-1">
              {items.map((n) => (
                <li key={n.id}>
                  <Link
                    href={n.link || "#"}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "block rounded-xl px-3 py-2.5 text-sm transition-colors duration-200",
                      n.read
                        ? "bg-zinc-50 text-zinc-800 hover:bg-sky-50/80 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700/80"
                        : "bg-sky-50 text-zinc-900 hover:bg-sky-100 dark:bg-sky-900/40 dark:text-zinc-50 dark:hover:bg-sky-900/70"
                    )}
                  >
                    <div className="text-[13px] leading-snug">
                      {n.message}
                    </div>
                    <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                      {new Date(n.createdAt).toLocaleString()}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {!open && (
        <Tooltip
          id="notification-tooltip"
          place="bottom"
          positionStrategy="fixed"
          offset={8}
          delayHide={0}
          className="rounded-lg bg-zinc-900 px-2 py-1 text-xs text-white shadow-lg"
        />
      )}
    </div>
  );
}

/* ================= ThemeToggle ================= */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const nextLabel =
    theme === "light" ? "Chuyển sang chế độ tối" : "Chuyển sang chế độ sáng";

  return (
    <div className="flex-shrink-0">
      <button
        type="button"
        aria-label="Chuyển đổi giao diện"
        onClick={(e) => {
          e.stopPropagation();
          setTheme(theme === "light" ? "dark" : "light");
        }}
        className={cn(iconButtonBase)}
        data-tooltip-id="theme-tooltip"
        data-tooltip-content={nextLabel}
      >
        {theme === "light" ? (
          <Moon className="h-5 w-5" />
        ) : (
          <Sun className="h-5 w-5" />
        )}
      </button>

      <Tooltip
        id="theme-tooltip"
        place="bottom"
        positionStrategy="fixed"
        offset={8}
        delayHide={0}
        className="rounded-lg bg-zinc-900 px-2 py-1 text-xs text-white shadow-lg"
      />
    </div>
  );
}

/* ================= HeaderActions ================= */
export default function HeaderActions() {
  return (
    <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-3">
      {/* Watcher âm thầm kiểm tra eligibility để đẩy thông báo & corner toast */}
      <ProgressEligibilityWatcher />
      <PracticeInactivityWatcher />
      <ThemeToggle />
      <LanguageSwitcher />
      <Notification />
    </div>
  );
}