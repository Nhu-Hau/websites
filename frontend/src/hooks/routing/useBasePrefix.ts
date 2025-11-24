//frontend/src/hooks/useBasePrefix.ts
"use client";

import { useParams, usePathname } from "next/navigation";
import { routing } from "@/routing";

export function useBasePrefix(defaultLocale = "vi") {
  const params = useParams() as { locale?: string } | null;
  const pathname = usePathname();
  const segments = pathname?.split("/").filter(Boolean) ?? [];
  const firstSegment = segments[0];
  const knownLocale =
    firstSegment && routing.locales.includes(firstSegment) ? firstSegment : undefined;

  const locale = params?.locale || knownLocale || defaultLocale;
  const shouldHide = !locale || locale === defaultLocale;

  return shouldHide ? "" : `/${locale}`;
}