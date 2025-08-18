"use client";

import { Globe } from "lucide-react";
import Link from "next/link";
import Flag from "react-world-flags";
import Dropdown from "../common/DropIconHeader";
import { useLocaleSwitch } from "@/hooks/useLocaleSwitch";
import { useTranslations } from "next-intl";

export default function LanguageSwitcher() {
  const { locale, hrefFor } = useLocaleSwitch();
  const t = useTranslations("LanguageSwitcher");

  return (
    <Dropdown
      button={
        <div className="w-5 h-5 text-zinc-900 dark:text-zinc-100">
          <Globe size="100%" />
        </div>
      }
    >
      <li>
        <Link
          href={hrefFor("vi")}
          className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-800 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-b-xl"
          aria-current={locale === "vi" ? "true" : undefined}
        >
          <div className="flex gap-2 items-center">
            <Flag code="vn" style={{ width: 28, height: "auto" }} />
            <span>{t("vietnamese")}</span>
          </div>
        </Link>
      </li>

      <li>
        <Link
          href={hrefFor("en")}
          className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-800 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-b-xl"
          aria-current={locale === "en" ? "true" : undefined}
        >
          <div className="flex gap-2 items-center">
            <Flag code="gb" style={{ width: 28, height: "auto" }} />
            <span>{t("english")}</span>
          </div>
        </Link>
      </li>
    </Dropdown>
  );
}