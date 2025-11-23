import { cookies } from "next/headers";
import FollowingClient from "@/components/features/community/FollowingClient";
import { PageMotion } from "@/components/layout/PageMotion";

export default async function FollowingPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
  let initialPosts = null;

  try {
    const res = await fetch(`${API_BASE}/api/community/posts/following?page=1&limit=20`, {
      headers: token ? { Cookie: `token=${token}` } : {},
      cache: "no-store",
    });
    if (res.ok) {
      initialPosts = await res.json();
    }
  } catch (error) {
    console.error("[FollowingPage] Error:", error);
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <PageMotion className="mx-auto max-w-4xl px-4 py-6 lg:py-8 pt-20 lg:pt-28 pb-20 lg:pb-8">
        <FollowingClient initialPosts={initialPosts} />
      </PageMotion>
    </div>
  );
}





