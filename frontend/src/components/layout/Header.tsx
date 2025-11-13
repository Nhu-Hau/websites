"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu } from "lucide-react";
import Image from "next/image";
import DesktopNav from "@/components/navigation/DesktopNav";
import MobileNav from "@/components/navigation/MobileNav";
import HeaderActions from "@/components/common/HeaderActions";
import useClickOutside from "@/hooks/common/useClickOutside";
import useEscapeKey from "@/hooks/common/useEscapeKey";
import UserMenu from "@/components/features/auth/UserMenu";
import { useTheme } from "@/context/ThemeContext";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";

export default function Header() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";
  const base = useBasePrefix(); // ✅ luôn áp dụng base prefix

  const close = useCallback(() => {
    setOpen(false);
    buttonRef.current?.focus();
  }, []);

  useClickOutside(menuRef, () => close(), {
    enabled: open,
    ignore: [buttonRef],
  });
  useEscapeKey(open ? () => close() : undefined);

  // khóa cuộn body khi mở menu
  useEffect(() => {
    if (!open) return;
    const { style } = document.body;
    const prev = style.overflow;
    style.overflow = "hidden";
    return () => {
      style.overflow = prev;
    };
  }, [open]);

  // đóng khi đổi route
  useEffect(() => {
    close();
  }, [pathname, close]);

  // auto đóng khi lên desktop
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = () => mq.matches && close();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [close]);

  function cn(...inputs: Array<string | false | null | undefined>) {
    return inputs.filter(Boolean).join(" ");
  }
  return (
    <header
      className="fixed inset-x-0 top-0 z-50
                 bg-white/90 dark:bg-zinc-900/90 backdrop-blur
                 border-b border-zinc-200 dark:border-zinc-800"
    >
      {/* container + padding theo breakpoint, có xs */}
      <div className="mx-auto w-full max-w-[1500px] px-3 xs:px-4 sm:px-6 lg:px-8">
        {/* chiều cao header co giãn theo breakpoint */}
        <div className="flex h-14 xs:h-16 items-center justify-between">
          {/* Left: Hamburger + Logo */}
          <div className="flex items-center gap-2 xs:gap-3">
            {/* Hamburger chỉ hiện < lg */}
            <div className="lg:hidden">
              <button
                ref={buttonRef}
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-label={open ? "Đóng menu" : "Mở menu"}
                aria-expanded={open}
                className="inline-flex size-9 xs:size-10 items-center justify-center rounded-lg
               text-zinc-700 dark:text-zinc-200
               hover:bg-zinc-100 dark:hover:bg-zinc-800
                 transition"
              >
                <Menu
                  className={`h-5 w-5 xs:h-6 xs:w-6 transition-transform ${
                    open ? "rotate-90" : ""
                  }`}
                  aria-hidden
                />
              </button>
            </div>

            {/* Logo */}
              <Link
              href={`${base}/home`}
              className="group flex items-center gap-1.5 xs:gap-2.5 transition-all duration-300 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50 rounded-xl"
              aria-label="Về trang chủ ToeicPrep"
            >
              {/* Logo Image */}
              <div className="relative">
                <Image
                  src={isDarkMode ? "/images/logodark.png" : "/images/logo.png"}
                  alt="Logo"
                  width={48}
                  height={48}
                  className="rounded-full object-contain size-10 xs:size-12"
                  priority
                />
                {/* Pulse ring khi hover */}
                <div className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-sky-500/20 to-sky-500/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </div>

              {/* Text: Toeic Prep */}
              <div className="hidden xs:block">
                <div
                  className={cn(
                    "font-extrabold tracking-tight leading-none",
                    "bg-gradient-to-r bg-clip-text text-transparent",
                    "transition-all duration-500 ease-out",
                    "bg-[length:200%_auto] animate-gradient-x",
                    isDarkMode
                      ? "from-amber-300 via-yellow-200 to-amber-300"
                      : "from-amber-600 via-yellow-500 to-amber-600",
                    "group-hover:from-amber-700 group-hover:via-yellow-600 group-hover:to-amber-700",
                    "dark:group-hover:from-amber-400 dark:group-hover:via-yellow-300 dark:group-hover:to-amber-400",
                    "text-xl sm:text-2xl md:text-3xl lg:text-4xl",
                    "[text-shadow:_0_2px_8px_rgba(0,0,0,0.2)] dark:[text-shadow:_0_2px_8px_rgba(0,0,0,0.5)]"
                  )}
                >
                  Toeic
                  <span
                    className={cn(
                      "bg-gradient-to-r bg-clip-text text-transparent",
                      "transition-all duration-500 ease-out",
                      isDarkMode
                        ? "from-sky-300 to-sky-200"
                        : "from-sky-600 to-sky-500",
                      "group-hover:from-sky-700 group-hover:to-sky-600",
                      "dark:group-hover:from-sky-200 dark:group-hover:to-sky-100"
                    )}
                  >
                    {" "}
                    Prep
                  </span>
                </div>
              </div>
            </Link>
          </div>

          {/* Center + Right: nav + actions (desktop), actions co lại hợp lý mobile */}
          <div className="flex items-center h-full gap-3 xs:gap-4 lg:gap-24">
            {/* Desktop nav */}
            <div className="hidden lg:flex h-full items-center">
              <DesktopNav />
            </div>

            {/* Actions + User */}
            <div className="flex items-center">
              {/* trên mobile, giảm spacing tổng thể */}
              <HeaderActions />
              <div
                className="mx-3 xs:mx-4 lg:mx-6 h-5 xs:h-6 w-px bg-zinc-300 dark:bg-zinc-700"
                aria-hidden
              />
              <UserMenu />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile nav (trượt mở/đóng, có padding xs) */}
      <MobileNav open={open} setOpen={setOpen} menuRef={menuRef} />
    </header>
  );
}
