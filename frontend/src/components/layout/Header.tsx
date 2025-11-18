"use client";

import Link from "next/link";
import Image from "next/image";

import DesktopNav from "@/components/navigation/DesktopNav";
import MobileTopBar from "@/components/layout/MobileTopBar";
import HeaderActions from "@/components/layout/HeaderActions";
import UserMenu from "@/components/features/auth/UserMenu";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";
import { cn } from "@/lib/utils";

export default function Header() {
  const base = useBasePrefix();

  return (
    <>
      {/* Mobile Top Bar */}
      <MobileTopBar />

      {/* Desktop Header */}
      <header
        className={cn(
          "hidden md:block fixed inset-x-0 top-0 z-50",
          "border-b border-zinc-200/80 dark:border-zinc-800/80",
          "bg-white/85 dark:bg-zinc-950/85",
          "backdrop-blur-xl shadow-sm"
        )}
      >
        <div className="mx-auto w-full max-w-[1500px] px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* LEFT: Logo */}
            <Link
              href={`${base}/home`}
              aria-label="Về trang chủ ToeicPrep"
              className={cn(
                "group flex items-center gap-2.5 rounded-xl",
                "transition-transform duration-300 ease-out",
                "hover:scale-[1.02]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60"
              )}
            >
              {/* Logo image + glow */}
              <div className="relative">
                <Image
                  src="/images/logotoeic.png"
                  alt="Logo ToeicPrep"
                  width={48}
                  height={48}
                  className="size-12 rounded-full object-contain"
                  priority
                />
                <div
                  className={cn(
                    "pointer-events-none absolute inset-0 -z-10 rounded-[18px]",
                    "bg-gradient-to-r from-sky-500/20 via-sky-400/10 to-sky-500/20",
                    "opacity-0 group-hover:opacity-100",
                    "transition-opacity duration-300"
                  )}
                />
              </div>

              {/* Text brand */}
              <div>
                <div
                  className={cn(
                    "font-extrabold tracking-tight leading-none",
                    "text-[1.9rem]",
                    "transition-all duration-300"
                  )}
                >
                  <span className="text-zinc-950 dark:text-zinc-50 tracking-wider">
                    Toeic
                  </span>
                  <span
                    className={cn(
                      "ml-1 bg-gradient-to-r from-sky-600 to-sky-400",
                      "bg-clip-text text-transparent tracking-wider",
                      "dark:from-sky-300 dark:to-sky-100",
                      "group-hover:from-sky-500 group-hover:to-sky-300",
                      "dark:group-hover:from-sky-200 dark:group-hover:to-sky-50"
                    )}
                  >
                    Prep
                  </span>
                </div>
              </div>
            </Link>

            {/* CENTER + RIGHT */}
            <div className="flex h-full items-center gap-20">
              {/* Desktop nav */}
              <div className="flex h-full items-center">
                <DesktopNav />
              </div>

              {/* Actions + User */}
              <div className="flex items-center">
                <HeaderActions />
                <div
                  className="mx-6 h-6 w-px bg-zinc-300/80 dark:bg-zinc-700/80"
                  aria-hidden
                />
                <UserMenu />
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
