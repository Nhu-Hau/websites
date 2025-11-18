"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Bell } from "lucide-react";
import { useNotifications } from "@/hooks/common/useNotifications";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";
import { cn } from "@/lib/utils";
import UserMenu from "@/components/features/auth/UserMenu";
import MobileNotificationSheet from "@/components/layout/MobileNotificationSheet";

export default function MobileTopBar() {
  const base = useBasePrefix();
  const { unread } = useNotifications();
  const [notificationOpen, setNotificationOpen] = useState(false);

  return (
    <header
      className={cn(
        "md:hidden fixed inset-x-0 top-0 z-50",
        "border-b border-zinc-200/80 dark:border-zinc-800/80",
        "bg-white/95 dark:bg-zinc-950/95",
        "backdrop-blur-xl shadow-sm"
      )}
    >
      <div className="mx-auto w-full px-3 sm:px-4">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <Link
            href={`${base}/home`}
            aria-label="Về trang chủ ToeicPrep"
            className="flex items-center gap-2"
          >
            <Image
              src="/images/logotoeic.png"
              alt="Logo ToeicPrep"
              width={32}
              height={32}
              className="size-8 rounded-full object-contain"
              priority
            />
          </Link>

          {/* Right: Notification + Avatar */}
          <div className="flex items-center gap-2">
            {/* Notification Button */}
            <button
              type="button"
              aria-label="Thông báo"
              onClick={() => setNotificationOpen(true)}
              className={cn(
                "relative inline-flex h-9 w-9 items-center justify-center rounded-full",
                "text-zinc-700 dark:text-zinc-200",
                "hover:bg-zinc-100/80 dark:hover:bg-zinc-800/70",
                "transition-colors duration-200"
              )}
            >
              <Bell className="h-5 w-5" />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white shadow-md">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </button>

            {/* User Avatar */}
            <UserMenu />
          </div>
        </div>
      </div>

      {/* Notification Sheet */}
      <MobileNotificationSheet
        open={notificationOpen}
        onClose={() => setNotificationOpen(false)}
      />
    </header>
  );
}

