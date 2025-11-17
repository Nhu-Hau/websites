"use client";

import React, { useRef } from "react";
import { FileText, Route, Target, TrendingUp, ArrowRight } from "lucide-react";
import { motion, useInView } from "framer-motion";
import SectionHeader from "./SectionHeader";

const steps = [
  {
    number: "01",
    icon: FileText,
    title: "Làm Placement Test",
    desc: "Hoàn thành bài Mini TOEIC 55 câu trong 35 phút để xác định trình độ hiện tại của bạn.",
    color: "emerald",
  },
  {
    number: "02",
    icon: Route,
    title: "Nhận lộ trình học",
    desc: "Hệ thống sẽ ước lượng điểm TOEIC và đề xuất lộ trình học cá nhân hóa dựa trên điểm yếu của bạn.",
    color: "sky",
  },
  {
    number: "03",
    icon: Target,
    title: "Luyện tập theo Part",
    desc: "Thực hành từng Part với bài tập được phân theo độ khó phù hợp với level của bạn.",
    color: "amber",
  },
  {
    number: "04",
    icon: TrendingUp,
    title: "Theo dõi tiến độ",
    desc: "Xem báo cáo chi tiết, phân tích lỗi và theo dõi sự tiến bộ của bạn theo thời gian.",
    color: "pink",
  },
];

const colorMap: Record<
  string,
  {
    chipBg: string;
    chipText: string;
    chipBorder: string;
    iconBg: string;
    iconText: string;
  }
> = {
  emerald: {
    chipBg: "bg-emerald-50 dark:bg-emerald-950/30",
    chipText: "text-emerald-700 dark:text-emerald-300",
    chipBorder: "border-emerald-200 dark:border-emerald-800",
    iconBg: "bg-emerald-100/60 dark:bg-emerald-900/40",
    iconText: "text-emerald-600 dark:text-emerald-300",
  },

  sky: {
    chipBg: "bg-sky-50 dark:bg-sky-950/30",
    chipText: "text-sky-700 dark:text-sky-300",
    chipBorder: "border-sky-200 dark:border-sky-800",
    iconBg: "bg-sky-100/60 dark:bg-sky-900/40",
    iconText: "text-sky-600 dark:text-sky-300",
  },

  amber: {
    chipBg: "bg-amber-50 dark:bg-amber-950/30",
    chipText: "text-amber-700 dark:text-amber-300",
    chipBorder: "border-amber-200 dark:border-amber-800",
    iconBg: "bg-amber-100/60 dark:bg-amber-900/40",
    iconText: "text-amber-600 dark:text-amber-300",
  },

  pink: {
    chipBg: "bg-pink-50 dark:bg-pink-950/30",
    chipText: "text-pink-700 dark:text-pink-300",
    chipBorder: "border-pink-200 dark:border-pink-800",
    iconBg: "bg-pink-100/60 dark:bg-pink-900/40",
    iconText: "text-pink-600 dark:text-pink-300",
  },
};

export default function WorkflowSection() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  // Section header in view
  const headerInView = useInView(containerRef, {
    once: true,
    margin: "-100px 0px -20% 0px", // trigger rõ hơn khi scroll tới
  });

  // List (cards) in view
  const listInView = useInView(listRef, {
    once: true,
    margin: "-80px 0px -20% 0px",
  });

  const getColorClasses = (color: string) => colorMap[color] || colorMap.sky;

  return (
    <section className="relative bg-white py-16 dark:bg-zinc-950">
      {/* Background accent nhẹ */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-sky-50/80 via-white to-white dark:from-sky-950/40 dark:via-zinc-950 dark:to-zinc-950"
      />

      <div
        ref={containerRef}
        className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
      >
        {/* Header rơi nhẹ từ trên xuống */}
        <motion.div
          initial={{ opacity: 0, y: -24 }}
          animate={headerInView ? { opacity: 1, y: 0 } : { opacity: 0, y: -24 }}
          transition={{ duration: 0.6, ease: [0.22, 0.61, 0.36, 1] }}
        >
          <SectionHeader
            eyebrow="Quy trình học"
            title="Học TOEIC hiệu quả trong 4 bước đơn giản"
            desc="Từ việc xác định trình độ đến lúc chạm mục tiêu điểm số của bạn."
            align="center"
          />
        </motion.div>

        <div className="mt-14 lg:mt-18" ref={listRef}>
          {/* Desktop: timeline ngang */}
          <div className="relative hidden lg:grid lg:grid-cols-4 lg:gap-7 xl:gap-8">
            {/* line nối */}
            <div className="pointer-events-none absolute inset-x-10 top-[4.5rem] h-px bg-gradient-to-r from-emerald-200 via-sky-200 to-violet-200 dark:from-emerald-900 dark:via-sky-900 dark:to-violet-900" />

            {steps.map((step, index) => {
              const Icon = step.icon;
              const colors = getColorClasses(step.color);

              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: -24 }}
                  animate={
                    listInView ? { opacity: 1, y: 0 } : { opacity: 0, y: -24 }
                  }
                  transition={{
                    duration: 0.55,
                    ease: [0.22, 0.61, 0.36, 1],
                    delay: listInView ? index * 0.12 : 0,
                  }}
                  className="relative"
                >
                  <div
                    className="relative flex h-full flex-col rounded-2xl border border-zinc-200/80 bg-white/95 p-6 shadow-sm ring-1 ring-zinc-100/60 
                               transition-all duration-300 hover:-translate-y-2 hover:border-zinc-200 hover:shadow-xl hover:ring-zinc-200/80 
                               dark:border-zinc-800/80 dark:bg-zinc-900/95 dark:ring-zinc-800/80 dark:hover:border-zinc-700 dark:hover:ring-zinc-700"
                  >
                    {/* số bước */}
                    <div
                      className={`absolute -top-4 left-1/2 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full border-2 text-xs font-semibold ${colors.chipBg} ${colors.chipBorder} ${colors.chipText}`}
                    >
                      {step.number}
                    </div>

                    {/* icon */}
                    <div
                      className={`mt-4 mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl ${colors.iconBg}`}
                    >
                      <Icon className={`h-6 w-6 ${colors.iconText}`} />
                    </div>

                    {/* nội dung */}
                    <h3 className="mb-2 text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                      {step.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                      {step.desc}
                    </p>
                  </div>

                  {/* mũi tên nối (trừ bước cuối) */}
                  {index < steps.length - 1 && (
                    <div className="pointer-events-none absolute right-0 top-[4.6rem] z-10 translate-x-1/2 -translate-y-1/2">
                      <ArrowRight className="h-5 w-5 text-zinc-300 dark:text-zinc-600" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Mobile / Tablet: timeline dọc */}
          <div className="space-y-6 lg:hidden">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const colors = getColorClasses(step.color);

              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: -24 }}
                  animate={
                    listInView ? { opacity: 1, y: 0 } : { opacity: 0, y: -24 }
                  }
                  transition={{
                    duration: 0.55,
                    ease: [0.22, 0.61, 0.36, 1],
                    delay: listInView ? index * 0.12 : 0,
                  }}
                  className="relative flex gap-4"
                >
                  {/* cột số bước */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-semibold ${colors.chipBg} ${colors.chipBorder} ${colors.chipText}`}
                    >
                      {step.number}
                    </div>
                    {step.number !== "04" && (
                      <div className="mt-2 flex-1 min-h-[60px] w-px bg-gradient-to-b from-zinc-200 to-zinc-200 dark:from-zinc-800 dark:to-zinc-800" />
                    )}
                  </div>

                  {/* card nội dung */}
                  <div
                    className="flex-1 rounded-2xl border border-zinc-200/80 bg-white/95 p-4 shadow-sm ring-1 ring-zinc-100/60 
                               transition-all duration-300 hover:-translate-y-1 hover:border-zinc-200 hover:shadow-lg hover:ring-zinc-200/80 
                               dark:border-zinc-800/80 dark:bg-zinc-900/95 dark:ring-zinc-800/80 dark:hover:border-zinc-700 dark:hover:ring-zinc-700"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${colors.iconBg}`}
                      >
                        <Icon className={`h-5 w-5 ${colors.iconText}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="mb-1.5 text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                          {step.title}
                        </h3>
                        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
