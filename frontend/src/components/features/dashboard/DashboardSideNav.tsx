"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { TrendingUp, BarChart3, Calendar, Menu, X } from "lucide-react";
import { useState, useEffect, Suspense } from "react";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";

type TabId = "progress" | "results" | "activity";

interface NavItem {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  {
    id: "progress",
    label: "Tiến độ luyện tập",
    icon: TrendingUp,
  },
  {
    id: "results",
    label: "Kết quả kiểm tra",
    icon: BarChart3,
  },
  {
    id: "activity",
    label: "Hoạt động & lịch học",
    icon: Calendar,
  },
];

function DashboardSideNavInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const basePrefix = useBasePrefix();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const activeTab = (searchParams.get("tab") as TabId) || "progress";

  const handleTabChange = (tabId: TabId) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tabId);
    router.push(`${basePrefix}/dashboard?${params.toString()}`);
    setIsMobileOpen(false);
  };

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMobileOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileOpen]);

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-16 left-0 right-0 z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
            Dashboard
          </h2>
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Side Navigation */}
      <aside
        className={`
          fixed lg:sticky top-16 lg:top-16 h-[calc(100vh-4rem)] lg:h-[calc(100vh-4rem)]
          w-72 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800
          z-40 transform transition-transform duration-300 ease-out
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          shadow-lg lg:shadow-none
        `}
      >
        <nav className="h-full overflow-y-auto px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl
                  text-sm font-medium transition-all duration-200
                  ${
                    isActive
                      ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 shadow-sm ring-1 ring-amber-200 dark:ring-amber-800"
                      : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-amber-700 dark:hover:text-amber-300"
                  }
                `}
              >
                <Icon
                  className={`h-5 w-5 shrink-0 ${
                    isActive
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-zinc-500 dark:text-zinc-400"
                  }`}
                />
                <span className="text-left">{item.label}</span>
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

