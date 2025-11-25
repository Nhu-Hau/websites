"use client";
import type { NavItemType } from "../../types/nav.types";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";
import { useTranslations } from "next-intl";

export function MenuNav(): NavItemType[] {
  const basePrefix = useBasePrefix();
  const t = useTranslations("navbar");

  const items: NavItemType[] = [
    {
      label: t("practice.label"),
      children: [
        {
          label: t("practice.parts.part1"),
          href: `${basePrefix}/practice/part.1?level=1`,
        },
        {
          label: t("practice.parts.part2"),
          href: `${basePrefix}/practice/part.2?level=1`,
        },
        {
          label: t("practice.parts.part3"),
          href: `${basePrefix}/practice/part.3?level=1`,
        },
        {
          label: t("practice.parts.part4"),
          href: `${basePrefix}/practice/part.4?level=1`,
        },
        {
          label: t("practice.parts.part5"),
          href: `${basePrefix}/practice/part.5?level=1`,
        },
        {
          label: t("practice.parts.part6"),
          href: `${basePrefix}/practice/part.6?level=1`,
        },
        {
          label: t("practice.parts.part7"),
          href: `${basePrefix}/practice/part.7?level=1`,
        },
      ],
    },
    {
      label: t("learn.label"),
      children: [
        {
          label: t("learn.community"),
          href: `${basePrefix}/community`,
        },
        {
          label: t("learn.vocabulary"),
          href: `${basePrefix}/vocabulary`,
        },
        {
          label: t("learn.news"),
          href: `${basePrefix}/news`,
        },
      ],
    },
    { label: t("dashboard.label"), href: `${basePrefix}/dashboard` },
  ];

  return items;
}
