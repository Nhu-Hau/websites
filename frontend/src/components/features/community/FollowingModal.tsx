"use client";

import React from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

interface FollowingModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
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

export default function FollowingModal({
  userId,
  isOpen,
  onClose,
  initialFollowing,
}: FollowingModalProps) {
  const router = useRouter();
  const basePrefix = useBasePrefix();

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

  React.useEffect(() => {
    if (isOpen && !initialFollowing) {
      loadFollowing();
    } else if (isOpen && initialFollowing) {
      setFollowing(initialFollowing.items || []);
    }
  }, [isOpen, userId, initialFollowing, loadFollowing]);

  function Avatar({ url, name }: { url?: string; name?: string }) {
    if (url) {
      const fullUrl = url.startsWith("http") ? url : `${API_BASE}${url}`;
      return (
        <div className="relative h-10 w-10 overflow-hidden rounded-full ring-2 ring-zinc-200 dark:ring-zinc-700">
          <Image
            src={fullUrl}
            alt={name || "Ảnh đại diện"}
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
            Đang theo dõi
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            aria-label="Đóng danh sách đang theo dõi"
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
          ) : following.length > 0 ? (
            <div className="space-y-3">
              {following.map((user) => (
                <div
                  key={user._id}
                  className="flex cursor-pointer items-center gap-4 rounded-2xl border border-zinc-200/80 bg-zinc-50/90 px-4 py-3 text-sm shadow-sm transition-all duration-150 hover:bg-zinc-100 dark:border-zinc-800/80 dark:bg-zinc-900/80 dark:hover:bg-zinc-900"
                  onClick={() => {
                    onClose();
                    router.push(
                      `${basePrefix}/community/profile/${user._id}`
                    );
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
                Chưa theo dõi ai
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Hãy khám phá cộng đồng và bắt đầu theo dõi những người dùng
                khác.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}