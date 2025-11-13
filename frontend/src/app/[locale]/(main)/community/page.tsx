//frontend/src/app/[locale]/community/page.tsx
import dynamic from "next/dynamic";
import PageWrapper from "@/components/layout/PageWrapper";

// Dynamic import client components để tối ưu bundle size
const Header = dynamic(() => import("@/components/features/community/Header"));
const CommunityComponent = dynamic(
  () => import("@/components/features/community/CommunityPage")
);

type Params = { locale: string };

export default async function CommunityPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale } = await params;

  return (
    <PageWrapper>
      <Header locale={locale} active="community" />
      <CommunityComponent />
    </PageWrapper>
  );
}
