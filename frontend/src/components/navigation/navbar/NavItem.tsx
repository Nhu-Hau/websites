// components/nav/NavItem.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Dropdown from "./NavDropdown";
import type { NavItemType } from "@/types/navTypes";

interface NavItemProps {
  item: NavItemType;
}

export default function NavItem({ item }: NavItemProps) {
  const hasChildren = !!item.children?.length;
  const pathname = usePathname();
  const isActive = item.href ? pathname === item.href : false;

  const [isMobile, setIsMobile] = useState(false);
  const [open, setOpen] = useState(false);

  // tránh dùng window trong render
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  if (!hasChildren) {
    return (
      <li className="flex">
        {item.href ? (
          <Link
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className="relative block whitespace-nowrap text-black dark:text-white transition-colors group hover:text-sky-600 dark:hover:text-sky-600"
          >
            <span>{item.label}</span>
            <span
              className={[
                "pointer-events-none absolute -bottom-0.5 left-0 h-0.5 bg-sky-600",
                "w-0 transition-all duration-300 ease-out group-hover:w-full dark:bg-sky-600",
                isActive ? "w-full" : "",
              ].join(" ")}
            />
          </Link>
        ) : (
          <span className="relative block whitespace-nowrap text-black dark:text-white">
            {item.label}
          </span>
        )}
      </li>
    );
  }

  return (
    <li className={`relative ${isMobile ? "flex flex-col" : "group"} h-full`}>
      <div
        className="flex items-center gap-1 cursor-pointer h-full"
        onClick={() => {
          if (isMobile) setOpen((v) => !v);
        }}
      >
        {item.href ? (
          <Link
            href={item.href}
            className="relative block whitespace-nowrap px-0 text-black dark:text-white transition-colors group/parent hover:text-sky-600 dark:hover:text-sky-600"
            aria-current={isActive ? "page" : undefined}
          >
            <span>{item.label}</span>
            <span
              className={[
                "pointer-events-none absolute left-0 -bottom-0.5 h-0.5 bg-sky-600 dark:bg-sky-600",
                "w-0 transition-all duration-300 ease-out",
                "group-hover/parent:w-full",
                isActive ? "w-full" : "",
              ].join(" ")}
            />
          </Link>
        ) : (
          <span className="relative block whitespace-nowrap px-0 py-2 text-black dark:text-white">
            <span>{item.label}</span>
            <span className="pointer-events-none absolute left-0 -bottom-0.5 h-0.5 w-0 bg-sky-600 transition-all duration-300 ease-out group-hover:w-full" />
          </span>
        )}

        <svg
          viewBox="0 0 20 20"
          aria-hidden="true"
          fill="currentColor"
          className={`h-5 w-5 text-neutral-500 dark:text-gray-100 transition ${
            open ? "rotate-180" : ""
          } ${
            !isMobile
              ? "group-hover:rotate-180"
              : ""
          }`}
        >
          <path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.136l3.71-2.905a.75.75 0 1 1 .92 1.18l-4.2 3.29a.75.75 0 0 1-.92 0l-4.2-3.29a.75.75 0 0 1-.08-1.2z" />
        </svg>
      </div>

      {item.children &&
        (isMobile ? (
          open && (
            <div className="pl-4">
              <Dropdown items={item.children} mobile />
            </div>
          )
        ) : (
          <Dropdown items={item.children} />
        ))}
    </li>
  );
}
