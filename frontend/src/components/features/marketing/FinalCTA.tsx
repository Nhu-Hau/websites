"use client";
import React from "react";
import Link from "next/link";
import { FiArrowRight, FiPlayCircle } from "react-icons/fi";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";
import { Sparkles } from "lucide-react";

export default function FinalCTA() {
  const basePrefix = useBasePrefix();

  return (
    <section className="relative overflow-hidden bg-white dark:bg-zinc-950 py-20 sm:py-24">
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-50/50 to-transparent dark:from-zinc-900/50 pointer-events-none" />

      <div className="relative mx-auto max-w-4xl px-6 lg:px-8">
        <div className="rounded-2xl bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 sm:p-12 text-center shadow-sm">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-sky-100 dark:bg-sky-950/50 px-4 py-2">
            <Sparkles className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            <span className="text-sm font-semibold text-sky-700 dark:text-sky-300">
              Sẵn sàng bắt đầu?
            </span>
          </div>

          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
            Sẵn sàng chinh phục mục tiêu TOEIC của bạn?
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
            Tham gia luyện tập hôm nay, theo dõi tiến bộ mỗi ngày và đạt điểm mong muốn.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            {/* Primary CTA */}
            <Link
              href={`${basePrefix}/register`}
              className="group inline-flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-sky-500 px-8 py-3.5 text-base font-semibold text-white shadow-sm transition-all hover:from-sky-500 hover:to-sky-400 hover:shadow-md"
            >
              <Sparkles className="h-5 w-5 transition-transform group-hover:scale-110" />
              Bắt đầu miễn phí
              <FiArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>

            {/* Secondary CTA */}
            <Link
              href={`${basePrefix}/practice`}
              className="inline-flex items-center justify-center gap-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-8 py-3.5 text-base font-semibold text-zinc-700 dark:text-zinc-300 transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600"
            >
              <FiPlayCircle className="h-5 w-5 text-sky-600 dark:text-sky-400" />
              Khám phá bộ đề
            </Link>
          </div>

          {/* Note */}
          <p className="mt-8 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Hoàn toàn miễn phí – Không cần thẻ tín dụng
          </p>
        </div>
      </div>
    </section>
  );
}