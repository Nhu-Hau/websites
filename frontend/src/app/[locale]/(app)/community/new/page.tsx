// frontend/src/app/[locale]/community/new/page.tsx
import dynamic from "next/dynamic";
import { PageMotion } from "@/components/layout/PageMotion";
import { generateMetadata as genMeta, generateCanonical } from "@/lib/seo";

// Dynamic import client components để tối ưu bundle size
const NewPost = dynamic(
  () => import("@/components/features/community/NewPost")
);

type Params = { locale: string };

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { locale } = await params;
  const path = locale === "vi" ? "/community/new" : `/${locale}/community/new`;
  
  return genMeta({
    title: locale === "vi" ? "Tạo bài viết mới - TOEIC PREP" : "Create New Post - TOEIC PREP",
    description: locale === "vi" 
      ? "Tạo và chia sẻ bài viết mới trong cộng đồng TOEIC PREP. Chia sẻ kinh nghiệm, đặt câu hỏi và kết nối với cộng đồng học viên."
      : "Create and share new posts in TOEIC PREP community. Share experiences, ask questions and connect with learners.",
    keywords: ["TOEIC", "community", "forum", "discussion", "TOEIC PREP"],
    canonical: generateCanonical(path, locale),
    ogType: "website",
    noindex: true, // User-generated content pages should not be indexed
  }, locale);
}

export default async function NewPostPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <PageMotion className="mx-auto max-w-4xl px-4 py-6 lg:py-8 pt-20 lg:pt-28 pb-20 lg:pb-8">
        <NewPost />
      </PageMotion>
    </div>
  );
}

