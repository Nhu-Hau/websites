"use client";

import { Globe } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useLocaleSwitch } from "@/hooks/routing/useLocaleSwitch";

export default function FooterLanguageSwitcher() {
  const t = useTranslations("footer");
  const { locale, hrefFor, switchLocale } = useLocaleSwitch();

  return (
    <div>
      <h3 className="text-sm font-semibold">{t("language")}</h3>
      <ul className="mt-3 space-y-2 text-sm">
        <li>
          <Link
            href={hrefFor("vi")}
            className="inline-flex items-center gap-1 hover:text-sky-500 dark:hover:text-sky-400"
            aria-current={locale === "vi" ? "true" : undefined}
            onClick={(e) => {
              e.preventDefault();
              switchLocale("vi");
            }}
          >
            <Globe size={14} /> {t("vietnamese")}
          </Link>
        </li>
        <li>
          <Link
            href={hrefFor("en")}
            className="inline-flex items-center gap-1 hover:text-sky-500 dark:hover:text-sky-400"
            aria-current={locale === "en" ? "true" : undefined}
            onClick={(e) => {
              e.preventDefault();
              switchLocale("en");
            }}
          >
            <Globe size={14} /> {t("english")}
          </Link>
        </li>
      </ul>
    </div>
  );
}












