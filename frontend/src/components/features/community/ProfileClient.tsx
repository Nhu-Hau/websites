/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { UserPlus, UserMinus, Settings, Camera, X, ImageIcon, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "@/lib/toast";
import { useAuth } from "@/context/AuthContext";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";
import PostCard from "./PostCard";
import TextWithHighlights from "./TextWithHighlights";
import ImageCropper from "./ImageCropper";
import { useConfirmModal } from "@/components/common/ConfirmModal";

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
  const { user: currentUser, refresh } = useAuth();
  const isOwnProfile = currentUser?.id === userId;
  const t = useTranslations("community.profile");

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
        toast.success(t("followSuccess"));
      } else {
        toast.error(t("followError"));
      }
    } catch (error) {
      toast.error(t("followErrorGeneral"));
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
        toast.success(t("unfollowSuccess"));
      } else {
        toast.error(t("unfollowError"));
      }
    } catch (error) {
      toast.error(t("unfollowErrorGeneral"));
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
          <p className="text-zinc-600 dark:text-zinc-400">{t("loading")}</p>
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
          <label className="absolute top-4 right-4 p-2 bg-white/90 dark:bg-zinc-900/90 rounded-lg hover:bg-white dark:hover:bg-zinc-800 transition-colors cursor-pointer">
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
                        {t("changeAvatar") || "Đăng lại ảnh"}
                      </span>
                    </label>
                    {profile.picture && (
                      <button
                        onClick={() => {
                          setShowAvatarMenu(false);
                          confirmModal.show({
                            title: t("deleteAvatarConfirm") || "Xóa ảnh đại diện?",
                            message: t("deleteAvatarMessage") || "Bạn có chắc muốn xóa ảnh đại diện?",
                            icon: "warning",
                            confirmText: t("delete") || "Xóa",
                            cancelText: t("cancel") || "Hủy",
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
                              toast.success(t("deleteAvatarSuccess") || "Đã xóa avatar");
                            } catch (error: any) {
                              toast.error(error?.message || t("deleteAvatarError") || "Lỗi khi xóa avatar");
                            }
                          });
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          {t("deleteAvatar") || "Xóa ảnh"}
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
                <span className="text-zinc-600 dark:text-zinc-400 ml-1">{t("postsCount")}</span>
              </div>
              <button
                onClick={() => router.push(`${basePrefix}/community/profile/${userId}/followers`)}
                className="hover:underline"
              >
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {profile.followersCount || 0}
                </span>
                <span className="text-zinc-600 dark:text-zinc-400 ml-1">{t("followers")}</span>
              </button>
              <button
                onClick={() => router.push(`${basePrefix}/community/profile/${userId}/following`)}
                className="hover:underline"
              >
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {profile.followingCount || 0}
                </span>
                <span className="text-zinc-600 dark:text-zinc-400 ml-1">{t("following")}</span>
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
                {t("editProfile")}
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
                    {followLoading ? t("processing") : t("unfollow")}
                  </button>
                ) : (
                  <button
                    onClick={handleFollow}
                    disabled={followLoading}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <UserPlus className="h-4 w-4" />
                    {followLoading ? t("processing") : t("follow")}
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
            {t("toeicGoal")}
          </h2>
          <div className="flex items-center gap-4">
            {profile.toeicGoal.startScore && (
              <div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{t("currentScore")}</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {profile.toeicGoal.startScore}
                </p>
              </div>
            )}
            {profile.toeicGoal.targetScore && (
              <div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{t("targetScore")}</p>
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
          {t("posts")}
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
            {t("noPosts")}
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
                toast.success(t("uploadAvatar"));
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
                toast.success(t("uploadCover"));
              }
            } catch (error: any) {
              console.error("[ProfileClient] Upload error:", error);
              const errorMessage = error?.message || (cropperType === "cover" ? t("uploadCover") : t("uploadAvatar"));
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
    </div>
  );
}


