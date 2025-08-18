"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu } from "lucide-react";
import Image from "next/image";
import DesktopNav from "./DesktopNav";
import MobileNav from "./MobileNav";
import SearchButton from "../search/SearchButton";
import ThemeToggle from "../theme/ThemeToggle";
import LanguageSwitcher from "../languages/LanguageSwitcher";
import useClickOutside from "@/hooks/useClickOutside";
import useEscapeKey from "@/hooks/useEscapeKey";
import UserMenu from "../auth/UserMenu";

export default function Header() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
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
            <Link href="/homePage" className="flex items-center gap-3">
              <Image
                src="/images/logoremove.png"
                alt="Logo"
                width={50}
                height={50}
                className="object-contain rounded-full"
                priority
              />
              <div className="text-xl xl:text-2xl font-semibold text-zinc-900 dark:text-zinc-100 hidden sm:block -tracking-tighter">
                Toeic
                <span className="text-sky-700">Prep</span>
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
              <SearchButton />
              <ThemeToggle />
              <LanguageSwitcher />
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
