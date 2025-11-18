// frontend/src/app/[locale]/community/new/page.tsx
import dynamic from "next/dynamic";

// Dynamic import client components để tối ưu bundle size
const NewPost = dynamic(
  () => import("@/components/features/community/NewPost")
);

type Params = { locale: string };

export default async function NewPostPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale } = await params;
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <main className="mx-auto max-w-4xl px-4 py-6 lg:py-8 pt-20 lg:pt-28 pb-20 lg:pb-8">
        <NewPost />
      </main>
    </div>
  );
}
