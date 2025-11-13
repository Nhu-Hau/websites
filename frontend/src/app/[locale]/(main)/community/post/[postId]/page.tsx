// frontend/src/app/[locale]/community/post/[postId]/page.tsx
import Header from "@/components/features/community/Header";
import PostDetail from "@/components/features/community/PostDetail";

type Params = { locale: string; postId: string };

export default async function PostDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale, postId } = await params; // ⟵ quan trọng

  return (
    <div className="min-h-screen w-full bg-gradient-to-b dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900 transition-colors duration-300">
      <Header locale={locale} active="community" />
      <PostDetail postId={postId} />
    </div>
  );
}