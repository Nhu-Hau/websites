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
    {
      label: "Bảng tin",
      href: `${basePrefix}/community`,
      icon: Home,
    },
    {
      label: "Đang theo dõi",
      href: `${basePrefix}/community/following`,
      icon: UserPlus,
    },
    {
      label: "Xu hướng",
      href: `${basePrefix}/community/trending`,
      icon: TrendingUp,
    },
    {
      label: "Đã lưu",
      href: `${basePrefix}/community/saved`,
      icon: Bookmark,
    },
    {
      label: "Hồ sơ cá nhân",
      href: user?.id ? `${basePrefix}/community/profile/${user.id}` : `${basePrefix}/community`,
      icon: User,
    },
    {
      label: "Nhóm học",
      href: `${basePrefix}/community/groups`,
      icon: Users,
    },
    {
      label: "Phòng học",
      href: `${basePrefix}/study/create`,
      icon: GraduationCap,
    },
    {
      label: "Khám phá",
      href: `${basePrefix}/community/explore`,
      icon: Search,
    },
    {
      label: "Cài đặt",
      href: `${basePrefix}/account`,
      icon: Settings,
    },
  ];

  const isActive = (href: string) => {
    if (href === `${basePrefix}/community`) {
      return pathname === `${basePrefix}/community` || pathname === `${basePrefix}/community/`;
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Side Navigation - Desktop only */}
      <aside
        className={cn(
          "hidden lg:block fixed left-0 top-16 h-[calc(100vh-4rem)] z-40",
          "bg-white dark:bg-zinc-950",
          "border-r border-zinc-200 dark:border-zinc-800",
          "w-64"
        )}
      >
        <div className="flex flex-col h-full w-full pt-6">
          {/* Navigation Items */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {/* Community Quick Actions */}
            <div className="mb-4">
              <Link
                href={`${basePrefix}/community/new`}
                className={cn(
                  "flex items-center justify-center gap-2 px-4 py-3 rounded-xl",
                  "text-sm font-medium text-white bg-blue-600 dark:bg-blue-500",
                  "hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors",
                  "shadow-sm hover:shadow"
                )}
              >
                <Plus className="h-4 w-4" />
                <span>Đăng bài mới</span>
              </Link>
            </div>

            {/* Main Navigation */}
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl",
                    "text-sm font-medium transition-colors",
                    "hover:bg-zinc-100 dark:hover:bg-zinc-800",
                    active
                      ? "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400"
                      : "text-zinc-700 dark:text-zinc-300"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5",
                      active
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-zinc-500 dark:text-zinc-400"
                    )}
                  />
                  <span>{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <span className="ml-auto px-2 py-0.5 text-xs font-semibold rounded-full bg-red-500 text-white">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

        </div>
      </aside>

      {/* Desktop Spacer */}
      <div className="hidden lg:block w-64 flex-shrink-0" />
    </>
  );
}

