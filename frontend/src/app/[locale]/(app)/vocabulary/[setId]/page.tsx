// frontend/src/app/[locale]/(app)/vocabulary/[setId]/page.tsx
import { VocabularySetClient } from "@/components/features/vocabulary/VocabularySetClient";

export const metadata = {
  title: "Vocabulary Set | TOEIC Learning",
  description: "Study vocabulary with flashcards and quizzes",
};

export default async function VocabularySetPage({
  params,
}: {
  params: Promise<{ setId: string }>;
}) {
  const { setId } = await params;
  
  return <VocabularySetClient setId={setId} />;
}

