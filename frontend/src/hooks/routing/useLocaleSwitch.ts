"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { routing } from "@/routing";

const SUPPORTED_LOCALES = routing.locales;
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
const DEFAULT_LOCALE = routing.defaultLocale;

function normalizePathname(pathname?: string | null) {
  if (!pathname) return "/";
  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

function replaceLocaleInPath(pathname: string, newLocale: SupportedLocale) {
  const normalized = normalizePathname(pathname);
  const segments = normalized.split("/").filter(Boolean);
  const firstSegment = segments[0];
  const hasLocalePrefix =
    firstSegment && SUPPORTED_LOCALES.includes(firstSegment as SupportedLocale);

  if (newLocale === DEFAULT_LOCALE) {
    const rest = hasLocalePrefix ? segments.slice(1) : segments;
    return rest.length ? `/${rest.join("/")}` : "/";
  }

  if (hasLocalePrefix) {
    segments[0] = newLocale;
  } else {
    segments.unshift(newLocale);
  }

  return `/${segments.join("/")}`;
}

export function useLocaleSwitch() {
  const locale = useLocale() as SupportedLocale;
  const pathname = usePathname();
  const router = useRouter();

  const hrefFor = (target: SupportedLocale) => {
    return replaceLocaleInPath(pathname ?? "/", target);
  };

  const switchLocale = (target: SupportedLocale) => {
    if (target !== locale) {
      router.replace(hrefFor(target), { scroll: false });
    }
  };

  return { locale, hrefFor, switchLocale };
}
