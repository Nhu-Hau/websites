import { Suspense } from "react";
import dynamic from "next/dynamic";
import CreateGroupClient from "@/components/features/community/CreateGroupClient";
import { PageMotion } from "@/components/layout/PageMotion";
import { generateMetadata as genMeta, generateCanonical } from "@/lib/seo";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const path = locale === "vi" ? "/community/groups/create" : `/${locale}/community/groups/create`;
  
  return genMeta({
    title: locale === "vi" ? "Tạo nhóm học - TOEIC PREP" : "Create Study Group - TOEIC PREP",
    description: locale === "vi"
      ? "Tạo nhóm học TOEIC mới để học cùng bạn bè và chia sẻ tài liệu học tập."
      : "Create a new TOEIC study group to learn with friends and share study materials.",
    keywords: ["TOEIC", "study group", "learning community", "TOEIC PREP"],
    canonical: generateCanonical(path, locale),
    ogType: "website",
    noindex: true, // User action pages should not be indexed
  }, locale);
}

export default async function CreateGroupPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <PageMotion className="mx-auto max-w-4xl px-4 py-6 lg:py-8 pt-20 lg:pt-28 pb-20 lg:pb-8">
        <Suspense fallback={<div>Loading...</div>}>
          <CreateGroupClient />
        </Suspense>
      </PageMotion>
    </div>
  );
}


