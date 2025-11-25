// frontend/src/app/[locale]/(app)/study/teacher-register/page.tsx
import dynamic from "next/dynamic";
import { generateMetadata as genMeta, generateCanonical } from "@/lib/seo";
import { getTranslations } from "next-intl/server";

// Dynamic import client component
const TeacherRegisterPage = dynamic(
  () => import("@/components/features/study/TeacherRegisterPage")
);

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.study.meta.teacher" });
  const path = locale === "vi" ? "/study/teacher-register" : `/${locale}/study/teacher-register`;
  
  return genMeta({
    title: t("title"),
    description: t("description"),
    keywords: t("keywords").split(", "),
    canonical: generateCanonical(path, locale),
    ogType: "website",
  }, locale);
}

export default async function TeacherRegisterWrapper({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return <TeacherRegisterPage />;
}

