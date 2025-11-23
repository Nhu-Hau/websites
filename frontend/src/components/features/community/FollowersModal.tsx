"use client";

import React from "react";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

interface FollowersModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  initialFollowers?: {
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

export default function FollowersModal({
  userId,
  isOpen,
  onClose,
  initialFollowers,
}: FollowersModalProps) {
  const router = useRouter();
  const basePrefix = useBasePrefix();

  const [followers, setFollowers] = React.useState(
    initialFollowers?.items || []
  );
  const [loading, setLoading] = React.useState(false);

  const loadFollowers = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/community/users/${userId}/followers`,
        { credentials: "include" }
      );
      if (res.ok) {
        const data = await res.json();
        setFollowers(data.items || []);
      }
    } catch (error) {
      console.error("[loadFollowers] ERROR", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  React.useEffect(() => {
    if (isOpen && !initialFollowers) {
      loadFollowers();
    } else if (isOpen && initialFollowers) {
      setFollowers(initialFollowers.items || []);
    }
  }, [isOpen, userId, initialFollowers, loadFollowers]);

  function Avatar({ url, name }: { url?: string; name?: string }) {
    if (url) {
      const fullUrl = url.startsWith("http") ? url : `${API_BASE}${url}`;
      return (
        <img
          src={fullUrl}
          alt={name || "avatar"}
          className="h-10 w-10 rounded-full object-cover ring-2 ring-zinc-200 dark:ring-zinc-700"
        />
      );
    }
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-sky-600 text-sm font-semibold text-white ring-2 ring-zinc-200 dark:ring-zinc-700">
        {(name?.[0] ?? "?").toUpperCase()}
      </div>
    );
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3 py-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[80vh] w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 shadow-xl ring-1 ring-black/5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 px-4 py-3">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Người theo dõi
          </h2>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full flex items-center justify-center text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:text-zinc-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
            </div>
          ) : followers.length > 0 ? (
            <div className="space-y-3">
              {followers.map((user) => (
                <div
                  key={user._id}
                  className="flex cursor-pointer items-center gap-4 rounded-2xl border border-zinc-200/80 bg-zinc-50/90 px-4 py-3 text-sm shadow-sm transition-all duration-150 hover:bg-zinc-100 dark:border-zinc-800/80 dark:bg-zinc-900/80 dark:hover:bg-zinc-900"
                  onClick={() => {
                    onClose();
                    router.push(`${basePrefix}/community/profile/${user._id}`);
                  }}
                >
                  <div className="flex-shrink-0">
                    <Avatar url={user.picture} name={user.name} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-zinc-900 transition-colors hover:text-sky-600 dark:text-zinc-100 dark:hover:text-sky-400">
                      {user.name || "User"}
                    </div>
                    {user.bio && (
                      <p className="mt-1 truncate text-xs text-zinc-600 dark:text-zinc-400">
                        {user.bio}
                      </p>
                    )}
                    {user.followersCount !== undefined && (
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                        {user.followersCount} người theo dõi
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center">
              <p className="mb-2 text-sm font-medium text-zinc-800 dark:text-zinc-100">
                Chưa có người theo dõi
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Khi người khác theo dõi bạn, họ sẽ xuất hiện ở đây.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

