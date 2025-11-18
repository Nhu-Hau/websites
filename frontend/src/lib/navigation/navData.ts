"use client";
import type { NavItemType } from "../../types/nav.types";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";

export function MenuNav(): NavItemType[] {
  const basePrefix = useBasePrefix();

  const items: NavItemType[] = [
    {
      label: "Luyện L&R",
      children: [
        {
          label: "Part 1: Mô tả tranh",
          href: `${basePrefix}/practice/part.1?level=1`,
        },
        {
          label: "Part 2: Hỏi - đáp",
          href: `${basePrefix}/practice/part.2?level=1`,
        },
        {
          label: "Part 3: Đoạn hội thoại",
          href: `${basePrefix}/practice/part.3?level=1`,
        },
        {
          label: "Part 4: Bài nói ngắn",
          href: `${basePrefix}/practice/part.4?level=1`,
        },
        {
          label: "Part 5: Hoàn thành câu",
          href: `${basePrefix}/practice/part.5?level=1`,
        },
        {
          label: "Part 6: Hoàn thành đoạn văn",
          href: `${basePrefix}/practice/part.6?level=1`,
        },
        {
          label: "Part 7: Đọc hiểu",
          href: `${basePrefix}/practice/part.7?level=1`,
        },
      ],
    },
    {
      label: "Học tập",
      children: [
        {
          label: "Cộng đồng",
          href: `${basePrefix}/community`,
        },
        {
          label: "Học từ vựng",
          href: `${basePrefix}/vocabulary`,
        },
        {
          label: "Học qua tin tức",
          href: `${basePrefix}/news`,
        },
      ],
    },
    { label: "Bảng điều khiển", href: `${basePrefix}/dashboard` },
  ];

  return items;
}
