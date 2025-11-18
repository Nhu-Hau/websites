"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Users, UserPlus, UserMinus, Image as ImageIcon, ArrowLeft } from "lucide-react";
import PostCard from "@/components/features/community/PostCard";
import Pagination from "@/components/features/community/Pagination";
import NewPostForm from "@/components/features/community/NewPostForm";
import type { CommunityPost } from "@/types/community.types";
import { toast } from "@/lib/toast";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";
import { useAuth } from "@/context/AuthContext";
import { getSocket } from "@/lib/socket";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
const PAGE_SIZE = 10;

type StudyGroup = {
  _id: string;
  name: string;
  description?: string;
  coverImage?: string;
  adminId: string | { _id: string; name?: string; picture?: string };
  members: Array<string | { _id: string; name?: string; picture?: string }>;
  membersCount: number;
  postsCount?: number;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
};

interface GroupDetailClientProps {
  groupId: string;
}

export default function GroupDetailClient({ groupId }: GroupDetailClientProps) {
  const router = useRouter();
  const basePrefix = useBasePrefix();
  const { user } = useAuth();
  const t = useTranslations("community.groups");

  const [group, setGroup] = React.useState<StudyGroup | null>(null);
  const [posts, setPosts] = React.useState<CommunityPost[]>([]);
  const [page, setPage] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [joining, setJoining] = React.useState(false);
  const [leaving, setLeaving] = React.useState(false);
  const [isMember, setIsMember] = React.useState(false);
  const [isAdmin, setIsAdmin] = React.useState(false);

  const currentUserId = user?.id;

  const loadGroup = React.useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/api/community/groups/${groupId}`, {
        credentials: "include",
      });
      if (!r.ok) {
        if (r.status === 404) {
          toast.error(t("notFound") || "Group not found");
          router.push(`${basePrefix}/community/groups`);
          return;
        }
        throw new Error("Failed to load group");
      }
      const data = await r.json();
      setGroup(data);
      
      // Check if user is member or admin
      const adminId = typeof data.adminId === "object" ? data.adminId._id : data.adminId;
      const memberIds = (data.members || []).map((m: any) => 
        typeof m === "object" ? m._id : m
      );
      const userIsAdmin = !!currentUserId && String(adminId) === String(currentUserId);
      const userIsMember = !!currentUserId && (userIsAdmin || memberIds.some((id: string) => String(id) === String(currentUserId)));
      setIsAdmin(userIsAdmin);
      setIsMember(userIsMember);
    } catch (e) {
      toast.error(t("error") || "Failed to load group");
      console.error("[loadGroup] ERROR", e);
    }
  }, [groupId, currentUserId, basePrefix, router, t]);

  const loadPosts = React.useCallback(async (p = 1) => {
    try {
      const r = await fetch(
        `${API_BASE}/api/community/groups/${groupId}/posts?page=${p}&limit=${PAGE_SIZE}`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );
      if (!r.ok) throw new Error("Failed to load posts");
      const j = await r.json();
      setTotal(j.total || 0);
      setPosts(j.items ?? []);
    } catch (e) {
      toast.error(t("error") || "Failed to load posts");
      console.error("[loadPosts] ERROR", e);
    } finally {
      setLoading(false);
    }
  }, [groupId, t]);

  React.useEffect(() => {
    loadGroup();
  }, [loadGroup]);

  React.useEffect(() => {
    loadPosts(page);
  }, [loadPosts, page]);

  // Listen to socket events for real-time updates
  React.useEffect(() => {
    const s = getSocket();

    const onNewPost = (p: any) => {
      // Only reload if the new post belongs to this group
      if (p.groupId === groupId) {
        loadPosts(page);
        if (group) {
          setGroup({ ...group, postsCount: (group.postsCount || 0) + 1 });
        }
      }
    };

    const onPostDeleted = (p: { postId: string }) => {
      setPosts((prev) => prev.filter((x) => x._id !== p.postId));
      setTotal((t) => Math.max(0, t - 1));
      if (group) {
        setGroup({ ...group, postsCount: Math.max(0, (group.postsCount || 0) - 1) });
      }
    };

    const onLike = (p: {
      postId: string;
      likesCount?: number;
      liked?: boolean;
      userId?: string;
    }) => {
      // Don't update if this is the current user's own like action
      // (they already updated it optimistically)
      if (p.userId && currentUserId && p.userId === currentUserId) return;
      setPosts((prev) =>
        prev.map((post) => {
          if (post._id !== p.postId) return post;
          const safeLikes =
            typeof p.likesCount === "number"
              ? p.likesCount
              : Number(post.likesCount) || 0;
          // Only update likesCount from socket events, not liked field
          // (liked field is user-specific and should come from API)
          return { ...post, likesCount: safeLikes };
        })
      );
    };

    const onComment = (p: { postId: string }) => {
      setPosts((prev) =>
        prev.map((x) =>
          x._id === p.postId
            ? { ...x, commentsCount: (x.commentsCount || 0) + 1 }
            : x
        )
      );
    };

    const onCommentDeleted = (p: { postId: string; commentId: string }) => {
      setPosts((prev) =>
        prev.map((x) =>
          x._id === p.postId
            ? { ...x, commentsCount: Math.max(0, (x.commentsCount || 0) - 1) }
            : x
        )
      );
    };

    s.on("community:new-post", onNewPost);
    s.on("community:post-deleted", onPostDeleted);
    s.on("community:like-updated", onLike);
    s.on("community:new-comment", onComment);
    s.on("community:comment-deleted", onCommentDeleted);

    return () => {
      s.off("community:new-post", onNewPost);
      s.off("community:post-deleted", onPostDeleted);
      s.off("community:like-updated", onLike);
      s.off("community:new-comment", onComment);
      s.off("community:comment-deleted", onCommentDeleted);
    };
  }, [groupId, page, group, currentUserId, loadPosts]);

  const handleJoin = async () => {
    if (!currentUserId) {
      toast.error(t("loginRequired") || "Please login");
      return;
    }
    setJoining(true);
    try {
      const r = await fetch(`${API_BASE}/api/community/groups/${groupId}/join`, {
        method: "POST",
        credentials: "include",
      });
      if (!r.ok) {
        const data = await r.json();
        throw new Error(data.message || "Failed to join group");
      }
      const data = await r.json();
      setGroup(data);
      setIsMember(true);
      toast.success(t("joined") || "Joined group successfully");
      loadGroup(); // Reload to update member count
    } catch (e: any) {
      toast.error(e.message || t("joinError") || "Failed to join group");
      console.error("[handleJoin] ERROR", e);
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!currentUserId) {
      toast.error(t("loginRequired") || "Please login");
      return;
    }
    setLeaving(true);
    try {
      const r = await fetch(`${API_BASE}/api/community/groups/${groupId}/leave`, {
        method: "POST",
        credentials: "include",
      });
      if (!r.ok) {
        const data = await r.json();
        throw new Error(data.message || "Failed to leave group");
      }
      const data = await r.json();
      setGroup(data);
      setIsMember(false);
      toast.success(t("left") || "Left group successfully");
      loadGroup(); // Reload to update member count
    } catch (e: any) {
      toast.error(e.message || t("leaveError") || "Failed to leave group");
      console.error("[handleLeave] ERROR", e);
    } finally {
      setLeaving(false);
    }
  };

  const handlePostCreated = () => {
    loadPosts(page);
    if (group) {
      setGroup({ ...group, postsCount: (group.postsCount || 0) + 1 });
    }
  };

  const handlePostChanged = React.useCallback(() => {
    loadPosts(page);
  }, [loadPosts, page]);

  const onChangePage = React.useCallback((p: number) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  if (!group) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  const admin = typeof group.adminId === "object" ? group.adminId : null;
  const coverImage = group.coverImage?.startsWith("http")
    ? group.coverImage
    : group.coverImage
    ? `${API_BASE}${group.coverImage}`
    : null;

  const postsList = posts.map((p) => (
    <PostCard
      key={p._id}
      post={p}
      apiBase={API_BASE}
      onChanged={handlePostChanged}
      currentUserId={currentUserId}
    />
  ));

  const showBottomPager = total > PAGE_SIZE;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        href={`${basePrefix}/community/groups`}
        className="inline-flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("back") || "Back to Groups"}
      </Link>

      {/* Group Header */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {/* Cover Image */}
        {coverImage ? (
          <div className="w-full h-48 md:h-64 bg-gradient-to-br from-blue-500 to-purple-600">
            <img
              src={coverImage}
              alt={group.name}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-full h-48 md:h-64 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Users className="h-20 w-20 text-white opacity-50" />
          </div>
        )}

        {/* Group Info */}
        <div className="p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                {group.name}
              </h1>
              {group.description && (
                <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                  {group.description}
                </p>
              )}
              <div className="flex items-center gap-6 text-sm text-zinc-600 dark:text-zinc-400">
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {group.membersCount || 0} {t("members")}
                </span>
                {group.postsCount !== undefined && (
                  <span>
                    {group.postsCount} {t("posts") || "bài viết"}
                  </span>
                )}
                {admin && (
                  <span>
                    {t("admin") || "Quản trị viên"}: {admin.name || "Không xác định"}
                  </span>
                )}
              </div>
            </div>

            {/* Join/Leave Button */}
            {currentUserId && !isAdmin && (
              <div>
                {isMember ? (
                  <button
                    onClick={handleLeave}
                    disabled={leaving}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {leaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-700 dark:border-red-400 border-t-transparent" />
                        {t("leaving") || "Leaving..."}
                      </>
                    ) : (
                      <>
                        <UserMinus className="h-4 w-4" />
                        {t("leave") || "Leave Group"}
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleJoin}
                    disabled={joining}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {joining ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        {t("joining") || "Joining..."}
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4" />
                        {t("join") || "Join Group"}
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Post Form (only for members) */}
      {isMember && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            {t("createPost") || "Create Post"}
          </h2>
          <NewPostForm groupId={groupId} onSuccess={handlePostCreated} />
        </div>
      )}

      {/* Posts List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
          </div>
        ) : postsList.length > 0 ? (
          postsList
        ) : (
          <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <p className="text-zinc-600 dark:text-zinc-400">
              {t("noPosts") || "No posts yet"}
            </p>
            {isMember && (
              <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-2">
                {t("beFirst") || "Be the first to post!"}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {showBottomPager && (
        <div className="flex justify-center pt-4">
          <Pagination
            page={page}
            total={total}
            pageSize={PAGE_SIZE}
            onChange={onChangePage}
          />
        </div>
      )}
    </div>
  );
}

