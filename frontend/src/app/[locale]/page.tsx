//frontend/src/app/[locale]/(marketing)/home/page.tsx
import React from "react";
import dynamic from "next/dynamic";
import { Hero } from "@/components/features/marketing";
import { GoogleAuthEffect } from "@/components/features/auth/GoogleAuthEffect";
import { generateMetadata as genMeta, generateCanonical, SITE_CONFIG } from "@/lib/seo";
import { generateWebSiteSchema, generateFAQPageSchema, renderJsonLd } from "@/lib/seo/structured-data";
import { PageMotion } from "@/components/layout/PageMotion";

const SectionSkeleton = ({ label }: { label: string }) => (
  <section className="mx-auto my-10 w-full max-w-6xl animate-pulse rounded-3xl border border-slate-200/70 bg-white/60 p-6 text-sm text-slate-400 dark:border-zinc-800/70 dark:bg-zinc-900/50 dark:text-zinc-500">
    Đang tải {label}...
  </section>
);

const WorkflowSection = dynamic(() => import("@/components/features/marketing/WorkflowSection"), {
  loading: () => <SectionSkeleton label="quy trình" />,
});
const Testimonials = dynamic(() => import("@/components/features/marketing/Testimonials"), {
  loading: () => <SectionSkeleton label="cảm nhận học viên" />,
});
const Pricing = dynamic(() => import("@/components/features/marketing/Pricing"), {
  loading: () => <SectionSkeleton label="bảng giá" />,
});
const FAQSection = dynamic(() => import("@/components/features/marketing/FAQSection"), {
  loading: () => <SectionSkeleton label="FAQ" />,
});
const FinalCTA = dynamic(() => import("@/components/features/marketing/FinalCTA"), {
  loading: () => <SectionSkeleton label="lời kêu gọi hành động" />,
});

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const path = locale === "vi" ? "" : `/${locale}`;
  
  return genMeta({
    title: "Luyện thi TOEIC trực tuyến - Thi thử đề thật, chấm điểm nhanh",
    description: "Luyện thi TOEIC trực tuyến với hàng nghìn câu hỏi thực tế. Thi thử đề thật, chấm điểm nhanh, giải thích chi tiết. Học từ vựng, luyện nghe, đọc hiểu TOEIC hiệu quả.",
    keywords: [
      "TOEIC",
      "luyện thi TOEIC",
      "thi thử TOEIC",
      "học TOEIC online",
      "TOEIC practice test",
      "TOEIC listening",
      "TOEIC reading",
      "từ vựng TOEIC",
      "TOEIC online",
      "TOEIC test preparation",
    ],
    canonical: generateCanonical(path, locale),
    ogType: "website",
  }, locale);
}

export default async function HomePage({
  searchParams,
  params,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
  params: Promise<{ locale: string }>;
}) {
  const sp = await searchParams;
  const { locale } = await params;
  const auth = typeof sp.auth === "string" ? sp.auth : undefined;

  const websiteSchema = generateWebSiteSchema(SITE_CONFIG.url);
  const faqSchema = generateFAQPageSchema([
    {
      question: "TOEIC PREP là gì?",
      answer: "TOEIC PREP là nền tảng luyện thi TOEIC trực tuyến với hàng nghìn câu hỏi thực tế, giúp bạn chuẩn bị tốt nhất cho kỳ thi TOEIC.",
    },
    {
      question: "Làm thế nào để bắt đầu luyện thi TOEIC?",
      answer: "Bạn có thể đăng ký tài khoản miễn phí và bắt đầu làm bài thi thử TOEIC ngay. Hệ thống sẽ đánh giá trình độ và đề xuất lộ trình học phù hợp.",
    },
    {
      question: "Có những phần nào trong bài thi TOEIC?",
      answer: "Bài thi TOEIC gồm 7 phần: Part 1 (Photographs), Part 2 (Question-Response), Part 3 (Conversations), Part 4 (Talks), Part 5 (Incomplete Sentences), Part 6 (Text Completion), Part 7 (Reading Comprehension).",
    },
  ]);

  return (
    <>
      {renderJsonLd(websiteSchema)}
      {renderJsonLd(faqSchema)}
      <PageMotion className="min-h-screen bg-white dark:bg-zinc-950 antialiased">
        <GoogleAuthEffect auth={auth} />
        <Hero />
        <WorkflowSection />
        <Testimonials />
        <Pricing />
        <FAQSection />
        <FinalCTA />
      </PageMotion>
    </>
  );
}