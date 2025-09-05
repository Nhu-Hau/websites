// app/[locale]/exam/tests/page.tsx
import TestList from "@/components/common/TestList";

export default function ExamTestsPage({
  params,
}: {
  params: { locale: string };
}) {
  return <TestList mode="practice" locale={params.locale} />;
}
