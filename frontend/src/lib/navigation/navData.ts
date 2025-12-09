"use client";
import type { NavItemType } from "../../types/nav.types";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";

type PartKey = "part.1" | "part.2" | "part.3" | "part.4" | "part.5" | "part.6" | "part.7";
type Lvl = 1 | 2 | 3;

function normalizePartLevels(raw: any): Partial<Record<PartKey, Lvl>> {
  const out: Partial<Record<PartKey, Lvl>> = {};
  if (!raw || typeof raw !== "object") return out;
  const parts: PartKey[] = ["part.1", "part.2", "part.3", "part.4", "part.5", "part.6", "part.7"];
  for (const p of parts) {
    const num = p.split(".")[1];
    let v: any = raw[p];
    if (v == null && raw.part && typeof raw.part === "object")
      v = raw.part[num];
    if (v == null && raw[num] != null) v = raw[num];
    const n = Number(v);
    if (n === 1 || n === 2 || n === 3) out[p] = n as Lvl;
  }
  return out;
}

export function MenuNav(): NavItemType[] {
  const basePrefix = useBasePrefix();
  const t = useTranslations("navbar");
  const { user } = useAuth();

  // Get user's part levels, fallback to level 1 for all parts
  const partLevels = normalizePartLevels(user?.partLevels);
  const getLevel = (part: PartKey): Lvl => partLevels[part] || 1;

  const items: NavItemType[] = [
    {
      label: t("practice.label"),
      children: [
        {
          label: t("practice.parts.part1"),
          href: `${basePrefix}/practice/part.1?level=${getLevel("part.1")}`,
        },
        {
          label: t("practice.parts.part2"),
          href: `${basePrefix}/practice/part.2?level=${getLevel("part.2")}`,
        },
        {
          label: t("practice.parts.part3"),
          href: `${basePrefix}/practice/part.3?level=${getLevel("part.3")}`,
        },
        {
          label: t("practice.parts.part4"),
          href: `${basePrefix}/practice/part.4?level=${getLevel("part.4")}`,
        },
        {
          label: t("practice.parts.part5"),
          href: `${basePrefix}/practice/part.5?level=${getLevel("part.5")}`,
        },
        {
          label: t("practice.parts.part6"),
          href: `${basePrefix}/practice/part.6?level=${getLevel("part.6")}`,
        },
        {
          label: t("practice.parts.part7"),
          href: `${basePrefix}/practice/part.7?level=${getLevel("part.7")}`,
        },
      ],
    },
    {
      label: t("learn.label"),
      children: [
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
    { label: t("community.label"), href: `${basePrefix}/community` },
    { label: t("dashboard.label"), href: `${basePrefix}/dashboard` },
  ];

  return items;
}
