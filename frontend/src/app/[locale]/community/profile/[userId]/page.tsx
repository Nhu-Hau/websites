import { cookies } from "next/headers";
import ProfileClient from "@/components/features/community/ProfileClient";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ userId: string; locale: string }>;
}) {
  const { userId } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  // Fetch user profile data
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
  let profileData = null;
  let postsData = null;

  try {
    const [profileRes, postsRes] = await Promise.all([
      fetch(`${API_BASE}/api/community/users/${userId}/profile`, {
        headers: token ? { Cookie: `token=${token}` } : {},
        cache: "no-store",
      }),
      fetch(`${API_BASE}/api/community/users/${userId}/posts?page=1&limit=20`, {
        headers: token ? { Cookie: `token=${token}` } : {},
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
    console.error("[ProfilePage] Error fetching data:", error);
  }

  return (
    <ProfileClient
      userId={userId}
      initialProfile={profileData}
      initialPosts={postsData}
    />
  );
}




