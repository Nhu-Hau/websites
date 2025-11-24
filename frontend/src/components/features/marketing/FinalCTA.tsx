"use client";
import React from "react";
import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";
import { useTranslations } from "next-intl";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";

export default function FinalCTA() {
  const t = useTranslations("marketing.finalCta");
  const base = useBasePrefix("vi");

  return (
    <section className="relative overflow-hidden bg-slate-50 py-10 dark:bg-zinc-950">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_180px_at_50%_-50px,rgba(14,165,233,0.15),transparent)] dark:bg-[radial-gradient(600px_180px_at_50%_-50px,rgba(14,165,233,0.10),transparent)]"
      />
      <div className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white/80 p-8 text-center backdrop-blur sm:p-12 dark:border-zinc-800 dark:bg-zinc-900/80">
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-zinc-100">
          {t("title")}
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-zinc-400">
          {t("description")}
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href={`${base}/register`}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-500"
          >
            {t("primaryCta")} <FiArrowRight />
          </Link>
          <Link
            href={`${base}/practice/part.1?level=1`}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            {t("secondaryCta")}
          </Link>
        </div>
      </div>
    </section>
  );
}