// frontend/src/app/[locale]/study/[room]/page.tsx
import dynamicImport from "next/dynamic";

// Dynamic import client component nặng để tối ưu bundle size
const StudyRoomPage = dynamicImport(() => import("@/components/features/study/StudyRoomPage"));

export default function StudyRoomWrapper() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900 transition-colors duration-300">
      <StudyRoomPage />
    </div>
  );
}

export const dynamic = 'force-dynamic';
