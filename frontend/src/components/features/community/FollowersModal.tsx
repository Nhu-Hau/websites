"use client";

import React from "react";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

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
  
  const [followers, setFollowers] = React.useState(initialFollowers?.items || []);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (isOpen && !initialFollowers) {
      loadFollowers();
    } else if (isOpen && initialFollowers) {
      setFollowers(initialFollowers.items || []);
    }
  }, [isOpen, userId]);

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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 w-full max-w-md max-h-[80vh] flex flex-col shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            Người theo dõi
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
            </div>
          ) : followers.length > 0 ? (
            <div className="space-y-3">
              {followers.map((user) => (
                <div
                  key={user._id}
                  className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 flex items-center gap-4 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  onClick={() => {
                    onClose();
                    router.push(`${basePrefix}/community/profile/${user._id}`);
                  }}
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
                Chưa có người theo dõi
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

