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
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
    },
    {
      icon: Headphones,
      title: "Luyện đề đủ 7 Part",
      desc: "Ngân hàng đề bám sát thi thật; thống kê độ khó, phân tích lỗi theo Part.",
      href: `${basePrefix}/practice`,
      cta: "Vào luyện đề",
      iconColor: "text-sky-600 dark:text-sky-400",
      bg: "bg-sky-50 dark:bg-sky-900/20",
    },
    {
      icon: MessageSquare,
      title: "Chat bot / Chat box",
      desc: "Hỏi đáp nhanh, giải thích ngữ pháp, gợi ý chiến lược làm bài theo ngữ cảnh.",
      href: `${basePrefix}/chat`,
      cta: "Mở chat",
      iconColor: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-50 dark:bg-indigo-900/20",
    },
    {
      icon: Users,
      title: "Cộng đồng",
      desc: "Chia sẻ kinh nghiệm, thảo luận mẹo làm bài và cập nhật tài nguyên mới.",
      href: `${basePrefix}/community`,
      cta: "Tham gia",
      iconColor: "text-violet-600 dark:text-violet-400",
      bg: "bg-violet-50 dark:bg-violet-900/20",
    },
    {
      icon: PlayCircle,
      title: "Học qua video",
      desc: "Bài giảng trọng tâm: từ vựng, ngữ pháp, chiến thuật từng Part.",
      href: `${basePrefix}/videos`,
      cta: "Xem video",
      iconColor: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-900/20",
    },
    {
      icon: BarChart3,
      title: "Dashboard tiến độ",
      desc: "Theo dõi điểm, thời gian, tỉ lệ đúng và streak; gợi ý bài kế tiếp.",
      href: `${basePrefix}/dashboard`,
      cta: "Xem dashboard",
      iconColor: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-50 dark:bg-rose-900/20",
    },
  ];

  return (
    <section id="features" className="py-8 bg-white dark:bg-zinc-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Tính năng nổi bật"
          title="TẤT CẢ CÔNG CỤ ĐỂ HỌC TOEIC HIỆU QUẢ"
          align="center"
        />

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <Link
                key={index}
                href={feature.href}
                className="group block rounded-2xl border border-zinc-200 dark:border-zinc-700 p-6 bg-white dark:bg-zinc-800 transition-all duration-300 hover:border-sky-300 dark:hover:border-sky-600 hover:shadow-sm hover:-translate-y-0.5"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${feature.bg} transition-all duration-300 group-hover:shadow-sm`}
                  >
                    <Icon className={`h-5 w-5 ${feature.iconColor}`} />
                  </div>

                  <div className="flex-1">
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 group-hover:font-bold transition-font-weight duration-300">
                      {feature.title}
                    </h3>
                    <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                      {feature.desc}
                    </p>

                    <div className="mt-4 flex items-center text-sm font-medium transition-all duration-300 group-hover:font-bold">
                      <span className={feature.iconColor}>{feature.cta}</span>
                      <ArrowRight
                        className={`ml-1 h-4 w-4 ${feature.iconColor} transition-transform duration-300 group-hover:translate-x-0.5`}
                      />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-16 text-center">
          <p className="text-base text-zinc-600 dark:text-zinc-400">
            Bắt đầu với{" "}
            <Link
              href={`${basePrefix}/placement`}
              className="font-medium text-emerald-600 dark:text-emerald-400 hover:underline underline-offset-4 transition-all"
            >
              Placement Test
            </Link>{" "}
            để nhận lộ trình học phù hợp nhất với bạn.
          </p>
        </div>
      </div>
    </section>
  );
}
