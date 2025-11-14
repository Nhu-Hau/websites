// frontend/src/app/[locale]/study/create/page.tsx
import dynamic from "next/dynamic";
import PageWrapper from "@/components/layout/PageWrapper";

// Dynamic import client component nặng để tối ưu bundle size
const CreateStudyRoomPage = dynamic(() => import("@/components/features/study/CreateStudyRoomPage"));

export default function CreateStudyRoomWrapper() {
  return (
    <PageWrapper>
      <CreateStudyRoomPage />
    </PageWrapper>
  );
}

