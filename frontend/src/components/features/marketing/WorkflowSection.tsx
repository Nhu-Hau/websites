"use client";
import React from "react";
import { FileText, Route, Target, TrendingUp, ArrowRight } from "lucide-react";
import SectionHeader from "./SectionHeader";

export default function WorkflowSection() {
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
      color: "indigo",
    },
    {
      number: "04",
      icon: TrendingUp,
      title: "Theo dõi tiến độ",
      desc: "Xem báo cáo chi tiết, phân tích lỗi và theo dõi sự tiến bộ của bạn theo thời gian.",
      color: "violet",
    },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      emerald: {
        bg: "bg-emerald-50 dark:bg-emerald-950/30",
        text: "text-emerald-600 dark:text-emerald-400",
        border: "border-emerald-200 dark:border-emerald-900",
      },
      sky: {
        bg: "bg-sky-50 dark:bg-sky-950/30",
        text: "text-sky-600 dark:text-sky-400",
        border: "border-sky-200 dark:border-sky-900",
      },
      indigo: {
        bg: "bg-indigo-50 dark:bg-indigo-950/30",
        text: "text-indigo-600 dark:text-indigo-400",
        border: "border-indigo-200 dark:border-indigo-900",
      },
      violet: {
        bg: "bg-violet-50 dark:bg-violet-950/30",
        text: "text-violet-600 dark:text-violet-400",
        border: "border-violet-200 dark:border-violet-900",
      },
    };
    return colors[color] || colors.sky;
  };

  return (
    <section className="bg-white dark:bg-zinc-950 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeader
          eyebrow="Quy trình học"
          title="Học TOEIC hiệu quả trong 4 bước đơn giản"
          desc="Từ việc xác định trình độ đến việc đạt được mục tiêu điểm số của bạn."
          align="center"
        />

        <div className="mt-16 lg:mt-20">
          {/* Desktop: Horizontal layout */}
          <div className="hidden lg:grid lg:grid-cols-4 lg:gap-8 relative">
            {/* Connector lines */}
            <div className="absolute top-16 left-16 right-16 h-0.5 bg-gradient-to-r from-emerald-200 via-sky-200 via-indigo-200 to-violet-200 dark:from-emerald-900 dark:via-sky-900 dark:via-indigo-900 dark:to-violet-900" />
            
            {steps.map((step, index) => {
              const Icon = step.icon;
              const colors = getColorClasses(step.color);
              
              return (
                <div key={index} className="relative">
                  <div className="relative bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all duration-300 hover:border-zinc-300 dark:hover:border-zinc-700">
                    {/* Step number badge */}
                    <div className={`absolute -top-4 left-1/2 -translate-x-1/2 flex h-8 w-8 items-center justify-center rounded-full ${colors.bg} border-2 ${colors.border} text-xs font-bold ${colors.text}`}>
                      {step.number}
                    </div>
                    
                    {/* Icon */}
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${colors.bg} mb-4 mt-4`}>
                      <Icon className={`h-6 w-6 ${colors.text}`} />
                    </div>
                    
                    {/* Content */}
                    <h3 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-white mb-2">
                      {step.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                      {step.desc}
                    </p>
                  </div>
                  
                  {/* Arrow connector (hidden on last item) */}
                  {index < steps.length - 1 && (
                    <div className="absolute top-16 right-0 translate-x-1/2 -translate-y-1/2 z-10">
                      <ArrowRight className="h-5 w-5 text-zinc-400 dark:text-zinc-600" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Mobile/Tablet: Vertical layout */}
          <div className="lg:hidden space-y-6">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const colors = getColorClasses(step.color);
              
              return (
                <div key={index} className="relative flex gap-4">
                  {/* Step number + connector */}
                  <div className="flex flex-col items-center">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${colors.bg} border-2 ${colors.border} text-sm font-bold ${colors.text} shrink-0`}>
                      {step.number}
                    </div>
                    {index < steps.length - 1 && (
                      <div className="mt-2 h-full w-0.5 bg-gradient-to-b from-zinc-200 to-zinc-200 dark:from-zinc-800 dark:to-zinc-800 flex-1 min-h-[60px]" />
                    )}
                  </div>
                  
                  {/* Content card */}
                  <div className="flex-1 bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="flex items-start gap-4">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors.bg} shrink-0`}>
                        <Icon className={`h-5 w-5 ${colors.text}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-white mb-2">
                          {step.title}
                        </h3>
                        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
