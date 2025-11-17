import { cookies } from "next/headers";
import HashtagClient from "@/components/features/community/HashtagClient";

export default async function HashtagPage({
  params,
}: {
  params: Promise<{ tag: string; locale: string }>;
}) {
  const { tag } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
  let initialData = null;

  try {
    const res = await fetch(`${API_BASE}/api/community/hashtags/${tag}?page=1&limit=20`, {
      headers: token ? { Cookie: `token=${token}` } : {},
      cache: "no-store",
    });
    if (res.ok) {
      initialData = await res.json();
    }
  } catch (error) {
    console.error("[HashtagPage] Error:", error);
  }

  return <HashtagClient tag={tag} initialData={initialData} />;
}


