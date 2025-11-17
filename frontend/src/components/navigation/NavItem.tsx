"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import Dropdown from "./NavDropdown";

interface NavChild {
  href: string;
  label: string;
}

interface NavItemType {
  href?: string;
  label: string;
  children?: NavChild[];
}

interface NavItemProps {
  item: NavItemType;
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function NavItem({ item }: NavItemProps) {
  const pathname = usePathname();
  const hasChildren = !!item.children?.length;
  const isActive = item.href ? pathname === item.href : false;

  const [isMobile, setIsMobile] = useState(false);
  const [open, setOpen] = useState(false);

  // Detect mobile by viewport width
  useEffect(() => {
    if (typeof window === "undefined") return;

    const mq = window.matchMedia("(max-width: 1023px)");
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      const matches = ("matches" in e && e.matches) || ("matches" in (e as MediaQueryList) && (e as MediaQueryList).matches);
      setIsMobile(matches);
      // khi đổi breakpoint thì đóng dropdown cho chắc
      setOpen(false);
    };

    handleChange(mq);
    mq.addEventListener("change", handleChange);

    return () => mq.removeEventListener("change", handleChange);
  }, []);

  // 🔹 Item không có children
  if (!hasChildren) {
    return (
      <li className="flex h-full items-center">
        {item.href ? (
          <Link
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "relative inline-flex items-center text-sm font-medium",
              "text-zinc-700 dark:text-zinc-300",
              "transition-colors duration-200 ease-out",
              "hover:text-amber-600 dark:hover:text-amber-400",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950",
              "group/nav"
            )}
          >
            <span className="relative z-10">{item.label}</span>
            <span
              className={cn(
                "pointer-events-none absolute -bottom-1 left-0 h-0.5 w-0 rounded-full",
                "bg-gradient-to-r from-amber-600 to-amber-500",
                "transition-all duration-300 ease-out",
                "group-hover/nav:w-full",
                isActive && "w-full"
              )}
            />
          </Link>
        ) : (
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {item.label}
          </span>
        )}
      </li>
    );
  }

  // 🔹 Item có children (dropdown)
  const handleDesktopOpen = (value: boolean) => {
    if (!isMobile) setOpen(value);
  };

  const handleMobileToggle = () => {
    if (isMobile) setOpen((prev) => !prev);
  };

  const RootTag = isMobile ? "button" : "div";

  return (
    <li
      className={cn(
        "relative flex h-full",
        isMobile ? "flex-col items-start" : "items-center group/nav"
      )}
      onMouseEnter={() => handleDesktopOpen(true)}
      onMouseLeave={() => handleDesktopOpen(false)}
    >
      <RootTag
        type={isMobile ? "button" : undefined}
        onClick={handleMobileToggle}
        className={cn(
          "flex h-full items-center gap-1 xs:gap-1.5",
          "cursor-pointer select-none",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950"
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
              "text-zinc-700 dark:text-zinc-300",
              "transition-colors duration-200 ease-out",
              "hover:text-amber-600 dark:hover:text-amber-400",
              "group/label"
            )}
            onClick={(e) => {
              // Trên mobile: click vào nhãn vẫn mở menu nhưng cũng cho phép chuyển trang
              // Nếu bạn muốn mobile chỉ toggle, không chuyển trang → có thể e.preventDefault()
              if (isMobile) return;
            }}
          >
            <span className="relative z-10">{item.label}</span>
            <span
              className={cn(
                "pointer-events-none absolute -bottom-1 left-0 h-0.5 w-0 rounded-full",
                "bg-gradient-to-r from-amber-600 to-amber-500",
                "transition-all duration-300 ease-out",
                "group-hover/label:w-full group-hover/nav:w-full",
                isActive && "w-full"
              )}
            />
          </Link>
        ) : (
          <span className="inline-flex items-center text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {item.label}
          </span>
        )}

        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-zinc-500 dark:text-zinc-400",
            "transition-transform duration-300 ease-in-out",
            open && "rotate-180",
            !isMobile && "group-hover/nav:rotate-180"
          )}
        />
      </RootTag>

      {/* DROPDOWN */}
      {item.children && (
        <>
          {/* Mobile dropdown */}
          {isMobile && open && (
            <div className="w-full py-2 pl-4 xs:pl-6 animate-in slide-in-from-top-2 duration-200">
              <Dropdown items={item.children} mobile />
            </div>
          )}

          {/* Desktop dropdown */}
          {!isMobile && (
            <div
              className={cn(
                "pointer-events-none absolute left-1/2 top-full z-40 w-64 -translate-x-1/2",
                "opacity-0 invisible translate-y-2",
                "group-hover/nav:visible group-hover/nav:opacity-100 group-hover/nav:translate-y-0",
                "transition-all duration-250 ease-out"
              )}
            >
              <div className="relative">
                {/* Mũi tam giác */}
                <div
                  className={cn(
                    "absolute -top-1 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45",
                    "bg-white dark:bg-zinc-800",
                    "shadow-lg ring-1 ring-black/5 dark:ring-white/10"
                  )}
                />
                <div
                  className={cn(
                    "relative pointer-events-auto rounded-2xl p-2",
                    "bg-white/95 dark:bg-zinc-800/95",
                    "backdrop-blur-xl shadow-2xl",
                    "ring-1 ring-black/5 dark:ring-white/10"
                  )}
                >
                  <Dropdown items={item.children} />
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </li>
  );
}