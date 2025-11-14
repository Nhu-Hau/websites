"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}

export default function NavLink({ href, children, className }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "relative inline-block text-zinc-700 dark:text-zinc-300 transition-all duration-300 group",
        "hover:text-amber-600 dark:hover:text-amber-400 hover:scale-105",
        isActive && "text-amber-600 dark:text-amber-400",
        className
      )}
    >
      <span className="relative z-10">{children}</span>
      <span
        className={cn(
          "absolute -bottom-1 left-0 h-0.5 w-0 bg-gradient-to-r from-amber-600 to-amber-500 rounded-full transition-all duration-300 ease-out",
          "group-hover:w-full",
          isActive && "w-full"
        )}
      />
    </Link>
  );
}