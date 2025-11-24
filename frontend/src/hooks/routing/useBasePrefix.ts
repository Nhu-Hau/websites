//frontend/src/hooks/useBasePrefix.ts
"use client";

import { useParams, usePathname } from "next/navigation";
import { routing } from "@/routing";

const isSupportedLocale = (
  value: string
): value is (typeof routing.locales)[number] => {
  return routing.locales.includes(
    value as (typeof routing.locales)[number]
  );
};

export function useBasePrefix(defaultLocale = "vi") {
  const params = useParams() as { locale?: string } | null;
  const pathname = usePathname();
  const segments = pathname?.split("/").filter(Boolean) ?? [];
  const firstSegment = segments[0];
  const knownLocale = firstSegment && isSupportedLocale(firstSegment) ? firstSegment : undefined;

  const locale = params?.locale || knownLocale || defaultLocale;
  const shouldHide = !locale || locale === defaultLocale;

  return shouldHide ? "" : `/${locale}`;
}