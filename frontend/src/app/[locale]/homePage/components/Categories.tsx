import React from "react";
import Link from "next/link";
import SectionHeader from "./SectionHeader";
import { FiHeadphones, FiBookOpen, FiEdit3, FiZap } from "react-icons/fi";

export default function Categories() {
  const cats = [
    { icon: <FiHeadphones />, name: "Listening (Part 1–4)", href: "/practice/listening" },
    { icon: <FiBookOpen />, name: "Reading (Part 5–7)", href: "/practice/reading" },
    { icon: <FiEdit3 />, name: "Ngữ pháp", href: "/practice/grammar" },
    { icon: <FiZap />, name: "Từ vựng tốc độ", href: "/practice/vocab" },
  ];
  return (
    <section className="bg-white py-10 dark:bg-zinc-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader
          eyebrow="Bắt đầu ngay"
          title="Chọn kỹ năng bạn muốn luyện"
          desc="Mỗi mục có lộ trình và mức độ phù hợp với mục tiêu điểm."
        />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 md:grid-cols-4">
          {cats.map((c) => (
            <Link
              key={c.name}
              href={c.href}
              className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900"
            >
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white dark:bg-zinc-700 dark:text-zinc-200">
                {c.icon}
              </div>
              <span className="text-sm font-semibold text-slate-800 group-hover:text-slate-900 dark:text-zinc-200 dark:group-hover:text-white">
                {c.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}