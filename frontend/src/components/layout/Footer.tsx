"use client";

import Link from "next/link";
import { Github, Twitter, Youtube, Instagram } from "lucide-react";
import { useTranslations } from "next-intl";
import FooterLanguageSwitcher from "@/components/layout/FooterLanguageSwitcher";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";

type SectionLink = {
  label: string;
  href: string;
};

const SOCIAL_LINKS = [
  {
    key: "twitter",
    href: "https://twitter.com/toeicprep",
    Icon: Twitter,
  },
  {
    key: "youtube",
    href: "https://www.youtube.com/@toeicprep",
    Icon: Youtube,
  },
  {
    key: "instagram",
    href: "https://www.instagram.com/toeicprep",
    Icon: Instagram,
  },
  {
    key: "github",
    href: "https://github.com/toeicprep",
    Icon: Github,
  },
] as const;

export default function Footer() {
  const year = new Date().getFullYear();
  const t = useTranslations("layout.footer");
  const basePrefix = useBasePrefix();

  const sections: Array<{ title: string; links: SectionLink[] }> = [
    {
      title: t("sections.product.title"),
      links: [
        {
          label: t("sections.product.links.placement"),
          href: `${basePrefix}/placement`,
        },
        {
          label: t("sections.product.links.practice"),
          href: `${basePrefix}/practice`,
        },
        {
          label: t("sections.product.links.vocabulary"),
          href: `${basePrefix}/vocabulary`,
        },
        {
          label: t("sections.product.links.progress"),
          href: `${basePrefix}/progress`,
        },
        {
          label: t("sections.product.links.pricing"),
          href: `${basePrefix}/pricing`,
        },
      ],
    },
    {
      title: t("sections.study.title"),
      links: [
        {
          label: t("sections.study.links.studyRooms"),
          href: `${basePrefix}/study`,
        },
        {
          label: t("sections.study.links.createRoom"),
          href: `${basePrefix}/study/create`,
        },
        {
          label: t("sections.study.links.teacherRegister"),
          href: `${basePrefix}/study/teacher-register`,
        },
      ],
    },
    {
      title: t("sections.community.title"),
      links: [
        {
          label: t("sections.community.links.feed"),
          href: `${basePrefix}/community`,
        },
        {
          label: t("sections.community.links.groups"),
          href: `${basePrefix}/community/groups`,
        },
        {
          label: t("sections.community.links.explore"),
          href: `${basePrefix}/community/explore`,
        },
        {
          label: t("sections.community.links.trending"),
          href: `${basePrefix}/community/trending`,
        },
        {
          label: t("sections.community.links.news"),
          href: `${basePrefix}/news`,
        },
      ],
    },
  ];

  return (
    <footer className="border-t border-neutral-200 bg-white/95 text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-6">
          <div className="col-span-2 lg:col-span-2">
            <Link href={basePrefix} className="inline-flex items-center gap-1.5">
              <span className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
                Toeic<span className="text-sky-600">Prep</span>
              </span>
            </Link>
            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-sky-600 dark:text-sky-400">
              {t("brand.tagline")}
            </p>
            <p className="mt-4 max-w-sm text-sm text-neutral-600 dark:text-neutral-400">
              {t("brand.description")}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {t("brand.stats.learners")}
              </span>
              <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
                {t("brand.stats.scoreGain")}
              </span>
            </div>
            <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              {t("socials.title")}
            </p>
            <div className="mt-3 flex items-center gap-3">
              {SOCIAL_LINKS.map(({ key, href, Icon }) => (
                <a
                  key={key}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={t("socials.aria", {
                    network: t(`socials.${key}`),
                  })}
                  className="rounded-full border border-neutral-200/60 p-2 text-neutral-500 transition-colors hover:border-sky-300 hover:text-sky-600 dark:border-neutral-800 dark:text-neutral-400 dark:hover:border-sky-600 dark:hover:text-sky-300"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {sections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {section.title}
              </h3>
              <ul className="mt-3 space-y-2 text-sm">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-neutral-600 transition-colors hover:text-sky-600 dark:text-neutral-400 dark:hover:text-sky-300"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="col-span-2 sm:col-span-1">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {t("contact.title")}
            </h3>
            <dl className="mt-3 space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
              <div>
                <dt className="font-medium">{t("contact.emailLabel")}</dt>
                <dd>
                  <a
                    href="mailto:hausu999@gmail.com"
                    className="text-sky-600 transition-colors hover:text-sky-500 dark:text-sky-400 dark:hover:text-sky-300"
                  >
                    {t("contact.emailValue")}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="font-medium">{t("contact.addressLabel")}</dt>
                <dd>{t("contact.addressValue")}</dd>
              </div>
              <div>
                <dt className="font-medium">{t("contact.hoursLabel")}</dt>
                <dd>{t("contact.hoursValue")}</dd>
              </div>
            </dl>
            <div className="mt-6">
              <FooterLanguageSwitcher />
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-neutral-200 pt-6 text-sm text-neutral-500 dark:border-neutral-800 dark:text-neutral-400 sm:flex-row sm:items-center sm:justify-between">
          <p>{t("legal.rights", { year })}</p>
        </div>
      </div>
    </footer>
  );
}
