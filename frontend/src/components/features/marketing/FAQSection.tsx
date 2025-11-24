"use client";
import React, { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import SectionHeader from "./SectionHeader";
import { useTranslations } from "next-intl";

type FAQItem = {
  question: string;
  answer: string;
};

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const t = useTranslations("marketing.faq");
  const faqs: FAQItem[] = useMemo(
    () =>
      Array.from({ length: 6 }, (_, index) => ({
        question: t(`items.${index}.question`),
        answer: t(`items.${index}.answer`),
      })),
    [t]
  );

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="bg-zinc-50 dark:bg-zinc-950 border-y border-zinc-200 dark:border-zinc-900 py-16">
      <div className="mx-auto max-w-5xl px-6 lg:px-8">
        <SectionHeader
          eyebrow={t("eyebrow")}
          title={t("title")}
          desc={t("description")}
          align="center"
        />

        <div className="mt-12 space-y-4 mx-auto max-w-3xl">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="group rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all duration-300 hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 rounded-xl"
                aria-expanded={openIndex === index}
                aria-controls={`faq-answer-${index}`}
              >
                <span className="text-base font-semibold text-zinc-900 dark:text-white pr-8">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-zinc-500 dark:text-zinc-400 transition-transform duration-300 ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                id={`faq-answer-${index}`}
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className="px-6 pb-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 mt-5">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-5 text-center">
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
            {t("contact.prompt")}
          </p>
          <a
            href="mailto:support@toeicprep.com"
            className="inline-flex items-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md"
          >
            {t("contact.cta")}
          </a>
        </div>
      </div>
    </section>
  );
}


