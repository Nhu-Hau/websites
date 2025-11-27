import GroupsClient from "@/components/features/community/GroupsClient";
import { PageMotion } from "@/components/layout/PageMotion";
import { generateMetadata as genMeta, generateCanonical } from "@/lib/seo";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const path = locale === "vi" ? "/community/groups" : `/${locale}/community/groups`;
  
  return genMeta({
    title: locale === "vi" ? "Nhóm học TOEIC - TOEIC PREP" : "TOEIC Study Groups - TOEIC PREP",
    description: locale === "vi"
      ? "Tham gia các nhóm học TOEIC, học cùng bạn bè và chia sẻ tài liệu học tập."
      : "Join TOEIC study groups, learn with friends and share study materials.",
    keywords: ["TOEIC", "study groups", "learning community", "TOEIC PREP"],
    canonical: generateCanonical(path, locale),
    ogType: "website",
  }, locale);
}

export default function GroupsPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <PageMotion className="mx-auto max-w-4xl px-4 py-6 lg:py-8 pt-20 lg:pt-28 pb-20 lg:pb-8">
        <GroupsClient />
      </PageMotion>
    </div>
  );
}




