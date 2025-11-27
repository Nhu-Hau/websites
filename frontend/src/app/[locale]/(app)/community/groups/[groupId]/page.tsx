import { Suspense } from "react";
import dynamic from "next/dynamic";
import GroupDetailClient from "@/components/features/community/GroupDetailClient";
import { PageMotion } from "@/components/layout/PageMotion";
import { generateMetadata as genMeta, generateCanonical } from "@/lib/seo";

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ groupId: string; locale: string }> 
}) {
  const { groupId, locale } = await params;
  const path = locale === "vi" ? `/community/groups/${groupId}` : `/${locale}/community/groups/${groupId}`;
  
  return genMeta({
    title: locale === "vi" ? "Nhóm học TOEIC - TOEIC PREP" : "TOEIC Study Group - TOEIC PREP",
    description: locale === "vi"
      ? "Tham gia nhóm học TOEIC, học cùng bạn bè và chia sẻ tài liệu học tập."
      : "Join TOEIC study group, learn with friends and share study materials.",
    keywords: ["TOEIC", "study group", "learning community", "TOEIC PREP"],
    canonical: generateCanonical(path, locale),
    ogType: "website",
    noindex: true, // User-generated content pages should not be indexed
  }, locale);
}

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ groupId: string; locale: string }>;
}) {
  const { groupId } = await params;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <PageMotion className="mx-auto max-w-4xl px-4 py-6 lg:py-8 pt-20 lg:pt-28 pb-20 lg:pb-8">
        <Suspense fallback={<div>Đang tải...</div>}>
          <GroupDetailClient groupId={groupId} />
        </Suspense>
      </PageMotion>
    </div>
  );
}


