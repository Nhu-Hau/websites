"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { TrendingUp, BarChart3, Calendar, Trophy } from "lucide-react";
import { Suspense } from "react";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";
import { useTranslations } from "next-intl";

type TabId = "progress" | "results" | "activity" | "badges";

interface NavItem {
  id: TabId;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  {
    id: "results",
    labelKey: "results",
    icon: BarChart3,
  },
  {
    id: "progress",
    labelKey: "progress",
    icon: TrendingUp,
  },
  {
    id: "activity",
    labelKey: "activity",
    icon: Calendar,
  },
  {
    id: "badges",
    labelKey: "badges",
    icon: Trophy,
  },
];

function DashboardSideNavInner() {
  const t = useTranslations("dashboardComponents.sideNav.tabs");
  const searchParams = useSearchParams();
  const router = useRouter();
  const basePrefix = useBasePrefix();
  const activeTab = (searchParams.get("tab") as TabId) || "results";

  const handleTabChange = (tabId: TabId) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tabId);
    router.push(`${basePrefix}/dashboard?${params.toString()}`);
  };

  return (
    <>
      {/* Side Navigation - Desktop only */}
      <aside
        className="sticky top-16 h-[calc(100vh-4rem)] w-72 border-r border-zinc-200/80 bg-white/95 shadow-sm backdrop-blur-sm dark:border-zinc-800/80 dark:bg-zinc-900/95"
      >
        <nav className="h-full overflow-y-auto space-y-2 px-4 py-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`
                  group relative flex w-full items-center gap-3 rounded-2xl px-4 py-2 text-sm font-medium
                  transition-all duration-200
                  ${
                    isActive
                      ? "bg-sky-50 text-sky-800 shadow-sm ring-1 ring-sky-200 dark:bg-sky-900/15 dark:text-sky-100 dark:ring-sky-700/80"
                      : "text-zinc-700 hover:bg-zinc-50 hover:text-sky-700 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-sky-300"
                  }
                `}
              >
                {/* Left indicator bar */}
                <span
                  className={`
                    absolute inset-y-2 left-1 w-1 rounded-full bg-sky-500/80 transition-opacity duration-200
                    ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-60"}
                  `}
                />

                {/* Subtle gradient highlight */}
                <span
                  className={`
                    pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-r from-sky-100/60 to-transparent
                    opacity-0 transition-opacity duration-200
                    ${isActive ? "opacity-100" : "group-hover:opacity-70 dark:from-sky-500/10"}
                  `}
                />

                <div className="relative flex items-center gap-3">
                  <div
                    className={`
                      flex h-9 w-9 items-center justify-center rounded-xl border text-[13px] font-semibold
                      transition-all duration-200
                      ${
                        isActive
                          ? "border-sky-300 bg-sky-500 text-white shadow-sm dark:border-sky-600 dark:bg-sky-500"
                          : "border-zinc-200 bg-white text-zinc-500 shadow-sm group-hover:border-sky-300 group-hover:text-sky-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:group-hover:border-sky-600 dark:group-hover:text-sky-300"
                      }
                    `}
                  >
                    <Icon
                      className={`
                        h-4 w-4
                        ${
                          isActive
                            ? "text-white"
                            : "text-inherit"
                        }
                      `}
                    />
                  </div>

                  <div className="flex flex-col items-start">
                    <span className="relative text-left text-sm font-semibold">
                      {t(item.labelKey)}
                    </span>
                    {/* <span className="relative mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                      {item.id === "progress" &&
                        "Xem trend luyện tập theo từng Part."}
                      {item.id === "results" &&
                        "Theo dõi điểm Placement & Progress Test."}
                      {item.id === "activity" &&
                        "Quan sát heatmap hoạt động & lịch học."}
                    </span> */}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

export default function DashboardSideNav() {
  return (
    <Suspense fallback={null}>
      <DashboardSideNavInner />
    </Suspense>
  );
}