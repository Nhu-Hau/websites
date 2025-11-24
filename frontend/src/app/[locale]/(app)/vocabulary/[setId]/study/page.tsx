// frontend/src/app/[locale]/(app)/vocabulary/[setId]/study/page.tsx
import { StudyPageClient } from "@/components/features/vocabulary/StudyPageClient";

export const metadata = {
  title: "Study Vocabulary | TOEIC Learning",
  description: "Study vocabulary with flashcards",
};

export default async function StudyPage({
  params,
}: {
  params: Promise<{ setId: string; locale: string }>;
}) {
  const { setId } = await params;
  
  return <StudyPageClient setId={setId} />;
}







