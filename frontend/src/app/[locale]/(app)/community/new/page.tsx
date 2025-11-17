// frontend/src/app/[locale]/community/new/page.tsx
import dynamic from "next/dynamic";
import PageWrapper from "@/components/layout/PageWrapper";

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
    <PageWrapper>
      <NewPost />
    </PageWrapper>
  );
}
