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
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
    },
    {
      icon: Headphones,
      title: "Luyện đề đủ 7 Part",
      desc: "Ngân hàng đề bám sát thi thật; thống kê độ khó, phân tích lỗi theo Part.",
      href: `${basePrefix}/practice`,
      cta: "Vào luyện đề",
      iconColor: "text-sky-600 dark:text-sky-400",
      bg: "bg-sky-50 dark:bg-sky-950/30",
    },
    {
      icon: MessageSquare,
      title: "Chat bot / Chat box",
      desc: "Hỏi đáp nhanh, giải thích ngữ pháp, gợi ý chiến lược làm bài theo ngữ cảnh.",
      href: `${basePrefix}/chat`,
      cta: "Mở chat",
      iconColor: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-50 dark:bg-indigo-950/30",
    },
    {
      icon: Users,
      title: "Cộng đồng",
      desc: "Chia sẻ kinh nghiệm, thảo luận mẹo làm bài và cập nhật tài nguyên mới.",
      href: `${basePrefix}/community`,
      cta: "Tham gia",
      iconColor: "text-violet-600 dark:text-violet-400",
      bg: "bg-violet-50 dark:bg-violet-950/30",
    },
    {
      icon: PlayCircle,
      title: "Học qua video",
      desc: "Bài giảng trọng tâm: từ vựng, ngữ pháp, chiến thuật từng Part.",
      href: `${basePrefix}/videos`,
      cta: "Xem video",
      iconColor: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/30",
    },
    {
      icon: BarChart3,
      title: "Dashboard tiến độ",
      desc: "Theo dõi điểm, thời gian, tỉ lệ đúng và streak; gợi ý bài kế tiếp.",
      href: `${basePrefix}/dashboard`,
      cta: "Xem dashboard",
      iconColor: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-50 dark:bg-rose-950/30",
    },
  ];

  return (
    <section id="features" className="bg-zinc-50 dark:bg-zinc-950 border-y border-zinc-200 dark:border-zinc-900 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeader
          eyebrow="Tính năng nổi bật"
          title="Tất cả công cụ để học TOEIC hiệu quả"
          desc="Hệ thống học tập toàn diện được thiết kế để giúp bạn đạt mục tiêu TOEIC của mình."
          align="center"
        />

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <Link
                key={index}
                href={feature.href}
                className="group relative block overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 p-6 shadow-sm border border-zinc-200 dark:border-zinc-800 transition-all duration-300 hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700"
              >
                <div className="flex flex-col">
                  {/* Icon */}
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl ${feature.bg} mb-4 transition-transform duration-300 group-hover:scale-110`}
                  >
                    <Icon className={`h-6 w-6 ${feature.iconColor} transition-transform duration-300 group-hover:scale-110`} />
                  </div>

                  {/* Content */}
                  <h3 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-white mb-2 transition-colors duration-300 group-hover:text-sky-600 dark:group-hover:text-sky-400">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 mb-4">
                    {feature.desc}
                  </p>

                  {/* CTA */}
                  <div className="mt-auto flex items-center gap-2 text-sm font-medium text-sky-600 dark:text-sky-400 transition-all duration-300 group-hover:gap-3">
                    <span>{feature.cta}</span>
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}