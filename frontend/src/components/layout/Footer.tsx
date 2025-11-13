"use client";

import { Github, Twitter, Youtube, Instagram, Globe } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useLocaleSwitch } from "@/hooks/routing/useLocaleSwitch";

export default function Footer() {
  const year = new Date().getFullYear();
  const t = useTranslations("footer");

  // dùng hook bạn cung cấp
  const { locale, hrefFor, switchLocale } = useLocaleSwitch();

  return (
    <footer className="border-t border-neutral-200 bg-white text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Top grid */}
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
          {/* Brand */}
          <div className="col-span-3 md:col-span-3 lg:col-span-2">
            <Link href="/homePage">
              <div className="text-xl xl:text-2xl font-semibold text-zinc-900 dark:text-zinc-100 -tracking-tighter">
                Toeic
                <span className="text-sky-700">Prep</span>
              </div>
            </Link>
            <p className="mt-4 max-w-sm text-sm text-neutral-600 dark:text-neutral-400">
              {t("brandDescription")}
            </p>
            <div className="mt-4 flex items-center gap-3">
              <a
                href="/"
                className="text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Twitter size={18} />
              </a>
              <a
                href="/"
                className="text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github size={18} />
              </a>
              <a
                href="/"
                className="text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Youtube size={18} />
              </a>
              <a
                href="/"
                className="text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Instagram size={18} />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-sm font-semibold">{t("resources")}</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link
                  href="/practice"
                  className="hover:text-sky-500 dark:hover:text-sky-400"
                >
                  {t("practice")}
                </Link>
              </li>
              <li>
                <Link
                  href="/vocabulary"
                  className="hover:text-sky-500 dark:hover:text-sky-400"
                >
                  {t("vocabulary")}
                </Link>
              </li>
              <li>
                <Link
                  href="/forum"
                  className="hover:text-sky-500 dark:hover:text-sky-400"
                >
                  {t("forum")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold">{t("support")}</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link
                  href="/help-center"
                  className="hover:text-sky-500 dark:hover:text-sky-400"
                >
                  {t("helpCenter")}
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:text-sky-500 dark:hover:text-sky-400"
                >
                  {t("contact")}
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="hover:text-sky-500 dark:hover:text-sky-400"
                >
                  {t("faq")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Language (dùng useLocaleSwitch) */}
          <div>
            <h3 className="text-sm font-semibold">{t("language")}</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link
                  href={hrefFor("vi")}
                  className="inline-flex items-center gap-1 hover:text-sky-500 dark:hover:text-sky-400"
                  aria-current={locale === "vi" ? "true" : undefined}
                  onClick={(e) => {
                    // tuỳ chọn: chuyển bằng router.replace để không scroll
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
        </div>

        {/* Bottom */}
        <div className="mt-10 border-t border-neutral-200 pt-6 text-sm text-neutral-500 dark:border-neutral-800 dark:text-neutral-400 sm:flex sm:items-center sm:justify-between">
          <p>{t("rights", { year })}</p>
          <div className="mt-4 sm:mt-0">
            <Link
              href="/terms"
              className="hover:text-sky-500 dark:hover:text-sky-400"
            >
              {t("terms")}
            </Link>{" "}
            ·{" "}
            <Link
              href="/privacy"
              className="hover:text-sky-500 dark:hover:text-sky-400"
            >
              {t("privacy")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
