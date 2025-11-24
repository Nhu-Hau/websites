"use client";

import React from "react";
import SectionHeader from "./SectionHeader";
import { TestimonialAvatar } from "./TestimonialAvatar";
import { Quote, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

const testimonialConfigs = [
    {
    key: "0",
      avatar:
        "https://s3.ap-southeast-2.amazonaws.com/project.toeic/avatar/z7203367134559_612727cf573abc8ec005237bed66d4e5.jpg",
    },
    {
    key: "1",
      avatar:
        "https://s3.ap-southeast-2.amazonaws.com/project.toeic/avatar/z7203365126878_782dbc071de3ae09c786b97567af1258.jpg",
    },
    {
    key: "2",
      avatar:
        "https://s3.ap-southeast-2.amazonaws.com/project.toeic/avatar/z7203369078456_b4b64b073b9f5a6ffc067aaceb87f379.jpg",
    },
  ];

export default function Testimonials() {
  const t = useTranslations("marketing.testimonials");

  return (
    <section className="border-y border-zinc-200 bg-zinc-50 py-16 dark:border-zinc-900 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header motion: rơi nhẹ từ trên xuống */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, ease: [0.22, 0.61, 0.36, 1] }}
        >
          <SectionHeader
            eyebrow={t("eyebrow")}
            title={t("title")}
            desc={t("description")}
            align="center"
          />
        </motion.div>

        {/* Cards motion: fade + slide up, stagger theo index */}
        <div className="mt-16 grid gap-8 lg:grid-cols-3 sm:max-w-xl sm:mx-auto lg:mx-0 mx-0 lg:max-w-none">
          {testimonialConfigs.map((item, index) => {
            const name = t(`items.${index}.name`);
            const score = t(`items.${index}.score`);
            const quote = t(`items.${index}.quote`);

            return (
            <motion.figure
              key={item.key}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{
                duration: 0.55,
                ease: [0.22, 0.61, 0.36, 1],
                delay: index * 0.12,
              }}
              className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-zinc-300 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
            >
              {/* Quote icon - subtle background */}
              <div className="pointer-events-none absolute -right-4 -top-4 opacity-5">
                <Quote className="h-24 w-24 text-zinc-900 dark:text-white" />
              </div>

              {/* Quote content */}
              <blockquote className="relative mb-6">
                <span className="absolute -left-1 -top-2 leading-none text-4xl font-bold text-zinc-200 dark:text-zinc-800">
                </span>
                <p className="relative pl-4 text-sm font-medium leading-relaxed text-zinc-700 dark:text-zinc-300">
                  {quote}
                </p>
              </blockquote>

              {/* Author + Score */}
              <figcaption className="flex items-center justify-between gap-4 border-t border-zinc-100 pt-6 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <TestimonialAvatar src={item.avatar} alt={name} />
                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-zinc-900" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                      {name}
                    </div>
                    <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      {t("studentLabel")}
                    </div>
                  </div>
                </div>

                {/* Score badge */}
                <span className="shrink-0 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm">
                  {score}
                </span>
              </figcaption>
            </motion.figure>
            );
          })}
        </div>

        {/* Stats bar motion */}
        <motion.div
          className="mt-16 text-center"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55, ease: [0.22, 0.61, 0.36, 1], delay: 0.15 }}
        >
          <p className="text-base font-medium text-zinc-700 dark:text-zinc-300">
            {t.rich("impact.summary", {
              percent: (chunks) => (
            <span className="text-2xl font-bold text-sky-600 dark:text-sky-400">
                  {chunks}
                </span>
              ),
              duration: (chunks) => (
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {chunks}
                </span>
              ),
            })}
          </p>
          <div className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
            <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            {t("impact.source")}
          </div>
        </motion.div>
      </div>
    </section>
  );
}