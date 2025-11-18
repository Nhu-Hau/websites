/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  UserMinus,
  Settings,
  Camera,
  X,
  ImageIcon,
  Trash2,
  Trophy,
  Flame,
  Calendar,
  BookOpen,
  Target,
  TrendingUp,
  Award,
  Star,
  Sparkles,
  Sun,
  Moon,
  Zap,
  Crown,
} from "lucide-react";
import { Tooltip } from "react-tooltip";
import { toast } from "@/lib/toast";
import { useAuth } from "@/context/AuthContext";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";
import PostCard from "./PostCard";
import TextWithHighlights from "./TextWithHighlights";
import ImageCropper from "./ImageCropper";
import FollowingModal from "./FollowingModal";
import FollowersModal from "./FollowersModal";
import { useConfirmModal } from "@/components/common/ConfirmModal";
import type { BadgeType } from "@/components/features/dashboard/Badges";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

// Badge config matching Badges.tsx
const BADGE_CONFIG: Record<
  BadgeType,
  {
    name: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    gradient: string;
    textColor: string;
    borderColor: string;
  }
> = {
  streak_7_days: {
    name: "Chuỗi học 7 ngày",
    description: "Học liên tiếp 7 ngày",
    icon: Flame,
    gradient: "from-orange-500 to-red-500",
    textColor: "text-orange-600 dark:text-orange-400",
    borderColor: "border-orange-300/80 dark:border-orange-700/80",
  },
  streak_30_days: {
    name: "Chuỗi học 30 ngày",
    description: "Học liên tiếp 30 ngày",
    icon: Calendar,
    gradient: "from-red-600 to-rose-600",
    textColor: "text-red-600 dark:text-red-400",
    borderColor: "border-red-300/80 dark:border-red-700/80",
  },
  practice_10_tests: {
    name: "Luyện tập chăm chỉ",
    description: "Hoàn thành 10 bài Practice Test",
    icon: BookOpen,
    gradient: "from-blue-600 to-indigo-600",
    textColor: "text-blue-600 dark:text-blue-400",
    borderColor: "border-blue-300/80 dark:border-blue-700/80",
  },
  goal_50_percent: {
    name: "Tiến độ mục tiêu",
    description: "Đạt tiến độ mục tiêu TOEIC trên 50%",
    icon: Target,
    gradient: "from-purple-600 to-violet-600",
    textColor: "text-purple-600 dark:text-purple-400",
    borderColor: "border-purple-300/80 dark:border-purple-700/80",
  },
  part_improvement_20: {
    name: "Cải thiện xuất sắc",
    description: "Cải thiện điểm một Part trên 20 điểm",
    icon: TrendingUp,
    gradient: "from-emerald-600 to-teal-600",
    textColor: "text-emerald-600 dark:text-emerald-400",
    borderColor: "border-emerald-300/80 dark:border-emerald-700/80",
  },
  first_placement: {
    name: "Bắt đầu hành trình",
    description: "Làm bài Placement Test lần đầu",
    icon: Star,
    gradient: "from-yellow-500 to-amber-500",
    textColor: "text-yellow-600 dark:text-yellow-400",
    borderColor: "border-yellow-300/80 dark:border-yellow-700/80",
  },
  first_progress: {
    name: "Kiểm tra tiến độ",
    description: "Làm bài Progress Test lần đầu",
    icon: Award,
    gradient: "from-indigo-600 to-blue-600",
    textColor: "text-indigo-600 dark:text-indigo-400",
    borderColor: "border-indigo-300/80 dark:border-indigo-700/80",
  },
  first_practice: {
    name: "Bước đầu luyện tập",
    description: "Làm bài Practice lần đầu",
    icon: Sparkles,
    gradient: "from-pink-600 to-rose-600",
    textColor: "text-pink-600 dark:text-pink-400",
    borderColor: "border-pink-300/80 dark:border-pink-700/80",
  },
  perfect_score: {
    name: "Điểm tuyệt đối",
    description: "Đạt 100% trong một bài test",
    icon: Trophy,
    gradient: "from-amber-600 to-yellow-600",
    textColor: "text-amber-600 dark:text-amber-400",
    borderColor: "border-amber-300/80 dark:border-amber-700/80",
  },
  early_bird: {
    name: "Chim sớm",
    description: "Học vào buổi sáng sớm (trước 7h)",
    icon: Sun,
    gradient: "from-yellow-500 to-orange-500",
    textColor: "text-yellow-600 dark:text-yellow-400",
    borderColor: "border-yellow-300/80 dark:border-yellow-700/80",
  },
  night_owl: {
    name: "Cú đêm",
    description: "Học vào buổi tối muộn (sau 22h)",
    icon: Moon,
    gradient: "from-indigo-600 to-purple-600",
    textColor: "text-indigo-600 dark:text-indigo-400",
    borderColor: "border-indigo-300/80 dark:border-indigo-700/80",
  },
  marathon: {
    name: "Marathon học tập",
    description: "Hoàn thành 5+ bài test trong một ngày",
    icon: Zap,
    gradient: "from-cyan-600 to-teal-600",
    textColor: "text-cyan-600 dark:text-cyan-400",
    borderColor: "border-cyan-300/80 dark:border-cyan-700/80",
  },
  consistency_king: {
    name: "Vua kiên trì",
    description: "Học đều đặn trong 14 ngày",
    icon: Crown,
    gradient: "from-violet-600 to-purple-600",
    textColor: "text-violet-600 dark:text-violet-400",
    borderColor: "border-violet-300/80 dark:border-violet-700/80",
  },
  practice_50_tests: {
    name: "Chiến binh luyện tập",
    description: "Hoàn thành 50 bài Practice Test",
    icon: Trophy,
    gradient: "from-sky-600 to-indigo-600",
    textColor: "text-sky-600 dark:text-sky-400",
    borderColor: "border-sky-300/80 dark:border-sky-700/80",
  },
  progress_5_tests: {
    name: "Chuyên gia tiến độ",
    description: "Hoàn thành 5 Progress Test",
    icon: Award,
    gradient: "from-emerald-600 to-lime-600",
    textColor: "text-emerald-600 dark:text-emerald-400",
    borderColor: "border-emerald-300/80 dark:border-emerald-700/80",
  },
  goal_100_percent: {
    name: "Chinh phục mục tiêu",
    description: "Đạt 100% mục tiêu TOEIC đã đặt",
    icon: Target,
    gradient: "from-fuchsia-600 to-rose-600",
    textColor: "text-fuchsia-600 dark:text-fuchsia-400",
    borderColor: "border-fuchsia-300/80 dark:border-fuchsia-700/80",
  },
};

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
  const { user: currentUser, refresh } = useAuth();
  const isOwnProfile = currentUser?.id === userId;

  const [profile, setProfile] = React.useState(initialProfile);
  const [posts, setPosts] = React.useState(initialPosts?.items || []);
  const [isFollowing, setIsFollowing] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [followLoading, setFollowLoading] = React.useState(false);
  
  // Image cropper state
  const [showCropper, setShowCropper] = React.useState(false);
  const [cropperImage, setCropperImage] = React.useState<string | null>(null);
  const [cropperType, setCropperType] = React.useState<"avatar" | "cover" | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [showAvatarMenu, setShowAvatarMenu] = React.useState(false);
  const [showFollowingModal, setShowFollowingModal] = React.useState(false);
  const [showFollowersModal, setShowFollowersModal] = React.useState(false);
  const confirmModal = useConfirmModal();

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
        toast.error("Có lỗi xảy ra khi theo dõi");
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra khi theo dõi");
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
        toast.error("Có lỗi xảy ra khi bỏ theo dõi");
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra khi bỏ theo dõi");
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
          <div className="absolute top-4 right-4 flex gap-2">
            {profile.coverImage && (
              <button
                onClick={() => {
                  confirmModal.show({
                    title: "Xóa ảnh bìa?",
                    message: "Bạn có chắc muốn xóa ảnh bìa?",
                    icon: "warning",
                    confirmText: "Xóa",
                    cancelText: "Hủy",
                    confirmColor: "red",
                  }, async () => {
                    try {
                      const res = await fetch(`${API_BASE}/api/community/users/profile`, {
                        method: "PUT",
                        credentials: "include",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ coverImage: null }),
                      });
                      if (!res.ok) throw new Error("Failed to delete cover image");
                      setProfile((p: any) => ({ ...p, coverImage: null }));
                      toast.success("Đã xóa ảnh bìa");
                    } catch (error: any) {
                      toast.error(error?.message || "Lỗi khi xóa ảnh bìa");
                    }
                  });
                }}
                className="p-2 bg-white/90 dark:bg-zinc-900/90 rounded-lg hover:bg-white dark:hover:bg-zinc-800 transition-colors"
              >
                <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
              </button>
            )}
            <label className="p-2 bg-white/90 dark:bg-zinc-900/90 rounded-lg hover:bg-white dark:hover:bg-zinc-800 transition-colors cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    setCropperImage(reader.result as string);
                    setCropperType("cover");
                    setShowCropper(true);
                  };
                  reader.readAsDataURL(file);
                }}
              />
              <Camera className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
            </label>
          </div>
        )}
      </div>

      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row gap-6 mb-8">
        {/* Avatar */}
        <div className="relative -mt-16 sm:-mt-20">
          {isOwnProfile ? (
            <div className="relative">
              <button
                onClick={() => setShowAvatarMenu(!showAvatarMenu)}
                className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold ring-4 ring-white dark:ring-zinc-900 hover:ring-blue-500 dark:hover:ring-blue-400 transition-all cursor-pointer overflow-hidden"
              >
                {profile.picture ? (
                  <img
                    src={profile.picture.startsWith("http") ? profile.picture : `${API_BASE}${profile.picture}`}
                    alt={profile.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  (profile.name?.[0] || "U").toUpperCase()
                )}
              </button>
              {showAvatarMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowAvatarMenu(false)}
                  />
                  <div className="absolute top-full left-0 mt-2 z-50 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-lg py-2 min-w-[180px]">
                    <label className="flex items-center gap-3 px-4 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setShowAvatarMenu(false);
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setCropperImage(reader.result as string);
                            setCropperType("avatar");
                            setShowCropper(true);
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                      <ImageIcon className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                      <span className="text-sm text-zinc-900 dark:text-zinc-100">
                        Đăng lại ảnh
                      </span>
                    </label>
                    {profile.picture && (
                      <button
                        onClick={() => {
                          setShowAvatarMenu(false);
                          confirmModal.show({
                            title: "Xóa ảnh đại diện?",
                            message: "Bạn có chắc muốn xóa ảnh đại diện?",
                            icon: "warning",
                            confirmText: "Xóa",
                            cancelText: "Hủy",
                            confirmColor: "red",
                          }, async () => {
                            try {
                              const res = await fetch(`${API_BASE}/api/auth/avatar`, {
                                method: "DELETE",
                                credentials: "include",
                              });
                              if (!res.ok) throw new Error("Failed to delete avatar");
                              setProfile((p: any) => ({ ...p, picture: undefined }));
                              if (typeof window !== "undefined") {
                                window.dispatchEvent(new CustomEvent("auth:avatar-changed", { detail: undefined }));
                              }
                              refresh();
                              toast.success("Đã xóa avatar");
                            } catch (error: any) {
                              toast.error(error?.message || "Lỗi khi xóa avatar");
                            }
                          });
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          Xóa ảnh
                        </span>
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : (
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
                onClick={() => setShowFollowersModal(true)}
                className="hover:underline"
              >
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {profile.followersCount || 0}
                </span>
                <span className="text-zinc-600 dark:text-zinc-400 ml-1">người theo dõi</span>
              </button>
              <button
                onClick={() => setShowFollowingModal(true)}
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
                Chỉnh sửa hồ sơ
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

      {/* Badges Section */}
      {profile.badges && profile.badges.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 mb-8 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            Huy hiệu ({profile.badges.length})
          </h2>
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {profile.badges.map((badge: any) => {
              const config = BADGE_CONFIG[badge.badgeType as BadgeType];
              if (!config) return null;

              const Icon = config.icon;
              const tooltipId = `badge-${badge._id || badge.badgeType}`;

              let detailedDescription = config.description;
              if (badge.metadata) {
                if (badge.metadata.partKey) {
                  detailedDescription += ` (${badge.metadata.partKey.replace(
                    "part.",
                    "Part "
                  )})`;
                }
                if (badge.metadata.improvement) {
                  detailedDescription += ` (+${badge.metadata.improvement} điểm)`;
                }
                if (badge.metadata.streak) {
                  detailedDescription += ` (${badge.metadata.streak} ngày)`;
                }
                if (badge.metadata.progress !== undefined) {
                  detailedDescription += ` (${Math.round(badge.metadata.progress)}%)`;
                }
              }

              return (
                <React.Fragment key={badge._id || badge.badgeType}>
                  <div
                    data-tooltip-id={tooltipId}
                    data-tooltip-content={detailedDescription}
                    className={`
                      group relative flex h-12 w-12 items-center justify-center overflow-hidden
                      rounded-xl border bg-white/95 text-xs shadow-sm
                      ${config.borderColor}
                      transition-all duration-150
                      hover:-translate-y-0.5 hover:shadow-md
                      dark:bg-zinc-900/95
                      cursor-pointer
                    `}
                  >
                    <div
                      className={`absolute inset-0 rounded-xl bg-gradient-to-br ${config.gradient} opacity-10 group-hover:opacity-20`}
                    />
                    <div className="absolute inset-0 bg-white/40 group-hover:bg-white/20 dark:bg-zinc-950/40 dark:group-hover:bg-zinc-950/20" />
                    <Icon className={`relative z-10 h-6 w-6 ${config.textColor}`} />
                    <div className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full border border-white bg-amber-500 text-[9px] shadow-sm dark:border-zinc-900">
                      <Trophy className="h-2.5 w-2.5 text-white" />
                    </div>
                  </div>
                  <Tooltip
                    id={tooltipId}
                    place="top"
                    positionStrategy="fixed"
                    offset={10}
                    className="!z-50 !max-w-xs !rounded-lg !border !border-zinc-700 !bg-zinc-900/95 !px-3 !py-2 !text-xs !font-medium !text-white shadow-lg"
                  />
                </React.Fragment>
              );
            })}
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

      {/* Confirm Modal */}
      {confirmModal.Modal}

      {/* Image Cropper Modal */}
      {showCropper && cropperImage && cropperType && (
        <ImageCropper
          image={cropperImage}
          aspect={cropperType === "avatar" ? 1 : 16 / 9}
          onCropComplete={async (croppedImage) => {
            setShowCropper(false);
            setUploading(true);
            try {
              if (cropperType === "avatar") {
                // Use same method as Account.tsx - convert to blob with proper crop
                const response = await fetch(croppedImage);
                const blob = await response.blob();
                
                const formData = new FormData();
                formData.append("avatar", blob, "avatar.jpg");
                
                // Upload to /api/auth/avatar (same as Account)
                const uploadRes = await fetch(`${API_BASE}/api/auth/avatar`, {
                  method: "POST",
                  credentials: "include",
                  body: formData,
                });
                
                if (!uploadRes.ok) {
                  const errorData = await uploadRes.json().catch(() => ({}));
                  throw new Error(errorData.message || "Upload avatar thất bại");
                }
                
                const uploadData = await uploadRes.json();
                const newPicture = uploadData.picture || uploadData.url;
                
                // Update profile state
                setProfile((p: any) => ({ ...p, picture: newPicture }));
                // Refresh auth context to update avatar in UserMenu, PostCard, CommentItem
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new CustomEvent("auth:avatar-changed", { detail: newPicture }));
                }
                refresh();
                toast.success("Đã cập nhật ảnh đại diện");
              } else {
                // Cover image - use community upload endpoint
                const response = await fetch(croppedImage);
                const blob = await response.blob();
                
                const formData = new FormData();
                formData.append("file", blob, "cover.jpg");
                
                const uploadRes = await fetch(`${API_BASE}/api/community/upload`, {
                  method: "POST",
                  credentials: "include",
                  body: formData,
                });
                
                if (!uploadRes.ok) throw new Error("Upload failed");
                const uploadData = await uploadRes.json();
                
                // Update profile
                const updateRes = await fetch(`${API_BASE}/api/community/users/profile`, {
                  method: "PUT",
                  credentials: "include",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ coverImage: uploadData.url }),
                });
                
                if (!updateRes.ok) throw new Error("Update failed");
                const data = await updateRes.json();
                setProfile((p: any) => ({ ...p, coverImage: data.coverImage }));
                toast.success("Đã cập nhật ảnh bìa");
              }
            } catch (error: any) {
              console.error("[ProfileClient] Upload error:", error);
              const errorMessage = error?.message || (cropperType === "cover" ? "Lỗi khi cập nhật ảnh bìa" : "Lỗi khi cập nhật ảnh đại diện");
              toast.error(errorMessage);
            } finally {
              setUploading(false);
              setCropperImage(null);
              setCropperType(null);
            }
          }}
          onCancel={() => {
            setShowCropper(false);
            setCropperImage(null);
            setCropperType(null);
          }}
        />
      )}

      {/* Following Modal */}
      <FollowingModal
        userId={userId}
        isOpen={showFollowingModal}
        onClose={() => setShowFollowingModal(false)}
      />

      {/* Followers Modal */}
      <FollowersModal
        userId={userId}
        isOpen={showFollowersModal}
        onClose={() => setShowFollowersModal(false)}
      />
    </div>
  );
}


