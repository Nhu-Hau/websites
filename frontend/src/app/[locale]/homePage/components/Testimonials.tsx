"use client"
import React, { useState } from "react";
import Image from "next/image";
import SectionHeader from "./SectionHeader";

type Testimonial = {
  avatar: string;
  name: string;
  score: string;
  quote: string;
};

function Avatar({ src, alt }: { src: string; alt: string }) {
  const [imgSrc, setImgSrc] = useState(src);
  const fallback =
    "https://s3.ap-southeast-2.amazonaws.com/project.toeic/avatar/default-avatar.png"; // đặt 1 ảnh dự phòng

  return (
    <Image
      src={imgSrc}
      alt={alt}
      width={40}
      height={40}
      sizes="40px"
      className="h-10 w-10 rounded-full object-cover"
      onError={() => setImgSrc(fallback)}
      loading="lazy"
    />
  );
}

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
                <div className="flex items-center gap-3">
                  <Avatar src={t.avatar} alt={t.name} />
                  <div className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                    {t.name}
                  </div>
                </div>
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
