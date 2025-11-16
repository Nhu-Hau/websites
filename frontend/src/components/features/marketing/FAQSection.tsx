"use client";
import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import SectionHeader from "./SectionHeader";

type FAQItem = {
  question: string;
  answer: string;
};

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FAQItem[] = [
    {
      question: "Placement Test có mất phí không?",
      answer: "Không, Placement Test hoàn toàn miễn phí. Bạn có thể làm bài kiểm tra để xác định trình độ của mình mà không cần trả phí.",
    },
    {
      question: "Tôi có thể làm Placement Test bao nhiêu lần?",
      answer: "Bạn có thể làm Placement Test một lần để nhận lộ trình học ban đầu. Nếu bạn muốn đánh giá lại trình độ sau một thời gian học tập, vui lòng liên hệ với bộ phận hỗ trợ.",
    },
    {
      question: "Lộ trình học được cá nhân hóa như thế nào?",
      answer: "Dựa trên kết quả Placement Test, hệ thống sẽ phân tích điểm mạnh và điểm yếu của bạn, sau đó đề xuất lộ trình học phù hợp với từng Part và Level phù hợp với khả năng của bạn.",
    },
    {
      question: "Gói Premium có gì khác biệt so với gói Miễn phí?",
      answer: "Gói Premium cung cấp luyện đề không giới hạn, Full Test với giải thích chi tiết, truy cập AI Chat và Admin Chat, tải file từ giảng viên, phân tích lỗi nâng cao, và hỗ trợ ưu tiên. Gói Miễn phí giới hạn 20 bài/tháng và chỉ có báo cáo cơ bản.",
    },
    {
      question: "Tôi có thể hủy gói Premium bất cứ lúc nào không?",
      answer: "Có, bạn có thể hủy gói Premium bất cứ lúc nào. Bạn sẽ tiếp tục được sử dụng các tính năng Premium cho đến hết chu kỳ thanh toán hiện tại.",
    },
    {
      question: "Hệ thống có hỗ trợ tiếng Anh không?",
      answer: "Hiện tại, giao diện chính của hệ thống được thiết kế bằng tiếng Việt để phục vụ tốt nhất cho học viên Việt Nam. Tuy nhiên, tất cả nội dung bài thi và câu hỏi đều bằng tiếng Anh như trong kỳ thi TOEIC thật.",
    },
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="bg-zinc-50 dark:bg-zinc-950 border-y border-zinc-200 dark:border-zinc-900 py-16">
      <div className="mx-auto max-w-5xl px-6 lg:px-8">
        <SectionHeader
          eyebrow="Câu hỏi thường gặp"
          title="Có thắc mắc? Chúng tôi sẵn sàng trả lời"
          desc="Tìm câu trả lời cho những câu hỏi phổ biến về nền tảng học TOEIC của chúng tôi."
          align="center"
        />

        <div className="mt-12 space-y-4 mx-auto max-w-3xl">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="group rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all duration-300 hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 rounded-xl"
                aria-expanded={openIndex === index}
                aria-controls={`faq-answer-${index}`}
              >
                <span className="text-base font-semibold text-zinc-900 dark:text-white pr-8">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-zinc-500 dark:text-zinc-400 transition-transform duration-300 ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                id={`faq-answer-${index}`}
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className="px-6 pb-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 mt-5">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-5 text-center">
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
            Vẫn còn thắc mắc?
          </p>
          <a
            href="mailto:support@toeicprep.com"
            className="inline-flex items-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md"
          >
            Liên hệ hỗ trợ
          </a>
        </div>
      </div>
    </section>
  );
}


