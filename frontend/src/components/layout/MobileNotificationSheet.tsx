"use client";

import { useEffect } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { useNotifications } from "@/hooks/common/useNotifications";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";
import { cn } from "@/lib/utils";

interface MobileNotificationSheetProps {
  open: boolean;
  onClose: () => void;
}

export default function MobileNotificationSheet({
  open,
  onClose,
}: MobileNotificationSheetProps) {
  const base = useBasePrefix();
  const { items, markAllRead, clearAll } = useNotifications();

  useEffect(() => {
    if (open) {
      markAllRead();
      // Lock body scroll
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open, markAllRead]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[10001] bg-black/50 backdrop-blur-sm md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        className={cn(
          "fixed inset-x-0 top-0 z-[10001] md:hidden",
          "bg-white dark:bg-zinc-900",
          "rounded-b-3xl shadow-2xl",
          "max-h-[85vh] flex flex-col",
          "animate-in slide-in-from-top duration-300"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
            Thông báo
          </h2>
          <div className="flex items-center gap-3">
            {items.length > 0 && (
              <button
                onClick={clearAll}
                className="text-sm font-medium text-amber-700 hover:text-amber-600 dark:text-amber-300 dark:hover:text-amber-200"
              >
                Xóa tất cả
              </button>
            )}
            <button
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="h-5 w-5 text-zinc-700 dark:text-zinc-200" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Chưa có thông báo
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {items.map((n) => (
                <li key={n.id}>
                  <Link
                    href={n.link || "#"}
                    onClick={onClose}
                    className={cn(
                      "block rounded-xl px-4 py-3 text-sm transition-colors duration-200",
                      "bg-zinc-50 text-zinc-800 hover:bg-sky-50/80",
                      "dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700/80"
                    )}
                  >
                    <div className="text-[13px] leading-snug">{n.message}</div>
                    <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                      {new Date(n.createdAt).toLocaleString()}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

