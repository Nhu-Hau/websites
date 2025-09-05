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
        "relative block text-black dark:text-white transition-colors group",
        isActive && "text-tealCustom",
        className
      )}
    >
      <span>{children}</span>
      {/* after: tạo border-bottom và animate khi hover */}
      <span
        className={cn(
          "pointer-events-none absolute bottom-0 left-0 h-0.5 bg-tealCustom",
          "w-0 transition-all duration-300 ease-out",
          "group-hover:w-full",
          isActive && "w-full" // giữ gạch chân nếu đang active
        )}
      />
    </Link>
  );
}
