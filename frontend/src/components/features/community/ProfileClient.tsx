/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { UserPlus, UserMinus, Settings, Camera } from "lucide-react";
import { toast } from "@/lib/toast";
import { useAuth } from "@/context/AuthContext";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";
import PostCard from "./PostCard";
import TextWithHighlights from "./TextWithHighlights";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

interface ProfileClientProps {
  userId: string;
  initialProfile?: unknown;
  initialPosts?: unknown;
}

export default function ProfileClient({
  userId,
  initialProfile,
  initialPosts,
}: ProfileClientProps) {
  const router = useRouter();
  const basePrefix = useBasePrefix();
  const { user: currentUser } = useAuth();
  const isOwnProfile = currentUser?.id === userId;

  const [profile, setProfile] = React.useState(initialProfile);
  const [posts, setPosts] = React.useState(initialPosts?.items || []);
  const [isFollowing, setIsFollowing] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [followLoading, setFollowLoading] = React.useState(false);

  React.useEffect(() => {
    if (currentUser?.id && userId !== currentUser.id) {
      checkFollowStatus();
    }
  }, [currentUser?.id, userId]);

  const checkFollowStatus = async () => {
    try {
      const res = await fetch(
        `${API_BASE}/api/community/users/${userId}/follow-status`,
        { credentials: "include" }
      );
      if (res.ok) {
        const data = await res.json();
        setIsFollowing(data.isFollowing);
      }
    } catch (error) {
      console.error("[checkFollowStatus] ERROR", error);
    }
  };

  const handleFollow = async () => {
    if (followLoading) return;
    setFollowLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/community/users/${userId}/follow`,
        {
          method: "POST",
          credentials: "include",
        }
      );
      if (res.ok) {
        setIsFollowing(true);
        setProfile((p: any) => ({
          ...p,
          followersCount: (p?.followersCount || 0) + 1,
        }));
        toast.success("Đã theo dõi");
      } else {
        toast.error("Không thể theo dõi");
      }
    } catch (error) {
      toast.error("Lỗi khi theo dõi");
    } finally {
      setFollowLoading(false);
    }
  };

  const handleUnfollow = async () => {
    if (followLoading) return;
    setFollowLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/community/users/${userId}/follow`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      if (res.ok) {
        setIsFollowing(false);
        setProfile((p: any) => ({
          ...p,
          followersCount: Math.max(0, (p?.followersCount || 0) - 1),
        }));
        toast.success("Đã bỏ theo dõi");
      } else {
        toast.error("Không thể bỏ theo dõi");
      }
    } catch (error) {
      toast.error("Lỗi khi bỏ theo dõi");
    } finally {
      setFollowLoading(false);
    }
  };

  const handlePostChanged = React.useCallback(() => {
    // Reload posts
    fetch(`${API_BASE}/api/community/users/${userId}/posts?page=1&limit=20`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.items) {
          setPosts(data.items);
        }
      })
      .catch(console.error);
  }, [userId]);

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-zinc-600 dark:text-zinc-400">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pt-20">
      {/* Cover Image */}
      <div className="relative h-64 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mb-4 overflow-hidden">
        {profile.coverImage ? (
          <img
            src={profile.coverImage.startsWith("http") ? profile.coverImage : `${API_BASE}${profile.coverImage}`}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        ) : null}
        {isOwnProfile && (
          <button className="absolute top-4 right-4 p-2 bg-white/90 dark:bg-zinc-900/90 rounded-lg hover:bg-white dark:hover:bg-zinc-800 transition-colors">
            <Camera className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
          </button>
        )}
      </div>

      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row gap-6 mb-8">
        {/* Avatar */}
        <div className="relative -mt-16 sm:-mt-20">
          <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold ring-4 ring-white dark:ring-zinc-900">
            {profile.picture ? (
              <img
                src={profile.picture.startsWith("http") ? profile.picture : `${API_BASE}${profile.picture}`}
                alt={profile.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              (profile.name?.[0] || "U").toUpperCase()
            )}
          </div>
          {isOwnProfile && (
            <button className="absolute bottom-0 right-0 p-2 bg-white dark:bg-zinc-900 rounded-full border-2 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
              <Camera className="h-4 w-4 text-zinc-700 dark:text-zinc-300" />
            </button>
          )}
        </div>

        {/* Profile Info */}
        <div className="flex-1 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
              {profile.name || "User"}
            </h1>
            {profile.bio && (
              <div className="text-zinc-600 dark:text-zinc-400 mb-4">
                <TextWithHighlights text={profile.bio} />
              </div>
            )}
            
            {/* Stats */}
            <div className="flex gap-6 text-sm">
              <div>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {profile.postsCount || 0}
                </span>
                <span className="text-zinc-600 dark:text-zinc-400 ml-1">bài viết</span>
              </div>
              <button
                onClick={() => router.push(`${basePrefix}/community/profile/${userId}/followers`)}
                className="hover:underline"
              >
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {profile.followersCount || 0}
                </span>
                <span className="text-zinc-600 dark:text-zinc-400 ml-1">người theo dõi</span>
              </button>
              <button
                onClick={() => router.push(`${basePrefix}/community/profile/${userId}/following`)}
                className="hover:underline"
              >
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {profile.followingCount || 0}
                </span>
                <span className="text-zinc-600 dark:text-zinc-400 ml-1">đang theo dõi</span>
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {isOwnProfile ? (
              <button
                onClick={() => router.push(`${basePrefix}/account`)}
                className="px-4 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Chỉnh sửa
              </button>
            ) : (
              <>
                {isFollowing ? (
                  <button
                    onClick={handleUnfollow}
                    disabled={followLoading}
                    className="px-4 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <UserMinus className="h-4 w-4" />
                    {followLoading ? "Đang xử lý..." : "Bỏ theo dõi"}
                  </button>
                ) : (
                  <button
                    onClick={handleFollow}
                    disabled={followLoading}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <UserPlus className="h-4 w-4" />
                    {followLoading ? "Đang xử lý..." : "Theo dõi"}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* TOEIC Info */}
      {profile.toeicGoal && (
        <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            Mục tiêu TOEIC
          </h2>
          <div className="flex items-center gap-4">
            {profile.toeicGoal.startScore && (
              <div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Điểm hiện tại</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {profile.toeicGoal.startScore}
                </p>
              </div>
            )}
            {profile.toeicGoal.targetScore && (
              <div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Mục tiêu</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {profile.toeicGoal.targetScore}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Posts */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Bài viết
        </h2>
        {posts.length > 0 ? (
          posts.map((post: any) => (
            <PostCard
              key={post._id}
              post={post}
              apiBase={API_BASE}
              onChanged={handlePostChanged}
              currentUserId={currentUser?.id}
            />
          ))
        ) : (
          <div className="text-center py-12 text-zinc-600 dark:text-zinc-400">
            Chưa có bài viết nào
          </div>
        )}
      </div>
    </div>
  );
}


