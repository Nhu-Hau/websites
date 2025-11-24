// frontend/src/app/[locale]/study/create/page.tsx
import dynamic from "next/dynamic";
import { generateMetadata as genMeta, generateCanonical } from "@/lib/seo";
import { getTranslations } from "next-intl/server";

// Dynamic import client component nặng để tối ưu bundle size
const CreateStudyRoomPage = dynamic(() => import("@/components/features/study/CreateStudyRoomPage"));

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.study.meta.create" });
  const path = locale === "vi" ? "/study/create" : `/${locale}/study/create`;
  
  return genMeta({
    title: t("title"),
    description: t("description"),
    keywords: t("keywords").split(", "),
    canonical: generateCanonical(path, locale),
    ogType: "website",
  }, locale);
}

export default async function CreateStudyRoomWrapper({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return <CreateStudyRoomPage />;
}

