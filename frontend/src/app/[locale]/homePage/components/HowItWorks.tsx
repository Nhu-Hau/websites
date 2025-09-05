import React from "react";
import SectionHeader from "./SectionHeader";

export default function HowItWorks() {
  const steps = [
    { step: "01", title: "Chọn mục tiêu điểm", desc: "Hệ thống gợi ý lộ trình theo thời gian & điểm mong muốn." },
    { step: "02", title: "Luyện theo Part", desc: "Listening/Reading chia nhỏ theo kỹ năng, tăng dần độ khó." },
    { step: "03", title: "Thi thử Full Test", desc: "Mô phỏng điều kiện thật, đồng bộ thiết bị, chống phân tâm." },
    { step: "04", title: "Phân tích & cải thiện", desc: "Xem báo cáo, tìm điểm yếu, nhận bài tập nhắm trúng lỗi." },
  ];

  const colors = [
    "bg-sky-100 text-sky-600 dark:bg-sky-900 dark:text-sky-300",
    "bg-pink-100 text-pink-600 dark:bg-pink-900 dark:text-pink-300",
    "bg-violet-100 text-violet-600 dark:bg-violet-900 dark:text-violet-300",
    "bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300",
  ];

  return (
    <section className="bg-slate-50 dark:bg-zinc-900 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader
          eyebrow="Cách hoạt động"
          title="4 bước để tăng điểm TOEIC bền vững"
          desc="Học thông minh hơn — không phải học nhiều hơn."
        />
        <ol className="mt-10 grid gap-6 md:grid-cols-4">
          {steps.map((s, i) => (
            <li
              key={s.step}
              // Thay thế slate bằng zinc ở đây
              className="relative flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-zinc-700 dark:bg-zinc-800"
            >
              <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full ${colors[i % colors.length]} transition-transform duration-200 ease-out group-hover:scale-105`}>
                <span className="text-sm font-bold">{s.step}</span>
              </div>
              {/* Thay thế slate bằng zinc ở đây */}
              <h4 className="mt-2 text-lg font-semibold text-slate-900 dark:text-zinc-100">{s.title}</h4>
              {/* Thay thế slate bằng zinc ở đây */}
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-zinc-400">{s.desc}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}