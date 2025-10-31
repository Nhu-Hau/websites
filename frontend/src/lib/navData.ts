// frontend/src/components/layout/MenuNav.ts
"use client";
import type { NavItemType } from "../types/navTypes";
import { useTranslations, useLocale } from "next-intl";
import { useAuth } from "@/context/AuthContext";

export function MenuNav(): NavItemType[] {
  const t = useTranslations("nav");
  const locale = useLocale();
  const { user } = useAuth();

  const items: NavItemType[] = [
    {
      label: t("practiceLR.title"),
      href: `/${locale}/practice/part.1`,
      children: [
        {
          label: t("practiceLR.parts.part1"),
          href: `/${locale}/practice/part.1`,
        },
        {
          label: t("practiceLR.parts.part2"),
          href: `/${locale}/practice/part.2`,
        },
        {
          label: t("practiceLR.parts.part3"),
          href: `/${locale}/practice/part.3`,
        },
        {
          label: t("practiceLR.parts.part4"),
          href: `/${locale}/practice/part.4`,
        },
        {
          label: t("practiceLR.parts.part5"),
          href: `/${locale}/practice/part.5`,
        },
        {
          label: t("practiceLR.parts.part6"),
          href: `/${locale}/practice/part.6`,
        },
        {
          label: t("practiceLR.parts.part7"),
          href: `/${locale}/practice/part.7`,
        },
      ],
    },
    { label: t("course"), href: `/${locale}/courses` },
    { label: t("forum"), href: `/${locale}/community` },
    { label: t("dashboard"), href: `/${locale}/dashboard` },
    { label: t("createStudyRoom"), href: `/${locale}/study/create` },
  ];

  return items;
}
