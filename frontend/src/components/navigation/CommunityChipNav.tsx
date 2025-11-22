"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import {
  Home,
  UserPlus,
  TrendingUp,
  Bookmark,
  User,
  Users,
  GraduationCap,
  Search,
  Settings,
  Plus,
} from "lucide-react";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";
import { useAuth } from "@/context/AuthContext";
import HorizontalChipNav, { ChipItem } from "./HorizontalChipNav";

export default function CommunityChipNav() {
  const pathname = usePathname();
  const router = useRouter();
  const basePrefix = useBasePrefix();
  const { user } = useAuth();

  const getActiveId = (): string => {
    // Normalize pathname for comparison
    const normalizedPathname = pathname?.replace(/\/$/, "") || "";
    const normalizedBasePrefix = basePrefix.replace(/\/$/, "");
    
    // Check exact matches first (more specific routes)
    // CRITICAL: Must check /community/new BEFORE /community to avoid false matches
    const isNewPost = normalizedPathname === `${normalizedBasePrefix}/community/new` || 
                      normalizedPathname.endsWith("/community/new") ||
                      normalizedPathname.includes("/community/new/");
    if (isNewPost) {
      return "new-post";
    }
    
    // Check other specific routes
    if (normalizedPathname.includes("/community/profile")) return "profile";
    if (normalizedPathname.includes("/community/following")) return "following";
    if (normalizedPathname.includes("/community/trending")) return "trending";
    if (normalizedPathname.includes("/community/saved")) return "saved";
    if (normalizedPathname.includes("/community/groups")) return "groups";
    if (normalizedPathname.includes("/community/explore")) return "explore";
    if (normalizedPathname.includes("/study/create")) return "study-room";
    if (normalizedPathname.includes("/account")) return "settings";
    
    // Default to feed for main community page - must be exact match
    // Only match /community exactly, not sub-routes
    const isCommunityHome = normalizedPathname === `${normalizedBasePrefix}/community` || 
                            normalizedPathname === "/community";
    if (isCommunityHome) {
      return "feed";
    }
    
    // Fallback: if we're on a community route but none of the above matched,
    // return feed (but we've already excluded /community/new above)
    if (normalizedPathname.includes("/community")) {
      return "feed";
    }
    
    // Ultimate fallback
    return "feed";
  };

  const items: ChipItem[] = [
    {
      id: "new-post",
      label: "Đăng bài",
      icon: Plus,
      href: `${basePrefix}/community/new`,
    },
    {
      id: "feed",
      label: "Bảng tin",
      icon: Home,
      href: `${basePrefix}/community`,
    },
    {
      id: "following",
      label: "Đang theo dõi",
      icon: UserPlus,
      href: `${basePrefix}/community/following`,
    },
    {
      id: "trending",
      label: "Xu hướng",
      icon: TrendingUp,
      href: `${basePrefix}/community/trending`,
    },
    {
      id: "saved",
      label: "Đã lưu",
      icon: Bookmark,
      href: `${basePrefix}/community/saved`,
    },
    {
      id: "profile",
      label: "Hồ sơ",
      icon: User,
      href: user?.id ? `${basePrefix}/community/profile/${user.id}` : `${basePrefix}/community`,
    },
    {
      id: "groups",
      label: "Nhóm học",
      icon: Users,
      href: `${basePrefix}/community/groups`,
    },
    {
      id: "study-room",
      label: "Phòng học",
      icon: GraduationCap,
      href: `${basePrefix}/study/create`,
    },
    {
      id: "explore",
      label: "Khám phá",
      icon: Search,
      href: `${basePrefix}/community/explore`,
    },
    {
      id: "settings",
      label: "Cài đặt",
      icon: Settings,
      href: `${basePrefix}/account`,
    },
  ];

  const handleItemClick = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (item?.href) {
      router.push(item.href);
    }
  };

  return (
    <HorizontalChipNav
      items={items}
      activeId={getActiveId()}
      onItemClick={handleItemClick}
    />
  );
}

