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
    <section className="bg-gradient-to-b from-white via-sky-50/20 to-white dark:from-zinc-900 dark:via-zinc-900/95 dark:to-zinc-900">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeader
          eyebrow="Cảm nhận người học"
          title="Hàng nghìn người đã tăng điểm"
          desc="Kinh nghiệm thật – kết quả thật."
          align="center"
        />

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {items.map((t) => (
            <figure
              key={t.name}
              className="relative overflow-hidden rounded-3xl bg-white/95 dark:bg-zinc-800/95 backdrop-blur-xl p-8 shadow-xl ring-2 ring-slate-200/70 dark:ring-zinc-700/70"
            >
              {/* Quote icon tĩnh, không opacity thay đổi */}
              <div className="pointer-events-none absolute -right-6 -top-6 opacity-20">
                <Quote className="h-32 w-32 text-sky-600 dark:text-sky-500" />
              </div>

              {/* Quote content */}
              <blockquote className="relative text-base leading-7 text-slate-700 dark:text-zinc-300">
                <span className="absolute -left-2 -top-1 text-6xl font-black text-sky-200 dark:text-sky-800">
                  “
                </span>
                <p className="relative pl-6 font-medium">{t.quote}</p>
              </blockquote>

              {/* Author + Score */}
              <figcaption className="mt-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <TestimonialAvatar src={t.avatar} alt={t.name} />
                    {/* Không overlay khi hover */}
                  </div>
                  <div>
                    <div className="text-base font-black tracking-tight text-slate-900 dark:text-zinc-100">
                      {t.name}
                    </div>
                    <div className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                      Học viên TOEIC
                    </div>
                  </div>
                </div>

                {/* Score badge – tĩnh, không glow, không hover */}
                <span className="rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 py-2 text-sm font-black text-white shadow-md">
                  {t.score}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>

        {/* Stats bar – tĩnh, sạch sẽ */}
        <div className="mt-16 text-center">
          <p className="text-lg font-bold text-slate-700 dark:text-zinc-300">
            <span className="text-2xl text-sky-600 dark:text-sky-400">98%</span>{" "}
            học viên cải thiện điểm số sau{" "}
            <span className="text-2xl text-emerald-600 dark:text-emerald-400">
              4 tuần
            </span>{" "}
            luyện tập đều đặn.
          </p>
          <div className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-zinc-400">
            <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            Dữ liệu từ 12.000+ học viên
          </div>
        </div>
      </div>
    </section>
  );
}
