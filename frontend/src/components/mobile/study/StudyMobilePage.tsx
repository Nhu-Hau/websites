"use client";

import Link from "next/link";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";
import { cn } from "@/lib/utils";
import { BookOpen, Newspaper, ArrowRight } from "lucide-react";
import { motion, Variants, easeOut } from "framer-motion";
import { useTranslations } from "next-intl";

const easeOutBezier = easeOut;

const pageVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: easeOutBezier,
    },
  },
};

export function StudyMobilePage() {
  const base = useBasePrefix();
  const t = useTranslations("mobile.study");

  const STUDY_OPTIONS = [
    {
      id: "vocabulary",
      icon: BookOpen,
      title: t("vocabulary.title"),
      description: t("vocabulary.description"),
      href: (base: string) => `${base}/vocabulary`,
      gradient: "from-blue-500 to-blue-600",
      bgGradient:
        "from-blue-100/90 via-white to-blue-100/80 dark:from-blue-950/40 dark:via-zinc-950 dark:to-blue-900/30",
      tag: t("vocabulary.tag"),
      estimated: t("vocabulary.estimated"),
    },
    {
      id: "news",
      icon: Newspaper,
      title: t("news.title"),
      description: t("news.description"),
      href: (base: string) => `${base}/news`,
      gradient: "from-cyan-500 to-cyan-600",
      bgGradient:
        "from-cyan-100/90 via-white to-cyan-100/80 dark:from-cyan-950/40 dark:via-zinc-950 dark:to-cyan-900/30",
      tag: t("news.tag"),
      estimated: t("news.estimated"),
    },
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#e5e7eb_0,_#fafafa_45%,_#f4f4f5_100%)] pt-14 pb-20 dark:bg-[radial-gradient(circle_at_top,_#020617_0,_#020617_40%,_#020617_100%)]">
      <motion.main
        className="mx-auto max-w-xl px-4 pt-4"
        variants={pageVariants}
        initial="hidden"
        animate="show"
      >
        {/* Header */}
        <header className="mb-6 space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/80 px-3 py-1 text-[11px] font-medium text-zinc-600 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-300">
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>{t("header.badge")}</span>
          </div>

          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {t("header.title")}
            </h1>
            <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {t.rich("header.description", {
                vocabulary: (chunks) => (
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {chunks}
                  </span>
                ),
                news: (chunks) => (
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {chunks}
                  </span>
                ),
              })}
            </p>
          </div>
        </header>

        {/* Study Options */}
        <section className="space-y-4">
          {STUDY_OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <Link
                key={option.id}
                href={option.href(base)}
                className={cn(
                  "group relative block overflow-hidden rounded-2xl border border-zinc-200/80 bg-gradient-to-br",
                  option.bgGradient,
                  "shadow-sm ring-1 ring-black/[0.02] transition-all duration-200 hover:-translate-y-[2px] hover:shadow-md dark:border-zinc-800/80"
                )}
              >
                {/* subtle overlay */}
                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-white/30 blur-3xl dark:bg-white/5" />
                  <div className="absolute -left-10 bottom-0 h-24 w-24 rounded-full bg-white/40 blur-3xl dark:bg-white/5" />
                </div>

                <div className="relative p-4">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div
                      className={cn(
                        "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br",
                        option.gradient,
                        "text-white shadow-lg shadow-blue-500/20 transition-transform duration-200 group-hover:scale-105 group-hover:shadow-xl group-hover:shadow-zinc-500/30 dark:shadow-none"
                      )}
                    >
                      <Icon className="h-7 w-7" />
                    </div>

                    {/* Content */}
                    <div className="flex flex-1 flex-col">
                      <div className="mb-1 flex items-center gap-2">
                        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                          {option.title}
                        </h3>
                        {option.id === "vocabulary" && (
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-900/60 dark:text-blue-200">
                            {t("vocabulary.suggested")}
                          </span>
                        )}
                      </div>

                      <p className="mb-3 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                        {option.description}
                      </p>

                      {/* Meta row */}
                      <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                        <span className="inline-flex items-center rounded-full bg-white/80 px-2 py-0.5 shadow-sm ring-1 ring-zinc-200/70 dark:bg-zinc-900/80 dark:ring-zinc-700">
                          • {option.tag}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-transparent px-2 py-0.5">
                          ⏱ {option.estimated}
                        </span>
                      </div>

                      {/* CTA */}
                      <div className="mt-auto flex items-center justify-between">
                        <div className="flex items-center text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                          <span>{t("cta.start")}</span>
                          <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </div>
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          {t("cta.tap")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </section>

        {/* Small helper text */}
        <section className="mt-6 rounded-xl border border-dashed border-zinc-200 bg-white/80 px-3 py-2 text-[11px] leading-relaxed text-zinc-600 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-400">
          {t.rich("tip", {
            vocabulary: (chunks) => (
              <span className="font-semibold text-blue-700 dark:text-blue-300">
                {chunks}
              </span>
            ),
            news: (chunks) => (
              <span className="font-semibold text-cyan-700 dark:text-cyan-300">
                {chunks}
              </span>
            ),
          })}
        </section>
      </motion.main>
    </div>
  );
}

