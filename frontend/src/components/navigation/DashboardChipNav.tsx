"use client";

import React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { TrendingUp, BarChart3, Calendar, Trophy } from "lucide-react";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";
import { useTranslations } from "next-intl";
import HorizontalChipNav, { ChipItem } from "./HorizontalChipNav";

type TabId = "progress" | "results" | "activity" | "badges";

export default function DashboardChipNav() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const basePrefix = useBasePrefix();
  const t = useTranslations("dashboardComponents.sideNav.tabs");
  const activeTab = (searchParams.get("tab") as TabId) || "progress";

  const items: ChipItem[] = [
    {
      id: "progress",
      label: t("progress"),
      icon: TrendingUp,
    },
    {
      id: "results",
      label: t("results"),
      icon: BarChart3,
    },
    {
      id: "activity",
      label: t("activity"),
      icon: Calendar,
    },
    {
      id: "badges",
      label: t("badges"),
      icon: Trophy,
    },
  ];

  const handleItemClick = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", id);
    router.push(`${basePrefix}/dashboard?${params.toString()}`);
  };

  return (
    <HorizontalChipNav
      items={items}
      activeId={activeTab}
      onItemClick={handleItemClick}
    />
  );
}

