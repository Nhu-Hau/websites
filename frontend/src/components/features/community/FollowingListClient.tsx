"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";
import { useTranslations } from "next-intl";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

interface FollowingListClientProps {
  userId: string;
  initialFollowing?:
    | {
        items: Array<{
          _id: string;
          name?: string;
          picture?: string;
          bio?: string;
          followersCount?: number;
          isFollowing?: boolean;
        }>;
      }
    | null;
}

export default function FollowingListClient({
  userId,
  initialFollowing,
}: FollowingListClientProps) {
  const router = useRouter();
  const basePrefix = useBasePrefix();
  const t = useTranslations("community.followingList");

  const [following, setFollowing] = React.useState(
    initialFollowing?.items || []
  );
  const [loading, setLoading] = React.useState(false);

  const loadFollowing = React.useCallback(
    async () => {
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
    },
    [userId]
  );

  function Avatar({ url, name }: { url?: string; name?: string }) {
    if (url) {
      const fullUrl = url.startsWith("http") ? url : `${API_BASE}${url}`;
      return (
        <div className="relative h-10 w-10 overflow-hidden rounded-full ring-2 ring-zinc-200 dark:ring-zinc-700">
          <Image
            src={fullUrl}
            alt={name || t("avatarAlt")}
            fill
            className="object-cover"
            sizes="40px"
            unoptimized
            priority={false}
          />
        </div>
      );
    }
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-sky-600 text-sm font-semibold text-white ring-2 ring-zinc-200 dark:ring-zinc-700">
        {(name?.[0] ?? "?").toUpperCase()}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-2">
        <h1 className="mb-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {t("header.title")}
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {t("header.description")}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
        </div>
      ) : following.length > 0 ? (
        <div className="space-y-3">
          {following.map((user) => (
            <div
              key={user._id}
              className="flex cursor-pointer items-center gap-4 rounded-2xl border border-zinc-200/80 bg-white/95 px-4 py-3 shadow-sm ring-1 ring-black/[0.02] transition-all duration-150 hover:bg-zinc-50 dark:border-zinc-800/80 dark:bg-zinc-900/95 dark:hover:bg-zinc-900"
              onClick={() =>
                router.push(`${basePrefix}/community/profile/${user._id}`)
              }
            >
              <div className="flex-shrink-0">
                <Avatar url={user.picture} name={user.name} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-zinc-900 transition-colors hover:text-sky-600 dark:text-zinc-100 dark:hover:text-sky-400">
                  {user.name || t("fallbackUser")}
                </div>
                {user.bio && (
                  <p className="mt-1 truncate text-xs text-zinc-600 dark:text-zinc-400">
                    {user.bio}
                  </p>
                )}
                {user.followersCount !== undefined && (
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                    {t("followerCount", {
                      count: user.followersCount ?? 0,
                    })}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-zinc-200/80 bg-white/95 py-10 text-center shadow-sm ring-1 ring-black/[0.02] dark:border-zinc-800/80 dark:bg-zinc-900/95">
          <p className="mb-2 text-sm font-medium text-zinc-800 dark:text-zinc-100">
            {t("empty.title")}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {t("empty.description")}
          </p>
        </div>
      )}

      {/* Optional reload button (nếu cần, bạn có thể xoá) */}
      {following.length > 0 && (
        <div className="pt-2 text-right">
          <button
            type="button"
            onClick={loadFollowing}
            className="text-xs font-medium text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
            aria-label={t("reload.aria")}
          >
            {t("reload.label")}
          </button>
        </div>
      )}
    </div>
  );
}