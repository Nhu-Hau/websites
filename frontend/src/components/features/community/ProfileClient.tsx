/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  UserMinus,
  Settings,
  Camera,
  ImageIcon,
  Trash2,
  Trophy,
  FileText, // ✅ icon cho empty posts
  Star,
  Lock,
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
import { useTranslations } from "next-intl";
import {
  BADGE_CONFIG,
  type BadgeType,
} from "@/components/features/dashboard/Badges";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

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
  const t = useTranslations("community.profile");

  const [profile, setProfile] = React.useState<Profile | null | undefined>(
    initialProfile
  );
  const [posts, setPosts] = React.useState(initialPosts?.items || []);
  const [isFollowing, setIsFollowing] = React.useState(false);
  const [followLoading, setFollowLoading] = React.useState(false);

  // Image cropper state
  const [showCropper, setShowCropper] = React.useState(false);
  const [cropperImage, setCropperImage] = React.useState<string | null>(null);
  const [cropperType, setCropperType] = React.useState<
    "avatar" | "cover" | null
  >(null);
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
        toast.success(t("toast.follow.success"));
      } else {
        toast.error(t("toast.follow.error"));
      }
    } catch (error) {
      toast.error(t("toast.follow.error"));
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
        toast.success(t("toast.unfollow.success"));
      } else {
        toast.error(t("toast.unfollow.error"));
      }
    } catch (error) {
      toast.error(t("toast.unfollow.error"));
    } finally {
      setFollowLoading(false);
    }
  };

  const handlePostChanged = React.useCallback(() => {
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

  // 🔄 Loading hồ sơ – đồng bộ spinner với community
  if (!profile) {
    return (
      <div className="flex items-center justify-center py-12 sm:py-16">
        <div className="flex flex-col items-center gap-3">
          <div className="h-7 w-7 sm:h-8 sm:w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent dark:border-sky-400" />
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {t("loading")}
          </p>
        </div>
      </div>
    );
  }

  const coverUrl =
    profile.coverImage &&
    (profile.coverImage.startsWith("http")
      ? profile.coverImage
      : `${API_BASE}${profile.coverImage}`);

  const avatarUrl =
    profile.picture &&
    (profile.picture.startsWith("http")
      ? profile.picture
      : `${API_BASE}${profile.picture}`);

  const earnedBadges = profile.badges ?? [];
  const totalBadges = Object.keys(BADGE_CONFIG).length;
  const lockedBadgeTypes = React.useMemo(
    () =>
      Object.keys(BADGE_CONFIG).filter(
        (type) => !earnedBadges.some((badge) => badge.badgeType === type)
      ),
    [earnedBadges]
  );

  return (
    <div className="space-y-8">
      {/* Cover + uploading badge */}
      <div className="relative mb-4 overflow-hidden rounded-2xl border border-zinc-200/80 bg-gradient-to-r from-blue-500 via-blue-400 to-blue-600 shadow-sm ring-1 ring-black/[0.04] dark:border-zinc-800/80">
        <div
          className="
    absolute inset-0
    bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.28),transparent_60%)]
    dark:bg-[radial-gradient(circle_at_top,rgba(125,211,252,0.18),transparent_65%)]
  "
        />
        {coverUrl && (
          <div className="relative h-48 xs:h-56 sm:h-64 w-full">
            <Image
              src={coverUrl}
              alt="Cover"
              fill
              className="object-cover opacity-95"
              unoptimized
            />
          </div>
        )}
        {!coverUrl && <div className="h-48 xs:h-56 sm:h-64 w-full" />}

        {uploading && (
          <div className="pointer-events-none absolute left-4 top-4 rounded-full bg-zinc-900/70 px-3 py-1.5 text-xs font-medium text-zinc-50 backdrop-blur">
            {t("uploading")}
          </div>
        )}

        {isOwnProfile && (
          <div className="absolute right-3 top-3 flex gap-2 sm:right-4 sm:top-4">
            {profile.coverImage && (
              <button
                onClick={() => {
                  confirmModal.show(
                    {
                      title: t("cover.removeConfirm.title"),
                      message: t("cover.removeConfirm.message"),
                      icon: "warning",
                      confirmText: t("cover.removeConfirm.confirm"),
                      cancelText: t("cover.removeConfirm.cancel"),
                      confirmColor: "red",
                    },
                    async () => {
                      try {
                        const res = await fetch(
                          `${API_BASE}/api/community/users/profile`,
                          {
                            method: "PUT",
                            credentials: "include",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ coverImage: null }),
                          }
                        );
                        if (!res.ok) {
                          throw new Error("FAILED_DELETE_COVER");
                        }
                        setProfile((p) => (p ? { ...p, coverImage: null } : p));
                        toast.success(t("toast.cover.removeSuccess"));
                      } catch (error: any) {
                        toast.error(
                          error?.message || t("toast.cover.removeError")
                        );
                      }
                    }
                  );
                }}
                className="rounded-lg bg-white/90 p-2 text-red-600 shadow-sm transition-colors hover:bg-red-50 dark:bg-zinc-900/90 dark:text-red-400 dark:hover:bg-red-900/30"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            <label className="flex cursor-pointer items-center justify-center rounded-lg bg-white/90 p-2 text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 dark:bg-zinc-900/90 dark:text-zinc-200 dark:hover:bg-zinc-800">
              <input
                type="file"
                accept="image/*,image/heic,image/heif,.heic,.heif"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  // iOS fix: Reset value to allow selecting same file again
                  e.currentTarget.value = "";
                  if (!file) return;

                  // iOS Safari fix: Check file type by extension if MIME type is missing
                  const fileName = file.name.toLowerCase();
                  const fileExtension = fileName.substring(
                    fileName.lastIndexOf(".")
                  );
                  const isImage =
                    file.type.startsWith("image/") ||
                    [
                      ".jpg",
                      ".jpeg",
                      ".png",
                      ".webp",
                      ".gif",
                      ".heic",
                      ".heif",
                    ].includes(fileExtension);

                  if (!isImage) {
                    toast.error(t("upload.invalidImage"));
                    return;
                  }

                  const reader = new FileReader();
                  reader.onloadend = () => {
                    setCropperImage(reader.result as string);
                    setCropperType("cover");
                    setShowCropper(true);
                  };
                  reader.onerror = () => {
                    toast.error(t("upload.readError"));
                  };
                  reader.readAsDataURL(file);
                }}
              />
              <Camera className="h-4 w-4" />
            </label>
          </div>
        )}
      </div>

      {/* Header: avatar + info + actions */}
      <div className="flex flex-col gap-6 sm:flex-row">
        {/* Avatar */}
        <div className="relative -mt-20 sm:-mt-24">
          {isOwnProfile ? (
            <div className="relative">
              <button
                onClick={() => setShowAvatarMenu((v) => !v)}
                className="relative flex h-28 w-28 xs:h-32 xs:w-32 sm:h-40 sm:w-40 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-blue-400 to-blue-600 text-3xl xs:text-4xl font-bold text-white ring-4 ring-white shadow-xl transition-all hover:ring-blue-300 dark:ring-zinc-950 overflow-hidden"
              >
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={profile.name || t("avatarAlt")}
                    fill
                    className="rounded-full object-cover"
                    unoptimized
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
                    <div className="absolute left-0 top-full z-50 mt-2 min-w-[200px] rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
                    {/* Upload new avatar */}
                    <label className="flex cursor-pointer items-center gap-3 px-4 py-2 text-sm text-zinc-900 transition-colors hover:bg-zinc-100 dark:text-zinc-50 dark:hover:bg-zinc-800">
                      <input
                        type="file"
                        accept="image/*,image/heic,image/heif,.heic,.heif"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          // iOS fix: Reset value to allow selecting same file again
                          e.currentTarget.value = "";
                          if (!file) return;

                          // iOS Safari fix: Check file type by extension if MIME type is missing
                          const fileName = file.name.toLowerCase();
                          const fileExtension = fileName.substring(
                            fileName.lastIndexOf(".")
                          );
                          const isImage =
                            file.type.startsWith("image/") ||
                            [
                              ".jpg",
                              ".jpeg",
                              ".png",
                              ".webp",
                              ".gif",
                              ".heic",
                              ".heif",
                            ].includes(fileExtension);

                          if (!isImage) {
                            toast.error(t("upload.invalidImage"));
                            return;
                          }

                          setShowAvatarMenu(false);
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setCropperImage(reader.result as string);
                            setCropperType("avatar");
                            setShowCropper(true);
                          };
                          reader.onerror = () => {
                            toast.error(t("upload.readError"));
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                      <ImageIcon className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                      <span>{t("avatar.actions.update")}</span>
                    </label>

                    {/* Delete avatar */}
                    {profile.picture && (
                      <button
                        onClick={() => {
                          setShowAvatarMenu(false);
                          confirmModal.show(
                            {
                              title: t("avatar.removeConfirm.title"),
                              message: t("avatar.removeConfirm.message"),
                              icon: "warning",
                              confirmText: t("avatar.removeConfirm.confirm"),
                              cancelText: t("avatar.removeConfirm.cancel"),
                              confirmColor: "red",
                            },
                            async () => {
                              try {
                                const res = await fetch(
                                  `${API_BASE}/api/auth/avatar`,
                                  {
                                    method: "DELETE",
                                    credentials: "include",
                                  }
                                );
                                if (!res.ok)
                                  throw new Error("FAILED_DELETE_AVATAR");
                                setProfile((p) =>
                                  p ? { ...p, picture: undefined } : p
                                );
                                if (typeof window !== "undefined") {
                                  window.dispatchEvent(
                                    new CustomEvent("auth:avatar-changed", {
                                      detail: undefined,
                                    })
                                  );
                                }
                                refresh();
                                toast.success(t("toast.avatar.removeSuccess"));
                              } catch (error: any) {
                                toast.error(
                                  error?.message || t("toast.avatar.removeError")
                                );
                              }
                            }
                          );
                        }}
                        className="flex w-full items-center gap-3 rounded-b-xl px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>{t("avatar.actions.remove")}</span>
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="relative flex h-28 w-28 xs:h-32 xs:w-32 sm:h-40 sm:w-40 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-blue-400 to-blue-600 text-3xl xs:text-4xl font-bold text-white ring-4 ring-white shadow-xl dark:ring-zinc-950">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={profile.name || t("avatarAlt")}
                  fill
                  className="rounded-full object-cover"
                  unoptimized
                />
              ) : (
                (profile.name?.[0] || "U").toUpperCase()
              )}
            </div>
          )}
        </div>

        {/* Info + actions */}
        <div className="flex flex-1 flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="flex-1">
            <h1 className="mb-1 text-xl sm:text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {profile.name || t("fallbackName")}
            </h1>

            {profile.bio && (
              <div className="mb-4 max-w-xl text-sm text-zinc-600 dark:text-zinc-400">
                <TextWithHighlights text={profile.bio} />
              </div>
            )}

            <div className="flex flex-wrap gap-3 text-sm">
              <div>
                <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                  {profile.postsCount || 0}
                </span>
                <span className="ml-1 text-zinc-600 dark:text-zinc-400">
                  {t("stats.posts")}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowFollowersModal(true)}
                className="inline-flex items-center gap-1 text-sm text-zinc-700 transition-colors hover:text-blue-600 dark:text-zinc-300 dark:hover:text-blue-300"
              >
                <span className="font-semibold">
                  {profile.followersCount || 0}
                </span>
                <span className="text-zinc-600 dark:text-zinc-400">
                  {t("stats.followers")}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setShowFollowingModal(true)}
                className="inline-flex items-center gap-1 text-sm text-zinc-700 transition-colors hover:text-blue-600 dark:text-zinc-300 dark:hover:text-blue-300"
              >
                <span className="font-semibold">
                  {profile.followingCount || 0}
                </span>
                <span className="text-zinc-600 dark:text-zinc-400">
                  {t("stats.following")}
                </span>
              </button>
            </div>
          </div>

          <div className="flex items-start gap-2">
            {isOwnProfile ? (
              <button
                onClick={() => router.push(`${basePrefix}/account`)}
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 shadow-sm transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-blue-600 dark:hover:bg-zinc-800"
              >
                <Settings className="h-4 w-4" />
                {t("actions.editProfile")}
              </button>
            ) : (
              <>
                {isFollowing ? (
                  <button
                    onClick={handleUnfollow}
                    disabled={followLoading}
                    className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 shadow-sm transition-all hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-rose-500 dark:hover:bg-rose-950/30"
                  >
                    <UserMinus className="h-4 w-4" />
                    {followLoading
                      ? t("actions.processing")
                      : t("actions.unfollow")}
                  </button>
                ) : (
                  <button
                    onClick={handleFollow}
                    disabled={followLoading}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-500 dark:hover:bg-blue-600"
                  >
                    <UserPlus className="h-4 w-4" />
                    {followLoading
                      ? t("actions.processing")
                      : t("actions.follow")}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* TOEIC Goal */}
      {profile.toeicGoal && (
        <div className="rounded-2xl border border-zinc-200/80 bg-white/95 p-5 shadow-sm ring-1 ring-black/[0.02] dark:border-zinc-800/80 dark:bg-zinc-900/95">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {t("goal.title")}
          </h2>
          <div className="flex flex-wrap items-center gap-6 text-sm">
            {profile.toeicGoal.startScore && (
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {t("goal.current")}
                </p>
                <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                  {profile.toeicGoal.startScore}
                </p>
              </div>
            )}
            {profile.toeicGoal.targetScore && (
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {t("goal.target")}
                </p>
                <p className="text-2xl font-semibold text-blue-600 dark:text-blue-400">
                  {profile.toeicGoal.targetScore}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Badges */}
      <div className="rounded-2xl border border-zinc-200/80 bg-white/95 p-4 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/95 sm:p-5">
        {/* Header */}
        <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {t("badges.title")}
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {t("badges.progress", {
                unlocked: earnedBadges.length,
                total: totalBadges,
              })}
            </p>
          </div>

          {earnedBadges.length > 0 && (
            <div className="mt-1 inline-flex items-center gap-1 self-start rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1 text-[11px] font-semibold text-zinc-700 shadow-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 sm:mt-0 sm:self-auto">
              <Star className="h-3.5 w-3.5" />
              <span>{t("badges.pill", { count: earnedBadges.length })}</span>
            </div>
          )}
        </div>

        {/* Body */}
        {earnedBadges.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-sky-50 text-sky-500 dark:bg-sky-900/30 dark:text-sky-300 sm:h-16 sm:w-16">
              <Trophy className="h-7 w-7 sm:h-8 sm:w-8" />
            </div>
            <h3 className="mb-1 text-base font-semibold text-zinc-900 dark:text-zinc-50">
              {t("badges.emptyTitle")}
            </h3>
            <p className="mb-1 max-w-sm text-sm text-zinc-600 dark:text-zinc-400">
              {t("badges.emptyDescription")}
            </p>
          </div>
        ) : (
          <>
            {/* Earned badges */}
            <div className="mb-5 flex flex-wrap gap-2.5 sm:gap-3">
              {earnedBadges.map((badge) => {
                const config = BADGE_CONFIG[badge.badgeType as BadgeType];
                if (!config) return null;

                const Icon = config.icon;
                const tooltipId = `badge-${
                  badge._id || badge.badgeType
                }-profile`;

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
                    detailedDescription += ` (${Math.round(
                      badge.metadata.progress
                    )}%)`;
                  }
                }

                return (
                  <React.Fragment key={badge._id || badge.badgeType}>
                    <div
                      data-tooltip-id={tooltipId}
                      data-tooltip-content={detailedDescription}
                      className={`
                        group relative flex h-10 w-10 items-center justify-center overflow-hidden
                        rounded-2xl bg-gradient-to-br ${config.gradient}
                        text-xs shadow-md shadow-slate-900/10
                        transition-all duration-150
                        hover:-translate-y-0.5 hover:shadow-lg
                        cursor-pointer
                        sm:h-12 sm:w-12 md:h-14 md:w-14
                      `}
                    >
                      <div className="absolute inset-0 rounded-2xl ring-1 ring-white/40" />
                      <Icon className="relative z-10 h-6 w-6 text-white drop-shadow-sm" />
                    </div>
                    <Tooltip
                      id={tooltipId}
                      place="top"
                      positionStrategy="fixed"
                      offset={10}
                      className="!z-50 !max-w-xs !rounded-lg !border !border-slate-700 !bg-slate-900/95 !px-3 !py-2 !text-xs !font-medium !text-white shadow-lg"
                    />
                  </React.Fragment>
                );
              })}
            </div>

            {/* Locked badges */}
            {lockedBadgeTypes.length > 0 && (
              <div className="border-t border-zinc-200/80 pt-4 dark:border-zinc-800/80">
                <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  {t("badges.lockedTitle")}
                </p>
                <div className="flex flex-wrap gap-2.5 sm:gap-3">
                  {lockedBadgeTypes.map((type) => {
                    const config = BADGE_CONFIG[type as BadgeType];
                    if (!config) return null;

                    const Icon = config.icon;
                    const tooltipId = `badge-locked-${type}-profile`;

                    return (
                      <React.Fragment key={type}>
                        <div
                          data-tooltip-id={tooltipId}
                          data-tooltip-content={t("badges.lockedTooltip", {
                            description: config.description,
                          })}
                          className={`
                            group relative flex h-10 w-10 items-center justify-center overflow-hidden
                            rounded-2xl bg-gradient-to-br from-slate-200 to-slate-400
                            text-xs shadow-md shadow-slate-900/10
                            transition-all duration-150
                            hover:-translate-y-0.5 hover:shadow-lg
                            cursor-not-allowed
                            sm:h-12 sm:w-12 md:h-14 md:w-14
                          `}
                        >
                          <div className="absolute inset-0 rounded-2xl ring-1 ring-white/40 opacity-70" />
                          <Icon className="relative z-10 h-6 w-6 text-slate-600 dark:text-slate-300" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Lock className="h-4 w-4 text-slate-700/85 dark:text-slate-200/90 drop-shadow-sm" />
                          </div>
                        </div>
                        <Tooltip
                          id={tooltipId}
                          place="top"
                          positionStrategy="fixed"
                          offset={10}
                          className="!z-50 !max-w-xs !rounded-lg !border !border-slate-700 !bg-slate-900/95 !px-3 !py-2 !text-xs !font-medium !text-white shadow-lg"
                        />
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Posts */}
      <div className="space-y-4">
        <h2 className="truncate text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {t("posts.title")}
        </h2>
        {posts.length > 0 ? (
          <div className="space-y-4">
            {posts.map((post: any) => (
              <PostCard
                key={post._id}
                post={post}
                apiBase={API_BASE}
                onChanged={handlePostChanged}
                currentUserId={currentUser?.id}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200/80 bg-white/95 px-4 sm:px-6 py-12 sm:py-16 text-center shadow-sm ring-1 ring-black/[0.02] dark:border-zinc-800/80 dark:bg-zinc-900/95">
            <div className="mb-4 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-sky-50 text-sky-500 dark:bg-sky-900/30 dark:text-sky-300">
              <FileText className="h-7 w-7 sm:h-8 sm:w-8" />
            </div>
            <h3 className="mb-1 text-base font-semibold text-zinc-900 dark:text-zinc-50">
              {t("posts.emptyTitle")}
            </h3>
            <p className="max-w-sm text-sm text-zinc-600 dark:text-zinc-400">
              {t("posts.emptyDescription")}
            </p>
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
                // iOS fix: Convert dataURL to blob properly
                const response = await fetch(croppedImage);
                const blob = await response.blob();

                // Ensure proper MIME type for iOS
                const finalBlob =
                  blob.type === "image/png" || blob.type === "image/jpeg"
                    ? blob
                    : new Blob([blob], { type: "image/jpeg" });

                const formData = new FormData();
                // iOS fix: Explicitly set filename with .jpg extension
                formData.append("avatar", finalBlob, "avatar.jpg");

                const uploadRes = await fetch(`${API_BASE}/api/auth/avatar`, {
                  method: "POST",
                  credentials: "include",
                  // iOS fix: Don't set Content-Type header, let browser set it with boundary
                  body: formData,
                });

                if (!uploadRes.ok) {
                  const errorData = await uploadRes.json().catch(() => ({}));
                  throw new Error(
                    errorData.message || t("toast.avatar.updateError")
                  );
                }

                const uploadData = await uploadRes.json();
                const newPicture = uploadData.picture || uploadData.url;

                setProfile((p) => (p ? { ...p, picture: newPicture } : p));

                if (typeof window !== "undefined") {
                  window.dispatchEvent(
                    new CustomEvent("auth:avatar-changed", {
                      detail: newPicture,
                    })
                  );
                }
                refresh();
                toast.success(t("toast.avatar.updateSuccess"));
              } else {
                // iOS fix: Convert dataURL to blob properly
                const response = await fetch(croppedImage);
                const blob = await response.blob();

                // Ensure proper MIME type for iOS
                const finalBlob =
                  blob.type === "image/png" || blob.type === "image/jpeg"
                    ? blob
                    : new Blob([blob], { type: "image/jpeg" });

                const formData = new FormData();
                // iOS fix: Explicitly set filename with .jpg extension
                formData.append("file", finalBlob, "cover.jpg");

                const uploadRes = await fetch(
                  `${API_BASE}/api/community/upload`,
                  {
                    method: "POST",
                    credentials: "include",
                    // iOS fix: Don't set Content-Type header, let browser set it with boundary
                    body: formData,
                  }
                );

                if (!uploadRes.ok)
                  throw new Error(t("toast.cover.updateError"));
                const uploadData = await uploadRes.json();

                const updateRes = await fetch(
                  `${API_BASE}/api/community/users/profile`,
                  {
                    method: "PUT",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ coverImage: uploadData.url }),
                  }
                );

                if (!updateRes.ok)
                  throw new Error(t("toast.cover.updateError"));
                const data = await updateRes.json();
                setProfile((p) =>
                  p ? { ...p, coverImage: data.coverImage } : p
                );
                toast.success(t("toast.cover.updateSuccess"));
              }
            } catch (error: any) {
              console.error("[ProfileClient] Upload error:", error);
              const errorMessage =
                error?.message ||
                (cropperType === "cover"
                  ? t("toast.cover.updateError")
                  : t("toast.avatar.updateError"));
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
