import { cookies } from "next/headers";
import ProfileClient from "@/components/features/community/ProfileClient";
import { PageMotion } from "@/components/layout/PageMotion";
import { generateMetadata as genMeta, generateCanonical } from "@/lib/seo";
import { getTranslations } from "next-intl/server";
import { logger } from "@/lib/utils/logger";

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ userId: string; locale: string }> 
}) {
  const { userId, locale } = await params;
  const path = locale === "vi" ? `/community/profile/${userId}` : `/${locale}/community/profile/${userId}`;
  
  return genMeta({
    title: locale === "vi" ? "Hồ sơ người dùng - TOEIC PREP" : "User Profile - TOEIC PREP",
    description: locale === "vi"
      ? "Xem hồ sơ và bài viết của người dùng trong cộng đồng TOEIC PREP."
      : "View user profile and posts in TOEIC PREP community.",
    keywords: ["TOEIC", "profile", "user", "community", "TOEIC PREP"],
    canonical: generateCanonical(path, locale),
    ogType: "profile",
    noindex: true, // User profile pages should not be indexed
  }, locale);
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ userId: string; locale: string }>;
}) {
  const { userId } = await params;
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");
  const authHeaders: Record<string, string> = cookieHeader ? { Cookie: cookieHeader } : {};

  // Fetch user profile data
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
  let profileData = null;
  let postsData = null;

  try {
    const [profileRes, postsRes] = await Promise.all([
      fetch(`${API_BASE}/api/community/users/${userId}/profile`, {
        headers: authHeaders,
        cache: "no-store",
      }),
      fetch(`${API_BASE}/api/community/users/${userId}/posts?page=1&limit=20`, {
        headers: authHeaders,
        cache: "no-store",
      }),
    ]);

    if (profileRes.ok) {
      profileData = await profileRes.json();
    }
    if (postsRes.ok) {
      postsData = await postsRes.json();
    }
  } catch (error) {
    logger.error("[ProfilePage] Error fetching data:", error);
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <PageMotion className="mx-auto max-w-4xl px-4 py-6 lg:py-8 pt-20 lg:pt-28 pb-20 lg:pb-8">
        <ProfileClient
          userId={userId}
          initialProfile={profileData}
          initialPosts={postsData}
        />
      </PageMotion>
    </div>
  );
}





