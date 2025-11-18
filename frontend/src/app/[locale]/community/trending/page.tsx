import { cookies } from "next/headers";
import TrendingClient from "@/components/features/community/TrendingClient";

export default async function TrendingPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
  let initialPosts = null;

  try {
    const res = await fetch(`${API_BASE}/api/community/posts/trending?period=24h`, {
      headers: token ? { Cookie: `token=${token}` } : {},
      cache: "no-store",
    });
    if (res.ok) {
      initialPosts = await res.json();
    }
  } catch (error) {
    console.error("[TrendingPage] Error:", error);
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <main className="mx-auto max-w-2xl px-4 py-6 lg:py-8 pt-16 lg:pb-8">
        <TrendingClient initialPosts={initialPosts} />
      </main>
    </div>
  );
}




