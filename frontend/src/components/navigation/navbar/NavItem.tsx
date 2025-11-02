"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Dropdown from "./NavDropdown";
import { ChevronDown } from "lucide-react";

interface NavItemProps {
  item: {
    href?: string;
    label: string;
    children?: Array<{ href: string; label: string }>;
  };
}

export default function NavItem({ item }: NavItemProps) {
  const hasChildren = !!item.children?.length;
  const pathname = usePathname();
  const isActive = item.href ? pathname === item.href : false;

  const [isMobile, setIsMobile] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  if (!hasChildren) {
    return (
      <li className="flex h-full items-center">
        {item.href ? (
          <Link
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className="relative inline-block
                       text-zinc-700 dark:text-zinc-300
                       hover:text-amber-600 dark:hover:text-amber-400
                       transition-all duration-300 group"
          >
            <span className="relative z-10">{item.label}</span>
            <span
              className={[
                "absolute -bottom-1 left-0 h-0.5 w-0 rounded-full",
                "bg-gradient-to-r from-amber-600 to-amber-500",
                "transition-all duration-300 ease-out",
                "group-hover:w-full",
                isActive ? "w-full" : "",
              ].join(" ")}
            />
          </Link>
        ) : (
          <span className="text-zinc-700 dark:text-zinc-300">{item.label}</span>
        )}
      </li>
    );
  }

  return (
    <li
      className={`relative h-full flex items-start ${isMobile ? "flex-col" : "group"}`}
      onMouseEnter={() => !isMobile && setOpen(true)}
      onMouseLeave={() => !isMobile && setOpen(false)}
    >
      <div
        className="flex items-center gap-1 xs:gap-1.5 cursor-pointer h-full"
        onClick={() => isMobile && setOpen((v) => !v)}
      >
        {item.href ? (
          <Link
            href={item.href}
            className="relative inline-block text-zinc-700 dark:text-zinc-300
                       transition-all duration-300 group/parent
                       hover:text-amber-600 dark:hover:text-amber-400"
            aria-current={isActive ? "page" : undefined}
          >
            <span className="relative z-10">{item.label}</span>
            <span
              className={[
                "absolute -bottom-1 left-0 h-0.5 w-0 rounded-full",
                "bg-gradient-to-r from-amber-600 to-amber-500",
                "transition-all duration-300 ease-out",
                "group-hover/parent:w-full",
                isActive ? "w-full" : "",
              ].join(" ")}
            />
          </Link>
        ) : (
          <span className="inline-block text-zinc-700 dark:text-zinc-300 py-1 xs:py-2">{item.label}</span>
        )}

        <ChevronDown
          className={`w-4 h-4 text-zinc-500 dark:text-zinc-400
                      transition-transform duration-300 ease-in-out
                      ${open ? "rotate-180" : ""} ${!isMobile ? "group-hover:rotate-180" : ""}`}
        />
      </div>

      {item.children && (
        <>
          {/* Mobile */}
          {isMobile && open && (
            <div className="w-full pl-4 xs:pl-6 py-2 animate-in slide-in-from-top-2 duration-200">
              <Dropdown items={item.children} mobile />
            </div>
          )}

          {/* Desktop */}
          {!isMobile && (
            <div
              className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 w-64
                         opacity-0 invisible translate-y-2
                         group-hover:opacity-100 group-hover:visible group-hover:translate-y-0
                         transition-all duration-300 ease-out"
            >
              <div className="relative">
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-4
                                bg-white dark:bg-zinc-800 rotate-45 shadow-lg ring-1 ring-black/5" />
                <div className="relative pointer-events-auto
                                bg-white/95 dark:bg-zinc-800/95 backdrop-blur-xl
                                shadow-2xl rounded-2xl p-2 ring-1 ring-black/5 dark:ring-white/10">
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