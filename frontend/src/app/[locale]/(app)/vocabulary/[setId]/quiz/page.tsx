// frontend/src/app/[locale]/(app)/vocabulary/[setId]/quiz/page.tsx
import { QuizPageClient } from "@/components/features/vocabulary/QuizPageClient";

export const metadata = {
  title: "Quiz Vocabulary | TOEIC Learning",
  description: "Take a quiz on vocabulary",
};

export default async function QuizPage({
  params,
}: {
  params: Promise<{ setId: string; locale: string }>;
}) {
  const { setId } = await params;
  
  return <QuizPageClient setId={setId} />;
}


