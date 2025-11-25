"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useNotifications } from "@/hooks/common/useNotifications";
import { cn } from "@/lib/utils";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";
import { resolveLocaleHref } from "@/lib/navigation/resolveLocaleHref";

interface MobileNotificationSheetProps {
  open: boolean;
  onClose: () => void;
}

export default function MobileNotificationSheet({
  open,
  onClose,
}: MobileNotificationSheetProps) {
  const { items, markAllRead, clearAll } = useNotifications();
  const t = useTranslations("HeaderActions.notification");
  const translate = useTranslations();
  const [mounted, setMounted] = useState(false);
  const basePrefix = useBasePrefix();

  useEffect(() => {
    setMounted(true);
  }, []);

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

  if (!mounted) return null;

  const sheetContent = (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="mobile-notification-backdrop"
            className="fixed inset-0 z-[10001] bg-black/50 backdrop-blur-sm md:hidden"
            onClick={onClose}
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />

          <motion.div
            key="mobile-notification-sheet"
            className={cn(
              "fixed inset-x-0 top-0 z-[10002] md:hidden",
              "bg-white dark:bg-zinc-900",
              "rounded-b-3xl shadow-2xl",
              "max-h-[85vh] flex flex-col"
            )}
            initial={{ y: "-100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 32 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                {t("title")}
              </h2>
              <div className="flex items-center gap-3">
                {items.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="text-sm font-medium text-amber-700 hover:text-amber-600 dark:text-amber-300 dark:hover:text-amber-200"
                  >
                    {t("clearAll")}
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
                    {t("empty")}
                  </p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {items.map((n) => (
                    <li key={n.id}>
                      <Link
                        href={resolveLocaleHref(n.link, basePrefix) || "#"}
                        onClick={onClose}
                        className={cn(
                          "block rounded-xl px-4 py-3 text-sm transition-colors duration-200",
                          "bg-zinc-50 text-zinc-800 hover:bg-sky-50/80",
                          "dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700/80"
                        )}
                      >
                        <div className="text-[13px] leading-snug">
                          {n.key ? translate(n.key, n.variables) : n.message}
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
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(sheetContent, document.body);
}