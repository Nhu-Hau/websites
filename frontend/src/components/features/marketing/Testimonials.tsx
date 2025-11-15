import React from "react";
import SectionHeader from "./SectionHeader";
import { TestimonialAvatar } from "./TestimonialAvatar";
import { Quote, TrendingUp } from "lucide-react";

type Testimonial = {
  avatar: string;
  name: string;
  score: string;
  quote: string;
};

export default function Testimonials() {
  const items: Testimonial[] = [
    {
      avatar:
        "https://s3.ap-southeast-2.amazonaws.com/project.toeic/avatar/z7203367134559_612727cf573abc8ec005237bed66d4e5.jpg",
      name: "Ngọc Hân",
      score: "+180 điểm",
      quote:
        "Sau bài placement test, hệ thống gợi ý level cho từng part — mình yếu Part 2 và 3 nên tập trung luyện ở đó. Cực kỳ hiệu quả!",
    },
    {
      avatar:
        "https://s3.ap-southeast-2.amazonaws.com/project.toeic/avatar/z7203365126878_782dbc071de3ae09c786b97567af1258.jpg",
      name: "Trung Kiên",
      score: "+200 điểm",
      quote:
        "Web chia level rõ ràng, luyện đúng khả năng nên không bị nản. Sau 1 tháng mình tăng điểm Listening rõ rệt.",
    },
    {
      avatar:
        "https://s3.ap-southeast-2.amazonaws.com/project.toeic/avatar/z7203369078456_b4b64b073b9f5a6ffc067aaceb87f379.jpg",
      name: "Mai Linh",
      score: "+165 điểm",
      quote:
        "Mỗi part đều có đề cập nhật, lời giải chi tiết và báo cáo tiến bộ sau từng buổi luyện. Mình cảm giác như được kèm riêng vậy!",
    },
  ];

  return (
    <section className="bg-zinc-50 dark:bg-zinc-950 border-y border-zinc-200 dark:border-zinc-900 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeader
          eyebrow="Cảm nhận người học"
          title="Hàng nghìn người đã tăng điểm"
          desc="Kinh nghiệm thật – kết quả thật từ những học viên đã sử dụng nền tảng của chúng tôi."
          align="center"
        />

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {items.map((t, index) => (
            <figure
              key={index}
              className="relative overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 p-6 shadow-sm border border-zinc-200 dark:border-zinc-800 transition-all duration-300 hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700"
            >
              {/* Quote icon - subtle background */}
              <div className="pointer-events-none absolute -right-4 -top-4 opacity-5">
                <Quote className="h-24 w-24 text-zinc-900 dark:text-white" />
              </div>

              {/* Quote content */}
              <blockquote className="relative mb-6">
                <span className="absolute -left-1 -top-2 text-4xl font-bold text-zinc-200 dark:text-zinc-800 leading-none">
                  "
                </span>
                <p className="relative pl-4 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 font-medium">
                  {t.quote}
                </p>
              </blockquote>

              {/* Author + Score */}
              <figcaption className="flex items-center justify-between gap-4 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <TestimonialAvatar src={t.avatar} alt={t.name} />
                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-zinc-900 bg-emerald-500" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                      {t.name}
                    </div>
                    <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      Học viên TOEIC
                    </div>
                  </div>
                </div>

                {/* Score badge */}
                <span className="shrink-0 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm">
                  {t.score}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>

        {/* Stats bar */}
        <div className="mt-16 text-center">
          <p className="text-base font-medium text-zinc-700 dark:text-zinc-300">
            <span className="text-2xl font-bold text-sky-600 dark:text-sky-400">98%</span>{" "}
            học viên cải thiện điểm số sau{" "}
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              4 tuần
            </span>{" "}
            luyện tập đều đặn.
          </p>
          <div className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
            <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            Dữ liệu từ 12.000+ học viên
          </div>
        </div>
      </div>
    </section>
  );
}