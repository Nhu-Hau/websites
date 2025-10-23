// frontend/src/app/[locale]/community/post/[postId]/page.tsx
import Header from "@/components/community/Header";
import PostDetail from "@/components/community/PostDetail";

type Params = { locale: string; postId: string };

export default async function PostDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale, postId } = await params; // ⟵ quan trọng

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16">
      <Header locale={locale} active="community" />
      <PostDetail postId={postId} />
    </div>
  );
}