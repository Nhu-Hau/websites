import { cookies } from "next/headers";
import FollowingListClient from "@/components/features/community/FollowingListClient";

export default async function ProfileFollowingPage({
  params,
}: {
  params: { userId: string };
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
  let initialFollowing = null;

  try {
    const res = await fetch(`${API_BASE}/api/community/users/${params.userId}/following`, {
      headers: token ? { Cookie: `token=${token}` } : {},
      cache: "no-store",
    });
    if (res.ok) {
      initialFollowing = await res.json();
    }
  } catch (error) {
    console.error("[ProfileFollowingPage] Error:", error);
  }

  return <FollowingListClient userId={params.userId} initialFollowing={initialFollowing} />;
}

