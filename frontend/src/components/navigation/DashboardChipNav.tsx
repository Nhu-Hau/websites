"use client";

import React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { TrendingUp, BarChart3, Calendar } from "lucide-react";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";
import HorizontalChipNav, { ChipItem } from "./HorizontalChipNav";

type TabId = "progress" | "results" | "activity";

export default function DashboardChipNav() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const basePrefix = useBasePrefix();
  const activeTab = (searchParams.get("tab") as TabId) || "progress";

  const items: ChipItem[] = [
    {
      id: "progress",
      label: "Tiến độ",
      icon: TrendingUp,
    },
    {
      id: "results",
      label: "Kết quả",
      icon: BarChart3,
    },
    {
      id: "activity",
      label: "Hoạt động",
      icon: Calendar,
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

