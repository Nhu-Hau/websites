"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu } from "lucide-react";
import Image from "next/image";
import DesktopNav from "./DesktopNav";
import MobileNav from "./MobileNav";
import HeaderActions from "@/components/common/HeaderActions";
import useClickOutside from "@/hooks/useClickOutside";
import useEscapeKey from "@/hooks/useEscapeKey";
import UserMenu from "../auth/UserMenu";
import { useTheme } from "@/context/ThemeContext";

export default function Header() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";
  const close = useCallback(() => {
    setOpen(false);
    buttonRef.current?.focus(); // trả focus về nút
  }, []);

  // chỉ bật khi open
  useClickOutside(menuRef, () => close(), {
    enabled: open,
    ignore: [buttonRef],
  });
  useEscapeKey(open ? () => close() : undefined);

  // khóa cuộn khi mở
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

  // đóng khi lên desktop
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = () => mq.matches && close();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [close]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-white/90 dark:bg-zinc-900/90 backdrop-blur border-b border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left: Hamburger + Logo */}
          <div className="flex items-center gap-3">
            <div className="lg:hidden">
              <button
                ref={buttonRef}
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-label={open ? "Close menu" : "Open menu"}
                aria-expanded={open}
                className="inline-flex items-center justify-center rounded p-2 text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800 transition"
              >
                <Menu
                  className={`transition-transform ${open ? "rotate-90" : ""}`}
                  aria-hidden
                />
              </button>
            </div>
            <Link href="/homePage" className="flex items-center gap-1">
              <Image
                src={isDarkMode ? "/images/logodark.png" : "/images/logo.png"}
                alt="Logo"
                width={60}
                height={60}
                className="object-contain rounded-full"
                priority
              />
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold font-[Playfair Display] bg-gradient-to-r from-amber-600 to-yellow-500 dark:from-amber-300 dark:to-yellow-200 text-transparent bg-clip-text tracking-wider animate-slide-in [text-shadow:_0_2px_4px_rgba(0,0,0,0.15)] dark:[text-shadow:_0_2px_4px_rgba(0,0,0,0.4)] hover:from-amber-700 hover:to-yellow-600 dark:hover:from-amber-400 dark:hover:to-yellow-300 transition-colors duration-300">
                Toeic
                <span className="bg-gradient-to-r from-sky-600 to-sky-600 dark:from-sky-300 dark:to-sky-300 bg-clip-text text-transparent hover:from-sky-700 hover:to-sky-700 dark:hover:from-sky-200 dark:hover:to-sky-200 transition-colors duration-300">
                  Prep
                </span>
              </div>
            </Link>
          </div>

          {/* Center: Desktop nav */}
          <div className="flex items-center gap-24 h-full">
            <div className="hidden lg:flex h-full items-center">
              <DesktopNav />
            </div>
            {/* Right: actions */}
            <div className="flex items-center">
              <HeaderActions />
              <div
                className="mx-6 h-6 w-0.5 bg-black dark:bg-zinc-700"
                aria-hidden
              />
              <UserMenu />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      {open && <MobileNav open={open} setOpen={setOpen} menuRef={menuRef} />}
    </header>
  );
}
