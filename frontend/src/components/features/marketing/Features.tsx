"use client";
import React from "react";
import Link from "next/link";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";
import SectionHeader from "./SectionHeader";
import {
  Target,
  Headphones,
  MessageSquare,
  Users,
  PlayCircle,
  BarChart3,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export default function Features() {
  const basePrefix = useBasePrefix();
  const features = [
    {
      icon: Target,
      title: "Placement Test",
      desc: "Kiểm tra rút gọn để ước lượng điểm 0–990 và nhận lộ trình học cá nhân hoá.",
      href: `${basePrefix}/placement`,
      cta: "Làm ngay",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-gradient-to-br from-emerald-50 to-emerald-100/60 dark:from-emerald-900/30 dark:to-emerald-800/20",
      ring: "ring-emerald-200/70 dark:ring-emerald-700/40",
    },
    {
      icon: Headphones,
      title: "Luyện đề đủ 7 Part",
      desc: "Ngân hàng đề bám sát thi thật; thống kê độ khó, phân tích lỗi theo Part.",
      href: `${basePrefix}/practice`,
      cta: "Vào luyện đề",
      iconColor: "text-sky-600 dark:text-sky-400",
      bg: "bg-gradient-to-br from-sky-50 to-sky-100/60 dark:from-sky-900/30 dark:to-sky-800/20",
      ring: "ring-sky-200/70 dark:ring-sky-700/40",
    },
    {
      icon: MessageSquare,
      title: "Chat bot / Chat box",
      desc: "Hỏi đáp nhanh, giải thích ngữ pháp, gợi ý chiến lược làm bài theo ngữ cảnh.",
      href: `${basePrefix}/chat`,
      cta: "Mở chat",
      iconColor: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-gradient-to-br from-indigo-50 to-indigo-100/60 dark:from-indigo-900/30 dark:to-indigo-800/20",
      ring: "ring-indigo-200/70 dark:ring-indigo-700/40",
    },
    {
      icon: Users,
      title: "Cộng đồng",
      desc: "Chia sẻ kinh nghiệm, thảo luận mẹo làm bài và cập nhật tài nguyên mới.",
      href: `${basePrefix}/community`,
      cta: "Tham gia",
      iconColor: "text-violet-600 dark:text-violet-400",
      bg: "bg-gradient-to-br from-violet-50 to-violet-100/60 dark:from-violet-900/30 dark:to-violet-800/20",
      ring: "ring-violet-200/70 dark:ring-violet-700/40",
    },
    {
      icon: PlayCircle,
      title: "Học qua video",
      desc: "Bài giảng trọng tâm: từ vựng, ngữ pháp, chiến thuật từng Part.",
      href: `${basePrefix}/videos`,
      cta: "Xem video",
      iconColor: "text-amber-600 dark:text-amber-400",
      bg: "bg-gradient-to-br from-amber-50 to-amber-100/60 dark:from-amber-900/30 dark:to-amber-800/20",
      ring: "ring-amber-200/70 dark:ring-amber-700/40",
    },
    {
      icon: BarChart3,
      title: "Dashboard tiến độ",
      desc: "Theo dõi điểm, thời gian, tỉ lệ đúng và streak; gợi ý bài kế tiếp.",
      href: `${basePrefix}/dashboard`,
      cta: "Xem dashboard",
      iconColor: "text-rose-600 dark:text-rose-400",
      bg: "bg-gradient-to-br from-rose-50 to-rose-100/60 dark:from-rose-900/30 dark:to-rose-800/20",
      ring: "ring-rose-200/70 dark:ring-rose-700/40",
    },
  ];

  return (
    <section id="features" className="py-10 bg-gradient-to-b from-white via-sky-50/30 to-white dark:from-zinc-900 dark:via-zinc-900/95 dark:to-zinc-900">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeader
          eyebrow="Tính năng nổi bật"
          title="TẤT CẢ CÔNG CỤ ĐỂ HỌC TOEIC HIỆU QUẢ"
          align="center"
        />

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <Link
                key={index}
                href={feature.href}
                className="group relative block overflow-hidden rounded-3xl bg-white/90 dark:bg-zinc-800/90 backdrop-blur-xl p-7 shadow-xl ring-2 ring-slate-200/70 dark:ring-zinc-700/70 transition-all duration-300 hover:shadow-2xl hover:ring-sky-300 dark:hover:ring-sky-600 hover:-translate-y-1"
              >
                {/* Không glow – chỉ overlay nhẹ khi hover */}
                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <div className="absolute inset-0 bg-gradient-to-br from-sky-100/30 to-transparent dark:from-sky-700/20" />
                </div>

                <div className="relative flex items-start gap-5">
                  {/* Icon container – 3D, hover scale */}
                  <div
                    className={`flex h-16 w-16 items-center justify-center rounded-3xl ${feature.bg} ring-2 ${feature.ring} transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg`}
                  >
                    <Icon className={`h-8 w-8 ${feature.iconColor} transition-transform duration-300 group-hover:scale-110`} />
                  </div>

                  <div className="flex-1 space-y-3">
                    <h3 className="text-xl font-black tracking-tight text-slate-900 transition-colors duration-300 group-hover:text-sky-700 dark:text-zinc-100 dark:group-hover:text-sky-400">
                      {feature.title}
                    </h3>
                    <p className="text-base leading-relaxed text-slate-700 dark:text-zinc-300 font-medium">
                      {feature.desc}
                    </p>

                    <div className="flex items-center gap-2.5 pt-2 text-base font-bold text-sky-600 transition-all duration-300 group-hover:text-sky-700 dark:text-sky-400 dark:group-hover:text-sky-300">
                      <span>{feature.cta}</span>
                      <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1.5" />
                    </div>
                  </div>
                </div>

                {/* Mini sparkle khi hover */}
                <Sparkles className="absolute -top-1 -right-1 h-6 w-6 text-amber-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}