// frontend/src/app/[locale]/community/post/[postId]/page.tsx
import dynamic from "next/dynamic";
import { PageMotion } from "@/components/layout/PageMotion";
import { generateMetadata as genMeta, generateCanonical } from "@/lib/seo";

// Dynamic import client components để tối ưu bundle size
const PostDetail = dynamic(
  () => import("@/components/features/community/PostDetail")
);

type Params = { locale: string; postId: string };

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { locale, postId } = await params;
  const path = locale === "vi" ? `/community/post/${postId}` : `/${locale}/community/post/${postId}`;
  
  return genMeta({
    title: locale === "vi" ? "Bài viết cộng đồng - TOEIC PREP" : "Community Post - TOEIC PREP",
    description: locale === "vi"
      ? "Xem bài viết và thảo luận trong cộng đồng TOEIC PREP. Chia sẻ kinh nghiệm học tập và kết nối với cộng đồng."
      : "View post and discussion in TOEIC PREP community. Share learning experiences and connect with the community.",
    keywords: ["TOEIC", "community", "forum", "discussion", "TOEIC PREP"],
    canonical: generateCanonical(path, locale),
    ogType: "article",
    noindex: true, // User-generated content pages should not be indexed
  }, locale);
}

export default async function PostDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale, postId } = await params; // ⟵ quan trọng

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <PageMotion className="mx-auto max-w-4xl px-4 py-6 lg:py-8 pt-20 lg:pt-28 pb-20 lg:pb-8">
        <PostDetail postId={postId} />
      </PageMotion>
    </div>
  );
}