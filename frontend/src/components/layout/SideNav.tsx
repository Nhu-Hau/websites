"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Home,
  TrendingUp,
  Bookmark,
  User,
  Users,
  GraduationCap,
  Search,
  Settings,
  Plus,
  UserPlus,
} from "lucide-react";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export default function SideNav() {
  const pathname = usePathname();
  const basePrefix = useBasePrefix();
  const { user } = useAuth();

  const navItems: NavItem[] = [
    { label: "Bảng tin", href: `${basePrefix}/community`, icon: Home },
    { label: "Đang theo dõi", href: `${basePrefix}/community/following`, icon: UserPlus },
    { label: "Xu hướng", href: `${basePrefix}/community/trending`, icon: TrendingUp },
    { label: "Đã lưu", href: `${basePrefix}/community/saved`, icon: Bookmark },
    {
      label: "Hồ sơ cá nhân",
      href: user?.id ? `${basePrefix}/community/profile/${user.id}` : `${basePrefix}/account`,
      icon: User,
    },
    { label: "Nhóm học", href: `${basePrefix}/community/groups`, icon: Users },
    { label: "Phòng học", href: `${basePrefix}/study/create`, icon: GraduationCap },
    { label: "Khám phá", href: `${basePrefix}/community/explore`, icon: Search },
    { label: "Cài đặt", href: `${basePrefix}/account`, icon: Settings },
  ];

  const isActive = (href: string) => {
    // Normalize pathname and href for comparison (remove trailing slashes)
    const normalizedPathname = pathname?.replace(/\/$/, "") || "";
    const normalizedHref = href.replace(/\/$/, "");
    
    // Exact match for community home page - only match /community exactly, not sub-routes
    if (normalizedHref === `${basePrefix}/community`) {
      return normalizedPathname === `${basePrefix}/community`;
    }
    
    // For profile routes, check if pathname starts with the profile href
    if (normalizedHref.includes("/community/profile")) {
      return normalizedPathname.startsWith(normalizedHref);
    }
    
    // For other routes, check exact match first, then startsWith
    if (normalizedPathname === normalizedHref) {
      return true;
    }
    
    // Check if pathname starts with href followed by / (to avoid partial matches)
    return normalizedPathname.startsWith(normalizedHref + "/");
  };

  return (
    <>
      <aside
        className={cn(
          "hidden lg:block fixed left-0 top-16 h-[calc(100vh-4rem)] z-40 w-72",
          "bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm",
          "border-r border-zinc-200/80 dark:border-zinc-800/80 shadow-sm"
        )}
      >
        <div className="flex flex-col h-full w-full pt-6">
          {/* Quick Action */}
          <div className="px-4 mb-4">
            <Link
              href={`${basePrefix}/community/new`}
              className={cn(
                "flex items-center justify-center gap-2 px-4 py-3 rounded-xl",
                "text-sm font-semibold text-white",
                "from-blue-500 to-sky-600 hover:to-sky-600 bg-gradient-to-r hover:from-blue-600",
                "dark:from-blue-500 dark:to-sky-600 dark:hover:from-blue-600 dark:hover:to-sky-700",
                "shadow-sm hover:shadow transition-all bg-gradient-to-r"
              )}
            >
              <Plus className="h-4 w-4" />
              <span>Đăng bài mới</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={`${item.label}-${index}`}
                  href={item.href}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-2xl px-4 py-2",
                    "transition-all duration-200 text-sm font-medium",
                    active
                      ? "bg-sky-50 text-sky-800 shadow-sm ring-1 ring-sky-200 dark:bg-sky-900/20 dark:text-sky-100 dark:ring-sky-700"
                      : "text-zinc-700 hover:bg-zinc-100 hover:text-sky-700 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-sky-300"
                  )}
                >
                  {/* Indicator bar */}
                  <span
                    className={cn(
                      "absolute inset-y-2 left-1 w-1 rounded-full bg-sky-500/80 transition-opacity",
                      active ? "opacity-100" : "opacity-0 group-hover:opacity-60"
                    )}
                  />

                  {/* Gradient overlay */}
                  <span
                    className={cn(
                      "pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-r from-sky-100/50 to-transparent opacity-0 transition-opacity duration-200",
                      active
                        ? "opacity-100"
                        : "group-hover:opacity-60 dark:from-sky-500/10"
                    )}
                  />

                  {/* Icon box */}
                  <div
                    className={cn(
                      "relative flex h-9 w-9 items-center justify-center rounded-xl border text-[13px] font-semibold transition-all",
                      active
                        ? "bg-sky-500 border-sky-300 text-white shadow-sm dark:border-sky-600 dark:bg-sky-500"
                        : "bg-white border-zinc-200 text-slate-600 shadow-sm group-hover:border-sky-300 group-hover:text-sky-600 dark:bg-zinc-900 dark:border-zinc-700 dark:text-slate-200 dark:group-hover:border-sky-600 dark:group-hover:text-sky-300"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>

                  {/* Label */}
                  <span className="relative text-left">{item.label}</span>

                  {/* Badge */}
                  {item.badge && item.badge > 0 && (
                    <span className="ml-auto px-2 py-0.5 text-[11px] font-semibold rounded-full bg-red-500 text-white">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Spacer */}
      <div className="hidden lg:block w-72 flex-shrink-0" />
    </>
  );
}