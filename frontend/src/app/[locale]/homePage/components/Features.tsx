import React from "react";
import Link from "next/link";
import SectionHeader from "./SectionHeader";
import {
  FiTarget,
  FiHeadphones,
  FiMessageSquare,
  FiUsers,
  FiPlayCircle,
  FiBarChart2,
  FiArrowRight,
} from "react-icons/fi";

export default function Features() {
  const features = [
    {
      icon: FiTarget,
      title: "Placement Test",
      desc: "Kiểm tra rút gọn để ước lượng điểm 0–990 và nhận lộ trình học cá nhân hoá.",
      href: "/placement",
      cta: "Làm ngay",
    },
    {
      icon: FiHeadphones,
      title: "Luyện đề đủ 7 Part",
      desc: "Ngân hàng đề bám sát thi thật; thống kê độ khó, phân tích lỗi theo Part.",
      href: "/tests",
      cta: "Vào luyện đề",
    },
    {
      icon: FiMessageSquare,
      title: "Chat bot / Chat box",
      desc: "Hỏi đáp nhanh, giải thích ngữ pháp, gợi ý chiến lược làm bài theo ngữ cảnh.",
      href: "/chat",
      cta: "Mở chat",
    },
    {
      icon: FiUsers,
      title: "Cộng đồng",
      desc: "Chia sẻ kinh nghiệm, thảo luận mẹo làm bài và cập nhật tài nguyên mới.",
      href: "/community",
      cta: "Tham gia",
    },
    {
      icon: FiPlayCircle,
      title: "Học qua video",
      desc: "Bài giảng trọng tâm: từ vựng, ngữ pháp, chiến thuật từng Part.",
      href: "/videos",
      cta: "Xem video",
    },
    {
      icon: FiBarChart2,
      title: "Dashboard tiến độ",
      desc: "Theo dõi điểm, thời gian, tỉ lệ đúng và streak; gợi ý bài kế tiếp.",
      href: "/dashboard",
      cta: "Xem dashboard",
    },
  ];

  return (
    <section id="features" className="py-8 bg-white dark:bg-zinc-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Tính năng nổi bật"
          title="TẤT CẢ CÔNG CỤ ĐỂ HỌC TOEIC HIỆU QUẢ"
        />

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <Link
                key={index}
                href={feature.href}
                className="group block rounded-xl border border-slate-200 bg-white p-6 transition-all hover:border-sky-300 hover:bg-sky-50/50 hover:shadow-sm dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-sky-600 dark:hover:bg-zinc-700/50"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-sky-100 text-sky-600 transition-colors group-hover:bg-sky-200 dark:bg-sky-900 dark:text-sky-400 dark:group-hover:bg-sky-800">
                    <Icon className="h-6 w-6" />
                  </div>

                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 dark:right:text-zinc-100">
                      {feature.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600 dark:text-zinc-400">
                      {feature.desc}
                    </p>

                    <div className="mt-4 flex items-center text-sm font-medium text-sky-600 transition-colors group-hover:text-sky-700 dark:text-sky-400 dark:group-hover:text-sky-300">
                      {feature.cta}
                      <FiArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-slate-600 dark:text-zinc-400">
            Bắt đầu với{" "}
            <Link
              href="/placement"
              className="font-medium text-sky-600 hover:text-sky-700 dark:text-sky-400"
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