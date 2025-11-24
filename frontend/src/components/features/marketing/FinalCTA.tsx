import React from "react";
import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";

export default function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-slate-50 py-10 dark:bg-zinc-950">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_180px_at_50%_-50px,rgba(14,165,233,0.15),transparent)] dark:bg-[radial-gradient(600px_180px_at_50%_-50px,rgba(14,165,233,0.10),transparent)]"
      />
      <div className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white/80 p-8 text-center backdrop-blur sm:p-12 dark:border-zinc-800 dark:bg-zinc-900/80">
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-zinc-100">
          Sẵn sàng chinh phục mục tiêu TOEIC của bạn?
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-zinc-400">
          Tham gia luyện tập hôm nay, theo dõi tiến bộ mỗi ngày và đạt điểm mong
          muốn.
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-500"
          >
            Bắt đầu miễn phí <FiArrowRight />
          </Link>
          <Link
            href="/practice/part.1?level=1"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            Khám phá bộ đề
          </Link>
        </div>
      </div>
    </section>
  );
}