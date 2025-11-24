"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import AdminNavDropdown from "./AdminNavDropdown";
import type { AdminNavItem as AdminNavItemType } from "@/lib/navigation/adminNav";

interface Props {
  item: AdminNavItemType;
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function AdminNavItem({ item }: Props) {
  const pathname = usePathname();
  const hasChildren = !!item.children?.length;
  const isActive = item.href ? pathname === item.href : false;

  const [isMobile, setIsMobile] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 1023px)");
    const handle = (ev: MediaQueryList | MediaQueryListEvent) => {
      const matches = "matches" in ev ? ev.matches : mq.matches;
      setIsMobile(matches);
      setOpen(false);
    };
    handle(mq);
    mq.addEventListener("change", handle);
    return () => mq.removeEventListener("change", handle);
  }, []);

  if (!hasChildren) {
    return (
      <li className="flex h-full items-center">
        {item.href ? (
          <Link
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "relative inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200",
              isActive
                ? "text-white bg-white/10"
                : "text-zinc-400 hover:text-white hover:bg-white/5",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
            )}
          >
            {item.label}
          </Link>
        ) : (
          <span className="px-3 py-1.5 text-sm font-medium text-zinc-400">{item.label}</span>
        )}
      </li>
    );
  }

  const handleDesktopOpen = (value: boolean) => {
    if (!isMobile) setOpen(value);
  };

  const handleMobileToggle = () => {
    setOpen((prev) => !prev);
  };

  const RootTag = (isMobile ? "button" : "div") as "button" | "div";

  return (
    <li
      className={cn("relative flex h-full", isMobile ? "flex-col items-start" : "items-center group/nav")}
      onMouseEnter={() => handleDesktopOpen(true)}
      onMouseLeave={() => handleDesktopOpen(false)}
    >
      <RootTag
        type={isMobile ? "button" : undefined}
        onClick={handleMobileToggle}
        className={cn(
          "flex h-full items-center gap-1 cursor-pointer select-none text-sm font-medium px-3 py-1.5 rounded-full transition-all duration-200",
          open || isActive ? "text-white bg-white/10" : "text-zinc-400 hover:text-white hover:bg-white/5",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
        )}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {item.href ? (
          <Link
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "relative inline-flex items-center text-sm font-medium",
              "transition-colors duration-200"
            )}
            onClick={(e) => {
              if (isMobile) {
                e.preventDefault();
                setOpen((prev) => !prev);
              }
            }}
          >
            {item.label}
          </Link>
        ) : (
          <span className="inline-flex items-center text-sm font-medium">{item.label}</span>
        )}

        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 transition-transform duration-300",
            open ? "text-white rotate-180" : "text-zinc-500 group-hover/nav:text-white",
            !isMobile && open && "rotate-180"
          )}
        />
      </RootTag>

      {item.children && (
        <>
          {isMobile && open && (
            <div className="w-full py-2 pl-4 animate-in slide-in-from-top-2 duration-200">
              <AdminNavDropdown items={item.children} mobile />
            </div>
          )}
          {!isMobile && (
            <div
              className={cn(
                "absolute left-1/2 top-full z-40 w-64 -translate-x-1/2 translate-y-2 transition-all duration-250",
                open
                  ? "visible opacity-100 translate-y-0 pointer-events-auto"
                  : "invisible opacity-0 pointer-events-none"
              )}
            >
              <div className="relative">
                <div className="absolute -top-1 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 bg-black shadow-lg ring-1 ring-white/10" />
                <div className="relative pointer-events-auto rounded-2xl p-2 bg-black shadow-2xl ring-1 ring-white/10">
                  <AdminNavDropdown items={item.children} />
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </li>
  );
}

