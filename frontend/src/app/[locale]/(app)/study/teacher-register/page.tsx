// frontend/src/app/[locale]/(app)/study/teacher-register/page.tsx
import dynamic from "next/dynamic";

// Dynamic import client component
const TeacherRegisterPage = dynamic(
  () => import("@/components/features/study/TeacherRegisterPage")
);

export default async function TeacherRegisterWrapper({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return <TeacherRegisterPage />;
}

