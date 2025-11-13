// frontend/src/app/[locale]/study/create/page.tsx
import CreateStudyRoomPage from "@/components/features/study/CreateStudyRoomPage";

export default function CreateStudyRoomWrapper() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900 transition-colors duration-300">
      <CreateStudyRoomPage />
    </div>
  );
}

