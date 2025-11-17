// frontend/src/app/[locale]/community/post/[postId]/page.tsx
import dynamic from "next/dynamic";
import PageWrapper from "@/components/layout/PageWrapper";

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
    <PageWrapper>
      <PostDetail postId={postId} />
    </PageWrapper>
  );
}