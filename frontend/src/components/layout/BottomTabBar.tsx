"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  Users,
} from "lucide-react";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export default function BottomTabBar() {
  const pathname = usePathname();
  const base = useBasePrefix();
  const t = useTranslations("nav");

  const tabs = [
    {
      id: "dashboard",
      label: t("dashboard"),
      icon: LayoutDashboard,
      href: `${base}/mobile/dashboard`,
      match: (path: string) => path.includes("/mobile/dashboard") || (path.includes("/dashboard") && !path.includes("/mobile/")),
    },
    {
      id: "practice",
      label: t("practiceLR.title"),
      icon: BookOpen,
      href: `${base}/mobile/practice`,
      match: (path: string) => path.includes("/mobile/practice") || (path.includes("/practice") && !path.includes("/mobile/") && !path.includes("/history")),
    },
    {
      id: "study",
      label: t("study.title"),
      icon: GraduationCap,
      href: `${base}/mobile/study`,
      match: (path: string) => path.includes("/mobile/study") || (path.includes("/vocabulary") || path.includes("/news") || path.includes("/study/create")) && !path.includes("/mobile/"),
    },
    {
      id: "community",
      label: t("study.study.forum"),
      icon: Users,
      href: `${base}/community`,
      match: (path: string) => path.includes("/community") || path.includes("/study/create") || path.includes("/account"),
    },
  ];

  return (
    <nav
      className={cn(
        "lg:hidden fixed inset-x-0 bottom-0 z-[10000]",
        "border-t border-zinc-200/80 dark:border-zinc-800/80",
        "bg-white/95 dark:bg-zinc-950/95",
        "backdrop-blur-xl shadow-lg"
      )}
    >
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.match(pathname || "");

          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1",
                "flex-1 h-full",
                "transition-colors duration-200",
                isActive
                  ? "text-sky-600 dark:text-sky-400"
                  : "text-zinc-500 dark:text-zinc-400"
              )}
            >
              <div
                className={cn(
                  "relative inline-flex items-center justify-center",
                  "transition-transform duration-200",
                  isActive && "scale-110"
                )}
              >
                <Icon className="h-6 w-6" />
                {isActive && (
                  <span
                    className={cn(
                      "absolute -bottom-1 left-1/2 -translate-x-1/2",
                      "h-1 w-1 rounded-full bg-sky-600 dark:bg-sky-400"
                    )}
                  />
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium leading-tight",
                  isActive && "font-semibold"
                )}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

