// frontend/src/app/[locale]/community/post/[postId]/page.tsx
import dynamic from "next/dynamic";
import { PageMotion } from "@/components/layout/PageMotion";

// Dynamic import client components để tối ưu bundle size
const PostDetail = dynamic(
  () => import("@/components/features/community/PostDetail")
);

type Params = { locale: string; postId: string };

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