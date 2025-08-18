import type { NavItemType } from "../types/navTypes";
import { useTranslations } from "next-intl";

export function MenuNav(): NavItemType[] {
  const t = useTranslations("nav");

  return [
    {
      label: t("practiceLR"),
      href: "/testList",
      children: [
        { label: t("parts.part1"), href: "/lr/part1" },
        { label: t("parts.part2"), href: "/lr/part2" },
        { label: t("parts.part3"), href: "/lr/part3" },
        { label: t("parts.part4"), href: "/lr/part4" },
        { label: t("parts.part5"), href: "/lr/part5" },
        { label: t("parts.part6"), href: "/lr/part6" },
        { label: t("parts.part7"), href: "/lr/part7" }
      ],
    },
    { label: t("mockTests"), href: "/testList" },
    { label: t("forum"), href: "/communityPage" },
  ];
}