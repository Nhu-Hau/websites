"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Dropdown from "./NavDropdown";

interface NavItemProps {
  item: { href?: string; label: string; children?: Array<{ href: string; label: string }> };
}

export default function NavItem({ item }: NavItemProps) {
  const hasChildren = !!item.children?.length;
  const pathname = usePathname();
  const isActive = item.href ? pathname === item.href : false;

  const [isMobile, setIsMobile] = useState(false);
  const [open, setOpen] = useState(false);

  // Avoid using window in render
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
            className="relative block whitespace-nowrap text-black dark:text-white transition-all duration-300 group hover:text-amber-600 dark:hover:text-amber-400 transform hover:scale-105"
          >
            <span>{item.label}</span>
            <span
              className={[
                "pointer-events-none absolute -bottom-0.5 left-0 h-0.5 bg-gradient-to-r from-amber-600 to-amber-600",
                "w-0 transition-all duration-300 ease-in-out group-hover:w-full dark:bg-gradient-to-r dark:from-amber-400 dark:to-amber-400",
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
    <li className={`relative ${isMobile ? "flex flex-col py-2" : "group"} h-full`}>
      <div
        className="flex items-center gap-2 cursor-pointer h-full"
        onClick={() => {
          if (isMobile) setOpen((v) => !v);
        }}
      >
        {item.href ? (
          <Link
            href={item.href}
            className="relative block whitespace-nowrap text-black dark:text-white transition-all duration-300 group/parent hover:text-amber-600 dark:hover:text-amber-400 transform hover:scale-105"
            aria-current={isActive ? "page" : undefined}
          >
            <span>{item.label}</span>
            <span
              className={[
                "pointer-events-none absolute left-0 -bottom-0.5 h-0.5 bg-gradient-to-r from-amber-600 to-amber-600",
                "w-0 transition-all duration-300 ease-in-out",
                "group-hover/parent:w-full dark:bg-gradient-to-r dark:from-amber-400 dark:to-amber-400",
                isActive ? "w-full" : "",
              ].join(" ")}
            />
          </Link>
        ) : (
          <span className="relative block whitespace-nowrap text-black dark:text-white py-2">
            <span>{item.label}</span>
            <span
              className="pointer-events-none absolute left-0 -bottom-0.5 h-0.5 w-0 bg-gradient-to-r from-amber-600 to-amber-600 dark:from-amber-400 dark:to-amber-400 transition-all duration-300 ease-in-out group-hover:w-full"
            />
          </span>
        )}

        <svg
          viewBox="0 0 20 20"
          aria-hidden="true"
          fill="currentColor"
          className={`h-4 w-4 text-gray-500 dark:text-gray-300 transition-transform duration-300 ease-in-out ${
            open ? "rotate-180" : ""
          } ${!isMobile ? "group-hover:rotate-180" : ""}`}
        >
          <path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.136l3.71-2.905a.75.75 0 1 1 .92 1.18l-4.2 3.29a.75.75 0 0 1-.92 0l-4.2-3.29a.75.75 0 0 1-.08-1.2z" />
        </svg>
      </div>

      {item.children &&
        (isMobile ? (
          open && (
            <div className="pl-6 py-2">
              <Dropdown items={item.children} mobile />
            </div>
          )
        ) : (
          <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-gray-800 shadow-md rounded-lg animate-fade-in">
            <Dropdown items={item.children} />
          </div>
        ))}
    </li>
  );
}