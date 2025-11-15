// frontend/src/app/[locale]/(app)/vocabulary/page.tsx
import { VocabularyPageClient } from "@/components/features/vocabulary/VocabularyPageClient";

export const metadata = {
  title: "Vocabulary Sets | TOEIC Learning",
  description: "Learn and practice vocabulary with flashcards",
};

export default function VocabularyPage() {
  return <VocabularyPageClient />;
}


