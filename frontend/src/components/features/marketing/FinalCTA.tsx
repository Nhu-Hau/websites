"use client";
import React from "react";
import Link from "next/link";
import { FiArrowRight, FiPlayCircle } from "react-icons/fi";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";
import { Sparkles } from "lucide-react";

export default function FinalCTA() {
  const basePrefix = useBasePrefix();

  return (
    <section className="relative overflow-hidden bg-slate-50 py-10 dark:bg-zinc-950">
      {/* Tầng nền tĩnh – không radial, không động */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/50 to-transparent dark:from-zinc-900/50 pointer-events-none" />

      <div className="relative mx-auto max-w-5xl rounded-3xl border-2 border-white/30 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl p-8 text-center shadow-2xl ring-2 ring-white/20 dark:ring-zinc-800/50 sm:p-12">
        {/* Glow tĩnh nhẹ */}
        <div className="absolute -inset-1 rounded-3xl blur-2xl opacity-70 -z-10" />

        <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-white drop-shadow-sm">
          Sẵn sàng chinh phục mục tiêu TOEIC của bạn?
        </h2>

        <p className="mx-auto mt-4 max-w-2xl text-base font-medium leading-relaxed text-slate-700 dark:text-zinc-300">
          Tham gia luyện tập hôm nay, theo dõi tiến bộ mỗi ngày và đạt điểm mong muốn.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          {/* Nút chính – Nổi bật */}
          <Link
            href={`${basePrefix}/auth/register`}
            className="group relative inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-sky-600 to-sky-500 px-7 py-4 text-base font-black text-white shadow-xl transition-all hover:from-sky-500 hover:to-sky-400 hover:shadow-2xl hover:scale-[1.02] overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <Sparkles className="h-5 w-5 transition-transform group-hover:scale-110" />
            Bắt đầu miễn phí
            <FiArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>

          {/* Nút phụ – Glass */}
          <Link
            href={`${basePrefix}/practice`}
            className="group relative inline-flex items-center justify-center gap-3 rounded-2xl border-2 border-white/40 bg-white/80 dark:bg-zinc-800/80 px-7 py-4 text-base font-bold text-slate-800 dark:text-zinc-200 shadow-lg backdrop-blur-sm transition-all hover:bg-white dark:hover:bg-zinc-700 hover:shadow-xl hover:scale-[1.02]"
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-sky-400/10 to-sky-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <FiPlayCircle className="h-5 w-5 text-sky-600 dark:text-sky-400" />
            Khám phá bộ đề
          </Link>
        </div>

        {/* Mini note */}
        <p className="mt-6 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-500">
          Hoàn toàn miễn phí – Không cần thẻ tín dụng
        </p>
      </div>
    </section>
  );
}