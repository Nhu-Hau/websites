"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";

const SUPPORTED_LOCALES = ["en", "vi"] as const;
type SupportedLocale = typeof SUPPORTED_LOCALES[number];

function replaceLocaleInPath(
  pathname: string,
  newLocale: string,
  locales: string[]
) {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length > 0 && locales.includes(segments[0])) {
    segments[0] = newLocale;
  } else {
    segments.unshift(newLocale);
  }
  return "/" + segments.join("/");
}

export function useLocaleSwitch() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const hrefFor = (target: SupportedLocale) => {
    return replaceLocaleInPath(pathname, target, SUPPORTED_LOCALES as unknown as string[]);
  };

  const switchLocale = (target: SupportedLocale) => {
    if (target !== locale) {
      router.replace(hrefFor(target), { scroll: false });
    }
  };

  return { locale, hrefFor, switchLocale };
}
