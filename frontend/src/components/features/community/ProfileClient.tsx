/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  UserMinus,
  Settings,
  Camera,
  ImageIcon,
  Trash2,
  Trophy,
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
import { BADGE_CONFIG, type BadgeType } from "@/components/features/dashboard/Badges";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

interface Profile {
  _id?: string;
  name?: string;
  bio?: string;
  picture?: string;
  coverImage?: string | null;
  postsCount?: number;
  followersCount?: number;
  followingCount?: number;
  toeicGoal?: {
    startScore?: number;
    targetScore?: number;
  };
  badges?: Array<{
    _id: string;
    badgeType: string;
    metadata?: {
      partKey?: string;
      improvement?: number;
      streak?: number;
      progress?: number;
    };
  }>;
}

interface ProfileClientProps {
  userId: string;
  initialProfile?: Profile | null;
  initialPosts?: {
    items?: unknown[];
  } | null;
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

  const [profile, setProfile] = React.useState<Profile | null | undefined>(initialProfile);
  const [posts, setPosts] = React.useState(initialPosts?.items || []);
  const [isFollowing, setIsFollowing] = React.useState(false);
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
        setProfile((p) => {
          if (!p) return p;
          return {
          ...p,
            followersCount: (p.followersCount || 0) + 1,
          };
        });
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
        setProfile((p) => {
          if (!p) return p;
          return {
          ...p,
            followersCount: Math.max(0, (p.followersCount || 0) - 1),
          };
        });
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
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <p className="text-zinc-600 dark:text-zinc-400">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
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
                      setProfile((p) => {
                        if (!p) return p;
                        return { ...p, coverImage: null };
                      });
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
                              setProfile((p) => {
                                if (!p) return p;
                                return { ...p, picture: undefined };
                              });
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
            {profile.badges.map((badge) => {
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
                setProfile((p) => {
                  if (!p) return p;
                  return { ...p, picture: newPicture };
                });
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
                setProfile((p) => {
                  if (!p) return p;
                  return { ...p, coverImage: data.coverImage };
                });
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


