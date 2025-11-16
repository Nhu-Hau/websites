"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu } from "lucide-react";
import Image from "next/image";

import DesktopNav from "@/components/navigation/DesktopNav";
import MobileNav from "@/components/navigation/MobileNav";
import HeaderActions from "@/components/layout/HeaderActions";
import useClickOutside from "@/hooks/common/useClickOutside";
import useEscapeKey from "@/hooks/common/useEscapeKey";
import UserMenu from "@/components/features/auth/UserMenu";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";
import { cn } from "@/lib/utils";

export default function Header() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const base = useBasePrefix();

  const close = useCallback(() => {
    setOpen(false);
    buttonRef.current?.focus();
  }, []);

  useClickOutside(menuRef, () => close(), {
    enabled: open,
    ignore: [buttonRef],
  });

  useEscapeKey(open ? () => close() : undefined);

  // Khóa cuộn body khi mở menu mobile
  useEffect(() => {
    if (!open) return;
    const { style } = document.body;
    const prev = style.overflow;
    style.overflow = "hidden";
    return () => {
      style.overflow = prev;
    };
  }, [open]);

  // Đóng khi đổi route
  useEffect(() => {
    close();
  }, [pathname, close]);

  // Auto đóng khi lên desktop
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = () => mq.matches && close();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [close]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50",
        "border-b border-zinc-200/80 dark:border-zinc-800/80",
        "bg-white/85 dark:bg-zinc-950/85",
        "backdrop-blur-xl shadow-sm"
      )}
    >
      <div className="mx-auto w-full max-w-[1500px] px-3 xs:px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 xs:h-16 items-center justify-between">
          {/* LEFT: Hamburger + Logo */}
          <div className="flex items-center gap-2 xs:gap-3">
            {/* Hamburger (mobile) */}
            <div className="lg:hidden">
              <button
                ref={buttonRef}
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-label={open ? "Đóng menu" : "Mở menu"}
                aria-expanded={open}
                className={cn(
                  "inline-flex items-center justify-center",
                  "size-9 xs:size-10 rounded-xl",
                  "text-zinc-700 dark:text-zinc-100",
                  "hover:bg-zinc-100/80 dark:hover:bg-zinc-800/70",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60",
                  "transition-colors duration-200"
                )}
              >
                <Menu
                  className={cn(
                    "h-5 w-5 xs:h-6 xs:w-6",
                    "transition-transform duration-200",
                    open ? "rotate-90" : ""
                  )}
                  aria-hidden
                />
              </button>
            </div>

            {/* Logo */}
            <Link
              href={`${base}/home`}
              aria-label="Về trang chủ ToeicPrep"
              className={cn(
                "group flex items-center gap-1.5 xs:gap-2.5 rounded-xl",
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
                  className="size-10 xs:size-12 rounded-full object-contain"
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
              <div className="hidden sm:block">
                <div
                  className={cn(
                    "font-extrabold tracking-tight leading-none",
                    "sm:text-2xl md:text-[1.7rem] lg:text-[1.9rem]",
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
          </div>

          {/* CENTER + RIGHT */}
          <div className="flex h-full items-center gap-3 xs:gap-4 lg:gap-20">
            {/* Desktop nav */}
            <div className="hidden lg:flex h-full items-center">
              <DesktopNav />
            </div>

            {/* Actions + User */}
            <div className="flex items-center">
              <HeaderActions />
              <div
                className="mx-3 xs:mx-4 lg:mx-6 h-5 xs:h-6 w-px bg-zinc-300/80 dark:bg-zinc-700/80"
                aria-hidden
              />
              <UserMenu />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      <MobileNav open={open} setOpen={setOpen} menuRef={menuRef} />
    </header>
  );
}