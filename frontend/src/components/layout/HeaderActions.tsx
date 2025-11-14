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

/* ================= LanguageSwitcher ================= */
export function LanguageSwitcher() {
  const { locale, hrefFor } = useLocaleSwitch();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useClickOutside(wrapperRef, () => {
    if (open) setOpen(false);
  });

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        aria-label="Chọn ngôn ngữ"
        onClick={() => setOpen((prev) => !prev)}
        className="p-2 rounded-full hover:bg-sky-100 dark:hover:bg-sky-900 focus:outline-none transition duration-300 hover:scale-105 text-gray-800 dark:text-gray-100"
        {...(!open
          ? {
              "data-tooltip-id": "language-tooltip",
              "data-tooltip-content": "Chọn ngôn ngữ",
            }
          : {})}
      >
        <div className="w-6 h-6">
          <Globe size="100%" />
        </div>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-zinc-900 shadow-xl rounded-lg p-4 border border-zinc-200 dark:border-zinc-700 z-50">
          <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 mb-3">
            Chọn Ngôn Ngữ
          </div>
          <ul className="space-y-2">
            <li>
              <Link
                href={hrefFor("vi")}
                className="flex items-center gap-3 p-3 text-sm text-zinc-800 dark:text-zinc-100 bg-zinc-50 dark:bg-zinc-800 hover:bg-sky-100 dark:hover:bg-sky-900 rounded-lg transition-colors duration-200"
                aria-current={locale === "vi" ? "true" : undefined}
              >
                <Flag code="vn" className="w-7 h-auto rounded-sm" />
                <div>
                  <div className="font-medium">Tiếng Việt</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    Ngôn ngữ Việt Nam
                  </div>
                </div>
              </Link>
            </li>
            <li>
              <Link
                href={hrefFor("en")}
                className="flex items-center gap-3 p-3 text-sm text-zinc-800 dark:text-zinc-100 bg-zinc-50 dark:bg-zinc-800 hover:bg-sky-100 dark:hover:bg-sky-900 rounded-lg transition-colors duration-200"
                aria-current={locale === "en" ? "true" : undefined}
              >
                <Flag code="gb" className="w-7 h-auto rounded-sm" />
                <div>
                  <div className="font-medium">Tiếng Anh</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    Ngôn ngữ quốc tế
                  </div>
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
          className="bg-zinc-800 text-white text-xs rounded-lg px-2 py-1"
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

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        aria-label="Thông báo"
        onClick={() => {
          setOpen((prev) => !prev);
          if (!open) setTimeout(() => markAllRead(), 150);
        }}
        className="p-2 rounded-full hover:bg-sky-100 dark:hover:bg-sky-900 focus:outline-none transition duration-300 hover:scale-105 relative text-gray-800 dark:text-gray-100"
        {...(!open
          ? {
              "data-tooltip-id": "notification-tooltip",
              "data-tooltip-content": "Xem thông báo",
            }
          : {})}
      >
        <div className="w-6 h-6 relative flex items-center justify-center">
          <Bell size="100%" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center leading-none">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </div>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-zinc-900 shadow-xl rounded-lg p-4 border border-zinc-200 dark:border-zinc-700 z-50">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
              Thông Báo
            </div>
            {items.length > 0 && (
              <button
                onClick={clearAll}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                Xoá tất cả
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="text-sm text-zinc-500 dark:text-zinc-400">
              Chưa có thông báo
            </div>
          ) : (
            <ul className="space-y-2 max-h-80 overflow-auto">
              {items.map((n) => (
                <li key={n.id}>
                  <Link
                    href={n.link || "#"}
                    onClick={() => setOpen(false)}
                    className={`block p-3 rounded-lg transition-colors duration-200 ${
                      n.read
                        ? "bg-zinc-50 dark:bg-zinc-800 hover:bg-sky-100 dark:hover:bg-sky-900"
                        : "bg-sky-50 dark:bg-sky-900/50 hover:bg-sky-100 dark:hover:bg-sky-900"
                    }`}
                  >
                    <div className="text-sm text-zinc-800 dark:text-zinc-100">
                      {n.message}
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
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
          className="bg-zinc-800 text-white text-xs rounded-lg px-2 py-1"
        />
      )}
    </div>
  );
}

/* ================= ThemeToggle ================= */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div>
      <button
        type="button"
        aria-label="Chuyển đổi giao diện"
        onClick={(e) => {
          e.stopPropagation();
          setTheme(theme === "light" ? "dark" : "light");
        }}
        className="p-2 rounded-full hover:bg-sky-100 dark:hover:bg-sky-900 focus:outline-none transition duration-300 hover:scale-105 text-gray-800 dark:text-gray-100"
        data-tooltip-id="theme-tooltip"
        data-tooltip-content={
          theme === "light"
            ? "Chuyển sang chế độ tối"
            : "Chuyển sang chế độ sáng"
        }
      >
        <div className="w-6 h-6 flex items-center justify-center">
          {theme === "light" ? <Moon size="100%" /> : <Sun size="100%" />}
        </div>
      </button>

      <Tooltip
        id="theme-tooltip"
        place="bottom"
        positionStrategy="fixed"
        offset={8}
        delayHide={0}
        className="bg-zinc-800 text-white text-xs rounded-lg px-2 py-1"
      />
    </div>
  );
}

/* ================= HeaderActions ================= */
export default function HeaderActions() {
  return (
    <div className="flex items-center">
      {/* Watcher âm thầm kiểm tra eligibility để đẩy thông báo & corner toast */}
      <ProgressEligibilityWatcher />
      <PracticeInactivityWatcher/>
      <ThemeToggle />
      <LanguageSwitcher />
      <Notification />
    </div>
  );
}