"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

interface FollowingListClientProps {
  userId: string;
  initialFollowing?: {
    items: Array<{
      _id: string;
      name?: string;
      picture?: string;
      bio?: string;
      followersCount?: number;
      isFollowing?: boolean;
    }>;
  } | null;
}

export default function FollowingListClient({
  userId,
  initialFollowing,
}: FollowingListClientProps) {
  const router = useRouter();
  const basePrefix = useBasePrefix();
  
  const [following, setFollowing] = React.useState(initialFollowing?.items || []);
  const [loading, setLoading] = React.useState(false);

  const loadFollowing = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/community/users/${userId}/following`,
        { credentials: "include" }
      );
      if (res.ok) {
        const data = await res.json();
        setFollowing(data.items || []);
      }
    } catch (error) {
      console.error("[loadFollowing] ERROR", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  function Avatar({ url, name }: { url?: string; name?: string }) {
    if (url) {
      const fullUrl = url.startsWith("http") ? url : `${API_BASE}${url}`;
      return (
        <img
          src={fullUrl}
          alt={name || "avatar"}
          className="h-12 w-12 rounded-full object-cover ring-2 ring-zinc-200 dark:ring-zinc-700"
        />
      );
    }
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white text-lg font-semibold ring-2 ring-zinc-200 dark:ring-zinc-700">
        {(name?.[0] ?? "?").toUpperCase()}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
          Đang theo dõi
        </h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
        </div>
      ) : following.length > 0 ? (
        <div className="space-y-3">
          {following.map((user) => (
            <div
              key={user._id}
              className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 flex items-center gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
              onClick={() => router.push(`${basePrefix}/community/profile/${user._id}`)}
            >
              <div className="flex-shrink-0">
                <Avatar url={user.picture} name={user.name} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  {user.name || "User"}
                </div>
                {user.bio && (
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 truncate">
                    {user.bio}
                  </p>
                )}
                {user.followersCount !== undefined && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                    {user.followersCount} người theo dõi
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-zinc-600 dark:text-zinc-400">
            Chưa theo dõi ai
          </p>
        </div>
      )}
    </div>
  );
}

