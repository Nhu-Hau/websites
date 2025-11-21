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

// Brand chính #2E5EB8, giữ API color cũ nhưng đổi toàn bộ palette sang cùng tone
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
    chipBg: "bg-[#2E5EB8]/5 dark:bg-[#2E5EB8]/15",
    chipText: "text-[#2E5EB8] dark:text-[#bfdbfe]",
    chipBorder: "border-[#2E5EB8]/30 dark:border-[#2E5EB8]/40",
    iconBg: "bg-[#2E5EB8]/10 dark:bg-[#2E5EB8]/25",
    iconText: "text-[#2E5EB8] dark:text-[#bfdbfe]",
  },
  sky: {
    chipBg: "bg-[#2E5EB8]/7 dark:bg-[#2E5EB8]/20",
    chipText: "text-[#2E5EB8] dark:text-[#c7d2fe]",
    chipBorder: "border-[#2E5EB8]/35 dark:border-[#2E5EB8]/45",
    iconBg: "bg-[#2E5EB8]/12 dark:bg-[#2E5EB8]/30",
    iconText: "text-[#2E5EB8] dark:text-[#c7d2fe]",
  },
  amber: {
    chipBg: "bg-[#2E5EB8]/6 dark:bg-[#2E5EB8]/18",
    chipText: "text-[#2E5EB8] dark:text-[#e5e7eb]",
    chipBorder: "border-[#2E5EB8]/30 dark:border-[#2E5EB8]/45",
    iconBg: "bg-[#2E5EB8]/12 dark:bg-[#2E5EB8]/28",
    iconText: "text-[#2E5EB8] dark:text-[#e5e7eb]",
  },
  pink: {
    chipBg: "bg-[#2E5EB8]/8 dark:bg-[#2E5EB8]/22",
    chipText: "text-[#2E5EB8] dark:text-[#e5e7eb]",
    chipBorder: "border-[#2E5EB8]/35 dark:border-[#2E5EB8]/50",
    iconBg: "bg-[#2E5EB8]/14 dark:bg-[#2E5EB8]/32",
    iconText: "text-[#2E5EB8] dark:text-[#e5e7eb]",
  },
};

function getColorClasses(color: string) {
  return colorMap[color] || colorMap.sky;
}

export default function WorkflowSection() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const headerInView = useInView(containerRef, {
    once: true,
    margin: "-100px 0px -20% 0px",
  });

  const listInView = useInView(listRef, {
    once: true,
    margin: "-80px 0px -20% 0px",
  });

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#F5F7FF] via-white to-white dark:from-slate-950 dark:via-slate-950 dark:to-slate-950 py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/0 via-white/40 to-white/0 dark:from-transparent dark:via-white/5 dark:to-transparent"
      />

      <div
        ref={containerRef}
        className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
      >
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
            <div className="pointer-events-none absolute inset-x-10 top-[4.5rem] h-px bg-gradient-to-r from-slate-200 via-[#2E5EB8]/35 to-slate-200 dark:from-slate-800 dark:via-[#2E5EB8]/40 dark:to-slate-800" />

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
                    duration: 0.5,
                    ease: [0.22, 0.61, 0.36, 1],
                    delay: listInView ? index * 0.1 : 0,
                  }}
                  className="relative"
                >
                  <div
                    className="relative flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm 
                               transition-all duration-300 hover:-translate-y-2 hover:border-[#2E5EB8]/40 hover:shadow-lg 
                               dark:border-slate-800 dark:bg-slate-900/95 dark:hover:border-[#2E5EB8]/50"
                  >
                    {/* số bước */}
                    <div
                      className={`absolute -top-4 left-1/2 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full border text-xs font-semibold ${colors.chipBg} ${colors.chipBorder} ${colors.chipText}`}
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
                    <h3 className="mb-2 text-base font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                      {step.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                      {step.desc}
                    </p>
                  </div>

                  {/* mũi tên nối (trừ bước cuối) */}
                  {index < steps.length - 1 && (
                    <div className="pointer-events-none absolute right-0 top-[4.6rem] z-10 translate-x-1/2 -translate-y-1/2">
                      <ArrowRight className="h-5 w-5 text-slate-300 dark:text-slate-600" />
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
                    duration: 0.5,
                    ease: [0.22, 0.61, 0.36, 1],
                    delay: listInView ? index * 0.1 : 0,
                  }}
                  className="relative flex gap-4"
                >
                  {/* cột số bước */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full border text-xs font-semibold ${colors.chipBg} ${colors.chipBorder} ${colors.chipText}`}
                    >
                      {step.number}
                    </div>
                    {step.number !== "04" && (
                      <div className="mt-2 min-h-[60px] w-px flex-1 bg-gradient-to-b from-slate-200 to-slate-200 dark:from-slate-800 dark:to-slate-800" />
                    )}
                  </div>

                  {/* card nội dung */}
                  <div
                    className="flex-1 rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-sm 
                               transition-all duration-300 hover:-translate-y-1 hover:border-[#2E5EB8]/40 hover:shadow-md 
                               dark:border-slate-800 dark:bg-slate-900/95 dark:hover:border-[#2E5EB8]/50"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${colors.iconBg}`}
                      >
                        <Icon className={`h-5 w-5 ${colors.iconText}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="mb-1.5 text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                          {step.title}
                        </h3>
                        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
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
