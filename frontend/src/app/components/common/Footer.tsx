"use client";

import React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

const Footer = () => {
  const t = useTranslations("footer");
  const year = new Date().getFullYear();

  // Lấy thủ công từng item trong mảng supportLinks
  const supportLinks = [
    {
      href: t("supportLinks.0.href"),
      label: t("supportLinks.0.label"),
    },
    {
      href: t("supportLinks.1.href"),
      label: t("supportLinks.1.label"),
    },
    {
      href: t("supportLinks.2.href"),
      label: t("supportLinks.2.label"),
    },
  ];

  return (
    <footer
      itemScope
      itemType="https://schema.org/WPFooter"
      className="bg-gray-800 dark:bg-gray-800 text-gray-100 dark:text-gray-100 py-12 z-40"
    >
      <div className="max-w-screen-xl 2xl:max-w-screen-2xl mx-auto px-4 2xl:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10 2xl:gap-16 mb-12">
          {/* About */}
          <div>
            <h5 className="text-lg md:text-xl 2xl:text-2xl font-bold mb-4">
              {t("aboutTitle")}
            </h5>
            <p className="text-sm md:text-base 2xl:text-lg leading-relaxed text-justify 2xl:leading-loose">
              {t("aboutDescription")}
            </p>
          </div>

          {/* Support */}
          <div className="md:mx-auto">
            <h4 className="text-lg md:text-xl 2xl:text-2xl font-bold mb-4">
              {t("supportTitle")}
            </h4>
            <ul className="space-y-2 text-sm md:text-base 2xl:text-lg">
              {supportLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    rel="nofollow"
                    className="hover:text-blue-600 dark:hover:text-blue-300 transition-colors duration-200"
                    aria-label={item.label}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h5 className="text-lg md:text-xl 2xl:text-2xl font-bold mb-4">
              {t("contactTitle")}
            </h5>
            <ul className="space-y-2 text-sm md:text-base 2xl:text-lg">
              <li>{t("phone")}</li>
              <li>{t("email")}</li>
            </ul>
          </div>
        </div>

        {/* Footer bottom */}
        <div className="border-t border-gray-300 dark:border-gray-600 pt-6 text-center text-sm 2xl:text-base text-gray-400 dark:text-gray-400">
          {t("copyright", { year })}
        </div>
      </div>
    </footer>
  );
};

export default Footer;