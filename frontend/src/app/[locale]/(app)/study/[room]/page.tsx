// frontend/src/app/[locale]/study/[room]/page.tsx
import dynamicImport from "next/dynamic";
import { PageMotion } from "@/components/layout/PageMotion";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Dynamic import client component nặng để tối ưu bundle size
const StudyRoomPage = dynamicImport(() => import("@/components/features/study/StudyRoomPage"), {
  loading: () => <div className="flex items-center justify-center min-h-screen">Đang tải...</div>,
});

export default function StudyRoomWrapper() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900 transition-colors duration-300">
      <PageMotion>
        <StudyRoomPage />
      </PageMotion>
    </div>
  );
}
