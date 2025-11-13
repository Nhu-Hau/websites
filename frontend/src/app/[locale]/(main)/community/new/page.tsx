// frontend/src/app/[locale]/community/new/page.tsx
import Header from "@/components/features/community/Header";
import NewPost from "@/components/features/community/NewPost";

type Params = { locale: string };

export default async function NewPostPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale } = await params;
  return (
    <div className="min-h-screen w-full bg-gradient-to-b dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900 transition-colors duration-300">
      <Header locale={locale} active="community" />
      <NewPost />
    </div>
  );
}
