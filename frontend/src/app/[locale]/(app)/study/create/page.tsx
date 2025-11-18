// frontend/src/app/[locale]/study/create/page.tsx
import dynamic from "next/dynamic";

// Dynamic import client component nặng để tối ưu bundle size
const CreateStudyRoomPage = dynamic(() => import("@/components/features/study/CreateStudyRoomPage"));

export default async function CreateStudyRoomWrapper({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return <CreateStudyRoomPage />;
}

