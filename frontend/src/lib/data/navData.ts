import type { NavItemType } from "../../types/navTypes";
import { useTranslations } from "next-intl";

export function MenuNav(): NavItemType[] {
  const t = useTranslations("nav");

  return [
    {
      label: t("practiceLR.title"),
      href: "/practice/parts",
      children: [
        { label: t("practiceLR.parts.part1"), href: "/practice/parts/1" },
        { label: t("practiceLR.parts.part2"), href: "/practice/parts/2" },
        { label: t("practiceLR.parts.part3"), href: "/practice/parts/3" },
        { label: t("practiceLR.parts.part4"), href: "/practice/parts/4" },
        { label: t("practiceLR.parts.part5"), href: "/practice/parts/5" },
        { label: t("practiceLR.parts.part6"), href: "/practice/parts/6" },
        { label: t("practiceLR.parts.part7"), href: "/practice/parts/7" },
      ],
    },
    {
      label: t("mockTests.title"),
      href: "/practice/tests",
      children: [
        {
          label: t("mockTests.practiceTests"),
          href: "/practice/tests",
        },
        { label: t("mockTests.realTest"), href: "/exam/tests" },
      ],
    },
    { label: t("forum"), href: "/communityPage" },
  ];
}
