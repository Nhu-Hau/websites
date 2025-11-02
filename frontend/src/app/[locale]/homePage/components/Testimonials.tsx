import React from "react";
import Image from "next/image";
import SectionHeader from "./SectionHeader";

export default function Testimonials() {
  const items = [
    {
      avatar: "https://images.unsplash.com/photo-1607746882042-944635dfe10e",
      name: "Ngọc Hân",
      score: "+180 điểm",
      quote:
        "Sau bài placement test, hệ thống gợi ý level cho từng part — mình yếu Part 2 và 3 nên tập trung luyện ở đó. Cực kỳ hiệu quả!",
    },
    {
      avatar:
        "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg",
      name: "Trung Kiên",
      score: "+200 điểm",
      quote:
        "Web chia level rõ ràng, luyện đúng khả năng nên không bị nản. Sau 1 tháng mình tăng điểm Listening rõ rệt.",
    },
    {
      avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36",
      name: "Mai Linh",
      score: "+165 điểm",
      quote:
        "Mỗi part đều có đề cập nhật, lời giải chi tiết và báo cáo tiến bộ sau từng buổi luyện. Mình cảm giác như được kèm riêng vậy!",
    },
  ];

  return (
    <section className="bg-slate-50 py-10 dark:bg-zinc-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader
          eyebrow="Cảm nhận người học"
          title="Hàng nghìn người đã tăng điểm"
          desc="Kinh nghiệm thật – kết quả thật."
        />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {items.map((t) => (
            <figure
              key={t.name}
              className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800"
            >
              <blockquote className="text-sm leading-6 text-slate-700 dark:text-zinc-300">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-4 flex items-center justify-between">
                {/* Bố cục cho avatar và tên */}
                <div className="flex items-center gap-3">
                  <Image
                    src={t.avatar}
                    alt={t.name}
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-full object-cover"
                  />

                  <div className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                    {t.name}
                  </div>
                </div>
                {/* Huy hiệu điểm */}
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400">
                  {t.score}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
