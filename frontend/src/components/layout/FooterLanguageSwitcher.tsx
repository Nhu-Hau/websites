"use client";

import { Globe } from "lucide-react";
import Link from "next/link";
import { useLocaleSwitch } from "@/hooks/routing/useLocaleSwitch";

const LANGUAGE_COPY = {
  label: "Ngôn ngữ",
  vietnamese: "Tiếng Việt",
  english: "English",
};

export default function FooterLanguageSwitcher() {
  const { locale, hrefFor, switchLocale } = useLocaleSwitch();

  return (
    <div>
      <h3 className="text-sm font-semibold">{LANGUAGE_COPY.label}</h3>
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
            <Globe size={14} /> {LANGUAGE_COPY.vietnamese}
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
            <Globe size={14} /> {LANGUAGE_COPY.english}
          </Link>
        </li>
      </ul>
    </div>
  );
}























