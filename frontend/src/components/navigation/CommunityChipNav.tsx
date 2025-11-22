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
    
    // Check exact matches first (more specific routes)
    if (normalizedPathname === `${basePrefix}/community/new`) {
      return "new-post";
    }
    if (normalizedPathname.includes("/community/profile")) return "profile";
    if (normalizedPathname.includes("/community/following")) return "following";
    if (normalizedPathname.includes("/community/trending")) return "trending";
    if (normalizedPathname.includes("/community/saved")) return "saved";
    if (normalizedPathname.includes("/community/groups")) return "groups";
    if (normalizedPathname.includes("/community/explore")) return "explore";
    if (normalizedPathname.includes("/study/create")) return "study-room";
    if (normalizedPathname.includes("/account")) return "settings";
    // Default to feed for main community page
    if (normalizedPathname === `${basePrefix}/community`) {
      return "feed";
    }
    // Fallback to feed if on any community sub-route that doesn't match above
    if (normalizedPathname.includes("/community")) return "feed";
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

