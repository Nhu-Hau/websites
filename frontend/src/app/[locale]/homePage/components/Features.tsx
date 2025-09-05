import React from "react";
import SectionHeader from "./SectionHeader";
import { FiHeadphones, FiEdit3, FiBarChart2, FiClock, FiZap, FiShield } from "react-icons/fi";

export default function Features() {
  const items = [
    { icon: <FiHeadphones className="text-sky-500" />, title: "Nghe hiểu chuẩn giọng bản xứ", desc: "Âm thanh rõ nét, đa giọng đọc; transcript & giải thích chi tiết." },
    { icon: <FiEdit3 className="text-pink-500" />, title: "Reading & Grammar theo điểm yếu", desc: "Đề xuất bài tập dựa trên lỗi thường gặp, lộ trình cá nhân hoá." },
    { icon: <FiBarChart2 className="text-violet-500" />, title: "Dashboard tiến bộ", desc: "Thống kê theo Part & kỹ năng, theo dõi điểm qua thời gian." },
    { icon: <FiClock className="text-amber-500" />, title: "Bộ đếm giờ như phòng thi", desc: "Ôn trong điều kiện sát thật, tối ưu chiến thuật làm bài." },
    { icon: <FiZap className="text-emerald-500" />, title: "Chấm điểm tức thì", desc: "Phản hồi ngay sau khi nộp, lời giải kèm mẹo làm nhanh." },
    { icon: <FiShield className="text-indigo-500" />, title: "Ngân hàng đề cập nhật", desc: "Bám sát format ETS mới nhất, kiểm duyệt kỹ." },
  ];
  return (
    // Thêm dark mode cho nền section
    <section id="features" className="bg-white dark:bg-zinc-800 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader
          eyebrow="Tính năng nổi bật"
          title="Tối ưu cho việc luyện đề và tăng điểm nhanh"
          desc="Thiết kế dựa trên hành trình học của hàng chục nghìn người dùng."
        />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it, i) => (
            <div
              key={i}
              // Thêm dark mode cho đường viền
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 dark:bg-zinc-700">
                <span className="text-xl">{it.icon}</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-zinc-100">{it.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-zinc-400">{it.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}