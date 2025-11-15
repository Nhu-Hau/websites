// frontend/src/app/[locale]/(app)/news/[id]/page.tsx
import { NewsDetailClient } from "@/components/features/news/NewsDetailClient";

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  return <NewsDetailClient newsId={id} />;
}


