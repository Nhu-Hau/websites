// frontend/src/app/[locale]/community/new/page.tsx
import Header from "@/components/community/Header";
import NewPost from "@/components/community/NewPost";

type Params = { locale: string };

export default async function NewPostPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale } = await params; 
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-24">
      <Header locale={locale} active="community" />
      <NewPost />
    </div>
  );
}