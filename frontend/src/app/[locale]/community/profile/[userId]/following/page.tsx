import { cookies } from "next/headers";
import FollowingListClient from "@/components/features/community/FollowingListClient";

export default async function ProfileFollowingPage({
  params,
}: {
  params: Promise<{ userId: string; locale: string }>;
}) {
  const { userId } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
  let initialFollowing = null;

  try {
    const res = await fetch(`${API_BASE}/api/community/users/${userId}/following`, {
      headers: token ? { Cookie: `token=${token}` } : {},
      cache: "no-store",
    });
    if (res.ok) {
      initialFollowing = await res.json();
    }
  } catch (error) {
    console.error("[ProfileFollowingPage] Error:", error);
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <main className="mx-auto max-w-4xl px-4 py-6 lg:py-8 pt-20 lg:pt-28 pb-20 lg:pb-8">
        <FollowingListClient userId={userId} initialFollowing={initialFollowing} />
      </main>
    </div>
  );
}

