"use client";

import { Globe } from "lucide-react";
import Link from "next/link";
import { useLocaleSwitch } from "@/hooks/routing/useLocaleSwitch";
import { useTranslations } from "next-intl";

export default function FooterLanguageSwitcher() {
  const { locale, hrefFor } = useLocaleSwitch();
  const t = useTranslations("layout.footer.language");
  const languages = [
    { code: "vi", label: t("options.vi") },
    { code: "en", label: t("options.en") },
  ] as const;

  return (
    <div>
      <h3 className="text-sm font-semibold">{t("title")}</h3>
      <ul className="mt-3 space-y-2 text-sm">
        {languages.map(({ code, label }) => (
          <li key={code}>
            <Link
              href={hrefFor(code)}
              locale={code}
              className="inline-flex items-center gap-1 hover:text-sky-500 dark:hover:text-sky-400"
              aria-current={locale === code ? "true" : undefined}
            >
              <Globe size={14} /> {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}























